# Module Federation Setup: React Host + Svelte Remote + Realtime

## Overview

This document explains the architecture connecting three independently deployable apps:

- **`naufal-host`** (React) — composes federated components at runtime.
- **`naufal-lab`** (Svelte) — a remote that exposes components over Module Federation.
- **`naufal-party`** (PartyKit) — a WebSocket server powering multiplayer presence.

Federation uses `@module-federation/vite` — the actively maintained, framework-agnostic plugin. (The older `@module-federation/nextjs-mf` is being deprecated and was deliberately not used.)

The remote exposes **two** components today: `./Counter` (a context-aware mouse-tracker) and `./Presence` (a multiplayer cursor canvas that holds its own live WebSocket). The presence feature is the on-message demo: a federated Svelte component, embedded in a React host, sharing realtime state across deployments.

---

## What Each Project Contains

### `naufal-host` — React Host (port 5173)

| File                                           | Role                                                                                                                                    |
| ---------------------------------------------- | --------------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`                               | Host config; reads `VITE_LAB_URL` via `loadEnv` so the federation `entry` is environment-aware                                          |
| `index.html`                                   | Inline `<style>` paints the dark background on first frame (avoids white FOUC before JS loads)                                          |
| `src/main.tsx`                                 | Mounts React inside a top-level `ErrorBoundary` + installs an `unhandledrejection` swallower                                            |
| `src/App.tsx`                                  | The home-page playground — header, intro, Hero / TechStack / Microfrontend / Presence blocks, footer                                    |
| `src/components/Header.tsx`, `Footer.tsx`      | Sticky header (name + nav placeholders), footer with social links                                                                       |
| `src/components/Cell.tsx`                      | The frame primitive: bordered card + monospace label, every block sits in one                                                           |
| `src/components/RemoteMount.tsx`               | Generic wrapper that mounts any framework-agnostic remote (status + `fallback` + `loadingFallback` + opts)                              |
| `src/components/blocks/HeroBlock.tsx`          | Block: host-native interactive wordmark (per-letter cursor repel + emerald glow)                                                        |
| `src/components/blocks/TechStackBlock.tsx`     | Block: host-native rotating icon orbit; pills active on hover/focus/tap                                                                 |
| `src/components/blocks/MicrofrontendBlock.tsx` | Block: live Counter + host⇄remote diagram + load status + skeleton loader + simulate-offline toggle                                     |
| `src/components/blocks/PresenceBlock.tsx`      | Block: loads `lab/Presence` (multiplayer cursors)                                                                                       |
| `src/lib/mf-fallback-plugin.ts`                | MF runtime plugin — `errorLoadRemote` returns a benign stub on init failure, a throwing stub on block-import failure (see "Resilience") |
| `src/vite-env.d.ts`                            | Types `VITE_LAB_URL` / `VITE_PARTY_HOST` env vars                                                                                       |
| `tsconfig.app.json`                            | `paths` mapping so federated imports resolve to generated types                                                                         |
| `@mf-types/`                                   | Auto-generated, gitignored — downloaded remote type declarations                                                                        |

### `naufal-lab` — Svelte Remote (port 5174)

| File                       | Role                                                                                                                      |
| -------------------------- | ------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`           | Configured as a **remote**, exposing `./Counter` and `./Presence`                                                         |
| `src/lib/Counter.svelte`   | Context-aware component: a cursor-following glow + counter; imports `../app.css` so Tailwind ships in the federated chunk |
| `src/lib/mountCounter.ts`  | Mount adapter for `./Counter`                                                                                             |
| `src/lib/Presence.svelte`  | Multiplayer cursor canvas — opens its own `PartySocket` connection; also imports `../app.css`                             |
| `src/lib/mountPresence.ts` | Mount adapter for `./Presence`                                                                                            |
| `src/App.svelte`           | Standalone page showcasing both exposed components                                                                        |
| `src/app.css`              | Tailwind + shadcn theme — imported by the **Svelte components** (not the mount adapters) so CSS ships over federation     |

