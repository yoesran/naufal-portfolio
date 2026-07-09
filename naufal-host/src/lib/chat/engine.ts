import type { TFunction } from 'i18next'

import { BLOG_URL } from '@/lib/links'

import { stem, stemAll } from './stem'
import { EARLIER_COMPANIES, INTENT_KEYWORDS, TECH } from './synonyms'
import type {
  Answer,
  AnswerLink,
  ChatContext,
  Intent,
  Job,
  KB,
  Post,
} from './types'

// The hand-built, no-LLM engine. A deterministic pipeline:
//   normalize → tokenize → extract entities → classify intent → compose answer.
// Pure functions over the KB + a locale-fixed translator `t`, so it's unit-tested
// and feeds the quality dashboard (like theme.ts / lib/quality). Answer prose
// lives in the locale files (chat.*) so it's translated, not hardcoded.

type T = TFunction

export function normalize(q: string): string {
  return q
    .toLowerCase()
    .replace(/[^\p{L}\p{N}\s]/gu, ' ') // keep unicode letters (Indonesian) + digits
    .replace(/\s+/g, ' ')
    .trim()
}

export function tokenize(q: string): string[] {
  const n = normalize(q)
  return n ? n.split(' ') : []
}

export type Entities = { jobs: string[]; earlier: boolean; techs: string[] }

// Match query tokens against known proper-noun entities (companies, tech). These
// are locale-invariant, which is what makes the bilingual matching work — the
// nouns carry the query even when the surrounding Indonesian isn't in a keyword
// list.
export function extractEntities(tokens: string[], kb: KB): Entities {
  const set = new Set(tokens)
  // Adjacent token pairs joined, so a space-typed multi-word tech ("react query"
  // → "reactquery", "type script" → "typescript") matches the single-token alias
  // the tokenizer would otherwise split apart.
  const bigrams = new Set<string>()
  for (let i = 0; i < tokens.length - 1; i++) {
    const joined = tokens[i] + tokens[i + 1]
    bigrams.add(joined)
    set.add(joined)
  }
  const jobs: string[] = []
  // One company can hold two entries (Doubler Studio: contract, then freelance),
  // and every alias that resolves them — "doubler", the company words, even the
  // older entry's slug — is shared. Matching both would read as "two jobs named"
  // and route a plain "tell me about doubler" to `compare`, i.e. Doubler vs
  // Doubler. Newest entry per company wins (kb.jobs is newest-first); the older
  // era still reaches the panel via the timeline's ?exp= deep link.
  const seenCompanies = new Set<string>()
  for (const job of kb.jobs) {
    const aliases = [
      job.slug,
      job.short.toLowerCase(),
      ...companyWords(job.company),
    ]
    if (!aliases.some((a) => set.has(a))) continue
    if (seenCompanies.has(job.company)) continue
    seenCompanies.add(job.company)
    jobs.push(job.slug)
  }
  const earlier = EARLIER_COMPANIES.some((c) => set.has(c))
  const techs: string[] = []
  for (const tech of TECH) {
    if (!tech.match.some((m) => set.has(m))) continue
    // A bigram hit ("react query") is more specific than the single token it
    // overlaps ("react"), so front-load it — techWith reads techs[0].
    if (tech.match.some((m) => bigrams.has(m))) techs.unshift(tech.id)
    else techs.push(tech.id)
  }
  return { jobs, earlier, techs }
}

const STOP = new Set(['bank', 'indonesia', 'studio', 'the'])
const companyWords = (company: string) =>
  company
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, '')
    .split(/\s+/)
    .filter((w) => w.length > 2 && !STOP.has(w))

// Stemmed keyword sets per locale, built once. Both these and the query tokens
// pass through `stem()`, so a variant like "written" matches "write".
const KW_STEMS: Partial<
  Record<KB['locale'], Partial<Record<Intent, Set<string>>>>
> = {}
function stemmedKeywords(locale: KB['locale'], intent: Intent): Set<string> {
  const cache = (KW_STEMS[locale] ??= {})
  return (cache[intent] ??= new Set(
    (INTENT_KEYWORDS[locale][intent] ?? []).map((w) => stem(w, locale))
  ))
}

