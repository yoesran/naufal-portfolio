// Regenerates data/public.json from the PRIVATE seed kept OUTSIDE the repo
// (default: ../badriyatim-seed/family.json next to the portfolio checkout;
// pass a path to override: `node scripts/build-public.mjs D:/somewhere/family.json`).
//
// This transform IS the privacy boundary: it copies the public-by-design
// sections (names/tree/struktur/program) verbatim and reduces the `anggota`
// records — contacts, addresses, birthdates — to a bare count. Never widen it
// without re-running the PII check in CLAUDE.md (build, then grep .next for a
// known phone number — must be zero).
import { readFileSync, writeFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

const here = dirname(fileURLToPath(import.meta.url))
const seedPath =
  process.argv[2] ?? resolve(here, '../../../badriyatim-seed/family.json')

const seed = JSON.parse(readFileSync(seedPath, 'utf8'))
const pub = {
  meta: seed.meta,
  struktur: seed.struktur,
  silsila: seed.silsila,
  program_kerja: seed.program_kerja,
  anggotaCount: seed.anggota.length,
}

// Tripwire: the output must never carry the member records themselves.
const out = JSON.stringify(pub, null, 2) + '\n'
if (out.includes('"anggota"'))
  throw new Error('anggota records leaked into public.json — aborting')

writeFileSync(resolve(here, '../data/public.json'), out)
console.log(
  `data/public.json ← ${seedPath} (anggotaCount ${pub.anggotaCount}, PII dropped)`
)
