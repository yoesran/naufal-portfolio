import { useEffect, useLayoutEffect, useRef, useState } from 'react'
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

// Treat a device as "desktop" only if it both has a hover-capable input AND
// a fine pointer (real mouse / trackpad). Phones and tablets fail one or both
// and fall through to the touch handlers. Computed once per render — cheap and
// stable per session.
const hasHover = () =>
  typeof window !== 'undefined' &&
  window.matchMedia('(hover: hover) and (pointer: fine)').matches

export function TechStackBlock() {
  const { t } = useTranslation()
  const [active, setActive] = useState<Tech | null>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)
  const [panelHeight, setPanelHeight] = useState<number>()
  const [desktop, setDesktop] = useState(hasHover)

  // Re-evaluate the device on hover/pointer-capability changes — covers 2-in-1s
  // where a user docks/undocks a trackpad mid-session.
  useEffect(() => {
    const mql = window.matchMedia('(hover: hover) and (pointer: fine)')
    const onChange = () => setDesktop(mql.matches)
    mql.addEventListener('change', onChange)
    return () => mql.removeEventListener('change', onChange)
  }, [])

  // Mobile tap-outside: deselects when a touch lands anywhere outside the
  // orbit canvas. The pill's onBlur handler is the keyboard equivalent, but
  // on mobile (iOS Safari especially) tapping a non-focusable element doesn't
  // blur the button — focus stays on the pill, blur never fires, and the
  // orbit stays paused with a stale selection. Document-level touchstart fills
  // the gap. Desktop uses onMouseLeave on the container instead.
  useEffect(() => {
    if (desktop) return
    const onDocTouch = (e: TouchEvent) => {
      const target = e.target as Node | null
      if (
        target &&
        containerRef.current &&
        !containerRef.current.contains(target)
      ) {
        // Force-reset touchActiveRef alongside the deselect. If a prior touch
        // sequence left it stale `true` (a touchend that didn't bubble during
        // scroll-promotion, a multi-touch overlap), recomputePause would keep
        // pausedRef true even after activeRef goes null. An outside tap should
        // be an unconditional "reset to spinning" command.
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

  useLayoutEffect(() => {
    const panel = panelRef.current
    if (!panel) return
    const ro = new ResizeObserver(() => {
      setPanelHeight(panel.offsetHeight)
    })
    ro.observe(panel)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const container = containerRef.current
    if (!container) return

    const slots = Array.from(
      container.querySelectorAll<HTMLElement>('[data-orbit-slot]')
    )
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  }, [])

  return (
    <Cell label="// tech-stack · host-native React">
      <div
        ref={containerRef}
        className="relative mx-auto aspect-square w-full max-w-[320px]"
        // === DESKTOP: hover a pill to select; leaving the canvas clears it.
        // Empty-canvas hover never pauses the orbit — pills sweep under the
        // cursor and the active-selection rule alone drives the pause. ===
        onMouseLeave={desktop ? () => selectTech(null) : undefined}
        // === MOBILE: tapping empty canvas (not a pill) deselects — but
        // doesn't engage the touch-pause flag, so passive touches (e.g. a
        // finger landing during a scroll) don't stutter the orbit. The pill
        // itself still engages touchActiveRef on tap. ===
        onTouchStart={desktop ? undefined : () => selectTech(null)}
        // touchend: release immediately — pausedRef stays true if a pill is
        // still selected (recomputePause reads activeRef), so no hold delay
        // is needed for sticky selections.
        onTouchEnd={
          desktop
            ? undefined
            : () => {
                touchActiveRef.current = false
                recomputePause()
              }
        }
        // Safety net: browser fires touchcancel (not touchend) when it
        // promotes a touch to a scroll/zoom or the OS interrupts. Without
        // this, touchActiveRef would leak `true` and the orbit would never
        // resume even after `active` is cleared.
        onTouchCancel={
          desktop
            ? undefined
            : () => {
                touchActiveRef.current = false
                recomputePause()
              }
        }
      >
        {/* center "me" dot */}
        <div className="absolute top-1/2 left-1/2 size-3 -translate-x-1/2 -translate-y-1/2 rounded-full bg-emerald-400/80 shadow-[0_0_12px_rgba(52,211,153,0.6)]" />

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
                // === DESKTOP: hover highlights ===
                onMouseEnter={desktop ? () => selectTech(tech) : undefined}
                // === MOBILE: tap highlights (touch handled per-button) ===
                onTouchStart={
                  desktop
                    ? undefined
                    : (e) => {
                        e.stopPropagation()
                        touchActiveRef.current = true
                        selectTech(tech)
                      }
                }
                className={cn(
                  'bg-card flex size-12 items-center justify-center rounded-full border shadow-sm transition-[transform,border-color] duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-emerald-400/40',
                  isActive
                    ? 'scale-125 border-emerald-500/60'
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
