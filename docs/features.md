# Features

> Block- and host-level features layered on the [MF core](./mf-core.md) and [platform](./mf-platform.md). See [gotchas.md](./gotchas.md) for the traps each one hit.

## Realtime presence via PartyKit

`Presence.svelte` is a federated component that opens its **own** WebSocket — the realtime layer rides inside a microfrontend.

- The PartyKit server (`naufal-party/src/server.ts`) is a tiny relay: on connect it assigns a colour + friendly name; on a cursor message it broadcasts `{ id, color, name, context, x, y }` to everyone else; on disconnect it broadcasts `leave`.
- The Svelte component connects with `partysocket`, sends viewport-normalized (0–1) cursor coords on `mousemove` (rAF-throttled), and renders peers' cursors with a name pill + origin tag.
- The socket is opened in a Svelte `$effect` and **closed in its teardown**, so federation's `unmount()` closes it cleanly — same cleanup-across-the-boundary story as the component itself.
- Both the host-embedded and standalone instances default to the same room, so cursors are shared **across deployments** — you can watch a `· host` cursor and a `· remote` cursor on the same page.
- **On the host it's a global, opt-in whole-page overlay.** [`PresenceOverlay`](../naufal-host/src/components/PresenceOverlay.tsx) mounts `lab/Presence` (`eager`) into a fixed full-viewport layer only when the visitor flips the header [`PresenceToggle`](../naufal-host/src/components/PresenceToggle.tsx) on — so peer cursors roam the whole site, not a 256px card — with a live count to soften the empty room; toggling off unmounts the remote and closes the socket. The on/off bit is a tiny `useSyncExternalStore` store ([`lib/presence.ts`](../naufal-host/src/lib/presence.ts)) shared between the toggle and the overlay (no provider, no prop-drilling through the header).

The host points at the server via `VITE_PARTY_HOST` (default `127.0.0.1:1999`), passed through `opts.host`.

## React Compiler

The host runs `babel-plugin-react-compiler@1.0.0` over every `.tsx` / `.ts` source file during build (and dev). The compiler auto-memoizes components, hooks, and inline values, so inline `load={() => loadRemote(...)}` and `opts={{ context: 'host' }}` don't churn on every render. Note `RemoteMount` no longer **relies** on that memoization for correctness — it reads `load`/`opts`/`onStatusChange` through refs and gates its mount effect on `shouldLoad` alone (see [mf-core.md](./mf-core.md) §2 callout); the compiler is a perf win on top, not a correctness crutch.

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

The architecture has been "ready" for dark mode since v0.1 (shadcn CSS variables, host owns the `.dark` class on `<html>`, remotes inherit through the cascade — zero coordination code). v0.2 ships the UI. Dark mode is now the **base-mode axis** of the broader theme customizer below — it is not a standalone hook anymore; it reads and writes the same shared store as accent / surface / radius / font.

- [`src/lib/theme.ts`](../naufal-host/src/lib/theme.ts) — the shared store (see the theme customizer section for the full picture). The base-mode piece: `mode: 'light' | 'dark' | 'system'` is the stored preference, `resolveDark(mode)` is what's actually painted (exposed as `resolvedDark` off `useThemeConfig()`). A `matchMedia('(prefers-color-scheme: dark)')` listener re-applies while in `system` mode, so toggling the OS theme flips the page live. `apply()` writes the `.dark` class to `<html>` and `persist()` writes the preference to `localStorage` under the key `theme`. (This replaced the earlier standalone `useTheme.ts` hook.)
- The base-mode UI lives only in the theme drawer (see below) — `mode` / `setMode` off `useThemeConfig()`, a light/dark/system control alongside the other four axes. There is no longer a standalone header theme toggle (the earlier `ThemeToggle`/`PaletteToggle` components were removed; the drawer is the single place to change theme).
- [`index.html`](../naufal-host/index.html) — holds a `<!-- theme-prepaint -->` slot. A small Vite plugin (`theme-prepaint` in [`vite.config.ts`](../naufal-host/vite.config.ts)) replaces it at build/serve time with an inline `<script>` + `<style>` **generated from [`theme-tokens.ts`](../naufal-host/src/lib/theme-tokens.ts)** — the same constants the store uses. The script runs synchronously before any paint, resolves the stored mode/accent/surface/radius/font, and sets the class/attributes/CSS vars on `<html>`; the style paints `background-color` + `color-scheme` per class state. This kills both the white FOUC and the wrong-theme flash for return visitors, and because it's generated, the pre-paint logic can't drift from the store (it used to be a hand-mirrored copy). See [gotchas.md](./gotchas.md).
- [`index.css`](../naufal-host/src/index.css) — `scrollbar-gutter: stable` on `<html>`. Base-ui-react's portal locks body scroll when the dropdown opens; without the reserved gutter the page reflows by the scrollbar width every open/close. Cheap fix, side benefit for any future block that adds a scrollbar mid-session.

