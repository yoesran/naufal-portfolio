# Project Handoff — Polyglot Microfrontend Portfolio

This document contains the full context of a planning conversation. I'm migrating to Claude Code to continue building. Read this in full before proposing next steps. **Do not regenerate or relitigate decisions already made** — they were reached through deliberate tradeoff discussion.

---

## About me

Naufal Yusran, software engineer in Jakarta. Frontend-leaning fullstack, ~3 years professional experience. Working at DBS Bank Indonesia (Feb 2026 – present) as a React.js Developer on a webview-based microfrontend app using Module Federation. Prior: eDOT (Next.js dashboards), Ajaib (Next.js landing pages + onboarding webview), Bank Danamon (DBankPro 2.0 back office, React container + Angular feature modules with Single-SPA → NX migration), Infosys, Doubler Studio (BCA projects in vanilla JS/jQuery/Nunjucks/React/Next), GeekGarden (Flutter), Ehealth (Polymer), Traveloka intern.

Education: Bachelor of Informatics, Universitas Islam Indonesia, Cum Laude (GPA 3.69/4.00).

Stack experience: React, Next.js, Angular, JavaScript, TypeScript, Tailwind, Bootstrap, Flutter, Microfrontend (Single-SPA, NX, Module Federation), React Query, React Hook Form, Zod, Playwright, jQuery, Drone CI, SonarQube, Nexus IQ, Agile/Scrum, Jira. Also Unity (game dev bootcamp at Agate via Kampus Merdeka).

---

## Project goal

Build a portfolio site that _is itself_ a microfrontend, demonstrating cross-framework Module Federation. Two equally weighted goals:

1. Portfolio piece for job hunting
2. Learning/deepening MF skills

Stance on MF strictness: **pragmatic** — MF where it fits, alternative approaches (like sibling sites) where MF doesn't fit. Not dogmatic about federating everything.

---

## Architecture (locked-in decisions)

### Two-site architecture, not one

- **Portfolio site at `naufal.dev`** — React Vite host, federated remotes for non-SEO content
- **Blog site at `blog.naufal.dev`** — Standalone Next.js, SSR/SSG for SEO. NOT a federated remote. Reason: federating into a host makes the blog content invisible to crawlers; SSR + MF is technically possible but defeats the SEO purpose.

The two sites share design tokens via a small package. To users they look unified; technically they're independent deployments.

### Why not Next.js for the federated remote

Researched in May 2026: `@module-federation/nextjs-mf` is being deprecated, official Next.js MF support ending, App Router not supported. Building on it now means building on a sunsetting dependency.

Verified via web search at planning time:

- `@module-federation/vite` is the actively maintained successor, framework-agnostic
- SvelteKit + MF has SSR conflicts (`setContext` reexport issues) — use **plain Svelte + Vite**, not SvelteKit, for federated remotes
- Plain Svelte + Vite + MF works well (Giorgio Boa demos, Trendyol production case study)

### v0.1 stack (locked in)

| Project         | Stack                                             | Port | Status      |
| --------------- | ------------------------------------------------- | ---- | ----------- |
| `naufal-host`   | React 19 + Vite + `@module-federation/vite`       | 5173 | ✅ Working  |
| `naufal-lab`    | Plain Svelte 5 + Vite + `@module-federation/vite` | 5174 | ✅ Working  |
| `naufal-blog`   | Next.js 15 App Router (standalone, NOT federated) | —    | Not started |
| `naufal-tokens` | CSS variables + Tailwind preset (no components)   | —    | Not started |

### Roadmap beyond v0.1

- **v0.2**: shadcn-based design tokens + visual polish + deploy to Vercel
- **v0.3+**: Add Angular dashboard remote (uses spartan/ui), vanilla JS animation remote (BCA-style), maybe Vue or Solid
- Eventually: architecture inspector page in host showing live network waterfall, shared deps, loaded chunks — turns the architecture into the content

### Design system strategy

Three layers, only the first two are framework-agnostic:

1. **CSS variables** (`--primary`, `--background`, `--radius`, etc.) — works everywhere, this is the actual "design tokens"
2. **Tailwind preset** that maps those CSS vars to utilities — works in any Tailwind project
3. **Components** — framework-specific: `shadcn/ui` for React, `shadcn-svelte` for Svelte, `spartan/ui` for Angular, `shadcn-vue` for Vue. Each port consumes the same CSS vars, so visual parity is automatic across frameworks.

This means cross-framework component sharing happens at the **CSS layer**, not the JS layer. The same `<Button>` in React-shadcn and Svelte-shadcn-svelte will look identical because both read `--primary`.

