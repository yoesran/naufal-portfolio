import { readFileSync } from 'node:fs'
import { dirname, resolve } from 'node:path'
import { fileURLToPath } from 'node:url'

import { type CvData, getCv } from '../app/[lang]/cv/cv-data'
import { type Locale, locales } from './i18n/config'
import { posts } from './posts'

const CONTENT = resolve(dirname(fileURLToPath(import.meta.url)), '../content')

// MDX body → plain searchable text: drop code fences + table rows, strip
// Markdown markers, links → their text. Paragraphs (blank-line-separated) survive
// so the assistant can retrieve a relevant passage. Best-effort, not a full
// parser — good enough for keyword/passage matching, and adds no dependency.
function bodyText(slug: string, locale: Locale): string {
  let raw: string
  try {
    raw = readFileSync(resolve(CONTENT, locale, `${slug}.mdx`), 'utf8')
  } catch {
    return ''
  }
  return raw
    .replace(/```[\s\S]*?```/g, ' ') // fenced code blocks
    .replace(/^\|.*$/gm, ' ') // table rows
    .replace(/^#{1,6}\s+/gm, '') // heading markers
    .replace(/^>\s?/gm, '') // blockquote markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // links → text
    .replace(/[*_`~]/g, '') // emphasis / inline-code ticks
    .replace(/[ \t]+/g, ' ')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

// The assistant knowledge contract — the shape the blog publishes (public/
// knowledge.json) and the host's `// ask` block reads cross-origin. The two apps
// share no package, so the host re-declares a matching reader type (same approach
// as the quality dashboard's `Health` type vs reports.mjs). Bump `version` if the
// shape changes so the host can guard on it. Built by scripts/knowledge.ts; kept
// here (in src) so it's type-checked and unit-tested. See ../../docs/deployment.md.

// CV minus the print-only phone — it lives on the printed CV only, never on the
// web, so it must not enter a publicly-fetched JSON.
export type PublicCv = Omit<CvData, 'contact'> & {
  contact: Omit<CvData['contact'], 'phone'>
}

export type Knowledge = {
  version: 1
  generatedAt: string
  cv: Record<Locale, PublicCv>
  posts: {
    slug: string
    date: string
    title: Record<Locale, string>
    description: Record<Locale, string>
    // Cleaned body text per locale, so the assistant can retrieve a relevant
    // passage (not just the title/description).
    body: Record<Locale, string>
  }[]
}

export function buildKnowledge(): Knowledge {
  // Built explicitly (not via destructure-omit) so dropping the phone is obvious
  // and can't silently regress if cv-data grows new contact fields.
  const cv = Object.fromEntries(
    locales.map((locale) => {
      const data = getCv(locale)
      const pub: PublicCv = {
        ...data,
        contact: {
          location: data.contact.location,
          email: data.contact.email,
          linkedin: data.contact.linkedin,
        },
      }
      return [locale, pub]
    })
  ) as Record<Locale, PublicCv>

  return {
    version: 1,
    generatedAt: new Date().toISOString(),
    cv,
    posts: posts.map((post) => ({
      slug: post.slug,
      date: post.date,
      title: post.title,
      description: post.description,
      body: Object.fromEntries(
        locales.map((l) => [l, bodyText(post.slug, l)])
      ) as Record<Locale, string>,
    })),
  }
}
