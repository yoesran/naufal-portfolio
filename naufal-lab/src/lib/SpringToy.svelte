<script lang="ts">
  import '../app.css'

  import { Spring } from 'svelte/motion'

  import { t } from '$lib/i18n'
  import { cn } from '$lib/utils'

  import mfGlyph from '../assets/module-federation.svg?raw'
  import reactGlyph from '../assets/react.svg?raw'
  import svelteGlyph from '../assets/svelte.svg?raw'

  let { context = 'standalone' }: { context?: 'host' | 'standalone' } = $props()

  const embedded = $derived(context === 'host')

  // A Svelte "event ticket" on a lanyard (à la Vercel's): grab it and it swings
  // with momentum; fling it and it arcs and settles. Swing/drag it onto the far
  // React / Module-Federation host to mount it (it docks inside React and stays
  // there) — then give it a firm tug to pull it back out (unmount). The lanyard
  // is a capped string-spring + gravity (a hard constraint snapped on release);
  // only the dock shrink uses Svelte's `Spring`. The lanyard + host glow use
  // `--brand` so theming re-skins it across the MF boundary.
  const H = 280
  const CARD_W = 58
  const CARD_H = 80
  const GRAVITY = 0.5
  const PULL = 0.2 // string tension when taut
  const MAX_PULL = 2.6 // cap so a big stretch eases back instead of snapping
  const DAMP = 0.92
  const MOUNT_DIST = 64 // release this close to the host → mount
  const UNMOUNT_DIST = 96 // drag a mounted ticket this far out → unmount

  let container = $state<HTMLDivElement>()
  let width = $state(0)
  let dragging = $state(false)
  let mounted = $state(false)
  let ready = false
  // rAF loop control — the loop sleeps when the ticket has settled and wakes on
  // interaction, so an idle toy costs nothing.
  let raf = 0
  let running = false
  let prevCX = 0
  let prevCY = 0
  let calm = 0

  // Physics point = the ticket's top clip (where the lanyard attaches).
  let x = 0
  let y = 0
  let vx = 0
  let vy = 0
  let pointerX = 0
  let pointerY = 0

  let clipX = $state(0)
  let clipY = $state(0)
  let rot = $state(0)

  const scale = new Spring(1, { stiffness: 0.18, damping: 0.72 })

  const pin = $derived({ x: width * 0.2, y: 16 })
  const ropeLen = $derived(Math.min(H * 0.5, 148))
  const host = $derived({ x: width * 0.8, y: H * 0.46 })
  const near = $derived(
    dragging &&
      ((!mounted && Math.hypot(clipX - host.x, clipY - host.y) < MOUNT_DIST) ||
        (mounted && Math.hypot(clipX - host.x, clipY - host.y) < UNMOUNT_DIST))
  )

  function wake() {
    if (running) return
    running = true
    raf = requestAnimationFrame(tick)
  }

  function tick() {
    step()
    const moved = Math.hypot(clipX - prevCX, clipY - prevCY)
    prevCX = clipX
    prevCY = clipY
    // Idle-sleep: once it has settled and isn't being held, stop the loop.
    if (!dragging && moved < 0.08) calm++
    else calm = 0
    if (calm > 12) {
      running = false
      return
    }
    raf = requestAnimationFrame(tick)
  }

  // Seed the bob at rest once we know the width, then start the loop.
  $effect(() => {
    if (width === 0 || ready) return
    x = pin.x
    y = pin.y + ropeLen
    clipX = x
    clipY = y
    prevCX = x
    prevCY = y
    ready = true
    wake()
  })

  // Re-settle when the container resizes (pin / host move with the width).
  $effect(() => {
    void width
    if (ready) wake()
  })

  // Stop the loop on unmount.
  $effect(() => () => {
    running = false
    cancelAnimationFrame(raf)
  })

  function step() {
    if (!ready) return

    if (dragging) {
      // Track velocity so a release flings with momentum.
      vx = pointerX - x
      vy = pointerY - y
      x = pointerX
      y = pointerY
    } else if (mounted) {
      // Docked inside the host — ease to it and stay (no auto-unmount).
      x += (host.x - x) * 0.3
      y += (host.y - y) * 0.3
      rot += (0 - rot) * 0.3
      clipX = x
      clipY = y
      return
    } else {
      // Free swing: gravity + a string that only pulls when taut, with a capped
      // tension so a big stretch eases back smoothly instead of snapping.
      vy += GRAVITY
      const dx = x - pin.x
      const dy = y - pin.y
      const dist = Math.hypot(dx, dy) || 0.0001
      const stretch = dist - ropeLen
      if (stretch > 0) {
        const acc = Math.min(stretch * PULL, MAX_PULL)
        vx -= (dx / dist) * acc
        vy -= (dy / dist) * acc
      }
      vx *= DAMP
      vy *= DAMP
      x += vx
      y += vy
    }

    clipX = x
    clipY = y
    rot = Math.atan2(x - pin.x, y - pin.y) * (180 / Math.PI)
  }

  function rel(e: PointerEvent) {
    const r = container!.getBoundingClientRect()
    pointerX = Math.max(0, Math.min(width, e.clientX - r.left))
    pointerY = Math.max(0, Math.min(H, e.clientY - r.top))
  }
  function grab(e: PointerEvent) {
    dragging = true
    ;(e.currentTarget as HTMLElement).setPointerCapture(e.pointerId)
    rel(e)
    x = pointerX
    y = pointerY
    vx = 0
    vy = 0
    scale.target = 1 // grow back to full size as you pull it out
    wake()
  }
  function move(e: PointerEvent) {
    if (dragging) rel(e)
  }
  function release() {
    if (!dragging) return
    dragging = false
    const d = Math.hypot(x - host.x, y - host.y)
    if (!mounted && d < MOUNT_DIST) {
      mounted = true
      scale.target = 0.4 // dock inside React
    } else if (mounted && d <= UNMOUNT_DIST) {
      scale.target = 0.4 // not pulled far enough — snap back into the host
    } else if (mounted) {
      mounted = false // pulled out with force → swings back on the lanyard
    }
    wake()
  }
