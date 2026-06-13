import { useLayoutEffect, useRef, useState } from 'react'

// Track an element's height via a ResizeObserver, into state — the shared engine
// behind the blocks' height-animated panels (each pairs the returned height with
// a `transition-[height]` wrapper so the panel grows/shrinks as its content
// changes). Returns a ref to attach to the measured element and its current
// offsetHeight (undefined until first measured). useLayoutEffect so the first
// measurement lands before paint, avoiding a height flash on mount.
export function useMeasuredHeight<T extends HTMLElement>() {
  const ref = useRef<T>(null)
  const [height, setHeight] = useState<number>()

  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    const ro = new ResizeObserver(() => setHeight(el.offsetHeight))
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  return [ref, height] as const
}
