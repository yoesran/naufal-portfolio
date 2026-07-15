// Single source of the site's content — no CMS, no env, one typed file.
//
// ── WHAT'S REAL vs DUMMY ────────────────────────────────────────────────────
// REAL (from @kopilima.idn, 2026-07-12): brand palette/motifs, "Daily
// Cruisin'", NO FRANCHISE, branch codes + hours (bio), menu names +
// descriptions (".our menu" highlight, 2023–24), 15K flat for drinks,
// cheesecake = Lima Garden only, DM + Grab as order channels.
// DUMMY until the owner confirms: wifi/colokan/suasana per branch, branch
// coordinates, branch opening years, the reservation branch + floor plan,
// food prices, drink recipes (interpretation of menu copy), photos.
// ────────────────────────────────────────────────────────────────────────────

export const BRAND = {
  nama: 'Kopi Lima',
  tagline: 'Daily Cruisin’',
  ig: 'kopilima.idn',
  igUrl: 'https://www.instagram.com/kopilima.idn/',
  dmUrl: 'https://ig.me/m/kopilima.idn',
  grabUrl: 'https://r.grab.com/g/2-1-6-C6MJAVBHCX2KJN',
  entity: 'PT Lima Brews Indonesia',
  // WEB-5 rides every composed brief: DM can't be prefilled, so a copy-pasted
  // code is the lead counter — this site's "Dari website."
  kode: 'WEB-5',
} as const

// Jam dalam menit-of-day WITA (bio IG). buka === tutup → 24 jam.
export type Cabang = {
  kode: string
  kota: 'Balikpapan' | 'Samarinda'
  tempat: string
  buka: number
  tutup: number
  // DUMMY — rough pins. They are the source of the "±km" figures and the
  // nearest-city ordering, so they must become the real Maps pins before launch.
  lat: number
  lon: number
  mapsUrl: string
  // DUMMY — the vibe matcher's whole value rides on these being true.
  wifi: number
  colokan: 'banyak' | 'cukup' | 'sedikit'
  suasana: string
  cocok: Vibe[]
}

export type Vibe = 'nugas' | 'nongkrong' | 'cepat' | 'malam'

export const CABANG: Cabang[] = [
  {
    kode: 'Lima BB',
    kota: 'Balikpapan',
    tempat: 'Balikpapan Baru',
    buka: 0,
    tutup: 0,
    lat: -1.222,
    lon: 116.877,
    mapsUrl: 'https://maps.google.com/?q=kopi+lima+balikpapan+baru',
    wifi: 40,
    colokan: 'banyak',
    suasana: 'indoor AC + teras',
    cocok: ['nugas', 'malam', 'nongkrong'],
  },
  {
    kode: 'Lima GC',
    kota: 'Balikpapan',
    tempat: 'Grand City',
    buka: 420,
    tutup: 1380,
    lat: -1.211,
    lon: 116.888,
    mapsUrl: 'https://maps.google.com/?q=kopi+lima+grand+city+balikpapan',
    wifi: 25,
    colokan: 'cukup',
    suasana: 'food-center, rame',
    cocok: ['nongkrong', 'cepat'],
  },
  {
    kode: 'Lima Wave',
    kota: 'Balikpapan',
    tempat: 'LW — lokasi perlu konfirmasi',
    buka: 0,
    tutup: 0,
    lat: -1.265,
    lon: 116.83,
    mapsUrl: 'https://maps.google.com/?q=kopi+lima+balikpapan',
    wifi: 15,
    colokan: 'sedikit',
    suasana: 'outdoor, angin laut',
    cocok: ['nongkrong', 'malam'],
  },
  {
    kode: 'Lima Citra',
    kota: 'Samarinda',
    tempat: 'Kultur, Citra Niaga',
    buka: 300,
    tutup: 1380,
    lat: -0.497,
    lon: 117.145,
    mapsUrl: 'https://maps.google.com/?q=kopi+lima+citra+niaga+samarinda',
    wifi: 30,
    colokan: 'cukup',
    suasana: 'semi-indoor, cozy',
    cocok: ['nugas', 'nongkrong'],
  },
  {
    kode: 'Lima Alaya',
    kota: 'Samarinda',
    tempat: 'Lokalaya, Bukit Alaya',
    buka: 0,
    tutup: 0,
    lat: -0.47,
    lon: 117.13,
    mapsUrl: 'https://maps.google.com/?q=kopi+lima+alaya+samarinda',
    wifi: 50,
    colokan: 'banyak',
    suasana: 'luas, tenang subuh',
    cocok: ['nugas', 'malam', 'cepat'],
  },
]

