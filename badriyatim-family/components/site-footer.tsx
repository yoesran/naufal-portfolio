import Link from 'next/link'

import { Gonjong } from '@/components/gonjong'
import { NAV, SITE } from '@/lib/site'

export function SiteFooter() {
  return (
    <footer className="border-marun-deep bg-marun text-gading mt-16 border-t">
      <div className="mx-auto max-w-5xl px-4 py-10">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <div className="flex items-center gap-2.5">
              <Gonjong className="text-emas-light w-9" />
              <span className="font-heading text-lg font-semibold">
                {SITE.name}
              </span>
            </div>
            <p className="text-gading/85 mt-3 max-w-sm text-sm">
              {SITE.tagline}
            </p>
            <p className="text-gading/60 mt-1 text-sm">{SITE.roots}</p>
          </div>
          {/* min-h-11 rows: full 44px touch targets (links measured 21px tall). */}
          <nav aria-label="Navigasi footer" className="flex flex-col">
            {NAV.map((i) => (
              <Link
                key={i.href}
                href={i.href}
                className="text-gading/85 hover:text-gading flex min-h-11 items-center text-sm transition-colors hover:underline"
              >
                {i.label}
              </Link>
            ))}
            <Link
              href="/keluarga"
              className="text-emas-light hover:text-gading flex min-h-11 items-center text-sm transition-colors hover:underline"
            >
              Area Keluarga
            </Link>
          </nav>
        </div>
        <div className="hairline-emas my-6 opacity-50" />
        <p className="text-gading/65 text-xs">
          Untuk mengenang Badriyatim (Alm) &amp; Anizir (Almh) — agar
          persaudaraan tetap terjaga lintas generasi dan rantau.
        </p>
      </div>
    </footer>
  )
}
