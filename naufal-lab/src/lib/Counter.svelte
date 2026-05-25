<script lang="ts">
  import { Button } from '$lib/components/ui/button/index.js'
  import { cn } from '$lib/utils'

  let { context = 'standalone' }: { context?: 'host' | 'standalone' } = $props()

  let root = $state<HTMLDivElement>()
  let count = $state(0)
  let x = $state(0)
  let y = $state(0)
  let active = $state(false)
  let frame = 0

  const embedded = $derived(context === 'host')
  const label = $derived(
    embedded ? 'embedded in React host' : 'standalone Svelte app'
  )
  const glowRgb = $derived(embedded ? '16 185 129' : '56 189 248')
  const accent = $derived(
    embedded
      ? {
          border: 'border-emerald-500/40',
          text: 'text-emerald-400',
          dot: 'bg-emerald-400',
        }
      : {
          border: 'border-sky-400/40',
          text: 'text-sky-400',
          dot: 'bg-sky-400',
        }
  )

  function handleMove(e: MouseEvent) {
    const el = root
    if (!el) return
    const rect = el.getBoundingClientRect()
    const nx = e.clientX - rect.left
    const ny = e.clientY - rect.top
    cancelAnimationFrame(frame)
    frame = requestAnimationFrame(() => {
      x = nx
      y = ny
    })
  }

  $effect(() => () => cancelAnimationFrame(frame))
</script>

<div
  bind:this={root}
  role="presentation"
  onmousemove={handleMove}
  onmouseenter={() => (active = true)}
  onmouseleave={() => (active = false)}
  class={cn(
    'relative overflow-hidden rounded-lg border-2 border-dashed p-4',
    accent.border
  )}
>
  <div
    aria-hidden="true"
    class={cn(
      'pointer-events-none absolute size-60 -translate-x-1/2 -translate-y-1/2 rounded-full blur-2xl transition-opacity duration-200',
      active ? 'opacity-100' : 'opacity-0'
    )}
    style="left: {x}px; top: {y}px; background: radial-gradient(circle, rgb({glowRgb} / 0.5), transparent 70%);"
  ></div>

  <div class="relative z-10">
    <div class="mb-2 flex items-center gap-2 font-mono text-xs">
      <span class={cn('inline-block size-2 rounded-full', accent.dot)}></span>
      <span class={accent.text}>mouse tracker · {label}</span>
    </div>

    <p class="text-muted-foreground mb-3 text-sm leading-relaxed">
      I'm a Svelte component loaded over Module Federation. This glow only
      tracks inside my own boundary —
      <span class="text-foreground font-mono">
        {active
          ? `x ${Math.round(x)} · y ${Math.round(y)}`
          : 'move your cursor here'}
      </span>.
    </p>

    <Button onclick={() => count++}>Count is {count}</Button>
  </div>
</div>
