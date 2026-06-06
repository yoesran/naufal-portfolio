# naufal-blog

The **standalone content site** of a polyglot microfrontend portfolio — Next.js 16 (App Router, **static export**) for SEO. It holds the CV page and technical posts (starting with the cross-framework Module Federation build). It is **not** a federated remote; it deploys separately to Cloudflare Pages, and shares the portfolio's shadcn + CSS-variable theme tokens for visual unity with the host.

**Live:** <https://naufal-blog.pages.dev> (→ `/en`, `/id`)

**Features:** locale-routed **i18n (EN/ID)** with translated UI + content (CV data, per-locale `.mdx` posts) and hreflang; **light/dark/system** theme; a per-post **reading panel** (font family / size / background). All client prefs restore before paint via [`public/prepaint.js`](public/prepaint.js) (loaded `beforeInteractive`, external — never an inline `<script>`; see gotcha #24).

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn · `@next/mdx` + `remark-gfm` · static export (`output: 'export'`).

`npm run dev` to develop; `npm run build` emits a static `out/` for direct upload. A root `app/layout.tsx` owns `<html>`/`<body>` with the locale routes nested under `app/[lang]/`; see the project docs in [`../docs`](../docs) (start at [`../docs/README.md`](../docs/README.md)), [`../docs/gotchas.md`](../docs/gotchas.md) #24–25 for the i18n/static-export traps, and [`../docs/deployment.md`](../docs/deployment.md) for the deploy flow.
