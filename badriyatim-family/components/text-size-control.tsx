'use client'

import { useSyncExternalStore } from 'react'

import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { cn } from '@/lib/utils'

type Size = 'base' | 'lg' | 'xl'

const LEVELS: { key: Size; label: string; aria: string }[] = [
  { key: 'base', label: 'A', aria: 'Ukuran teks normal' },
  { key: 'lg', label: 'A+', aria: 'Ukuran teks besar' },
  { key: 'xl', label: 'A++', aria: 'Ukuran teks paling besar' },
]

// The text size lives on <html data-textsize> (set pre-paint from localStorage by
// the inline script in the root layout). We read/write it through an external
// store + useSyncExternalStore — this avoids a setState-in-effect (the React
// Compiler rule), handles the SSR→client snapshot cleanly, and keeps every
// mounted control (header + mobile sheet) in sync.
let listeners: Array<() => void> = []

function subscribe(cb: () => void) {
  listeners.push(cb)
  return () => {
    listeners = listeners.filter((l) => l !== cb)
  }
}

function getSize(): Size {
  const c = document.documentElement.getAttribute('data-textsize')
  return c === 'lg' || c === 'xl' ? c : 'base'
}

function setSize(s: Size) {
  if (s === 'base') document.documentElement.removeAttribute('data-textsize')
  else document.documentElement.setAttribute('data-textsize', s)
  try {
    localStorage.setItem('textsize', s)
  } catch {}
  listeners.forEach((l) => l())
}

export function TextSizeControl() {
  const size = useSyncExternalStore(subscribe, getSize, () => 'base' as Size)

  return (
    <ToggleGroup
      aria-label="Ukuran teks"
      value={[size]}
      onValueChange={(next) => next[0] && setSize(next[0] as Size)}
      spacing={0}
      className="border-border bg-card rounded-full border p-0.5"
    >
      {LEVELS.map((l) => (
        <ToggleGroupItem
          key={l.key}
          value={l.key}
          aria-label={l.aria}
          className={cn(
            'text-tanah-soft hover:text-marun aria-pressed:bg-marun aria-pressed:text-gading data-[state=on]:bg-marun data-[state=on]:text-gading min-h-11 min-w-11 rounded-full! leading-none font-semibold hover:bg-transparent',
            l.key === 'base' && 'text-sm',
            l.key === 'lg' && 'text-base',
            l.key === 'xl' && 'text-lg'
          )}
        >
          {l.label}
        </ToggleGroupItem>
      ))}
    </ToggleGroup>
  )
}
