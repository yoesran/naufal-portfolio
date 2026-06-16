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

> **`naufal-blog`** is a fourth, fully standalone Cloudflare Pages project (`naufal-blog.pages.dev` → eventually `blog.naufal.dev`). Unlike the federated three it has **no cross-origin env coupling** — no `VITE_LAB_URL`/party wiring, no CORS, no order dependency — so it builds and deploys entirely on its own (`next build` → `out/` → `wrangler pages deploy`). Its only env input is the optional `NEXT_PUBLIC_CF_BEACON_TOKEN` (see Analytics below). The rest of this doc (URL wiring, CORS, build-mode separation) is about the federated three; the blog only needs the deploy step below. The blog is locale-routed (`/en`, `/id`) and ships a [`public/_redirects`](../naufal-blog/public/_redirects) so the Cloudflare edge sends the locale-less section paths `/cv` → `/en/cv` and `/posts` → `/en/posts` to the default locale (external links like the host's CV nav stay locale-agnostic). The apex `/` is **not** an edge redirect — it serves [`app/page.tsx`](../naufal-blog/src/app/page.tsx), which detects the visitor's browser language client-side and routes to `/en` or `/id` (the edge can't read Accept-Language on a static export; no middleware either — see [gotchas.md](./gotchas.md) #25).

## How the URLs are wired

Each origin needs to know the others. The couplings are all **build-time env vars** (so changing one means a rebuild + redeploy of that app):

- **Host → remote**: `VITE_LAB_URL` builds the federation `entry` (`${VITE_LAB_URL}/remoteEntry.js`) in [`naufal-host/vite.config.ts`](../naufal-host/vite.config.ts).
- **Host → party**: `VITE_PARTY_HOST` flows through `import.meta.env` to `PresenceOverlay`, which passes it to the embedded remote as `opts.host`.
- **Standalone remote → party**: the lab's _own_ page ([`App.svelte`](../naufal-lab/src/App.svelte)) reads `VITE_PARTY_HOST` and passes it to `<Presence>`. The embedded path gets the host from `opts`; the standalone page must supply its own, or it falls back to the component's `127.0.0.1:1999` default — see [gotchas.md](./gotchas.md) #22.

Prod values live in committed `.env.production` files (both apps). These are `VITE_`-prefixed → public by design → safe to commit (no secrets). Local dev needs no env file — `VITE_LAB_URL`/`VITE_PARTY_HOST` default to `127.0.0.1` in code; to override (e.g. a different port), add a gitignored `.env.local`, which Vite ranks below `.env.production` in a prod build so dev values never leak into a deploy.

## Analytics & the canonical site URL

Both public-facing sites use **Cloudflare Web Analytics** — privacy-first (no cookies → no consent banner), free, and injected only when a token is configured (so local dev and forks ship no beacon). Get one token **per site** from the CF dashboard → Web Analytics → add site → copy the token, then:

- **Host**: set `VITE_CF_BEACON_TOKEN` in [`naufal-host/.env.production`](../naufal-host/.env.production). The [`vite.config.ts`](../naufal-host/vite.config.ts) `cf-web-analytics` plugin injects the beacon at build; an empty value injects nothing.
- **Blog**: set `NEXT_PUBLIC_CF_BEACON_TOKEN` in `naufal-blog/.env.production` (gitignored — copy [`.env.example`](../naufal-blog/.env.example)). [`app/layout.tsx`](../naufal-blog/src/app/layout.tsx) renders the beacon only when it's set.

Both sites also have an env-driven **canonical origin** so the custom-domain switch is a one-line flip, not a code edit:

- **Host**: `VITE_SITE_URL` (host `.env.production`) feeds the OG/Twitter share tags — `index.html` ships a `__SITE_URL__` placeholder the build replaces.
- **Blog**: `NEXT_PUBLIC_SITE_URL` ([`src/lib/site.ts`](../naufal-blog/src/lib/site.ts), unset → the Pages name) feeds metadata (canonical/OG/`metadataBase`), `sitemap.xml`, `robots.txt`, and hreflang.

The **cross-site links** are env-driven too, so the migration is purely env on both sides: the host points at the blog via `VITE_BLOG_URL` ([`src/lib/links.ts`](../naufal-host/src/lib/links.ts), used by the header/footer/experience links), and the blog points back at the portfolio via `NEXT_PUBLIC_HOST_URL` ([`src/lib/site.ts`](../naufal-blog/src/lib/site.ts)). Each defaults to the other's Pages name.

When the custom domains land, flip all four (host `VITE_SITE_URL` + `VITE_BLOG_URL`; blog `NEXT_PUBLIC_SITE_URL` + `NEXT_PUBLIC_HOST_URL`) to `https://naufal.dev` / `https://blog.naufal.dev` — see _Custom domain later_ below.

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

The host gets a clean dev/prod split for free: `vite` (dev, `serve`) uses the code defaults (or a gitignored `.env.local` if present); `vite build` (prod) loads `.env.production`. The remote can't — it's _always_ built (`vite build --watch` for dev, `vite build` for deploy), so both would be production mode and pull prod env. Fix: the dev watcher runs `--mode development` (see `dev:mf` in [`naufal-lab/package.json`](../naufal-lab/package.json)), so local dev keeps the standalone page on the local party while the deploy build (`vite build`, production) uses `.env.production`. See [gotchas.md](./gotchas.md) #22.

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

## Quality dashboard

The host's `// quality` block surfaces the host's own test suites — real **Vitest** (unit + RTL component) and **Playwright** (e2e, with video) runs — each linking to its full HTML report. Published **manually** (no CI, no secret — `wrangler` is already OAuth-authed locally) to a dedicated Pages project:

- [`naufal-host/scripts/reports.mjs`](../naufal-host/scripts/reports.mjs) (`npm run reports`) runs both suites with their HTML reporters (Playwright with `PW_MEDIA=1` → video + full trace), distils the counts into `health.json`, and assembles `.reports/` — `vitest/`, `playwright/`, `health.json`, a `_headers` (CORS for `health.json`), and a landing page. It also refreshes `public/health.json`, the host's dev seed.
- `npm run reports:deploy` direct-uploads `.reports/` to the **`naufal-reports`** Pages project → `https://naufal-reports.pages.dev` (`/vitest/`, `/playwright/`, `/health.json`).
- The host reads the summary via `VITE_REPORTS_URL` (host `.env.production`; unset in dev → the block reads the same-origin `/health.json` seed, while the report links still point at the live site).

To refresh after a meaningful change: `cd naufal-host && npm run reports && npm run reports:deploy`. The Pages project was created once with `wrangler pages project create naufal-reports --production-branch=main`.

## Verifying live

Open `https://naufal-host.pages.dev`, then DevTools → Network:

- `remoteEntry.js` loads from `naufal-lab.pages.dev`, status 200, with a single `access-control-allow-origin: *` header.
- The live-remote block's `SpringToy` mounts on **Run**; toggling presence on opens the overlay's socket (WS tab) to `wss://naufal-party.yoesran.partykit.dev`.
- The standalone remote at `https://naufal-lab.pages.dev` connects its presence to the same party.
- Kill/000 the remote and the host stays up with per-block fallbacks (the resilience layer — [mf-platform.md](./mf-platform.md)).

## Custom domain later (no rework)

When `naufal.dev` is registered (Cloudflare Registrar, ~$10–12/yr for `.dev`): add the domain to each Pages project in the dashboard, bind the party to a subdomain, then update `VITE_LAB_URL` + `VITE_PARTY_HOST` in the two `.env.production` files, the CORS origin in `_headers` (if it was tightened off `*`), and the absolute `og:url` / `og:image` (and `twitter:image`) URLs in [`naufal-host/index.html`](../naufal-host/index.html). Otherwise no code changes.

**Cross-site links to update too** (they're hardcoded URLs, not env vars):

- Host → blog: [`BLOG_URL`](../naufal-host/src/lib/links.ts) in `naufal-host/src/lib/links.ts` — the single source feeding the footer `blog` link and the header `blog`/`cv` nav (the CV item is `${BLOG_URL}/cv`). Swap that one constant for the custom domain.
- Blog → host: the `live portfolio` link in [`naufal-blog/src/app/[lang]/page.tsx`](../naufal-blog/src/app/[lang]/page.tsx) and the description in [`[lang]/layout.tsx`](../naufal-blog/src/app/[lang]/layout.tsx).
- Blog's own canonical origin: [`SITE_URL`](../naufal-blog/src/lib/site.ts) (feeds metadata, sitemap, robots).

> **Cross-link note:** the host links are wired to the live Pages URL via the single `BLOG_URL` constant (no more `href: '#'` placeholders). The CV item points at `${BLOG_URL}/cv` — a locale-less path that the blog's [`public/_redirects`](../naufal-blog/public/_redirects) sends to `/en/cv` (same default-locale redirect as the apex `/`), so the host link stays locale-agnostic and survives the domain swap. Changing the constant needs a host rebuild + redeploy.
