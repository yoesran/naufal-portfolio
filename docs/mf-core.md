# Module Federation — Core Mechanics

> The runtime contract between host and remote. See [overview.md](./overview.md) for the big picture, [mf-platform.md](./mf-platform.md) for styling/resilience/deploy, and [gotchas.md](./gotchas.md) for the traps.

## 1. The remote exposes a mount function, not a component

The host is React and the remote is Svelte — they can't import each other's component format. Each exposed module is a plain function with a framework-agnostic signature `(target, opts?) => cleanup`:

```ts
// naufal-lab/src/lib/mountSpringToy.ts
import { mount, unmount } from "svelte";
import "../app.css"; // ships the remote's Tailwind over federation — see mf-platform.md
import SpringToy from "./SpringToy.svelte";

export default function mountSpringToy(
  target: HTMLElement,
  opts: Record<string, unknown> = {},
) {
  const context = opts.context === "standalone" ? "standalone" : "host";
  const instance = mount(SpringToy, { target, props: { context } });
  return () => unmount(instance);
}
```

It mounts the Svelte component into a real DOM element and returns a cleanup function. The caller never needs to know it's Svelte. This same contract works for Angular, Vue, or vanilla JS remotes.

**Svelte 5 note:** Svelte 5 components are functions, not classes. The Svelte 4 API `new SpringToy({ target })` fails with misleading errors (`Cannot read properties of null (reading 'nodes')`). Use `mount()` / `unmount()`. See [gotchas.md](./gotchas.md).

## 2. The host wraps it in a generic React component

`RemoteMount.tsx` works for any remote that exposes `(target, opts?) => cleanup`. It tracks load status, forwards `opts`, gates loading on viewport entry (see [features.md](./features.md) scroll-reveal) unless `eager`, and renders a fallback when the remote is unreachable:

```tsx
// naufal-host/src/components/RemoteMount.tsx (abridged)
export function RemoteMount({
  load,
  fallback,
  onStatusChange,
  opts,
  eager = false,
}: {
  load: () => Promise<{ default: MountFn }>;
  fallback?: React.ReactNode;
  onStatusChange?: (status: RemoteStatus) => void;
  opts?: Record<string, unknown>;
  eager?: boolean;
}) {
  const [outerRef, inView] = useInView<HTMLDivElement>();
  const shouldLoad = eager || inView;
  const mountRef = useRef<HTMLDivElement>(null);
  const [failed, setFailed] = useState(false);

  // Latest props in refs so the mount effect can depend on `shouldLoad` alone.
  const loadRef = useRef(load);
  const optsRef = useRef(opts);
  const onStatusRef = useRef(onStatusChange);
  useEffect(() => {
    loadRef.current = load;
    optsRef.current = opts;
    onStatusRef.current = onStatusChange;
  });

  useEffect(() => {
    if (!shouldLoad) return;
    let cleanup: (() => void) | undefined;
    let cancelled = false;
    onStatusRef.current?.({ state: "loading" });
    loadRef
      .current()
      .then((m) => {
        if (cancelled || !mountRef.current) return;
        cleanup = m.default(mountRef.current, optsRef.current);
        onStatusRef.current?.({ state: "loaded" });
      })
      .catch((error) => {
        if (!cancelled) {
          setFailed(true);
          onStatusRef.current?.({ state: "error", error });
        }
      });
    return () => {
      cancelled = true;
      cleanup?.();
    };
  }, [shouldLoad]);

  if (failed && fallback) return <div ref={outerRef}>{fallback}</div>;
  return (
    <div ref={outerRef}>
      <div ref={mountRef} />
    </div>
  );
}
```

Usage:

```tsx
<RemoteMount
  load={() => loadRemote("lab/SpringToy")}
  opts={{ context: "host" }}
  eager
/>
```

The cleanup runs on unmount, so the Svelte component (and any WebSocket it opened) tears down cleanly.

