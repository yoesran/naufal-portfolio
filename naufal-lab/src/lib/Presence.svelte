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
  }

  let peers = $state<Record<string, Peer>>({})
  let socket: PartySocket | undefined
  let frame = 0

  $effect(() => {
    const ps = new PartySocket({ host, room: 'cursors' })
    socket = ps

    ps.addEventListener('message', (e) => {
      const data = JSON.parse(e.data)
      if (data.type === 'cursor') {
        peers = {
          ...peers,
          [data.id]: {
            x: data.x,
            y: data.y,
            color: data.color,
            name: data.name,
            context: data.context,
          },
        }
      } else if (data.type === 'leave') {
        const next = { ...peers }
        delete next[data.id]
        peers = next
      }
    })

    return () => {
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
    const onMove = (e: MouseEvent) =>
      send(e.clientX / window.innerWidth, e.clientY / window.innerHeight)
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
      {p.name}<span class="opacity-70">
        · {p.context === 'host' ? 'host' : 'remote'}</span
      >
    </span>
  </div>
{/snippet}

<!-- Fixed, full-viewport, click-through overlay. -->
<div class="pointer-events-none fixed inset-0 z-40">
  {#each Object.entries(peers) as [id, p] (id)}
    {@render cursor(p)}
  {/each}
  <!-- Live count pill (also softens the empty room with a hint). -->
  <div
    class="border-border bg-card/90 text-muted-foreground fixed bottom-4 left-1/2 -translate-x-1/2 rounded-full border px-3 py-1.5 font-mono text-xs shadow-sm backdrop-blur"
  >
    {$t('presence.cursors', { values: { count } })}
  </div>
</div>
