'use client'

import type { ThanksContent } from '@/sections'

export function Thanks({ content }: { content: ThanksContent }) {
  return (
    <div className="space-y-5">
      {content?.greeting && (
        <p className="font-semibold text-balance">{content.greeting}</p>
      )}
      {content?.message && <p className="text-sm">{content.message}</p>}
      {content?.signature && (
        <div className="pt-2">
          <p className="text-sm">Hormat kami yang mengundang</p>
          <p className="mt-1 font-[Georgia,serif] text-2xl tracking-widest text-(--kupu-accent)">
            {content.signature}
          </p>
        </div>
      )}
    </div>
  )
}
