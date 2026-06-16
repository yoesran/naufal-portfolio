# Project Handoff — Polyglot Microfrontend Portfolio

This is the planning/decision record — the _why_ behind the build. **Do not regenerate or relitigate decisions already made** — they were reached through deliberate tradeoff discussion. For the _how_ (current code), see the technical docs: [overview.md](./overview.md), [mf-core.md](./mf-core.md), [mf-platform.md](./mf-platform.md), [features.md](./features.md). For traps already solved, [gotchas.md](./gotchas.md).

---

## About me

Naufal Yusran, software engineer in Jakarta. Frontend-leaning fullstack, ~3 years professional experience. Working at DBS Bank Indonesia (Feb 2026 – present) as a React.js Developer on a webview-based microfrontend app using Module Federation. Prior: eDOT (Next.js dashboards), Ajaib (Next.js landing pages + onboarding webview), Bank Danamon (DBankPro 2.0 back office, React container + Angular feature modules with Single-SPA → NX migration), Infosys, Doubler Studio (BCA projects in vanilla JS/jQuery/Nunjucks/React/Next), GeekGarden (Flutter), Ehealth (Polymer), Traveloka intern.

Education: Bachelor of Informatics, Universitas Islam Indonesia, Cum Laude (GPA 3.69/4.00).

Stack experience: React, Next.js, Angular, JavaScript, TypeScript, Tailwind, Bootstrap, Flutter, Microfrontend (Single-SPA, NX, Module Federation), React Query, React Hook Form, Zod, Playwright, jQuery, Drone CI, SonarQube, Nexus IQ, Agile/Scrum, Jira. Also Unity (game dev bootcamp at Agate via Kampus Merdeka).

---

## Project goal

Build a portfolio where the _architecture is the portfolio_ — a microfrontend system that demonstrates cross-framework Module Federation, paired with a content site that tells the professional story. Two equally weighted goals:

1. Portfolio piece for job hunting
2. Learning/deepening MF skills

Stance on MF strictness: **pragmatic** — MF where it fits, alternative approaches (like sibling sites) where MF doesn't fit. Not dogmatic about federating everything. Knowing when NOT to use MF is itself part of the skill being demonstrated.

---

## Architecture (locked-in decisions)

### Two-site architecture, not one

- **Portfolio site at `naufal.dev`** — React Vite host, federated remotes. Home page is a "curated playground" (see below). Job: _show_ building ability, be living proof of the MF architecture.
- **Blog site at `blog.naufal.dev`** — Standalone Next.js, SSG for SEO. NOT a federated remote. Holds content: technical articles, the CV (as a styled exportable page), and the deeper "stories" behind each job. Job: _tell_ the story, be findable on Google. **Built with Next.js 16 static export (`output: 'export'`) → Cloudflare Pages**, deliberately over SSR/OpenNext: a content site needs no per-request server, and static export is unambiguously free + simpler (same direct-upload deploy flow as host/lab), while still fully crawlable. shadcn (React) + the portfolio's theme tokens give visual unity with the host. Built with theme unity + a branded home; the **CV page is built** — a pixel-faithful Calibri replica of the real CV (white A4 "sheet" in the dark frame, `transform`-scaled to fit on mobile — not `zoom`, which renders inconsistently on iOS Safari, see [gotchas.md](./gotchas.md) #28, `window.print()` → selectable PDF, phone shown only in the print) — and the **posts pipeline is built**: `@next/mdx` + `remark-gfm`, post bodies as `.mdx` in `src/content/<locale>/`, a metadata registry (`lib/posts.ts`) driving the index + each post's SEO metadata, a `[lang]/posts/[slug]` route prerendered per locale × slug (`dynamicParams: false`), and Tailwind-typography `prose` bound to the site tokens. OpenGraph/Twitter meta + a placeholder `og.png`, a `sitemap.xml` + `robots.txt` (static metadata routes), and a bundled **Carlito** font (metric-compatible with Calibri, so the CV prints one page on non-Windows devices) are all in place. **Deployed at `naufal-blog.pages.dev`** (independent Cloudflare Pages project). The first **real** post is still pending (a template post seeds the pipeline). The blog is now also **internationalized (EN/ID, locale-routed `/en` `/id`)** with translated UI **and** content (the CV data + per-locale `.mdx` post bodies), hreflang + per-locale sitemap; a **light/dark/system theme toggle**; and a per-post **reading panel** (font family / size / background). All client prefs (theme + reading) are restored before paint by one external `prepaint.js` (loaded `beforeInteractive` — not an inline `<script>`, which React 19 warns about on client navigation).

