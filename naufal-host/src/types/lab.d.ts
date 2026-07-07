// The lab remote's typed surface — the mount-function contract, hand-written.
// This replaces the dts-plugin's downloaded `@mf-types/` snapshot: with the lab
// out of the build-config `remotes` (vite.config.ts — kept off the first-paint
// path), nothing auto-downloads types anymore, and a fresh clone must type-check
// without the lab ever running. The contract is deliberately tiny and stable
// (see docs/mf-core.md); if the lab exposes a new module, add its declaration
// here by hand.
declare module 'lab/SpringToy' {
  export default function mountSpringToy(
    target: HTMLElement,
    opts?: Record<string, unknown>
  ): () => Promise<void>
}

declare module 'lab/Presence' {
  export default function mountPresence(
    target: HTMLElement,
    opts?: Record<string, unknown>
  ): () => Promise<void>
}
