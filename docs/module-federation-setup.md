# Module Federation Setup: React Host + Svelte Remote

## Overview

This document explains the Module Federation architecture connecting `naufal-host` (React) and `naufal-lab` (Svelte) as two independently deployable apps that share UI at runtime.

It uses `@module-federation/vite` — the actively maintained, framework-agnostic plugin. (The older `@module-federation/nextjs-mf` is being deprecated and was deliberately not used.)

---

## What Each Project Contains

### `naufal-host` — React Host (port 5173)

| File                             | Role                                                             |
| -------------------------------- | ---------------------------------------------------------------- |
| `package.json`                   | Includes `@module-federation/vite`                               |
| `vite.config.ts`                 | Configured as a **host**, consuming the `lab` remote             |
| `src/App.tsx`                    | Renders the home-page playground; embeds remotes via RemoteMount |
| `src/components/RemoteMount.tsx` | Generic wrapper that mounts any framework-agnostic remote        |
| `tsconfig.app.json`              | `paths` mapping so federated imports resolve to generated types  |
| `@mf-types/`                     | Auto-generated, gitignored — downloaded remote type declarations |

There is no longer a per-remote `LabRemote.tsx`. It was replaced by the generic `RemoteMount` wrapper. There is no longer a manual `src/types/remotes.d.ts` — generated types replaced it.

### `naufal-lab` — Svelte Remote (port 5174)

| File                      | Role                                                     |
| ------------------------- | -------------------------------------------------------- |
| `package.json`            | Includes `@module-federation/vite`                       |
| `vite.config.ts`          | Configured as a **remote**, exposing `./Counter`         |
| `src/lib/Counter.svelte`  | The Svelte component being exposed                       |
| `src/lib/mountCounter.ts` | Imperative mount adapter — the framework-agnostic export |

---

## Architecture

```
┌─────────────────────────────────┐     runtime import
│  naufal-host  (React, :5173)    │ ──────────────────────────►  naufal-lab  (Svelte, :5174)
│                                 │     lab/Counter                  │
│  App.tsx                        │                                  │
│    └─ RemoteMount               │                                  │
│         └─ useEffect            │◄── mountCounter(el) ─────────────┘
│              └─ div ref         │     returns cleanup()
└─────────────────────────────────┘
```

The host and remote run as **separate processes** with no build-time coupling. The host fetches the remote's bundle at runtime from `http://127.0.0.1:5174/remoteEntry.js`.

---

## How It Works

### 1. The Remote exposes a mount function, not a component

The host is React and the remote is Svelte — they cannot directly import each other's component format. To bridge the framework gap, `naufal-lab` exposes a plain JavaScript function:

```ts
// naufal-lab/src/lib/mountCounter.ts
import { mount, unmount } from 'svelte';
import Counter from './Counter.svelte';

export default function mountCounter(target: HTMLElement) {
  const instance = mount(Counter, { target });
  return () => unmount(instance);
}
```

It takes a real DOM element, mounts the Svelte component into it, and returns a cleanup function. The caller never needs to know it's Svelte. This same `(target) => cleanup` contract works for Angular, Vue, or vanilla JS remotes too.

**Svelte 5 note:** Svelte 5 components are functions, not classes. The Svelte 4 API `new Counter({ target })` fails here with misleading errors (`Cannot read properties of null (reading 'nodes')`). Use `mount()` / `unmount()` from `svelte` as above.

### 2. The Host wraps it in a generic React component

`RemoteMount.tsx` is framework-agnostic — it works for any remote that exposes a `(target) => cleanup` function. It is not specific to the lab remote.

