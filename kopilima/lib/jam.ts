// Clock math — the site's one load-bearing computation. Everything renders
// from the visitor's clock converted to WITA (UTC+8): a static export can't
// know "now", so this must run in the browser (mount effect; placeholders
// render first). Pure functions, asserted by tests/smoke.spec.ts.
import { type Cabang } from './content'

export const WITA_OFFSET_MIN = 8 * 60

// Menit-of-day WITA dari jam perangkat pengunjung (zona apa pun).
export const witaNow = (d = new Date()) =>
  (d.getUTCHours() * 60 + d.getUTCMinutes() + WITA_OFFSET_MIN) % 1440

export const hhmm = (m: number) =>
  String(Math.floor(m / 60)).padStart(2, '0') +
  '.' +
  String(m % 60).padStart(2, '0')

// buka === tutup → 24 jam; buka > tutup → lewat tengah malam.
export const isBuka = (c: Pick<Cabang, 'buka' | 'tutup'>, m: number) =>
  c.buka === c.tutup ||
  (c.buka < c.tutup ? m >= c.buka && m < c.tutup : m >= c.buka || m < c.tutup)

// Durasi dari `from` ke `to` (menit-of-day, membungkus tengah malam).
export const lagi = (from: number, to: number) => {
  const d = (to - from + 1440) % 1440
  const h = Math.floor(d / 60)
  const mn = d % 60
  return h > 0 ? (mn > 0 ? `${h} jam ${mn} mnt` : `${h} jam`) : `${mn} mnt`
}

// Suasana halaman: siang (05.00–18.00) / malam. Dipakai data-fase di <html>
// (CSS yang menurunkan palet) — lihat fase-boot.ts untuk cap pra-paint.
export type Fase = 'siang' | 'malam'
export const fase = (m: number): Fase =>
  m >= 300 && m < 1080 ? 'siang' : 'malam'

// haversine — cukup akurat untuk jarak dalam kota
export const kmTo = (
  pos: { lat: number; lon: number },
  c: { lat: number; lon: number }
) => {
  const R = 6371
  const r = Math.PI / 180
  const dLat = (c.lat - pos.lat) * r
  const dLon = (c.lon - pos.lon) * r
  const a =
    Math.sin(dLat / 2) ** 2 +
    Math.cos(pos.lat * r) * Math.cos(c.lat * r) * Math.sin(dLon / 2) ** 2
  return 2 * R * Math.asin(Math.sqrt(a))
}
