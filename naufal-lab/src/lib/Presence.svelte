<script lang="ts">
  import '../app.css'

  import PartySocket from 'partysocket'

  import { t } from '$lib/i18n'

  let {
    host = '127.0.0.1:1999',
    context = 'standalone',
  }: {
    host?: string
    context?: 'host' | 'standalone'
  } = $props()

  type Peer = {
    x: number
    y: number
    color: string
    name: string
    context: string
    t: number // last-seen, for the stale sweep below
  }

  // A peer is evicted if no cursor message arrives within the TTL and its
  // `leave` never came (lost message, unclean drop the server hasn't noticed).
  // Self-healing: a still-connected peer reappears on its next move.
  const PEER_TTL_MS = 5 * 60_000
  const SWEEP_MS = 60_000

  let peers = $state<Record<string, Peer>>({})
  // Own identity, from the server's `welcome` (it assigns a colour + name per
  // connection). Shown in the count pill so a solo visitor still sees the
  // presence system did something — they have a cursor identity peers will see.
  let self = $state<{ color: string; name: string } | undefined>()
  // Own cursor position (same normalized coords we broadcast) — a name tag is
  // rendered at it, so the visitor sees their own labelled cursor exactly the
  // way peers see it. Unset until the first mousemove (touch devices never set
  // it; they have no cursor to label).
  let selfPos = $state<{ x: number; y: number } | undefined>()
  // Connection status drives the pill. PartySocket retries forever on its own,
  // so early attempts show "connecting…"; once the failures look persistent we
  // surface a refresh hint instead. The retry loop keeps running regardless —
  // if it eventually succeeds, `open` flips the pill back to live.
  const MAX_SILENT_RETRIES = 3
  let status = $state<'connecting' | 'open' | 'down'>('connecting')
  let failures = 0
  let socket: PartySocket | undefined
  let frame = 0

  $effect(() => {
    const ps = new PartySocket({ host, room: 'cursors' })
    socket = ps
    status = 'connecting'
    failures = 0

    // Fires on every (re)connect, not just the first — PartySocket reconnects
    // after a drop/redeploy, and the room state didn't survive on the other
    // side, so clear ghosts from the previous connection.
    ps.addEventListener('open', () => {
      failures = 0
      status = 'open'
      peers = {}
    })

    // Track failures on BOTH events: an established connection dropping fires
    // `close`, but a refused/timed-out *reconnect attempt* fires only `error`
    // (verified by killing the local party server — close fired once, then the
    // retries errored without closing, so a close-only counter never reached
    // the threshold). Peers are cleared because we can no longer know who's
    // there; they re-announce on their next move after a reconnect anyway.
    const onAttemptFailed = () => {
      failures++
      status = failures > MAX_SILENT_RETRIES ? 'down' : 'connecting'
      peers = {}
    }
    ps.addEventListener('close', onAttemptFailed)
    ps.addEventListener('error', onAttemptFailed)

    ps.addEventListener('message', (e) => {
      let data
      try {
        data = JSON.parse(e.data)
      } catch {
        return
      }
      if (data.type === 'welcome') {
        self = { color: data.color, name: data.name }
      } else if (data.type === 'cursor') {
        peers = {
          ...peers,
          [data.id]: {
            x: data.x,
            y: data.y,
            color: data.color,
            name: data.name,
            context: data.context,
            t: Date.now(),
          },
        }
      } else if (data.type === 'leave') {
        const next = { ...peers }
        delete next[data.id]
        peers = next
      }
    })

    const sweep = setInterval(() => {
      const cutoff = Date.now() - PEER_TTL_MS
      if (Object.values(peers).some((p) => p.t < cutoff)) {
        peers = Object.fromEntries(
          Object.entries(peers).filter(([, p]) => p.t >= cutoff)
        )
      }
    }, SWEEP_MS)

    return () => {
      clearInterval(sweep)
      cancelAnimationFrame(frame)
      ps.close()
      socket = undefined
    }
  })

  // Send viewport-normalized (0–1) cursor coords, rAF-throttled. Peers render by
  // the same fractions inside the fixed overlay, so both ends agree.
  function send(nx: number, ny: number) {
    const ps = socket
    if (!ps) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (ps.readyState === WebSocket.OPEN) {
        ps.send(JSON.stringify({ type: 'cursor', x: nx, y: ny, context }))
      }
    })
  }

  // Presence is always a page-wide overlay (both the host's toggle and the
  // standalone page mount it this way) — track the cursor across the whole page.
  $effect(() => {
    const onMove = (e: MouseEvent) => {
      const nx = e.clientX / window.innerWidth
      const ny = e.clientY / window.innerHeight
      // Own tag is set synchronously (it must track the native cursor with no
      // lag); the broadcast stays rAF-throttled inside send().
      selfPos = { x: nx, y: ny }
      send(nx, ny)
    }
    window.addEventListener('mousemove', onMove)
    return () => window.removeEventListener('mousemove', onMove)
  })

  const count = $derived(Object.keys(peers).length)
