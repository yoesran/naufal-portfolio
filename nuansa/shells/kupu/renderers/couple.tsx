'use client'

import type { CoupleContent } from '@/sections'

import { Portrait, Title } from '../primitives'

export function Couple({ content }: { content: CoupleContent }) {
  return (
    <div className="space-y-8">
      {content?.intro && <p className="text-sm">{content.intro}</p>}

      {[content?.groom, content?.bride].map((person, index) => (
        <div key={index} className="flex flex-col items-center gap-3">
          <Portrait photo={person?.photo} name={person?.name} />
          <Title>{person?.name}</Title>
          {person?.parents && <p className="text-sm">{person.parents}</p>}
        </div>
      ))}
    </div>
  )
}
