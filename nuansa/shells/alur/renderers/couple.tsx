'use client'

import type { CoupleContent } from '@/sections'

import { Portrait, Title } from '../primitives'

export function Couple({ content }: { content: CoupleContent }) {
  return (
    <div>
      <Title>Mempelai</Title>
      {content?.intro && (
        <p className="mb-8 max-w-lg text-sm">{content.intro}</p>
      )}

      <div className="grid gap-8 sm:grid-cols-2">
        {[content?.groom, content?.bride].map((person, index) => (
          <div key={index}>
            <Portrait photo={person?.photo} name={person?.name} />
            <h3 className="mt-4 font-[Georgia,serif] text-2xl">
              {person?.name}
            </h3>
            {person?.parents && (
              <p className="mt-1 text-sm">{person.parents}</p>
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
