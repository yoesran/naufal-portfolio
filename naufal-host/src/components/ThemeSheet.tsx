import { useTranslation } from 'react-i18next'

import { Palette } from 'lucide-react'

import { ThemeControls } from '@/components/ThemeControls'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'

// The theme customizer lives in a slide-over drawer off the header rather than a
// playground card: 5 axes is settings, not a demo. The "watch it cascade" proof
// is preserved because the page (and the live Svelte remote) re-skins in place
// behind the drawer as you change values — see ThemeControls / theme.ts.
export function ThemeSheet() {
  const { t } = useTranslation()
  return (
    <Sheet>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={t('themeDrawer.openLabel')}
            className="text-muted-foreground hover:text-foreground"
          >
            <Palette />
          </Button>
        }
      />
      <SheetContent side="right" className="w-full gap-0 p-0 sm:max-w-sm">
        <SheetHeader>
          <SheetTitle className="font-mono">
            {t('themeDrawer.title')}
          </SheetTitle>
          <SheetDescription className="leading-relaxed">
            {t('themeDrawer.description')}
          </SheetDescription>
        </SheetHeader>
        <div className="px-6 pb-6">
          <ThemeControls />
        </div>
      </SheetContent>
    </Sheet>
  )
}