function scoreKeywords(lemmas: string[], wordSet: Set<string>): number {
  return lemmas.reduce((n, t) => (wordSet.has(t) ? n + 1 : n), 0)
}

// Score the keyword-driven intents, then let entities (jobs/tech) drive the
// entity-shaped intents (experienceAt / techWith / compare). Highest wins;
// nothing convincing → fallback.
export function classifyIntent(
  tokens: string[],
  entities: Entities,
  locale: KB['locale']
): Intent {
  const lemmas = stemAll(tokens, locale)
  const scores = new Map<Intent, number>()
  const add = (i: Intent, n: number) => scores.set(i, (scores.get(i) ?? 0) + n)

  const keywordIntents: Intent[] = [
    'greeting',
    'about',
    'experienceOverall',
    'stack',
    'compare',
    'availability',
    'education',
    'posts',
    'projects',
    'isThisAI',
    'help',
  ]
  for (const intent of keywordIntents)
    add(intent, scoreKeywords(lemmas, stemmedKeywords(locale, intent)))

  // Entity rules (a bare "DBS" or "React" should answer without keywords). A
  // named company outranks generic chatter like "tell me about …" (boost 3 > the
  // 2 that "tell"+"about" score for the `about` intent).
  if (entities.jobs.length >= 2) add('compare', 3)
  if (entities.jobs.length >= 1) add('experienceAt', 3)
  // An earlier-role company is a named company too, so it takes the same boost —
  // at 2 it merely tied "tell"+"about", and "tell me about ehealth" answered with
  // the generic bio instead of the roles.
  if (entities.earlier && entities.jobs.length === 0)
    add('experienceOverall', 3)
  if (entities.techs.length >= 1) add('techWith', 2)

  let best: Intent = 'fallback'
  let bestScore = 0
  for (const [intent, score] of scores) {
    if (score > bestScore) {
      best = intent
      bestScore = score
    }
  }
  return bestScore > 0 ? best : 'fallback'
}

// --- Answer composition (template NLG) ---------------------------------------

const list = (locale: string, items: string[]) =>
  new Intl.ListFormat(locale, { type: 'conjunction' }).format(items)

const jobOf = (kb: KB, slug?: string) => kb.jobs.find((j) => j.slug === slug)

// How many *companies* he worked for — not how many rows the registry holds.
// Doubler Studio is two entries (contract, then freelance), and the collapsed
// earlier roles are real employers the highlight list leaves out.
const companyCount = (kb: KB) =>
  uniq(kb.jobs.map((j) => j.company)).length + kb.earlier.length

type SuggestKey =
  | 'about'
  | 'experience'
  | 'stack'
  | 'available'
  | 'posts'
  | 'education'
  | 'projects'
function suggestions(t: T, keys: SuggestKey[]): string[] {
  return keys.map((k) => t(`chat.suggest.${k}`))
}
export const DEFAULT_SUGGEST: SuggestKey[] = [
  'about',
  'experience',
  'stack',
  'available',
]

function experienceList(kb: KB, t: T): string {
  return kb.jobs
    .map((j) =>
      t('chat.answers.experienceItem', {
        company: j.company,
        role: j.role,
        period: j.period,
      })
    )
    .join('\n')
}

function jobsUsing(kb: KB, techId: string): Job[] {
  const id = techId.toLowerCase()
  return kb.jobs.filter((j) =>
    [...j.stack, ...j.adds].some((s) => s.toLowerCase().includes(id))
  )
}