Reason for the split: Module Federation is client-rendered, bad for SEO. Content that needs to be crawlable lives in the SSR blog. Interactive things that don't need SEO live in the federated portfolio. Each tool used for what it's actually good at. The two sites share a visual identity so they feel unified, but they're independent deployments. Portfolio links to blog for substance; blog links to portfolio for live demos.

### Why not Next.js for the federated remote

Researched in May 2026: `@module-federation/nextjs-mf` is being deprecated, official Next.js MF support ending, App Router not supported. Building on it now means building on a sunsetting dependency.

Verified via web search at planning time:

- `@module-federation/vite` is the actively maintained successor, framework-agnostic
- SvelteKit + MF has SSR conflicts (`setContext` reexport issues) — use **plain Svelte + Vite**, not SvelteKit, for federated remotes
- Plain Svelte + Vite + MF works well (Giorgio Boa demos, Trendyol production case study)

### Project stack

See the [overview.md](./overview.md) project/stack table for the canonical version. In short: `naufal-host` (React 19) + `naufal-lab` (Svelte 5) + `naufal-party` (PartyKit) all working; `naufal-blog` (Next.js 16, standalone, static export) built (home + CV + MDX posts pipeline) and deployed at `naufal-blog.pages.dev`.

(There is no separate `naufal-tokens` package — see Design approach below. The earlier idea of a published tokens package was dropped as over-engineered.)

`naufal-party` is a sibling project added when the multiplayer-cursor block was built. It's a stateful WebSocket server (Vercel can't host one, which is part of why a VPS is on the table for deployment). The federated `Presence` component opens its own socket to it — see [features.md](./features.md) for the realtime architecture.

### Roadmap

