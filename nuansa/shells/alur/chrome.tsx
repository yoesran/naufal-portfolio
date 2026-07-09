'use client'

import type { CSSProperties } from 'react'

import { MusicButton } from '@/lib/music-button'
import type { ChromeProps } from '@/lib/shells'

// Alur's palette — warm sand against Kupu's cool blue. Same sections, a
// deliberately different world.
const theme = {
  '--alur-page': 'oklch(0.97 0.015 75)',
  '--alur-ink': 'oklch(0.29 0.02 60)',
  '--alur-accent': 'oklch(0.46 0.09 45)',
  '--alur-soft': 'oklch(0.83 0.04 70)',
  color: 'var(--alur-ink)',
} as CSSProperties

/**
 * Vertical: every section stacked in one scroll, a sticky nav of anchor links.
 * Plain `<a href="#…">` rather than scroll JS — the browser already does this,
 * it works without hydration, and back/forward keeps its place.
 */
export function AlurChrome({ items, musicUrl }: ChromeProps) {
  return (
    <div
      style={theme}
      className="min-h-dvh scroll-smooth bg-(--alur-page) motion-reduce:scroll-auto"
    >
      <nav
        aria-label="Bagian undangan"
        className="sticky top-0 z-20 border-b border-(--alur-soft) bg-(--alur-page)/90 backdrop-blur"
      >
        <ul className="mx-auto flex max-w-2xl gap-1 overflow-x-auto px-4">
          {items.map((item) => (
            <li key={item.key}>
              <a
                href={`#alur-${item.key}`}
                className="flex min-h-11 items-center gap-1.5 px-3 text-xs whitespace-nowrap focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-(--alur-ink)"
              >
                <item.Icon className="size-3.5 shrink-0" aria-hidden />
                {item.label}
              </a>
            </li>
          ))}
        </ul>
      </nav>

      <main>
        {items.length === 0 && (
          <p className="px-6 py-20 text-center text-sm">
            Semua bagian disembunyikan.
          </p>
        )}
        {items.map((item, index) => (
          <section
            key={item.key}
            id={`alur-${item.key}`}
            aria-label={item.label}
            className={`scroll-mt-14 px-6 py-20 ${
              index > 0 ? 'border-t border-(--alur-soft)/60' : ''
            }`}
          >
            <div className="mx-auto max-w-2xl">{item.node}</div>
          </section>
        ))}
      </main>

      {musicUrl && (
        <MusicButton
          url={musicUrl}
          className="fixed right-4 bottom-4 z-20 flex size-11 items-center justify-center rounded-full bg-(--alur-accent) text-white shadow-lg focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--alur-ink)"
        />
      )}
    </div>
  )
}
