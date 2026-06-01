# Features

> Block- and host-level features layered on the [MF core](./mf-core.md) and [platform](./mf-platform.md). See [gotchas.md](./gotchas.md) for the traps each one hit.

## Realtime presence via PartyKit

`Presence.svelte` is a federated component that opens its **own** WebSocket — the realtime layer rides inside a microfrontend.

- The PartyKit server (`naufal-party/src/server.ts`) is a tiny relay: on connect it assigns a colour + friendly name; on a cursor message it broadcasts `{ id, color, name, context, x, y }` to everyone else; on disconnect it broadcasts `leave`.
- The Svelte component connects with `partysocket`, sends normalized (0–1) cursor coords on `mousemove` (rAF-throttled), and renders peers' cursors with a name pill + origin tag.
- The socket is opened in a Svelte `$effect` and **closed in its teardown**, so federation's `unmount()` closes it cleanly — same cleanup-across-the-boundary story as the component itself.
- Both the host-embedded and standalone instances default to the same room, so cursors are shared **across deployments** — you can watch a `· host` cursor and a `· remote` cursor in the same canvas.

The host points at the server via `VITE_PARTY_HOST` (default `127.0.0.1:1999`), passed through `opts.host`.

## React Compiler

The host runs `babel-plugin-react-compiler@1.0.0` over every `.tsx` / `.ts` source file during build (and dev). The compiler auto-memoizes components, hooks, and inline values — so the `useCallback` around `RemoteMount`'s `load` prop and the module-level `REMOTE_OPTS`/`PRESENCE_OPTS` constants are no longer required to keep the remote from remounting in a loop (see [mf-core.md](./mf-core.md) §2 callout). Inline `{ context: 'host' }` works.

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

## Dark mode toggle (light / dark / system)

The architecture has been "ready" for dark mode since v0.1 (shadcn CSS variables, host owns the `.dark` class on `<html>`, remotes inherit through the cascade — zero coordination code). v0.2 ships the UI.

- [`src/lib/useTheme.ts`](../naufal-host/src/lib/useTheme.ts) — single hook. `theme: 'light' | 'dark' | 'system'` is the stored preference; `resolvedTheme: 'light' | 'dark'` is what's actually painted. A media-query listener tracks the OS pref so toggling the OS theme while in `system` mode flips the page live. The hook writes the class to `<html>` and the preference to `localStorage`.
- [`src/components/ThemeToggle.tsx`](../naufal-host/src/components/ThemeToggle.tsx) — shadcn `DropdownMenu` + `DropdownMenuRadioGroup`/`DropdownMenuRadioItem` triggered by a ghost-variant `Button` showing the current resolved icon (Sun / Moon). The built-in radio-item check indicator handles the "which is selected" display — no manual state-mirror.
- [`index.html`](../naufal-host/index.html) — a small inline `<script>` runs synchronously before any paint, mirrors `useTheme`'s read-the-same-storage logic, and sets `.dark` on `<html>` if needed. Paired with an inline `<style>` that paints `background-color` + `color-scheme` per class state. This kills both the white FOUC and the wrong-theme flash for return visitors. See [gotchas.md](./gotchas.md).
- [`index.css`](../naufal-host/src/index.css) — `scrollbar-gutter: stable` on `<html>`. Base-ui-react's portal locks body scroll when the dropdown opens; without the reserved gutter the page reflows by the scrollbar width every open/close. Cheap fix, side benefit for any future block that adds a scrollbar mid-session.

The standalone lab page (`localhost:5174`) stays dark-only — the toggle lives in the host because that's the integration surface that owns visitor preference. If the standalone ever needs its own toggle it's a separate small task on the Svelte side; the CSS-variable theme is already in place.

## i18n: per-remote with locale via `opts`

**The rule.** Each app in the federation owns its own translations and its own i18n library. Only the locale **string** crosses the MF boundary — it rides on the host's `<html lang>` attribute (which every remote inherits automatically through the DOM) and on the `opts.locale` field of the mount signature. Conventions shared, implementations independent.

