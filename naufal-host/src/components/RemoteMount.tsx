import { useEffect, useRef, useState } from 'react'

import { useInView } from '@/lib/useInView'

type MountFn = (
  target: HTMLElement,
  opts?: Record<string, unknown>
) => () => void

export type RemoteStatus =
  | { state: 'loading' }
  | { state: 'loaded'; ms: number }
  | { state: 'error'; error: unknown }

export function RemoteMount({
  load,
  fallback,
  loadingFallback,
  onStatusChange,
  opts,
}: {
  load: () => Promise<{ default: MountFn }>
  fallback?: React.ReactNode
  loadingFallback?: React.ReactNode
  onStatusChange?: (status: RemoteStatus) => void
  opts?: Record<string, unknown>
}) {
  const [outerRef, inView] = useInView<HTMLDivElement>()
  const mountRef = useRef<HTMLDivElement>(null)
  const [loaded, setLoaded] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    if (!inView) return

    let cleanup: (() => void) | undefined
    let cancelled = false
    const started = performance.now()
    onStatusChange?.({ state: 'loading' })

    load()
      .then((m) => {
        if (cancelled || !mountRef.current) return
        cleanup = m.default(mountRef.current, opts)
        setLoaded(true)
        onStatusChange?.({
          state: 'loaded',
          ms: Math.round(performance.now() - started),
        })
      })
      .catch((error) => {
        if (cancelled) return
        setFailed(true)
        onStatusChange?.({ state: 'error', error })
      })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [inView, load, onStatusChange, opts])

  if (failed && fallback) return <div ref={outerRef}>{fallback}</div>
  return (
    <div ref={outerRef}>
      {!loaded && loadingFallback}
      <div
        ref={mountRef}
        className={loadingFallback && !loaded ? 'hidden' : undefined}
      />
    </div>
  )
}
