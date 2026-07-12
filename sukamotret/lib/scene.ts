// The simulator's canvas scene: a couple silhouetted against a sky lit by the
// REAL sun altitude at the studio for the chosen minute — a diagram of light,
// not a fake photo. Shared by the simulator (interactive) and the photo
// editor (its demo seed), so both draw the identical world.
import { atMinute, studioAltitude } from './sun'

const rad = Math.PI / 180

// Sky stops keyed by sun altitude. Interpolated, so dusk actually crossfades.
type RGB = [number, number, number]
const SKY: [number, RGB, RGB][] = [
  [60, [46, 111, 176], [191, 217, 238]],
  [20, [62, 127, 184], [222, 219, 205]],
  [6, [74, 110, 158], [240, 178, 104]],
  [0, [62, 84, 120], [232, 138, 60]],
  [-4, [42, 58, 94], [196, 85, 58]],
  [-8, [26, 36, 68], [74, 58, 98]],
  [-18, [12, 16, 36], [23, 26, 52]],
]
const mix = (a: RGB, b: RGB, u: number): RGB =>
  a.map((v, i) => Math.round(v + (b[i] - v) * u)) as RGB
const rgb = (c: RGB) => `rgb(${c[0]},${c[1]},${c[2]})`

function sky(alt: number): [RGB, RGB] {
  if (alt >= SKY[0][0]) return [SKY[0][1], SKY[0][2]]
  for (let i = 0; i < SKY.length - 1; i++) {
    const [hi, t1, h1] = SKY[i]
    const [lo, t2, h2] = SKY[i + 1]
    if (alt <= hi && alt >= lo) {
      const u = (hi - alt) / (hi - lo)
      return [mix(t1, t2, u), mix(h1, h2, u)]
    }
  }
  const last = SKY[SKY.length - 1]
  return [last[1], last[2]]
}

export const SCRUB_MIN = 300 // 05.00
export const SCRUB_MAX = 1140 // 19.00

