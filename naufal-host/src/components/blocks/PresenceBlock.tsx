import { Trans } from 'react-i18next'

import { loadRemote } from '@module-federation/runtime'

import { Cell } from '@/components/Cell'
import { RemoteMount } from '@/components/RemoteMount'

export function PresenceBlock() {
  const load = () =>
    loadRemote('lab/Presence') as Promise<typeof import('lab/Presence')>

  return (
    <Cell label="// presence-room · Svelte remote + live WebSocket">
      <p className="text-muted-foreground text-sm leading-relaxed">
        <Trans
          i18nKey="presence.description"
          components={{
            svelteRemote: <span className="text-foreground font-medium" />,
            ws: <span className="text-foreground font-medium" />,
          }}
        />
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
