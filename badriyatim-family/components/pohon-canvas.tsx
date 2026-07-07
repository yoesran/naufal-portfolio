'use client'

import { useEffect, useMemo, useRef, useState } from 'react'

import { Maximize, Minus, Plus } from 'lucide-react'

import { LegendDot, ProfileDialog } from '@/components/profile-dialog'
import type { Silsila } from '@/lib/family'

// The signature interactive silsilah: a pan/zoom family tree whose connectors are
// "songket gold threads" that weave in on load. Two layouts (radial / linear) over
// the same engine. Public-safe (names + relationships only). Hand-rolled layout +
// SVG + custom pan/zoom, no viz library.

export type TreeMode = 'radial' | 'linear'

type Node = {
  id: string
  name: string
  pasangan?: string
  catatan?: string
  kind: 'root' | 'anak' | 'cucu' | 'cicit'
  relasi: string
  childNames: string[]
  childLabel?: string
  children: Node[]
  depth: number
  ord: number
  ang: number
  X: number
  Y: number
}

function buildTree(s: Silsila): Node {
  const mk = (
    id: string,
    name: string,
    kind: Node['kind'],
    relasi: string,
    extra: Partial<Node> = {}
  ): Node => ({
    id,
    name,
    kind,
    relasi,
    childNames: [],
    children: [],
    depth: 0,
    ord: 0,
    ang: 0,
    X: 0,
    Y: 0,
    ...extra,
  })
  // Short label for the centre node; the full "(Almarhum/ah)" form lives in the
  // page intro and the root couple is honoured there.
  const rootName = `${s.root.ayah} & ${s.root.ibu}`
    .replace(/\s*\((Almarhum|Almarhumah)\)/gi, '')
    .replace(/\b([A-Z])([A-Z]+)\b/g, (_, a, b) => a + b.toLowerCase())
  const root = mk('root', rootName, 'root', 'Cikal bakal keluarga (Alm.)', {
    childNames: s.anak.map((a) => a.nama),
    childLabel: 'Anak',
  })
  s.anak.forEach((a, ai) => {
    const anak = mk(
      `a${ai}`,
      a.nama,
      'anak',
      `Anak ke-${a.no} dari ${root.name}`,
      {
        pasangan: a.pasangan || undefined,
        childNames: a.cucu.map((c) => c.nama),
        childLabel: 'Cucu',
      }
    )
    a.cucu.forEach((c, ci) => {
      const cucu = mk(
        `a${ai}c${ci}`,
        c.nama,
        'cucu',
        `Cucu — anak dari ${a.nama}`,
        {
          pasangan: c.pasangan || undefined,
          catatan: c.catatan,
          childNames: c.cicit,
          childLabel: 'Cicit',
        }
      )
      c.cicit.forEach((name, ii) =>
        cucu.children.push(
          mk(`a${ai}c${ci}i${ii}`, name, 'cicit', `Cicit — anak dari ${c.nama}`)
        )
      )
      anak.children.push(cucu)
    })
    root.children.push(anak)
  })
  return root
}

const X_GAP = 116
const Y_GAP = 132
const PAD = 70
const R_STEP = 184
const TAP_SLOP = 6 // px of movement before a press stops counting as a tap
const clamp = (v: number, lo: number, hi: number) =>
  Math.min(hi, Math.max(lo, v))

// Shared first pass: leaf order + depth (parents centered over their children).
function order(root: Node) {
  let leaf = 0
  const flat: Node[] = []
  ;(function walk(n: Node, depth: number) {
    n.depth = depth
    flat.push(n)
    if (n.children.length === 0) n.ord = leaf++
    else {
      n.children.forEach((c) => walk(c, depth + 1))
      n.ord = (n.children[0].ord + n.children[n.children.length - 1].ord) / 2
    }
  })(root, 0)
  return { flat, leaves: leaf }
}

type Layout = {
  flat: Node[]
  links: { id: string; d: string; depth: number }[]
  width: number
  height: number
  rootX: number
  rootY: number
}

