import { Interactive } from '@/components/interactive'
import { buttonVariants } from '@/components/ui/button'
import { BRAND } from '@/lib/content'
import { cn } from '@/lib/utils'

// Server shell: static chrome + SEO text. Everything clock-driven or stateful
// lives under <Interactive/>; sections that share nothing are still rendered
// there for DOM order and the shared WITA clock.
export default function Page() {
  return (
    <>
      <div className="border-b-[3px] border-tinta bg-amber text-tinta">
        <div className="wrap flex flex-wrap items-baseline gap-3 py-2">
          <span className="inline-block -rotate-1 bg-tinta px-1.5 py-0.5 font-mono text-[0.7rem] font-bold tracking-[0.1em] text-amber uppercase">
            Draft
          </span>
          <span className="font-mono text-[0.72rem]">
            Data contoh — wifi, denah meja, harga makanan, koordinat, dan tahun
            tiap cabang belum dikonfirmasi Kopi Lima.
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b-[3px] border-tinta bg-lima/85 backdrop-blur-md">
        <div className="wrap flex items-center justify-between gap-5 py-3">
          <div className="font-display text-s1 text-white italic">
            KOPI LIMA
            <span className="ml-2.5 inline-block -rotate-3 bg-amber px-1.5 py-0.5 align-[0.4em] font-mono text-[0.58rem] font-bold tracking-[0.14em] text-tinta not-italic">
              NO FRANCHISE
            </span>
          </div>
          <nav
            className="hidden gap-5 font-mono text-[0.72rem] tracking-[0.08em] whitespace-nowrap uppercase min-[52rem]:flex"
            aria-label="Navigasi utama"
          >
            {(
              [
                ['#buka', 'Buka Sekarang'],
                ['#resv', 'Reservasi'],
                ['#menu', 'Menu'],
                ['#cerita', 'Cerita'],
                ['#borongan', 'Borongan'],
              ] as const
            ).map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="py-2 text-ink-soft no-underline hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href={BRAND.dmUrl}
            target="_blank"
            rel="noreferrer"
            className={cn(buttonVariants({ variant: 'cta', size: 'auto' }))}
          >
            Order by DM
          </a>
        </div>
      </header>

      {/* marquee — duplicated span set scrolls -50%; frozen by reduced-motion */}
      <div className="ticker" aria-hidden="true">
        <div className="ticker-track">
          {[0, 1].map((i) => (
            <span key={i}>
              ALL ITEMS 15K ★ NO FRANCHISE ★ DAILY CRUISIN’ ★ 3 PIT STOP 24 JAM
              ★ BALIKPAPAN × SAMARINDA ★ YANG ASLI CUMA YANG ADA 5-NYA ★
            </span>
          ))}
        </div>
      </div>

      <main>
        <Interactive />
      </main>

      <footer>
        <div className="checker" aria-hidden="true" />
        <div className="wrap flex flex-wrap items-center justify-between gap-5 py-9">
          <div className="flex flex-wrap gap-3">
            <a
              href={BRAND.dmUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(buttonVariants({ variant: 'cta', size: 'auto' }))}
            >
              Order by DM →
            </a>
            <a
              href={BRAND.grabUrl}
              target="_blank"
              rel="noreferrer"
              className={cn(
                buttonVariants({ variant: 'cta-ghost', size: 'auto' })
              )}
            >
              GrabFood
            </a>
          </div>
          <p className="m-0 font-mono text-[0.7rem] text-ink-faint">
            {BRAND.nama} — {BRAND.tagline} · tetap asli, tetap street ·{' '}
            <a href={BRAND.igUrl} target="_blank" rel="noreferrer">
              IG @{BRAND.ig}
            </a>{' '}
            · {BRAND.entity}
          </p>
        </div>
      </footer>
    </>
  )
}
