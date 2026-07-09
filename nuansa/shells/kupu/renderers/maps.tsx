'use client'

import type { MapsContent } from '@/sections'

import { Title } from '../primitives'

export function Maps({ content }: { content: MapsContent }) {
  return (
    <div className="space-y-5">
      <Title>Lokasi</Title>
      {content?.label && <p className="font-semibold">{content.label}</p>}
      {content?.address && <p className="text-sm">{content.address}</p>}
      {content?.url && (
        <a
          href={content.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex min-h-11 items-center rounded-full bg-(--kupu-accent) px-6 text-sm text-white focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-(--kupu-ink)"
        >
          Petunjuk Ke Lokasi
        </a>
      )}
    </div>
  )
}
