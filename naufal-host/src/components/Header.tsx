import { useTranslation } from 'react-i18next'

import { Menu } from 'lucide-react'

import { LocaleToggle } from '@/components/LocaleToggle'
import { BLOG_URL } from '@/lib/links'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { useMediaQuery } from '@/lib/useMediaQuery'

export function Header() {
  const { t } = useTranslation()
  // Tailwind `sm` breakpoint. The mobile menu's popup portals to <body>, so a
  // `sm:hidden` class can't hide it — it must be unmounted on desktop entirely,
  // or its popup anchors to the (display:none) trigger and surfaces under the
  // sticky header.
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const nav = [
    { label: t('header.nav.work'), href: '#work' },
    { label: t('header.nav.blog'), href: BLOG_URL },
    { label: t('header.nav.cv'), href: `${BLOG_URL}/cv` },
  ]

  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-2 px-6 py-3">
        <a
          href="/"
          className="text-foreground hover:text-brand font-mono text-sm font-medium transition-colors"
        >
          naufal.dev
        </a>
        <nav className="flex items-center gap-2 font-mono text-xs sm:gap-5">
          {/* Inline links on >=sm; collapse into a menu on mobile to avoid overflow. */}
          <div className="hidden items-center gap-5 sm:flex">
            {nav.map((item) => (
              <a
                key={item.label}
                href={item.href}
                className="text-muted-foreground hover:text-foreground transition-colors"
              >
                {item.label}
              </a>
            ))}
          </div>

          <LocaleToggle />

          {!isDesktop && (
            <DropdownMenu>
              <DropdownMenuTrigger
                render={
                  <Button
                    variant="ghost"
                    size="icon-xs"
                    aria-label={t('header.menuLabel')}
                    className="text-muted-foreground hover:text-foreground"
                  >
                    <Menu />
                  </Button>
                }
              />
              <DropdownMenuContent
                align="end"
                className="min-w-32 font-mono text-xs"
              >
                {nav.map((item) => (
                  <DropdownMenuItem
                    key={item.label}
                    render={<a href={item.href} />}
                  >
                    {item.label}
                  </DropdownMenuItem>
                ))}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </nav>
      </div>
    </header>
  )
}
