# naufal.dev — a polyglot microfrontend portfolio

**The architecture is the portfolio.** A live cross-framework [Module Federation](https://module-federation.io/) system: a **React** host composes a **Svelte** remote at runtime, with realtime multiplayer presence over a **PartyKit** WebSocket — paired with a standalone **Next.js** content site for the writing and CV.

**Live:**

- **Portfolio (playground)** → <https://naufal-host.pages.dev>
- **Blog (writing + CV)** → <https://naufal-blog.pages.dev>

By [Naufal Yusran](https://www.linkedin.com/in/naufal-yusran/) — frontend & microfrontend engineer, Jakarta.

---

## What it is

Two sites, four independently deployable pieces — each tool used for what it's actually good at:

| Project        | Stack                                       | Role                               |
| -------------- | ------------------------------------------- | ---------------------------------- |
| `naufal-host`  | React 19 · Vite · `@module-federation/vite` | Host — composes remotes at runtime |
| `naufal-lab`   | Svelte 5 · Vite · `@module-federation/vite` | Remote — exposes mount functions   |
| `naufal-party` | PartyKit (WebSocket)                        | Realtime presence relay            |
| `naufal-blog`  | Next.js 16 · static export                  | Content site — posts + CV (SEO)    |

All four are deployed on Cloudflare (host/lab/blog on Pages, party on the PartyKit runtime) as independent origins — see [deployment.md](docs/deployment.md).

The repo also incubates four standalone products that share the repo but nothing else — none are federated, none use the portfolio's design system: **`badriyatim-family`** (a private family app), **`nuansa`** (a sections + shells platform for info-display microsites), **`sukamotret`** (a client landing page for a real photo studio, deployed as a draft), and **`kopilima`** (a client landing page for a real coffee chain, built on its own established brand, deployed as a draft). Each documents itself in its own `README.md`; the one-paragraph summaries live in [overview.md](docs/overview.md).

The **portfolio** is a vertically-scrolling gallery of self-contained interactive blocks, plus a global presence overlay and a theme drawer in the header. The federated pieces (a draggable Svelte "lanyard ticket" you mount into the React host, a whole-page multiplayer-cursor overlay) are mounted from the Svelte remote through one generic `RemoteMount` over a framework-agnostic `(target, opts) => cleanup` contract — the host never imports Svelte. State crosses the host↔remote boundary three escalating ways, none of which couple the two apps' JavaScript:

- **cascade** — theming is CSS variables on the host's `<html>`; they flow into the embedded remote with zero coordination code,
- **contract** — i18n sends only a locale string across, via `<html lang>` / `opts`, each app owning its own i18n library,
- **backend** — presence: the remote holds its own WebSocket and shares state through the PartyKit server.

The **blog** is deliberately _not_ federated: client-rendered MF is bad for SEO, so crawlable content (technical posts via MDX, the CV as an exportable one-page document) lives in a static-exported Next.js site that shares the portfolio's theme tokens for visual unity. It's internationalized (EN/ID, locale-routed `/en` `/id` with translated content), has a light/dark/system theme, and a per-post reading panel (font / size / background).

## Architecture

```text
┌──────────────────────────────────┐   runtime import    ┌──────────────────────────────┐
│  naufal-host  (React, :5173)     │ ──────────────────► │  naufal-lab  (Svelte, :5174) │
│                                  │  lab/SpringToy      │                              │
│  App.tsx                         │  lab/Presence       │ mountSpringToy/mountPresence │
│   ├─ LiveRemoteBlock             │ ◄── (target,opts) ──│   └─ SpringToy / Presence    │
│   │    └─ RemoteMount → SpringToy│      returns cleanup│                              │
│   └─ PresenceOverlay (global)    │                     │  Presence opens ─┐           │
│        └─ RemoteMount → Presence │                     └──────────────────┼───────────┘
└──────────────────────────────────┘                                        │ WebSocket
                                                                            ▼
                                                          ┌───────────────────────────────┐
                                                          │  naufal-party (PartyKit,:1999)│
                                                          │  relays cursor positions      │
                                                          └───────────────────────────────┘

   naufal-blog (Next.js static export) — standalone, no federation coupling — deploys on its own.
```

## Documentation

The `docs/` set is the source of truth — start at **[docs/README.md](docs/README.md)**:

- [overview.md](docs/overview.md) — what it is, the two-site architecture, the project table, key decisions
- [mf-core.md](docs/mf-core.md) — the mount-function contract, `RemoteMount`, the `opts` boundary, federation config
- [mf-platform.md](docs/mf-platform.md) — styling across the boundary, resilience, lazy loading, env-aware deploy
- [features.md](docs/features.md) — realtime presence, React Compiler, theming, i18n, scroll-reveal
- [gotchas.md](docs/gotchas.md) — every trap already solved (the raw material for the first blog post)
- [running-locally.md](docs/running-locally.md) — the three-process dev workflow
- [deployment.md](docs/deployment.md) — the live Cloudflare setup and deploy procedure
- [handoff.md](docs/handoff.md) — planning context: goals, decisions, roadmap

## Running locally

The federated three run as three processes (the remote must be served as a **built** bundle — see [running-locally.md](docs/running-locally.md) for why):

```bash
cd naufal-lab   && npm install && npm run dev:mf   # remote: build-watch + preview on :5174
cd naufal-party && npm install && npm run dev       # realtime server on :1999
cd naufal-host  && npm install && npm run dev       # host on :5173
```

Then open <http://localhost:5173>. The blog is independent: `cd naufal-blog && npm install && npm run dev`.
