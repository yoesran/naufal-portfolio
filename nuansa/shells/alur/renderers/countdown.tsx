'use client'

import { useCountdown } from '@/lib/use-countdown'
import type { CountdownContent } from '@/sections'

import { Title } from '../primitives'

export function Countdown({ content }: { content: CountdownContent }) {
  const units = useCountdown(content?.targetDate)

  return (
    <div>
      <Title>{content?.title}</Title>
      <dl className="flex flex-wrap gap-8">
        {units.map((unit) => (
          <div key={unit.label}>
            <dd className="font-[Georgia,serif] text-5xl tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </dd>
            <dt className="mt-1 text-xs tracking-widest uppercase">
              {unit.label}
            </dt>
          </div>
        ))}
      </dl>
    </div>
  )
}