// Compose the answer for a resolved intent. Returns the Answer plus the updated
// context (so the next turn can resolve "and there?").
export function compose(
  intent: Intent,
  entities: Entities,
  kb: KB,
  t: T,
  ctx: ChatContext
): { answer: Answer; context: ChatContext } {
  const loc = kb.locale
  const next: ChatContext = { ...ctx }
  const cvLink: AnswerLink = {
    label: t('chat.links.cv'),
    href: `${BLOG_URL}/cv`,
  }
  const timelineLink: AnswerLink = {
    label: t('chat.links.timeline'),
    href: '/?exp=dbs#experience',
  }
  const blogDown = (): Answer => ({
    text: t('chat.answers.blogDown'),
    links: [cvLink],
    suggestions: suggestions(t, ['about', 'experience', 'available']),
  })

  switch (intent) {
    case 'greeting':
      return {
        answer: {
          text: t('chat.answers.greeting'),
          suggestions: suggestions(t, DEFAULT_SUGGEST),
        },
        context: next,
      }

    case 'about': {
      const top = kb.jobs[0]
      return {
        answer: {
          text: t('chat.answers.about', {
            location: kb.location,
            role: top.role,
            company: top.company,
            count: companyCount(kb),
          }),
          links: [cvLink, timelineLink],
          suggestions: suggestions(t, ['experience', 'stack', 'available']),
        },
        context: next,
      }
    }

    case 'experienceOverall': {
      const earlier = t('chat.answers.earlierNote', {
        roles: list(loc, kb.earlier),
      })
      return {
        answer: {
          text:
            t('chat.answers.experienceOverall', { count: companyCount(kb) }) +
            '\n' +
            experienceList(kb, t) +
            '\n\n' +
            earlier,
          links: [timelineLink, cvLink],
          suggestions: suggestions(t, ['stack', 'available', 'education']),
        },
        context: next,
      }
    }

    case 'experienceAt': {
      const job = jobOf(kb, entities.jobs[0] ?? ctx.lastJob)
      if (!job) return compose('experienceOverall', entities, kb, t, ctx)
      next.lastJob = job.slug
      const links: AnswerLink[] = []
      if (job.url) links.push({ label: job.url, href: `https://${job.url}` })
      if (job.story)
        links.push({
          label: t('chat.links.story'),
          href: `${BLOG_URL}/work/${job.story}`, // matches ExperienceBlock + the registry contract
        })
      links.push({
        label: t('chat.links.timeline'),
        href: `/?exp=${job.slug}#experience`,
      })
      // Lead with the registry summary, then a real CV bullet when the blog
      // knowledge has merged in (richer, grounded), then the stack.
      const lines = [
        t('chat.answers.experienceAt', {
          company: job.company,
          period: job.period,
          role: job.role,
          summary: job.summary,
        }),
      ]
      if (job.bullets?.length)
        lines.push(t('chat.answers.highlight', { highlight: job.bullets[0] }))
      lines.push(t('chat.answers.stackLine', { stack: list(loc, job.stack) }))
      return {
        answer: {
          text: lines.join('\n\n'),
          links,
          suggestions: otherJobSuggestions(kb, job, t),
        },
        context: next,
      }
    }

    case 'compare': {
      const a = jobOf(kb, entities.jobs[0])
      const b = jobOf(kb, entities.jobs[1])
      if (!a || !b) return compose('experienceOverall', entities, kb, t, ctx)
      const aStack = new Set(a.stack.map((s) => s.toLowerCase()))
      const bStack = new Set(b.stack.map((s) => s.toLowerCase()))
      const shared = a.stack.filter((s) => bStack.has(s.toLowerCase()))
      const onlyA = a.stack.filter((s) => !bStack.has(s.toLowerCase()))
      const onlyB = b.stack.filter((s) => !aStack.has(s.toLowerCase()))
      const parts = [
        t('chat.answers.compareHead', {
          a: a.company,
          aPeriod: a.period,
          b: b.company,
          bPeriod: b.period,
        }),
      ]
      if (onlyA.length)
        parts.push(
          t('chat.answers.compareOnly', {
            company: a.short,
            tools: list(loc, onlyA),
          })
        )
      if (onlyB.length)
        parts.push(
          t('chat.answers.compareOnly', {
            company: b.short,
            tools: list(loc, onlyB),
          })
        )
      if (shared.length)
        parts.push(
          t('chat.answers.compareShared', { tools: list(loc, shared) })
        )
      return {
        answer: {
          text: parts.join('\n'),
          links: [timelineLink],
          suggestions: suggestions(t, ['stack', 'experience', 'available']),
        },
        context: { ...next, lastJob: a.slug },
      }
    }

    case 'stack': {
      const skills =
        kb.skills && kb.skills.length
          ? kb.skills
          : uniq(kb.jobs.flatMap((j) => j.stack))
      return {
        answer: {
          text: t('chat.answers.stack', {
            skills: list(loc, skills.slice(0, 14)),
          }),
          links: [cvLink],
          suggestions: suggestions(t, ['about', 'experience', 'available']),
        },
        context: next,
      }
    }

    case 'techWith': {
      const techId = entities.techs[0] ?? ctx.lastTech
      const tech = TECH.find((x) => x.id === techId)
      if (!tech) return compose('stack', entities, kb, t, ctx)
      next.lastTech = tech.id
      const used = jobsUsing(kb, tech.id)
      if (used.length === 0)
        return {
          answer: {
            text: t('chat.answers.techNone', { tech: tech.id }),
            suggestions: suggestions(t, ['stack', 'experience']),
          },
          context: next,
        }
      return {
        answer: {
          text: t('chat.answers.techWith', {
            tech: tech.id,
            companies: list(
              loc,
              used.map((j) => j.short)
            ),
          }),
          links: [timelineLink],
          suggestions: otherJobSuggestions(kb, used[0], t),
        },
        context: { ...next, lastJob: used[0].slug },
      }
    }

    case 'availability':
      return {
        answer: {
          text: t('chat.answers.availability', { email: kb.email }),
          links: [
            { label: t('chat.links.email'), href: `mailto:${kb.email}` },
            { label: t('chat.links.linkedin'), href: kb.linkedin ?? '' },
            cvLink,
          ].filter((l) => l.href),
          suggestions: suggestions(t, ['about', 'experience', 'stack']),
        },
        context: next,
      }

    case 'education': {
      if (!kb.blogReady || !kb.education)
        return { answer: blogDown(), context: next }
      const e = kb.education
      return {
        answer: {
          text: t('chat.answers.education', {
            degree: e.degree,
            school: e.school,
            dates: e.dates,
            honors: e.bullets[0] ?? '',
          }),
          links: [cvLink],
          suggestions: suggestions(t, ['experience', 'projects', 'available']),
        },
        context: next,
      }
    }

    case 'posts': {
      if (!kb.blogReady) return { answer: blogDown(), context: next }
      const blogLink: AnswerLink = {
        label: t('chat.links.blog'),
        href: `${BLOG_URL}/${loc}/posts`,
      }
      if (kb.posts.length === 0)
        return {
          answer: {
            text: t('chat.answers.postsEmpty'),
            links: [blogLink],
            suggestions: suggestions(t, ['about', 'experience', 'available']),
          },
          context: next,
        }
      const items = kb.posts
        .map((p) =>
          t('chat.answers.postItem', {
            title: p.title,
            description: p.description,
          })
        )
        .join('\n')
      return {
        answer: {
          text: t('chat.answers.posts') + '\n' + items,
          links: [
            ...kb.posts.map((p) => ({
              label: p.title,
              href: `${BLOG_URL}/${loc}/posts/${p.slug}`,
            })),
            blogLink,
          ],
          suggestions: suggestions(t, ['about', 'experience', 'available']),
        },
        context: next,
      }
    }

    case 'projects': {
      if (!kb.blogReady || !kb.achievements)
        return { answer: blogDown(), context: next }
      const items = kb.achievements
        .map((a) =>
          t('chat.answers.projectItem', { lead: a.lead, rest: a.rest })
        )
        .join('\n')
      return {
        answer: {
          text: t('chat.answers.projects') + '\n' + items,
          links: [cvLink],
          suggestions: suggestions(t, ['experience', 'education', 'available']),
        },
        context: next,
      }
    }

    case 'isThisAI':
      return {
        answer: {
          text: t('chat.answers.isThisAI'),
          suggestions: suggestions(t, DEFAULT_SUGGEST),
        },
        context: next,
      }

    case 'help':
      return {
        answer: {
          text: t('chat.answers.help'),
          suggestions: suggestions(t, [
            'about',
            'experience',
            'stack',
            'available',
          ]),
        },
        context: next,
      }

    default:
      return {
        answer: {
          text: t('chat.fallback'),
          suggestions: suggestions(t, [
            'about',
            'experience',
            'stack',
            'available',
          ]),
        },
        context: next,
      }
  }
}

