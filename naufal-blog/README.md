# naufal-blog

The **standalone content site** of a polyglot microfrontend portfolio — Next.js 16 (App Router, **static export**) for SEO. It holds the CV page and technical posts (starting with the cross-framework Module Federation build). It is **not** a federated remote; it deploys separately to Cloudflare Pages, and shares the portfolio's shadcn + CSS-variable theme tokens for visual unity with the host.

**Stack:** Next.js 16 · React 19 · TypeScript · Tailwind v4 · shadcn · static export (`output: 'export'`).

`npm run dev` to develop; `npm run build` emits a static `out/` for direct upload. See the project docs in [`../docs`](../docs) (start at [`../docs/README.md`](../docs/README.md)), and [`../docs/deployment.md`](../docs/deployment.md) for the deploy flow.
