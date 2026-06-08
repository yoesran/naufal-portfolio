// Module Federation runtime plugin that prevents a failed remote from blocking
// host startup. Without it, an unreachable remote bubbles up as an unhandled
// rejection during MF auto-init and the host renders a blank page.
//
// We distinguish two failure cases by looking at args.id:
//   - "lab"          -> remote-level init failure. Return a benign stub so the
//                       host bootstrap completes and React mounts.
//   - "lab/SpringToy"-> specific exposed module fetch failed. Return a stub
//     "lab/Presence"    whose default function THROWS, so RemoteMount.catch in
//                       the host block fires and shows the offline fallback UI.

export default function () {
  return {
    name: 'mf-fallback',
    errorLoadRemote(args: { id: string; error: unknown }) {
      console.warn(`[MF] failed to load remote "${args.id}":`, args.error)

      if (args.id.includes('/')) {
        return {
          default: () => {
            throw new Error(`Remote unavailable: ${args.id}`)
          },
        }
      }

      return { default: () => () => {} }
    },
  }
}