function otherJobSuggestions(kb: KB, job: Job, t: T): string[] {
  const other = kb.jobs.find((j) => j.slug !== job.slug)
  const base = [t('chat.suggest.stack'), t('chat.suggest.available')]
  if (other)
    base.unshift(t('chat.suggest.compare', { a: job.short, b: other.short }))
  return base
}

const uniq = <T>(xs: T[]) => [...new Set(xs)]

// --- Post-body content retrieval ---------------------------------------------
// Stop-words dropped from the query before scoring passages (stemmed forms,
// since the query is stemmed first — e.g. "does" → "do"). EN + ID.
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'is',
  'are',
  'was',
  'were',
  'be',
  'his',
  'him',
  'he',
  'she',
  'they',
  'do',
  'doe',
  'ha',
  'have',
  'had',
  'what',
  'how',
  'why',
  'when',
  'who',
  'of',
  'to',
  'in',
  'on',
  'for',
  'and',
  'or',
  'with',
  'about',
  'that',
  'this',
  'it',
  'you',
  'me',
  'my',
  'your',
  'can',
  'tell',
  'dia',
  'dan',
  'atau',
  'yang',
  'apa',
  'bagaimana',
  'di',
  'ke',
  'dari',
  'ini',
  'itu',
  'saja',
  'sudah',
  'pernah',
  'saya',
  'kamu',
  'anda',
  'untuk',
  'adalah',
  'apakah',
  'soal',
  'tentang',
  'kah',
])

