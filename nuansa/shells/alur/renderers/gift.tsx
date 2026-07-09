'use client'

import type { GiftContent } from '@/sections'

import { Title } from '../primitives'

export function Gift({ content }: { content: GiftContent }) {
  const accounts = content?.accounts ?? []

  return (
    <div>
      <Title>Kirim Hadiah</Title>
      {content?.note && <p className="mb-6 max-w-lg text-sm">{content.note}</p>}

      <ul className="divide-y divide-(--alur-soft)/60 border-y border-(--alur-soft)/60">
        {accounts.map((account, index) => (
          <li
            key={index}
            className="flex flex-wrap items-baseline justify-between gap-2 py-4"
          >
            <div>
              <p className="text-xs tracking-widest uppercase">
                {account.bank}
              </p>
              {account.holder && (
                <p className="mt-1 text-sm">a.n. {account.holder}</p>
              )}
            </div>
            <p className="font-[Georgia,serif] text-xl tracking-wider tabular-nums">
              {account.number}
            </p>
          </li>
        ))}
      </ul>
    </div>
  )
}
