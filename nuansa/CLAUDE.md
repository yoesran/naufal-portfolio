# Nuansa — sections + shells platform for info-display microsites

**Read `SPEC.md` first — it is the architecture.** One platform serves online
invitations, linktree-style profiles, menus, event guides. Developers author
**sections** (a contract + defaults + label/icon; *no styling*) and **shells**
(a visual identity: chrome + **one renderer per section it supports**). A
**template** is just a preset: shell id + default section order. The platform
generates each section's form from its contract, lets an operator compose the
page (reorder/toggle/add/remove), and renders the real shell as a live preview.

**Why renderers live in the shell:** the first architecture had one global
renderer set, so every template was the same page reskinned — that's what we
deleted. Shell-owned renderers keep two designs genuinely different. A shell
can render exactly the sections it wrote a renderer for; that absence *is* the
compatibility rule (gallery has no paged renderer). Sections are
self-contained — countdown carries its own date, so reordering can't break it.

**Stack:** Next.js 16 · React 19 · Tailwind v4 · shadcn/ui (base-vega) ·
React Hook Form + Zod · **Supabase** (Postgres later; Auth/Storage after).
**Public portfolio repo** — write README/docs for outside readers.
Single-locale Bahasa product (`lang="id"`): editor chrome, contract labels, and
validation messages are all Indonesian, hardcoded — no i18n library (YAGNI).
No theme provider; shells carry their own palettes.

**Layout & layering.** Generic platform, knows no section library:
`lib/fields.ts` (vocabulary, `buildSchema`, `ContentOf`), `lib/sections.ts` +
`lib/shells.ts` (types + `defineX` + `supportedSectionIds`).
**`lib/site.ts` is the one composition module** that imports `SECTIONS` — it
joins shell↔sections (`supportedSections`), builds `siteSchema`, holds
`SITE_CONTRACT` (site-wide settings, generated like any section) and `seedSite`.
Content — **one file per section**: `sections/<id>.ts` (contract + `defaultContent`
+ exported `XContent` type), listed in `sections/index.ts`'s `ALL`. Each shell is
`shells/<id>/`: `chrome.tsx`, `primitives.tsx` (that shell's own `Title`/`Portrait`
— never shared across shells), and **one renderer per section** in
`renderers/<id>.tsx` re-exported by `renderers/index.ts` (that barrel's export
list IS the shell's compatibility surface). `shells/kupu` (paged tabs, inline-SVG
ornament) + `shells/alur` (vertical scroll, editorial, hosts `gallery`) ·
`templates/index.ts` (presets). UI: `components/form/generated-form.tsx`
(recurses group/list; `prefix` roots names at `sections.N.content`),
`components/editor/`, `components/site-renderer.tsx`. Shared **behavior only**:
`lib/use-countdown.ts`, `lib/date.ts`, `lib/music-button.tsx`. Visuals are never
shared between shells. Nothing in the editor builds a control by hand.

**Gotchas (hard-won — don't relearn):**

1. `f.list` must be generic over the item's *schema* (`FieldMeta<S>`), not the
   whole `FieldMeta` — a deferred `I["schema"]` won't infer through `z.array`
   and the element type silently collapses to `unknown`. `tests/fields.spec.ts`
   holds compile-time guards (runtime tests can't catch it: `unknown[]` accepts
   anything).
2. Shell components can't cross the server→client boundary as props — the route
   passes `templateId` only; the client re-looks-up `TEMPLATES`/`SHELLS`.
3. The preview is a dumb pass-through of *unvalidated* draft values. Shell rule
   #2 (tolerate partial content) pays for that; a last-valid snapshot was worse
   UX and more code.
4. Track the active tab **by key, not index** — reorder/remove strands an index.
5. `seedSite` derives keys from the preset, never `crypto.randomUUID()`: the
   editor is SSR'd, keys land in rendered ids, and random ones break hydration.
   Sections *added* later get a uuid (client-only click), which is safe.
6. Time-dependent renderers keep the clock in state and start it after mount;
   parse dates with `split('-')`, never `new Date(str)` (server TZ ≠ browser TZ).
7. React Compiler's `react-hooks/immutability` rejects a running remainder
   mutated during render — derive each unit independently.
   `react-hooks/set-state-in-effect` flags direct setState in an effect body but
   not inside a called fn: restructure, don't disable.
8. base-ui `Switch` renders a hidden checkbox beside `role="switch"`, so
   `getByLabel` is ambiguous — target the role. `<main>` can't take
   `role="tabpanel"`. Tailwind v4 canonical var syntax is `bg-(--x)`.
9. A preset naming a section its shell can't render fails **silently** (card in
   the editor, nothing in the preview). `tests/smoke.spec.ts` asserts every
   section card has a matching nav item — verified to fail on a bad preset.
10. Every renderer must handle "no sections at all" (an operator can hide them
    all); both chromes render a message rather than a blank viewport.

**Next:** `/:slug` + real gallery on mock storage → a non-invitation shell
(linktree/menu) → Supabase persistence. Not started: persistence, auth, widgets
(RSVP/guestbook), image upload, plans.

**Checks (all must stay green):** `npm run lint` · `npm run typecheck` ·
`npm run format:check` · `npm run test:e2e` (Playwright; builds + starts the
prod server itself). The suite covers both shells.

@AGENTS.md
