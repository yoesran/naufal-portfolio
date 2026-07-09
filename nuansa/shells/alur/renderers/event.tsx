'use client'

import { splitDate } from '@/lib/date'
import type { EventContent } from '@/sections'

import { Title } from '../primitives'

export function Event({ content }: { content: EventContent }) {
  const date = splitDate(content?.date)

  return (
    <div>
      <Title>{content?.title}</Title>

      <dl className="grid gap-4 text-sm sm:grid-cols-2">
        {date && (
          <div>
            <dt className="text-xs tracking-widest uppercase">Tanggal</dt>
            <dd className="mt-1 font-[Georgia,serif] text-xl">
              {content?.dayName && `${content.dayName}, `}
              {date.day} {date.monthName} {date.year}
            </dd>
          </div>
        )}
        {content?.time && (
          <div>
            <dt className="text-xs tracking-widest uppercase">Waktu</dt>
            <dd className="mt-1 font-[Georgia,serif] text-xl">
              {content.time}
            </dd>
          </div>
        )}
        {(content?.venue || content?.address) && (
          <div>
            <dt className="text-xs tracking-widest uppercase">Tempat</dt>
            <dd className="mt-1">
              {content.venue && (
                <p className="font-semibold">{content.venue}</p>
              )}
              {content.address && <p>{content.address}</p>}
            </dd>
          </div>
        )}
        {content?.dresscode && (
          <div>
            <dt className="text-xs tracking-widest uppercase">Dresscode</dt>
            <dd className="mt-1">{content.dresscode}</dd>
          </div>
        )}
      </dl>
    </div>
  )
}
