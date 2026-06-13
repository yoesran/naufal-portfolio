import { useRef, useState } from 'react'
import { Trans, useTranslation } from 'react-i18next'

import { loadRemote, registerRemotes } from '@module-federation/runtime'
import { Play, RotateCcw, User } from 'lucide-react'

import mfSvg from '@/assets/tech-stacks/module-federation.svg?raw'
import reactSvg from '@/assets/tech-stacks/react.svg?raw'
import svelteSvg from '@/assets/tech-stacks/svelte.svg?raw'
import { Cell } from '@/components/Cell'
import { RemoteMount, type RemoteStatus } from '@/components/RemoteMount'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { useMeasuredHeight } from '@/lib/useMeasuredHeight'
import { cn } from '@/lib/utils'

// A floor on how long the "fetch" reads as in-flight. A federated remoteEntry.js
// over the real network takes a beat, but locally (or warm HTTP cache) it can
// resolve in single-digit ms — which made Run/Reconnect snap with no visible
// handshake. This paces the packet animation + reveal without faking the result;
// the displayed ms is still the *real* loadRemote time.
const MIN_FETCH_MS = 750
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))

const LAB_URL = import.meta.env.VITE_LAB_URL ?? 'http://127.0.0.1:5174'
// The page's own origin — truthful in every environment (dev, prod, future
// custom domain), unlike a hardcoded deploy hostname next to the env-derived
// labHost below.
const hostHost = window.location.host
const labHost = (() => {
  try {
    return new URL(LAB_URL).host
  } catch {
    return LAB_URL
  }
})()

