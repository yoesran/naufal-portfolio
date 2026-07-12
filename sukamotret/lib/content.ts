// Single source of the site's content. Everything a launch needs to change
// lives here — no CMS, no env, one typed file.
//
// ── DUMMY DATA ──────────────────────────────────────────────────────────────
// Coordinates + the maps link are REAL (from the studio's Google Maps pin).
// Still placeholder until confirmed: hours, phone, socials (from public
// search); prices are invented; portfolio items are gradient tiles awaiting
// photos. The WhatsApp number is deliberately fake so a stray click can't
// message a real phone. See the launch checklist in README.md.
// ────────────────────────────────────────────────────────────────────────────

export const STUDIO = {
  name: 'Sukamotret',
  tagline: 'Turning Moment Into Memories',
  // SUKAMOTRET STUDIO pin, Tabalong — South Kalimantan (WITA, UTC+8).
  // Real: the sun math runs on these, so they must be the actual location.
  lat: -2.17765,
  lon: 115.3806438,
  utcOffsetHours: 8,
  timeZone: 'Asia/Makassar',
  location: 'Tabalong, Kalimantan Selatan',
  regionLine: 'Tabalong · Banjarmasin · Kalimantan Selatan',
  mapsUrl: 'https://maps.app.goo.gl/zpuFQutcaFbbb4Qg9',
  // canonical origin — swap once here when a custom domain lands
  siteUrl: 'https://sukamotret.pages.dev',
  hours: 'Senin–Minggu\n09.00–22.00',
  // DUMMY: obviously-fake number; the real one goes here at launch.
  whatsapp: '6280000000000',
  instagram: ['@sukamotretid', '@sukamotretstudio'],
  tiktok: '@sukamotret.id',
} as const

// Looks shared by the simulator, the photo editor, and the WhatsApp brief.
// Parameterized by intensity (0–1): every amount scales linearly from the
// identity filter, so 0 is always a no-op and 1 is the designed grade.
// Applied as element styles for display; ctx.filter only for the download
// (Safari guard in the editor). These are film/analog presets, not face
// filters — the tasteful read of "an Instagram effect" for a photo studio
// (Instagram's own famous filters were film emulations). Every look composes
// through the same pipeline, so a new one is one line here and nothing else.
export const LOOKS = {
  Hangat: (t: number) =>
    `sepia(${0.28 * t}) saturate(${1 + 0.2 * t}) contrast(${1 + 0.05 * t})`,
  Netral: () => 'none',
  Sinema: (t: number) =>
    `contrast(${1 + 0.12 * t}) saturate(${1 + 0.12 * t}) sepia(${0.08 * t}) hue-rotate(${-5 * t}deg)`,
  Pudar: (t: number) =>
    `contrast(${1 - 0.18 * t}) brightness(${1 + 0.08 * t}) sepia(${0.16 * t}) saturate(${1 - 0.08 * t})`,
  Klasik: (t: number) =>
    `sepia(${0.5 * t}) contrast(${1 + 0.08 * t}) saturate(${1 + 0.08 * t})`,
  'Blue Hour': (t: number) =>
    `hue-rotate(${-14 * t}deg) saturate(${1 - 0.15 * t}) brightness(${1 - 0.05 * t})`,
  'Hitam Putih': (t: number) => `grayscale(${t}) contrast(${1 + 0.15 * t})`,
} as const
export type Look = keyof typeof LOOKS
export const DEFAULT_LOOK: Look = 'Hangat'

export const lookFilter = (look: Look, intensity = 100) =>
  LOOKS[look](intensity / 100)

// Session builder options. [label, price] / [label, multiplier].
// DUMMY prices — the studio sets the real ones.
export const OCCASIONS = [
  ['Prewedding', 1_500_000],
  ['Wedding', 4_500_000],
  ['Wisuda', 500_000],
  ['Keluarga', 800_000],
  ['Maternity', 900_000],
  ['Produk', 1_200_000],
] as const

export const LOCATIONS = [
  ['Studio', 1],
  ['Outdoor', 1.25],
  ['Venue', 1.4],
] as const
export type LocationLabel = (typeof LOCATIONS)[number][0]

export const DURATIONS = [
  ['1 jam', 1],
  ['2 jam', 1.6],
  ['Setengah hari', 2.6],
  ['Sehari', 4],
] as const

