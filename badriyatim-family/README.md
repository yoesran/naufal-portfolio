# Badriyatim Family

Aplikasi web privat untuk keluarga besar keturunan **Badriyatim & Anizir**
(keluarga Minangkabau dari Gasang, Sumatera Barat — 90+ anggota di seluruh
Indonesia), lahir dari rencana _pulang basamo_ 2026.

**Tesis produk:** aplikasi baru tidak akan menghidupkan obrolan (grup WA-nya
saja sepi) — jadi bangun yang WhatsApp _tidak bisa_: **silsilah** interaktif,
**acara + RSVP**, **transparansi iuran**, dan **arsip foto/cerita**. Bukan chat.

## Stack

- **Next.js 16** (App Router, React Compiler on) · **Tailwind v4** ·
  **shadcn/ui** rasa **Base UI** (bukan Radix — `multiple` bukan `type`,
  `render` bukan `asChild`)
- **Supabase** (Fase 2): magic link undangan-saja, direktori anggota, iuran
- Desain **"Songket & Rumah Gadang"**: marun/emas/gading, Fraunces + Plus
  Jakarta Sans, motif gonjong. Satu bahasa (Indonesia) — tanpa i18n, disengaja.

## Privasi (tidak bisa ditawar)

- **Publik** = nama, pohon silsilah, struktur, tentang. **Members-only** =
  kontak, alamat, tanggal lahir anak-anak.
- Halaman publik hanya mengimpor `data/public.json` (bebas PII). Seed lengkap
  `data/family.json` **di-gitignore** (lokal → Supabase saja) dan tidak boleh
  diimpor kode klien mana pun — satu impor JSON membundel seluruh isinya.
- Cek setelah perubahan: `npm run build`, lalu grep `.next` untuk satu nomor
  telepon yang dikenal — harus nol.

## Menjalankan

```bash
npm install
cp .env.local.example .env.local   # isi URL + anon key Supabase (lihat bawah)
npm run dev
```

`.env.local` butuh `NEXT_PUBLIC_SUPABASE_URL` dan
`NEXT_PUBLIC_SUPABASE_ANON_KEY` (anon/publishable — aman di klien, dijaga RLS).
Kunci service-role **tidak pernah** ada di repo ini.

Login itu undangan-saja (`shouldCreateUser: false`): untuk mencoba, daftarkan
emailmu sebagai user lewat dashboard Supabase dulu.

```bash
npm run lint          # eslint
npm run format:check  # prettier
npm run test:e2e      # playwright smoke (build + start otomatis)
```

## Fase

1. ✅ Situs publik: Beranda, Struktur, Silsilah (radial/pohon/daftar), Tentang
2. 🚧 Auth Supabase (selesai) → direktori anggota → **Keuangan & Iuran** → acara

Deploy butuh runtime Node/SSR (proxy + halaman dinamis) — Vercel free atau
Cloudflare via OpenNext, bukan static Pages.