The standalone lab page (`localhost:5174`) stays dark-only — the toggle lives in the host because that's the integration surface that owns visitor preference. If the standalone ever needs its own toggle it's a separate small task on the Svelte side; the CSS-variable theme is already in place.

## Theme customizer (the theme drawer)

The host is fully visitor-themeable across five axes — **base mode** (light/dark/system), **accent**, **background/surface**, **corner radius**, and **font** — and every axis is just a value on the host's `<html>`, so it **cascades into the federated Svelte remote live**. That's what makes [`ThemeControls`](../naufal-host/src/components/ThemeControls.tsx) — rendered in a header slide-over [`Sheet`](../naufal-host/src/components/ThemeSheet.tsx) — a working demo of the CSS-variables-cross-the-MF-boundary claim rather than just an assertion: re-skin the page and watch the embedded `SpringToy` re-skin with it, no remount.

**Shared store, not per-component state.** All five controls live in the theme drawer, but they're backed by a module store, [`theme.ts`](../naufal-host/src/lib/theme.ts), instead of local state — read via `useSyncExternalStore`, so the block, the OS-theme listener, and the generated pre-paint script all stay in sync off one source of truth. A single `apply()` writes the whole config onto `<html>` (`.dark` class, `data-accent`, `data-surface`, inline `--radius`, inline `--font-app`). It also listens for OS-theme flips while in `system` mode. (This replaced the earlier per-instance `useTheme`/`useAccent` hooks.)

**Each axis maps to one mechanism:**

- **Accent** → a single `--brand` token ([index.css](../naufal-host/src/index.css)), mapped via `--color-brand` in `@theme inline` so `text-brand` / `bg-brand/80` / `border-brand/40` / `ring-brand` work with opacity modifiers. This replaced the previously **hardcoded `emerald-*` literals** across the hero glow, tech-stack orbit, MF diagram, header wordmark, and the remote glow. Swapped via `[data-accent='blue']` + `.dark[data-accent='blue']` blocks (each preset needs a light **and** dark value; `.dark[data-accent=x]` at specificity 0,2,0 beats the bare `.dark`). `emerald`/`default` are the `:root`/`.dark` defaults, so they need no override block.
- **Surface** → `data-surface` presets (`slate`/`stone`/`mono`) reassign the background/card/popover/muted/border tokens (light + dark each). Only the bg-family is tinted; **foregrounds stay at their high-contrast defaults**, so no preset can produce unreadable text — the curated-safety guardrail. Written as `:root[data-surface=x]` (0,2,0), not bare `[data-surface=x]` (0,1,0) — see [gotchas.md](./gotchas.md) #19: the remote injects its own global `:root` tokens, so the host must out-specify them.
- **Radius** → a shadcn `Slider` writes inline `--radius` on `<html>`; shadcn already derives `--radius-sm…4xl` from it via `calc()`, and because those are `var()`-based the remote's `rounded-*` re-rounds too. (Inline style also makes it immune to the remote's injected CSS.)
- **Font** → inline `--font-app`, referenced by the base **`:root`** rule (`font-family: var(--font-app)`) — `:root` not `html`, so it outranks the remote's injected `html{font-family:Inter}` (gotchas #19). `font-mono` code/labels opt back out. Font-family inherits through the DOM, so the embedded remote re-fonts for free.
- **Base mode** → the existing `.dark` class.

**No-FOUC.** The generated inline `<head>` script (see the dark-mode section — built from [`theme-tokens.ts`](../naufal-host/src/lib/theme-tokens.ts) by the `theme-prepaint` Vite plugin) restores all five before first paint, including a small background lookup so a custom surface doesn't flash the default bg before CSS loads. **Status colors stay literal** (connected/connecting/offline greens/ambers/reds) — state, not theme. **Remote side:** [SpringToy.svelte](../naufal-lab/src/lib/SpringToy.svelte)'s embedded branch uses `brand` utilities + `color-mix(in oklch, var(--brand) …)` (the lanyard cord + host glow), so it re-skins with the host; the lab's [app.css](../naufal-lab/src/app.css) maps `--color-brand: var(--brand, <emerald>)` so it resolves to the host value when embedded and a fallback standalone. The theme drawer is the single entry point for all five axes — the header carries the locale toggle, the presence toggle, and the drawer trigger (the old `ThemeToggle`/`PaletteToggle` shortcuts were removed).

