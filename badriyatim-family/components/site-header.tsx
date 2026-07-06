'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

import { Menu } from 'lucide-react'

import { Gonjong } from '@/components/gonjong'
import { TextSizeControl } from '@/components/text-size-control'
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetTitle,
  SheetTrigger,
} from '@/components/ui/sheet'
import { NAV, SITE } from '@/lib/site'
import { cn } from '@/lib/utils'

export function SiteHeader() {
  const pathname = usePathname()
  const isActive = (href: string) =>
    href === '/' ? pathname === '/' : pathname.startsWith(href)

  return (
    <header className="border-border/70 bg-gading/90 sticky top-0 z-40 border-b backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-3">
        <Link
          href="/"
          className="flex min-h-11 items-center gap-2.5"
          aria-label={`${SITE.name} — Beranda`}
        >
          <Gonjong className="text-emas w-9" />
          <span className="font-heading text-marun text-lg leading-none font-semibold">
            {SITE.name}
          </span>
        </Link>

        <nav
          aria-label="Navigasi utama"
          className="hidden items-center gap-1 md:flex"
        >
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              aria-current={isActive(item.href) ? 'page' : undefined}
              className={cn(
                'rounded-md px-3 py-2 text-sm font-medium transition-colors',
                isActive(item.href)
                  ? 'bg-emas-pale text-marun-deep'
                  : 'text-tanah-soft hover:text-marun'
              )}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          <div className="hidden sm:block">
            <TextSizeControl />
          </div>

          <Sheet>
            <SheetTrigger
              className="border-border text-marun flex min-h-11 min-w-11 items-center justify-center rounded-md border md:hidden"
              aria-label="Buka menu navigasi"
            >
              <Menu className="size-5" />
            </SheetTrigger>
            <SheetContent
              side="right"
              className="bg-gading w-[18rem] p-6 sm:w-80"
            >
              <SheetTitle className="font-heading text-marun">
                {SITE.name}
              </SheetTitle>
              <nav aria-label="Navigasi" className="mt-5 flex flex-col gap-1">
                {NAV.map((item) => (
                  <SheetClose
                    key={item.href}
                    nativeButton={false}
                    render={
                      <Link
                        href={item.href}
                        aria-current={isActive(item.href) ? 'page' : undefined}
                        className={cn(
                          'rounded-md px-3 py-3 text-base font-medium transition-colors',
                          isActive(item.href)
                            ? 'bg-emas-pale text-marun-deep'
                            : 'text-tanah hover:bg-gading-deep'
                        )}
                      />
                    }
                  >
                    {item.label}
                  </SheetClose>
                ))}
              </nav>
              <div className="mt-8">
                <p className="text-tanah-soft mb-2 text-sm">Ukuran teks</p>
                <TextSizeControl />
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  )
}
