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

  // The mount must happen exactly once, when the block scrolls into view — not
  // again on every parent re-render. But `load`/`opts`/`onStatusChange` are
  // typically passed as inline literals (`load={() => loadRemote(...)}`,
  // `opts={{ context: 'host' }}`), so their identity changes each render. Listing
  // them as effect deps would re-run the effect (and re-mount the remote) on any
  // render — and since the effect itself calls setState via `onStatusChange`,
  // that's a render loop. (The React Compiler happens to memoize those literals
  // away today, but we don't want correctness to depend on that.) So we keep the
  // latest values in refs and gate the effect on `inView` alone.
  const loadRef = useRef(load)
  const optsRef = useRef(opts)
  const onStatusChangeRef = useRef(onStatusChange)
  // Keep the refs pointing at the latest props (synced in an effect, not during
  // render, per the rules of refs). No dep array: a cheap assignment every commit
  // — and it runs before the mount effect below on the render where `inView`
  // flips, so that effect always reads current values.
  useEffect(() => {
    loadRef.current = load
    optsRef.current = opts
    onStatusChangeRef.current = onStatusChange
  })

  useEffect(() => {
    if (!inView) return

    let cleanup: (() => void) | undefined
    let cancelled = false
    const started = performance.now()
    onStatusChangeRef.current?.({ state: 'loading' })

    loadRef
      .current()
      .then((m) => {
        if (cancelled || !mountRef.current) return
        cleanup = m.default(mountRef.current, optsRef.current)
        setLoaded(true)
        onStatusChangeRef.current?.({
          state: 'loaded',
          ms: Math.round(performance.now() - started),
        })
      })
      .catch((error) => {
        if (cancelled) return
        setFailed(true)
        onStatusChangeRef.current?.({ state: 'error', error })
      })

    return () => {
      cancelled = true
      cleanup?.()
    }
  }, [inView])

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
