# Project Handoff — Polyglot Microfrontend Portfolio

This document contains the full context of a planning conversation. I'm migrating to Claude Code to continue building. Read this in full before proposing next steps. **Do not regenerate or relitigate decisions already made** — they were reached through deliberate tradeoff discussion.

---

## About me

Naufal Yusran, software engineer in Jakarta. Frontend-leaning fullstack, ~3 years professional experience. Working at DBS Bank Indonesia (Feb 2026 – present) as a React.js Developer on a webview-based microfrontend app using Module Federation. Prior: eDOT (Next.js dashboards), Ajaib (Next.js landing pages + onboarding webview), Bank Danamon (DBankPro 2.0 back office, React container + Angular feature modules with Single-SPA → NX migration), Infosys, Doubler Studio (BCA projects in vanilla JS/jQuery/Nunjucks/React/Next), GeekGarden (Flutter), Ehealth (Polymer), Traveloka intern.

Education: Bachelor of Informatics, Universitas Islam Indonesia, Cum Laude (GPA 3.69/4.00).

Stack experience: React, Next.js, Angular, JavaScript, TypeScript, Tailwind, Bootstrap, Flutter, Microfrontend (Single-SPA, NX, Module Federation), React Query, React Hook Form, Zod, Playwright, jQuery, Drone CI, SonarQube, Nexus IQ, Agile/Scrum, Jira. Also Unity (game dev bootcamp at Agate via Kampus Merdeka).

---

## Project goal

Build a portfolio where the _architecture is the portfolio_ — a microfrontend system that demonstrates cross-framework Module Federation, paired with a content site that tells the professional story. Two equally weighted goals:

1. Portfolio piece for job hunting
2. Learning/deepening MF skills

Stance on MF strictness: **pragmatic** — MF where it fits, alternative approaches (like sibling sites) where MF doesn't fit. Not dogmatic about federating everything. Knowing when NOT to use MF is itself part of the skill being demonstrated.

---

## Architecture (locked-in decisions)

### Two-site architecture, not one

- **Portfolio site at `naufal.dev`** — React Vite host, federated remotes. Home page is a "curated playground" (see below). Job: _show_ building ability, be living proof of the MF architecture.
- **Blog site at `blog.naufal.dev`** — Standalone Next.js, SSR/SSG for SEO. NOT a federated remote. Holds content: technical articles, the CV (as a styled exportable page), and the deeper "stories" behind each job. Job: _tell_ the story, be findable on Google.

Reason for the split: Module Federation is client-rendered, bad for SEO. Content that needs to be crawlable lives in the SSR blog. Interactive things that don't need SEO live in the federated portfolio. Each tool used for what it's actually good at. The two sites share a visual identity so they feel unified, but they're independent deployments. Portfolio links to blog for substance; blog links to portfolio for live demos.

### Why not Next.js for the federated remote

Researched in May 2026: `@module-federation/nextjs-mf` is being deprecated, official Next.js MF support ending, App Router not supported. Building on it now means building on a sunsetting dependency.

Verified via web search at planning time:

- `@module-federation/vite` is the actively maintained successor, framework-agnostic
- SvelteKit + MF has SSR conflicts (`setContext` reexport issues) — use **plain Svelte + Vite**, not SvelteKit, for federated remotes
- Plain Svelte + Vite + MF works well (Giorgio Boa demos, Trendyol production case study)

### Project stack

| Project        | Stack                                             | Port | Status      |
| -------------- | ------------------------------------------------- | ---- | ----------- |
| `naufal-host`  | React 19 + Vite + `@module-federation/vite`       | 5173 | Working     |
| `naufal-lab`   | Plain Svelte 5 + Vite + `@module-federation/vite` | 5174 | Working     |
| `naufal-party` | PartyKit (WebSocket) — multiplayer presence       | 1999 | Working     |
| `naufal-blog`  | Next.js 15 App Router (standalone, NOT federated) | —    | Not started |

(There is no separate `naufal-tokens` package — see Design approach below. The earlier idea of a published tokens package was dropped as over-engineered.)

`naufal-party` is a sibling project added when the multiplayer-cursor block was built. It's a stateful WebSocket server (Vercel can't host one, which is part of why a VPS is on the table for deployment). The federated `Presence` component opens its own socket to it — see the MF setup doc for the realtime architecture.

### Roadmap

