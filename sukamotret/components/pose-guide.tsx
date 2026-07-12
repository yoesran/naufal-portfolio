'use client'

import { type ReactNode, useState } from 'react'

import { Button } from '@/components/ui/button'
import { type FigureId, POSES, POSE_OCCASIONS } from '@/lib/content'

import { Reveal } from './reveal'

// Pictogram poses — clean geometric mannequins, not freehand sketches, so
// they read as intentional design rather than AI doodles. currentColor is
// inherited from text-ink, so the figures are theme-aware for free. viewBox
// is a portrait 100×150; a faint floor line (drawn once, below) grounds them.
// Record<FigureId, …>, not Record<string, …>: adding a pose with a new
// figure id fails the build here until the pictogram exists.
const FIGURES: Record<FigureId, ReactNode> = {
  // solo, one hand in pocket, weight on one leg
  pocket: (
    <path d="M50,29 V76 M50,44 L38,58 L40,74 M50,44 L62,56 L54,70 M50,76 L45,108 L44,142 M50,76 L57,106 L60,142" />
  ),
  // couple from behind, inner hands joined, mid-stride
  walk: (
    <>
      <circle cx="36" cy="30" r="7" />
      <circle cx="64" cy="30" r="7" />
      <path d="M36,37 V74 M36,50 L28,63 L27,79 M36,50 L45,65 L50,73 M36,74 L30,105 L28,142 M36,74 L43,103 L45,142" />
      <path d="M64,37 V74 M64,50 L72,63 L73,79 M64,50 L55,65 L50,73 M64,74 L70,105 L72,142 M64,74 L57,103 L55,142" />
    </>
  ),
  // couple facing, foreheads close, near hands meeting
  face: (
    <>
      <circle cx="38" cy="26" r="8" />
      <circle cx="62" cy="26" r="8" />
      <path d="M38,34 L43,80 M40,48 L51,58 M38,48 L28,62 L28,80 M43,80 L37,110 L36,142 M43,80 L48,110 L49,142" />
      <path d="M62,34 L57,80 M60,48 L49,58 M62,48 L72,62 L72,80 M57,80 L63,110 L64,142 M57,80 L52,110 L51,142" />
    </>
  ),
  // graduate, one arm thrown up, cap airborne
  cap: (
    <>
      <path d="M46,39 V82 M55,50 L64,36 L71,25 M37,50 L30,64 L32,80 M46,82 L41,112 L38,144 M46,82 L53,112 L60,144" />
      <path d="M61,18 L72,13 L83,18 L72,23 Z" />
      <path d="M83,18 L85,31" />
    </>
  ),
  // seated, relaxed, hands on knees
  sit: (
    <path d="M50,35 V70 M50,70 L34,73 L34,112 M50,70 L66,73 L66,112 M41,45 L36,60 L34,73 M59,45 L64,60 L66,73" />
  ),
  // maternity, side-on so the belly reads: a clear forward bump, both hands
  // cradling it
  belly: (
    <path d="M45,30 V78 M45,45 A 15 15 0 0 1 45,75 M38,47 L48,53 M37,57 L47,72 M42,78 L40,110 L39,142 M49,78 L55,110 L56,142" />
  ),
}

// The head that isn't drawn inside a multi-figure key above.
const SOLO_HEAD: Partial<Record<FigureId, [number, number, number]>> = {
  pocket: [50, 20, 9],
  cap: [46, 30, 9],
  sit: [50, 26, 9],
  belly: [45, 21, 9],
}

function Figure({ id }: { id: FigureId }) {
  const head = SOLO_HEAD[id]
  return (
    <svg
      viewBox="0 0 100 150"
      className="h-full w-full text-ink"
      fill="none"
      stroke="currentColor"
      strokeWidth={3.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <line
        x1="14"
        y1="145"
        x2="86"
        y2="145"
        stroke="var(--line)"
        strokeWidth={2}
      />
      {head && (
        <circle cx={head[0]} cy={head[1]} r={head[2]} fill="currentColor" />
      )}
      {FIGURES[id]}
    </svg>
  )
}

export function PoseGuide() {
  const [occ, setOcc] = useState<(typeof POSE_OCCASIONS)[number]>('Semua')
  const [idx, setIdx] = useState(0)

  const list = POSES.filter((p) => occ === 'Semua' || p.occasions.includes(occ))
  const pose = list[idx] ?? list[0]

  const pick = (next: (typeof POSE_OCCASIONS)[number]) => {
    setOcc(next)
    setIdx(0) // a filter change strands the old index
  }
  const step = (d: 1 | -1) => setIdx((i) => (i + d + list.length) % list.length)

  return (
    <section
      className="wrap py-[clamp(3.5rem,9vw,6rem)]"
      id="pose"
      aria-labelledby="pose-h"
    >
      <Reveal>
        <div className="mb-8 flex flex-wrap items-end justify-between gap-5 border-b border-line pb-4">
          <h2 id="pose-h" className="text-s3 leading-tight">
            Panduan pose
          </h2>
          <p className="eyebrow">bingung gaya? · kami arahkan</p>
        </div>

        <div
          className="mb-6 flex flex-wrap gap-2"
          role="group"
          aria-label="Saring pose"
        >
          {POSE_OCCASIONS.map((o) => (
            <Button
              key={o}
              variant="chip"
              size="auto"
              aria-pressed={occ === o}
              onClick={() => pick(o)}
            >
              {o}
            </Button>
          ))}
        </div>

        <div className="grid grid-cols-1 items-stretch gap-[clamp(1.5rem,4vw,2.5rem)] min-[52rem]:grid-cols-[1fr_1.1fr]">
          {/* the mannequin, standing on a seamless-paper gradient */}
          <div className="relative grid aspect-[4/3] place-items-center overflow-hidden rounded-[2px] border border-line bg-linear-to-b from-surface to-sunk min-[52rem]:aspect-auto">
            <div key={pose.id} className="h-64 w-48 animate-pose-in py-6">
              <Figure id={pose.figure} />
            </div>
            <span className="pointer-events-none absolute bottom-2 left-2.5 font-mono text-[0.6rem] tracking-[0.12em] text-ink-faint uppercase">
              {idx + 1} / {list.length}
            </span>
          </div>

          <div key={pose.id} className="flex animate-pose-in flex-col gap-4">
            <div className="flex flex-wrap gap-1.5">
              {pose.occasions.map((o) => (
                <span
                  key={o}
                  className="rounded-full border border-line px-2 py-0.5 font-mono text-[0.6rem] tracking-[0.1em] text-ink-faint uppercase"
                >
                  {o}
                </span>
              ))}
            </div>
            <h3 className="font-display text-s2 tracking-[-0.02em]">
              {pose.name}
            </h3>
            <p className="border-l-2 border-accent pl-3.5 text-s1 leading-snug text-ink-soft">
              {pose.tip}
            </p>

            <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
              <Button
                variant="chip"
                size="auto"
                aria-label="Pose sebelumnya"
                onClick={() => step(-1)}
              >
                ← Sebelumnya
              </Button>
              <Button
                variant="chip"
                size="auto"
                aria-label="Pose berikutnya"
                onClick={() => step(1)}
              >
                Berikutnya →
              </Button>
            </div>
          </div>
        </div>

        <p className="mt-6 max-w-160 border-l-2 border-accent pl-3.5 text-s-1 text-ink-faint">
          Nggak usah bingung harus gaya apa — datang saja, tim kami yang
          mengarahkan. Ini cuma bocoran biar kamu kebayang.
        </p>
      </Reveal>
    </section>
  )
}
