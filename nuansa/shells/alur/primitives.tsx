'use client'

import type { ReactNode } from 'react'

// Alur's own design primitives. Deliberately not shared with Kupu — that
// duplication is what keeps the two designs from converging.

export function Title({ children }: { children: ReactNode }) {
  return (
    <h2 className="mb-6 font-[Georgia,serif] text-3xl tracking-tight text-balance text-(--alur-accent)">
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
        className="aspect-square w-full rounded-sm object-cover"
      />
    )
  }
  return (
    <div
      aria-hidden
      className="flex aspect-square w-full items-center justify-center rounded-sm bg-(--alur-soft)/40 font-[Georgia,serif] text-5xl text-(--alur-accent)"
    >
      {name?.trim().charAt(0) || '•'}
    </div>
  )
}