// The federation flow as a triggerable diagram: you → React host → Svelte
// remote. Clicking Run fires the *real* loadRemote('lab/SpringToy'); the packets
// animate while it's genuinely in flight, the links resolve green/red on the
// real result, and on success the actual Svelte component mounts below (where you
// can drag it into React). The animation is presentation; the load is real.
export function LiveRemoteBlock() {
  const { t } = useTranslation()
  const [started, setStarted] = useState(false)
  const [offline, setOffline] = useState(false)
  const [status, setStatus] = useState<RemoteStatus>({ state: 'loading' })
  const [nonce, setNonce] = useState(0)
  // Real loadRemote duration (excludes the MIN_FETCH_MS floor), shown on success.
  const [realMs, setRealMs] = useState(0)

  const loading = started && status.state === 'loading'
  const done = started && status.state === 'loaded'
  const failed = started && status.state === 'error'
  // A real failure (remote actually unreachable), as opposed to the simulated
  // one. The controls differ: real failure offers Retry (re-fire the real
  // load); simulated failure offers Reconnect (turn the simulation off) — and
  // "Break the connection" is hidden when there's no live connection to break.
  const realFailed = failed && !offline

  // Animate the reveal open/closed by measuring its content height and
  // transitioning `height` — collapsed while still loading so the diagram stays
  // the focus. Shared measurement engine with the other blocks' panels.
  const [panelRef, revealHeight] = useMeasuredHeight<HTMLDivElement>()

  // Retrying a real failure needs more than re-running loadRemote: the remote
  // is `type: 'module'`, so its entry is fetched with a native import(), and
  // browsers cache a FAILED module import by URL for the page's lifetime — the
  // retry rejects instantly with the cached error, no network (verified: zero
  // requests on Retry). Fix: re-register the remote (force clears the MF
  // runtime's own entry/module caches) under a cache-busted entry URL, which
  // the browser treats as a brand-new module. Harmless to caching semantics —
  // remoteEntry.js is served no-store anyway (see docs/deployment.md).
  // run() arms this when retrying from a real failure.
  const retryResetRef = useRef(false)

  const load = (): Promise<typeof import('lab/SpringToy')> => {
    if (offline)
      return sleep(MIN_FETCH_MS).then(() =>
        Promise.reject(new Error('Simulated offline'))
      )
    if (retryResetRef.current) {
      retryResetRef.current = false
      registerRemotes(
        [
          {
            name: 'lab',
            type: 'module',
            entry: `${LAB_URL}/remoteEntry.js?retry=${Date.now()}`,
          },
        ],
        { force: true }
      )
    }
    const t0 = performance.now()
    const mod = (
      loadRemote('lab/SpringToy') as Promise<typeof import('lab/SpringToy')>
    ).then((m) => {
      setRealMs(Math.round(performance.now() - t0))
      return m
    })
    return Promise.all([mod, sleep(MIN_FETCH_MS)]).then(([m]) => m)
  }

  function run() {
    // Retrying after a real failure: arm the cache reset (see retryResetRef).
    if (realFailed) retryResetRef.current = true
    setStarted(true)
    setNonce((n) => n + 1)
  }
  function toggleOffline() {
    setOffline((v) => !v)
    if (started) setNonce((n) => n + 1)
  }

  return (
    <Cell
      id="live-remote"
      label="// live-remote · a Svelte app running inside React"
    >
      <p className="text-muted-foreground text-sm leading-relaxed">
        <Trans
          t={t}
          i18nKey="liveRemote.description"
          components={{
            react: <span className="text-foreground font-medium" />,
            svelte: <span className="text-foreground font-medium" />,
          }}
        />
      </p>

      {/* Diagram: you → React host → Svelte remote. Top-aligned so the connectors
          line up with the icon centres regardless of label height (labels hang
          below; sub-URLs hide on phones to keep the connectors from collapsing). */}
      <div className="border-border/60 bg-muted/20 mt-5 flex items-start gap-1 rounded-lg border border-dashed p-4 sm:gap-2">
        <DiagramNode
          name={t('liveRemote.nodes.you')}
          icon={<User className="size-5" />}
          active={started}
        />
        <Link
          label=""
          loading={loading}
          done={done || loading}
          failed={false}
        />
        <DiagramNode
          name={t('liveRemote.nodes.host')}
          sub={hostHost}
          glyph={reactSvg}
          badge={mfSvg}
          color="#61DAFB"
          active={started}
        />
        <Link
          label="remoteEntry.js"
          loading={loading}
          done={done}
          failed={failed}
        />
        <DiagramNode
          name={t('liveRemote.nodes.remote')}
          sub={labHost}
          glyph={svelteSvg}
          color="#FF3E00"
          active={done}
          dim={!done}
        />
      </div>

      {/* Status line */}
      <div className="mt-3 flex min-h-5 items-center justify-between gap-3 font-mono text-xs">
        <StatusDot started={started} status={status} />
        {done && (
          <span className="text-muted-foreground">
            {t('liveRemote.loadedIn', { ms: realMs })}
          </span>
        )}
      </div>

      {/* Reveal: the real mounted component (or fallback) — collapsed until the
          load resolves so the diagram stays the focus while it's in flight. */}
      <div
        className="overflow-hidden transition-[height] duration-300 ease-out"
        style={{ height: done || failed ? (revealHeight ?? 0) : 0 }}
      >
        <div ref={panelRef} className="pt-4">
          <div className="border-border/70 rounded-lg border border-dashed p-4">
            {started && (
              <RemoteMount
                key={`${offline ? 'offline' : 'online'}-${nonce}`}
                eager
                load={load}
                opts={{ context: 'host' }}
                onStatusChange={setStatus}
                fallback={<RemoteOffline simulated={offline} />}
              />
            )}
          </div>
        </div>
      </div>

      {/* Controls */}
      <div className="mt-4 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <a
          href={LAB_URL}
          target="_blank"
          rel="noreferrer"
          className="text-muted-foreground hover:text-foreground font-mono text-[10px] transition-colors"
        >
          {t('liveRemote.openStandalone')}
        </a>
        <div className="flex flex-wrap gap-2">
          {!started || done || realFailed ? (
            <Button
              variant="outline"
              size="sm"
              onClick={run}
              disabled={loading}
            >
              {started ? (
                <RotateCcw className="size-3.5" />
              ) : (
                <Play className="size-3.5" />
              )}
              {!started
                ? t('liveRemote.actions.run')
                : realFailed
                  ? t('liveRemote.actions.retry')
                  : t('liveRemote.actions.replay')}
            </Button>
          ) : null}
          {started && !realFailed && (
            <Button variant="ghost" size="sm" onClick={toggleOffline}>
              {offline
                ? t('liveRemote.actions.reconnect')
                : t('liveRemote.actions.simulateOffline')}
            </Button>
          )}
        </div>
      </div>
    </Cell>
  )
}

