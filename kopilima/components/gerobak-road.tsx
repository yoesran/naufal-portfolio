'use client'

import { memo, useRef, useState } from 'react'

import { CERITA } from '@/lib/content'

import { Reveal } from './reveal'

// The story is the cart, literally: drag the gerobak down the road and the
// wheels spin, milestone stops light up, the caption changes. Keyboard users
// get the same thing as a slider (arrow keys step between stops).
// memo: independent of the clock — see Reservasi.
export const GerobakRoad = memo(function GerobakRoad() {
  const roadRef = useRef<HTMLDivElement>(null)
  const draggingRef = useRef(false)
  const [pct, setPct] = useState(0)

  const idx = Math.round(pct * (CERITA.length - 1))
  const babak = CERITA[idx]
  const deg = pct * 1400 // wheel spin rides distance travelled

  const fromClientX = (clientX: number) => {
    const r = roadRef.current?.getBoundingClientRect()
    if (!r) return
    // the cart travels 6%..94% of the road (see stop layout below)
    setPct(
      Math.max(
        0,
        Math.min(1, (clientX - r.left - r.width * 0.06) / (r.width * 0.88))
      )
    )
  }

  const step = (d: 1 | -1) => {
    const next = Math.max(0, Math.min(CERITA.length - 1, idx + d))
    setPct(next / (CERITA.length - 1))
  }

  return (
    <section
      className="wrap py-[clamp(2.6rem,6vw,4rem)]"
      id="cerita"
      aria-labelledby="cerita-h"
    >
      <Reveal>
        <div className="mb-6 flex flex-wrap items-end justify-between gap-4 border-b-4 border-white pb-2.5">
          <h2 id="cerita-h" className="text-s3">
            Dari gerobak{' '}
            <span className="script text-[0.6em]">tarik gerobaknya</span>
          </h2>
          <p className="eyebrow">feb 2024 → sekarang · tahun = perkiraan</p>
        </div>

        <div className="sticker px-5 pt-5 pb-2.5">
          {/* the caption's height is RESERVED for the longest babak: on a
              phone the texts wrap to different line counts, and without this
              the page shoved down every time the gerobak passed a stop */}
          <p
            className="m-0 mb-2 min-h-[6.2em] max-w-160 min-[36rem]:min-h-[4.6em]"
            aria-live="polite"
          >
            <span
              key={babak.thn + babak.label}
              className="mr-2.5 inline-block animate-swap-in font-display text-s1 text-biru italic"
            >
              {babak.thn}
            </span>
            {/* the babak chip carries the stop name — on phones it's the ONLY
                place it appears (seven labels can't fit under the road) */}
            <span className="mr-2 inline-block -translate-y-[0.15em] -rotate-1 border border-tinta bg-amber px-1.5 py-0.5 font-mono text-[0.6rem] font-bold tracking-[0.12em] text-tinta uppercase">
              {babak.label}
            </span>
            <span className="text-s-1 leading-normal text-ink-soft">
              {babak.txt}
            </span>
          </p>

          <div
            ref={roadRef}
            className="relative h-34 touch-pan-y"
            // drags that start on the road (not the cart) still steer it —
            // a fat finger shouldn't have to hit a 7rem target exactly
            onPointerDown={(e) => {
              draggingRef.current = true
              e.currentTarget.setPointerCapture(e.pointerId)
              fromClientX(e.clientX)
            }}
            onPointerMove={(e) => draggingRef.current && fromClientX(e.clientX)}
            onPointerUp={() => (draggingRef.current = false)}
            onPointerCancel={() => (draggingRef.current = false)}
          >
            {/* dashed centre line + asphalt — lifted so the stop labels fit
                INSIDE the container instead of colliding with the hint below */}
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-[2.1rem] h-0.5 opacity-70 [background:repeating-linear-gradient(90deg,var(--amber-deep)_0_14px,transparent_14px_30px)]"
            />
            <div
              aria-hidden="true"
              className="absolute inset-x-0 bottom-[1.85rem] h-[4px] bg-ink"
            />
            {/* checkered finish — panel (cream), not paper (the blue wall) */}
            <div
              aria-hidden="true"
              className="absolute right-0 bottom-[1.95rem] h-[36px] w-[15px] border-[1.5px] border-tinta [background:repeating-conic-gradient(var(--ink)_0%_25%,var(--panel)_0%_50%)_0_0_/_7.5px_7.5px]"
            />
            {/* labels ≥36rem only — seven of them collide on a phone, where
                the caption's babak chip carries the name instead */}
            {CERITA.map((c, i) => (
              <div
                key={c.label}
                aria-hidden="true"
                data-label={c.label}
                data-on={i <= idx}
                className="stop absolute bottom-6 size-3 -translate-x-1/2 rounded-full border-2 border-ink bg-line after:absolute after:top-3.5 after:left-1/2 after:-translate-x-1/2 after:font-mono after:text-[0.52rem] after:tracking-[0.08em] after:whitespace-nowrap after:text-ink-faint data-[on=true]:bg-amber data-[on=true]:after:font-bold data-[on=true]:after:text-amber-deep min-[36rem]:after:content-[attr(data-label)]"
                style={{ left: `${6 + (i / (CERITA.length - 1)) * 88}%` }}
              />
            ))}

            <svg
              viewBox="0 0 120 74"
              role="slider"
              tabIndex={0}
              aria-label="Perjalanan Kopi Lima — geser gerobak"
              aria-valuemin={0}
              aria-valuemax={CERITA.length - 1}
              aria-valuenow={idx}
              aria-valuetext={`${babak.thn} — ${babak.label}`}
              className="absolute bottom-[1.7rem] -ml-14.5 w-29 cursor-grab select-none active:cursor-grabbing"
              style={{ left: `${6 + pct * 88}%` }}
              onKeyDown={(e) => {
                if (e.key === 'ArrowRight') {
                  step(1)
                  e.preventDefault()
                }
                if (e.key === 'ArrowLeft') {
                  step(-1)
                  e.preventDefault()
                }
              }}
            >
              {/* awning — striped like the real 2024 cart */}
              <path d="M14 18 L106 18 L100 6 L20 6 Z" fill="var(--lima)" />
              <path
                d="M20 6 L28 18 M36 6 L44 18 M52 6 L60 18 M68 6 L76 18 M84 6 L92 18"
                stroke="#fff"
                strokeWidth="4"
              />
              <rect
                x="18"
                y="18"
                width="84"
                height="30"
                fill="var(--panel)"
                stroke="var(--ink)"
                strokeWidth="2.5"
              />
              <rect x="18" y="30" width="84" height="7" fill="var(--lima)" />
              <text
                x="60"
                y="28.5"
                textAnchor="middle"
                fontFamily="Impact, 'Arial Narrow', sans-serif"
                fontSize="11"
                fontStyle="italic"
                fill="var(--ink)"
              >
                KOPI LIMA
              </text>
              <path
                d="M102 22 L116 30"
                stroke="var(--ink)"
                strokeWidth="3"
                strokeLinecap="round"
              />
              {[38, 82].map((cx) => (
                <g
                  key={cx}
                  style={{
                    transform: `rotate(${deg}deg)`,
                    transformBox: 'fill-box',
                    transformOrigin: 'center',
                  }}
                >
                  <circle
                    cx={cx}
                    cy="58"
                    r="12"
                    fill="var(--panel)"
                    stroke="var(--ink)"
                    strokeWidth="3"
                  />
                  <path
                    d={`M${cx} 47.5 V68.5 M${cx - 10.5} 58 H${cx + 10.5} M${cx - 7.4} 50.6 L${cx + 7.4} 65.4 M${cx + 7.4} 50.6 L${cx - 7.4} 65.4`}
                    stroke="var(--ink)"
                    strokeWidth="2"
                  />
                </g>
              ))}
            </svg>
          </div>
          <p className="m-0 pb-1 text-center font-mono text-[0.68rem] text-ink-faint">
            ← tarik gerobaknya sampai garis finis (atau pakai panah keyboard)
          </p>
        </div>
      </Reveal>
    </section>
  )
})
