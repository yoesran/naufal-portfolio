import type { TFunction } from 'i18next'

import { EARLIER_KEYS, EXPERIENCE } from '@/lib/experience'
import type { Locale } from '@/lib/i18n'
import { BLOG_URL } from '@/lib/links'

import type { BlogKnowledge, KB } from './types'

// Where the assistant reads the blog's published knowledge. In dev (no
// VITE_BLOG_URL) it reads the same-origin seed (host public/knowledge.json) so
// the bot works offline; in prod it reads the live blog origin — exactly the
// QualityBlock ↔ health.json pattern.
const KNOWLEDGE_URL = import.meta.env.VITE_BLOG_URL
  ? `${BLOG_URL}/knowledge.json`
  : '/knowledge.json'

const companyKey = (name: string) =>
  name.toLowerCase().replace(/[^a-z0-9]/g, '')

// Build the always-available half of the KB from the host's own experience
// registry + i18n. `t` is a locale-fixed translator (i18n.getFixedT(locale)) so
// answers are in the active language; adding/editing an entry or its prose
// updates the bot for free on the next build.
export function buildLocalKB(locale: Locale, t: TFunction): KB {
  const monthFmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  })
  const month = (iso: string) => monthFmt.format(new Date(`${iso}-01T00:00:00`))

  const jobs = EXPERIENCE.map((e) => ({
    slug: e.slug,
    company: e.company,
    short: e.short,
    period: `${month(e.start)} – ${e.end ? month(e.end) : t('experience.present')}`,
    role: t(`experience.roles.${e.slug}`),
    industry: t(`experience.industries.${e.slug}`),
    summary: t(`experience.summaries.${e.slug}`),
    stack: e.stack,
    adds: e.adds,
    url: e.url,
    story: e.story,
  }))

  return {
    locale,
    blogReady: false,
    name: 'Naufal Yusran',
    github: 'https://github.com/yoesran',
    // Contact + location default to the same public values the host Footer shows,
    // so "how do I reach him" / "who is he" answer fully even if the blog
    // knowledge never loads. The blog merge refreshes them (same values).
    location: 'Jakarta, Indonesia',
    email: 'naufalyoesran@gmail.com',
    linkedin: 'https://www.linkedin.com/in/naufal-yusran',
    jobs,
    earlierLabel: t('experience.earlier.title'),
    earlier: EARLIER_KEYS.map((k) => t(`experience.earlier.roles.${k}`)),
    posts: [],
  }
}

// Fold the fetched blog knowledge into the KB: contact, education, achievements,
// skills, posts — plus CV bullets enriching the matching jobs (by company name).
export function mergeBlogKnowledge(kb: KB, blog: BlogKnowledge): KB {
  const cv = blog.cv[kb.locale]
  if (!cv) return kb

  const cvJobs = cv.experience.map((j) => ({ key: companyKey(j.company), j }))
  const jobs = kb.jobs.map((job) => {
    const key = companyKey(job.company)
    const match = cvJobs.find((c) => c.key.includes(key) || key.includes(c.key))
    return match ? { ...job, bullets: match.j.bullets } : job
  })

  return {
    ...kb,
    blogReady: true,
    jobs,
    location: cv.contact.location,
    email: cv.contact.email,
    linkedin: cv.contact.linkedin,
    education: cv.education,
    achievements: cv.achievements,
    skills: cv.skills
      .replace(/\.\s*$/, '')
      .split(',')
      .map((s) => s.trim())
      .filter(Boolean),
    posts: blog.posts.map((p) => ({
      slug: p.slug,
      date: p.date,
      title: p.title[kb.locale],
      description: p.description[kb.locale],
      body: p.body?.[kb.locale],
    })),
  }
}

// Fetch + version-guard the blog knowledge. Returns null on any failure (offline,
// 404, shape/version mismatch) so the caller degrades gracefully — the bot still
// answers from the local experience KB. Matches the project's fallback ethos.
export async function fetchBlogKnowledge(): Promise<BlogKnowledge | null> {
  try {
    const r = await fetch(KNOWLEDGE_URL, { cache: 'no-store' })
    if (!r.ok) return null
    const d = await r.json()
    return d && d.version === 1 && d.cv && Array.isArray(d.posts)
      ? (d as BlogKnowledge)
      : null
  } catch {
    return null
  }
}
