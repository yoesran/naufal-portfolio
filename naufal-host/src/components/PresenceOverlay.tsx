import { useTranslation } from 'react-i18next'

import { loadRemote } from '@module-federation/runtime'

import { RemoteMount } from '@/components/RemoteMount'
import { usePresenceActive } from '@/lib/presence'

const PARTY_HOST = import.meta.env.VITE_PARTY_HOST ?? '127.0.0.1:1999'

// When presence is toggled on, mount the federated Svelte `Presence` remote — it
// renders a fixed, full-viewport, click-through layer that tracks the cursor
// across the whole page and shows a live count. Still a Svelte component running
// inside the React host (the same MF proof), just a page-wide feature rather than
// a card. Toggling off unmounts it, which closes its WebSocket (see Presence.svelte).
export function PresenceOverlay() {
  const { t } = useTranslation()
  const active = usePresenceActive()
  if (!active) return null

  const load = () =>
    loadRemote('lab/Presence') as Promise<typeof import('lab/Presence')>

  return (
    <RemoteMount
      eager
      load={load}
      opts={{ host: PARTY_HOST, context: 'host' }}
      fallback={
        <div className="border-border bg-card/90 text-muted-foreground fixed bottom-4 left-1/2 z-40 -translate-x-1/2 rounded-full border px-3 py-1.5 font-mono text-xs shadow-sm backdrop-blur">
          {t('presence.unavailable')}
        </div>
      }
    />
  )
}
