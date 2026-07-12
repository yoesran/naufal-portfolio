'use client'

import { useEffect, useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { type Look, lookFilter } from '@/lib/content'
import { SCRUB_MAX, SCRUB_MIN, drawScene } from '@/lib/scene'
import {
  type SunState,
  atMinute,
  fmtTime,
  hhmm,
  minuteOf,
  studioAltitude,
} from '@/lib/sun'

import { LookChips } from './look-chips'
import { Reveal } from './reveal'

function verdictFor(
  alt: number,
  sun: SunState
): { lead: string; rest: string } {
  if (alt > 45)
    return {
      lead: 'Matahari tepat di atas kepala.',
      rest: ' Bayangan jatuh di bawah mata, kontras keras. Ini jamnya masuk studio.',
    }
  if (alt > 14)
    return {
      lead: 'Siang terang.',
      rest: ' Bisa dipakai, tapi butuh reflektor dan tempat teduh.',
    }
  if (alt > 0)
    return {
      lead: 'Golden hour.',
      rest: ' Cahaya datang menyamping dan hangat, kulit terlihat lembut, rambut kena rim light. Inilah jam yang kami kejar.',
    }
  if (alt > -6)
    return {
      lead: 'Blue hour.',
      rest: ' Langit masih menyala walau matahari sudah turun. Lembut, dingin, dan dramatis — bagus untuk siluet.',
    }
  return {
    lead: 'Sudah gelap.',
    rest: ` Butuh lampu buatan. Golden hour berikutnya jam ${fmtTime(
      sun.times.goldenEveningStart
    )}.`,
  }
}

// A tiny sundial instead of bare digits: the sun rides a semicircular day-arc,
// dips below the horizon line at night, and wears the phase colour. The clock
// stops reading like a database field and starts reading like weather.
function SunDial({ hourMin, alt }: { hourMin: number; alt: number | null }) {
  const dayU = (hourMin - SCRUB_MIN) / (SCRUB_MAX - SCRUB_MIN)
  // morning on the left, evening on the right — same axis as the scrubber
  const theta = Math.PI * dayU
  const x = 22 - 15 * Math.cos(theta)
  // ride the arc by day-progress; below the horizon, altitude sinks the dot
  const y = 19 - 13 * Math.sin(theta) - Math.min(0, (alt ?? 0) / 4)
  const color =
    alt === null
      ? 'var(--ink-faint)'
      : alt <= 0
        ? 'var(--blue)'
        : alt < 14
          ? 'var(--amber)'
          : '#c9b98f'
  return (
    <svg
      width="44"
      height="24"
      viewBox="0 0 44 24"
      aria-hidden="true"
      className="shrink-0"
    >
      {/* the day's arc */}
      <path
        d="M 7 19 A 15 13 0 0 1 37 19"
        fill="none"
        stroke="var(--line)"
        strokeWidth="1.5"
        strokeDasharray="2 3"
      />
      {/* horizon */}
      <line
        x1="2"
        y1="19"
        x2="42"
        y2="19"
        stroke="var(--ink-faint)"
        strokeWidth="1"
      />
      <circle cx={x} cy={Math.min(y, 23)} r="3.5" fill={color} />
    </svg>
  )
}

export function Simulator({
  sun,
  hourMin,
  setHourMin,
  look,
  setLook,
  onBookThisHour,
}: {
  sun: SunState | null
  hourMin: number
  setHourMin: (m: number) => void
  look: Look
  setLook: (l: Look) => void
  onBookThisHour: () => void
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const rafRef = useRef(0)
  const [playing, setPlaying] = useState(false)

  // Canvas is client-only; drawing lives in an effect keyed by the inputs.
  useEffect(() => {
    if (!sun) return
    const cx = canvasRef.current?.getContext('2d')
    if (cx) drawScene(cx, sun.midnight, hourMin)
  }, [sun, hourMin])

  // stop a running playback if the component unmounts mid-day
  useEffect(() => () => cancelAnimationFrame(rafRef.current), [])

  const alt = sun ? studioAltitude(atMinute(sun.midnight, hourMin)) : null
  const verdict = sun && alt !== null ? verdictFor(alt, sun) : null

  const stopPlayback = () => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = 0
    setPlaying(false)
  }

  const play = () => {
    if (!sun) return
    if (rafRef.current) return stopPlayback()
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) return
    setPlaying(true)
    let m = SCRUB_MIN
    const tick = () => {
      m += 3
      if (m >= SCRUB_MAX) {
        // land back on golden hour — the frame worth ending a day on
        setHourMin(minuteOf(sun.midnight, sun.times.goldenEveningStart))
        stopPlayback()
        return
      }
      setHourMin(m)
      rafRef.current = requestAnimationFrame(tick)
    }
    rafRef.current = requestAnimationFrame(tick)
  }

  return (
    <section
      className="wrap py-[clamp(3.5rem,9vw,6rem)]"
      id="coba"
      aria-labelledby="coba-h"
    >
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-4">
          <h2 id="coba-h" className="text-s3 leading-tight">
            Coba cahayanya
          </h2>
          <p className="eyebrow">geser jam · lihat bedanya</p>
        </div>

        <div className="grid grid-cols-1 items-start gap-[clamp(1.5rem,4vw,2.5rem)] min-[52rem]:grid-cols-[1.4fr_1fr]">
          <div>
            <div className="relative overflow-hidden rounded-[2px] border border-line bg-sunk">
              <canvas
                ref={canvasRef}
                width={960}
                height={540}
                role="img"
                aria-label="Simulasi pemandangan yang disinari matahari pada jam yang dipilih"
                className="block aspect-video h-auto w-full transition-[filter] duration-[350ms]"
                style={{ filter: lookFilter(look) }}
              />
              <span className="stamp pointer-events-none absolute bottom-2 left-2.5 font-mono text-[0.62rem] tracking-[0.12em] text-[#f4e9d8] [text-shadow:0_1px_4px_rgba(0,0,0,0.8)]">
                {hhmm(hourMin)} WITA · {look}
              </span>
            </div>

            <div className="mt-4 grid gap-2">
              <div className="flex items-center justify-between gap-4 font-mono tabular-nums">
                <span className="flex items-center gap-3">
                  <SunDial hourMin={hourMin} alt={alt} />
                  <span className="clock text-s2 text-accent">
                    {hhmm(hourMin)}
                  </span>
                </span>
                <span className="text-s-1 text-ink-faint">
                  {alt === null
                    ? 'menghitung…'
                    : alt >= 0
                      ? `matahari ${alt.toFixed(0)}° di atas cakrawala`
                      : `matahari ${Math.abs(alt).toFixed(0)}° di bawah cakrawala`}
                </span>
              </div>
              {/* step=1: a coarser step snaps the golden-hour default to a
                neighbouring minute and the clock disagrees with the light bar */}
              <input
                type="range"
                min={SCRUB_MIN}
                max={SCRUB_MAX}
                step={1}
                value={hourMin}
                aria-label="Jam pemotretan"
                onChange={(e) => setHourMin(+e.target.value)}
              />
              <div className="flex justify-between font-mono text-[0.66rem] text-ink-faint">
                <span>05.00</span>
                <span>12.00</span>
                <span>19.00</span>
              </div>
            </div>

            <div
              className="mt-1.5 flex flex-wrap gap-2"
              role="group"
              aria-label="Pilih look"
            >
              <LookChips look={look} setLook={setLook} />
              <Button variant="chip" size="auto" onClick={play}>
                {playing ? '⏸ Hentikan' : '▶ Putar hari'}
              </Button>
            </div>
          </div>

          <div className="grid gap-5">
            <p className="verdict min-h-[3.2em] border-l-2 border-accent pl-3.5 text-s0 leading-normal text-ink-soft [&_b]:font-medium [&_b]:text-ink">
              {verdict ? (
                <>
                  <b>{verdict.lead}</b>
                  {verdict.rest}
                </>
              ) : (
                'menghitung…'
              )}
            </p>
            <Button variant="cta" size="auto" onClick={onBookThisHour}>
              Booking jam ini
            </Button>
            <p className="text-s-1 text-ink-faint">
              Pemandangan digambar ulang tiap kali kamu menggeser jam, memakai
              ketinggian matahari sebenarnya di Tabalong hari ini —{' '}
              <strong className="font-medium text-ink-soft">
                dan seluruh halaman ikut berubah warna mengikuti jam yang kamu
                pilih
              </strong>
              , jadi kamu bisa merasakan golden hour tanpa menunggu. Look yang
              kamu pilih ikut tercantum di pesan WhatsApp — jadi kami tahu
              selera kamu sebelum kamera menyala.
            </p>
          </div>
        </div>
      </Reveal>
    </section>
  )
}
