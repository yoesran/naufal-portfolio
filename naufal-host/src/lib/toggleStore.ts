import { useSyncExternalStore } from 'react'

// A tiny module-level on/off store with a `useSyncExternalStore` reader — the
// shared shape behind the header's opt-in toggles (presence, canvas). A module
// store (vs component state) lets the header toggle and a far-away consumer stay
// in sync without threading props. Each feature wraps one of these and exports
// its own named `set` / `toggle` / `useX` so call sites read naturally.
//
// (theme.ts is intentionally NOT built on this — it's a multi-axis config store,
// not a boolean toggle.)
export type ToggleStore = {
  set: (value: boolean) => void
  toggle: () => void
  subscribe: (cb: () => void) => () => void
  /** Stable getSnapshot for useSyncExternalStore. */
  get: () => boolean
  /** Server snapshot — always `false` (these features are client-only). */
  getServer: () => boolean
}

export function createToggleStore(initial = false): ToggleStore {
  let active = initial
  const listeners = new Set<() => void>()
  // Arrow functions (not methods) so each stays bound when exported standalone
  // — e.g. `export const togglePresence = store.toggle`.
  const set = (value: boolean) => {
    if (active === value) return
    active = value
    for (const l of listeners) l()
  }
  return {
    set,
    toggle: () => set(!active),
    subscribe: (cb) => {
      listeners.add(cb)
      return () => listeners.delete(cb)
    },
    get: () => active,
    getServer: () => false,
  }
}

// Read a toggle store as a hook. Kept here (not inline in each store) so the
// `useSyncExternalStore` wiring lives in exactly one place.
export function useToggle(store: ToggleStore): boolean {
  return useSyncExternalStore(store.subscribe, store.get, store.getServer)
}
