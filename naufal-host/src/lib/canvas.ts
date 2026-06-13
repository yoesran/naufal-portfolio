import { createToggleStore, useToggle } from './toggleStore'

// Shared on/off store for "canvas mode" — the Figma-like zoomable view of the
// whole site. The header toggle flips it; App swaps the normal page for the
// CanvasStage; useInView reads it so every scroll-revealed block shows at once
// (a transformed plane never reliably triggers IntersectionObserver). Off by
// default — the site is a site first, a canvas on demand. See toggleStore.ts.
const store = createToggleStore()

export const setCanvasMode = store.set
export const toggleCanvas = store.toggle

export function useCanvasMode(): boolean {
  return useToggle(store)
}
