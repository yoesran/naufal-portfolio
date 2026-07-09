'use client'

import type { ReactNode } from 'react'

// Kupu's own design primitives. Deliberately not shared with other shells —
// duplication across shells is what keeps their designs from converging.

export function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="font-[Georgia,serif] text-3xl text-balance text-(--kupu-accent)">
      {children}
    </h2>
  )
}

export function Portrait({ photo, name }: { photo?: string; name?: string }) {
  if (photo) {
    return (
      // eslint-disable-next-line @next/next/no-img-element -- content URLs are arbitrary; next/image needs a configured loader
      <img
        src={photo}
        alt={name ? `Foto ${name}` : ''}
        className="size-24 rounded-full object-cover ring-2 ring-(--kupu-soft)"
      />
    )
  }
  return (
    <div
      aria-hidden
      className="flex size-24 items-center justify-center rounded-full bg-(--kupu-soft)/25 font-[Georgia,serif] text-3xl text-(--kupu-accent) ring-2 ring-(--kupu-soft)"
    >
      {name?.trim().charAt(0) || '•'}
    </div>
  )
}