// Draws the scene for a minute-of-day and returns the sun altitude used.
export function drawScene(
  cx: CanvasRenderingContext2D,
  midnight: number,
  min: number
): number {
  const W = cx.canvas.width
  const H = cx.canvas.height
  const HORIZON = H * 0.68
  const alt = studioAltitude(atMinute(midnight, min))
  const [top, hz] = sky(alt)

  const g = cx.createLinearGradient(0, 0, 0, HORIZON)
  g.addColorStop(0, rgb(top))
  g.addColorStop(1, rgb(hz))
  cx.fillStyle = g
  cx.fillRect(0, 0, W, HORIZON)

  // sun: x tracks the day, y tracks true altitude
  const dayU = (min - SCRUB_MIN) / (SCRUB_MAX - SCRUB_MIN)
  const sx = W * (0.1 + dayU * 0.8)
  const sy = HORIZON - (alt / 70) * (HORIZON * 0.92)

  if (alt > -9) {
    const glow = cx.createRadialGradient(sx, sy, 0, sx, sy, W * 0.42)
    const warm = alt < 8 ? 1 : Math.max(0, 1 - (alt - 8) / 40)
    glow.addColorStop(
      0,
      `rgba(255,${210 - warm * 60},${150 - warm * 90},${0.55 + warm * 0.3})`
    )
    glow.addColorStop(1, 'rgba(255,200,140,0)')
    cx.fillStyle = glow
    cx.fillRect(0, 0, W, HORIZON)

    if (alt > -1) {
      cx.beginPath()
      cx.arc(sx, sy, 17, 0, 7)
      cx.fillStyle = alt < 6 ? '#FFD08A' : '#FFF6E2'
      cx.fill()
    }
  }

  // light level drives how much the land separates from the sky
  const light = Math.max(0, Math.min(1, (alt + 8) / 20))

  // far hills
  cx.fillStyle = `rgba(${18 + light * 30},${20 + light * 34},${28 + light * 30},1)`
  cx.beginPath()
  cx.moveTo(0, HORIZON)
  cx.quadraticCurveTo(W * 0.22, HORIZON - 62, W * 0.45, HORIZON - 6)
  cx.quadraticCurveTo(W * 0.7, HORIZON - 74, W, HORIZON - 18)
  cx.lineTo(W, HORIZON)
  cx.closePath()
  cx.fill()

  // Ground. A low sun rakes it and lights it warm; a high sun leaves it flat.
  // Without this the long golden-hour shadow would have nothing to fall on.
  const graze = Math.max(0, 1 - Math.abs(alt - 5) / 9)
  const gg = cx.createLinearGradient(0, HORIZON, 0, H)
  gg.addColorStop(
    0,
    `rgb(${10 + light * 26 + graze * 62},${12 + light * 26 + graze * 34},${14 + light * 22 + graze * 12})`
  )
  gg.addColorStop(
    1,
    `rgb(${5 + light * 12 + graze * 16},${6 + light * 12 + graze * 9},${8 + light * 12 + graze * 5})`
  )
  cx.fillStyle = gg
  cx.fillRect(0, HORIZON, W, H - HORIZON)

  // The couple, silhouetted — the reason anyone books golden hour. They stand
  // on the near ground so their heads clear the far hills and read against
  // the sky.
  const ink = `rgb(${6 + light * 10},${7 + light * 10},${9 + light * 10})`
  const BASE = HORIZON + 30
  const POS: [number, number][] = [
    [W * 0.455, 1.0],
    [W * 0.53, 1.09],
  ]

  // Shadows before bodies. Length is height / tan(altitude) — the real thing.
  // Noon pins a stub under the feet; golden hour throws it across the frame.
  if (alt > 1) {
    const dir = sx > W * 0.5 ? -1 : 1
    for (const [x, s] of POS) {
      const len = Math.min((120 * s) / Math.tan(alt * rad), W * 0.55)
      cx.save()
      cx.globalAlpha = 0.32 + light * 0.24
      cx.fillStyle = '#05060a'
      cx.beginPath()
      cx.ellipse(
        x + (dir * len) / 2,
        BASE + 2,
        len / 2 + 17 * s,
        7 * s,
        0,
        0,
        7
      )
      cx.fill()
      cx.restore()
    }
  }

  const figure = (x: number, s: number) => {
    const h = 120 * s
    const r = 12 * s
    const headY = BASE - h + r
    const shoulderY = headY + r * 0.85
    cx.fillStyle = ink
    cx.beginPath()
    cx.arc(x, headY, r, 0, 7)
    cx.fill()
    cx.beginPath()
    cx.moveTo(x - 9 * s, shoulderY)
    cx.quadraticCurveTo(x - 21 * s, BASE - h * 0.45, x - 17 * s, BASE)
    cx.lineTo(x + 17 * s, BASE)
    cx.quadraticCurveTo(x + 21 * s, BASE - h * 0.45, x + 9 * s, shoulderY)
    cx.closePath()
    cx.fill()
    return { x, s, h, r, headY, shoulderY }
  }
  const a = figure(...POS[0])
  const b = figure(...POS[1])

  // Rim light: the signature of a low sun *behind* the subject. It rides the
  // sun-side edge of the silhouette's own contour — not around it. Peaks a
  // few degrees up, gone by mid-morning.
  if (alt > -3 && alt < 14) {
    const rim = Math.max(0, 1 - Math.abs(alt - 4) / 9)
    const right = sx > W * 0.5
    cx.strokeStyle = `rgba(255,226,170,${rim})`
    cx.lineWidth = 2.8
    cx.lineCap = 'round'
    for (const f of [a, b]) {
      const d = right ? 1 : -1
      cx.beginPath()
      cx.arc(f.x, f.headY, f.r, -Math.PI * 0.42 * d, Math.PI * 0.52 * d, !right)
      cx.stroke()
      cx.beginPath()
      cx.moveTo(f.x + 9 * f.s * d, f.shoulderY)
      cx.quadraticCurveTo(
        f.x + 21 * f.s * d,
        BASE - f.h * 0.45,
        f.x + 17 * f.s * d,
        BASE
      )
      cx.stroke()
    }
  }
  return alt
}
