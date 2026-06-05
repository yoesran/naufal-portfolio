# naufal-host

The **React host** of a polyglot microfrontend portfolio — it composes a Svelte remote (`naufal-lab`) at runtime via Module Federation, and owns the page shell, theming, and i18n. The home page is a vertical gallery of independent interactive blocks; the federated ones are mounted through a generic `RemoteMount` over a framework-agnostic `(target, opts) => cleanup` contract.

**Live:** <https://naufal-host.pages.dev>

**Stack:** React 19 · Vite · `@module-federation/vite` · React Compiler · Tailwind/shadcn · i18next.

See the project docs in [`../docs`](../docs) — start at [`../docs/README.md`](../docs/README.md) for the architecture, the federation mechanics, the gotchas, and how to run everything locally.