**Working convention (host).** Any new user-facing string goes through the i18n system — no hardcoded text in components. Add the key to [`en.json`](../naufal-host/src/lib/locales/en.json) (source of truth), mirror it in [`id.json`](../naufal-host/src/lib/locales/id.json), then use `t('your.key')` or `<Trans i18nKey="..." components={...}>` in the component. The dual-`satisfies` shape check in `i18n.ts` enforces parity at compile time, so adding to one locale without the other fails the build. Exceptions are code-comment-style labels (e.g. `// hero · host-native React` on `Cell`) and brand/code identifiers (e.g. `naufal.dev`, `lab/Counter`, `naufal-lab`) — those stay literal.

**Host setup** (shipped):

- [`src/lib/i18n.ts`](../naufal-host/src/lib/i18n.ts) — `i18next` + `react-i18next` + `i18next-browser-languagedetector`. Resources are bundled `en.json` and `id.json` under one default namespace. Detection order: `localStorage` → `navigator`. Key in storage: `locale`. On every `languageChanged` event the listener sets `document.documentElement.lang = lng`, which is exactly what remotes will read. Same file exports the locale type machinery: `LOCALES` (a `readonly ['en', 'id']` tuple via `as const`), `Locale = (typeof LOCALES)[number]`, `DEFAULT_LOCALE`, and an `isLocale(value): value is Locale` type guard. `Translations = typeof en` is exported so components can derive specific dynamic-key unions.
- [`src/lib/locales/en.json`](../naufal-host/src/lib/locales/en.json) / [`id.json`](../naufal-host/src/lib/locales/id.json) — nested keys grouped by surface (`header.nav`, `hero`, `techStack`, `microfrontend`, `presence`, `theme`, `locale`). Locale-shape consistency is enforced via a dual `satisfies LocaleShape<...>` at the i18next-init resources block in `i18n.ts`: `id satisfies LocaleShape<typeof en>` catches missing keys in id (would silently fall back to English at runtime), `en satisfies LocaleShape<typeof id>` catches extra keys in id (drift indicator). `LocaleShape<T>` widens string leaves to `string` so the comparison ignores literal value differences and checks only key structure. Both directions are needed because TS only runs excess-property checks on object literals, not on JSON-import bindings.
- [`src/lib/i18n-types.d.ts`](../naufal-host/src/lib/i18n-types.d.ts) — **`i18next`** module augmentation (not `react-i18next` — `CustomTypeOptions` lives on i18next; react-i18next re-uses it) so `t('key.path')` is type-checked against the English JSON shape and the IDE offers autocomplete on the key argument. Dynamic keys: derive a sub-union via `keyof Translations['path']['to']['object']` next to where you use it — e.g. `TechNoteKey = keyof Translations['techStack']['notes']` in `TechStackBlock.tsx` makes `t(\`techStack.notes.${active.noteKey}\`)` type-check without a cast.
- [`src/components/LocaleToggle.tsx`](../naufal-host/src/components/LocaleToggle.tsx) — shadcn `ToggleGroup` (binary "EN / ID" pill, segmented-control look with `spacing={0}`). Lives in the header to the left of `ThemeToggle`. Maps over `LOCALES` so adding a third locale to `i18n.ts` automatically adds a third toggle item.
- Components use `t(key)` for plain strings, `<Trans i18nKey="..." components={...}>` where translations need to wrap their own inline `<span>`/`<code>` for emphasis (MicrofrontendBlock and PresenceBlock have inline-formatted prose). **Always pass `t={t}` to `<Trans>`** (and call `useTranslation()` in that component) — under the React Compiler a `<Trans>` with otherwise-constant props gets memoized and won't re-translate on a locale switch; the live `t` reference changes on `languageChanged` and forces the re-render. See [gotchas.md](./gotchas.md) #18.

**Indonesian translations** are best-effort drafts written for the initial implementation — Naufal is the native speaker and the source of truth; expect refinements as he reviews.

**Remote setup** (shipped for `naufal-lab`):

