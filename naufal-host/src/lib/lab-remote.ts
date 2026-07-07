import { registerRemotes } from '@module-federation/runtime'

export const LAB_URL = import.meta.env.VITE_LAB_URL ?? 'http://127.0.0.1:5174'

// The lab is deliberately NOT in vite.config's federation `remotes`: a
// build-config remote gets its remoteEntry.js fetched inside the generated MF
// bootstrap, BEFORE the app entry executes — putting a cross-origin fetch (or,
// with the lab down, a connection timeout) on the first-paint critical path
// (measured: ~1s of FCP deployed, a 3s stall locally). Registering here, on
// the first code path that actually needs the remote, moves that fetch to
// after paint; a down lab then only affects the federated blocks (which have
// fallbacks), never FCP. Callers: run before any loadRemote('lab/*').
let registered = false
export function ensureLabRemote() {
  if (registered) return
  registered = true
  registerRemotes([
    { name: 'lab', type: 'module', entry: `${LAB_URL}/remoteEntry.js` },
  ])
}
