import { useSyncExternalStore } from 'react'

// Tiny shared store for the global presence overlay's on/off state. The header
// toggle flips it; the App-level overlay reads it to mount/unmount the Svelte
// Presence remote. A module store (like theme.ts) keeps the two in sync without
// threading props through the Header. Opt-in by design: no WebSocket opens until
// the visitor turns cursors on.
let active = false
const listeners = new Set<() => void>()

function emit() {
  for (const l of listeners) l()
}

export function setPresenceActive(value: boolean) {
  if (active === value) return
  active = value
  emit()
}

export function togglePresence() {
  setPresenceActive(!active)
}

function subscribe(cb: () => void) {
  listeners.add(cb)
  return () => listeners.delete(cb)
}

export function usePresenceActive(): boolean {
  return useSyncExternalStore(
    subscribe,
    () => active,
    () => false
  )
}
