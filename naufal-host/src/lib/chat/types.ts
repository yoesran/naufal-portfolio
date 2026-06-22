import type { Locale } from '@/lib/i18n'

// --- The published blog contract (reader side) -------------------------------
// The blog publishes knowledge.json (see naufal-blog/src/lib/knowledge.ts). The
// two apps share no package, so we re-declare the shape we consume here — the
// same approach as QualityBlock's `Health` vs the reports script. `version` is
// guarded at fetch time so a future shape bump fails closed (degrade) rather than
// rendering garbage.
export type BlogCv = {
  contact: { location: string; email: string; linkedin: string }
  experience: {
    company: string
    industry: string
    location: string
    roles: { title: string; dates: string }[]
    bullets: string[]
  }[]
  compactRoles: { company: string; rest: string; dates: string }[]
  education: {
    school: string
    degree: string
    dates: string
    bullets: string[]
  }
  achievements: { lead: string; rest: string }[]
  skills: string
}
export type BlogPost = {
  slug: string
  date: string
  title: Record<Locale, string>
  description: Record<Locale, string>
  body: Record<Locale, string>
}
export type BlogKnowledge = {
  version: 1
  generatedAt: string
  cv: Record<Locale, BlogCv>
  posts: BlogPost[]
}

// --- The unified knowledge base the engine queries ---------------------------
// Merged from two sources: the host's own experience registry + i18n (always
// present), and the fetched blog knowledge (may be absent → `blogReady` false,
// answers degrade gracefully). All prose is already in the active locale.
export type Job = {
  slug: string // 'dbs'
  company: string // 'DBS Bank Indonesia'
  short: string // 'DBS'
  period: string // localized, e.g. "Feb 2026 – Present"
  role: string // localized
  industry: string // localized
  summary: string // localized
  stack: string[]
  adds: string[]
  url?: string
  story?: string // blog /work/<slug> (deep link), when present
  bullets?: string[] // CV enrichment, matched by company (blog only)
}

export type Post = {
  slug: string
  date: string
  title: string
  description: string
  body?: string // cleaned passage text (blog only); drives content retrieval
}

export type KB = {
  locale: Locale
  blogReady: boolean
  name: string
  github: string
  jobs: Job[] // newest first
  earlierLabel: string // localized "earlier roles" heading
  earlier: string[] // localized one-liners for the collapsed early roles
  // blog-sourced (undefined until the blog knowledge merges in):
  location?: string
  email?: string
  linkedin?: string
  education?: {
    school: string
    degree: string
    dates: string
    bullets: string[]
  }
  achievements?: { lead: string; rest: string }[]
  skills?: string[]
  posts: Post[]
}

// --- Engine I/O --------------------------------------------------------------
export type AnswerLink = { label: string; href: string }
export type Answer = {
  text: string // may be multi-line (\n\n between paragraphs)
  links?: AnswerLink[]
  suggestions?: string[] // follow-up question strings → rendered as chips
}

export type Entity =
  | { type: 'job'; slug: string }
  | { type: 'earlier' }
  | { type: 'tech'; id: string }

export type Intent =
  | 'greeting'
  | 'about'
  | 'experienceOverall'
  | 'experienceAt'
  | 'stack'
  | 'techWith'
  | 'compare'
  | 'availability'
  | 'education'
  | 'posts'
  | 'projects'
  | 'isThisAI'
  | 'help'
  | 'fallback'

// Carried between turns so a follow-up ("and there?", "what stack?") resolves
// against the last thing discussed.
export type ChatContext = { lastJob?: string; lastTech?: string }
