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

export default class CursorServer implements Party.Server {
  constructor(readonly room: Party.Room) {}

  onConnect(conn: Party.Connection<ConnState>) {
    const color = colorFor(conn.id)
    const name = randomName()
    conn.setState({ color, name })
    conn.send(JSON.stringify({ type: 'welcome', id: conn.id, color, name }))
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

  onClose(conn: Party.Connection) {
    this.room.broadcast(JSON.stringify({ type: 'leave', id: conn.id }))
  }
}