</script>

{#snippet cursor(p: Peer)}
  <div
    class="pointer-events-none absolute"
    style="left: {p.x * 100}%; top: {p.y *
      100}%; transition: left 80ms linear, top 80ms linear;"
  >
    <svg width="18" height="18" viewBox="0 0 16 18" fill="none">
      <path
        d="M0 0 L0 16 L4.5 12 L7 18 L9.5 17 L7 11 L13 11 Z"
        fill={p.color}
        stroke="white"
        stroke-width="1"
        stroke-linejoin="round"
      />
    </svg>
    <span
      class="absolute top-3.5 left-3 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white"
      style="background-color: {p.color};"
    >
      <!-- Separator space between nodes, not at the span's start — Svelte trims
           element-boundary whitespace (see the self tag below). -->
      {p.name}
      <span class="opacity-70"
        >· {p.context === 'host' ? 'host' : 'remote'}</span
      >
    </span>
  </div>
{/snippet}

<!-- Fixed, full-viewport, click-through overlay. -->
<div class="pointer-events-none fixed inset-0 z-40">
  {#each Object.entries(peers) as [id, p] (id)}
    {@render cursor(p)}
  {/each}

  <!-- Own name tag, riding the native cursor (no drawn arrow — the real pointer
       is the arrow — and no transition: it must track with zero lag). Shows the
       visitor exactly what peers see. -->
  {#if status === 'open' && self && selfPos}
    <div
      class="pointer-events-none absolute"
      style="left: {selfPos.x * 100}%; top: {selfPos.y * 100}%;"
    >
      <span
        class="absolute top-3.5 left-3 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white"
        style="background-color: {self.color};"
      >
        <!-- The separator space lives BETWEEN the text expression and the span
             (preserved), not at the start of the span's content (Svelte trims
             element-boundary whitespace, which ate the gap: "Ibis· you"). -->
        {self.name}
        <span class="opacity-70">· {$t('presence.selfTag')}</span>
      </span>
    </div>
  {/if}
  <!-- Live count pill (also softens the empty room: your own assigned identity
       shows the system is live even before anyone else joins). -->
  <div
    class="border-border bg-card/90 text-muted-foreground fixed bottom-4 left-1/2 flex max-w-[calc(100vw-2rem)] -translate-x-1/2 flex-wrap items-center justify-center gap-x-1.5 rounded-full border px-3 py-1.5 text-center font-mono text-xs shadow-sm backdrop-blur"
  >
    {#if status === 'down'}
      <span
        class="inline-block size-2 shrink-0 rounded-full bg-red-400"
        aria-hidden="true"
      ></span>
      <span>{$t('presence.error')}</span>
    {:else if status === 'connecting'}
      <span
        class="inline-block size-2 shrink-0 rounded-full bg-amber-400 motion-safe:animate-pulse"
        aria-hidden="true"
      ></span>
      <span>{$t('presence.connecting')}</span>
    {:else}
      {#if self}
        <span
          class="inline-block size-2 shrink-0 rounded-full"
          style="background-color: {self.color};"
          aria-hidden="true"
        ></span>
        <span class="whitespace-nowrap"
          >{$t('presence.self', { values: { name: self.name } })}</span
        >
        <span class="opacity-60" aria-hidden="true">·</span>
      {/if}
      <span>{$t('presence.cursors', { values: { count } })}</span>
    {/if}
  </div>
</div>
