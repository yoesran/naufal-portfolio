import { useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import angularSvg from '@/assets/tech-stacks/angular.svg?raw'
import flutterSvg from '@/assets/tech-stacks/flutter.svg?raw'
import jsSvg from '@/assets/tech-stacks/javascript.svg?raw'
import nextSvg from '@/assets/tech-stacks/nextdotjs.svg?raw'
import reactSvg from '@/assets/tech-stacks/react.svg?raw'
import svelteSvg from '@/assets/tech-stacks/svelte.svg?raw'
import tsSvg from '@/assets/tech-stacks/typescript.svg?raw'
import vueSvg from '@/assets/tech-stacks/vuedotjs.svg?raw'
import { Cell } from '@/components/Cell'
import { type Translations } from '@/lib/i18n'
import { useMeasuredHeight } from '@/lib/useMeasuredHeight'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/utils'

type TechNoteKey = keyof Translations['techStack']['notes']
type Tech = { name: string; noteKey: TechNoteKey; svg: string; color: string }

const TECH: Tech[] = [
  { name: 'React', noteKey: 'react', svg: reactSvg, color: '#61DAFB' },
  {
    name: 'Next.js',
    noteKey: 'next',
    svg: nextSvg,
    // brand is black; follow theme for contrast on both modes
    color: 'var(--foreground)',
  },
  { name: 'TypeScript', noteKey: 'typescript', svg: tsSvg, color: '#3178C6' },
  { name: 'Svelte', noteKey: 'svelte', svg: svelteSvg, color: '#FF3E00' },
  { name: 'Angular', noteKey: 'angular', svg: angularSvg, color: '#DD0031' },
  { name: 'Vue', noteKey: 'vue', svg: vueSvg, color: '#4FC08D' },
  { name: 'Flutter', noteKey: 'flutter', svg: flutterSvg, color: '#02569B' },
  { name: 'JavaScript', noteKey: 'javascript', svg: jsSvg, color: '#F7DF1E' },
]

const ROTATION_SPEED = 360 / 25000 // 360deg per 25s

export function TechStackBlock() {
  const { t } = useTranslation()
  const [active, setActive] = useState<Tech | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [panelRef, panelHeight] = useMeasuredHeight<HTMLDivElement>()
  // Treat a device as "desktop" only if it has BOTH a hover-capable input and a
  // fine pointer (real mouse / trackpad). Phones and tablets fail one or both
  // and fall through to the touch handlers. Re-evaluates live on capability
  // changes — e.g. a 2-in-1 docking/undocking a trackpad mid-session.
  const desktop = useMediaQuery('(hover: hover) and (pointer: fine)')
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')

  // Single source of truth for "should the orbit be paused?" — paused if
  // anything is selected (keyboard, hover, or tap) OR a finger is actively
  // touching a pill. Empty-canvas hover/touch never engages the pause; the
  // rAF loop reads pausedRef every frame.
  const activeRef = useRef<Tech | null>(null)
  const touchActiveRef = useRef(false)
  const pausedRef = useRef(false)

  function recomputePause() {
    pausedRef.current = activeRef.current !== null || touchActiveRef.current
  }

  // Always go through this instead of bare setActive so activeRef and pausedRef
  // stay in sync synchronously — React skips re-render when setState is called
  // with the same value, which would leave the pause state stale.
  function selectTech(tech: Tech | null) {
    setActive(tech)
    activeRef.current = tech
    recomputePause()
  }

  // Mobile tap-to-deselect: any touch that doesn't land on a pill clears the
  // selection — empty canvas, anywhere outside it, or another block. A pill's
  // own onTouchStart owns selection, so those taps are skipped. The pill's
  // onBlur is the keyboard equivalent, but on mobile (iOS Safari especially)
  // tapping a non-focusable element doesn't blur the button — blur never fires
  // and the orbit stays paused with a stale selection. Document-level
  // touchstart fills the gap.
  useEffect(() => {
    if (desktop) return
    const onDocTouch = (e: TouchEvent) => {
      const target = e.target as HTMLElement | null
      // `[data-orbit-slot]` is the pill marker (same one onBlur checks). Any
      // non-pill tap is an unconditional "reset to spinning": force-clear
      // touchActiveRef too, in case a prior touchend didn't bubble during
      // scroll-promotion and left it stale `true`.
      if (target && !target.closest('[data-orbit-slot]')) {
        touchActiveRef.current = false
        selectTech(null)
      }
    }
    // Capture phase: fires before any descendant listener has a chance to
    // call stopPropagation. Base-ui-react's portal triggers, the theme
    // toggle, and other interactive nodes might swallow bubble-phase events.
    document.addEventListener('touchstart', onDocTouch, {
      passive: true,
      capture: true,
    })
    return () =>
      document.removeEventListener('touchstart', onDocTouch, { capture: true })
    // selectTech is stable via React Compiler — re-binding the listener every
    // render would be wasteful and there's nothing in its closure that changes.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [desktop])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const slots = Array.from(
      container.querySelectorAll<HTMLElement>('[data-orbit-slot]')
    )

    // Cache radius — recomputed only when the container resizes, not every
    // frame. Saves a layout read per tick.
    let radius = container.clientWidth * 0.34
    const ro = new ResizeObserver(() => {
      radius = container.clientWidth * 0.34
    })
    ro.observe(container)

    let rotation = 0
    let last = performance.now()
    let raf = 0

    function tick(now: number) {
      const dt = now - last
      last = now
      if (!reduce && !pausedRef.current) {
        rotation = (rotation + ROTATION_SPEED * dt) % 360
      }
      for (let i = 0; i < slots.length; i++) {
        const angle = (rotation + (i * 360) / slots.length) % 360
        slots[i].style.transform =
          `translate(-50%, -50%) rotate(${angle}deg) translateY(-${radius}px) rotate(${-angle}deg)`
      }
      raf = requestAnimationFrame(tick)
    }

    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      ro.disconnect()
    }
  }, [reduce])

  return (
    <Cell label="// tech-stack · host-native React">
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-[320px]"
      >
        {/* center "me" dot */}
        <div className="bg-brand/80 absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full shadow-[0_0_12px_color-mix(in_oklch,var(--brand)_60%,transparent)]" />

        {TECH.map((tech) => {
          const isActive = active?.name === tech.name
          return (
            <div
              key={tech.name}
              data-orbit-slot
              className="absolute top-1/2 left-1/2"
            >
              <button
                type="button"
                aria-label={tech.name}
                // === KEYBOARD: focus highlights; blur only clears if focus is
                // leaving the orbit entirely (tabbing pill→pill stays selected) ===
                onFocus={() => selectTech(tech)}
                onBlur={(e) => {
                  const next = e.relatedTarget as HTMLElement | null
                  if (next?.closest('[data-orbit-slot]')) return
                  selectTech(null)
                }}
                // === DESKTOP: hover highlights; leaving the pill clears it
                // immediately (orbit resumes the moment the cursor exits). ===
                onMouseEnter={desktop ? () => selectTech(tech) : undefined}
                onMouseLeave={desktop ? () => selectTech(null) : undefined}
                // === MOBILE: tap highlights and presses-to-pause; lifting or
                // a cancelled gesture (scroll/zoom promotion) releases the
                // pause flag. Deselect is handled by the document watcher (any
                // tap off a pill). ===
                onTouchStart={
                  desktop
                    ? undefined
                    : () => {
                        touchActiveRef.current = true
                        selectTech(tech)
                      }
                }
                onTouchEnd={
                  desktop
                    ? undefined
                    : () => {
                        touchActiveRef.current = false
                        recomputePause()
                      }
                }
                onTouchCancel={
                  desktop
                    ? undefined
                    : () => {
                        touchActiveRef.current = false
                        recomputePause()
                      }
                }
                className={cn(
                  'bg-card focus-visible:ring-brand/40 flex size-12 items-center justify-center rounded-full border shadow-sm transition-[transform,border-color] duration-200 focus:outline-none focus-visible:ring-2',
                  isActive
                    ? 'border-brand/60 scale-125'
                    : 'border-border hover:scale-110'
                )}
              >
                <span
                  aria-hidden="true"
                  className="block transition-colors duration-200 [&_path]:fill-current [&_svg]:block [&_svg]:size-6"
                  style={{
                    color: isActive ? tech.color : 'var(--muted-foreground)',
                  }}
                  dangerouslySetInnerHTML={{ __html: tech.svg }}
                />
              </button>
            </div>
          )
        })}
      </div>

      <div
        className="mt-4 overflow-hidden transition-[height] duration-200 ease-out"
        style={{ height: panelHeight }}
      >
        <div
          ref={panelRef}
          className="border-border/70 text-muted-foreground rounded-lg border border-dashed px-4 py-3 font-mono text-sm"
        >
          {active ? (
            <>
              <span className="text-foreground font-medium">{active.name}</span>
              <span className="text-muted-foreground/60"> — </span>
              {t(`techStack.notes.${active.noteKey}`)}
            </>
          ) : (
            <span className="text-muted-foreground/60">
              {t('techStack.prompt')}
            </span>
          )}
        </div>
      </div>
    </Cell>
  )
}
