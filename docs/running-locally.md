# Running Locally

Three processes. The remote must be served as a **built** bundle — `@module-federation/vite` generates `remoteEntry.js` at build time, so plain `vite dev` does not work for the remote (see [gotchas.md](./gotchas.md)).

```bash
# terminal 1 — remote: build watcher + preview server (combined via concurrently)
cd naufal-lab && npm run dev:mf      # vite build --watch + vite preview --port 5174

# terminal 2 — realtime server
cd naufal-party && npm run dev       # partykit dev → 127.0.0.1:1999

# terminal 3 — host
cd naufal-host && npm run dev        # http://localhost:5173
```

Open `http://localhost:5173`. Open a second tab (or `http://127.0.0.1:5174` standalone) to see multiplayer cursors.

**Dev reload:** true HMR isn't possible across the MF boundary. A small plugin in the host's `vite.config.ts` watches `../naufal-lab/dist/` and triggers a host full-page reload when the remote rebuilds (~200–500ms). Requires `server.fs.allow` to permit watching the sibling folder.

**Fresh clone:** because `@mf-types/` is gitignored, the host's TypeScript shows "cannot find module" until the remote has been built + served once and the host has fetched the types. Run the remote before the host on first setup:

1. `cd naufal-lab && npm install && npx vite build`
2. `npx vite preview --port 5174` (keep running)
3. `cd naufal-host && npm install && npm run dev`
4. `@mf-types/` populates, errors clear.

**Tunnel preview:** `cd naufal-host && npm run dev:tunnel` runs `vite --mode tunnel`, reading `.env.tunnel.local` for the VS Code dev-tunnel URLs — see [mf-platform.md](./mf-platform.md) for the env-aware deploy wiring.
