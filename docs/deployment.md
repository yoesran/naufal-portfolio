# Deployment

> How the three apps go live. The mechanism (env-aware `entry`, `VITE_PARTY_HOST`) is in [mf-platform.md](./mf-platform.md); this is the actual hosting setup and the traps hit doing it. Traps are also captured in [gotchas.md](./gotchas.md).

## Where everything lives

Everything is on **Cloudflare**, free tier, four independent origins (independent deployability is the whole point of the MF split):

| Piece          | What it is                   | Host                       | Origin                                    |
| -------------- | ---------------------------- | -------------------------- | ----------------------------------------- |
| `naufal-host`  | React static build           | Cloudflare Pages           | `https://naufal-host.pages.dev`           |
| `naufal-lab`   | Svelte static build (remote) | Cloudflare Pages           | `https://naufal-lab.pages.dev`            |
| `naufal-party` | PartyKit WebSocket server    | PartyKit (managed runtime) | `wss://naufal-party.yoesran.partykit.dev` |
| `naufal-blog`  | Next.js static export        | Cloudflare Pages           | `https://naufal-blog.pages.dev`           |

PartyKit is Cloudflare-owned (acquired Oct 2025); `partykit deploy` targets the managed `*.partykit.dev` runtime, free for this scale. A custom domain (`naufal.dev` etc.) is a later, no-rework swap — see the end.

> **`naufal-blog`** is a fourth, fully standalone Cloudflare Pages project (`naufal-blog.pages.dev` → eventually `blog.naufal.dev`). Unlike the federated three it has **no env coupling** to anything — no `VITE_*` vars, no CORS, no order dependency — so it builds and deploys entirely on its own (`next build` → `out/` → `wrangler pages deploy`). The rest of this doc (URL wiring, CORS, build-mode separation) is about the federated three; the blog only needs the deploy step below.

## How the URLs are wired

Each origin needs to know the others. The couplings are all **build-time env vars** (so changing one means a rebuild + redeploy of that app):

- **Host → remote**: `VITE_LAB_URL` builds the federation `entry` (`${VITE_LAB_URL}/remoteEntry.js`) in [`naufal-host/vite.config.ts`](../naufal-host/vite.config.ts).
- **Host → party**: `VITE_PARTY_HOST` flows through `import.meta.env` to `PresenceBlock`, which passes it to the embedded remote as `opts.host`.
- **Standalone remote → party**: the lab's _own_ page ([`App.svelte`](../naufal-lab/src/App.svelte)) reads `VITE_PARTY_HOST` and passes it to `<Presence>`. The embedded path gets the host from `opts`; the standalone page must supply its own, or it falls back to the component's `127.0.0.1:1999` default — see [gotchas.md](./gotchas.md) #22.

Prod values live in committed `.env.production` files (both apps). These are `VITE_`-prefixed → public by design → safe to commit (no secrets). Local dev values live in gitignored `.env.local`; Vite ranks `.env.production` above `.env.local` in a production build, so the dev values never leak into a deploy.

## CORS — the remote serves cross-origin assets

The host fetches `remoteEntry.js` and its lazy chunks from a _different origin_, so the remote must send CORS headers. Cloudflare Pages reads [`naufal-lab/public/_headers`](../naufal-lab/public/_headers) (copied to `dist/_headers` at build):

```text
/*
  Access-Control-Allow-Origin: *

/remoteEntry.js
  Cache-Control: no-store, must-revalidate
```

- **`*` is intentional and safe**: these are public, non-credentialed static assets. Tighten to the exact host origin later if desired.
- **ACAO is set once** (the broad rule). Pages _merges_ headers from every matching rule, so repeating ACAO in the `/remoteEntry.js` block produces an invalid `Access-Control-Allow-Origin: *, *` that browsers reject — see [gotchas.md](./gotchas.md) #21.
- **`remoteEntry.js` is `no-store`**: it's the federation manifest. Caching it would stop an already-loaded host from picking up a redeployed remote.

## Build-mode separation (the remote is always a prod build)

The host gets a clean dev/prod split for free: `vite` (dev, `serve`) loads `.env.local`; `vite build` (prod) loads `.env.production`. The remote can't — it's _always_ built (`vite build --watch` for dev, `vite build` for deploy), so both would be production mode and pull prod env. Fix: the dev watcher runs `--mode development` (see `dev:mf` in [`naufal-lab/package.json`](../naufal-lab/package.json)), so local dev keeps the standalone page on the local party while the deploy build (`vite build`, production) uses `.env.production`. See [gotchas.md](./gotchas.md) #22.

