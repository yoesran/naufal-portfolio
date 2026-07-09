'use client'

import {
  type CSSProperties,
  type KeyboardEvent,
  type ReactNode,
  useRef,
  useState,
} from 'react'

import { MusicButton } from '@/lib/music-button'
import type { ChromeProps } from '@/lib/shells'

import { Frame } from './ornament'

// Kupu's palette, scoped to this subtree. No platform theming involved.
const theme = {
  '--kupu-page': 'oklch(0.94 0.025 232)',
  '--kupu-card': 'oklch(0.99 0.005 230)',
  '--kupu-nav': 'oklch(0.87 0.04 268)',
  '--kupu-ink': 'oklch(0.32 0.03 240)',
  '--kupu-accent': 'oklch(0.47 0.07 226)',
  '--kupu-soft': 'oklch(0.72 0.06 222)',
  color: 'var(--kupu-ink)',
} as CSSProperties

/** The framed column every Kupu page sits in, sections or not. */
function Page({ children }: { children: ReactNode }) {
  return (
    <div
      style={theme}
      className="flex min-h-dvh justify-center bg-(--kupu-page)"
    >
      <div className="relative flex min-h-dvh w-full max-w-[430px] flex-col overflow-hidden shadow-2xl">
        <Frame />
        {children}
      </div>
    </div>
  )
}

/**
 * Mobile-first column with an ornamented arch and a bottom tab bar that pages
 * between sections — one section on screen at a time.
 */
export function KupuChrome({ items, musicUrl }: ChromeProps) {
  // Track the active tab by key, not index: removing or reordering a section
  // mid-edit (which the live preview does constantly) would strand an index.
  const [activeKey, setActiveKey] = useState<string | undefined>(items[0]?.key)
  const tabRefs = useRef<(HTMLButtonElement | null)[]>([])

  const found = items.findIndex((item) => item.key === activeKey)
  const activeIndex = found === -1 ? 0 : found
  const active = items[activeIndex]

  // Every section hidden: keep the shell so the operator still sees a page,
  // rather than dropping to a blank viewport.
  if (!active) {
    return (
      <Page>
        <main className="relative z-10 flex flex-1 items-center justify-center px-9 text-center text-sm">
          Semua bagian disembunyikan.
        </main>
      </Page>
    )
  }

  // WAI-ARIA tabs: roving tabindex, arrows move selection, Home/End jump.
  const onKeyDown = (event: KeyboardEvent) => {
    const offsets: Record<string, number> = { ArrowRight: 1, ArrowLeft: -1 }
    let next: number | undefined

    if (event.key in offsets) {
      next = (activeIndex + offsets[event.key] + items.length) % items.length
    } else if (event.key === 'Home') {
      next = 0
    } else if (event.key === 'End') {
      next = items.length - 1
    }
    if (next === undefined) return

    event.preventDefault()
    setActiveKey(items[next].key)
    tabRefs.current[next]?.focus()
  }

  return (
    <Page>
      <main className="relative z-10 flex flex-1 flex-col">
        {/* role=tabpanel belongs on a generic element — <main> can't take it. */}
        <div
          role="tabpanel"
          id={`kupu-panel-${active.key}`}
          aria-labelledby={`kupu-tab-${active.key}`}
          tabIndex={0}
          className="flex flex-1 flex-col items-center justify-center px-9 py-16 text-center"
        >
          {active.node}
        </div>
      </main>

      {musicUrl && (
        <MusicButton
          url={musicUrl}
          className="absolute right-3 bottom-20 z-20 flex size-11 items-center justify-center rounded-full bg-(--kupu-accent) text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--kupu-ink)"
        />
      )}

      <nav className="relative z-10 shrink-0 bg-(--kupu-nav)">
        <div
          role="tablist"
          aria-label="Bagian undangan"
          onKeyDown={onKeyDown}
          className="flex overflow-x-auto"
        >
          {items.map((item, index) => {
            const selected = index === activeIndex
            return (
              <button
                key={item.key}
                ref={(el) => {
                  tabRefs.current[index] = el
                }}
                type="button"
                role="tab"
                id={`kupu-tab-${item.key}`}
                aria-controls={`kupu-panel-${item.key}`}
                aria-selected={selected}
                tabIndex={selected ? 0 : -1}
                onClick={() => setActiveKey(item.key)}
                className={`flex min-h-14 min-w-18 flex-1 flex-col items-center justify-center gap-1 px-3 text-xs focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--kupu-ink) ${
                  selected
                    ? 'bg-(--kupu-accent) text-white'
                    : 'text-(--kupu-ink)'
                }`}
              >
                <item.Icon className="size-4 shrink-0" aria-hidden />
                {item.label}
              </button>
            )
          })}
        </div>
      </nav>
    </Page>
  )
}
