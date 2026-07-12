'use client'

import { useState } from 'react'

import { buttonVariants } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  ADDONS,
  DURATIONS,
  LOCATIONS,
  type LocationLabel,
  type Look,
  OCCASIONS,
  STUDIO,
  rupiah,
} from '@/lib/content'
import { type SunState, hhmm } from '@/lib/sun'
import { cn } from '@/lib/utils'

import { Reveal } from './reveal'

// The option pills stay native radios/checkboxes (form semantics, zero JS,
// getByLabel-testable) — only their skin is Tailwind, via peer-checked.
const optInput = 'peer absolute inset-0 cursor-pointer opacity-0'
const optSpan =
  'flex min-h-11 items-center rounded-[2px] border border-line px-3.5 py-2 text-s-1 text-ink-soft cursor-pointer peer-checked:border-accent peer-checked:bg-accent/12 peer-checked:text-ink peer-focus-visible:outline-2 peer-focus-visible:outline-offset-2 peer-focus-visible:outline-accent'

function OptGroup<T extends string>({
  legend,
  name,
  options,
  value,
  onChange,
}: {
  legend: string
  name: string
  options: readonly T[]
  value: T
  onChange: (v: T) => void
}) {
  return (
    <fieldset className="mb-5.5 border-0 border-t border-line pt-4.5">
      <legend className="pr-3 text-[0.66rem] tracking-[0.14em] text-ink-faint uppercase">
        {legend}
      </legend>
      <div className="flex flex-wrap gap-2">
        {options.map((label) => (
          <label className="relative" key={label}>
            <input
              type="radio"
              name={name}
              value={label}
              checked={value === label}
              onChange={() => onChange(label)}
              className={optInput}
            />
            <span className={optSpan}>{label}</span>
          </label>
        ))}
      </div>
    </fieldset>
  )
}

