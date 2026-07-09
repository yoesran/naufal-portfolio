'use client'

import type { GiftContent } from '@/sections'

import { Title } from '../primitives'

export function Gift({ content }: { content: GiftContent }) {
  const accounts = content?.accounts ?? []

  return (
    <div className="space-y-6">
      <Title>Kirim Hadiah</Title>
      {content?.note && <p className="text-sm">{content.note}</p>}

      <ul className="space-y-3">
        {accounts.map((account, index) => (
          <li
            key={index}
            className="rounded-lg border border-(--kupu-soft) bg-(--kupu-card) px-4 py-3"
          >
            <p className="text-sm font-semibold">{account.bank}</p>
            <p className="font-[Georgia,serif] text-lg tracking-wider tabular-nums">
              {account.number}
            </p>
            {account.holder && <p className="text-xs">a.n. {account.holder}</p>}
          </li>
        ))}
      </ul>
    </div>
  )
}
