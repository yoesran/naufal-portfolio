# Project Docs

Documentation for the polyglot microfrontend portfolio (React host + Svelte remote + PartyKit realtime). The docs are split by concern — start with `overview.md`, then dive into whichever area you're working on.

## Index

| Doc                                        | What's in it                                                                                                                                                                             |
| ------------------------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [overview.md](./overview.md)               | What the project is, the two-site architecture, the project/stack table, the runtime diagram, and the key design decisions. **Read this first.**                                         |
| [mf-core.md](./mf-core.md)                 | The core Module Federation mechanics: the mount-function contract, the generic `RemoteMount`, the `opts` boundary, the Vite federation config, and generated TypeScript types.           |
| [mf-platform.md](./mf-platform.md)         | Cross-cutting platform concerns: styling across the MF boundary, resilience (runtime fallback plugin + error boundary), lazy loading via `loadRemote`, and environment-aware deployment. |
| [features.md](./features.md)               | Block- and host-level features: realtime presence (PartyKit), the React Compiler integration, the dark-mode toggle, i18n, and scroll-reveal.                                             |
| [gotchas.md](./gotchas.md)                 | The single consolidated list of gotchas already solved — don't re-discover them. Raw material for the first blog post.                                                                   |
| [running-locally.md](./running-locally.md) | How to run the three processes locally, dev-reload behaviour, and the fresh-clone workflow.                                                                                              |
| [deployment.md](./deployment.md)           | How the three apps go live: Cloudflare Pages × 2 + PartyKit, the cross-origin env wiring, CORS via `_headers`, build-mode separation, and the direct-upload deploy procedure.            |
| [handoff.md](./handoff.md)                 | Planning context: about the author, project goals, locked-in decisions, design approach, the roadmap, working preferences, and open issues. The "why," kept separate from the "how."     |

## How the docs relate

- **`overview.md` + `mf-core.md` + `mf-platform.md` + `features.md`** are the technical _source of truth_ for the current code. When code and these docs disagree, the code wins and the doc should be fixed.
- **`handoff.md`** is the planning/decision record — it explains _why_ things are the way they are. It deliberately does not duplicate current code; it points here.
- **`gotchas.md`** is referenced from across the technical docs. It used to be duplicated in two places (which caused drift); now there's one copy.