Flutter and Unity are excluded from v0.1 (they render to canvas, can't consume CSS vars — would need manual matching in their own theming systems).

---

## Cross-framework MF pattern (important)

The remote does NOT expose framework-specific components. It exposes **a mount function** with a framework-agnostic signature:

```ts
// In naufal-lab/src/lib/mountCounter.ts
import { mount, unmount } from 'svelte';
import Counter from './Counter.svelte';

export default function mountCounter(target: HTMLElement) {
  const instance = mount(Counter, { target });
  return () => unmount(instance);
}
```

`exposes` points at `mountCounter.ts`, not `Counter.svelte`. The host renders the remote via a generic `<RemoteMount>` wrapper (see code section below) that handles the ref + useEffect + mount lifecycle once. Calls become:

```tsx
<RemoteMount load={() => import('lab/Counter')} />
```

This pattern works identically for Angular, Vue, vanilla JS. The host stays framework-agnostic. The remote owns its own framework lifecycle. This is also how Single-SPA does it.

### Svelte 5 gotcha (already hit and solved)

Svelte 5 components are functions, not classes. The Svelte 4 API `new Counter({ target })` produces misleading errors like `Cannot read properties of null (reading 'nodes')` — looks like a DOM issue but is actually wrong component instantiation. The fix is `mount()` from `svelte`, wrapped in a mount function as above.

---

## Current working state

### Host: `naufal-host/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { federation } from '@module-federation/vite';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const remoteDist = path.resolve(__dirname, '../naufal-lab/dist');

export default defineConfig({
  plugins: [
    react(),
    federation({
      name: 'host',
      remotes: {
        lab: {
          type: 'module',
          name: 'lab',
          entry: 'http://127.0.0.1:5174/remoteEntry.js',
        },
      },
      dts: {
        generateTypes: false,
        consumeTypes: true,
        displayErrorInTerminal: true,
      },
      shared: ['react', 'react-dom'],
    }),
    {
      name: 'watch-remote-dist',
      configureServer(server) {
        server.watcher.add(remoteDist);
        server.watcher.on('change', (file) => {
          if (file.startsWith(remoteDist)) {
            server.ws.send({ type: 'full-reload' });
          }
        });
      },
    },
  ],
  server: {
    port: 5173,
    fs: { allow: [path.resolve(__dirname, '..')] },
  },
  build: { target: 'chrome89' },
});
```

**Note on `127.0.0.1` vs `localhost`**: On Windows, `localhost` resolves to IPv6 (`::1`) by default, but the dts-plugin enforces IPv4 for HTTP fetches. The mismatch causes the types download to silently fail with "Failed to download types archive". Using `127.0.0.1` explicitly bypasses the DNS resolution and works on all platforms. Don't switch back to `localhost` even if other examples use it.

**Status**: ✅ Working. Edits to the Svelte component trigger a remote rebuild (via `vite build --watch`), which the host detects and full-page reloads. Not true HMR, but close enough — feels like normal dev.

### Host: TypeScript types for federated modules

Generated types are working. No manual `remotes.d.ts` file is used (deleted). The plugin downloads `.d.ts` files from the remote at host startup and places them in `naufal-host/@mf-types/`.

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

The catch-all `"*": ["./@mf-types/*"]` means any new remote works without further tsconfig edits — `import 'dashboard/Widget'` resolves to `@mf-types/dashboard/Widget` automatically. Tradeoff: typo'd imports may resolve to `any` instead of erroring. Acceptable for this project's scale.

**`naufal-host/.gitignore`** must include:

```
@mf-types
```

The folder is regenerated on every dev/build startup, so it's a derived artifact like `node_modules` or `dist`. Don't commit it.

**Fresh-clone workflow** (since the folder is gitignored): when cloning to a new machine, the host's TS will show "cannot find module" errors until the remote has built and been served at least once, and the host has fetched from it. Workflow:

1. `cd naufal-lab && pnpm install && pnpm vite build`
2. `pnpm vite preview --port 5174` (keep running)
3. In another terminal: `cd naufal-host && pnpm install && pnpm dev`
4. `@mf-types/` populates, TS errors clear

After step 3 the dev loop is normal.

### Remote: TypeScript types config

`naufal-lab/vite.config.ts` has matching `dts` settings:

```ts
dts: {
  generateTypes: true,
  consumeTypes: false,
  displayErrorInTerminal: true,
},
```

Types are emitted as part of `pnpm vite build` into `dist/@mf-types/` and packaged as `dist/@mf-types.zip` for the host to download over HTTP.

### Host: `naufal-host/src/components/RemoteMount.tsx`

Generic wrapper to hide the ref + useEffect + mount boilerplate. Every remote slots into this — Svelte, Vue, Angular, vanilla, all expose `(target) => cleanup` and use the same component.

```tsx
import { useEffect, useRef } from 'react';

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

Usage in `App.tsx`:

```tsx
<RemoteMount load={() => import('lab/Counter')} />
```

Per-remote `LabRemote.tsx` components are no longer needed — calls go directly through `<RemoteMount>`.

### Host: `naufal-host/src/App.tsx`

Currently a minimal toggle button + `<RemoteMount load={() => import('lab/Counter')} />` lazy-loaded behind Suspense. No styling yet, no router yet. Strict Mode on (intentional — was confusing the user with double-render at first, but it's correctly catching that the mount/unmount cleanup works).

### Remote: `naufal-lab/vite.config.ts`

```ts
import { defineConfig } from 'vite';
import { svelte } from '@sveltejs/vite-plugin-svelte';
import { federation } from '@module-federation/vite';

export default defineConfig({
  plugins: [
    svelte(),
    federation({
      name: 'lab',
      filename: 'remoteEntry.js',
      exposes: { './Counter': './src/lib/mountCounter.ts' },
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
    host: '127.0.0.1',
    origin: 'http://127.0.0.1:5174',
  },
  preview: {
    port: 5174,
    host: '127.0.0.1',
  },
  build: { target: 'chrome89' },
});
```

### Remote: `naufal-lab/src/lib/Counter.svelte`

Minimal counter with intentionally ugly dashed border so the user can visually see it's a remote, not a host component. Will be replaced with proper styling in v0.2.

### Dev workflow

- Host: `pnpm dev` (port 5173)
- Remote: `pnpm vite build --watch` + `pnpm vite preview --port 5174` in two terminals (or combine via `concurrently`)
- HMR isn't possible with `@module-federation/vite` — fast rebuild + watcher-triggered host reload is the substitute. Rebuilds are typically 200-500ms.

---

## Known gotchas already solved (don't re-discover)

Worth recording these so they're not relearned. Also material for the first blog post.

1. **Svelte 5 `new Component()` is gone.** Svelte 5 components are functions, not classes. The Svelte 4 API produces misleading "Cannot read properties of null (reading 'nodes')" errors. Use `mount()` from `svelte`, wrapped in a `mountFn` exported by the remote.

2. **Windows + dts + `localhost` = silent failure.** The dts-plugin forces IPv4 over HTTP, Windows resolves `localhost` to IPv6 by default → connection refused, "Failed to download types archive". Fix: use `127.0.0.1` everywhere instead of `localhost` in the federation `entry` and the remote's `server.host` / `preview.host`. Works cross-platform.

3. **The remote must run with `vite build --watch` + `vite preview`, not `vite dev`.** `@module-federation/vite` generates `remoteEntry.js` at build time. There's no remoteEntry in dev mode. Rebuilds are 200-500ms so the workflow feels close to HMR.

4. **HMR isn't possible across the MF boundary, but full-page reload on remote rebuild is.** A small custom plugin in the host's vite.config watches `../naufal-lab/dist/` and sends `{ type: 'full-reload' }` over the existing Vite WebSocket when files change. Also requires `server.fs.allow` to permit watching a sibling folder outside the host's root.

5. **React Strict Mode causes the Svelte component to appear to render twice.** It actually mounts → unmounts → remounts to verify the cleanup function works. The single counter you see is the second mount; the first was correctly torn down. Don't disable Strict Mode.

6. **`@mf-types/` is gitignored, not committed.** It's regenerated on every dev/build. Committing creates stale-source confusion and noisy diffs. Tradeoff: first run on a fresh clone shows "cannot find module" errors until the host has fetched once.

## Open issues / next concrete tasks

1. **Decided next move sequence:**
   - **Move B first**: Set up shadcn + design tokens in the host. Replace inline styles with a proper sidebar+content layout. Make it look like a real site, not a toggle button.
   - **Move A second**: Add a second remote (likely Vue or another React app) to validate the wildcard typing and architectural pattern scales.
   - **Move C third**: Wire up React Router so each remote has its own URL (`/lab`, `/blog`).

2. **LEARNINGS.md** — recommended to keep a running file of gotchas hit during development. Will become raw material for the first blog post in v0.2. Already has one entry: the Svelte 5 mount API gotcha.

---

## Working preferences for our collaboration

- Minimum-viable-first approach. Don't add complexity until the minimum is verified. Example: React Compiler / babel plugin was in the scaffold; we removed it for v0.1 to simplify debugging surface, will add back in v0.2.
- Search the web before committing to a stack choice when versions might matter. Don't trust stale training data on package compatibility.
- Be honest about tradeoffs. Don't sell the easy answer — flag the hard truths (e.g. SSR + MF doesn't give the SEO benefit; Next.js MF plugin is sunsetting; SvelteKit has rougher MF support than plain Svelte).
- Keep responses prose-first. Use formatting (lists, tables, diagrams) only where it genuinely helps comprehension. No filler.
- When introducing a new pattern, explain _why_ it's the right pattern, not just how to apply it.
- Reference existing CV/work experience when relevant — the goal is a portfolio, so connecting work decisions to demonstrable past experience is valuable.

---

## What I want from you now

Pick up where the conversation left off. v0.1 federation infrastructure is working end-to-end, including dev-time auto-reload. Next concrete step is Move B: shadcn + design tokens + a proper layout in the host.

Ask clarifying questions only if necessary — most of the architecture is settled. Don't relitigate decisions; if you disagree with one, flag it briefly and let me decide whether to revisit.
