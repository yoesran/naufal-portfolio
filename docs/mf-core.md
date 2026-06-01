# Module Federation — Core Mechanics

> The runtime contract between host and remote. See [overview.md](./overview.md) for the big picture, [mf-platform.md](./mf-platform.md) for styling/resilience/deploy, and [gotchas.md](./gotchas.md) for the traps.

## 1. The remote exposes a mount function, not a component

The host is React and the remote is Svelte — they can't import each other's component format. Each exposed module is a plain function with a framework-agnostic signature `(target, opts?) => cleanup`:

```ts
// naufal-lab/src/lib/mountCounter.ts
import { mount, unmount } from "svelte";
import "../app.css"; // ships the remote's Tailwind over federation — see mf-platform.md
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

**Svelte 5 note:** Svelte 5 components are functions, not classes. The Svelte 4 API `new Counter({ target })` fails with misleading errors (`Cannot read properties of null (reading 'nodes')`). Use `mount()` / `unmount()`. See [gotchas.md](./gotchas.md).

## 2. The host wraps it in a generic React component

`RemoteMount.tsx` works for any remote that exposes `(target, opts?) => cleanup`. It also tracks load status, times the load, forwards `opts`, gates loading on viewport entry (see [features.md](./features.md) scroll-reveal), and renders a fallback when the remote is unreachable:

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

> **Stable props matter** (mostly handled for us now). `load` and `opts` are in the effect deps. An inline object/function changes identity every render and would remount the remote in a loop once the block has state. The React Compiler (see [features.md](./features.md)) memoizes these automatically — inline objects in JSX work without a `useCallback` or module-level constant. Module-level constants still work and remain readable for the host-only `opts`/`load` pair in `PresenceBlock`; either pattern is fine.

## 3. The `opts` contract — passing context across the boundary

The mount signature's `opts` object is how the host hands data to a remote without caring about its framework. We use it to tell each component **where it's running**:

- The host passes `{ context: 'host' }`; the standalone `App.svelte` passes `context="standalone"`.
- `Counter` uses it to colour its glow (emerald embedded, sky standalone) and label itself.
- `Presence` sends its `context` with every cursor message, so each live cursor is tagged `· host` or `· remote`.

`opts` is deliberately typed `Record<string, unknown>` at the boundary (not a specific interface). It crosses a runtime boundary as a plain object, and a loosely-typed param keeps the remote's generated mount type assignable to `RemoteMount`'s generic `MountFn` (a specific opts type fails parameter-contravariance once the host refetches types). The remote narrows it internally. The same `opts` channel is the forward-compat hook for `locale` (see [features.md](./features.md)).

## 4. Vite Module Federation config

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

The host's `entry` is actually built from an env var (`VITE_LAB_URL`) via `loadEnv` for environment-aware deployment — see [mf-platform.md](./mf-platform.md).

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

**Why `127.0.0.1` and not `localhost`:** On Windows, `localhost` resolves to IPv6 (`::1`), but the dts-plugin forces IPv4 for its HTTP fetches. The mismatch makes the types download fail silently with "Failed to download types archive". `127.0.0.1` everywhere bypasses DNS and works on all platforms. See [gotchas.md](./gotchas.md).

Both sides set `build: { target: 'chrome89' }` — required by `@module-federation/vite` (native ES modules + top-level `await`).

## 5. TypeScript types are generated, not hand-declared

The remote emits `.d.ts` files at build time (into `dist/@mf-types/`, packaged as `dist/@mf-types.zip`); the host downloads them at startup into `naufal-host/@mf-types/`. The host's `tsconfig.app.json` maps `lab/*` (and `@/*` for local source) to the generated types. `@mf-types/` is **gitignored** — a regenerated artifact.

The catch-all `"*": ["./@mf-types/*"]` path means new remotes work without further tsconfig edits. Tradeoff: typo'd imports may resolve to `any` instead of erroring. Acceptable at this scale.

> **TS 6.0 gotcha (cost us hours):** TypeScript 6.0 turns the deprecated `baseUrl` option into a **hard error** (TS5101). The MF dts-plugin generates a tsconfig that `extends` the remote's `tsconfig.json`, so a `baseUrl` anywhere in the remote's config chain makes type generation crash silently — no types reach the host, with only a `#TYPE-001` in the build log. Fix: add `"ignoreDeprecations": "6.0"` (band-aid) or remove `baseUrl` (it stops working entirely in TS 7). See [gotchas.md](./gotchas.md).
