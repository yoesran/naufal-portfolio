import { useTranslation } from 'react-i18next'

import { Frame } from 'lucide-react'

import { Button } from '@/components/ui/button'
import { toggleCanvas, useCanvasMode } from '@/lib/canvas'
import { cn } from '@/lib/utils'

// Opens the Figma-like canvas view of the whole site. Available on every device
// — drag to pan, scroll to zoom; touch uses two-finger pinch + drag.
export function CanvasToggle() {
  const { t } = useTranslation()
  const active = useCanvasMode()
  return (
    <Button
      variant={active ? 'outline' : 'ghost'}
      size="icon-xs"
      aria-pressed={active}
      aria-label={active ? t('canvas.exitLabel') : t('canvas.toggleLabel')}
      title={active ? t('canvas.exitLabel') : t('canvas.toggleLabel')}
      onClick={toggleCanvas}
      className={cn(
        active
          ? 'text-foreground'
          : 'text-muted-foreground hover:text-foreground'
      )}
    >
      <Frame />
    </Button>
  )
}
