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
    // Mouse peers have a resting position → drawn as an arrow cursor. Touch
    // peers don't (a finger lifts) → drawn as an ephemeral trail instead.
    pointer: 'mouse' | 'touch'
  }

  type TrailPoint = { x: number; y: number; t: number }
  type Burst = { key: number; x: number; y: number; color: string; t: number }
  type Particle = { dx: number; dy: number; size: number }

  // A peer is evicted if no cursor message arrives within the TTL and its
  // `leave` never came (lost message, unclean drop the server hasn't noticed).
  // Self-healing: a still-connected peer reappears on its next move.
  const PEER_TTL_MS = 5 * 60_000
  const SWEEP_MS = 60_000

  // Touch trails: points younger than the TTL form the comet line behind a
  // moving finger; pruning shortens it once the finger stops or lifts.
  const TRAIL_TTL_MS = 700
  const TRAIL_MAX_POINTS = 64
  const TRAIL_PRUNE_MS = 120
  // Tap discrimination: shorter + stiller than this is a tap (fireworks);
  // anything longer or farther is a drag/scroll (trail only).
  const TAP_MAX_MS = 300
  const TAP_MAX_PX = 12
  const BURST_LIFE_MS = 900
  // Taps/clicks on real controls shouldn't double as fireworks.
  const INTERACTIVE =
    'a,button,input,textarea,select,summary,[role="button"],[role="menuitem"],[contenteditable="true"]'

  // Honour prefers-reduced-motion: no flying particles, just the fading ring.
  // Read once, like SpringToy — it rarely flips mid-session.
  const reducedMotion =
    typeof window !== 'undefined' &&
    window.matchMedia('(prefers-reduced-motion: reduce)').matches

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
  // Touch trails, keyed by peer id ('__self' is the local finger). Colors/names
  // resolve through `peers` / `self`; the trail map holds only the points.
  let trails = $state<Record<string, TrailPoint[]>>({})
  // Live fireworks (own taps render immediately; the relay echoes to peers only).
  let bursts = $state<Burst[]>([])
  let burstKey = 0
  // Particle geometry per burst key — random once at creation, not per render.
  const particlesByKey = new Map<number, Particle[]>()
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
      trails = {}
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
      trails = {}
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
        const pointer = data.pointer === 'touch' ? 'touch' : 'mouse'
        peers = {
          ...peers,
          [data.id]: {
            x: data.x,
            y: data.y,
            color: data.color,
            name: data.name,
            context: data.context,
            t: Date.now(),
            pointer,
          },
        }
        // A touch position is a trail point, not a resting cursor.
        if (pointer === 'touch') appendTrail(data.id, data.x, data.y)
      } else if (data.type === 'burst') {
        if (typeof data.x === 'number' && typeof data.y === 'number') {
          spawnBurst(data.x, data.y, data.color)
        }
      } else if (data.type === 'leave') {
        const next = { ...peers }
        delete next[data.id]
        peers = next
        if (trails[data.id]) {
          const nextTrails = { ...trails }
          delete nextTrails[data.id]
          trails = nextTrails
        }
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

  function appendTrail(id: string, x: number, y: number) {
    const points = trails[id] ?? []
    trails = {
      ...trails,
      [id]: [...points.slice(-(TRAIL_MAX_POINTS - 1)), { x, y, t: Date.now() }],
    }
  }

  function spawnBurst(x: number, y: number, color: string) {
    const key = burstKey++
    // 10 particles flung at random angles; geometry fixed at creation so a
    // re-render mid-animation doesn't reshuffle them.
    particlesByKey.set(
      key,
      Array.from({ length: 10 }, () => {
        const angle = Math.random() * Math.PI * 2
        const dist = 24 + Math.random() * 36
        return {
          dx: Math.cos(angle) * dist,
          dy: Math.sin(angle) * dist,
          size: 3 + Math.random() * 3,
        }
      })
    )
    bursts = [...bursts, { key, x, y, color, t: Date.now() }]
  }

  // One janitor interval for the ephemeral visuals (cleared on unmount, unlike
  // a per-burst setTimeout would be): trail points past their TTL drop — that's
  // what makes the line a comet that shrinks behind the finger instead of a
  // growing scribble — and bursts past their animation lifetime are removed.
  $effect(() => {
    const prune = setInterval(() => {
      const now = Date.now()
      const cutoff = now - TRAIL_TTL_MS
      let changed = false
      const next: Record<string, TrailPoint[]> = {}
      for (const [id, points] of Object.entries(trails)) {
        const kept = points.filter((p) => p.t >= cutoff)
        if (kept.length !== points.length) changed = true
        if (kept.length > 0) next[id] = kept
      }
      if (changed) trails = next

      if (bursts.some((b) => now - b.t >= BURST_LIFE_MS)) {
        for (const b of bursts) {
          if (now - b.t >= BURST_LIFE_MS) particlesByKey.delete(b.key)
        }
        bursts = bursts.filter((b) => now - b.t < BURST_LIFE_MS)
      }
    }, TRAIL_PRUNE_MS)
    return () => clearInterval(prune)
  })

  // Send viewport-normalized (0–1) cursor coords, rAF-throttled. Peers render by
  // the same fractions inside the fixed overlay, so both ends agree. `pointer`
  // tells peers how to draw this position: arrow (mouse) or trail (touch).
  function send(nx: number, ny: number, pointer: 'mouse' | 'touch' = 'mouse') {
    const ps = socket
    if (!ps) return
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (ps.readyState === WebSocket.OPEN) {
        ps.send(
          JSON.stringify({ type: 'cursor', x: nx, y: ny, context, pointer })
        )
      }
    })
  }

  function doBurst(x: number, y: number) {
    // Own fireworks render immediately (the relay echoes to everyone *else*).
    spawnBurst(x, y, self?.color ?? '#888')
    if (socket && socket.readyState === WebSocket.OPEN) {
      socket.send(JSON.stringify({ type: 'burst', x, y }))
    }
  }

  // Timestamp of the last touch interaction — used to swallow the synthetic
  // mousemove/click that browsers fire after a tap, which would otherwise
  // briefly paint a phone visitor as an arrow cursor / double-fire the burst.
  let lastTouchT = 0

  // Presence is always a page-wide overlay (both the host's toggle and the
  // standalone page mount it this way) — track the cursor across the whole page.
  $effect(() => {
    const onMove = (e: MouseEvent) => {
      if (Date.now() - lastTouchT < 600) return // synthetic, from a tap
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

  // Touch: a moving finger draws a trail (broadcast as touch-pointer cursor
  // messages); a quick, still tap fires fireworks. All listeners are passive —
  // scrolling stays native, and a scroll-promoted touchcancel (gotchas #15)
  // simply ends the gesture without a burst.
  $effect(() => {
    let touchId: number | null = null
    let startX = 0
    let startY = 0
    let startT = 0
    let dragged = false
    let startedOnControl = false

    const norm = (t: Touch) => ({
      x: t.clientX / window.innerWidth,
      y: t.clientY / window.innerHeight,
    })
    const find = (list: TouchList) => {
      for (let i = 0; i < list.length; i++) {
        if (list[i].identifier === touchId) return list[i]
      }
      return null
    }

    const onStart = (e: TouchEvent) => {
      lastTouchT = Date.now()
      if (touchId !== null) return // track the first finger only
      const t = e.changedTouches[0]
      if (!t) return
      touchId = t.identifier
      startX = t.clientX
      startY = t.clientY
      startT = Date.now()
      dragged = false
      startedOnControl = !!(e.target as HTMLElement | null)?.closest(
        INTERACTIVE
      )
    }
    const onMove = (e: TouchEvent) => {
      lastTouchT = Date.now()
      const t = find(e.touches)
      if (!t) return
      if (Math.hypot(t.clientX - startX, t.clientY - startY) > TAP_MAX_PX) {
        dragged = true
      }
      if (dragged) {
        const { x, y } = norm(t)
        appendTrail('__self', x, y)
        send(x, y, 'touch')
      }
    }
    const onEnd = (e: TouchEvent) => {
      lastTouchT = Date.now()
      const t = find(e.changedTouches)
      if (!t) return
      touchId = null
      if (!dragged && Date.now() - startT < TAP_MAX_MS && !startedOnControl) {
        const { x, y } = norm(t)
        doBurst(x, y)
      }
    }
    const onCancel = (e: TouchEvent) => {
      // Scroll/zoom promotion or OS interrupt: end the gesture, never a burst.
      if (find(e.changedTouches)) touchId = null
    }

    window.addEventListener('touchstart', onStart, { passive: true })
    window.addEventListener('touchmove', onMove, { passive: true })
    window.addEventListener('touchend', onEnd, { passive: true })
    window.addEventListener('touchcancel', onCancel, { passive: true })
    return () => {
      window.removeEventListener('touchstart', onStart)
      window.removeEventListener('touchmove', onMove)
      window.removeEventListener('touchend', onEnd)
      window.removeEventListener('touchcancel', onCancel)
    }
  })

  // Desktop parity: a mouse click on inert page area fires the same fireworks.
  // Clicks on real controls are excluded, and the synthetic click that follows
  // a touch tap is swallowed via lastTouchT (the touch path already burst).
  $effect(() => {
    const onClick = (e: MouseEvent) => {
      if (Date.now() - lastTouchT < 600) return
      if ((e.target as HTMLElement | null)?.closest(INTERACTIVE)) return
      doBurst(e.clientX / window.innerWidth, e.clientY / window.innerHeight)
    }
    window.addEventListener('click', onClick)
    return () => window.removeEventListener('click', onClick)
  })

  const count = $derived(Object.keys(peers).length)
</script>

{#snippet nameTag(color: string, label: string, sub: string)}
  <span
    class="absolute top-3.5 left-3 rounded px-1.5 py-0.5 text-[10px] font-medium whitespace-nowrap text-white"
    style="background-color: {color};"
  >
    <!-- Separator space between nodes, not at the span's start — Svelte trims
         element-boundary whitespace (it ate the gap here once: "Ibis· you"). -->
    {label}
    <span class="opacity-70">· {sub}</span>
  </span>
{/snippet}

{#snippet cursor(p: Peer)}
  <div
    class="pointer-events-none absolute"
    style="left: {p.x * 100}%; top: {p.y *
      100}%; transition: left 80ms linear, top 80ms linear;"
  >
    <!-- Touch peers have no resting pointer — their position is the fingertip,
         marked by the trail + tag only (no arrow, which would imply a cursor). -->
    {#if p.pointer !== 'touch'}
      <svg width="18" height="18" viewBox="0 0 16 18" fill="none">
        <path
          d="M0 0 L0 16 L4.5 12 L7 18 L9.5 17 L7 11 L13 11 Z"
          fill={p.color}
          stroke="white"
          stroke-width="1"
          stroke-linejoin="round"
        />
      </svg>
    {/if}
    {@render nameTag(p.color, p.name, p.context === 'host' ? 'host' : 'remote')}
  </div>
{/snippet}

<!-- Fixed, full-viewport, click-through overlay. -->
<div class="pointer-events-none fixed inset-0 z-40">
  <!-- Touch trails: comet lines behind moving fingers ('__self' is the local
       one). viewBox 0–100 + non-scaling-stroke keeps the normalized coords
       simple and the line width constant. -->
  {#if Object.keys(trails).length > 0}
    <svg
      class="absolute inset-0 h-full w-full"
      viewBox="0 0 100 100"
      preserveAspectRatio="none"
      aria-hidden="true"
    >
      {#each Object.entries(trails) as [id, points] (id)}
        {#if points.length > 1}
          <polyline
            points={points.map((p) => `${p.x * 100},${p.y * 100}`).join(' ')}
            fill="none"
            stroke={id === '__self'
              ? (self?.color ?? '#888')
              : (peers[id]?.color ?? '#888')}
            stroke-width="3"
            stroke-opacity="0.55"
            stroke-linecap="round"
            stroke-linejoin="round"
            vector-effect="non-scaling-stroke"
          />
        {/if}
      {/each}
    </svg>
  {/if}

  <!-- Fireworks: tap/click bursts in the sender's color. Particle geometry is
       fixed per burst (see spawnBurst); reduced motion keeps only the ring. -->
  {#each bursts as b (b.key)}
    <div
      class="pointer-events-none absolute"
      style="left: {b.x * 100}%; top: {b.y * 100}%;"
    >
      <span class="pp-ring" style="border-color: {b.color};"></span>
      {#if !reducedMotion}
        {#each particlesByKey.get(b.key) ?? [] as p, i (i)}
          <span
            class="pp-particle"
            style="--dx: {p.dx}px; --dy: {p.dy}px; width: {p.size}px; height: {p.size}px; background-color: {b.color};"
          ></span>
        {/each}
      {/if}
    </div>
  {/each}

  {#each Object.entries(peers) as [id, p] (id)}
    {#if p.pointer !== 'touch' || trails[id]?.length}
      {@render cursor(p)}
    {/if}
  {/each}

  <!-- Own name tag (no drawn arrow — the native pointer/finger is the arrow,
       and no transition: it must track with zero lag). Rides the fingertip
       while a touch trail is active (mousemove is suppressed around touches,
       so selfPos would be stale then), the mouse position otherwise. Shows the
       visitor exactly what peers see. -->
  {#if status === 'open' && self}
    {@const tip = trails.__self?.length
      ? trails.__self[trails.__self.length - 1]
      : selfPos}
    {#if tip}
      <div
        class="pointer-events-none absolute"
        style="left: {tip.x * 100}%; top: {tip.y * 100}%;"
      >
        {@render nameTag(self.color, self.name, $t('presence.selfTag'))}
      </div>
    {/if}
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

<style>
  /* Fireworks. Scoped styles ship inside the federated chunk like the rest of
     the component, so the host needs nothing. Ring + particles both end fully
     transparent and the burst entry is removed after BURST_LIFE_MS. */
  .pp-ring {
    position: absolute;
    left: -10px;
    top: -10px;
    width: 20px;
    height: 20px;
    border: 2px solid;
    border-radius: 9999px;
    animation: pp-ring 600ms ease-out forwards;
  }
  @keyframes pp-ring {
    from {
      transform: scale(0.3);
      opacity: 0.9;
    }
    to {
      transform: scale(2.2);
      opacity: 0;
    }
  }
  /* Reduced motion: the ring stays put and only fades (opacity is fine; the
     flying particles are skipped in markup). */
  @media (prefers-reduced-motion: reduce) {
    .pp-ring {
      animation: pp-ring-fade 600ms ease-out forwards;
    }
    @keyframes pp-ring-fade {
      from {
        opacity: 0.9;
      }
      to {
        opacity: 0;
      }
    }
  }
  .pp-particle {
    position: absolute;
    left: 0;
    top: 0;
    border-radius: 9999px;
    animation: pp-particle 700ms cubic-bezier(0.1, 0.6, 0.3, 1) forwards;
  }
  @keyframes pp-particle {
    from {
      transform: translate(-50%, -50%);
      opacity: 1;
    }
    to {
      /* Slight downward pull so it reads as fireworks, not a sunburst. */
      transform: translate(calc(var(--dx) - 50%), calc(var(--dy) - 50% + 8px))
        scale(0.3);
      opacity: 0;
    }
  }
</style>
