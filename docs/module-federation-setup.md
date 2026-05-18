# Module Federation Setup: React Host + Svelte Remote

## Overview

This document explains the Module Federation architecture introduced to connect `naufal-host` (React) and `naufal-lab` (Svelte) as two independently deployable apps that share UI at runtime.

---

## What Changed

### `naufal-host` — React Host

| File | Change |
|---|---|
| `package.json` | Added `@module-federation/vite` dependency |
| `vite.config.ts` | Configured as a **host**, consuming the `lab` remote |
| `src/App.tsx` | Added a toggle button that lazily loads `LabRemote` |
| `src/components/LabRemote.tsx` | New — React wrapper that mounts the Svelte Counter |
| `src/types/remotes.d.ts` | New — TypeScript module declaration for `lab/Counter` |

### `naufal-lab` — Svelte Remote

| File | Change |
|---|---|
| `package.json` | Added `@module-federation/vite` dependency |
| `vite.config.ts` | Configured as a **remote**, exposing `./Counter` |
| `src/lib/Counter.svelte` | Updated — the component being exposed |
| `src/lib/mountCounter.ts` | New — imperative mount adapter for framework-agnostic consumption |

---

## Architecture

```
┌─────────────────────────────────┐       runtime import
│  naufal-host  (React, :5173)    │ ──────────────────────────►  naufal-lab  (Svelte, :5174)
│                                 │       lab/Counter                │
│  App.tsx                        │                                  │
│    └─ lazy LabRemote            │                                  │
│         └─ useEffect            │◄── mountCounter(el) ────────────┘
│              └─ div ref         │     returns cleanup()
└─────────────────────────────────┘
```

The host and remote run as **separate processes** (separate `vite dev` servers). The host fetches the remote's module bundle at runtime from `http://localhost:5174/remoteEntry.js` — no build-time coupling.

---

## How It Works

### 1. The Remote exposes a mount function, not a component

Because the host is React and the remote is Svelte, they cannot directly import each other's component format. To bridge the framework gap, `naufal-lab` exposes a plain JavaScript function via `mountCounter.ts`:

```ts
// naufal-lab/src/lib/mountCounter.ts
import { mount, unmount } from "svelte";
import Counter from "./Counter.svelte";

export default function mountCounter(target: HTMLElement) {
  const instance = mount(Counter, { target });
  return () => unmount(instance);
}
```

This function takes a real DOM element, mounts the Svelte component into it, and returns a cleanup function. It is framework-agnostic — the caller doesn't need to know it's Svelte.

### 2. The Host wraps it in a React component

`LabRemote.tsx` uses `useRef` to get a DOM node and `useEffect` to call the mount function after render:

```tsx
// naufal-host/src/components/LabRemote.tsx
export function LabRemote() {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let cleanup: (() => void) | undefined;
    (async () => {
      const mountCounter = (await import("lab/Counter")).default;
      if (ref.current) cleanup = mountCounter(ref.current);
    })();
    return () => { cleanup?.(); };
  }, []);

  return <div ref={ref} />;
}
```

The cleanup function returned by `mountCounter` is called on unmount, so the Svelte component is properly destroyed when React removes `LabRemote` from the tree.

### 3. Vite Module Federation config

**Host** (`naufal-host/vite.config.ts`) — declares the remote endpoint:
```ts
federation({
  name: 'host',
  remotes: {
    lab: {
      type: 'module',
      name: 'lab',
      entry: 'http://localhost:5174/remoteEntry.js',
    },
  },
  shared: ['react', 'react-dom'],
})
```

**Remote** (`naufal-lab/vite.config.ts`) — declares what it exposes:
```ts
federation({
  name: 'lab',
  filename: 'remoteEntry.js',
  exposes: {
    './Counter': './src/lib/mountCounter.ts',
  },
  shared: [],
})
```

### 4. TypeScript declaration

Because `lab/Counter` is resolved at runtime, TypeScript doesn't know its shape. A minimal ambient declaration in `src/types/remotes.d.ts` silences the type error:

```ts
declare module 'lab/Counter';
```

### 5. Lazy loading in App

`LabRemote` itself is code-split with `React.lazy` so the federation chunk isn't downloaded until the user clicks the button:

```tsx
const LabRemote = lazy(() =>
  import("./components/LabRemote").then((m) => ({ default: m.LabRemote }))
);
```

---

## Running Locally

Start both apps in separate terminals:

```bash
# terminal 1 — remote (must start first so its entry is available)
cd naufal-lab && npm run dev   # http://localhost:5174

# terminal 2 — host
cd naufal-host && npm run dev  # http://localhost:5173
```

Open `http://localhost:5173`, click **"Load lab remote"** — the Svelte Counter mounts inside the React app.

---

## Key Design Decisions

- **Mount-function pattern** over exposing a Svelte component directly: keeps the contract framework-agnostic and avoids Svelte runtime leaking into the host bundle.
- **No shared Svelte**: `shared: []` in the remote config means Svelte is fully bundled into the remote — correct, since the host has no use for Svelte.
- **`build.target: 'chrome89'`** on both sides: required by `@module-federation/vite` which uses native ES modules and top-level `await`.
