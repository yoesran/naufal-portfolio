# naufal-lab

The **Svelte 5 remote** of a polyglot microfrontend portfolio. It exposes components over Module Federation as framework-agnostic **mount functions** (not Svelte components), so a React host can render them at runtime with Svelte kept out of the host bundle. Exposed today: `./SpringToy` (a draggable Svelte "lanyard ticket" — verlet swing physics — that you drag onto the React host to mount and tug out to unmount) and `./Presence` (a page-wide multiplayer-cursor overlay that holds its own live WebSocket to `naufal-party`).

**Live (standalone):** <https://naufal-lab.pages.dev> — also consumed at runtime by the host.

**Stack:** Svelte 5 · Vite · `@module-federation/vite` · Tailwind/shadcn-svelte · svelte-i18n · partysocket.

Served as a **built** bundle (`npm run dev:mf`) — `@module-federation/vite` generates `remoteEntry.js` at build time, so plain `vite dev` doesn't work for a remote. See the project docs in [`../docs`](../docs) (start at [`../docs/README.md`](../docs/README.md)).
