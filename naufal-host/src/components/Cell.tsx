import type { ReactNode } from 'react'

import { useInView } from '@/lib/useInView'
import { cn } from '@/lib/utils'

export function Cell({
  label,
  children,
  className,
  id,
}: {
  label: string
  children: ReactNode
  className?: string
  // Optional anchor so external pages (e.g. blog stories) can deep-link to a
  // specific block (`/#experience`).
  id?: string
}) {
  const [ref, inView] = useInView<HTMLElement>()
  return (
    <section
      ref={ref}
      id={id}
      className={cn(
        'border-border bg-card text-card-foreground overflow-hidden rounded-xl border shadow-sm transition-all duration-700 ease-out motion-reduce:translate-y-0 motion-reduce:opacity-100 motion-reduce:transition-none',
        inView ? 'translate-y-0 opacity-100' : 'translate-y-4 opacity-0',
        // Anchored cells land below the sticky header when deep-linked.
        id && 'scroll-mt-16',
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