export function SessionBuilder({
  sun,
  hourMin,
  look,
  intensity,
  loc,
  setLoc,
}: {
  sun: SunState | null
  hourMin: number
  look: Look
  intensity: number
  loc: LocationLabel
  setLoc: (l: LocationLabel) => void
}) {
  const [occ, setOcc] = useState<(typeof OCCASIONS)[number][0]>('Prewedding')
  const [dur, setDur] = useState<(typeof DURATIONS)[number][0]>('1 jam')
  const [adds, setAdds] = useState<Set<string>>(new Set())
  const [showPrice, setShowPrice] = useState(true)

  const base = OCCASIONS.find(([l]) => l === occ)![1]
  const lm = LOCATIONS.find(([l]) => l === loc)![1]
  const dm = DURATIONS.find(([l]) => l === dur)![1]
  const extra = [...adds].reduce(
    (s, a) => s + (ADDONS.find(([l]) => l === a)?.[1] ?? 0),
    0
  )
  const total = base * lm * dm + extra

  // The brief the studio receives. Outdoor sessions carry the hour picked in
  // the simulator plus the chosen look — it arrives already art-directed.
  // "Dari website." is the lead-counting mechanism: the studio can tally
  // site-sourced inquiries inside WhatsApp itself, no analytics needed.
  const lines = [
    `Halo Sukamotret, saya mau booking sesi ${occ}.`,
    ``,
    `Lokasi   : ${loc}`,
    `Durasi   : ${dur}`,
    `Tambahan : ${adds.size ? [...adds].join(', ') : '—'}`,
  ]
  if (loc !== 'Studio' && sun) lines.push(`Jam      : ${hhmm(hourMin)} WITA`)
  lines.push(
    `Look     : ${look}${look !== 'Netral' && intensity !== 100 ? ` (${intensity}%)` : ''}`
  )
  if (showPrice) lines.push(`Estimasi : ${rupiah(total)}`)
  lines.push(``, `Dari website.`)
  const text = lines.join('\n')
  const waHref = `https://wa.me/${STUDIO.whatsapp}?text=${encodeURIComponent(text)}`

  return (
    <section
      className="wrap py-[clamp(3.5rem,9vw,6rem)]"
      id="sesi"
      aria-labelledby="sesi-h"
    >
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-4">
          <h2 id="sesi-h" className="text-s3 leading-tight">
            Rancang sesi
          </h2>
          <label className="flex min-h-11 cursor-pointer items-center gap-2.5 text-s-1 text-ink-soft">
            <Switch
              checked={showPrice}
              onCheckedChange={(checked) => setShowPrice(checked)}
            />
            Tampilkan estimasi harga
          </label>
        </div>

        <div className="grid grid-cols-1 items-start gap-[clamp(1.5rem,4vw,3rem)] min-[52rem]:grid-cols-[1.15fr_1fr]">
          <form onSubmit={(e) => e.preventDefault()}>
            <OptGroup
              legend="Sesi"
              name="occ"
              options={OCCASIONS.map(([l]) => l)}
              value={occ}
              onChange={setOcc}
            />
            <OptGroup
              legend="Lokasi"
              name="loc"
              options={LOCATIONS.map(([l]) => l)}
              value={loc}
              onChange={setLoc}
            />
            <OptGroup
              legend="Durasi"
              name="dur"
              options={DURATIONS.map(([l]) => l)}
              value={dur}
              onChange={setDur}
            />
            <fieldset className="mb-5.5 border-0 border-t border-line pt-4.5">
              <legend className="pr-3 text-[0.66rem] tracking-[0.14em] text-ink-faint uppercase">
                Tambahan
              </legend>
              <div className="flex flex-wrap gap-2">
                {ADDONS.map(([label]) => (
                  <label className="relative" key={label}>
                    <input
                      type="checkbox"
                      name="add"
                      value={label}
                      checked={adds.has(label)}
                      onChange={(e) => {
                        const next = new Set(adds)
                        if (e.target.checked) next.add(label)
                        else next.delete(label)
                        setAdds(next)
                      }}
                      className={optInput}
                    />
                    <span className={optSpan}>{label}</span>
                  </label>
                ))}
              </div>
            </fieldset>
          </form>

          <aside
            className="sticky top-20 rounded-[3px] border border-line bg-surface"
            aria-live="polite"
          >
            <div className="flex items-baseline justify-between gap-4 border-b border-line px-5 py-4.5">
              <p className="eyebrow">Ringkasan</p>
              {showPrice && (
                <div className="font-mono text-s2 text-accent tabular-nums">
                  <small className="block text-[0.62rem] tracking-[0.12em] text-ink-faint uppercase">
                    Estimasi
                  </small>
                  <span>{rupiah(total)}</span>
                </div>
              )}
            </div>
            <p className="msg m-0 border-b border-line px-5 py-4.5 font-mono text-[0.78rem] leading-[1.7] break-words whitespace-pre-wrap text-ink-soft">
              {text}
            </p>
            <div className="grid gap-2.5 px-5 py-4.5">
              <a
                className={cn(
                  buttonVariants({ variant: 'cta', size: 'auto' }),
                  'text-center'
                )}
                href={waHref}
                target="_blank"
                rel="noreferrer"
              >
                Kirim lewat WhatsApp
              </a>
              <div className="rounded-[2px] bg-sunk p-2.5 font-mono text-[0.66rem] break-all text-ink-faint">
                wa.me/{STUDIO.whatsapp}?text=
                {encodeURIComponent(text).slice(0, 80)}…
              </div>
            </div>
          </aside>
        </div>

        <p className="mt-6 max-w-160 border-l-2 border-accent pl-3.5 text-s-1 text-ink-faint">
          Setiap pesan diakhiri “Dari website”. Artinya studio bisa menghitung
          prospek yang datang dari situs ini langsung di WhatsApp — tanpa
          dashboard, tanpa biaya.
        </p>
      </Reveal>
    </section>
  )
}
