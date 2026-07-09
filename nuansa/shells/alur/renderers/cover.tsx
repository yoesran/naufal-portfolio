'use client'

import type { CoverContent } from '@/sections'

export function Cover({ content }: { content: CoverContent }) {
  return (
    <div className="py-10">
      {content?.heading && (
        <p className="text-xs tracking-[0.35em] uppercase">{content.heading}</p>
      )}

      <h1 className="mt-6 font-[Georgia,serif] text-5xl leading-[1.05] tracking-tight sm:text-6xl">
        {content?.person1 && <span className="block">{content.person1}</span>}
        {content?.person1 && content?.person2 && (
          <span className="block text-(--alur-accent) italic">&</span>
        )}
        {content?.person2 && <span className="block">{content.person2}</span>}
      </h1>

      {content?.tagline && (
        <p className="mt-6 max-w-md text-sm">{content.tagline}</p>
      )}

      {content?.guestLabel && (
        <div className="mt-10 border-l-2 border-(--alur-accent) pl-4 text-sm">
          <p>{content.guestLabel}</p>
          {/* Real per-guest names arrive with the `?g=` link — SPEC open decision. */}
          <p className="mt-1 font-semibold">Nama Tamu</p>
        </div>
      )}
    </div>
  )
}
