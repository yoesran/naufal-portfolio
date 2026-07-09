'use client'

import type { QuotesContent } from '@/sections'

export function Quotes({ content }: { content: QuotesContent }) {
  return (
    <figure className="space-y-4">
      {content?.text && (
        <blockquote className="text-sm leading-relaxed text-pretty italic">
          “{content.text}”
        </blockquote>
      )}
      {content?.source && (
        <figcaption className="font-semibold">{content.source}</figcaption>
      )}
    </figure>
  )
}
