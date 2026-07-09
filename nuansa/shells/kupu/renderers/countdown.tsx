'use client'

import { useCountdown } from '@/lib/use-countdown'
import type { CountdownContent } from '@/sections'

import { Title } from '../primitives'

export function Countdown({ content }: { content: CountdownContent }) {
  const units = useCountdown(content?.targetDate)

  return (
    <div className="space-y-6">
      <Title>{content?.title}</Title>
      <ul className="flex justify-center gap-2">
        {units.map((unit) => (
          <li
            key={unit.label}
            className="min-w-16 rounded-lg border border-(--kupu-soft) px-2 py-2"
          >
            <span className="block font-[Georgia,serif] text-2xl tabular-nums">
              {String(unit.value).padStart(2, '0')}
            </span>
            <span className="block text-xs text-(--kupu-accent)">
              {unit.label}
            </span>
          </li>
        ))}
      </ul>
    </div>
  )
}