### `naufal-party` — PartyKit Realtime Server (port 1999)

| File            | Role                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- |
| `src/server.ts` | Cursor relay: assigns each connection a color + name, broadcasts cursor positions to the room |
| `partykit.json` | PartyKit config (`name`, `main`)                                                              |

---

## Architecture

```
┌──────────────────────────────────┐   runtime import    ┌──────────────────────────────┐
│  naufal-host  (React, :5173)     │ ──────────────────► │  naufal-lab  (Svelte, :5174) │
│                                  │  lab/Counter        │                              │
│  App.tsx → Cell blocks           │  lab/Presence       │  mountCounter / mountPresence│
│    ├─ MicrofrontendBlock         │ ◄── (target,opts) ──│   └─ Counter / Presence      │
│    │    └─ RemoteMount → Counter │      returns cleanup│                              │
│    └─ PresenceBlock              │                     │  Presence opens ─┐           │
│         └─ RemoteMount → Presence│                     └──────────────────┼───────────┘
└──────────────────────────────────┘                                        │ WebSocket
                                                                            ▼
                                                          ┌───────────────────────────────┐
                                                          │  naufal-party (PartyKit,:1999)│
                                                          │  relays cursor positions      │
                                                          └───────────────────────────────┘
```

All three run as **separate processes** with no build-time coupling. The host fetches the remote's bundle at runtime from `http://127.0.0.1:5174/remoteEntry.js`; the federated `Presence` component opens a WebSocket to `127.0.0.1:1999`.

---

## How It Works

### 1. The remote exposes a mount function, not a component

The host is React and the remote is Svelte — they can't import each other's component format. Each exposed module is a plain function with a framework-agnostic signature `(target, opts?) => cleanup`:

```ts
// naufal-lab/src/lib/mountCounter.ts
import { mount, unmount } from "svelte";
import "../app.css"; // ships the remote's Tailwind over federation — see below
import Counter from "./Counter.svelte";

export default function mountCounter(
  target: HTMLElement,
  opts: Record<string, unknown> = {},
) {
  const context = opts.context === "standalone" ? "standalone" : "host";
  const instance = mount(Counter, { target, props: { context } });
  return () => unmount(instance);
}
```

It mounts the Svelte component into a real DOM element and returns a cleanup function. The caller never needs to know it's Svelte. This same contract works for Angular, Vue, or vanilla JS remotes.

**Svelte 5 note:** Svelte 5 components are functions, not classes. The Svelte 4 API `new Counter({ target })` fails with misleading errors (`Cannot read properties of null (reading 'nodes')`). Use `mount()` / `unmount()`.

### 2. The host wraps it in a generic React component

`RemoteMount.tsx` works for any remote that exposes `(target, opts?) => cleanup`. It also tracks load status, times the load, forwards `opts`, and renders a fallback when the remote is unreachable:

```tsx
// naufal-host/src/components/RemoteMount.tsx (abridged)
export function RemoteMount({
  load,
  fallback,
  onStatusChange,
  opts,
}: {
  load: () => Promise<{ default: MountFn }>;
  fallback?: React.ReactNode;
  onStatusChange?: (status: RemoteStatus) => void;
  opts?: Record<string, unknown>;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    const started = performance.now();
    onStatusChange?.({ state: "loading" });
    load()
      .then((m) => {
        if (cancelled || !ref.current) return;
        cleanup = m.default(ref.current, opts);
        onStatusChange?.({
          state: "loaded",
          ms: Math.round(performance.now() - started),
        });
      })
      .catch((error) => {
        if (!cancelled) {
          setFailed(true);
          onStatusChange?.({ state: "error", error });
        }
      });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [load, onStatusChange, opts]);

  if (failed && fallback) return <>{fallback}</>;
  return <div ref={ref} />;
}
```

Usage:

```tsx
<RemoteMount load={() => import("lab/Counter")} opts={{ context: "host" }} />
```