function DiagramNode({
  name,
  sub,
  icon,
  glyph,
  badge,
  color,
  active,
  dim,
}: {
  name: string
  sub?: string
  icon?: React.ReactNode
  glyph?: string
  badge?: string
  color?: string
  active?: boolean
  dim?: boolean
}) {
  return (
    <div
      className={cn(
        'flex flex-col items-center gap-1.5 text-center',
        dim && 'opacity-50'
      )}
    >
      <div
        className={cn(
          'bg-card relative flex size-12 items-center justify-center rounded-full border transition-colors duration-300',
          active ? 'border-brand/50' : 'border-border'
        )}
      >
        {icon ? (
          <span className="text-foreground">{icon}</span>
        ) : (
          <span
            aria-hidden="true"
            className="[&_path]:fill-current [&_path]:stroke-current [&_svg]:size-6"
            style={{ color: color ?? 'var(--foreground)' }}
            dangerouslySetInnerHTML={{ __html: glyph ?? '' }}
          />
        )}
        {badge && (
          <span
            aria-hidden="true"
            className="bg-card absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border [&_svg]:size-3.5"
            dangerouslySetInnerHTML={{ __html: badge }}
          />
        )}
      </div>
      <div className="leading-tight">
        <div className="text-foreground font-mono text-[11px]">{name}</div>
        {sub && (
          <div className="text-muted-foreground/70 hidden font-mono text-[9px] sm:block">
            {sub}
          </div>
        )}
      </div>
    </div>
  )
}

function Link({
  label,
  loading,
  done,
  failed,
}: {
  label: string
  loading: boolean
  done: boolean
  failed: boolean
}) {
  return (
    <div className="relative mt-6 h-px flex-1">
      {label && (
        <span className="text-muted-foreground/60 absolute -top-4 left-1/2 hidden -translate-x-1/2 font-mono text-[9px] whitespace-nowrap sm:block">
          {label}
        </span>
      )}
      <div
        className={cn(
          'h-px w-full transition-colors duration-300',
          failed ? 'bg-red-400/60' : done ? 'bg-emerald-400/60' : 'bg-border'
        )}
      />
      {loading && (
        <span className="absolute top-1/2 size-1.5 -translate-y-1/2 rounded-full bg-amber-400 motion-safe:animate-[mf-packet_0.7s_linear_infinite]" />
      )}
    </div>
  )
}

function StatusDot({
  started,
  status,
}: {
  started: boolean
  status: RemoteStatus
}) {
  const { t } = useTranslation()
  if (!started) {
    return (
      <span className="text-muted-foreground/60">
        {t('liveRemote.status.idle')}
      </span>
    )
  }
  let dot = 'bg-amber-400'
  let label = t('liveRemote.status.connecting')
  let pulse = true
  if (status.state === 'loaded') {
    dot = 'bg-emerald-400'
    label = t('liveRemote.status.live')
    pulse = false
  } else if (status.state === 'error') {
    dot = 'bg-red-400'
    label = t('liveRemote.status.offline')
    pulse = false
  }
  return (
    <span className="text-muted-foreground flex items-center gap-2">
      <span
        className={cn(
          'inline-block size-2 rounded-full',
          dot,
          pulse && 'motion-safe:animate-pulse'
        )}
      />
      <span className="text-foreground">{label}</span>
    </span>
  )
}

function RemoteOffline({ simulated }: { simulated?: boolean }) {
  const { t } = useTranslation()
  return (
    <Alert className="rounded-md border-dashed border-red-400/40 bg-red-400/5">
      <AlertTitle className="text-foreground font-mono text-xs">
        {simulated
          ? t('liveRemote.offline.simulated')
          : t('liveRemote.offline.notReachable')}
      </AlertTitle>
      <AlertDescription className="leading-relaxed">
        {simulated ? (
          t('liveRemote.offline.simulatedDescription')
        ) : (
          <Trans
            t={t}
            i18nKey="liveRemote.offline.devHint"
            components={{
              code1: <code className="text-foreground font-mono" />,
              code2: <code className="text-foreground font-mono" />,
            }}
          />
        )}
      </AlertDescription>
    </Alert>
  )
}
