import { useEffect, useRef } from 'react'

type MountFn = (target: HTMLElement) => () => void

export function RemoteMount({
  load,
}: {
  load: () => Promise<{ default: MountFn }>
}) {
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    let cleanup: (() => void) | undefined
    load().then((m) => {
      if (ref.current) cleanup = m.default(ref.current)
    })
    return () => cleanup?.()
  }, [load])

  return <div ref={ref} />
}