The cleanup runs on unmount, so the Svelte component (and any WebSocket it opened) tears down cleanly.

> **Stable props matter** (mostly handled for us now). `load` and `opts` are in the effect deps. An inline object/function changes identity every render and would remount the remote in a loop once the block has state. The React Compiler (see §12) memoizes these automatically — inline objects in JSX work without a `useCallback` or module-level constant. Module-level constants still work and remain readable for the host-only `opts`/`load` pair in `PresenceBlock`; either pattern is fine.

### 3. The `opts` contract — passing context across the boundary

The mount signature's `opts` object is how the host hands data to a remote without caring about its framework. We use it to tell each component **where it's running**:

- The host passes `{ context: 'host' }`; the standalone `App.svelte` passes `context="standalone"`.
- `Counter` uses it to colour its glow (emerald embedded, sky standalone) and label itself.
- `Presence` sends its `context` with every cursor message, so each live cursor is tagged `· host` or `· remote`.

`opts` is deliberately typed `Record<string, unknown>` at the boundary (not a specific interface). It crosses a runtime boundary as a plain object, and a loosely-typed param keeps the remote's generated mount type assignable to `RemoteMount`'s generic `MountFn` (a specific opts type fails parameter-contravariance once the host refetches types). The remote narrows it internally.

### 4. Vite Module Federation config

**Host** (`naufal-host/vite.config.ts`):

```ts
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
});
```

**Remote** (`naufal-lab/vite.config.ts`):

```ts
federation({
  name: "lab",
  filename: "remoteEntry.js",
  exposes: {
    "./Counter": "./src/lib/mountCounter.ts",
    "./Presence": "./src/lib/mountPresence.ts",
  },
  dts: {
    generateTypes: true,
    consumeTypes: false,
    displayErrorInTerminal: true,
  },
  shared: [],
});
```

The remote pins its dev/preview server to `127.0.0.1`:

```ts
server:  { port: 5174, host: '127.0.0.1', origin: 'http://127.0.0.1:5174' },
preview: { port: 5174, host: '127.0.0.1' },
```

**Why `127.0.0.1` and not `localhost`:** On Windows, `localhost` resolves to IPv6 (`::1`), but the dts-plugin forces IPv4 for its HTTP fetches. The mismatch makes the types download fail silently with "Failed to download types archive". `127.0.0.1` everywhere bypasses DNS and works on all platforms.

### 5. TypeScript types are generated, not hand-declared

The remote emits `.d.ts` files at build time (into `dist/@mf-types/`, packaged as `dist/@mf-types.zip`); the host downloads them at startup into `naufal-host/@mf-types/`. The host's `tsconfig.app.json` maps `lab/*` (and `@/*` for local source) to the generated types. `@mf-types/` is **gitignored** — a regenerated artifact.

> **TS 6.0 gotcha (cost us hours):** TypeScript 6.0 turns the deprecated `baseUrl` option into a **hard error** (TS5101). The MF dts-plugin generates a tsconfig that `extends` the remote's `tsconfig.json`, so a `baseUrl` anywhere in the remote's config chain makes type generation crash silently — no types reach the host, with only a `#TYPE-001` in the build log. Fix: add `"ignoreDeprecations": "6.0"` (band-aid) or remove `baseUrl` (it stops working entirely in TS 7).

### 6. Realtime presence via PartyKit

`Presence.svelte` is a federated component that opens its **own** WebSocket — the realtime layer rides inside a microfrontend.

- The PartyKit server (`naufal-party/src/server.ts`) is a tiny relay: on connect it assigns a colour + friendly name; on a cursor message it broadcasts `{ id, color, name, context, x, y }` to everyone else; on disconnect it broadcasts `leave`.
- The Svelte component connects with `partysocket`, sends normalized (0–1) cursor coords on `mousemove` (rAF-throttled), and renders peers' cursors with a name pill + origin tag.
- The socket is opened in a Svelte `$effect` and **closed in its teardown**, so federation's `unmount()` closes it cleanly — same cleanup-across-the-boundary story as the component itself.
- Both the host-embedded and standalone instances default to the same room, so cursors are shared **across deployments** — you can watch a `· host` cursor and a `· remote` cursor in the same canvas.

