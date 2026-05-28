import { loadRemote } from '@module-federation/runtime'

import { Cell } from '@/components/Cell'
import { RemoteMount } from '@/components/RemoteMount'

const loadPresence = () =>
  loadRemote('lab/Presence') as Promise<typeof import('lab/Presence')>
const PRESENCE_OPTS = {
  host: import.meta.env.VITE_PARTY_HOST ?? '127.0.0.1:1999',
  context: 'host',
}

export function PresenceBlock() {
  return (
    <Cell label="// presence-room · Svelte remote + live WebSocket">
      <p className="text-muted-foreground text-sm leading-relaxed">
        Two patterns at once: this canvas is a separate{' '}
        <span className="text-foreground font-medium">Svelte remote</span>{' '}
        loaded over Module Federation, and it holds its own live{' '}
        <span className="text-foreground font-medium">WebSocket</span>{' '}
        connection. Move your cursor inside it — anyone else here sees it in
        realtime. Open a second tab to watch.
      </p>

      <div className="mt-4">
        <RemoteMount load={loadPresence} opts={PRESENCE_OPTS} />
      </div>
    </Cell>
  )
}