> **Why the refs?** `load` / `opts` / `onStatusChange` are usually passed as inline literals, so their identity changes every render. If the mount effect listed them as deps it would re-run — and because the effect calls `setState` via `onStatusChange`, that's a re-mount loop. So the effect is gated on `shouldLoad` (`eager || inView`) **alone**, reading the latest props through refs. The React Compiler (see [features.md](./features.md)) happens to memoize those inline literals too, but correctness no longer depends on it.

## 3. The `opts` contract — passing context across the boundary

The mount signature's `opts` object is how the host hands data to a remote without caring about its framework. We use it to tell each component **where it's running**:

- The host passes `{ context: 'host' }`; the standalone `App.svelte` passes `context="standalone"`.
- `SpringToy` uses it to colour its label/accent (brand embedded, sky standalone) and label itself.
- `Presence` sends its `context` with every cursor message, so each live cursor is tagged `· host` or `· remote`.

`opts` is deliberately typed `Record<string, unknown>` at the boundary (not a specific interface). It crosses a runtime boundary as a plain object, and a loosely-typed param keeps the remote's generated mount type assignable to `RemoteMount`'s generic `MountFn` (a specific opts type fails parameter-contravariance once the host refetches types). The remote narrows it internally. The same `opts` channel is the forward-compat hook for `locale` (see [features.md](./features.md)).

## 4. Vite Module Federation config

**Host** (`naufal-host/vite.config.ts`):

```ts
federation({
  name: "host",
  // NO `remotes` here — deliberate. A build-config remote gets its
  // remoteEntry.js fetched inside the generated bootstrap, before the app
  // entry executes (first-paint cost; a stall when the lab is down).
  runtimePlugins: ["./src/lib/mf-fallback-plugin.ts"],
  shared: ["react", "react-dom"],
});
```

The lab is instead **registered at runtime, on first use** — `src/lib/lab-remote.ts` exports `ensureLabRemote()`, a one-shot `registerRemotes()` of `{ name: 'lab', type: 'module', entry: LAB_URL + '/remoteEntry.js' }`, called by `LiveRemoteBlock` and `PresenceOverlay` right before their `loadRemote`. The entry URL comes from `VITE_LAB_URL` (env-aware deployment — see [mf-platform.md](./mf-platform.md) for the first-paint measurements behind this).

**Remote** (`naufal-lab/vite.config.ts`):

```ts
federation({
  name: "lab",
  filename: "remoteEntry.js",
  exposes: {
    "./SpringToy": "./src/lib/mountSpringToy.ts",
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

## 5. TypeScript types are hand-declared (the contract is the API)

`naufal-host/src/types/lab.d.ts` declares `lab/SpringToy` and `lab/Presence` by hand — two one-line `declare module` blocks with the mount signature. That's the whole typed surface, and it's deliberate: since the lab left the build-config `remotes` (§4), the dts-plugin's auto-download had no trigger, and a fresh clone must type-check without the lab ever running. The mount contract is tiny and stable, so a hand-written declaration is *less* machinery, not more risk — if the lab exposes a new module, add its line.

(The previous flow — remote `generateTypes` → host `consumeTypes` downloading `@mf-types/` in dev — still works if you temporarily restore `remotes` + `dts` in the host config; useful as a one-off cross-check that the hand-written contract hasn't drifted. The remote still emits `dist/@mf-types.zip` for any future consumer.)

> **TS 6.0 gotcha (cost us hours):** TypeScript 6.0 turns the deprecated `baseUrl` option into a **hard error** (TS5101). The MF dts-plugin generates a tsconfig that `extends` the remote's `tsconfig.json`, so a `baseUrl` anywhere in the remote's config chain makes type generation crash silently — no types reach the host, with only a `#TYPE-001` in the build log. Fix: add `"ignoreDeprecations": "6.0"` (band-aid) or remove `baseUrl` (it stops working entirely in TS 7). See [gotchas.md](./gotchas.md).