function layout(root: Node, mode: TreeMode): Layout {
  const { flat, leaves } = order(root)
  const maxDepth = Math.max(...flat.map((n) => n.depth))

  if (mode === 'linear') {
    const ords = flat.map((n) => n.ord)
    const minO = Math.min(...ords)
    const maxO = Math.max(...ords)
    flat.forEach((n) => {
      n.X = (n.ord - minO) * X_GAP + PAD
      n.Y = n.depth * Y_GAP + PAD
    })
    const links = flat.flatMap((p) =>
      p.children.map((c) => {
        const my = (p.Y + c.Y) / 2
        return {
          id: c.id,
          depth: c.depth,
          d: `M${p.X},${p.Y} C${p.X},${my} ${c.X},${my} ${c.X},${c.Y}`,
        }
      })
    )
    return {
      flat,
      links,
      width: (maxO - minO) * X_GAP + PAD * 2,
      height: maxDepth * Y_GAP + PAD * 2,
      rootX: root.X,
      rootY: root.Y,
    }
  }

  // radial: root at centre, generations on rings, threads sweep outward.
  const c = maxDepth * R_STEP + PAD
  // Round to 0.01px: Math.cos/sin differ in the last ulp between Node (SSR) and
  // the browser, and the raw values end up verbatim in path `d`/transform
  // attributes → hydration-mismatch warnings. Plain +-*/ is IEEE-deterministic,
  // so rounding here (the only transcendental step) makes the whole layout
  // byte-identical on both sides.
  const round2 = (v: number) => Math.round(v * 100) / 100
  const polar = (ang: number, r: number): [number, number] => [
    round2(c + r * Math.cos(ang)),
    round2(c + r * Math.sin(ang)),
  ]
  flat.forEach((n) => {
    // Spread around the circle with a small empty wedge at the top, so the first
    // and last branches don't collide where the angle wraps.
    n.ang = -Math.PI / 2 + 0.25 + (n.ord / leaves) * (2 * Math.PI - 0.5)
    ;[n.X, n.Y] = polar(n.ang, n.depth * R_STEP)
  })
  const links = flat.flatMap((p) =>
    p.children.map((ch) => {
      const rm = ((p.depth + ch.depth) / 2) * R_STEP
      const [c1x, c1y] = polar(p.ang, rm)
      const [c2x, c2y] = polar(ch.ang, rm)
      return {
        id: ch.id,
        depth: ch.depth,
        d: `M${p.X},${p.Y} C${c1x},${c1y} ${c2x},${c2y} ${ch.X},${ch.Y}`,
      }
    })
  )
  return { flat, links, width: 2 * c, height: 2 * c, rootX: c, rootY: c }
}

const FILL: Record<Node['kind'], string> = {
  root: 'var(--marun)',
  anak: 'var(--marun)',
  cucu: 'var(--gading-warm)',
  cicit: 'var(--emas-pale)',
}
const TEXT: Record<Node['kind'], string> = {
  root: 'var(--gading)',
  anak: 'var(--gading)',
  cucu: 'var(--tanah)',
  cicit: 'var(--marun-deep)',
}

type Transform = { k: number; tx: number; ty: number; mode: TreeMode }

// One active gesture at a time: a press that may end as a tap or become a drag,
// or a two-finger pinch.
type Gesture =
  | {
      type: 'drag'
      x: number
      y: number
      tx: number
      ty: number
      nodeId: string | null
      moved: boolean
    }
  | {
      type: 'pinch'
      dist: number
      k: number
      tx: number
      ty: number
      mid: { x: number; y: number }
    }

