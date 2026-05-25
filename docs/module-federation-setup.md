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

| File                                           | Role                                                                                 |
| ---------------------------------------------- | ------------------------------------------------------------------------------------ |
| `vite.config.ts`                               | Configured as a **host**, consuming the `lab` remote                                 |
| `src/App.tsx`                                  | The home-page playground — stacks `Cell` blocks                                      |
| `src/components/Cell.tsx`                      | The frame primitive: bordered card + monospace label, every block sits in one        |
| `src/components/RemoteMount.tsx`               | Generic wrapper that mounts any framework-agnostic remote (status + fallback + opts) |
| `src/components/blocks/MicrofrontendBlock.tsx` | Block: live Counter + host⇄remote diagram + load status + simulate-offline toggle    |
| `src/components/blocks/PresenceBlock.tsx`      | Block: loads `lab/Presence` (multiplayer cursors)                                    |
| `src/vite-env.d.ts`                            | Types `VITE_LAB_URL` / `VITE_PARTY_HOST` env vars                                    |
| `tsconfig.app.json`                            | `paths` mapping so federated imports resolve to generated types                      |
| `@mf-types/`                                   | Auto-generated, gitignored — downloaded remote type declarations                     |

### `naufal-lab` — Svelte Remote (port 5174)

| File                       | Role                                                                                                                              |
| -------------------------- | --------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`           | Configured as a **remote**, exposing `./Counter` and `./Presence`                                                                 |
| `src/lib/Counter.svelte`   | Context-aware component: a cursor-following glow + counter                                                                        |
| `src/lib/mountCounter.ts`  | Mount adapter for `./Counter`                                                                                                     |
| `src/lib/Presence.svelte`  | Multiplayer cursor canvas — opens its own `PartySocket` connection                                                                |
| `src/lib/mountPresence.ts` | Mount adapter for `./Presence`                                                                                                    |
| `src/App.svelte`           | Standalone page showcasing both exposed components                                                                                |
| `src/app.css`              | Tailwind + shadcn theme — **imported by the mount adapters** so the CSS ships over federation (see "Styling across the boundary") |

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

> **Stable props matter.** `load` and `opts` are in the effect deps. Pass them as memoized/module-level constants (`useCallback`, a module const) — an inline object/function changes identity every render and would remount the remote in a loop once the block has state.

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
- Fix used here: **import `app.css` in the exposed mount adapters** (`mountCounter.ts`, `mountPresence.ts`) so Tailwind ships with the federated chunk and the MF runtime injects it on consumption. Cost: the host loads a second Tailwind bundle + a duplicate preflight — benign because host and remote share the identical theme, but real weight that grows per remote.
- Alternative: style federated components with CSS variables + inline styles only (no utilities). Robust and lean, but you give up Tailwind inside remotes.

### 8. Lazy loading

Remote chunks load on demand. The dynamic `import('lab/Counter')` inside `RemoteMount` triggers the network fetch — `remoteEntry.js` plus the exposed module's chunk graph (and now its CSS) — so a visitor only pays for a remote when it renders.

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
9. **Tailwind utility classes don't cross the MF boundary** — they live in the remote's entry stylesheet. Import the stylesheet in the exposed entry to ship it with the chunk, or style remotes with CSS variables only.
