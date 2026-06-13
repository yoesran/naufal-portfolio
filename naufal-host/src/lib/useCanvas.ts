import { useCallback, useRef, useState } from 'react'

// The pan/zoom engine behind CanvasStage. Keeps a single { x, y, scale }
// transform and the gesture handlers that drive it across input types:
//   - mouse / touchpad: click-and-drag pans (anywhere except on a control),
//     wheel / two-finger scroll zooms toward the cursor
//   - touch: one finger drags to pan, two fingers pinch to zoom; a tap (no
//     movement) or a drag that starts on a control is left for the site, so
//     buttons / the terminal / the SpringToy still work.
export type Transform = { x: number; y: number; scale: number }

const MIN_SCALE = 0.1
const MAX_SCALE = 2.5
const TAP_SLOP = 8 // px a touch may move before it counts as a pan, not a tap
const clampScale = (s: number) => Math.min(MAX_SCALE, Math.max(MIN_SCALE, s))

// A drag/tap starting on one of these is the site's, not a pan. `[data-canvas-ui]`
// covers the zoom controls; the rest are the interactive primitives in the blocks.
const INTERACTIVE =
  'a, button, input, textarea, select, label, [role="button"], [role="menuitem"], [contenteditable="true"], [data-canvas-ui]'

export function useCanvas() {
  const surfaceRef = useRef<HTMLDivElement>(null)
  const [transform, setTransform] = useState<Transform>({
    x: 0,
    y: 0,
    scale: 1,
  })
  const [panning, setPanning] = useState(false)
  // Mouse/pen drag-pan: incremental delta since the last move, so the handlers
  // never read the live transform during render (no ref-sync, no stale closure).
  const pan = useRef<{ lastX: number; lastY: number } | null>(null)
  // Active touch points, by pointerId — two of them drive pinch-zoom.
  const touches = useRef(new Map<number, { x: number; y: number }>())
  const pinch = useRef<{ dist: number; cx: number; cy: number } | null>(null)
  // One-finger pan: tap-vs-drag discrimination, skipped if it began on a control.
  const touchPan = useRef<{
    startX: number
    startY: number
    lastX: number
    lastY: number
    active: boolean
    skip: boolean
  } | null>(null)

  // Fit a content of `contentWidth` to the surface width, centered horizontally
  // and top-aligned (the site is a tall ribbon — show its head at a readable
  // size and let the visitor pan down, rather than shrinking the whole thing).
  const fitWidth = useCallback((contentWidth: number) => {
    const surface = surfaceRef.current
    if (!surface) return
    const r = surface.getBoundingClientRect()
    const scale = clampScale((r.width * 0.94) / contentWidth)
    setTransform({ x: (r.width - contentWidth * scale) / 2, y: 28, scale })
  }, [])

  const zoomBy = useCallback((factor: number) => {
    const surface = surfaceRef.current
    if (!surface) return
    const r = surface.getBoundingClientRect()
    setTransform((t) => {
      const scale = clampScale(t.scale * factor)
      const k = scale / t.scale
      const cx = r.width / 2
      const cy = r.height / 2
      return { x: cx - (cx - t.x) * k, y: cy - (cy - t.y) * k, scale }
    })
  }, [])

  // Scale by `k` about a surface-local point, also shifting that point by
  // (panDx, panDy). One formula serves wheel-zoom, pinch-zoom, and pinch-pan.
  const zoomAround = useCallback(
    (k: number, px: number, py: number, panDx = 0, panDy = 0) => {
      setTransform((t) => {
        const scale = clampScale(t.scale * k)
        const kk = scale / t.scale
        return {
          x: px + panDx - (px - t.x) * kk,
          y: py + panDy - (py - t.y) * kk,
          scale,
        }
      })
    },
    []
  )

  const onWheel = useCallback(
    (e: React.WheelEvent) => {
      e.preventDefault()
      const surface = surfaceRef.current
      if (!surface) return
      const r = surface.getBoundingClientRect()
      zoomAround(
        Math.exp(-e.deltaY * 0.0015),
        e.clientX - r.left,
        e.clientY - r.top
      )
    },
    [zoomAround]
  )

  const surfacePoint = (clientX: number, clientY: number) => {
    const r = surfaceRef.current!.getBoundingClientRect()
    return { x: clientX - r.left, y: clientY - r.top }
  }
  const twoTouch = () => {
    const [a, b] = [...touches.current.values()]
    return {
      dist: Math.hypot(a.x - b.x, a.y - b.y),
      cx: (a.x + b.x) / 2,
      cy: (a.y + b.y) / 2,
    }
  }

  const onPointerDown = useCallback((e: React.PointerEvent) => {
    const target = e.target as HTMLElement

    if (e.pointerType === 'touch') {
      touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
      if (touches.current.size === 2) {
        // Second finger → pinch; abandon any single-finger pan in progress.
        const g = twoTouch()
        pinch.current = { dist: g.dist, cx: g.cx, cy: g.cy }
        touchPan.current = null
        setPanning(true)
      } else if (touches.current.size === 1) {
        // Arm a one-finger pan unless the finger landed on a control (let the
        // site tap/drag it). The pan only engages after TAP_SLOP of movement.
        touchPan.current = {
          startX: e.clientX,
          startY: e.clientY,
          lastX: e.clientX,
          lastY: e.clientY,
          active: false,
          skip: target.closest(INTERACTIVE) !== null,
        }
      }
      return
    }

    // Mouse / pen / touchpad: drag pans, unless the grab lands on a control.
    if (target.closest(INTERACTIVE)) return
    e.preventDefault()
    e.currentTarget.setPointerCapture(e.pointerId)
    pan.current = { lastX: e.clientX, lastY: e.clientY }
    setPanning(true)
  }, [])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (e.pointerType === 'touch') {
        if (!touches.current.has(e.pointerId)) return
        touches.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
        if (touches.current.size >= 2 && pinch.current) {
          // Pinch: scale by the finger-distance ratio, pan by the centroid shift.
          const g = twoTouch()
          const k = g.dist / (pinch.current.dist || g.dist)
          const c = surfacePoint(g.cx, g.cy)
          const prev = surfacePoint(pinch.current.cx, pinch.current.cy)
          zoomAround(k, prev.x, prev.y, c.x - prev.x, c.y - prev.y)
          pinch.current = { dist: g.dist, cx: g.cx, cy: g.cy }
          return
        }
        const tp = touchPan.current
        if (!tp || tp.skip) return
        if (!tp.active) {
          if (
            Math.hypot(e.clientX - tp.startX, e.clientY - tp.startY) < TAP_SLOP
          )
            return
          tp.active = true
          setPanning(true)
        }
        const dx = e.clientX - tp.lastX
        const dy = e.clientY - tp.lastY
        tp.lastX = e.clientX
        tp.lastY = e.clientY
        setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
        return
      }
      const p = pan.current
      if (!p) return
      const dx = e.clientX - p.lastX
      const dy = e.clientY - p.lastY
      p.lastX = e.clientX
      p.lastY = e.clientY
      setTransform((t) => ({ ...t, x: t.x + dx, y: t.y + dy }))
    },
    [zoomAround]
  )

  const onPointerUp = useCallback((e: React.PointerEvent) => {
    if (e.pointerType === 'touch') {
      touches.current.delete(e.pointerId)
      if (touches.current.size < 2) pinch.current = null
      if (touches.current.size === 0) {
        touchPan.current = null
        setPanning(false)
      }
      return
    }
    pan.current = null
    setPanning(false)
  }, [])

  return {
    surfaceRef,
    transform,
    panning,
    fitWidth,
    zoomBy,
    handlers: {
      onWheel,
      onPointerDown,
      onPointerMove,
      onPointerUp,
      onPointerCancel: onPointerUp,
    },
  }
}