Also in the host config: `dts.consumeTypes` is on **only in `serve`** (dev). The prod build doesn't need the remote's `.d.ts` for the runtime bundle, and consuming them would couple the build to the remote being reachable.

## Deploy procedure (direct upload via Wrangler)

No GitHub connection yet — deploys are direct uploads of locally-built output. For the **federated three, order matters: party → remote → host**, because the host bakes the other two URLs in at build time. The **blog is independent** — deploy it anytime.

```powershell
# 0. one-time: create a Cloudflare account; `npx wrangler login` (Cloudflare OAuth)

# 1. party — PartyKit logs in via GitHub; prints the *.partykit.dev URL
cd naufal-party
npx partykit deploy

# 2. remote — production build (loads .env.production), then upload dist/
cd naufal-lab
npx vite build
npx wrangler pages deploy dist --project-name=naufal-lab     # production branch: main

# 3. host — only after .env.production has the real remote + party URLs
cd naufal-host
npm run build
npx wrangler pages deploy dist --project-name=naufal-host     # production branch: main

# blog — independent; deploy anytime. Note it outputs `out/` (not `dist/`).
cd naufal-blog
npm run build
npx wrangler pages deploy out --project-name=naufal-blog --branch=main   # production branch: main
```

The `naufal-blog` Pages project was created once with `wrangler pages project create naufal-blog --production-branch=main`; deploying with `--branch=main` (the production branch) publishes to the apex `naufal-blog.pages.dev` rather than a preview subdomain. Add `--commit-dirty=true` to silence the uncommitted-working-tree warning.

**Redeploys** are just the relevant `vite build` + `wrangler pages deploy` again — each app independently. Because `remoteEntry.js` is `no-store`, a redeployed remote is picked up immediately by an already-loaded host. Remember env vars are **baked at build time**: after editing a `.env.production`, you must rebuild before redeploying or the old value ships (this is exactly the "stale bundle still points at localhost" symptom).

## Verifying live

Open `https://naufal-host.pages.dev`, then DevTools → Network:

- `remoteEntry.js` loads from `naufal-lab.pages.dev`, status 200, with a single `access-control-allow-origin: *` header.
- The microfrontend block's Counter mounts; the presence block's socket (WS tab) connects to `wss://naufal-party.yoesran.partykit.dev`.
- The standalone remote at `https://naufal-lab.pages.dev` connects its presence to the same party.
- Kill/000 the remote and the host stays up with per-block fallbacks (the resilience layer — [mf-platform.md](./mf-platform.md)).

## Custom domain later (no rework)

When `naufal.dev` is registered (Cloudflare Registrar, ~$10–12/yr for `.dev`): add the domain to each Pages project in the dashboard, bind the party to a subdomain, then update `VITE_LAB_URL` + `VITE_PARTY_HOST` in the two `.env.production` files, the CORS origin in `_headers` (if it was tightened off `*`), and the absolute `og:url` / `og:image` (and `twitter:image`) URLs in [`naufal-host/index.html`](../naufal-host/index.html). Otherwise no code changes.

**Cross-site links to update too** (they're hardcoded URLs, not env vars):

- Host → blog: [`naufal-host/src/components/Footer.tsx`](../naufal-host/src/components/Footer.tsx) (the `blog` link) and the header `blog`/`cv`/`work` nav in [`naufal-host/src/components/Header.tsx`](../naufal-host/src/components/Header.tsx) (currently `href: '#'` placeholders) — point at the blog and its `/cv` page.
- Blog → host: the `live portfolio` link in [`naufal-blog/src/app/page.tsx`](../naufal-blog/src/app/page.tsx) and the description in [`layout.tsx`](../naufal-blog/src/app/layout.tsx).
- Blog's own canonical origin: [`SITE_URL`](../naufal-blog/src/lib/site.ts) (feeds metadata, sitemap, robots).

> **Known dead links (host → blog):** the blog is now live at `https://naufal-blog.pages.dev`, but the host still points at it wrong — the footer `blog` link targets the unregistered `https://blog.naufal.dev`, and the header nav (`work`/`blog`/`cv`) is still `href: '#'`. Until the custom domain exists, point both at the live Pages URL (`https://naufal-blog.pages.dev`, and `/cv` for the CV item) — that's the same convention the blog already uses for its own `SITE_URL` and its host link (`naufal-host.pages.dev`). This needs a host rebuild + redeploy.
