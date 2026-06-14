'use client'

import { useState } from 'react'

import { usePathname } from 'next/navigation'

import { Menu } from 'lucide-react'

import { Link } from '@/components/Link'
import { LocaleToggle } from '@/components/LocaleToggle'
import { ReadingControls } from '@/components/ReadingControls'
import { ThemeToggle } from '@/components/ThemeToggle'
import { Button } from '@/components/ui/button'
import {
  Sheet,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import type { Locale } from '@/lib/i18n/config'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { isPostDetailPath } from '@/lib/posts'
import { HOST_URL } from '@/lib/site'
import { useMediaQuery } from '@/lib/useMediaQuery'

// Phone-only menu: collapses the nav links + language / theme / reading controls
// into one hamburger drawer so the header doesn't overflow on small screens. On
// >=sm the header shows those inline instead and this unmounts. Unmounted on
// desktop in JS (not `sm:hidden`) because the drawer portals to <body> — see
// gotchas #20; `sm:hidden` on the trigger only covers the pre-hydration frame.
//
// Controlled (`open`) so a nav link can stay a real <a> (role=link) and close the
// drawer via onClick — wrapping a link in Base UI's <Close> would force button
// semantics onto a navigation link.
export function MobileMenu({ lang, dict }: { lang: Locale; dict: Dictionary }) {
  const isDesktop = useMediaQuery('(min-width: 640px)')
  const [open, setOpen] = useState(false)
  const isPostDetail = isPostDetailPath(usePathname() ?? '')
  if (isDesktop) return null

  const links = [
    { label: dict.nav.posts, href: `/${lang}/posts` },
    { label: dict.nav.cv, href: `/${lang}/cv` },
  ]

  return (
    <Sheet open={open} onOpenChange={setOpen}>
      <SheetTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={dict.nav.menu}
            className="text-muted-foreground hover:text-foreground sm:hidden"
          >
            <Menu />
          </Button>
        }
      />
      <SheetContent side="right" className="w-72 gap-0 overflow-y-auto p-6">
        <SheetTitle className="text-muted-foreground font-mono text-xs font-normal tracking-wide uppercase">
          {dict.nav.menu}
        </SheetTitle>

        <nav className="mt-4 flex flex-col gap-1 font-mono text-sm">
          {/* Back to the portfolio (the host) — external, so a plain anchor. */}
          <a
            href={HOST_URL}
            onClick={() => setOpen(false)}
            className="text-muted-foreground hover:text-foreground -mx-2 rounded-md px-2 py-1.5 transition-colors"
          >
            {dict.nav.portfolio}
          </a>
          {links.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              onClick={() => setOpen(false)}
              className="text-muted-foreground hover:text-foreground -mx-2 rounded-md px-2 py-1.5 transition-colors"
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <Section label={dict.locale.label}>
          <LocaleToggle current={lang} label={dict.locale.label} />
        </Section>
        <Section label={dict.theme.label}>
          <ThemeToggle labels={dict.theme} />
        </Section>
        {isPostDetail && (
          <Section label={dict.reading.label}>
            <ReadingControls labels={dict.reading} />
          </Section>
        )}
      </SheetContent>
    </Sheet>
  )
}

function Section({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="border-border/50 mt-5 flex flex-col gap-2 border-t pt-5">
      <p className="text-muted-foreground font-mono text-[0.7rem] tracking-wide uppercase">
        {label}
      </p>
      {children}
    </div>
  )
}
