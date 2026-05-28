import { useEffect, useLayoutEffect, useRef, useState } from 'react'

import angularSvg from '@/assets/tech-stacks/angular.svg?raw'
import flutterSvg from '@/assets/tech-stacks/flutter.svg?raw'
import jsSvg from '@/assets/tech-stacks/javascript.svg?raw'
import nextSvg from '@/assets/tech-stacks/nextdotjs.svg?raw'
import reactSvg from '@/assets/tech-stacks/react.svg?raw'
import svelteSvg from '@/assets/tech-stacks/svelte.svg?raw'
import tsSvg from '@/assets/tech-stacks/typescript.svg?raw'
import vueSvg from '@/assets/tech-stacks/vuedotjs.svg?raw'

import { Cell } from '@/components/Cell'
import { cn } from '@/lib/utils'

type Tech = { name: string; note: string; svg: string; color: string }

const TECH: Tech[] = [
  {
    name: 'React',
    note: 'Daily driver — currently at DBS (microfrontend webview), previously eDOT, Doubler Studio.',
    svg: reactSvg,
    color: '#61DAFB',
  },
  {
    name: 'Next.js',
    note: 'Landing + onboarding webview at Ajaib, internal dashboards at eDOT.',
    svg: nextSvg,
    color: '#FFFFFF', // brand is black; overridden for visibility on dark theme
  },
  {
    name: 'TypeScript',
    note: 'Default for everything I write.',
    svg: tsSvg,
    color: '#3178C6',
  },
  {
    name: 'Svelte',
    note: "Powers the federated remote you've been interacting with on this page.",
    svg: svelteSvg,
    color: '#FF3E00',
  },
  {
    name: 'Angular',
    note: 'Feature modules at Bank Danamon — DBankPro 2.0, Single-SPA → NX migration.',
    svg: angularSvg,
    color: '#DD0031',
  },
  {
    name: 'Vue',
    note: 'Exploring — planned as a second federated remote on this playground.',
    svg: vueSvg,
    color: '#4FC08D',
  },
  {
    name: 'Flutter',
    note: 'Mobile work at GeekGarden.',
    svg: flutterSvg,
    color: '#02569B',
  },
  {
    name: 'JavaScript',
    note: 'Vanilla JS + jQuery on BCA projects at Doubler Studio — where it started.',
    svg: jsSvg,
    color: '#F7DF1E',
  },
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

  // Single source of truth for "should the orbit be paused?" — paused if
  // anything is selected (keyboard, hover, or tap) OR the user is currently
  // engaging the canvas (mouse hovering, finger touching). Each handler
  // updates one ref and calls recomputePause(); the rAF loop reads pausedRef
  // every frame.
  const activeRef = useRef<Tech | null>(null)
  const mouseInContainerRef = useRef(false)
  const touchActiveRef = useRef(false)
  const pausedRef = useRef(false)

  function recomputePause() {
    pausedRef.current =
      activeRef.current !== null ||
      mouseInContainerRef.current ||
      touchActiveRef.current
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
        // === DESKTOP: hover engages the canvas; leaving clears active ===
        onMouseEnter={
          desktop
            ? () => {
                mouseInContainerRef.current = true
                recomputePause()
              }
            : undefined
        }
        onMouseLeave={
          desktop
            ? () => {
                mouseInContainerRef.current = false
                selectTech(null)
              }
            : undefined
        }
        // === MOBILE: tapping empty canvas (not a pill) deselects ===
        onTouchStart={
          desktop
            ? undefined
            : () => {
                touchActiveRef.current = true
                selectTech(null)
              }
        }
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
              {active.note}
            </>
          ) : (
            <span className="text-muted-foreground/60">
              pick a tech to see how it shows up in my work →
            </span>
          )}
        </div>
      </div>
    </Cell>
  )
}