// Search the post bodies for the passage that overlaps the query most (by
// stemmed content-word count). Surfaces a real passage — it doesn't synthesize.
// Headings/short lines are skipped so it returns substance, not a title.
function searchPosts(
  tokens: string[],
  kb: KB
): { post: Post; passage: string; score: number } | null {
  const query = uniq(
    stemAll(tokens, kb.locale).filter((t) => t.length > 2 && !STOPWORDS.has(t))
  )
  if (query.length === 0) return null
  let best: { post: Post; passage: string; score: number } | null = null
  for (const post of kb.posts) {
    if (!post.body) continue
    for (const passage of post.body.split(/\n{2,}/)) {
      const text = passage.trim()
      if (text.length < 40) continue // skip headings / stubs
      const words = new Set(stemAll(tokenize(text), kb.locale))
      const score = query.reduce((n, q) => (words.has(q) ? n + 1 : n), 0)
      if (!best || score > best.score) best = { post, passage: text, score }
    }
  }
  return best && best.score >= 2 ? best : null
}

function postAnswer(
  hit: { post: Post; passage: string },
  kb: KB,
  t: T,
  ctx: ChatContext
): { answer: Answer; context: ChatContext } {
  return {
    answer: {
      text: `${t('chat.answers.fromPost', { title: hit.post.title })}\n\n${hit.passage}`,
      links: [
        {
          label: t('chat.links.readPost'),
          href: `${BLOG_URL}/${kb.locale}/posts/${hit.post.slug}`,
        },
      ],
      suggestions: suggestions(t, ['posts', 'about', 'available']),
    },
    context: ctx,
  }
}

// The single entry point: query in, Answer + next context out.
export function respond(
  query: string,
  kb: KB,
  t: T,
  ctx: ChatContext = {}
): { answer: Answer; context: ChatContext } {
  const tokens = tokenize(query)
  if (tokens.length === 0)
    return {
      answer: {
        text: t('chat.fallback'),
        suggestions: suggestions(t, DEFAULT_SUGGEST),
      },
      context: ctx,
    }
  const entities = extractEntities(tokens, kb)
  const intent = classifyIntent(tokens, entities, kb.locale)

  // Content retrieval: a strong passage match (≥3 query terms) answers a content
  // question even when a weak/generic intent also matched; a moderate one (≥2)
  // only steps in for the otherwise-generic fallback. Entity-shaped intents
  // (a named company / tech / comparison) always win — they're a clearer signal.
  const entityIntent =
    intent === 'experienceAt' || intent === 'compare' || intent === 'techWith'
  const hit = searchPosts(tokens, kb)
  if (hit && ((hit.score >= 3 && !entityIntent) || intent === 'fallback')) {
    return postAnswer(hit, kb, t, ctx)
  }
  return compose(intent, entities, kb, t, ctx)
}
