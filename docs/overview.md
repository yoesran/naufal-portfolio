# Overview & Architecture

> Technical source of truth for the current code. See [handoff.md](./handoff.md) for the planning context and _why_ behind these choices.

## What this is

A portfolio where **the architecture is the portfolio** — a microfrontend system demonstrating cross-framework Module Federation, connecting three independently deployable apps:

- **`naufal-host`** (React) — composes federated components at runtime.
- **`naufal-lab`** (Svelte) — a remote that exposes components over Module Federation.
- **`naufal-party`** (PartyKit) — a WebSocket server powering multiplayer presence.

Federation uses `@module-federation/vite` — the actively maintained, framework-agnostic plugin. (The older `@module-federation/nextjs-mf` is being deprecated and was deliberately not used.)

The remote exposes **two** components today: `./Counter` (a context-aware mouse-tracker) and `./Presence` (a multiplayer cursor canvas that holds its own live WebSocket). The presence feature is the on-message demo: a federated Svelte component, embedded in a React host, sharing realtime state across deployments.

---

## Project / stack table

| Project        | Stack                                             | Port | Status      |
| -------------- | ------------------------------------------------- | ---- | ----------- |
| `naufal-host`  | React 19 + Vite + `@module-federation/vite`       | 5173 | Working     |
| `naufal-lab`   | Plain Svelte 5 + Vite + `@module-federation/vite` | 5174 | Working     |
| `naufal-party` | PartyKit (WebSocket) — multiplayer presence       | 1999 | Working     |
| `naufal-blog`  | Next.js 15 App Router (standalone, NOT federated) | —    | Not started |

All three running projects are **separate processes** with no build-time coupling. The host fetches the remote's bundle at runtime from `http://127.0.0.1:5174/remoteEntry.js`; the federated `Presence` component opens a WebSocket to `127.0.0.1:1999`.

---

## What each project contains

### `naufal-host` — React Host (port 5173)

| File                                           | Role                                                                                                                                                          |
| ---------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `vite.config.ts`                               | Host config; reads `VITE_LAB_URL` via `loadEnv` so the federation `entry` is environment-aware                                                                |
| `index.html`                                   | Inline `<style>` paints the dark background on first frame (avoids white FOUC before JS loads)                                                                |
| `src/main.tsx`                                 | Mounts React inside a top-level `ErrorBoundary` + installs an `unhandledrejection` swallower                                                                  |
| `src/App.tsx`                                  | The home-page playground — header, intro, Hero / TechStack / Microfrontend / Presence blocks, footer                                                          |
| `src/components/Header.tsx`, `Footer.tsx`      | Sticky header (name + nav placeholders), footer with social links                                                                                             |
| `src/components/Cell.tsx`                      | The frame primitive: bordered card + monospace label, every block sits in one                                                                                 |
| `src/components/RemoteMount.tsx`               | Generic wrapper that mounts any framework-agnostic remote (status + `fallback` + `loadingFallback` + opts)                                                    |
| `src/components/blocks/HeroBlock.tsx`          | Block: host-native interactive wordmark (per-letter cursor repel + emerald glow)                                                                              |
| `src/components/blocks/TechStackBlock.tsx`     | Block: host-native rotating icon orbit; pills active on hover/focus/tap                                                                                       |
| `src/components/blocks/MicrofrontendBlock.tsx` | Block: live Counter + host⇄remote diagram + load status + skeleton loader + simulate-offline toggle                                                           |
| `src/components/blocks/PresenceBlock.tsx`      | Block: loads `lab/Presence` (multiplayer cursors)                                                                                                             |
| `src/lib/mf-fallback-plugin.ts`                | MF runtime plugin — `errorLoadRemote` returns a benign stub on init failure, a throwing stub on block-import failure (see [mf-platform.md](./mf-platform.md)) |
| `src/vite-env.d.ts`                            | Types `VITE_LAB_URL` / `VITE_PARTY_HOST` env vars                                                                                                             |
| `tsconfig.app.json`                            | `paths` mapping so federated imports resolve to generated types                                                                                               |
| `@mf-types/`                                   | Auto-generated, gitignored — downloaded remote type declarations                                                                                              |

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
| `src/lib/i18n/`            | `svelte-i18n` setup + `en.json` / `id.json`; reads `<html lang>` (host-owned) for locale, observes it for live switches   |

`Counter.svelte`'s dashed border is intentional — it reads visibly as a remote when embedded in the host.

### `naufal-party` — PartyKit Realtime Server (port 1999)

| File            | Role                                                                                          |
| --------------- | --------------------------------------------------------------------------------------------- |
| `src/server.ts` | Cursor relay: assigns each connection a color + name, broadcasts cursor positions to the room |
| `partykit.json` | PartyKit config (`name`, `main`)                                                              |

---

## Runtime diagram

```text
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

---

## Key design decisions

- **Mount-function pattern** over exposing components directly: framework-agnostic, keeps the Svelte runtime out of the host bundle. Reused for every remote regardless of framework. See [mf-core.md](./mf-core.md).
- **Generic `RemoteMount`** over per-remote wrappers: one component handles every remote, plus load status + graceful fallback.
- **`opts` carries context** across the boundary as a plain object — the forward-compatible hook (originally floated for `locale`).
- **Realtime inside a microfrontend**: `Presence` proves a federated remote can own a live WebSocket and share state across deployments. See [features.md](./features.md).
- **Ship CSS with the exposed entry** so Tailwind works embedded (theme via CSS vars, utilities via shipped stylesheet). See [mf-platform.md](./mf-platform.md).
- **No shared Svelte**: `shared: []` — Svelte is fully bundled into the remote. Host shares only `react` / `react-dom`.
- **`build.target: 'chrome89'`** on both sides: required by `@module-federation/vite` (native ES modules + top-level `await`).
- **`127.0.0.1` everywhere**: avoids the Windows IPv6 / dts-plugin IPv4 mismatch. See [gotchas.md](./gotchas.md).
- **React Compiler via a ~12-line custom plugin**, not `@rolldown/plugin-babel`. The documented integration is silently inert in this project (federation + plugin-react v6 interaction); see [features.md](./features.md).
- **i18n is per-remote, locale crosses via `opts.locale`**. Host runs `i18next` + `react-i18next`; each remote will own its own library when translated. Host sets `<html lang>`; remotes will read locale from their mount's `opts`. See [features.md](./features.md).
- **Theme toggle lives on the host, not in any remote**. CSS variables + `.dark` class cascade from the host's `<html>` into every remote's mounted DOM — zero coordination code. See [features.md](./features.md).
- **Scroll-reveal is plain `IntersectionObserver` + CSS transition**, not Framer Motion (or any animation library). Same hook gates `RemoteMount`'s federated `load()` on viewport entry, so blocks below the fold cost zero network. See [features.md](./features.md).
