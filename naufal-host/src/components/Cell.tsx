import type { ReactNode } from 'react'

import { cn } from '@/lib/utils'

export function Cell({
  label,
  children,
  className,
}: {
  label: string
  children: ReactNode
  className?: string
}) {
  return (
    <section
      className={cn(
        'border-border bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm',
        className
      )}
    >
      <div className="border-border text-muted-foreground border-b px-4 py-2 font-mono text-xs">
        {label}
      </div>
      <div className="p-5">{children}</div>
    </section>
  )
}