export const ADDONS = [
  ['Photobooth', 800_000],
  ['MUA', 700_000],
  ['Videografi', 1_500_000],
  ['Album cetak', 450_000],
] as const

// Contact-sheet portfolio. DUMMY: category-tinted gradient tiles standing in
// for real photos — swap `PORTFOLIO` for image imports when they arrive.
export const CATEGORIES = [
  'prewedding',
  'wisuda',
  'keluarga',
  'maternity',
  'acara',
] as const
type Category = (typeof CATEGORIES)[number]

const HUES: Record<Category, number> = {
  prewedding: 28,
  wisuda: 12,
  keluarga: 40,
  maternity: 340,
  acara: 196,
}

export type Shot = { n: number; cat: Category }
export const PORTFOLIO: Shot[] = Array.from({ length: 12 }, (_, i) => ({
  n: i + 1,
  cat: CATEGORIES[i % CATEGORIES.length],
}))

// Deterministic per-tile gradient — the photo placeholder.
export function tileGradient(s: Shot): string {
  const h = HUES[s.cat]
  return `linear-gradient(${140 + s.n * 7}deg,
    hsl(${h} 42% ${18 + (s.n % 4) * 7}%),
    hsl(${(h + 26) % 360} 30% ${44 + (s.n % 3) * 8}%))`
}

export const frameNo = (n: number) => String(n).padStart(2, '0') + 'A'

// Pose guide — the studio's real value is direction: most clients freeze
// because they don't know what to do with their hands. Each card is a
// pictogram + a one-line instruction in plain Bahasa, tagged to the sessions
// it suits. `figure` keys into the SVG map in components/pose-guide.tsx.
export const POSE_OCCASIONS = [
  'Semua',
  'Prewedding',
  'Wisuda',
  'Keluarga',
  'Maternity',
] as const
export type PoseOccasion = Exclude<(typeof POSE_OCCASIONS)[number], 'Semua'>

// Closed set shared with the SVG map in components/pose-guide.tsx — a typo'd
// key would otherwise render an empty stage silently.
export type FigureId = 'walk' | 'face' | 'cap' | 'sit' | 'belly' | 'pocket'

export type Pose = {
  id: string
  name: string
  figure: FigureId
  occasions: PoseOccasion[]
  tip: string
}

export const POSES: Pose[] = [
  {
    id: 'jalan',
    name: 'Jalan santai',
    figure: 'walk',
    occasions: ['Prewedding', 'Keluarga'],
    tip: 'Jalan pelan sambil mengobrol, jangan menatap kamera — biar momennya terasa natural, bukan berpose.',
  },
  {
    id: 'tatap',
    name: 'Saling menatap',
    figure: 'face',
    occasions: ['Prewedding'],
    tip: 'Berhadapan, dahi nyaris bersentuhan, mata terpejam sejenak — mesra tanpa terlihat kaku.',
  },
  {
    id: 'toga',
    name: 'Lempar toga',
    figure: 'cap',
    occasions: ['Wisuda'],
    tip: 'Lempar toga tepat saat aba-aba, dagu sedikit naik, tawa dilepas — jangan ditahan.',
  },
  {
    id: 'duduk',
    name: 'Duduk bersandar',
    figure: 'sit',
    occasions: ['Keluarga', 'Maternity'],
    tip: 'Duduk rapat, badan sedikit condong ke tengah — keluarga jadi terlihat hangat dan menyatu.',
  },
  {
    id: 'perut',
    name: 'Memeluk perut',
    figure: 'belly',
    occasions: ['Maternity'],
    tip: 'Kedua tangan memeluk perut, tubuh ¾ menghadap cahaya, bahu turun — lembut dan tenang.',
  },
  {
    id: 'saku',
    name: 'Tangan di saku',
    figure: 'pocket',
    occasions: ['Wisuda', 'Prewedding'],
    tip: 'Satu tangan di saku, bahu rileks, berat badan bertumpu ke satu kaki — santai tapi rapi.',
  },
]

// Estimate rounded to the nearest 50k — reads as an estimate, not a quote.
export const rupiah = (n: number) =>
  'Rp' + (Math.round(n / 50_000) * 50_000).toLocaleString('id-ID')