```tsx
// naufal-host/src/components/RemoteMount.tsx
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

Usage:

```tsx
<RemoteMount load={() => import('lab/Counter')} />
```

The cleanup function is called on unmount, so the Svelte component is properly destroyed when React removes the wrapper from the tree.

### 3. Vite Module Federation config

**Host** (`naufal-host/vite.config.ts`) — declares the remote endpoint and type consumption:

```ts
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
});
```

**Remote** (`naufal-lab/vite.config.ts`) — declares what it exposes and type generation:

```ts
federation({
  name: 'lab',
  filename: 'remoteEntry.js',
  exposes: {
    './Counter': './src/lib/mountCounter.ts',
  },
  dts: {
    generateTypes: true,
    consumeTypes: false,
    displayErrorInTerminal: true,
  },
  shared: [],
});
```

The remote also pins its dev/preview server to `127.0.0.1`:

```ts
server:  { port: 5174, host: '127.0.0.1', origin: 'http://127.0.0.1:5174' },
preview: { port: 5174, host: '127.0.0.1' },
```

**Why `127.0.0.1` and not `localhost`:** On Windows, `localhost` resolves to IPv6 (`::1`) by default, but the dts-plugin forces IPv4 for its HTTP fetches. The mismatch makes the types download fail silently with "Failed to download types archive". Using `127.0.0.1` everywhere bypasses DNS resolution and works on all platforms.

### 4. TypeScript types are generated, not hand-declared

There is no manual `remotes.d.ts`. The remote emits `.d.ts` files at build time (into `dist/@mf-types/`, packaged as `dist/@mf-types.zip`); the host downloads them at startup into `naufal-host/@mf-types/`.

For TypeScript to resolve federated imports to those files, `tsconfig.app.json` has:

```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": { "*": ["./@mf-types/*"] }
  },
  "include": ["src", "@mf-types"]
}
```

The catch-all `paths` entry means new remotes need no further tsconfig edits — `import 'dashboard/Widget'` resolves to `@mf-types/dashboard/Widget` automatically.

`@mf-types/` is **gitignored** — it's a regenerated artifact like `node_modules` or `dist`.

### 5. Lazy loading

Remote chunks load on demand. The dynamic `import('lab/Counter')` inside `RemoteMount` is what triggers the network fetch — `remoteEntry.js` plus the exposed module's chunk graph — so a visitor only pays the cost of a remote when it actually renders.

---

## Running Locally

The remote must be served as a **built** bundle — `@module-federation/vite` generates `remoteEntry.js` at build time, so plain `vite dev` does not work for the remote.

```bash
# terminal 1 — remote build watcher
cd naufal-lab && npx vite build --watch

# terminal 2 — remote preview server (serves the built remoteEntry.js)
cd naufal-lab && npx vite preview --port 5174

# terminal 3 — host (normal dev server)
cd naufal-host && npm run dev   # http://localhost:5173
```

(The two remote terminals can be combined with `concurrently`.)

Open `http://localhost:5173` — the Svelte Counter mounts inside the React app via `RemoteMount`.

**Dev reload:** true HMR isn't possible across the MF boundary. Instead, a small custom plugin in the host's `vite.config.ts` watches `../naufal-lab/dist/` and triggers a host full-page reload when the remote rebuilds. Remote rebuilds are typically 200-500ms, so editing the Svelte component feels close to normal dev.

**Fresh clone:** because `@mf-types/` is gitignored, the host's TypeScript shows "cannot find module" errors until the remote has been built and served once and the host has fetched the types. Run the remote (build + preview) before the host on first setup.

---

## Key Design Decisions

- **Mount-function pattern** over exposing a Svelte component directly: keeps the contract framework-agnostic and prevents the Svelte runtime from leaking into the host bundle. The same `(target) => cleanup` contract is reused for every future remote regardless of framework.
- **Generic `RemoteMount`** over per-remote wrappers: one component handles every remote. Adding a remote needs no new wrapper code.
- **No shared Svelte**: `shared: []` in the remote means Svelte is fully bundled into the remote — correct, since the host has no use for Svelte. The host shares only `react` / `react-dom`.
- **`build.target: 'chrome89'`** on both sides: required by `@module-federation/vite`, which relies on native ES modules and top-level `await`.
- **`127.0.0.1` everywhere**: avoids the Windows IPv6 / dts-plugin IPv4 mismatch.
