# Module Federation — Platform Concerns

> Cross-cutting concerns that sit on top of the [core mechanics](./mf-core.md): styling across the boundary, resilience, lazy loading, and deployment. See [gotchas.md](./gotchas.md) for the condensed traps.

## Styling across the MF boundary

This is subtle and bit us. **CSS variables cross the boundary; Tailwind utility classes do not.**

- Remotes render into the host's DOM, so anything driven by CSS variables (the shadcn theme tokens: `--background`, `--primary`, `--border`, …) just works via the cascade — the host owns the values, the remote inherits them.
- But Tailwind **utility classes** (`border-emerald-500/40`, `bg-sky-400`, the shadcn Button classes) are concrete rules that live in the remote's **entry stylesheet**, which is linked only from the remote's standalone `index.html`. The federated chunk ships **no CSS**. Embedded, those classes only render if the host coincidentally generates the same ones (it uses emerald, so emerald worked; it never uses sky, so sky silently didn't).
- Fix used here: **import `app.css` inside the `.svelte` components** (`Counter.svelte`, `Presence.svelte`) so Tailwind ships with the federated chunk and the MF runtime injects it on consumption. Cost: the host loads a second Tailwind bundle + a duplicate preflight — benign because host and remote share the identical theme, but real weight that grows per remote.
- **Why inside the `.svelte` file, not the `.ts` mount adapter:** the dts-plugin's generated tsconfig compiles only the `.ts` mount adapters, extending the root `tsconfig.json` (not `tsconfig.app.json`). Without `vite/client` types in that chain, a bare `import '../app.css'` in `.ts` fails with `TS2882: Cannot find module … side-effect import of '../app.css'`. The `.svelte` file's `<script>` is processed by Svelte/Vite (not the dts tsc), so the import resolves there.
- Alternative: style federated components with CSS variables + inline styles only (no utilities). Robust and lean, but you give up Tailwind inside remotes.

## Lazy loading via `loadRemote` (not `import('lab/X')`)

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

**Lazy-load is layered.** Even without the `loadRemote` opt-out above, remote chunks still load on demand at the call-site level — `RemoteMount`'s `useEffect` only fires the `load()` once it mounts (and once the cell scrolls into view — see [features.md](./features.md)). The `loadRemote` change is purely about getting `main.tsx` to **execute first**, not about whether the chunk loads eagerly vs lazily inside React's lifecycle.

## Resilience: runtime plugin + error boundary

A failing `remoteEntry.js` fetch used to take down the host bootstrap (blank page) because the auto-init's rejection cascaded. Two layers prevent that now:

- **MF runtime plugin** ([`src/lib/mf-fallback-plugin.ts`](../naufal-host/src/lib/mf-fallback-plugin.ts)) hooks `errorLoadRemote`. For the auto-init failure (id = `"lab"`) it returns a benign stub so the host bootstrap completes and React mounts. For block-level loads (id = `"lab/Counter"`, etc.) it returns a stub whose `default` function **throws when called** — that propagates through `RemoteMount.then` into its `.catch`, flips `failed = true`, and renders the per-block `fallback` UI. Registered via `federation({ runtimePlugins: ['./src/lib/mf-fallback-plugin.ts'] })`.
- **Top-level `ErrorBoundary`** in [`src/main.tsx`](../naufal-host/src/main.tsx) catches React render errors and shows a small "Something went wrong" message instead of blanking. Plus a global `unhandledrejection` listener swallows any async failure that slips past everything else.

Outcome: a remote being completely offline now leaves the host fully usable, with per-block fallbacks shown where the federated content would have been.

## Environment-aware deployment

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
