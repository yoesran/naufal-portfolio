import { useEffect, useRef, useState } from 'react'

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
  onStatusChange,
  opts,
}: {
  load: () => Promise<{ default: MountFn }>
  fallback?: React.ReactNode
  onStatusChange?: (status: RemoteStatus) => void
  opts?: Record<string, unknown>
}) {
  const ref = useRef<HTMLDivElement>(null)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    let cancelled = false
    const started = performance.now()
    onStatusChange?.({ state: 'loading' })

    load()
      .then((m) => {
        if (cancelled || !ref.current) return
        cleanup = m.default(ref.current, opts)
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
  }, [load, onStatusChange, opts])

  if (failed && fallback) return <>{fallback}</>
  return <div ref={ref} />
}
