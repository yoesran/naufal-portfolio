import { loadRemote } from '@module-federation/runtime'

import { RemoteMount } from '@/components/RemoteMount'
import { usePresenceActive } from '@/lib/presence'

const PARTY_HOST = import.meta.env.VITE_PARTY_HOST ?? '127.0.0.1:1999'

// When presence is toggled on, mount the Svelte `Presence` remote in "global"
// mode: it renders a fixed, full-viewport, click-through layer that tracks the
// cursor across the whole page (not a boxed canvas) and shows a live count.
// Still a federated Svelte component running inside the React host — the same MF
// proof as before, just promoted from a card to a page-wide feature. Toggling off
// unmounts it, which closes its WebSocket (see Presence.svelte cleanup).
export function PresenceOverlay() {
  const active = usePresenceActive()
  if (!active) return null

  const load = () =>
    loadRemote('lab/Presence') as Promise<typeof import('lab/Presence')>

  return (
    <RemoteMount
      eager
      load={load}
      opts={{ host: PARTY_HOST, context: 'host', global: true }}
    />
  )
}
