import { useCallback, useLayoutEffect, useRef, useState } from 'react'

import { loadRemote } from '@module-federation/runtime'

import { Cell } from '@/components/Cell'
import { RemoteMount, type RemoteStatus } from '@/components/RemoteMount'
import { Button } from '@/components/ui/button'
import { cn } from '@/lib/utils'

const LAB_URL = import.meta.env.VITE_LAB_URL ?? 'http://127.0.0.1:5174'
const REMOTE_OPTS = { context: 'host' }

export function MicrofrontendBlock() {
  const [status, setStatus] = useState<RemoteStatus>({ state: 'loading' })
  const [offline, setOffline] = useState(false)
  const wrapperRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  const load = useCallback<() => Promise<typeof import('lab/Counter')>>(
    () =>
      offline
        ? Promise.reject(new Error('Simulated offline'))
        : (loadRemote('lab/Counter') as Promise<typeof import('lab/Counter')>),
    [offline]
  )

  useLayoutEffect(() => {
    const outer = wrapperRef.current
    const inner = panelRef.current
    if (!outer || !inner) return
    const update = () => {
      outer.style.height = `${inner.offsetHeight}px`
    }
    update()
    const ro = new ResizeObserver(update)
    ro.observe(inner)
    return () => ro.disconnect()
  }, [])

  const connected = status.state === 'loaded'

  return (
    <Cell label="// microfrontend-meta · React host ⇄ Svelte remote">
      <p className="text-muted-foreground text-sm leading-relaxed">
        This whole page is{' '}
        <span className="text-foreground font-medium">React</span>. The box
        below is a separate{' '}
        <span className="text-foreground font-medium">Svelte</span> app —
        compiled and served on its own — fetched over the network the moment it
        scrolled into view. That's Module Federation.
      </p>

      <div className="mt-5 flex items-stretch gap-1">
        <Node name="host" tech="React · :5173" active />
        <Arrow label="lab/Counter" lit={connected} />
        <Node name="lab" tech="Svelte · :5174" active={connected} />
      </div>

      <div className="border-border/70 mt-5 rounded-lg border border-dashed p-4">
        <div className="mb-3 flex items-center justify-between gap-3">
          <span className="text-muted-foreground font-mono text-[10px] tracking-wider uppercase">
            live svelte remote ↓
          </span>
          <a
            href={LAB_URL}
            target="_blank"
            rel="noreferrer"
            className="text-muted-foreground hover:text-foreground font-mono text-[10px] transition-colors"
          >
            open standalone ↗
          </a>
        </div>
        <div
          ref={wrapperRef}
          className="overflow-hidden transition-[height] duration-200 ease-out"
        >
          <div ref={panelRef}>
            <RemoteMount
              key={offline ? 'offline' : 'online'}
              load={load}
              opts={REMOTE_OPTS}
              onStatusChange={setStatus}
              fallback={<RemoteOffline simulated={offline} />}
              loadingFallback={<CounterSkeleton />}
            />
          </div>
        </div>
      </div>

      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <StatusStrip status={status} />
        {(offline || status.state !== 'error') && (
          <Button
            variant="outline"
            size="sm"
            className="self-start sm:self-auto"
            onClick={() => setOffline((v) => !v)}
          >
            {offline ? 'Reconnect remote' : 'Simulate offline'}
          </Button>
        )}
      </div>
    </Cell>
  )
}

function Node({
  name,
  tech,
  active,
}: {
  name: string
  tech: string
  active?: boolean
}) {
  return (
    <div
      className={cn(
        'flex-1 rounded-lg border px-3 py-2 transition-colors duration-500',
        active
          ? 'border-emerald-500/40 bg-emerald-500/5'
          : 'border-border bg-muted/30'
      )}
    >
      <div className="text-foreground font-mono text-sm">{name}</div>
      <div className="text-muted-foreground font-mono text-xs">{tech}</div>
    </div>
  )
}

function Arrow({ label, lit }: { label: string; lit?: boolean }) {
  return (
    <div className="flex flex-col items-center justify-center px-2">
      <span className="text-muted-foreground font-mono text-[10px]">
        {label}
      </span>
      <span
        className={cn(
          'text-lg leading-none transition-colors duration-500',
          lit ? 'text-emerald-400' : 'text-muted-foreground/40'
        )}
      >
        →
      </span>
    </div>
  )
}

function StatusStrip({ status }: { status: RemoteStatus }) {
  let dot = 'bg-amber-400'
  let label = 'connecting…'
  let detail = 'fetching remoteEntry.js'
  let pulse = true

  if (status.state === 'loaded') {
    dot = 'bg-emerald-400'
    label = 'connected'
    detail = `remoteEntry.js · loaded in ${status.ms}ms`
    pulse = false
  } else if (status.state === 'error') {
    dot = 'bg-red-400'
    label = 'remote offline'
    detail = 'fallback rendered · host still up'
    pulse = false
  }

  return (
    <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          dot,
          pulse && 'motion-safe:animate-pulse'
        )}
      />
      <span className="text-foreground">{label}</span>
      <span className="text-muted-foreground/50">·</span>
      <span>{detail}</span>
    </div>
  )
}

function Skeleton({ className }: { className?: string }) {
  return <div className={cn('bg-muted animate-pulse rounded-md', className)} />
}

function CounterSkeleton() {
  return (
    <div className="border-border/40 rounded-lg border-2 border-dashed p-4">
      <div className="mb-2 flex items-center gap-2">
        <Skeleton className="size-2 rounded-full" />
        <Skeleton className="h-3 w-44" />
      </div>
      <div className="mb-3 space-y-2">
        <Skeleton className="h-3 w-full" />
        <Skeleton className="h-3 w-3/4" />
      </div>
      <Skeleton className="h-9 w-28 rounded-4xl" />
    </div>
  )
}

function RemoteOffline({ simulated }: { simulated?: boolean }) {
  return (
    <div className="text-muted-foreground rounded-md border border-dashed border-red-400/40 bg-red-400/5 px-3 py-4 text-sm">
      <p className="text-foreground font-mono text-xs">
        {simulated ? 'remote offline (simulated)' : 'remote not reachable'}
      </p>
      <p className="mt-1 leading-relaxed">
        {simulated ? (
          'This is the fallback a visitor sees when a remote is unavailable. The host stays fully interactive — only this block degrades.'
        ) : (
          <>
            The Svelte remote (naufal-lab) isn't running. In dev, start it with{' '}
            <code className="text-foreground font-mono">npm run dev:mf</code>{' '}
            inside{' '}
            <code className="text-foreground font-mono">naufal-lab/</code>.
          </>
        )}
      </p>
    </div>
  )
}