export const VIBES: [Vibe, string][] = [
  ['nugas', '💻 Mau nugas / WFC'],
  ['nongkrong', '🗣️ Nongkrong bareng'],
  ['cepat', '🏍️ Ambil cepat'],
  ['malam', '🌙 Jam 2 pagi'],
]

export const VIBE_WHY: Record<Vibe, (c: Cabang) => string> = {
  nugas: (c) => `wifi ${c.wifi} Mbps · colokan ${c.colokan}`,
  nongkrong: (c) => c.suasana,
  cepat: (c) => `pesan → jadi, ${c.suasana}`,
  malam: (c) =>
    c.buka === c.tutup ? 'nggak pernah tutup' : 'tutup lebih awal',
}

// Menu dari highlight ".our menu" (2023–24) — daftar terbaru perlu dicek.
// Layers = interpretasi visual dari deskripsi menu, BUKAN resep dapur.
// harga null → belum tahu (makanan belum tentu 15K).
export type Sajian = {
  nama: string
  jenis: 'kopi' | 'non-kopi' | 'makanan'
  sig?: boolean
  hanya?: string // kode cabang — item khusus cabang (cheesecake: real, dari IG)
  desc: string
  harga: number | null
  layers: [nama: string, warna: string, tinggiPct: number][]
  fotoc?: string[] // placeholder-gradient colours when there are no layers
}

