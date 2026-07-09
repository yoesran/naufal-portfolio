# Nuansa

A platform for the websites that exist only to display information a client
hands you — online invitations, linktree-style profiles, restaurant menus,
event guides. Build a **template** once (a real React page, any design, no
builder constraints), sell it to many clients: each client's **site** is just
that template plus their own content.

Two things get authored. A **section** is a content block — a contract of
editable fields (names, dates, up to N photos…) declared with a small
Zod-backed vocabulary, and no styling at all. A **shell** is a visual identity:
the chrome, plus one renderer for each section it supports. A **template** is
just a preset — a shell and a starting section order.

The platform generates each section's editing form from its contract, validates
against it at every boundary, and serves the result at a URL. Because renderers
live in the shell, two templates built from the same sections look genuinely
different — the paged `kupu` and the vertical `alur` share zero markup.

**[Read the full spec →](SPEC.md)**

## Stack

- **Frontend**: Next.js (App Router), React 19, TypeScript
- **Styling**: Tailwind CSS v4, shadcn/ui (Base UI)
- **Forms**: React Hook Form + Zod (forms are generated from section contracts)
- **Database**: Supabase — one `sites` table, sections as `jsonb`

## Status

Early, and deliberately core-only — there is no marketing site yet.

Working today: the field vocabulary and form generator (`lib/fields.ts`,
`components/form/`), nine invitation sections (`sections/`), two shells —
`kupu` (paged bottom-tab nav, original inline-SVG ornament) and `alur`
(vertical scroll, editorial, hosts the photo gallery `kupu` can't) — and an
editor at `/editor/[template]` where an operator reorders, toggles, adds and
removes sections beside a live preview of the real shell.

Next, per [SPEC.md](SPEC.md): public `/:slug` pages and a real gallery, a
non-invitation shell (linktree or menu) as the product-agnosticism proof, then
Supabase persistence.

## Development

```bash
npm run dev          # Start dev server (Turbopack)
npm run build        # Production build
npm run typecheck    # Type check
npm run lint         # Lint
npm run format       # Format with Prettier
npm run test:e2e     # Playwright smoke (builds + starts prod server itself)
```
