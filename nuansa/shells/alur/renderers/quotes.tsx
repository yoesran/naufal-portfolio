'use client'

import type { QuotesContent } from '@/sections'

export function Quotes({ content }: { content: QuotesContent }) {
  return (
    <figure>
      {content?.text && (
        <blockquote className="font-[Georgia,serif] text-2xl leading-relaxed text-pretty">
          “{content.text}”
        </blockquote>
      )}
      {content?.source && (
        <figcaption className="mt-4 text-sm tracking-widest uppercase">
          {content.source}
        </figcaption>
      )}
    </figure>
  )
}
