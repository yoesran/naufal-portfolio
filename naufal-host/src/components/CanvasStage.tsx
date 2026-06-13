import { type ReactNode, useLayoutEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Maximize, ZoomIn, ZoomOut } from 'lucide-react'

import { Footer } from '@/components/Footer'
import { Button } from '@/components/ui/button'
import { ANNOTATIONS, type NoteKey } from '@/lib/annotations'
import { useCanvas } from '@/lib/useCanvas'
import { cn } from '@/lib/utils'

// ---- Artboard geometry (canvas-local px, pre-transform) -------------------
const FRAME_W = 672 // matches the site's max-w-2xl column
const NOTE_W = 208
const GAP = 48
const LEFT = NOTE_W + GAP // left margin: a note + gap, so left notes sit flush
const FRAME_TOP = 140 // headroom above the frame for the architecture note
const ARTBOARD_W = LEFT + FRAME_W + GAP + NOTE_W
const FRAME_LEFT = LEFT
const FRAME_RIGHT = LEFT + FRAME_W

type Placed = { key: NoteKey; side: 'left' | 'right'; y: number }

// The Figma-like canvas: the site rendered as the central artboard on a
// zoom/pan plane, with margin callouts that detail the interactions. Mounted by
// App only in canvas mode (so its presence == mode on); the live blocks are the
// real ones (children), interactive at any zoom — pan grabs the empty canvas.
export function CanvasStage({ children }: { children: ReactNode }) {
  const { t } = useTranslation()
  const { surfaceRef, transform, panning, fitWidth, zoomBy, handlers } =
    useCanvas()
  const frameRef = useRef<HTMLDivElement>(null)
  const [placed, setPlaced] = useState<Placed[]>([])
  const [frameH, setFrameH] = useState(0)

  // Measure each annotated block's vertical centre within the frame (offsetTop
  // is layout px, unaffected by the transform) and re-measure when a block
  // resizes (e.g. the experience panel grows). Leader lines + notes follow.
  useLayoutEffect(() => {
    const frame = frameRef.current
    if (!frame) return
    const measure = () => {
      setFrameH(frame.offsetHeight)
      setPlaced(
        ANNOTATIONS.flatMap((a) => {
          const el = frame.querySelector<HTMLElement>(`#${a.anchor}`)
          if (!el) return []
          return [
            { key: a.key, side: a.side, y: el.offsetTop + el.offsetHeight / 2 },
          ]
        })
      )
    }
    measure()
    const ro = new ResizeObserver(measure)
    ro.observe(frame)
    return () => ro.disconnect()
  }, [])

  // Fit the artboard to the surface width once it has a size (after first paint).
  useLayoutEffect(() => {
    fitWidth(ARTBOARD_W)
  }, [fitWidth])

  // Lock page scroll while the canvas owns the viewport.
  useLayoutEffect(() => {
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    return () => {
      document.body.style.overflow = prev
    }
  }, [])

  const artboardH = FRAME_TOP + frameH

  return (
    <div
      ref={surfaceRef}
      {...handlers}
      className={cn(
        'bg-muted/30 relative flex-1 touch-none overflow-hidden select-none',
        // a faint dotted grid, so the plane reads as a canvas
        'bg-[radial-gradient(var(--border)_1px,transparent_1px)] bg-size-[24px_24px]',
        panning ? 'cursor-grabbing' : 'cursor-grab'
      )}
    >
      <div
        className="absolute top-0 left-0 origin-top-left will-change-transform"
        style={{
          width: ARTBOARD_W,
          height: artboardH,
          transform: `translate(${transform.x}px, ${transform.y}px) scale(${transform.scale})`,
        }}
      >
        {/* Leader lines (canvas-local coords; non-interactive). */}
        <svg
          width={ARTBOARD_W}
          height={artboardH || 1}
          className="pointer-events-none absolute top-0 left-0 overflow-visible"
          aria-hidden="true"
        >
          {placed.map((p) => {
            const y = FRAME_TOP + p.y
            const edge = p.side === 'left' ? FRAME_LEFT : FRAME_RIGHT
            const end = p.side === 'left' ? FRAME_LEFT - GAP : FRAME_RIGHT + GAP
            return (
              <g key={p.key} className="stroke-brand/50">
                <line
                  x1={edge}
                  y1={y}
                  x2={end}
                  y2={y}
                  strokeWidth={1.5}
                  strokeDasharray="3 3"
                />
                <circle
                  cx={edge}
                  cy={y}
                  r={3}
                  className="fill-brand stroke-none"
                />
              </g>
            )
          })}
        </svg>

        {/* Architecture note — the "why", floated above the artboard like a file
            comment. Non-interactive so drags over it still pan. */}
        <div
          className="border-brand/30 bg-card/80 text-muted-foreground pointer-events-none absolute rounded-md border border-dashed p-3 font-mono text-[11px] leading-relaxed shadow-sm backdrop-blur"
          style={{ left: FRAME_LEFT, top: 0, width: FRAME_W }}
        >
          <span className="text-brand">
            {'// '}
            {t('canvas.arch.title')}
          </span>
          <p className="mt-1">{t('canvas.arch.body')}</p>
        </div>

        {/* Margin callouts. */}
        {placed.map((p) => (
          <div
            key={p.key}
            className="text-muted-foreground pointer-events-none absolute font-mono text-[11px] leading-relaxed"
            style={{
              top: FRAME_TOP + p.y,
              left: p.side === 'left' ? 0 : FRAME_RIGHT + GAP,
              width: NOTE_W,
              transform: 'translateY(-50%)',
              textAlign: p.side === 'left' ? 'right' : 'left',
            }}
          >
            <span className="text-foreground/80 block font-medium">
              {t(`canvas.notes.${p.key}.title`)}
            </span>
            <span className="mt-0.5 block">
              {t(`canvas.notes.${p.key}.body`)}
            </span>
          </div>
        ))}

        {/* The artboard itself — the real, interactive site. */}
        <div
          ref={frameRef}
          className="border-border bg-background absolute rounded-lg border shadow-xl"
          style={{ left: FRAME_LEFT, top: FRAME_TOP, width: FRAME_W }}
        >
          <div className="border-border text-muted-foreground border-b px-4 py-2 font-mono text-[11px]">
            {t('canvas.frameLabel')}
          </div>
          <div className="px-6 py-10">{children}</div>
          <Footer />
        </div>
      </div>

      {/* Zoom controls (fixed to the surface, never pan). */}
      <div
        data-canvas-ui
        className="border-border bg-card/90 absolute right-4 bottom-4 flex items-center gap-1 rounded-full border p-1 shadow-sm backdrop-blur"
      >
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('canvas.zoomOut')}
          onClick={() => zoomBy(0.8)}
        >
          <ZoomOut />
        </Button>
        <span className="text-muted-foreground w-10 text-center font-mono text-[10px] tabular-nums">
          {Math.round(transform.scale * 100)}%
        </span>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('canvas.zoomIn')}
          onClick={() => zoomBy(1.25)}
        >
          <ZoomIn />
        </Button>
        <Button
          variant="ghost"
          size="icon-xs"
          aria-label={t('canvas.fit')}
          onClick={() => fitWidth(ARTBOARD_W)}
        >
          <Maximize />
        </Button>
      </div>

      {/* One-line hint. */}
      <div
        data-canvas-ui
        className="text-muted-foreground/70 pointer-events-none absolute bottom-5 left-1/2 -translate-x-1/2 font-mono text-[10px]"
      >
        {t('canvas.hint')}
      </div>
    </div>
  )
}
