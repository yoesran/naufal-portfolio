# Running Locally

Three processes. The remote must be served as a **built** bundle — `@module-federation/vite` generates `remoteEntry.js` at build time, so plain `vite dev` does not work for the remote (see [gotchas.md](./gotchas.md)).

```bash
# terminal 1 — remote: build watcher + preview server (combined via concurrently)
cd naufal-lab && npm run dev:mf      # vite build --watch --mode development + vite preview --port 5174

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

## Formatting

Prettier is configured in all four projects (single quotes, no semicolons, sorted imports — plus Tailwind class ordering in the three with markup — see each project's `.prettierrc`). Run `npm run format` (write) or `npm run format:check` in any of them.

```bash
npm run format        # write — run this before committing
npm run format:check  # verify only (the CI-gate form)
```

Both scripts are scoped to `src`. The config sets `endOfLine: "auto"`, so Prettier respects whatever line endings are on disk (this repo has `core.autocrlf=true` and no `.gitattributes`) instead of rewriting every file to LF — without it, `format:check` flags every file on line endings alone. There's no pre-commit hook yet, so formatting is run by hand (or editor-on-save).

## Testing

`naufal-host` has **two** suites, which also feed the `// quality` dashboard (see [deployment.md](./deployment.md) › Quality dashboard).

**Unit + component (Vitest)** — pure-function checks ([`src/lib/quality`](../naufal-host/src/lib/quality)) plus React Testing Library component tests (`src/components/blocks/*.test.tsx`, jsdom — visual things like the orbit and canvas stay in Playwright):

```bash
cd naufal-host
npm run test         # run once
npm run test:watch   # watch mode
```

**End-to-end (Playwright)** — a smoke suite ([`tests/smoke.spec.ts`](../naufal-host/tests/smoke.spec.ts)):

```bash
npm run test:e2e         # headless
npm run test:e2e:ui      # watch each step in a live browser pane
npm run test:e2e:headed  # drive a real browser window (PW_SLOWMO=600 to slow it down)
```

`npm run reports` runs both suites with their HTML reporters (Playwright with video) and assembles the published reports; `npm run reports:deploy` uploads them to `naufal-reports.pages.dev`. See [deployment.md](./deployment.md) › Quality dashboard.

It's **host-focused by design** — [`playwright.config.ts`](../naufal-host/playwright.config.ts)'s `webServer` boots only the host dev server (lab/party stay down), so it's self-contained (no manual setup) and stable. It covers the home render, the skip link, the canvas toggle, the locale switch (copy + `<html lang>`), theme persistence across reload, and — usefully — the **live-remote offline fallback** (with the lab down, `Run` exercises the MF resilience path). Serial single worker, since the dev server compiles on demand and parallel workers would race a cold start. The federation/presence happy-paths (which need all three servers) are a later opt-in spec. The CI branches (`reporter: 'github'`, retries) are wired but no workflow runs it yet.
