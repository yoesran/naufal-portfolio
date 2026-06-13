import { createToggleStore, useToggle } from './toggleStore'

// Shared on/off store for the global presence overlay. The header toggle flips
// it; the App-level overlay reads it to mount/unmount the Svelte Presence remote
// (which opens its WebSocket only then — opt-in by design, no socket until the
// visitor turns cursors on). See toggleStore.ts for the shape.
const store = createToggleStore()

export const setPresenceActive = store.set
export const togglePresence = store.toggle

export function usePresenceActive(): boolean {
  return useToggle(store)
}
