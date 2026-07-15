'use client'

import { memo, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import {
  BRAND,
  FITUR,
  MEJA,
  type Meja,
  PLAN,
  RESV_CABANG,
  gridArea,
} from '@/lib/content'
import { cn } from '@/lib/utils'

import { Reveal } from './reveal'

// Table preference, not live availability: the picked table rides the DM
// brief and Kopi Lima confirms by reply. (Real-time availability needs a
// backend this site deliberately doesn't have.) The floor plan is FICTIONAL
// until the owner supplies the real one — and WHICH branch takes
// reservations is itself unconfirmed.
// memo: nothing here depends on the clock, so the hour scrubber must not
// re-render a 9-table floor plan on every drag event.
export const Reservasi = memo(function Reservasi() {
  const [meja, setMeja] = useState<Meja | null>(null)
  const [copied, setCopied] = useState(false)

  const brief = meja
    ? [
        `Halo Kopi Lima, mau reservasi meja.`,
        ``,
        `Cabang : ${RESV_CABANG}`,
        `Meja   : ${meja.id} (${meja.kursi} kursi, ${meja.zona})`,
        `Tanggal: (isi tanggal)`,
        `Jam    : (isi jam)`,
        `Nama   : (isi nama)`,
        ``,
        `Kode: ${BRAND.kode}`,
      ].join('\n')
    : 'Ketuk meja kosong di denah dulu.'

  const salin = async () => {
    try {
      await navigator.clipboard.writeText(brief)
      setCopied(true)
      setTimeout(() => setCopied(false), 1600)
    } catch {
      /* clipboard denied — the brief stays visible to copy by hand */
    }
  }

  return (
    <section
      className="wrap py-[clamp(2.6rem,6vw,4rem)]"
      id="resv"
      aria-labelledby="resv-h"
    >
      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-white pb-2.5">
          <h2 id="resv-h" className="text-s3">
            Pilih mejamu <span className="script text-[0.6em]">reservasi</span>
          </h2>
          <p className="eyebrow">
            {RESV_CABANG} · denah contoh — perlu konfirmasi
          </p>
        </div>

        <div className="grid grid-cols-1 items-start gap-7 min-[52rem]:grid-cols-[1.25fr_0.75fr]">
          <div>
            {/* A ROOM, not a spreadsheet: thick walls, a blueprint floor, and
                every table drawn with its chairs around it — so a 6-seat table
                LOOKS like a 6-seat table. Layout still comes from the integer
                grid in lib/content.ts; only the drawing got better. */}
            <div
              className="denah sticker relative grid aspect-16/10 gap-1 border-[6px] p-3"
              role="group"
              aria-label={`Denah meja ${RESV_CABANG}`}
              style={{
                gridTemplateColumns: `repeat(${PLAN.kolom}, 1fr)`,
                gridTemplateRows: `repeat(${PLAN.baris}, 1fr)`,
                backgroundImage:
                  'repeating-linear-gradient(0deg, transparent 0 23px, color-mix(in srgb, var(--lima) 9%, transparent) 23px 24px), repeating-linear-gradient(90deg, transparent 0 23px, color-mix(in srgb, var(--lima) 9%, transparent) 23px 24px)',
              }}
            >
              {FITUR.map((f) => (
                <div
                  key={f.label}
                  aria-hidden="true"
                  style={{ gridArea: gridArea(f) }}
                  className={cn(
                    'relative flex items-center justify-center font-mono text-[0.5rem] tracking-[0.14em] uppercase',
                    // the counter: a solid slab with stools drawn on it
                    f.jenis === 'bar' &&
                      'rounded-sm border-2 border-tinta bg-lima font-bold text-white',
                    // the door: a gap in the wall + a swing arc, like a plan
                    f.jenis === 'pintu' &&
                      'items-end justify-end self-end text-amber-deep',
                    // the window: the wall goes thin and glassy here
                    f.jenis === 'jendela' &&
                      'justify-start text-ink-faint [writing-mode:vertical-rl] before:absolute before:inset-y-0 before:-left-3 before:w-1.5 before:border-y-2 before:border-tinta before:bg-lima/25'
                  )}
                >
                  {f.jenis === 'pintu' ? (
                    <>
                      {/* quarter-circle swing arc */}
                      <span className="absolute right-0 bottom-0 size-full rounded-tl-full border-t-2 border-l-2 border-dashed border-amber-deep/70" />
                      <span className="relative z-1 pr-0.5 pb-0.5">
                        {f.label}
                      </span>
                    </>
                  ) : (
                    f.label
                  )}
                </div>
              ))}

              {MEJA.map((t) => {
                // chairs ride an ellipse around the table — n seats, n chairs,
                // so the plan tells the truth about capacity at a glance
                const chairs = Array.from({ length: t.kursi }, (_, i) => {
                  const a = (i / t.kursi) * 2 * Math.PI - Math.PI / 2
                  return { x: 50 + 44 * Math.cos(a), y: 50 + 44 * Math.sin(a) }
                })
                const dipilih = meja?.id === t.id
                return (
                  <div
                    key={t.id}
                    style={{ gridArea: gridArea(t) }}
                    className="relative grid place-items-center"
                  >
                    {/* On a phone a table is ~18px across — a label inside it
                        is unreadable. Park it in the cell's corner instead
                        (the chairs ride an ellipse, so the corners are free);
                        from 36rem up the label sits on the table, as drawn. */}
                    <span
                      aria-hidden="true"
                      className="absolute -top-1 -left-1 z-2 rounded-xs border border-line bg-panel px-0.5 font-mono text-[0.5rem] leading-[1.4] font-bold text-ink min-[36rem]:hidden"
                    >
                      {t.id}
                    </span>
                    {chairs.map((c, i) => (
                      <span
                        key={i}
                        aria-hidden="true"
                        className={cn(
                          'absolute size-2 -translate-x-1/2 -translate-y-1/2 rounded-full border border-ink-soft',
                          t.terisi
                            ? 'border-line bg-line'
                            : dipilih
                              ? 'border-tinta bg-amber'
                              : 'bg-panel'
                        )}
                        style={{ left: `${c.x}%`, top: `${c.y}%` }}
                      />
                    ))}
                    <button
                      type="button"
                      disabled={t.terisi}
                      aria-pressed={dipilih}
                      aria-label={`Meja ${t.id}, ${t.kursi} kursi, ${t.zona}${t.terisi ? ', terisi' : ''}`}
                      onClick={() => setMeja(dipilih ? null : t)}
                      className={cn(
                        'meja absolute inset-[14%] grid cursor-pointer place-items-center border-2 border-tinta bg-sunk font-mono text-[0.6rem] font-bold text-ink shadow-[2px_2px_0_var(--ink)] transition-[translate,box-shadow]',
                        t.bulat ? 'rounded-full' : 'rounded-sm',
                        'hover:not-disabled:-translate-x-px hover:not-disabled:-translate-y-px hover:not-disabled:shadow-[4px_4px_0_var(--ink)]',
                        'aria-pressed:bg-lima aria-pressed:text-white aria-pressed:shadow-[3px_3px_0_var(--amber)]',
                        // taken: hatched, flat, unclickable
                        t.terisi &&
                          'cursor-not-allowed border-line bg-[repeating-linear-gradient(45deg,var(--line)_0_4px,transparent_4px_8px)] text-ink-faint shadow-none'
                      )}
                    >
                      <span className="hidden min-[36rem]:inline">{t.id}</span>
                    </button>
                  </div>
                )
              })}
            </div>
            <ul className="mt-3 flex list-none flex-wrap gap-x-5 gap-y-1.5 p-0 font-mono text-[0.66rem] text-ink-soft">
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block size-2 rounded-full border border-ink-soft bg-panel"
                />
                titik = kursi
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block size-3 rounded-sm border-2 border-tinta bg-lima"
                />
                pilihanmu
              </li>
              <li className="flex items-center gap-1.5">
                <span
                  aria-hidden="true"
                  className="inline-block size-3 rounded-sm border border-line bg-[repeating-linear-gradient(45deg,var(--line)_0_3px,transparent_3px_6px)]"
                />
                terisi (contoh)
              </li>
            </ul>
          </div>

          <div className="sticker rotate-[0.6deg] px-5 pt-4 pb-5">
            <p className="eyebrow mb-3">Brief reservasimu</p>
            <p className="m-0 border-2 border-dashed border-ink-soft bg-sunk px-4 py-3.5 font-mono text-[0.78rem] leading-[1.7] break-words whitespace-pre-wrap text-ink-soft">
              {brief}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button
                variant="cta"
                size="auto"
                disabled={!meja}
                onClick={salin}
              >
                {copied ? 'Tersalin ✓' : 'Salin reservasi'}
              </Button>
              <a
                className={cn(
                  buttonVariants({ variant: 'cta-ghost', size: 'auto' })
                )}
                href={BRAND.dmUrl}
                target="_blank"
                rel="noreferrer"
              >
                Kirim via DM
              </a>
            </div>
            <p className="mt-4 mb-0 border-l-4 border-amber pl-3 text-s-1 text-ink-faint">
              Pilihan meja = preferensi, bukan booking otomatis — Kopi Lima
              membalas di DM untuk konfirmasi. Kode {BRAND.kode} menandai
              reservasi yang datang dari situs ini.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
})