## i18n: per-remote with locale via `opts`

**The rule.** Each app in the federation owns its own translations and its own i18n library. Only the locale **string** crosses the MF boundary — it rides on the host's `<html lang>` attribute (which every remote inherits automatically through the DOM) and on the `opts.locale` field of the mount signature. Conventions shared, implementations independent.

**Working convention (host).** Any new user-facing string goes through the i18n system — no hardcoded text in components. Add the key to [`en.json`](../naufal-host/src/lib/locales/en.json) (source of truth), mirror it in [`id.json`](../naufal-host/src/lib/locales/id.json), then use `t('your.key')` or `<Trans i18nKey="..." components={...}>` in the component. The dual-`satisfies` shape check in `i18n.ts` enforces parity at compile time, so adding to one locale without the other fails the build. Exceptions are code-comment-style labels (e.g. `// hero · host-native React` on `Cell`) and brand/code identifiers (e.g. `naufal.dev`, `lab/SpringToy`, `naufal-lab`) — those stay literal.

**Host setup** (shipped):

- [`src/lib/i18n.ts`](../naufal-host/src/lib/i18n.ts) — `i18next` + `react-i18next` + `i18next-browser-languagedetector`. Resources are bundled `en.json` and `id.json` under one default namespace. Detection order: `localStorage` → `navigator`. Key in storage: `locale`. On every `languageChanged` event the listener sets `document.documentElement.lang = lng`, which is exactly what remotes will read. Same file exports the locale type machinery: `LOCALES` (a `readonly ['en', 'id']` tuple via `as const`), `Locale = (typeof LOCALES)[number]`, `DEFAULT_LOCALE`, and an `isLocale(value): value is Locale` type guard. `Translations = typeof en` is exported so components can derive specific dynamic-key unions.
- [`src/lib/locales/en.json`](../naufal-host/src/lib/locales/en.json) / [`id.json`](../naufal-host/src/lib/locales/id.json) — nested keys grouped by surface (`header.nav`, `hero`, `techStack`, `liveRemote`, `presence`, `theme`, `themeLab`, `locale`). Locale-shape consistency is enforced via a dual `satisfies LocaleShape<...>` at the i18next-init resources block in `i18n.ts`: `id satisfies LocaleShape<typeof en>` catches missing keys in id (would silently fall back to English at runtime), `en satisfies LocaleShape<typeof id>` catches extra keys in id (drift indicator). `LocaleShape<T>` widens string leaves to `string` so the comparison ignores literal value differences and checks only key structure. Both directions are needed because TS only runs excess-property checks on object literals, not on JSON-import bindings.
- [`src/lib/i18n-types.d.ts`](../naufal-host/src/lib/i18n-types.d.ts) — **`i18next`** module augmentation (not `react-i18next` — `CustomTypeOptions` lives on i18next; react-i18next re-uses it) so `t('key.path')` is type-checked against the English JSON shape and the IDE offers autocomplete on the key argument. Dynamic keys: derive a sub-union via `keyof Translations['path']['to']['object']` next to where you use it — e.g. `TechNoteKey = keyof Translations['techStack']['notes']` in `TechStackBlock.tsx` makes `t(\`techStack.notes.${active.noteKey}\`)` type-check without a cast.
- [`src/components/LocaleToggle.tsx`](../naufal-host/src/components/LocaleToggle.tsx) — shadcn `ToggleGroup` (binary "EN / ID" pill, segmented-control look with `spacing={0}`). Lives in the header, alongside the presence toggle and theme-drawer trigger (plus the mobile nav menu). Maps over `LOCALES` so adding a third locale to `i18n.ts` automatically adds a third toggle item.
- Components use `t(key)` for plain strings, `<Trans i18nKey="..." components={...}>` where translations need to wrap their own inline `<span>`/`<code>` for emphasis (the LiveRemoteBlock has inline-formatted prose). **Always pass `t={t}` to `<Trans>`** (and call `useTranslation()` in that component) — under the React Compiler a `<Trans>` with otherwise-constant props gets memoized and won't re-translate on a locale switch; the live `t` reference changes on `languageChanged` and forces the re-render. See [gotchas.md](./gotchas.md) #18.

