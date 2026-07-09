'use client'

import type { ThanksContent } from '@/sections'

export function Thanks({ content }: { content: ThanksContent }) {
  return (
    <div className="text-center">
      {content?.greeting && (
        <p className="font-[Georgia,serif] text-2xl text-balance">
          {content.greeting}
        </p>
      )}
      {content?.message && (
        <p className="mx-auto mt-6 max-w-lg text-sm">{content.message}</p>
      )}
      {content?.signature && (
        <p className="mt-10 font-[Georgia,serif] text-3xl tracking-widest text-(--alur-accent)">
          {content.signature}
        </p>
      )}
    </div>
  )
}