The host points at the server via `VITE_PARTY_HOST` (default `127.0.0.1:1999`), passed through `opts.host`.

### 7. Styling across the MF boundary

This is subtle and bit us. **CSS variables cross the boundary; Tailwind utility classes do not.**

- Remotes render into the host's DOM, so anything driven by CSS variables (the shadcn theme tokens: `--background`, `--primary`, `--border`, …) just works via the cascade — the host owns the values, the remote inherits them.
- But Tailwind **utility classes** (`border-emerald-500/40`, `bg-sky-400`, the shadcn Button classes) are concrete rules that live in the remote's **entry stylesheet**, which is linked only from the remote's standalone `index.html`. The federated chunk ships **no CSS**. Embedded, those classes only render if the host coincidentally generates the same ones (it uses emerald, so emerald worked; it never uses sky, so sky silently didn't).
- Fix used here: **import `app.css` inside the `.svelte` components** (`Counter.svelte`, `Presence.svelte`) so Tailwind ships with the federated chunk and the MF runtime injects it on consumption. Cost: the host loads a second Tailwind bundle + a duplicate preflight — benign because host and remote share the identical theme, but real weight that grows per remote.
- **Why inside the `.svelte` file, not the `.ts` mount adapter:** the dts-plugin's generated tsconfig compiles only the `.ts` mount adapters, extending the root `tsconfig.json` (not `tsconfig.app.json`). Without `vite/client` types in that chain, a bare `import '../app.css'` in `.ts` fails with `TS2882: Cannot find module … side-effect import of '../app.css'`. The `.svelte` file's `<script>` is processed by Svelte/Vite (not the dts tsc), so the import resolves there.
- Alternative: style federated components with CSS variables + inline styles only (no utilities). Robust and lean, but you give up Tailwind inside remotes.

### 8. Lazy loading via `loadRemote` (not `import('lab/X')`)

A subtle plugin behaviour: `@module-federation/vite` does **build-time static analysis** of every `import('lab/X')` literal it sees, collects them into a "used remotes" map, and emits them as `loadRemote(...)` preloads inside the host bootstrap proxy that wraps `main.tsx`. The generated proxy is roughly:

```js
(async () => {
  const { initHost } = await import(initSrc);
  const runtime = await initHost();
  await Promise.all([
    runtime.loadRemote("lab/Counter"),
    runtime.loadRemote("lab/Presence"),
  ]);
})().then(() => import("/src/main.tsx"));
```

So `main.tsx` doesn't run until every detected federated chunk has been fetched — over a slow link, this is hundreds of ms of blank page before React even mounts.

**Opt out by importing through the runtime instead:**

```ts
import { loadRemote } from "@module-federation/runtime";

const load = useCallback<() => Promise<typeof import("lab/Counter")>>(
  () => loadRemote("lab/Counter") as Promise<typeof import("lab/Counter")>,
  [],
);
```

The plugin's static scanner only sees `loadRemote('lab/Counter')` as a runtime function call with a string argument — it doesn't add it to the preload list. The `typeof import(...)` type cast is a TypeScript-only construct that gets erased before Vite's plugin runs, so it doesn't leak into the preload either. Result: `main.tsx` only waits on `initHost()` (a single small `remoteEntry.js` fetch), React mounts, blocks render skeletons, and each block's chunk loads lazily in parallel via `RemoteMount`'s `useEffect`.

### 9. Resilience: runtime plugin + error boundary

A failing `remoteEntry.js` fetch used to take down the host bootstrap (blank page) because the auto-init's rejection cascaded. Two layers prevent that now:

- **MF runtime plugin** ([`src/lib/mf-fallback-plugin.ts`](../naufal-host/src/lib/mf-fallback-plugin.ts)) hooks `errorLoadRemote`. For the auto-init failure (id = `"lab"`) it returns a benign stub so the host bootstrap completes and React mounts. For block-level loads (id = `"lab/Counter"`, etc.) it returns a stub whose `default` function **throws when called** — that propagates through `RemoteMount.then` into its `.catch`, flips `failed = true`, and renders the per-block `fallback` UI. Registered via `federation({ runtimePlugins: ['./src/lib/mf-fallback-plugin.ts'] })`.
- **Top-level `ErrorBoundary`** in [`src/main.tsx`](../naufal-host/src/main.tsx) catches React render errors and shows a small "Something went wrong" message instead of blanking. Plus a global `unhandledrejection` listener swallows any async failure that slips past everything else.

Outcome: a remote being completely offline now leaves the host fully usable, with per-block fallbacks shown where the federated content would have been.

### 10. Environment-aware deployment

The federation `entry` URL in the host's `vite.config.ts` is built from an env var via Vite's `loadEnv`:

```ts
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), "");
  const labUrl = env.VITE_LAB_URL || "http://127.0.0.1:5174";
  return {
    plugins: [
      // …
      federation({
        remotes: {
          lab: {
            type: "module",
            name: "lab",
            entry: `${labUrl}/remoteEntry.js`,
          },
        },
      }),
    ],
  };
});
```

`VITE_PARTY_HOST` flows through `import.meta.env` into the client (used by `PresenceBlock` for the PartyKit URL). Two npm scripts in `naufal-host`:

- `dev` → loads `.env.development.local` (none committed → defaults to `127.0.0.1`)
- `dev:tunnel` → `vite --mode tunnel`, loads `.env.tunnel.local` with the VS Code dev-tunnel URLs

The lab's `preview` and `server` configs set `cors: true` and `allowedHosts: true` so cross-origin script fetches from the host's tunnel origin work. (For production, tighten `cors` to the actual host origin and enumerate `allowedHosts`.)

### 11. Original lazy-import note

Even without the `loadRemote` opt-out above, remote chunks still load on demand at the call-site level — `RemoteMount`'s `useEffect` only fires the `load()` once it mounts. The `loadRemote` change is purely about getting `main.tsx` to **execute first**, not about whether the chunk loads eagerly vs lazily inside React's lifecycle.

### 12. React Compiler

The host runs `babel-plugin-react-compiler@1.0.0` over every `.tsx` / `.ts` source file during build (and dev). The compiler auto-memoizes components, hooks, and inline values — so the `useCallback` around `RemoteMount`'s `load` prop and the module-level `REMOTE_OPTS`/`PRESENCE_OPTS` constants are no longer required to keep the remote from remounting in a loop (see §2 callout). Inline `{ context: 'host' }` works.

The integration is **not** the documented `@vitejs/plugin-react` v6 path. The documented setup —

```ts
import react, { reactCompilerPreset } from "@vitejs/plugin-react";
import babel from "@rolldown/plugin-babel";

plugins: [react(), babel({ presets: [reactCompilerPreset()] })];
```

— builds cleanly but `@rolldown/plugin-babel`'s `transform` hook never fires for our source in this project. Verified by setting `panicThreshold: 'all_errors'`: a no-op build despite source that the compiler should reject. Likely an environment-handshake interaction with `@module-federation/vite`, but not pinned down.

The working substitute is a ~12-line custom Vite plugin in [`vite.config.ts`](../naufal-host/vite.config.ts) that calls `@babel/core`'s `transformAsync` directly with `babel-plugin-react-compiler`:

```ts
const reactCompilerPlugin = () => ({
  name: "react-compiler",
  enforce: "pre" as const,
  async transform(code: string, id: string) {
    if (!/\.[jt]sx?$/.test(id) || id.includes("node_modules")) return null;
    const result = await transformAsync(code, {
      filename: id,
      babelrc: false,
      configFile: false,
      plugins: [[reactCompiler, {}]],
      parserOpts: { sourceType: "module", plugins: ["typescript", "jsx"] },
    });
    return result?.code ? { code: result.code, map: result.map } : null;
  },
});
```

Registered first in the plugins array (before `react()`) so it runs `enforce: 'pre'`. Verified by an unminified build: `react/compiler-runtime` is imported and 26 source files get compiled. The compiler's lint rules (e.g. "Calling setState synchronously within an effect") are already on via `eslint-plugin-react-hooks` v7 — the standalone `eslint-plugin-react-compiler` package no longer exists; its rules were folded into `react-hooks` from v6 onward.

Deps: `babel-plugin-react-compiler`, `@babel/core` (via `@rolldown/plugin-babel`'s transitive install initially, kept after uninstall), `@types/babel__core` for TS.

### 13. Dark mode toggle (light / dark / system)

The architecture has been "ready" for dark mode since v0.1 (shadcn CSS variables, host owns the `.dark` class on `<html>`, remotes inherit through the cascade — zero coordination code). v0.2 ships the UI.

- [`src/lib/useTheme.ts`](../naufal-host/src/lib/useTheme.ts) — single hook. `theme: 'light' | 'dark' | 'system'` is the stored preference; `resolvedTheme: 'light' | 'dark'` is what's actually painted. A media-query listener tracks the OS pref so toggling the OS theme while in `system` mode flips the page live. The hook writes the class to `<html>` and the preference to `localStorage`.
- [`src/components/ThemeToggle.tsx`](../naufal-host/src/components/ThemeToggle.tsx) — shadcn `DropdownMenu` + `DropdownMenuRadioGroup`/`DropdownMenuRadioItem` triggered by a ghost-variant `Button` showing the current resolved icon (Sun / Moon). The built-in radio-item check indicator handles the "which is selected" display — no manual state-mirror.
- [`index.html`](../naufal-host/index.html) — a small inline `<script>` runs synchronously before any paint, mirrors `useTheme`'s read-the-same-storage logic, and sets `.dark` on `<html>` if needed. Paired with an inline `<style>` that paints `background-color` + `color-scheme` per class state. This kills both the white FOUC and the wrong-theme flash for return visitors (replaces what gotcha #13 used to be aspirational about — see below).
- [`index.css`](../naufal-host/src/index.css) — `scrollbar-gutter: stable` on `<html>`. Base-ui-react's portal locks body scroll when the dropdown opens; without the reserved gutter the page reflows by the scrollbar width every open/close. Cheap fix, side benefit for any future block that adds a scrollbar mid-session.

The standalone lab page (`localhost:5174`) stays dark-only — the toggle lives in the host because that's the integration surface that owns visitor preference. If the standalone ever needs its own toggle it's a separate small task on the Svelte side; the CSS-variable theme is already in place.

### 14. Scroll-reveal + deferred federated load

Two behaviours sharing one hook.

[`src/lib/useInView.ts`](../naufal-host/src/lib/useInView.ts) — ~25-line `IntersectionObserver` hook. Returns a `[ref, inView]` tuple, fires once, disconnects on first intersection. `rootMargin: '0px 0px -10% 0px'` so the threshold is slightly past viewport-entry, giving the animation room to play.

- **Cell entry animation:** [`Cell.tsx`](../naufal-host/src/components/Cell.tsx) wires the hook and toggles `translate-y-4 opacity-0 → translate-y-0 opacity-100` over `duration-700 ease-out`. `motion-reduce:` variants force the visible state immediately so reduced-motion users get no transition at all. Every block uses `<Cell>` so the reveal is automatic — no per-block plumbing.
- **Deferred federated load:** [`RemoteMount.tsx`](../naufal-host/src/components/RemoteMount.tsx) gates its `load()` effect on `inView`. The skeleton renders while the cell is below the fold; once the cell crosses the threshold the federated chunk fetches and the Svelte component mounts. Makes the MicrofrontendBlock's on-page copy ("fetched the moment it scrolled into view") literally accurate, and pushes the network cost of blocks the visitor never reaches down to zero.

The hook deliberately does **not** check `prefers-reduced-motion` — that preference belongs to the animation question, not the prefetching question. The CSS handles the motion side; the load gating runs regardless.

Above-the-fold cells (Hero, sometimes TechStack on tall screens) get a one-frame paint at `opacity-0` before the observer's first callback fires, then the 700ms fade begins. The eye reads it as "thing appears" rather than "thing was missing." A pre-paint synchronous viewport check in `useLayoutEffect` would eliminate that frame but trips `eslint-plugin-react-hooks` v7's "setState synchronously within an effect" rule, so it's not worth it.

---

## Running Locally

Three processes. The remote must be served as a **built** bundle — `@module-federation/vite` generates `remoteEntry.js` at build time, so plain `vite dev` does not work for the remote.

```bash
# terminal 1 — remote: build watcher + preview server (combined via concurrently)
cd naufal-lab && npm run dev:mf      # vite build --watch + vite preview --port 5174

# terminal 2 — realtime server
cd naufal-party && npm run dev       # partykit dev → 127.0.0.1:1999

# terminal 3 — host
cd naufal-host && npm run dev        # http://localhost:5173
```

Open `http://localhost:5173`. Open a second tab (or `http://127.0.0.1:5174` standalone) to see multiplayer cursors.

**Dev reload:** true HMR isn't possible across the MF boundary. A small plugin in the host's `vite.config.ts` watches `../naufal-lab/dist/` and triggers a host full-page reload when the remote rebuilds (~200–500ms).

**Fresh clone:** because `@mf-types/` is gitignored, the host's TypeScript shows "cannot find module" until the remote has been built + served once and the host has fetched the types. Run the remote before the host on first setup.

---

## Key Design Decisions

- **Mount-function pattern** over exposing components directly: framework-agnostic, keeps the Svelte runtime out of the host bundle. Reused for every remote regardless of framework.
- **Generic `RemoteMount`** over per-remote wrappers: one component handles every remote, plus load status + graceful fallback.
- **`opts` carries context** across the boundary as a plain object — the forward-compatible hook (originally floated for `locale`).
- **Realtime inside a microfrontend**: `Presence` proves a federated remote can own a live WebSocket and share state across deployments.
- **Ship CSS with the exposed entry** so Tailwind works embedded (theme via CSS vars, utilities via shipped stylesheet).
- **No shared Svelte**: `shared: []` — Svelte is fully bundled into the remote. Host shares only `react` / `react-dom`.
- **`build.target: 'chrome89'`** on both sides: required by `@module-federation/vite` (native ES modules + top-level `await`).
- **`127.0.0.1` everywhere**: avoids the Windows IPv6 / dts-plugin IPv4 mismatch.
- **React Compiler via a ~12-line custom plugin**, not `@rolldown/plugin-babel`. The documented integration is silently inert in this project (federation + plugin-react v6 interaction); see §12.
- **Theme toggle lives on the host, not in any remote**. CSS variables + `.dark` class cascade from the host's `<html>` into every remote's mounted DOM — zero coordination code. See §13.
- **Scroll-reveal is plain `IntersectionObserver` + CSS transition**, not Framer Motion (or any animation library). Same hook gates `RemoteMount`'s federated `load()` on viewport entry, so blocks below the fold cost zero network. See §14.

---

## Gotchas Already Solved (don't re-discover)

1. **Svelte 5 `new Component()` is gone** — use `mount()` / `unmount()`, wrapped in a mount adapter.
2. **Windows + dts + `localhost` = silent failure** — dts-plugin forces IPv4; use `127.0.0.1` everywhere.
3. **Remote runs with `vite build --watch` + `vite preview`, not `vite dev`** — `remoteEntry.js` only exists in a build.
4. **No HMR across the boundary** — host plugin watches `../naufal-lab/dist/` and sends `{ type: 'full-reload' }`.
5. **React Strict Mode double-mounts** the remote (mount → unmount → remount to verify cleanup). Intentional; don't disable.
6. **`@mf-types/` is gitignored** — first run on a fresh clone shows "cannot find module" until the host fetches once.
7. **TS 6.0 `baseUrl` is a hard error (TS5101)** that silently kills DTS generation through the dts-plugin's inherited tsconfig. Add `ignoreDeprecations: "6.0"` or remove `baseUrl`.
8. **`vite build --watch` does NOT reload `vite.config.ts`** — unlike `vite dev`. After changing `exposes` (or any config), restart the build process or the change never takes effect.
9. **Tailwind utility classes don't cross the MF boundary** — they live in the remote's entry stylesheet. Import the stylesheet **inside the `.svelte` component** (not the `.ts` mount adapter) so it ships with the chunk and the dts tsc doesn't choke on the side-effect CSS import.
10. **The plugin eagerly preloads every `import('lab/X')` literal it finds**, blocking `main.tsx` until all of them are fetched. Use `loadRemote('lab/X')` from `@module-federation/runtime` for block-level loads to opt out — only the small `remoteEntry.js` then blocks bootstrap, chunks load lazily after React mounts.
11. **`hostInitInjectLocation` already defaults to `'html'`** — setting it explicitly is a no-op. The blank-on-startup problem isn't this option; it's the eager-preload behaviour above.
12. **MF plugin rewrites `import('...')` literals even inside comments.** If you write `import('lab/Counter')` in a `.ts` source comment, Vite's import analysis tries to transform it and the file breaks with `Failed to parse source for import analysis`. Phrase code in prose as `lab/Counter` (no `import()` wrapper).
13. **First-paint white flash isn't MF** — even with MF fully lazy, the browser paints `index.html` before the JS bundle downloads/parses. Mitigated by an inline `<style>` in `<head>` setting `background-color` + `color-scheme` per `html` / `html.dark`, plus an inline `<script>` that resolves the user's stored theme + system preference and sets the class **before** the style is parsed (so the first frame is the right theme, not just _a_ theme). See §13.
14. **DTS-generated tsconfig only extends the root `tsconfig.json`**, not `tsconfig.app.json`. Anything that lives only in the app config (`vite/client` types, svelte types, strict settings) is invisible to type generation — so e.g. side-effect CSS imports in a `.ts` mount adapter fail with `TS2882`. Either put the import in the `.svelte` file, or add the needed types to the root config so the dts tsc sees them.
15. **`@rolldown/plugin-babel` + `reactCompilerPreset` silently does nothing in this project.** The documented Vite 8 / plugin-react v6 path for the React Compiler builds cleanly and reports no errors but never runs the babel transform on any source file (likely an interaction with `@module-federation/vite`'s environment handling, not pinned down). Verify by setting `panicThreshold: 'all_errors'` — if the build still succeeds on any non-trivial source, babel isn't running. Replace with a ~12-line custom Vite plugin calling `@babel/core` directly (see §12).
16. **iOS Safari mobile-tap on a non-focusable element doesn't blur a focused button.** Patterns built on the button's `onBlur` to detect "tapped somewhere outside" (e.g., to deselect, close a popover, dismiss state) silently fail on iOS — focus stays on the previously-tapped button, blur never fires, the stale state persists. Workaround: register a document-level `touchstart` listener and run the deselect when the event target is outside your component's container. Use **capture phase** (`{ capture: true }`) so descendants calling `stopPropagation` (base-ui-react's Menu trigger does this) can't swallow it. Also force-reset any "interaction in progress" refs in the same handler — multi-touch and scroll-promotion sequences can leave them stuck `true`, which would defeat the deselect. See [TechStackBlock.tsx](../naufal-host/src/components/blocks/TechStackBlock.tsx) for the pattern.
