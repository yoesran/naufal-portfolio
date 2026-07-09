'use client'

import { splitDate } from '@/lib/date'
import type { EventContent } from '@/sections'

import { Title } from '../primitives'

export function Event({ content }: { content: EventContent }) {
  const date = splitDate(content?.date)

  return (
    <div className="space-y-6">
      <Title>{content?.title}</Title>

      {date && (
        <div className="flex items-center justify-center gap-4">
          {content?.dayName && (
            <span className="text-sm">{content.dayName}</span>
          )}
          <div className="border-x border-(--kupu-soft) px-4">
            <span className="block font-[Georgia,serif] text-4xl tabular-nums">
              {date.day}
            </span>
            <span className="block text-sm tabular-nums">{date.year}</span>
          </div>
          <span className="text-sm">{date.monthName}</span>
        </div>
      )}

      {content?.time && <p className="text-sm">{content.time}</p>}

      {(content?.venue || content?.address) && (
        <div className="space-y-1">
          <p className="font-semibold text-(--kupu-accent)">Lokasi Acara</p>
          {content.venue && <p className="font-semibold">{content.venue}</p>}
          {content.address && <p className="text-sm">{content.address}</p>}
        </div>
      )}

      {content?.dresscode && (
        <div>
          <p className="font-semibold">Dresscode</p>
          <p className="text-sm">{content.dresscode}</p>
        </div>
      )}
    </div>
  )
}
