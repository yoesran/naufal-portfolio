'use client'

import type { CoverContent } from '@/sections'

export function Cover({ content }: { content: CoverContent }) {
  return (
    <div className="space-y-5">
      {content?.heading && (
        <p className="text-sm tracking-[0.25em] uppercase">{content.heading}</p>
      )}

      <h1 className="font-[Georgia,serif] text-4xl leading-tight text-balance text-(--kupu-accent)">
        {content?.person1}
        {content?.person1 && content?.person2 && (
          <span className="mx-2 font-normal italic">&</span>
        )}
        {content?.person2}
      </h1>

      {content?.tagline && <p className="text-sm">{content.tagline}</p>}

      {content?.guestLabel && (
        <div className="pt-4 text-sm">
          <p>{content.guestLabel}</p>
          {/* Real per-guest names arrive with the `?g=` link — see SPEC open
              decision on personalization. Until then this is a placeholder. */}
          <p className="mt-1 font-semibold">Nama Tamu</p>
        </div>
      )}
    </div>
  )
}