- `naufal-lab` uses **`svelte-i18n`**, its own translation files in [`src/lib/i18n/`](../naufal-lab/src/lib/i18n/) (`en.json` + `id.json`), not federated. `addMessages` is synchronous so the dictionaries ship inside the federated chunk and the formatter runs on first render with no async-`register()` flash. Counts use ICU plural (`{count, plural, …}`). Same dual-`satisfies` shape guard as the host enforces locale parity at build time. The `host` / `remote` origin tags and `// exposed: …` code labels stay literal.
- **Typed keys (the host's i18next-autocomplete analogue).** `svelte-i18n` has no `CustomTypeOptions` hook, so the module exports a typed wrapper store, **`t`**, used as `$t('counter.tracker')` instead of the raw `$_`. Its key argument is a `MessageKey` union derived from `typeof en` (a recursive dotted-path type), so the editor autocompletes keys and `$t('counter.nope')` is a compile error; the `options` signature (`values`, `default`, …) is recovered from the `_` store's type so interpolation still type-checks.
- **The locale crosses via `<html lang>`, not `opts.locale`.** The host already sets `<html lang>` on every `languageChanged` (see host i18n above); the remote shares the host's document when embedded, so [`src/lib/i18n/index.ts`](../naufal-lab/src/lib/i18n/index.ts) reads `document.documentElement.lang` for its initial locale and a `MutationObserver` on that attribute drives live switches. This was chosen over passing `opts.locale` + re-mounting because a re-mount would tear down and reopen the Presence WebSocket (resetting cursors) on every language change; the observer updates in place. Standalone (`:5174`) reads the lab's own `index.html` `lang` and stays `en` (no toggle there).
- `opts.locale` from [mf-core.md](./mf-core.md) §3 remains a valid override hook for a future remote that isn't embedded in a locale-owning host, but the lab doesn't need it — `<html lang>` already carries the signal with zero host-side coordination.

**Why this shape, not a shared i18n library across the boundary.** A shared library would force every remote to load the same i18next version (or whatever), which negates the framework-independence the architecture is built on. The string-only contract is the smallest thing that crosses the boundary, and it matches what the browser already does with `<html lang>` for accessibility / language detection.

## Scroll-reveal + deferred federated load

Two behaviours sharing one hook.

[`src/lib/useInView.ts`](../naufal-host/src/lib/useInView.ts) — ~25-line `IntersectionObserver` hook. Returns a `[ref, inView]` tuple, fires once, disconnects on first intersection. `rootMargin: '0px 0px -10% 0px'` so the threshold is slightly past viewport-entry, giving the animation room to play.

- **Cell entry animation:** [`Cell.tsx`](../naufal-host/src/components/Cell.tsx) wires the hook and toggles `translate-y-4 opacity-0 → translate-y-0 opacity-100` over `duration-700 ease-out`. `motion-reduce:` variants force the visible state immediately so reduced-motion users get no transition at all. Every block uses `<Cell>` so the reveal is automatic — no per-block plumbing.
- **Deferred federated load:** [`RemoteMount.tsx`](../naufal-host/src/components/RemoteMount.tsx) gates its `load()` effect on `inView`. The skeleton renders while the cell is below the fold; once the cell crosses the threshold the federated chunk fetches and the Svelte component mounts. Makes the MicrofrontendBlock's on-page copy ("fetched the moment it scrolled into view") literally accurate, and pushes the network cost of blocks the visitor never reaches down to zero.

The hook deliberately does **not** check `prefers-reduced-motion` — that preference belongs to the animation question, not the prefetching question. The CSS handles the motion side; the load gating runs regardless.

Above-the-fold cells (Hero, sometimes TechStack on tall screens) get a one-frame paint at `opacity-0` before the observer's first callback fires, then the 700ms fade begins. The eye reads it as "thing appears" rather than "thing was missing." A pre-paint synchronous viewport check in `useLayoutEffect` would eliminate that frame but trips `eslint-plugin-react-hooks` v7's "setState synchronously within an effect" rule, so it's not worth it.
