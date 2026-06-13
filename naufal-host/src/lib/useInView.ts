import { useEffect, useRef, useState } from 'react'

import { useCanvasMode } from '@/lib/canvas'

export function useInView<T extends HTMLElement>(options?: {
  rootMargin?: string
}) {
  const ref = useRef<T>(null)
  const [inView, setInView] = useState(false)
  // On the zoom/pan canvas, IntersectionObserver against the viewport is
  // unreliable (the content is transformed), so reveal everything at once there.
  const canvas = useCanvasMode()

  useEffect(() => {
    const el = ref.current
    if (!el) return

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true)
          observer.disconnect()
        }
      },
      {
        rootMargin: options?.rootMargin ?? '0px 0px -10% 0px',
        threshold: 0,
      }
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [options?.rootMargin])

  return [ref, inView || canvas] as const
}
