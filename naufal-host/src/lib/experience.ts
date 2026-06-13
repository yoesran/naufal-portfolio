import angularSvg from '@/assets/tech-stacks/angular.svg?raw'
import jsSvg from '@/assets/tech-stacks/javascript.svg?raw'
import mfSvg from '@/assets/tech-stacks/module-federation.svg?raw'
import nextSvg from '@/assets/tech-stacks/nextdotjs.svg?raw'
import reactSvg from '@/assets/tech-stacks/react.svg?raw'
import type { MountFn } from '@/components/RemoteMount'

// The experience block's registry — a curated highlight set, deliberately NOT
// shared with the blog's cv-data.ts (each app owns its own data, same rule as
// i18n; the CV stays the factual source of truth). Translated text (role
// titles, summaries, commit messages, industry tags) lives in the locale files
// keyed by slug; this holds the locale-invariant facts (company, dates, stack,
// site URL, toolbox `adds`, node glyph) and the per-entry capabilities:
//   - `story` (a blog /work/<story> slug) lights up the "read the story" link
//   - `demo` (a federated mount loader) lights up the "run the demo" button
// Both are optional so the block ships before any story/demo exists and each
// later addition is a one-field change here.
export type ExperienceSlug = 'dbs' | 'edot' | 'ajaib' | 'danamon' | 'doubler'

export type ExperienceEntry = {
  slug: ExperienceSlug
  company: string
  short: string // node label on the career line
  url: string // company site (no protocol; linked out from the panel)
  start: string // ISO yyyy-mm; formatted per locale in the block
  end?: string // absent = present
  stack: string[] // literal tech identifiers
  // What this job ADDED to the toolbox vs everything before it — the curated
  // delta, shown as a git-diffstat-style '+ tool' line in the panel.
  adds: string[]
  glyph: string // node icon (tech-stack svg raw)
  glyphColor: string
  badge?: string // secondary mark, LiveRemote DiagramNode style
  badgeColor?: string
  story?: string
  demo?: { load: () => Promise<{ default: MountFn }> }
}

export const EXPERIENCE: ExperienceEntry[] = [
  {
    slug: 'dbs',
    company: 'DBS Bank Indonesia',
    short: 'DBS',
    url: 'dbs.id',
    start: '2026-02',
    stack: ['React', 'Module Federation', 'webview'],
    adds: ['module federation'],
    glyph: reactSvg,
    glyphColor: '#61DAFB',
    badge: mfSvg,
  },
  {
    slug: 'edot',
    company: 'eDOT',
    short: 'eDOT',
    url: 'edot.id',
    start: '2025-12',
    end: '2026-04',
    stack: ['Next.js', 'React Query', 'shadcn/ui'],
    adds: ['react query', 'shadcn/ui', 'react hook form', 'zod'],
    glyph: nextSvg,
    glyphColor: 'var(--foreground)',
  },
  {
    slug: 'ajaib',
    company: 'Ajaib',
    short: 'Ajaib',
    url: 'ajaib.co.id',
    start: '2025-08',
    end: '2026-02',
    stack: ['Next.js', 'SSR/SSG', 'webview'],
    adds: ['ssr/ssg', 'seo', 'wordpress migration'],
    glyph: nextSvg,
    glyphColor: 'var(--foreground)',
  },
  {
    slug: 'danamon',
    company: 'Bank Danamon',
    short: 'Danamon',
    url: 'danamon.co.id',
    start: '2024-08',
    end: '2025-08',
    stack: ['React', 'Angular', 'Single-SPA → NX'],
    adds: ['angular', 'single-spa', 'nx'],
    glyph: angularSvg,
    glyphColor: '#DD0031',
    badge: reactSvg,
    badgeColor: '#61DAFB',
  },
  {
    slug: 'doubler',
    company: 'Doubler Studio',
    short: 'Doubler',
    url: 'doubler.studio',
    start: '2023-10',
    end: '2025-08',
    stack: ['vanilla JS', 'jQuery', 'React', 'Next.js'],
    adds: ['jquery', 'nunjucks', 'tailwind', 'bootstrap'],
    glyph: jsSvg,
    glyphColor: '#F7DF1E',
  },
]

// The compact "earlier" node collapses the remaining roles (the full list lives
// on the CV). Selection type for the block: an entry slug or this group.
export type ExperienceSelection = ExperienceSlug | 'earlier'

export function isExperienceSelection(
  value: string | null
): value is ExperienceSelection {
  return value === 'earlier' || EXPERIENCE.some((entry) => entry.slug === value)
}
