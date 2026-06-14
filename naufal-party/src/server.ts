import type * as Party from 'partykit/server'

const COLORS = [
  '#34d399', // emerald
  '#38bdf8', // sky
  '#f472b6', // pink
  '#fbbf24', // amber
  '#a78bfa', // violet
  '#fb7185', // rose
]

const NAMES = [
  'Otter',
  'Fox',
  'Heron',
  'Lynx',
  'Wren',
  'Ibis',
  'Koi',
  'Moth',
  'Crane',
  'Hare',
  'Finch',
  'Newt',
]

function colorFor(id: string) {
  let h = 0
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) | 0
  return COLORS[Math.abs(h) % COLORS.length]
}

function randomName() {
  return NAMES[Math.floor(Math.random() * NAMES.length)]
}

type ConnState = { color: string; name: string }

// "Echoes": the room remembers recent visitors. A real cursor path is recorded
// while a visitor is connected and, on leave, stored as an anonymous "ghost"
// (just colour + name + the normalized path — no PII). The set is sent to every
// connection; a client that finds itself alone replays them as translucent ghost
// cursors, so a solo visitor never sees an empty multiplayer room. Seeded with a
// few synthetic drifts so even the very first visitor sees something.
type Ghost = { color: string; name: string; path: { x: number; y: number }[] }

const GHOST_MAX = 6
const RECORD_MAX = 90 // rolling window of recent points per live connection
const GHOST_STEP = 3 // downsample factor when storing (→ ~30 points)
const GHOST_MIN_POINTS = 12 // ignore paths too short to read as movement

function seedGhosts(): Ghost[] {
  // Gentle left-to-right drifts at different heights — indistinguishable in form
  // from a recorded path, so the demo reads the same before any real visitor.
  return [0, 1, 2].map((i) => {
    const path: { x: number; y: number }[] = []
    const y0 = 0.32 + 0.18 * i
    for (let k = 0; k < 30; k++) {
      const t = k / 29
      path.push({
        x: 0.15 + 0.7 * t,
        y: y0 + 0.07 * Math.sin(t * Math.PI * 2 + i),
      })
    }
    return {
      color: COLORS[(i * 2) % COLORS.length],
      name: NAMES[(i * 4) % NAMES.length],
      path,
    }
  })
}

export default class CursorServer implements Party.Server {
  private ghosts: Ghost[] = seedGhosts()
  private recordings = new Map<string, { x: number; y: number }[]>()

  constructor(readonly room: Party.Room) {}

  private echoesMessage() {
    return JSON.stringify({ type: 'echoes', ghosts: this.ghosts })
  }

  onConnect(conn: Party.Connection<ConnState>) {
    const color = colorFor(conn.id)
    const name = randomName()
    conn.setState({ color, name })
    conn.send(JSON.stringify({ type: 'welcome', id: conn.id, color, name }))
    // Hand the newcomer the current echoes; it replays them only while alone.
    conn.send(this.echoesMessage())
  }

  onMessage(message: string, sender: Party.Connection<ConnState>) {
    let data: {
      type?: string
      x?: number
      y?: number
      context?: string
      pointer?: string
    }
    try {
      data = JSON.parse(message)
    } catch {
      return
    }
    if (typeof data.x !== 'number' || typeof data.y !== 'number') return

    const color = sender.state?.color ?? colorFor(sender.id)
    const name = sender.state?.name ?? 'Guest'

    if (data.type === 'cursor') {
      const context = data.context === 'host' ? 'host' : 'remote'
      // `pointer` tells receivers how to draw the position: a resting arrow
      // (mouse) or an ephemeral fingertip trail (touch).
      const pointer = data.pointer === 'touch' ? 'touch' : 'mouse'
      // Record into this connection's rolling path (for the echo it leaves).
      const rec = this.recordings.get(sender.id) ?? []
      rec.push({ x: data.x, y: data.y })
      if (rec.length > RECORD_MAX) rec.shift()
      this.recordings.set(sender.id, rec)
      this.room.broadcast(
        JSON.stringify({
          type: 'cursor',
          id: sender.id,
          color,
          name,
          context,
          pointer,
          x: data.x,
          y: data.y,
        }),
        [sender.id]
      )
    } else if (data.type === 'burst') {
      // A tap/click firework — relayed in the sender's color; the sender
      // already rendered its own locally.
      this.room.broadcast(
        JSON.stringify({
          type: 'burst',
          id: sender.id,
          color,
          x: data.x,
          y: data.y,
        }),
        [sender.id]
      )
    }
  }

  onClose(conn: Party.Connection<ConnState>) {
    this.room.broadcast(JSON.stringify({ type: 'leave', id: conn.id }))

    // Turn the departing visitor's path into an echo for whoever's left.
    const rec = this.recordings.get(conn.id)
    this.recordings.delete(conn.id)
    if (rec && rec.length >= GHOST_MIN_POINTS) {
      const path = rec.filter((_, i) => i % GHOST_STEP === 0)
      this.ghosts.unshift({
        color: conn.state?.color ?? colorFor(conn.id),
        name: conn.state?.name ?? 'Guest',
        path,
      })
      if (this.ghosts.length > GHOST_MAX) this.ghosts.length = GHOST_MAX
      // Refresh everyone's echo set so the remaining solo visitor (if any) picks
      // up the cursor of the person who just left — "the room remembers".
      this.room.broadcast(this.echoesMessage())
    }
  }
}