- **v0.1 — DONE.** Cross-framework federation works end-to-end (React host loads a Svelte remote at runtime), dev-time auto-reload works, TypeScript types flow remote→host.
- **v0.2 — IN PROGRESS.** shadcn + dark theme done. The `<Cell>` frame primitive exists. Two playground blocks built: **microfrontend-meta** (live Counter, host⇄remote diagram, load status, simulate-offline) and **presence-room** (multiplayer cursors via a federated `Presence` remote + PartyKit). The remote now exposes **two** components (`./Counter`, `./Presence`). Still to do: the hero/interactive-name block, the tech-stack block, the header/footer frame, and deploy.
- **v0.3 — content.** Scaffold the Next.js blog. First technical post (the MF build itself — the gotchas list is the raw material). The CV page. Begin the experience "stories."
- **v0.4+ — grow.** More playground blocks. More remotes (Angular via spartan/ui, vanilla JS). Harden presence (ghost-replay for the empty-room problem). Eventually a 3D block once Three.js is properly learned (deliberately deferred — see below). Possibly an "architecture inspector" page showing live network waterfall / loaded chunks / shared deps.

---

## The home page concept — "curated playground"

The home page is NOT a coherently-designed site with one consistent visual language. It is a **vertically-scrolling gallery of independent interactive blocks**. Each block is its own self-contained "wow" moment. The blocks intentionally do NOT match each other — the inconsistency is the aesthetic, and it mirrors the microfrontend architecture (independent pieces, composed).

**The one consistency rule — the "frame":** the page shell and the cell containers each block sits in stay consistent. This frame is what makes the page read as a deliberate collection rather than a junk drawer. The frame is non-negotiable; the block contents are free to be wild.

This direction was chosen deliberately because: (a) it removes the design-coherence burden — the user is not a designer and does not want to make design-system decisions; (b) it's the visual expression of the MF architecture; (c) it's an ever-growing container for future small projects — it never needs a redesign because there's no unified design to break.

Some blocks will be plain host code; some will be genuine federated remotes in different frameworks. Quality over quantity — a gallery is judged block-by-block, so a few genuinely good blocks beat many filler ones.

---

## Design approach (important — the user is not a designer)

The user has explicitly said they don't know design and don't want to make design decisions. The approach accommodates this:

