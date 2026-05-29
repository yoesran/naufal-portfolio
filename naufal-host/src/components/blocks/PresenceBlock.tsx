import { loadRemote } from '@module-federation/runtime'

import { Cell } from '@/components/Cell'
import { RemoteMount } from '@/components/RemoteMount'

export function PresenceBlock() {
  const load = () =>
    loadRemote('lab/Presence') as Promise<typeof import('lab/Presence')>

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
        <RemoteMount
          load={load}
          opts={{
            host: import.meta.env.VITE_PARTY_HOST ?? '127.0.0.1:1999',
            context: 'host',
          }}
        />
      </div>
    </Cell>
  )
}
