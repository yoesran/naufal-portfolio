import data from '@/data/public.json'

// PUBLIC, PII-FREE dataset only: names / relationships / roles. The full member
// directory (contacts, addresses, DOB) lives in Supabase, members-only, and is
// NEVER imported here — so it can never reach the public client bundle.
// Generated from the private seed: `node -e "...write data/public.json..."`
// (silsila + struktur + program_kerja + a plain anggota count, no records).
export interface Cucu {
  no: number
  nama: string
  pasangan: string
  catatan?: string
  cicit: string[]
}
export interface Anak {
  no: number
  nama: string
  pasangan: string
  cucu: Cucu[]
}
export interface Silsila {
  root: { ayah: string; ibu: string }
  anak: Anak[]
  keterangan: string[]
}
export interface Struktur {
  penasehat: string
  wakil_penasehat: string
  ketua: string
  wakil_ketua_1: string
  wakil_ketua_2: string
  sekretaris: string
  wakil_sekretaris: string
  bendahara: string
  wakil_bendahara: string
}
export interface ProgramItem {
  no: string
  nama_kegiatan: string
  tujuan: string
  waktu: string
  penanggung_jawab: string
}
interface PublicData {
  meta: Record<string, string>
  struktur: Struktur
  silsila: Silsila
  program_kerja: ProgramItem[]
  anggotaCount: number
}

const d = data as PublicData

export const struktur = d.struktur
export const silsila = d.silsila
export const programKerja = d.program_kerja

export const counts = {
  anak: silsila.anak.length,
  cucu: silsila.anak.reduce((n, a) => n + a.cucu.length, 0),
  cicit: silsila.anak.reduce(
    (n, a) => n + a.cucu.reduce((m, c) => m + c.cicit.length, 0),
    0
  ),
  anggota: d.anggotaCount,
}
