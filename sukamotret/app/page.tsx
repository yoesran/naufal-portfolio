import { Interactive } from '@/components/interactive'
import { Reveal } from '@/components/reveal'
import { buttonVariants } from '@/components/ui/button'
import { STUDIO } from '@/lib/content'
import { cn } from '@/lib/utils'

// Server shell: static chrome + SEO text. Everything sun-driven or stateful
// lives under <Interactive/> (one client boundary — the sections share look /
// hour / location so a choice made anywhere lands in the WhatsApp brief).
export default function Page() {
  return (
    <>
      <div className="border-b border-line bg-sunk text-s-1 text-ink-soft">
        <div className="wrap flex flex-wrap items-baseline gap-3 py-2.5">
          <span className="rounded-[2px] bg-ink px-1.5 py-0.5 font-mono text-[0.7rem] tracking-[0.1em] text-paper uppercase">
            Draft
          </span>
          <span>
            Data contoh — foto, harga, jam, dan nomor WhatsApp belum
            dikonfirmasi studio.
          </span>
        </div>
      </div>

      <header className="sticky top-0 z-20 border-b border-line bg-paper/90 backdrop-blur-md">
        <div className="wrap flex items-center justify-between gap-5 py-3.5">
          <div className="font-sans text-s-1 font-semibold tracking-[0.28em] uppercase">
            {STUDIO.name}
            <span className="text-accent">.</span>
          </div>
          {/* 52rem, not 44: seven links now — below that they wrap into a
              two-row header. Phones use the sections' own flow instead. */}
          <nav
            className="hidden gap-5 text-s-1 whitespace-nowrap min-[52rem]:flex"
            aria-label="Navigasi utama"
          >
            {(
              [
                ['#cahaya', 'Cahaya'],
                ['#karya', 'Karya'],
                ['#coba', 'Coba Cahaya'],
                ['#editfoto', 'Edit Foto'],
                ['#pose', 'Pose'],
                ['#sesi', 'Rancang Sesi'],
                ['#studio', 'Studio'],
              ] as const
            ).map(([href, label]) => (
              <a
                key={href}
                href={href}
                className="text-ink-soft no-underline hover:text-ink"
              >
                {label}
              </a>
            ))}
          </nav>
          <a
            href="#sesi"
            className={cn(buttonVariants({ variant: 'cta', size: 'auto' }))}
          >
            Booking
          </a>
        </div>
      </header>

      <main>
        <div className="wrap pt-[clamp(3rem,8vw,6rem)] pb-10">
          <Reveal>
            <p className="eyebrow">{STUDIO.regionLine}</p>
            <h1 className="mt-2.5 text-s4 leading-[0.98]">
              Turning moments
              <br />
              into{' '}
              {/* the one word that wears `--accent` — the colour of the light
                  at the moment you're reading it: amber inside golden hour,
                  blue otherwise. Everything golden-hour-specific is fixed amber
                  (see light-today), so this stays meaningful. */}
              <em
                className="text-accent italic transition-colors duration-700"
                title="Warnanya mengikuti cahaya di Tabalong saat ini"
              >
                memories
              </em>
              .
            </h1>
            <p className="mt-5 max-w-136 text-s1 leading-normal text-ink-soft">
              Foto prewedding, wisuda, keluarga, dan acara — dikerjakan orang
              yang tahu kapan cahaya sedang bagus.
            </p>
          </Reveal>
        </div>

        <Interactive />

        <section
          className="wrap py-[clamp(3.5rem,9vw,6rem)]"
          id="studio"
          aria-labelledby="studio-h"
        >
          <Reveal>
            <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-4">
              <h2 id="studio-h" className="text-s3 leading-tight">
                Studio
              </h2>
            </div>
            <div className="grid grid-cols-1 gap-[clamp(1.5rem,4vw,3rem)] min-[52rem]:grid-cols-2">
              <dl className="m-0 grid gap-px border border-line bg-line">
                {(
                  [
                    ['Jam buka', STUDIO.hours.split('\n')],
                    ['WhatsApp', [`+${STUDIO.whatsapp}`]],
                    ['Instagram', STUDIO.instagram],
                    ['TikTok', [STUDIO.tiktok]],
                    ['Lokasi', STUDIO.location.split(', ')],
                  ] as const
                ).map(([label, lines]) => (
                  <div
                    key={label}
                    className="flex justify-between gap-4 bg-paper px-5 py-4 text-s-1"
                  >
                    <dt className="pt-0.5 text-[0.66rem] tracking-[0.1em] text-ink-faint uppercase">
                      {label}
                    </dt>
                    <dd className="m-0 text-right font-mono">
                      {lines.map((line) => (
                        <div key={line}>{line}</div>
                      ))}
                    </dd>
                  </div>
                ))}
              </dl>
              <a
                href={STUDIO.mapsUrl}
                target="_blank"
                rel="noreferrer"
                className="group grid aspect-[4/3] place-items-center border border-line bg-surface font-mono text-s-1 text-ink-faint transition-colors hover:text-accent"
                style={{
                  backgroundImage:
                    'repeating-linear-gradient(0deg, transparent 0 22px, var(--line) 22px 23px), repeating-linear-gradient(90deg, transparent 0 22px, var(--line) 22px 23px)',
                }}
              >
                <span className="flex items-center gap-1.5">
                  <span
                    aria-hidden="true"
                    className="transition-transform group-hover:-translate-y-0.5"
                  >
                    📍
                  </span>
                  Buka di Google Maps
                </span>
              </a>
            </div>
          </Reveal>
        </section>
      </main>

      <footer className="border-t border-line py-10 text-s-1 text-ink-soft">
        <div className="wrap flex flex-wrap justify-between gap-5">
          <span>
            {STUDIO.name} — {STUDIO.tagline}
          </span>
          <span className="font-mono text-[0.7rem]">draft · data contoh</span>
        </div>
      </footer>
    </>
  )
}