export function PohonCanvas({
  silsila,
  mode = 'radial',
}: {
  silsila: Silsila
  mode?: TreeMode
}) {
  const { flat, links, width, height, rootX, rootY } = useMemo(
    () => layout(buildTree(silsila), mode),
    [silsila, mode]
  )

  const wrapRef = useRef<HTMLDivElement>(null)
  // `scale` is the A/A+/A++ text-size factor (html font-size ÷ the 17px base).
  // The SVG's node labels are fixed-px, so without it the tree stays small
  // while every other letter on the page grows — the default zoom multiplies
  // by it so A++ users get readable labels immediately. Captured in the
  // ResizeObserver callback: the container height is rem-based, so a text-size
  // switch resizes it and re-fires the observer — no extra listener needed.
  const [size, setSize] = useState({ w: 0, h: 0, scale: 1 })
  // Tagged with the mode it was computed for, so a mode switch falls back to the
  // home view without a setState-in-effect (React Compiler rule).
  const [userT, setUserT] = useState<Transform | null>(null)
  const [sel, setSel] = useState<Node | null>(null)

  const home = () => defaultView(size, width, height, rootX, rootY, mode)

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    const ro = new ResizeObserver(([e]) =>
      setSize({
        w: e.contentRect.width,
        h: e.contentRect.height,
        scale:
          parseFloat(getComputedStyle(document.documentElement).fontSize) / 17,
      })
    )
    ro.observe(el)
    return () => ro.disconnect()
  }, [])

  useEffect(() => {
    const el = wrapRef.current
    if (!el) return
    // Ctrl/⌘ + wheel zooms (also what browsers emit for trackpad pinch); a plain
    // wheel keeps scrolling the page instead of being hijacked by the canvas.
    const onWheel = (e: WheelEvent) => {
      if (!e.ctrlKey && !e.metaKey) return
      e.preventDefault()
      const r = el.getBoundingClientRect()
      const mx = e.clientX - r.left
      const my = e.clientY - r.top
      setUserT((prev) => {
        const cur = prev && prev.mode === mode ? prev : home()
        const k2 = clamp(cur.k * (e.deltaY < 0 ? 1.12 : 0.89), 0.16, 2.8)
        return {
          k: k2,
          tx: mx - ((mx - cur.tx) * k2) / cur.k,
          ty: my - ((my - cur.ty) * k2) / cur.k,
          mode,
        }
      })
    }
    el.addEventListener('wheel', onWheel, { passive: false })
    return () => el.removeEventListener('wheel', onWheel)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [size, width, height, rootX, rootY, mode])

  const t = userT && userT.mode === mode ? userT : home()

  // Live pointer positions + the current gesture. The container takes pointer
  // capture, which retargets pointerup AND the derived click to itself — so node
  // selection can't use onClick on the nodes (it never fires). Instead a press
  // that ends within TAP_SLOP is a tap, resolved to the node recorded at
  // pointerdown time (when the event target still was the node).
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const gesture = useRef<Gesture | null>(null)

  // mid must be container-local (like tx/ty and the wheel math) — client coords
  // would smuggle the container's page offset into the transform and make the
  // pinch drift.
  const pinchFrom = (cur: Transform, el: Element): Gesture => {
    const r = el.getBoundingClientRect()
    const [p1, p2] = [...pointers.current.values()]
    return {
      type: 'pinch',
      dist: Math.hypot(p1.x - p2.x, p1.y - p2.y),
      k: cur.k,
      tx: cur.tx,
      ty: cur.ty,
      mid: {
        x: (p1.x + p2.x) / 2 - r.left,
        y: (p1.y + p2.y) / 2 - r.top,
      },
    }
  }

  const endPointer = (e: React.PointerEvent, isTap: boolean) => {
    const g = gesture.current
    if (isTap && g?.type === 'drag' && !g.moved && g.nodeId) {
      const n = flat.find((n) => n.id === g.nodeId)
      if (n) setSel(n)
    }
    pointers.current.delete(e.pointerId)
    gesture.current = null
  }

  return (
    <div>
      <div
        ref={wrapRef}
        // max-h keeps the canvas inside the viewport at A++ (34rem × the xl
        // factor ≈ 780px — taller than a phone screen, which put an empty
        // slice of pattern above the fold and the tree below it).
        className="border-border bg-gading-warm relative h-136 max-h-[75svh] cursor-grab touch-none overflow-hidden rounded-xl border active:cursor-grabbing"
        onPointerDown={(e) => {
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          ;(e.currentTarget as Element).setPointerCapture(e.pointerId)
          if (pointers.current.size === 2) {
            gesture.current = pinchFrom(t, e.currentTarget)
          } else if (pointers.current.size === 1) {
            gesture.current = {
              type: 'drag',
              x: e.clientX,
              y: e.clientY,
              tx: t.tx,
              ty: t.ty,
              nodeId:
                (e.target as Element)
                  .closest('[data-node-id]')
                  ?.getAttribute('data-node-id') ?? null,
              moved: false,
            }
          }
        }}
        onPointerMove={(e) => {
          if (!pointers.current.has(e.pointerId)) return
          pointers.current.set(e.pointerId, { x: e.clientX, y: e.clientY })
          const g = gesture.current
          if (!g) return
          if (g.type === 'pinch' && pointers.current.size >= 2) {
            const r = e.currentTarget.getBoundingClientRect()
            const [p1, p2] = [...pointers.current.values()]
            const dist = Math.hypot(p1.x - p2.x, p1.y - p2.y)
            const mid = {
              x: (p1.x + p2.x) / 2 - r.left,
              y: (p1.y + p2.y) / 2 - r.top,
            }
            const k2 = clamp((g.k * dist) / g.dist, 0.16, 2.8)
            // Keep the content point that started under the pinch midpoint under
            // the (moving) midpoint: zoom + pan in one.
            setUserT({
              k: k2,
              tx: mid.x - ((g.mid.x - g.tx) * k2) / g.k,
              ty: mid.y - ((g.mid.y - g.ty) * k2) / g.k,
              mode,
            })
          } else if (g.type === 'drag') {
            const dx = e.clientX - g.x
            const dy = e.clientY - g.y
            if (Math.abs(dx) + Math.abs(dy) > TAP_SLOP) g.moved = true
            if (g.moved)
              setUserT({ k: t.k, tx: g.tx + dx, ty: g.ty + dy, mode })
          }
        }}
        onPointerUp={(e) => endPointer(e, true)}
        onPointerCancel={(e) => endPointer(e, false)}
      >
        <div
          aria-hidden
          className="pointer-events-none absolute inset-0 opacity-[0.06]"
          style={{
            backgroundImage:
              'repeating-linear-gradient(45deg, var(--marun) 0 1px, transparent 1px 14px), repeating-linear-gradient(-45deg, var(--emas) 0 1px, transparent 1px 14px)',
          }}
        />
        <svg
          width={width}
          height={height}
          className="absolute top-0 left-0 origin-top-left select-none"
          style={{ transform: `translate(${t.tx}px,${t.ty}px) scale(${t.k})` }}
        >
          <defs>
            <linearGradient id="emasThread" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="var(--emas-light)" />
              <stop offset="100%" stopColor="var(--emas)" />
            </linearGradient>
          </defs>
          {links.map((l) => (
            <path
              key={l.id}
              className="songket-thread"
              pathLength={1}
              style={{ animationDelay: `${l.depth * 0.18}s` }}
              d={l.d}
              fill="none"
              stroke="url(#emasThread)"
              strokeWidth={1.6}
              strokeLinecap="round"
            />
          ))}
          {flat.map((n) => {
            const w = Math.max(70, Math.min(168, n.name.length * 8.2 + 22))
            const h = n.kind === 'root' ? 46 : 34
            return (
              <g
                key={n.id}
                data-node-id={n.id}
                transform={`translate(${n.X - w / 2},${n.Y - h / 2})`}
                className="songket-node cursor-pointer"
                role="button"
                tabIndex={0}
                onKeyDown={(e) =>
                  (e.key === 'Enter' || e.key === ' ') && setSel(n)
                }
              >
                <rect
                  width={w}
                  height={h}
                  rx={h / 2}
                  fill={FILL[n.kind]}
                  stroke={n.kind === 'cucu' ? 'var(--border)' : 'transparent'}
                />
                <text
                  x={w / 2}
                  y={h / 2 + 4}
                  textAnchor="middle"
                  fontSize={n.kind === 'root' ? 13 : 11.5}
                  fontWeight={
                    n.kind === 'root' || n.kind === 'anak' ? 700 : 500
                  }
                  fill={TEXT[n.kind]}
                  style={{ fontFamily: 'var(--font-body)' }}
                >
                  {n.name.length > 20 ? n.name.slice(0, 19) + '…' : n.name}
                </text>
              </g>
            )
          })}
        </svg>

        <div className="absolute right-3 bottom-3 flex flex-col gap-1.5">
          <CtrlBtn onClick={() => zoomBy(1.25)} label="Perbesar">
            <Plus className="size-4" />
          </CtrlBtn>
          <CtrlBtn onClick={() => zoomBy(0.8)} label="Perkecil">
            <Minus className="size-4" />
          </CtrlBtn>
          <CtrlBtn onClick={() => setUserT(null)} label="Pas ke layar">
            <Maximize className="size-4" />
          </CtrlBtn>
        </div>
        {/* right-16 keeps the (wrapping) hint clear of the zoom button stack;
            the zoom gesture named matches the input: pinch on touch, wheel on
            desktop. */}
        <p className="text-tanah-soft pointer-events-none absolute right-16 bottom-3 left-3 text-xs">
          Geser untuk menjelajah · ketuk nama untuk detail
          <span className="sm:hidden"> · cubit untuk zoom</span>
          <span className="hidden sm:inline"> · Ctrl+gulir untuk zoom</span>
        </p>
      </div>

      {/* Matches the node colours above — keep in sync with FILL. */}
      <div className="text-tanah-soft mt-4 flex flex-wrap gap-x-5 gap-y-2 text-sm">
        <LegendDot className="bg-marun" label="Anak kandung" />
        <LegendDot
          className="border-border bg-gading-warm border"
          label="Cucu"
        />
        <LegendDot className="bg-emas-pale" label="Cicit" />
        <span className="flex items-center gap-2">
          <span className="bg-emas h-0.5 w-5 rounded" aria-hidden /> benang
          penghubung (songket)
        </span>
      </div>

      <ProfileDialog
        profile={
          sel && {
            nama: sel.name,
            relasi: sel.relasi,
            pasangan: sel.pasangan,
            catatan: sel.catatan,
            childrenLabel: sel.childLabel,
            children: sel.childNames,
          }
        }
        onClose={() => setSel(null)}
      />
    </div>
  )

  function zoomBy(factor: number) {
    setUserT(() => {
      const cx = size.w / 2
      const cy = size.h / 2
      const k2 = clamp(t.k * factor, 0.16, 2.8)
      return {
        k: k2,
        tx: cx - ((cx - t.tx) * k2) / t.k,
        ty: cy - ((cy - t.ty) * k2) / t.k,
        mode,
      }
    })
  }
}

