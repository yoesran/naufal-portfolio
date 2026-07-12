'use client'

import { useRef, useState } from 'react'

import { Button } from '@/components/ui/button'
import { CATEGORIES, PORTFOLIO, frameNo, tileGradient } from '@/lib/content'
import { cn } from '@/lib/utils'

import { Reveal } from './reveal'

const FILTERS = ['semua', ...CATEGORIES] as const
type Filter = (typeof FILTERS)[number]

// Dialog chrome shared by the lightbox's three buttons — it sits on the dark
// backdrop, outside the page theme.
const lbBtn =
  'min-h-11 cursor-pointer rounded-[2px] border border-[#f4e9d8]/30 bg-transparent px-3.5 py-1.5 text-[#f4e9d8]'

// The portfolio as a film contact sheet — numbered frames (contact-sheet
// numbers mean something), category stamps, an aperture-iris lightbox.
// Native <dialog> on purpose: focus trap, Esc, and ::backdrop come free.
export function ContactSheet() {
  const [filter, setFilter] = useState<Filter>('semua')
  const [cur, setCur] = useState(1)
  // travel direction of the last step — the incoming image slides from there
  const [dir, setDir] = useState<1 | -1>(1)
  const lbRef = useRef<HTMLDialogElement>(null)
  const closingRef = useRef(false)

  const shown = PORTFOLIO.filter((s) => filter === 'semua' || s.cat === filter)
  const shot = PORTFOLIO.find((s) => s.n === cur) ?? PORTFOLIO[0]

  const open = (n: number) => {
    setCur(n)
    lbRef.current?.showModal()
  }
  const step = (d: 1 | -1) => {
    setDir(d)
    setCur((c) => ((c - 1 + d + PORTFOLIO.length) % PORTFOLIO.length) + 1)
  }

  // A <dialog> closes instantly by default — play a short exit first. The
  // ref-guard stops a double-close (✕ during an already-running exit).
  const close = () => {
    const lb = lbRef.current
    if (!lb || closingRef.current) return
    if (matchMedia('(prefers-reduced-motion: reduce)').matches) {
      lb.close()
      return
    }
    closingRef.current = true
    lb.classList.add('closing')
    setTimeout(() => {
      lb.classList.remove('closing')
      closingRef.current = false
      lb.close()
    }, 280)
  }

  return (
    <section
      className="wrap py-[clamp(3.5rem,9vw,6rem)]"
      id="karya"
      aria-labelledby="karya-h"
    >
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-4">
          <h2 id="karya-h" className="text-s3 leading-tight">
            Contact sheet
          </h2>
          <p className="eyebrow">
            {PORTFOLIO.length} frame · pilih untuk memperbesar
          </p>
        </div>

        <div
          className="mb-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Saring karya"
        >
          {FILTERS.map((f) => (
            <Button
              key={f}
              variant="chip"
              size="auto"
              aria-pressed={filter === f}
              onClick={() => setFilter(f)}
            >
              {f === 'semua' ? 'Semua' : f[0].toUpperCase() + f.slice(1)}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-2.5 border border-line bg-sunk p-2.5 min-[44rem]:grid-cols-4">
          {shown.map((s, i) => (
            <button
              // filter in the key: kept tiles would otherwise keep their DOM
              // node and the stagger would only play for newcomers
              key={`${filter}-${s.n}`}
              className="frame group relative aspect-[4/5] animate-tile-in cursor-pointer overflow-hidden bg-sunk"
              style={{ animationDelay: `${i * 35}ms` }}
              aria-label={`Foto ${s.cat}, frame ${s.n}`}
              onClick={() => open(s.n)}
            >
              <div
                className="absolute inset-0 transition-transform duration-500 group-hover:scale-[1.04]"
                style={{ background: tileGradient(s) }}
              />
              <span className="absolute inset-x-0 bottom-[42%] z-2 text-center font-mono text-[0.55rem] tracking-[0.12em] text-white/50">
                foto placeholder
              </span>
              <span className="absolute bottom-1.5 left-1.5 z-2 font-mono text-[0.6rem] tracking-[0.08em] text-[#f4e9d8] [text-shadow:0_1px_3px_rgba(0,0,0,0.7)]">
                {frameNo(s.n)}
              </span>
              <span className="cat absolute top-1.5 right-1.5 z-2 bg-[rgba(20,16,14,0.55)] px-1.5 py-px font-mono text-[0.58rem] tracking-[0.1em] text-[#f4e9d8] uppercase">
                {s.cat}
              </span>
            </button>
          ))}
        </div>
      </Reveal>

      {/* Explicit width, not max-width: a <dialog> is fit-content, so its
          width would otherwise follow the caption/buttons row and the whole
          popup jumps when the image changes. The image box is fixed 4:5;
          real photos will letterbox into it via object-contain. */}
      <dialog
        className="lb m-auto w-[min(92vw,26rem)] border-0 bg-transparent p-0"
        ref={lbRef}
        aria-label="Pratinjau foto"
        onKeyDown={(e) => {
          if (e.key === 'ArrowRight') step(1)
          if (e.key === 'ArrowLeft') step(-1)
        }}
        onClick={(e) => {
          // clicking the ::backdrop dispatches to the dialog itself
          if (e.target === lbRef.current) close()
        }}
        onCancel={(e) => {
          // Esc fires `cancel` and would close instantly — route it through
          // the animated exit instead
          e.preventDefault()
          close()
        }}
      >
        {/* Close is a visible button: mobile has no Esc, and backdrop-tap is
            real but undiscoverable. */}
        <div className="flex justify-end pb-2.5">
          <button
            className={lbBtn}
            aria-label="Tutup pratinjau"
            onClick={close}
          >
            ✕ Tutup
          </button>
        </div>
        {/* .lb-frame owns the open/close iris; the keyed child owns the
            direction-of-travel swipe — separate elements, or the [open] rule
            out-specifies the swipe and it never plays */}
        <div className="lb-frame overflow-hidden">
          <div
            key={shot.n}
            className={cn(
              'lb-img relative aspect-[4/5]',
              dir === 1 ? 'animate-lb-next' : 'animate-lb-prev'
            )}
            style={{ background: tileGradient(shot) }}
          />
        </div>
        <div className="flex items-center justify-between gap-4 pt-3 font-mono text-s-1 text-[#f4e9d8]">
          <button
            className={lbBtn}
            aria-label="Foto sebelumnya"
            onClick={() => step(-1)}
          >
            ← Sebelumnya
          </button>
          <span key={shot.n} className="animate-lb-cap">
            {frameNo(shot.n)} · {shot.cat}
          </span>
          <button
            className={lbBtn}
            aria-label="Foto berikutnya"
            onClick={() => step(1)}
          >
            Berikutnya →
          </button>
        </div>
      </dialog>
    </section>
  )
}