export const MENU: Sajian[] = [
  {
    nama: 'Lima Palma',
    jenis: 'kopi',
    sig: true,
    harga: 15000,
    desc: 'Espresso + gula aren. Yang bikin ngantri dari zaman gerobak.',
    layers: [
      ['es', '#dfe9f2', 18],
      ['susu', '#f2ead9', 30],
      ['gula aren', '#8a5a1e', 18],
      ['espresso', '#3a2417', 24],
    ],
  },
  {
    nama: 'Sunny Honey',
    jenis: 'kopi',
    sig: true,
    harga: 15000,
    desc: 'Espresso, madu, soda — sparkling, buat siang panas.',
    layers: [
      ['soda', '#f7edc9', 30],
      ['madu', '#d99a26', 16],
      ['espresso', '#3a2417', 24],
      ['es', '#dfe9f2', 14],
    ],
  },
  {
    nama: 'Lima Daily',
    jenis: 'kopi',
    sig: true,
    harga: 15000,
    desc: 'Espresso + susu kental. Harian, aman, kesukaan semua.',
    layers: [
      ['es', '#dfe9f2', 16],
      ['susu kental', '#f6efdd', 38],
      ['espresso', '#3a2417', 26],
    ],
  },
  {
    nama: 'Lima Special',
    jenis: 'kopi',
    sig: true,
    harga: 15000,
    desc: 'Espresso + racikan spesial rumah. Rahasia dapur.',
    layers: [
      ['es', '#dfe9f2', 16],
      ['racikan', '#c9803a', 30],
      ['espresso', '#3a2417', 28],
    ],
  },
  {
    nama: 'Lima Kara',
    jenis: 'kopi',
    harga: 15000,
    desc: 'Caramel latte — manis karamel yang nggak norak.',
    layers: [
      ['es', '#dfe9f2', 16],
      ['susu', '#f2ead9', 34],
      ['karamel', '#b06a1c', 14],
      ['espresso', '#3a2417', 20],
    ],
  },
  {
    nama: 'Lima Pandan',
    jenis: 'kopi',
    harga: 15000,
    desc: 'Espresso, pandan, susu kental — twist lokal.',
    layers: [
      ['es', '#dfe9f2', 14],
      ['susu', '#f2ead9', 28],
      ['pandan', '#5a9b52', 20],
      ['espresso', '#3a2417', 22],
    ],
  },
  {
    nama: 'Lima Stroffee',
    jenis: 'kopi',
    harga: 15000,
    desc: 'Stroberi ketemu latte. Kedengarannya aneh, rasanya laris.',
    layers: [
      ['es', '#dfe9f2', 14],
      ['susu', '#f2ead9', 30],
      ['stroberi', '#d4526b', 20],
      ['espresso', '#3a2417', 20],
    ],
  },
  {
    nama: 'Lima Mocha',
    jenis: 'kopi',
    harga: 15000,
    desc: 'Espresso × coklat, porsi seimbang.',
    layers: [
      ['es', '#dfe9f2', 14],
      ['susu', '#f2ead9', 28],
      ['coklat', '#5b3a24', 22],
      ['espresso', '#3a2417', 20],
    ],
  },
  {
    nama: 'Lima Salted',
    jenis: 'kopi',
    harga: 15000,
    desc: 'Salted caramel — asin tipis di belakang manis.',
    layers: [
      ['es', '#dfe9f2', 14],
      ['susu', '#f2ead9', 30],
      ['salted caramel', '#c08030', 20],
      ['espresso', '#3a2417', 20],
    ],
  },
  {
    nama: 'Lima Sunkissed',
    jenis: 'non-kopi',
    harga: 15000,
    desc: 'Mocktail espresso + jeruk sunkist. Seger, buat sore.',
    layers: [
      ['soda jeruk', '#f2c14e', 40],
      ['es', '#dfe9f2', 20],
      ['espresso', '#3a2417', 18],
    ],
  },
  {
    nama: 'Lima Milktea',
    jenis: 'non-kopi',
    harga: 15000,
    desc: 'Milk tea buat yang nemenin doang.',
    layers: [
      ['es', '#dfe9f2', 16],
      ['susu', '#f2ead9', 34],
      ['teh', '#9a5f2e', 28],
    ],
  },
  {
    nama: 'Lima Chocou',
    jenis: 'non-kopi',
    harga: 15000,
    desc: 'Coklat, tanpa kopi, tanpa drama.',
    layers: [
      ['es', '#dfe9f2', 16],
      ['susu', '#f2ead9', 30],
      ['coklat', '#5b3a24', 32],
    ],
  },
  {
    nama: 'ChiPop',
    jenis: 'makanan',
    harga: null,
    desc: 'Popcorn chicken di atas nasi, pilihan saus. Dari IG: “Enaknya Nggak Bisa Stop.”',
    layers: [],
    fotoc: ['#2437c9', '#f2c14e', '#c9803a'],
  },
  {
    nama: 'Lima Cheesecake',
    jenis: 'makanan',
    harga: null,
    hanya: 'Lima Garden',
    desc: 'Original · Oreo · Salted · Chocolate. Di IG tertulis “Available only at Lima Garden”.',
    layers: [],
    fotoc: ['#f6e7c8', '#d99a26', '#5b3a24'],
  },
]

// Placeholder foto: gradient dari warna lapisan minumannya sendiri — slot
// foto asli tinggal ganti ke <Image> saat pemilik kirim.
export const fotoCss = (s: Sajian) =>
  `linear-gradient(150deg, ${(s.fotoc ?? s.layers.map((L) => L[1])).join(', ')})`

// Babak = pembukaan tiap cabang di jalan gerobak.
// TAHUN & URUTAN = PERKIRAAN — konfirmasi pemilik sebelum launch.
export const CERITA: { thn: string; label: string; txt: string }[] = [
  {
    thn: 'Feb 2024',
    label: 'GEROBAK',
    txt: 'Trial opening: satu gerobak belang biru-putih di Balikpapan Baru, kursi lipat di trotoar.',
  },
  {
    thn: '2024',
    label: 'LIMA BB',
    txt: 'Gerobak jadi kios permanen — Lima BB, Balikpapan Baru. Sekarang 24 jam.',
  },
  {
    thn: '2024',
    label: 'LIMA GC',
    txt: 'Masuk Grand City. Mulai ada yang meniru — jawabannya masuk bio: NO FRANCHISE.',
  },
  {
    thn: '2025',
    label: 'LIMA WAVE',
    txt: 'Lima Wave menyusul di Balikpapan. (urutan & tanggal tiap cabang: perkiraan, perlu konfirmasi)',
  },
  {
    thn: '2025',
    label: 'LIMA CITRA',
    txt: 'Nyeberang ke Samarinda — Kultur, Citra Niaga. Kota kedua, resep sama.',
  },
  {
    thn: '2025',
    label: 'LIMA ALAYA',
    txt: 'Lokalaya, Bukit Alaya — langsung 24 jam.',
  },
  {
    thn: '2026',
    label: 'HARI INI',
    txt: 'Lima pit stop, dua kota, tiga di antaranya tidak pernah tutup. Daily Cruisin’.',
  },
]