> **Single source of truth for _current_ status is [overview.md](./overview.md)** (the stack table + per-project sections) and [features.md](./features.md) (what's built, in detail). This is the _decision-level_ arc — the shape of the plan and what each phase is _for_ — kept deliberately thin so it doesn't drift against the code. Don't re-narrate per-feature status here; update the technical docs instead.

- **v0.1 — federation proven.** The core thesis working end-to-end: a React host loading a Svelte remote at runtime, dev auto-reload, types flowing remote→host. Everything else builds on this.
- **v0.2 — the playground + making it production-shaped.** A gallery of interactive blocks, then resilience (fallback plugin, error boundary, lazy `loadRemote`), perceived-performance (scroll-reveal, preconnect), and the cross-cutting platform features that earn their place by crossing the boundary while staying decoupled — theme **cascade**, i18n **contract**, presence **backend** (see "selection filter" above). Deployed to Cloudflare (three independent origins, direct upload). Later **reworked** so the MF reads as a _running thing_, not an explainer: the live-remote block (a triggerable federation diagram wired to the real load), a global opt-in presence overlay, a theme drawer, and the draggable `SpringToy` remote. Later still, a **canvas view** (Figma-mode, header toggle) renders the home page as a zoomable/pannable artboard with margin annotations detailing each interaction — deliberately host _presentation chrome_: it presents the architecture and surfaces the easy-to-miss interactions, but does **not** cross the host↔remote boundary (so it's variety, not an MF demo). Detail in [features.md](./features.md).
- **v0.3 — content (in progress).** The standalone Next.js blog: branded home, pixel-faithful CV, the MDX posts pipeline, SEO basics, EN/ID i18n, theming, and a reading panel — all deployed. **The gap that still defines this phase: the first _real_ technical post** (the MF build itself; [gotchas.md](./gotchas.md) is the raw material) and the experience "stories."
- **v0.4+ — grow.** More blocks; more remotes in _other_ frameworks (Angular, vanilla JS) to prove the contract is framework-agnostic; harden presence (ghost-replay for the empty-room problem); an animated tech-stack block; a 3D block once Three.js is properly learned (deferred — see below); possibly an "architecture inspector" (live waterfall / loaded chunks / shared deps).

---

## The home page concept — "curated playground"

The home page is NOT a coherently-designed site with one consistent visual language. It is a **vertically-scrolling gallery of independent interactive blocks**. Each block is its own self-contained "wow" moment. The blocks intentionally do NOT match each other — the inconsistency is the aesthetic, and it mirrors the microfrontend architecture (independent pieces, composed).

**The one consistency rule — the "frame":** the page shell and the cell containers each block sits in stay consistent. This frame is what makes the page read as a deliberate collection rather than a junk drawer. The frame is non-negotiable; the block contents are free to be wild.

This direction was chosen deliberately because: (a) it removes the design-coherence burden — the user is not a designer and does not want to make design-system decisions; (b) it's the visual expression of the MF architecture; (c) it's an ever-growing container for future small projects — it never needs a redesign because there's no unified design to break.

Some blocks will be plain host code; some will be genuine federated remotes in different frameworks. Quality over quantity — a gallery is judged block-by-block, so a few genuinely good blocks beat many filler ones.

**What makes a block worth building (the selection filter).** A block earns its place if it **crosses the host↔remote boundary _and_ stays loosely coupled** — that's the only thing that actually demonstrates the microfrontend architecture rather than just being a nice interactive widget. Host-native blocks (Hero, TechStack) are fine as visual variety but are architecturally inert: they'd look the same in any single-page app. The features that justify the whole project are the boundary-crossing ones, and the v0.2 set converged on exactly three escalating mechanisms for sharing state across independently-deployed apps: **cascade** (theme — CSS vars on the host's `<html>` flow into the remote, zero coordination code), **contract** (i18n — only a locale string crosses, via `<html lang>`/`opts`, each app owning its own library), and **backend** (presence — the remote holds its own WebSocket and shares state through an external server). The decoupling half of the filter is non-negotiable: the moment a feature needs host and remote to share a JS module, call into each other's internals, or version-lock, it stops demonstrating MF and starts demonstrating why people regret it. This is also why a second remote in a _different_ framework (Angular/Vue) consuming these same contracts is high-value — it proves the patterns are framework-agnostic, not Svelte-specific. (This filter explains why v0.2 drifted from its original block-list plan toward the communication features.)

---

## Design approach (important — the user is not a designer)

The user has explicitly said they don't know design and don't want to make design decisions. The approach accommodates this:

- **Components**: shadcn/ui (React, in the host). shadcn-svelte for Svelte remotes, spartan/ui for a future Angular remote, shadcn-vue for a future Vue remote. All shadcn ports share the same CSS-variable conventions, so visual parity across frameworks is automatic at the CSS layer. **Prefer shadcn over bespoke — don't reinvent the wheel.** Before writing custom JSX for anything that could be a reusable primitive (Alert, Skeleton, Card, Badge, Tooltip, Separator, Avatar, etc.), check shadcn's catalog first and install with `npx shadcn@latest add <name>`. Override Tailwind classes to match the project's look when needed — the structural and a11y benefits (Base UI / Radix under the hood) survive the overrides. Bespoke is reserved for: the playground's signature design primitives (`Cell`), visualization-specific surfaces (`TechStackBlock`'s orbit, `LiveRemoteBlock`'s federation diagram, the Svelte `SpringToy` lanyard), and interactive surfaces with no shadcn analogue.
- **Theme (colors/fonts)**: use a pre-made theme rather than hand-designing. tweakcn (tweakcn.com) is the recommended tool — pick/generate a palette, export CSS variables. This removes the color-decision burden. **Palette intent:** near-black dark background with a slight cool tint, off-white headings, muted-gray body text, and one sparingly-used accent (emerald default). This is now the _default_ of a full visitor-facing customizer — the theme drawer (a header `Sheet`) themes mode, accent, surface, radius, and font, all via CSS variables on the host that cascade into the remotes. Curated options only (no free color pickers) so contrast can't break. Light mode is a mirror via the same CSS-variable theme.
- **Layout & fine visual calls**: Claude Code makes these; the user reacts in plain language ("too bright", "bigger headings", "more space"). Reacting to concrete output is the user's design workflow — not originating from scratch.
- **Reference material**: Figma shadcn kits (Obra shadcn/ui kit, RAVN's kit) and the Magic UI portfolio (github.com/dillionverma/portfolio) are reference points the user can _point at_ to make abstract preferences concrete. Not for wholesale cloning of the host (would fight the MF architecture), but fine as reference and fine to clone for the blog later.

Cross-framework component sharing happens at the **CSS layer** (shared CSS variables), not the JS layer. The same button in React-shadcn and Svelte-shadcn-svelte looks identical because both read `--primary`.

### Three.js / 3D — deliberately deferred

A 3D animated home page was considered and **paused**. The user wants to _learn_ Three.js properly first rather than copy-paste it. When built later, the 3D piece becomes just ONE block in the playground (not the whole page's burden), and the current non-3D home page becomes its `prefers-reduced-motion` / low-capability fallback. Nothing built now is throwaway. R3F (React Three Fiber) + drei is the recommended approach when the time comes.

---

## Cross-framework MF pattern (the principle)

The remote does NOT expose framework-specific components. It exposes **a mount function** with a framework-agnostic signature `(target, opts?) => cleanup`. `exposes` points at `mountSpringToy.ts`, not `SpringToy.svelte`; the host renders it via a generic `<RemoteMount>` wrapper. This pattern works identically for Angular, Vue, vanilla JS — the host stays framework-agnostic, the remote owns its own framework lifecycle. This is also how Single-SPA does it.

The optional `opts` object is future-proofing — i18n's `locale` rides on it without an API change. The full current implementation (mount adapter, `RemoteMount`, the `opts` contract, the Svelte 5 instantiation gotcha) is in [mf-core.md](./mf-core.md).

---

## Resolved cross-cutting decisions

- **i18n**: each remote owns its own translations and i18n library; only the locale STRING crosses the boundary. Host shipped: `i18next` + `react-i18next` + language detector, en + id (Indonesian draft, awaiting native-speaker review), `LocaleToggle` in the header, and it owns `<html lang>`. Lab shipped: `svelte-i18n`, en + id, reading `<html lang>` for its locale and a `MutationObserver` for live switches (chosen over `opts.locale` + re-mount so the Presence WebSocket survives a language change). Both locale sets are Indonesian-draft, awaiting native-speaker review. Full detail in [features.md](./features.md).
- **Dark mode**: pure CSS variables. Host toggles a class on `<html>`; every remote inherits it through the cascade — zero coordination code on the remote side, no events crossing the boundary. The light / dark / system control is the base-mode axis of the theme drawer (a shadcn `ToggleGroup`), backed by the host's shared theme store (`theme.ts`, via `useSyncExternalStore`); a generated pre-paint script (built from `theme-tokens.ts` by the `theme-prepaint` Vite plugin) kills FOUC + theme-flash. Standalone lab stays dark-only. Full detail in [features.md](./features.md).
- **SSR for remotes**: don't. Federated remotes stay client-rendered. Content needing SSR/SEO goes in the standalone Next.js blog. For perceived performance use loading skeletons + preloading, not SSR-over-federation.
- **Monorepo vs split**: currently sibling folders (`naufal-host/`, `naufal-lab/`) with NO workspace tooling (no npm/pnpm workspaces, no Nx, no Turborepo). Deliberate — keeps a future split into separate repos nearly free (move the folder, update the watcher path). Split when there's a real reason (third remote, collaborators), not before. Do NOT add a parent-level `package.json`.

---

## Open issues / next concrete tasks

> Deployment is **done** — all four pieces are live on Cloudflare + the PartyKit runtime via direct upload (see [deployment.md](./deployment.md)). The env-aware URLs, resilience, and CORS that this list once tracked as pending have all shipped. What remains:

1. **First blog post** — the highest-leverage gap. The "show" half (the live architecture) is done; the "tell the story" half isn't written yet. Draw on [gotchas.md](./gotchas.md), which doubles as the running learnings log (the role the old `LEARNINGS.md` task was meant to fill): the MF build, the TS6/baseUrl trap, the Tailwind-across-the-boundary lesson, and the eager-preload / `loadRemote` pattern are all publishable as-is. A template post already seeds the pipeline.
2. **Harden presence — DONE (echoes shipped).** The empty-room problem is solved: the server records real (anonymous) cursor paths and, on leave, stores them as ghosts in a capped ring buffer (seeded so the first visitor sees something); a solo visitor replays them as translucent "echo" cursors — "the room remembers" (see [features.md](./features.md)). The earlier hygiene also shipped: the self-identity pill from `welcome`, reconnect reset, and a 5-minute peer sweep.
3. **Native-speaker pass on the Indonesian copy** — both locale sets (host + lab) are best-effort drafts flagged "awaiting native-speaker review" across the docs; Naufal _is_ the native speaker, so this is a quick self-review that closes a caveat repeated in [features.md](./features.md) and the overview.
4. **Add a third remote** later (Angular spartan/ui, Vue, or vanilla JS) to validate the `<RemoteMount>` + `opts` pattern scales across frameworks — the highest-value _architectural_ addition, since it proves the contracts are framework-agnostic, not Svelte-specific. **Now folded into the experience-section plan (decided 2026-06):** stories tell, playground shows. (a) Detailed per-job stories live on the **blog** at `/[lang]/work/[slug]` (MDX, mirroring `posts`), cross-linked from the CV; (b) per-job **demo remotes are built in the framework that job actually used** — Danamon → an Angular remote re-creating the DBankPro pattern (React container mounting Angular modules; this IS the third-remote validation), Doubler → a vanilla JS remote, DBS → the portfolio itself, Next.js jobs → story-only (`nextjs-mf` is sunsetting — the reason this project exists); (c) the host's **experience block** (shipped: a git-log-graph career — parallel gigs as real branches, checkout-style selection with typed prompts (the prompt is a working mini-terminal — checkout/diff/log/reflog/status/tag/remote -v/whoami/clear/help, Tab completion, ↑ history, git-faithful errors), a moving HEAD with branch highlight, and a per-job "+ tool" skills delta — + detail panel, `src/lib/experience.ts` registry) is the connector — its per-entry `story`/`demo` fields light up as each piece ships, deep-linkable via `/?exp=<slug>#experience`. Demos must be sanitized from-scratch lookalikes of the _patterns_, never internal screens or data (three of these employers are banks).
5. **React Router** later — each remote/section gets its own URL.
6. **Polish — mostly DONE.** Shipped: a **skip-to-content link** (host → `main#work`, every blog page → `#content`, i18n'd) and a **Playwright smoke suite** (`naufal-host`, host-focused: home render, skip link, canvas toggle, locale switch, theme persistence, live-remote offline fallback — `npm run test:e2e`; see [running-locally.md](./running-locally.md)) — which on its first run caught and fixed a hero-heading accessible-name bug ([gotchas.md](./gotchas.md) #31). The testing has since grown into the **quality dashboard** (the `// quality` block): Vitest unit + React Testing Library component tests alongside the Playwright e2e suite (now recording video), published as full HTML reports to `naufal-reports.pages.dev` and surfaced on the page — see [deployment.md](./deployment.md) › Quality dashboard. `og.png` is a valid 1200×630 image; a custom-designed one (vs the current generic) is the only nicety left here.
7. **Wire the Cloudflare Web Analytics tokens** — the beacon plumbing shipped (host `VITE_CF_BEACON_TOKEN`, blog `NEXT_PUBLIC_CF_BEACON_TOKEN`; injected only when set, so nothing breaks while blank). Still open: create the two Web Analytics sites in the CF dashboard, paste each token into the respective `.env.production`, and redeploy. Until then the sites ship no beacon and there's zero visitor visibility — see [deployment.md](./deployment.md) _Analytics_.

A possible **CI/CD** follow-up: deploys are currently manual direct-uploads (order-sensitive: party → remote → host). A GitHub Action could automate the order, and a public repo is itself part of the showcase — deferred, not blocking. (A read-only **uptime monitor** — [`.github/workflows/uptime.yml`](../.github/workflows/uptime.yml) — already pings the live origins on a schedule and fails/emails if one is down; it runs once the repo is pushed to GitHub.)

---

## Working preferences for our collaboration

- Minimum-viable-first. Don't add complexity until the minimum is verified.
- Search the web before committing to a stack choice when versions might matter. Don't trust stale training data on package compatibility.
- Be honest about tradeoffs. Flag hard truths, don't sell the easy answer.
- Keep responses prose-first. Formatting only where it genuinely helps. No filler.
- When introducing a new pattern, explain _why_ it's right, not just how to apply it.
- Reference CV/work experience when relevant — it's a portfolio; connecting decisions to demonstrable experience is valuable.
- The user is not a designer. Make fine visual calls yourself; let the user react in plain language. Show plans before building so the user can react early.
- Don't relitigate settled decisions; if you disagree with one, flag it briefly and let the user decide.
