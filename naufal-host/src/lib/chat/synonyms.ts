import { EARLIER_KEYS } from '@/lib/experience'
import type { Locale } from '@/lib/i18n'

import type { Intent } from './types'

// The matching vocabulary. Deliberately data, not code — the engine
// (engine.ts) scores a query against these. Bilingual: English carries
// morphology poorly-but-fine via keyword lists; Indonesian leans on these
// keywords + entities (proper nouns like "DBS"/"React" are locale-invariant and
// do the heavy lifting), since ID affixation won't yield to light stemming.

// Tech entities → the canonical label used in the experience stacks, plus the
// query tokens that should resolve to it. (The tokenizer splits on non-alphanum,
// so "react.js" → "react" "js" — the bare token is enough.)
export const TECH: { id: string; match: string[] }[] = [
  { id: 'React', match: ['react', 'reactjs'] },
  { id: 'Next.js', match: ['next', 'nextjs'] },
  { id: 'TypeScript', match: ['typescript'] },
  { id: 'Svelte', match: ['svelte'] },
  { id: 'Angular', match: ['angular'] },
  { id: 'Vue', match: ['vue', 'vuejs'] },
  { id: 'Flutter', match: ['flutter'] },
  { id: 'JavaScript', match: ['javascript', 'vanilla'] },
  { id: 'Tailwind', match: ['tailwind', 'tailwindcss'] },
  {
    id: 'Module Federation',
    match: ['federation', 'microfrontend', 'microfrontends', 'mfe'],
  },
  { id: 'jQuery', match: ['jquery'] },
  { id: 'React Query', match: ['reactquery'] },
  // `jobsUsing` matches a tech id as a substring of an entry's stack/adds, so an
  // id here has to read exactly as it's spelled in experience.ts. These four are
  // the Infosys + Doubler toolchains; without them the bot falls through to
  // "I'm not sure" on a tech its own CV bullets name.
  { id: 'Material UI', match: ['materialui', 'mui', 'material'] },
  { id: 'Syncfusion', match: ['syncfusion'] },
  { id: 'Nunjucks', match: ['nunjucks'] },
  { id: 'Gulp', match: ['gulp'] },
]

// Companies that collapse into the "earlier roles" group (not first-class jobs in
// the experience registry). A query naming one routes to the earlier-roles answer.
// The locale keys double as the query tokens, so this reuses the registry's list
// rather than keeping a copy — a hand-copied one already drifted once (it still
// held `infosys` after Infosys was promoted to a first-class node).
export const EARLIER_COMPANIES: readonly string[] = EARLIER_KEYS

// Per-locale trigger keywords per intent. Scored by overlap with the query
// tokens. `experienceAt` / `techWith` / `compare` are entity-driven (see engine),
// so their keyword lists are light helpers, not the primary signal.
export const INTENT_KEYWORDS: Record<
  Locale,
  Partial<Record<Intent, string[]>>
> = {
  en: {
    greeting: ['hi', 'hello', 'hey', 'yo', 'greetings', 'sup'],
    about: [
      'who',
      'about',
      'yourself',
      'bio',
      'introduce',
      'tell',
      'background',
      'naufal',
    ],
    experienceOverall: [
      'experience',
      'work',
      'worked',
      'working',
      'career',
      'jobs',
      'companies',
      'history',
    ],
    experienceAt: ['at', 'role', 'did', 'do', 'doing'],
    stack: [
      'stack',
      'tech',
      'technology',
      'technologies',
      'tools',
      'skill',
      'skills',
      'languages',
      'know',
      'knows',
      'frameworks',
      'framework',
      'proficient',
    ],
    techWith: ['with', 'use', 'used', 'using', 'familiar'],
    compare: [
      'compare',
      'comparison',
      'versus',
      'vs',
      'difference',
      'differ',
      'between',
    ],
    availability: [
      'available',
      'availability',
      'hire',
      'hiring',
      'freelance',
      'open',
      'looking',
      'contact',
      'reach',
      'email',
      'touch',
      'recruit',
    ],
    education: [
      'education',
      'study',
      'studied',
      'degree',
      'university',
      'college',
      'school',
      'gpa',
      'graduate',
      'graduated',
      'major',
      'cum',
      'laude',
    ],
    posts: [
      'post',
      'posts',
      'blog',
      'article',
      'articles',
      'writing',
      'write',
      'writes',
      'wrote',
      'read',
    ],
    projects: [
      'project',
      'projects',
      'achievement',
      'achievements',
      'award',
      'awards',
      'side',
      'built',
      'bootcamp',
    ],
    isThisAI: [
      'ai',
      'llm',
      'gpt',
      'chatgpt',
      'bot',
      'robot',
      'model',
      'real',
      'human',
    ],
    help: ['help', 'commands', 'options', 'how'],
  },
  id: {
    greeting: ['halo', 'hai', 'hei', 'hey', 'pagi', 'malam'],
    about: [
      'siapa',
      'tentang',
      'perkenalkan',
      'kenalan',
      'latar',
      'ceritakan',
      'naufal',
    ],
    experienceOverall: [
      'pengalaman',
      'kerja',
      'bekerja',
      'karier',
      'karir',
      'perusahaan',
      'riwayat',
    ],
    experienceAt: ['di', 'peran', 'jabatan', 'ngapain'],
    stack: [
      'stack',
      'teknologi',
      'tools',
      'keahlian',
      'kemampuan',
      'skill',
      'bahasa',
      'framework',
      'kuasai',
      'bisa',
    ],
    techWith: ['dengan', 'pakai', 'memakai', 'menggunakan', 'pernah'],
    compare: [
      'banding',
      'bandingkan',
      'versus',
      'vs',
      'beda',
      'perbedaan',
      'antara',
    ],
    availability: [
      'tersedia',
      'ketersediaan',
      'rekrut',
      'merekrut',
      'freelance',
      'lowongan',
      'kontak',
      'hubungi',
      'email',
      'menghubungi',
    ],
    education: [
      'pendidikan',
      'kuliah',
      'belajar',
      'gelar',
      'universitas',
      'kampus',
      'sekolah',
      'ipk',
      'lulus',
      'jurusan',
    ],
    posts: ['tulisan', 'blog', 'artikel', 'menulis', 'baca', 'postingan'],
    projects: [
      'proyek',
      'pencapaian',
      'penghargaan',
      'prestasi',
      'bootcamp',
      'sampingan',
    ],
    isThisAI: [
      'ai',
      'llm',
      'gpt',
      'bot',
      'robot',
      'model',
      'beneran',
      'nyata',
      'manusia',
      'asli',
    ],
    help: ['bantuan', 'perintah', 'opsi', 'bagaimana', 'tolong'],
  },
}
