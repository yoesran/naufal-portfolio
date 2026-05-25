<script lang="ts">
  import PartySocket from 'partysocket'

  let {
    host = '127.0.0.1:1999',
    context = 'standalone',
  }: { host?: string; context?: 'host' | 'standalone' } = $props()

  type Peer = {
    x: number
    y: number
    color: string
    name: string
    context: string
  }

  let canvas = $state<HTMLDivElement>()
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

  function handleMove(e: MouseEvent) {
    const el = canvas
    const ps = socket
    if (!el || !ps) return
    const rect = el.getBoundingClientRect()
    const x = (e.clientX - rect.left) / rect.width
    const y = (e.clientY - rect.top) / rect.height
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      if (ps.readyState === WebSocket.OPEN) {
        ps.send(JSON.stringify({ type: 'cursor', x, y, context }))
      }
    })
  }

  const count = $derived(Object.keys(peers).length)
</script>

<div
  bind:this={canvas}
  role="presentation"
  onmousemove={handleMove}
  class="border-border bg-muted/20 relative h-64 overflow-hidden rounded-lg border"
>
  {#each Object.entries(peers) as [id, p] (id)}
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
  {/each}
</div>

<div class="text-muted-foreground mt-3 font-mono text-xs">
  {count === 0
    ? 'no one else here — open a second tab'
    : `${count} other ${count === 1 ? 'cursor' : 'cursors'} live`}
</div>
