import { useTranslation } from 'react-i18next'

import { MousePointer2 } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { togglePresence, usePresenceActive } from '@/lib/presence'
import { cn } from '@/lib/utils'

// Header control that opts into the live-cursor overlay. Off by default (no
// socket until clicked); when on, a dot marks it live. The actual cursors +
// count are rendered by the global PresenceOverlay (the Svelte remote).
export function PresenceToggle() {
  const { t } = useTranslation()
  const active = usePresenceActive()
  return (
    <Button
      variant={active ? 'outline' : 'ghost'}
      size="icon-xs"
      aria-pressed={active}
      aria-label={t('presence.toggleLabel')}
      title={t('presence.toggleLabel')}
      onClick={togglePresence}
      className={cn(
        'relative',
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <MousePointer2 />
      {active && (
        <span className="absolute -top-0.5 -right-0.5 size-1.5 rounded-full bg-emerald-400 motion-safe:animate-pulse" />
      )}
    </Button>
  )
}