</script>

<div>
  <div class="mb-2 flex items-center gap-2 font-mono text-xs">
    <span
      class={cn(
        'inline-block size-2 rounded-full',
        embedded ? 'bg-brand' : 'bg-sky-400'
      )}
    ></span>
    <span class={embedded ? 'text-brand' : 'text-sky-400'}>
      {$t('springToy.label')} ·
      {embedded
        ? $t('springToy.context.host')
        : $t('springToy.context.standalone')}
    </span>
  </div>

  <p class="text-muted-foreground mb-3 text-sm leading-relaxed">
    {$t('springToy.hint')}
  </p>

  <div
    bind:this={container}
    bind:clientWidth={width}
    role="presentation"
    onpointermove={move}
    onpointerup={release}
    onpointercancel={release}
    class="border-border bg-muted/20 relative touch-none overflow-hidden rounded-lg border"
    style="height: {H}px;"
  >
    <!-- Lanyard band from the pin to the ticket clip (uses --brand). -->
    {#if !mounted}
      <svg
        class="pointer-events-none absolute inset-0 h-full w-full"
        aria-hidden="true"
      >
        <line
          x1={pin.x}
          y1={pin.y}
          x2={clipX}
          y2={clipY}
          stroke="var(--brand)"
          stroke-width="3"
          stroke-opacity="0.5"
          stroke-linecap="round"
        />
        <circle cx={pin.x} cy={pin.y} r="4" fill="var(--brand)" />
      </svg>
    {/if}

    <!-- React / Module-Federation host: mount target, far from the lanyard. -->
    <div
      class="absolute -translate-x-1/2 -translate-y-1/2"
      style="left: {host.x}px; top: {host.y}px;"
    >
      <div
        class={cn(
          'bg-card relative flex size-14 items-center justify-center rounded-full border transition-all duration-200',
          near || mounted
            ? 'border-brand scale-110 shadow-[0_0_0_4px_color-mix(in_oklch,var(--brand)_22%,transparent)]'
            : 'border-border'
        )}
      >
        <span
          class="[&_path]:fill-current [&_svg]:size-7"
          style="color: #61DAFB"
          aria-hidden="true">{@html reactGlyph}</span
        >
        <span
          class="bg-card absolute -right-1.5 -bottom-1.5 flex size-5 items-center justify-center rounded-full border [&_svg]:size-3.5"
          aria-hidden="true">{@html mfGlyph}</span
        >
      </div>
    </div>

    <!-- The Svelte ticket. Rotates about its top clip; grabbable even when docked. -->
    <button
      type="button"
      aria-label={$t('springToy.grabLabel')}
      onpointerdown={grab}
      class="absolute block cursor-grab touch-none active:cursor-grabbing"
      style="left: {clipX}px; top: {clipY}px; width: {CARD_W}px; transform: translateX(-50%) rotate({rot}deg) scale({scale.current}); transform-origin: top center;"
    >
      <span
        class="bg-muted-foreground/50 mx-auto mb-1 block h-1 w-5 rounded-full"
      ></span>
      <span
        class="bg-card border-border flex flex-col items-center justify-center gap-1 rounded-lg border px-2 shadow-md"
        style="height: {CARD_H}px;"
      >
        <span
          class="[&_path]:fill-current [&_svg]:size-7"
          style="color: #FF3E00"
          aria-hidden="true">{@html svelteGlyph}</span
        >
        <span class="text-muted-foreground font-mono text-[9px]">Svelte</span>
      </span>
    </button>

    {#if mounted}
      <div
        class="text-brand absolute left-1/2 -translate-x-1/2 font-mono text-xs"
        style="bottom: 12px;"
      >
        {$t('springToy.mounted')}
      </div>
    {/if}
  </div>

  <p class="text-muted-foreground mt-3 font-mono text-xs">
    {$t('springToy.framework')}
  </p>
</div>
