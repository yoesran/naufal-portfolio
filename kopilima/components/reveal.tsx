'use client'

import { useEffect, useRef, useState } from 'react'

import { cn } from '@/lib/utils'

// Scroll-reveal: content rises and fades in the first time it enters the
// viewport (same pattern as the host's scroll-reveal). One-shot — the
// observer disconnects after firing. prefers-reduced-motion is handled
// globally: the transition collapses to ~0ms, so content just appears.
export function Reveal({
  children,
  className,
  delay = 0,
}: {
  children: React.ReactNode
  className?: string
  delay?: number
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [inView, setInView] = useState(false)

  useEffect(() => {
    const el = ref.current
    if (!el) return
    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          io.disconnect()
        }
      },
      // fire slightly before the element fully arrives, so the motion is
      // visible instead of already finished below the fold
      { threshold: 0.12, rootMargin: '0px 0px -48px 0px' }
    )
    io.observe(el)
    return () => io.disconnect()
  }, [])

  return (
    <div
      ref={ref}
      style={delay ? { transitionDelay: `${delay}ms` } : undefined}
      className={cn(
        'transition-[opacity,translate] duration-700 ease-out',
        // once revealed, drop the classes entirely (not translate-y-0): a
        // non-none `translate` on this wrapper would become the containing
        // block for the menu's sticky detail panel
        !inView && 'translate-y-5 opacity-0',
        className
      )}
    >
      {children}
    </div>
  )
}