- **Components**: shadcn/ui (React, in the host). shadcn-svelte for Svelte remotes, spartan/ui for a future Angular remote, shadcn-vue for a future Vue remote. All shadcn ports share the same CSS-variable conventions, so visual parity across frameworks is automatic at the CSS layer.
- **Theme (colors/fonts)**: use a pre-made theme rather than hand-designing. tweakcn (tweakcn.com) is the recommended tool — pick/generate a palette, export CSS variables. This removes the color-decision burden.
- **Layout & fine visual calls**: Claude Code makes these; the user reacts in plain language ("too bright", "bigger headings", "more space"). Reacting to concrete output is the user's design workflow — not originating from scratch.
- **Reference material**: Figma shadcn kits (Obra shadcn/ui kit, RAVN's kit) and the Magic UI portfolio (github.com/dillionverma/portfolio) are reference points the user can _point at_ to make abstract preferences concrete. Not for wholesale cloning of the host (would fight the MF architecture), but fine as reference and fine to clone for the blog later.

Cross-framework component sharing happens at the **CSS layer** (shared CSS variables), not the JS layer. The same button in React-shadcn and Svelte-shadcn-svelte looks identical because both read `--primary`.

### Three.js / 3D — deliberately deferred

A 3D animated home page was considered and **paused**. The user wants to _learn_ Three.js properly first rather than copy-paste it. When built later, the 3D piece becomes just ONE block in the playground (not the whole page's burden), and the current non-3D home page becomes its `prefers-reduced-motion` / low-capability fallback. Nothing built now is throwaway. R3F (React Three Fiber) + drei is the recommended approach when the time comes.

---

## v0.2 scope (current work)

Build the home page of the React Vite host.

**Setup:**

- Install + init shadcn/ui in `naufal-host` (React + Vite path, not Next.js).
- Tailwind, Framer Motion (`motion`).
- Dark theme only for v0.2 — no light/dark toggle yet. Near-black background with a slight cool tint (NOT pure `#000`), off-white headings, muted-gray body, one sparingly-used accent color (green/cyan family reads "technical").

**The frame:**

- Slim header: name left (monospace, small), nav links right (Work, Blog, CV — placeholders OK).
- One intro line near the top, larger text, e.g. "A playground of interactive things I build."
- A reusable `<Cell>` component (label prop + children): consistent faint 1px border, rounded corners, slightly raised surface vs background, small monospace corner label saying what the block is + what tech powers it. Every block drops into a `<Cell>`. This is the key reusable primitive.
- Footer: GitHub, LinkedIn, email, blog links.

**The three v0.2 blocks (each inside a `<Cell>`):**

1. **Hero / interactive name** — first and largest cell. Large display-type "Naufal Yusran"; letters subtly react to cursor (gentle repel/shift/glow, tasteful). One-line positioning below: "Frontend engineer working at the seams of frameworks."
2. **Tech stack** — framework nodes (React, Angular, Svelte, Vue, Next.js, Flutter, JavaScript, TypeScript) as labeled pills/nodes; hover highlights + shows a short note. Static layout, light animation. Animated-SVG version comes later.
3. **Microfrontend meta** — the signature block. Visualization communicating the page is itself a microfrontend ("This page's host is React. The block below loads live from a Svelte remote."). Embed the actual lab remote counter via `<RemoteMount>` if straightforward; must fail gracefully with a placeholder if the remote isn't running.

**Behavior:** cells fade-and-rise on scroll (Framer Motion, subtle); fully responsive (cells stack full-width on mobile); respect `prefers-reduced-motion`; don't break the existing MF setup.

---

## Cross-framework MF pattern (important)

The remote does NOT expose framework-specific components. It exposes **a mount function** with a framework-agnostic signature. Recommended signature is `(target: HTMLElement, opts?: { locale?: string }) => () => void` — the optional opts object is future-proofing for i18n so the remote API doesn't have to change later.

```ts
// In naufal-lab/src/lib/mountCounter.ts
import { mount, unmount } from "svelte";
import Counter from "./Counter.svelte";

export default function mountCounter(target: HTMLElement) {
  const instance = mount(Counter, { target });
  return () => unmount(instance);
}
```

`exposes` points at `mountCounter.ts`, not `Counter.svelte`. The host renders the remote via a generic `<RemoteMount>` wrapper that handles the ref + useEffect + mount lifecycle once:

```tsx
<RemoteMount load={() => import("lab/Counter")} />
```

This pattern works identically for Angular, Vue, vanilla JS. The host stays framework-agnostic. The remote owns its own framework lifecycle. This is also how Single-SPA does it.

### Svelte 5 gotcha (already hit and solved)

Svelte 5 components are functions, not classes. The Svelte 4 API `new Counter({ target })` produces misleading errors like `Cannot read properties of null (reading 'nodes')` — looks like a DOM issue but is actually wrong component instantiation. The fix is `mount()` from `svelte`, wrapped in a mount function as above.

---

## Resolved cross-cutting decisions

- **i18n**: each remote owns its own translations (its own i18n library, its own translation files). Only the locale STRING crosses the boundary, propagated via the `<html lang>` attribute (host owns it). Conventions shared, implementations independent. Not implemented yet — v0.3+ work. The `opts` object in the mount signature is the forward-compatible hook.
- **Dark mode**: pure CSS variables. Host toggles a class on `<html>`; every remote inherits it through the CSS cascade automatically, because remotes render into the host's DOM. Zero coordination code, no events, no shared store. (v0.2 is dark-only; the toggle itself is later.)
- **SSR for remotes**: don't. Federated remotes stay client-rendered. Content needing SSR/SEO goes in the standalone Next.js blog. For perceived performance use loading skeletons + preloading, not SSR-over-federation.
- **Monorepo vs split**: currently sibling folders (`naufal-host/`, `naufal-lab/`) with NO workspace tooling (no npm/pnpm workspaces, no Nx, no Turborepo). This is deliberate — keeps a future split into separate repos nearly free (just move the folder, update the watcher path). Split when there's a real reason (third remote, collaborators), not before. Do NOT add a parent-level `package.json`.

---

## Current working state

> **Note:** the code snippets below are the v0.1 baseline as of the original handoff. They've since evolved (two exposes, `opts` contract, `RemoteMount` with status/fallback, the mouse-tracker Counter, the `Presence` remote, CSS shipped over the boundary). For the **current** code and architecture, see [`module-federation-setup.md`](./module-federation-setup.md) — it's the source of truth. The snippets here are kept for historical context.

### Host: `naufal-host/vite.config.ts`

```ts
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import { federation } from "@module-federation/vite";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const remoteDist = path.resolve(__dirname, "../naufal-lab/dist");

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: "host",
      remotes: {
        lab: {
          type: "module",
          name: "lab",
          entry: "http://127.0.0.1:5174/remoteEntry.js",
        },
      },
      dts: {
        generateTypes: false,
        consumeTypes: true,
        displayErrorInTerminal: true,
      },
      shared: ["react", "react-dom"],
    }),
    {
      name: "watch-remote-dist",
      configureServer(server) {
        server.watcher.add(remoteDist);
        server.watcher.on("change", (file) => {
          if (file.startsWith(remoteDist)) {
            server.ws.send({ type: "full-reload" });
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    fs: { allow: [path.resolve(__dirname, "..")] },
  },
  build: { target: "chrome89" },
});
```

**Note on `127.0.0.1` vs `localhost`**: On Windows, `localhost` resolves to IPv6 (`::1`) by default, but the dts-plugin enforces IPv4 for HTTP fetches. The mismatch causes the types download to silently fail with "Failed to download types archive". Using `127.0.0.1` explicitly bypasses DNS resolution and works on all platforms. Don't switch back to `localhost`.

**Status**: Working. Edits to the Svelte component trigger a remote rebuild (via `vite build --watch`), which the host detects and full-page reloads. Not true HMR, but close enough.

### Host: TypeScript types for federated modules

Generated types work. No manual `remotes.d.ts` file (deleted). The plugin downloads `.d.ts` files from the remote at host startup into `naufal-host/@mf-types/`.

**`naufal-host/tsconfig.app.json`** (relevant fragments):

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "*": ["./@mf-types/*"]
    }
  },
  "include": ["src", "@mf-types"]
}
```

The catch-all `"*": ["./@mf-types/*"]` means new remotes work without further tsconfig edits. Tradeoff: typo'd imports may resolve to `any` instead of erroring. Acceptable at this scale.

**`naufal-host/.gitignore`** includes `@mf-types` — it's a regenerated artifact like `node_modules`/`dist`, not committed.

**Fresh-clone workflow** (folder is gitignored): host TS shows "cannot find module" until the remote has built + been served once and the host has fetched. Order: (1) `cd naufal-lab && npm install && npx vite build`, (2) `npx vite preview --port 5174` (keep running), (3) `cd naufal-host && npm install && npm run dev`, (4) `@mf-types/` populates, errors clear.

### Remote: `naufal-lab/vite.config.ts`

```ts
import { defineConfig } from "vite";
import { svelte } from "@sveltejs/vite-plugin-svelte";
import { federation } from "@module-federation/vite";