function defaultView(
  size: { w: number; h: number; scale: number },
  width: number,
  height: number,
  rootX: number,
  rootY: number,
  mode: TreeMode
): Transform {
  if (!size.w || !size.h) return { k: 0.5, tx: 40, ty: 16, mode }
  // A/A+/A++ multiplies the default zoom so the fixed-px node labels track the
  // chosen text size — at A++ the mandala no longer fully fits, which is the
  // right trade: readable names beat overview (pan/pinch still reach the rest).
  if (mode === 'radial') {
    // Whole mandala in view, centred (at base text size).
    const k = clamp(
      Math.min(size.w / width, size.h / height) * 0.94 * size.scale,
      0.16,
      1.2 * size.scale
    )
    return {
      k,
      tx: size.w / 2 - rootX * k,
      ty: size.h / 2 - rootY * k,
      mode,
    }
  }
  // linear: fill vertically, root centred horizontally, top-anchored; pan sideways.
  const k = clamp(
    (size.h / height) * 0.86 * size.scale,
    0.36,
    0.95 * size.scale
  )
  return { k, tx: size.w / 2 - rootX * k, ty: 14, mode }
}

function CtrlBtn({
  onClick,
  label,
  children,
}: {
  onClick: () => void
  label: string
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={label}
      className="border-border bg-card text-marun hover:bg-gading-deep flex size-11 items-center justify-center rounded-lg border shadow-sm"
    >
      {children}
    </button>
  )
}