// Reservasi — DUMMY seluruhnya: cabang mana yang menerima reservasi belum
// dikonfirmasi (sketsa pakai Lima Alaya), dan denah ini fiksi. Ketersediaan
// meja real-time TIDAK dijanjikan — pilihan meja hanya preferensi yang ikut
// ke DM.
//
// ── DENAH = GRID, BUKAN PERSEN ──────────────────────────────────────────────
// The room is a plain CSS grid (PLAN.kolom × PLAN.baris). Everything in it —
// tables AND fixtures (bar, pintu, jendela) — is placed with integer cells:
//   kol/bar = 1-based top-left cell, lebar/tinggi = how many cells it spans.
// When the owner re-arranges the room, you retype small integers on a grid;
// nothing else in the component changes. Bump PLAN if the room needs a
// finer mesh. (The old version used %-of-box coordinates — unmaintainable.)
export const RESV_CABANG = 'Lima Alaya'

export const PLAN = { kolom: 12, baris: 8 } as const

type Sel = { kol: number; bar: number; lebar?: number; tinggi?: number }

export type Meja = Sel & {
  id: string
  kursi: number
  bulat?: boolean
  zona: string
  terisi?: boolean // contoh visual — BUKAN status live
}

// Fixtures: the room's furniture that isn't bookable.
export type Fitur = Sel & { jenis: 'bar' | 'pintu' | 'jendela'; label: string }

export const FITUR: Fitur[] = [
  { jenis: 'bar', label: 'BAR · KASIR', kol: 5, bar: 1, lebar: 4 },
  { jenis: 'jendela', label: 'JENDELA', kol: 1, bar: 3, tinggi: 5 },
  { jenis: 'pintu', label: 'MASUK', kol: 10, bar: 8, lebar: 2 },
]

export const MEJA: Meja[] = [
  // bar stools
  { id: 'B1', kol: 6, bar: 2, kursi: 1, bulat: true, zona: 'bar' },
  {
    id: 'B2',
    kol: 7,
    bar: 2,
    kursi: 1,
    bulat: true,
    zona: 'bar',
    terisi: true,
  },
  // window two-tops
  { id: 'M1', kol: 2, bar: 3, kursi: 2, bulat: true, zona: 'jendela' },
  { id: 'M2', kol: 2, bar: 5, kursi: 2, bulat: true, zona: 'jendela' },
  {
    id: 'M3',
    kol: 2,
    bar: 7,
    kursi: 2,
    bulat: true,
    zona: 'jendela',
    terisi: true,
  },
  // middle four-tops
  { id: 'M4', kol: 5, bar: 4, lebar: 2, kursi: 4, zona: 'tengah' },
  {
    id: 'M5',
    kol: 5,
    bar: 6,
    lebar: 2,
    kursi: 4,
    zona: 'tengah',
    terisi: true,
  },
  // corner six-tops
  { id: 'M6', kol: 9, bar: 3, lebar: 3, kursi: 6, zona: 'sudut rapat' },
  { id: 'M7', kol: 9, bar: 6, lebar: 3, kursi: 6, zona: 'sudut rapat' },
]

// grid-area shorthand: row / col / row-end / col-end
export const gridArea = (s: Sel) =>
  `${s.bar} / ${s.kol} / ${s.bar + (s.tinggi ?? 1)} / ${s.kol + (s.lebar ?? 1)}`

// Borongan — 15K flat bikin totalnya satu perkalian, itu pertunjukannya.
export const BULK_TIERS: [number, string][] = [
  [5, 'buat circle nugas'],
  [15, 'buat satu tim'],
  [30, 'buat rapat kantor'],
  [60, 'buat acara komunitas'],
  [120, 'buat hajatan'],
  [250, 'sehari gerobak dulu, dalam satu pesanan'],
]

export const rupiah = (n: number) => 'Rp' + n.toLocaleString('id-ID')