export default defineConfig({
  plugins: [
    svelte(),
    federation({
      name: "lab",
      filename: "remoteEntry.js",
      exposes: { "./Counter": "./src/lib/mountCounter.ts" },
      dts: {
        generateTypes: true,
        consumeTypes: false,
        displayErrorInTerminal: true,
      },
      shared: [],
    }),
  ],
  server: {
    port: 5174,
    host: "127.0.0.1",
    origin: "http://127.0.0.1:5174",
  },
  preview: {
    port: 5174,
    host: "127.0.0.1",
  },
  build: { target: "chrome89" },
});
```

### Host: `naufal-host/src/components/RemoteMount.tsx`

Generic wrapper hiding the ref + useEffect + mount boilerplate. Every remote slots in.

```tsx
import { useEffect, useRef } from "react";

type MountFn = (target: HTMLElement) => () => void;

export function RemoteMount({
  load,
}: {
  load: () => Promise<{ default: MountFn }>;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    load().then((m) => {
      if (ref.current) cleanup = m.default(ref.current);
    });
    return () => cleanup?.();
  }, [load]);

  return <div ref={ref} />;
}
```

### Host: `naufal-host/src/App.tsx`

Currently a minimal toggle button + `<RemoteMount load={() => import('lab/Counter')} />` behind Suspense. No styling, no router yet. **v0.2 replaces this with the home-page playground.** Strict Mode is on and stays on (intentional — see gotcha 5).

### Remote: `naufal-lab/src/lib/Counter.svelte`

Minimal counter with an intentionally ugly dashed border (so it's visibly a remote). May be restyled in v0.2 when it's embedded in the microfrontend-meta block.

### Dev workflow

- Host: `npm run dev` (port 5173)
- Remote: `npx vite build --watch` + `npx vite preview --port 5174` in two terminals (or combine via `concurrently`)
- HMR isn't possible with `@module-federation/vite` — fast rebuild + watcher-triggered host reload is the substitute (rebuilds 200-500ms).

---

## Known gotchas already solved (don't re-discover)

Also raw material for the first blog post.

1. **Svelte 5 `new Component()` is gone.** Components are functions, not classes. Svelte 4 API produces misleading "Cannot read properties of null (reading 'nodes')" errors. Use `mount()` from `svelte`, wrapped in a `mountFn` exported by the remote.

2. **Windows + dts + `localhost` = silent failure.** The dts-plugin forces IPv4; Windows resolves `localhost` to IPv6 → "Failed to download types archive". Fix: `127.0.0.1` everywhere in the federation `entry` and the remote's `server.host` / `preview.host`.

3. **The remote must run with `vite build --watch` + `vite preview`, not `vite dev`.** `@module-federation/vite` generates `remoteEntry.js` at build time; there's no remoteEntry in dev mode.

4. **HMR isn't possible across the MF boundary, but full-page reload on remote rebuild is.** Custom host plugin watches `../naufal-lab/dist/` and sends `{ type: 'full-reload' }` over Vite's WebSocket. Requires `server.fs.allow` to permit watching a sibling folder.

5. **React Strict Mode causes the Svelte component to appear to render twice.** It mounts → unmounts → remounts to verify cleanup works. The single counter seen is the second mount. Don't disable Strict Mode.

6. **`@mf-types/` is gitignored, not committed.** Regenerated every dev/build. Tradeoff: first run on a fresh clone shows "cannot find module" until the host has fetched once.

7. **TypeScript 6.0 turns deprecated `baseUrl` into a hard error (TS5101).** The MF dts-plugin generates a tsconfig that `extends` the remote's `tsconfig.json`, so a `baseUrl` anywhere in the remote's config chain makes type generation crash silently — the host gets no types, with only a `#TYPE-001` in the build log. shadcn-svelte's init added the `baseUrl`. Fix: `"ignoreDeprecations": "6.0"` (band-aid; `baseUrl` is fully removed in TS 7) or drop `baseUrl` entirely.

