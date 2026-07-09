'use client'

import type { MapsContent } from '@/sections'

import { Title } from '../primitives'

export function Maps({ content }: { content: MapsContent }) {
  return (
    <div>
      <Title>Lokasi</Title>
      {content?.label && <p className="font-semibold">{content.label}</p>}
      {content?.address && (
        <p className="mt-1 max-w-md text-sm">{content.address}</p>
      )}
      {content?.url && (
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="mt-6 inline-flex min-h-11 items-center border-b-2 border-(--alur-accent) text-sm font-semibold text-(--alur-accent) focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--alur-ink)"
        >
          Petunjuk Ke Lokasi →
        </a>
      )}
    </div>
  )
}
