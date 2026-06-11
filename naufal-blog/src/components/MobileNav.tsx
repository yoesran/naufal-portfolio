'use client'

import { Menu } from 'lucide-react'

import { Link } from '@/components/Link'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import type { Locale } from '@/lib/i18n/config'
import { useMediaQuery } from '@/lib/useMediaQuery'

type Labels = { posts: string; cv: string; menu: string }

// Phone-only nav: the header's inline Posts/CV links hide below `sm`, so without
// this those pages are unreachable from the chrome. Mirrors naufal-host's Header.
export function MobileNav({ lang, labels }: { lang: Locale; labels: Labels }) {
  const isDesktop = useMediaQuery('(min-width: 640px)')
  // Unmount the whole menu on desktop in JS rather than hiding the trigger with
  // `sm:hidden`: the popup portals to <body>, so a CSS-hidden trigger would
  // still anchor an open popup to a zero-box element (gotchas #20). `sm:hidden`
  // on the trigger only covers the pre-hydration frame (isDesktop is false until
  // mount), so desktop never flashes the button.
  if (isDesktop) return null

  const items = [
    { label: labels.posts, href: `/${lang}/posts` },
    { label: labels.cv, href: `/${lang}/cv` },
  ]

  return (
    <DropdownMenu>
      <DropdownMenuTrigger
        render={
          <Button
            variant="ghost"
            size="icon-xs"
            aria-label={labels.menu}
            className="text-muted-foreground hover:text-foreground sm:hidden"
          >
            <Menu />
          </Button>
        }
      />
      <DropdownMenuContent align="end" className="min-w-32 font-mono text-sm">
        {items.map((item) => (
          <DropdownMenuItem key={item.href} render={<Link href={item.href} />}>
            {item.label}
          </DropdownMenuItem>
        ))}
      </DropdownMenuContent>
    </DropdownMenu>
  )
}