8. **`vite build --watch` does NOT reload `vite.config.ts`.** Unlike `vite dev`, it watches source but not the config. After editing `exposes` (e.g. adding `./Presence`), the running build keeps the old config — restart the build process or the new expose never appears in `remoteEntry.js`.

9. **Tailwind utility classes don't cross the MF boundary.** Theme **CSS variables** cascade from host into the embedded remote (shadcn tokens just work), but utility classes (`bg-sky-400`, the shadcn Button classes) live in the remote's entry stylesheet, which the host never loads. Embedded, they only render if the host coincidentally generates the same class. Fix: import the stylesheet (`app.css`) in the exposed mount adapter so Tailwind ships with the federated chunk (cost: duplicate Tailwind + preflight in the host), or style remotes with CSS variables + inline only.

---

## Open issues / next concrete tasks

1. **Finish v0.2 playground** — still need the hero/interactive-name block, the tech-stack block, and the header/footer frame. (microfrontend-meta and presence-room blocks + the `<Cell>` primitive are done.)
2. **Deploy** — host + remote to static hosting; `naufal-party` needs a stateful host (Vercel can't run a WebSocket server → VPS or PartyKit Cloud). Make `VITE_LAB_URL`, the federation `entry`, and `VITE_PARTY_HOST` environment-aware (still hardcoded to `127.0.0.1`).
3. **Harden presence** — ghost-replay / synthetic cursors for the empty-room problem (a portfolio usually has one visitor).
4. **Add a third remote** later (Angular spartan/ui, Vue, or vanilla JS) to validate the `<RemoteMount>` + `opts` pattern scales across frameworks.
5. **React Router** later — each remote/section gets its own URL.
6. **LEARNINGS.md** — keep a running file of the gotchas above. Raw material for the first blog post (the MF build, the TS6/baseUrl trap, and the Tailwind-across-the-boundary lesson are all strong material).

---

## Working preferences for our collaboration

- Minimum-viable-first. Don't add complexity until the minimum is verified. (E.g. the React Compiler / babel plugin was removed in v0.1 to simplify debugging; can be added back now in v0.2 if desired, verifying federation still works afterward.)
- Search the web before committing to a stack choice when versions might matter. Don't trust stale training data on package compatibility.
- Be honest about tradeoffs. Flag hard truths, don't sell the easy answer.
- Keep responses prose-first. Formatting only where it genuinely helps. No filler.
- When introducing a new pattern, explain _why_ it's right, not just how to apply it.
- Reference CV/work experience when relevant — it's a portfolio; connecting decisions to demonstrable experience is valuable.
- The user is not a designer. Make fine visual calls yourself; let the user react in plain language. Show plans before building so the user can react early.

---

## What I want from you now

v0.2 is partway done — the `<Cell>` primitive and two blocks (microfrontend-meta, presence-room) exist. Remaining v0.2 work: the hero/interactive-name block, the tech-stack block, the header/footer frame, then deploy. Build incrementally, one block at a time, showing the plan and visual choices for approval before building.

Don't relitigate settled decisions; if you disagree with one, flag it briefly and let me decide.