**Indonesian translations** are best-effort drafts written for the initial implementation — Naufal is the native speaker and the source of truth; expect refinements as he reviews.

**Remote setup** (shipped for `naufal-lab`):

- `naufal-lab` uses **`svelte-i18n`**, its own translation files in [`src/lib/i18n/`](../naufal-lab/src/lib/i18n/) (`en.json` + `id.json`), not federated. `addMessages` is synchronous so the dictionaries ship inside the federated chunk and the formatter runs on first render with no async-`register()` flash. Counts use ICU plural (`{count, plural, …}`). Same dual-`satisfies` shape guard as the host enforces locale parity at build time. The `host` / `remote` origin tags and `// exposed: …` code labels stay literal.
- **Typed keys (the host's i18next-autocomplete analogue).** `svelte-i18n` has no `CustomTypeOptions` hook, so the module exports a typed wrapper store, **`t`**, used as `$t('springToy.label')` instead of the raw `$_`. Its key argument is a `MessageKey` union derived from `typeof en` (a recursive dotted-path type), so the editor autocompletes keys and `$t('springToy.nope')` is a compile error; the `options` signature (`values`, `default`, …) is recovered from the `_` store's type so interpolation still type-checks.
- **The locale crosses via `<html lang>`, not `opts.locale`.** The host already sets `<html lang>` on every `languageChanged` (see host i18n above); the remote shares the host's document when embedded, so [`src/lib/i18n/index.ts`](../naufal-lab/src/lib/i18n/index.ts) reads `document.documentElement.lang` for its initial locale and a `MutationObserver` on that attribute drives live switches. This was chosen over passing `opts.locale` + re-mounting because a re-mount would tear down and reopen the Presence WebSocket (resetting cursors) on every language change; the observer updates in place. Standalone (`:5174`) reads the lab's own `index.html` `lang` and stays `en` (no toggle there).
- `opts.locale` from [mf-core.md](./mf-core.md) §3 remains a valid override hook for a future remote that isn't embedded in a locale-owning host, but the lab doesn't need it — `<html lang>` already carries the signal with zero host-side coordination.

**Why this shape, not a shared i18n library across the boundary.** A shared library would force every remote to load the same i18next version (or whatever), which negates the framework-independence the architecture is built on. The string-only contract is the smallest thing that crosses the boundary, and it matches what the browser already does with `<html lang>` for accessibility / language detection.

## Scroll-reveal + deferred federated load

Two behaviours sharing one hook.

[`src/lib/useInView.ts`](../naufal-host/src/lib/useInView.ts) — ~25-line `IntersectionObserver` hook. Returns a `[ref, inView]` tuple, fires once, disconnects on first intersection. `rootMargin: '0px 0px -10% 0px'` so the threshold is slightly past viewport-entry, giving the animation room to play.

- **Cell entry animation:** [`Cell.tsx`](../naufal-host/src/components/Cell.tsx) wires the hook and toggles `translate-y-4 opacity-0 → translate-y-0 opacity-100` over `duration-700 ease-out`. `motion-reduce:` variants force the visible state immediately so reduced-motion users get no transition at all. Every block uses `<Cell>` so the reveal is automatic — no per-block plumbing.
- **Deferred federated load (opt-in):** [`RemoteMount.tsx`](../naufal-host/src/components/RemoteMount.tsx) can gate its `load()` effect on `inView` — fetching the federated chunk only when the cell scrolls into view, which pushes the network cost of unreached blocks to zero. Both current remotes opt **out** with `eager`, though, because they load on an explicit user action instead (the live-remote **Run**, the presence toggle); the viewport gate stays available for any future scroll-triggered remote.

The hook deliberately does **not** check `prefers-reduced-motion` — that preference belongs to the animation question, not the prefetching question. The CSS handles the motion side; the load gating runs regardless.

Above-the-fold cells (Hero, sometimes TechStack on tall screens) get a one-frame paint at `opacity-0` before the observer's first callback fires, then the 700ms fade begins. The eye reads it as "thing appears" rather than "thing was missing." A pre-paint synchronous viewport check in `useLayoutEffect` would eliminate that frame but trips `eslint-plugin-react-hooks` v7's "setState synchronously within an effect" rule, so it's not worth it.
