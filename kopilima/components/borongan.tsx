'use client'

import { memo, useState } from 'react'

import { Button, buttonVariants } from '@/components/ui/button'
import { BRAND, BULK_TIERS, rupiah } from '@/lib/content'
import { cn } from '@/lib/utils'

import { Reveal } from './reveal'

// 15K flat makes the bulk math the show: one multiplication, no tiers, no
// asterisks. The composed brief carries the WEB-5 code (the lead counter).
// memo: independent of the clock — see Reservasi (this one renders up to 60
// cup icons, so it is the most expensive needless re-render).
export const Borongan = memo(function Borongan() {
  const [n, setN] = useState(25)
  const [copied, setCopied] = useState(false)

  const tier = BULK_TIERS.filter(([t]) => n >= t).at(-1)?.[1] ?? ''
  const shown = Math.min(n, 60)
  const brief = [
    `Halo Kopi Lima, mau pesan borongan.`,
    ``,
    `Jumlah  : ${n} cup`,
    `Estimasi: ${rupiah(n * 15000)}`,
    `Untuk   : (acara / kantor / tanggal)`,
    `Ambil di: (cabang)`,
    ``,
    `Kode: ${BRAND.kode}`,
  ].join('\n')

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
      id="borongan"
      aria-labelledby="bulk-h"
    >
      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-white pb-2.5">
          <h2 id="bulk-h" className="text-s3">
            Borongan{' '}
            <span className="script text-[0.6em]">
              satu harga bikin gampang
            </span>
          </h2>
          <p className="eyebrow">kantor · acara · panitia</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-7 min-[52rem]:grid-cols-2">
          <div className="sticker -rotate-[0.4deg] px-5 pt-5 pb-6">
            <div className="bulk-n font-display text-[clamp(3.2rem,9vw,5rem)] leading-[0.9] text-biru italic tabular-nums">
              {n}{' '}
              <small className="font-mono text-[0.32em] tracking-[0.1em] text-ink-faint not-italic">
                CUP
              </small>
            </div>
            <div className="bulk-price mt-1 font-mono text-s0 tabular-nums">
              {n} × Rp15.000 = {rupiah(n * 15000)}
            </div>
            <p className="script m-0 min-h-[1.6em] text-s1 text-amber-deep">
              {tier}
            </p>
            <input
              type="range"
              min={5}
              max={300}
              step={5}
              value={n}
              aria-label="Jumlah cup"
              onChange={(e) => setN(+e.target.value)}
            />
            <div
              className="flex flex-wrap gap-2"
              role="group"
              aria-label="Jumlah cepat"
            >
              {[10, 25, 50, 100, 200].map((q) => (
                <Button
                  key={q}
                  variant="chip"
                  size="auto"
                  aria-pressed={n === q}
                  onClick={() => setN(q)}
                >
                  {q} cup
                </Button>
              ))}
            </div>
            <div
              aria-hidden="true"
              className="tray mt-4 flex min-h-13 flex-wrap content-start items-center gap-1"
            >
              {Array.from({ length: shown }, (_, i) => (
                <span
                  key={i}
                  className="h-[18px] w-3.5 rounded-b border-[1.5px] border-t-[0.5px] border-biru [background:linear-gradient(to_top,color-mix(in_srgb,var(--biru)_30%,transparent)_55%,transparent_55%)]"
                />
              ))}
              {n > shown && (
                <span className="font-mono text-[0.7rem] text-ink-faint">
                  +{n - shown} lagi
                </span>
              )}
            </div>
          </div>

          <div className="sticker rotate-[0.4deg] px-5 pt-4 pb-5">
            <p className="eyebrow mb-3">Brief pesananmu</p>
            <p className="m-0 border-2 border-dashed border-ink-soft bg-sunk px-4 py-3.5 font-mono text-[0.78rem] leading-[1.7] break-words whitespace-pre-wrap text-ink-soft">
              {brief}
            </p>
            <div className="mt-4 flex flex-wrap gap-2.5">
              <Button variant="cta" size="auto" onClick={salin}>
                {copied ? 'Tersalin ✓' : 'Salin brief'}
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
              Tidak ada tabel nego: 15rb × jumlah cup, titik. Brief disalin lalu
              ditempel ke DM — kode {BRAND.kode} jadi penghitung prospek dari
              situs (pengganti “Dari website.”, karena DM tidak bisa diisi
              otomatis).
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
})
