import { describe, expect, it } from 'vitest'

import i18n from '@/lib/i18n'

import { classifyIntent, extractEntities, respond, tokenize } from './engine'
import { buildLocalKB, mergeBlogKnowledge } from './knowledge'
import type { BlogKnowledge } from './types'

// Real i18n (templates) + real experience registry → the engine is exercised
// against the same data it runs on. A small fake blog knowledge stands in for the
// fetched JSON so blog-dependent intents (education/posts) can be tested too.
const tEn = i18n.getFixedT('en')
const tId = i18n.getFixedT('id')
const kbEn = buildLocalKB('en', tEn)
const kbId = buildLocalKB('id', tId)

const fakeBlog: BlogKnowledge = {
  version: 1,
  generatedAt: '2026-01-01T00:00:00.000Z',
  cv: {
    en: {
      contact: {
        location: 'Jakarta, Indonesia',
        email: 'x@y.com',
        linkedin: 'https://li',
      },
      experience: [
        {
          company: 'DBS Bank Indonesia',
          industry: 'Banking',
          location: 'Jakarta',
          roles: [{ title: 'React.js Developer', dates: 'Feb 2026 – Present' }],
          bullets: [
            'Contributing to a webview-based app within a microfrontend architecture.',
          ],
        },
      ],
      compactRoles: [],
      education: {
        school: 'Universitas Islam Indonesia',
        degree: 'Bachelor of Informatics',
        dates: '2019 – 2023',
        bullets: ['Cum Laude (GPA: 3.69 / 4.00)'],
      },
      achievements: [
        { lead: 'Game Developer Bootcamp', rest: '— Unity program.' },
      ],
      skills: 'React.js, Next.js, TypeScript.',
    },
    id: {
      contact: {
        location: 'Jakarta, Indonesia',
        email: 'x@y.com',
        linkedin: 'https://li',
      },
      experience: [],
      compactRoles: [],
      education: {
        school: 'Universitas Islam Indonesia',
        degree: 'Sarjana Informatika',
        dates: '2019 – 2023',
        bullets: ['Cum Laude (IPK: 3.69 / 4.00)'],
      },
      achievements: [
        { lead: 'Game Developer Bootcamp', rest: '— program Unity.' },
      ],
      skills: 'React.js, Next.js.',
    },
  },
  posts: [
    {
      slug: 'styling-across-module-federation',
      date: '2026-06-22',
      title: {
        en: 'Styling across the boundary',
        id: 'Menata gaya melintasi batas',
      },
      description: { en: 'CSS vs utilities.', id: 'CSS vs utilitas.' },
      body: {
        en: 'Styling a federated remote is subtle: CSS variables cross the boundary through the cascade, but Tailwind utility classes live in the remote stylesheet and do not travel with the chunk.',
        id: 'Menata gaya remote terfederasi itu rumit: variabel CSS melintasi batas lewat cascade, tapi kelas utilitas Tailwind ada di stylesheet remote dan tidak ikut bersama chunk.',
      },
    },
  ],
}
const kbEnFull = mergeBlogKnowledge(kbEn, fakeBlog)

describe('tokenize', () => {
  it('lowercases and splits on punctuation, keeps unicode letters', () => {
    expect(tokenize("What's his React.js experience?")).toEqual([
      'what',
      's',
      'his',
      'react',
      'js',
      'experience',
    ])
    expect(tokenize('Di mana?')).toEqual(['di', 'mana'])
  })
})

describe('extractEntities', () => {
  it('finds company, tech, and earlier-role entities', () => {
    expect(extractEntities(tokenize('tell me about dbs'), kbEn).jobs).toContain(
      'dbs'
    )
    expect(extractEntities(tokenize('react and angular'), kbEn).techs).toEqual(
      expect.arrayContaining(['React', 'Angular'])
    )
    expect(
      extractEntities(tokenize('what about traveloka'), kbEn).earlier
    ).toBe(true)
  })

  it('resolves a space-typed multi-word tech via adjacent-token joining', () => {
    // "react query" tokenizes to ['react','query']; the bigram join matches the
    // 'reactquery' alias and front-loads the specific match over plain React.
    expect(extractEntities(tokenize('react query'), kbEn).techs[0]).toBe(
      'React Query'
    )
    expect(extractEntities(tokenize('type script'), kbEn).techs).toContain(
      'TypeScript'
    )
  })
})

describe('classifyIntent (EN + ID)', () => {
  const intentOf = (q: string, kb = kbEn) =>
    classifyIntent(tokenize(q), extractEntities(tokenize(q), kb), kb.locale)

  it('routes English questions', () => {
    expect(intentOf('hello there')).toBe('greeting')
    expect(intentOf('who is naufal')).toBe('about')
    expect(intentOf('where has he worked')).toBe('experienceOverall')
    expect(intentOf('tell me about DBS')).toBe('experienceAt')
    expect(intentOf("what's his tech stack")).toBe('stack')
    expect(intentOf('does he have experience with React')).toBe('techWith')
    expect(intentOf('compare DBS and Danamon')).toBe('compare')
    expect(intentOf('is he available to hire')).toBe('availability')
    expect(intentOf('are you a real AI')).toBe('isThisAI')
    expect(intentOf('asdf qwerty zxcv')).toBe('fallback')
  })

  it('routes Indonesian questions via keywords + entities', () => {
    expect(intentOf('kapan dia di DBS', kbId)).toBe('experienceAt')
    expect(intentOf('apakah dia tersedia', kbId)).toBe('availability')
    expect(intentOf('apa tech stack-nya', kbId)).toBe('stack')
    expect(intentOf('bandingkan DBS dan Danamon', kbId)).toBe('compare')
  })

  it('tolerates morphological variants via stemming (no whack-a-mole)', () => {
    // "written" is an irregular the original keyword list missed → was fallback.
    expect(intentOf('what has he written')).toBe('posts')
    expect(intentOf('what did he build')).toBe('projects')
    expect(intentOf('what are his skills')).toBe('stack')
    expect(intentOf('where did he study')).toBe('education')
    expect(intentOf('apa yang sudah dia tulis', kbId)).toBe('posts')
  })
})

describe('respond', () => {
  it('answers about a specific company', () => {
    const { answer } = respond('tell me about DBS', kbEn, tEn)
    expect(answer.text).toContain('DBS Bank Indonesia')
    expect(answer.links?.some((l) => l.href.includes('exp=dbs'))).toBe(true)
  })

  it('answers which jobs used a technology', () => {
    const { answer } = respond('experience with React', kbEn, tEn)
    expect(answer.text).toContain('React')
    expect(answer.text).toContain('DBS') // DBS's stack includes React
  })

  it('lists the career overall', () => {
    const { answer } = respond('where has he worked', kbEn, tEn)
    expect(answer.text).toContain('DBS Bank Indonesia')
    expect(answer.text).toContain('5') // five highlighted companies
  })

  it('gives contact for availability (works without the blog data)', () => {
    const { answer } = respond('is he available', kbEn, tEn)
    expect(answer.text).toContain('@')
    expect(answer.links?.some((l) => l.href.startsWith('mailto:'))).toBe(true)
  })

  it('answers in Indonesian', () => {
    const { answer } = respond('kapan dia di DBS', kbId, tId)
    expect(answer.text).toContain('DBS Bank Indonesia')
    expect(answer.text).toContain('Di ') // Indonesian template "Di {{company}} …"
  })

  it('degrades gracefully when blog data is missing', () => {
    expect(respond('education', kbEn, tEn).answer.text).toBe(
      tEn('chat.answers.blogDown')
    )
  })

  it('uses blog data when present', () => {
    const { answer } = respond('what did he study', kbEnFull, tEn)
    expect(answer.text).toContain('Universitas Islam Indonesia')
  })

  it('surfaces a real CV bullet in a company answer when blog data merged', () => {
    // Local-only KB has no bullets; the merged KB enriches DBS with its CV bullet.
    expect(respond('tell me about DBS', kbEn, tEn).answer.text).not.toContain(
      'Highlight:'
    )
    const { answer } = respond('tell me about DBS', kbEnFull, tEn)
    expect(answer.text).toContain('Highlight:')
    expect(answer.text).toContain('microfrontend architecture')
  })

  it('is honest about not being an LLM', () => {
    const { answer } = respond('are you chatgpt', kbEn, tEn)
    expect(answer.text.toLowerCase()).toContain('javascript')
  })

  it('always offers follow-up suggestions', () => {
    const { answer } = respond('hello', kbEn, tEn)
    expect(answer.suggestions?.length).toBeGreaterThan(0)
  })

  it('retrieves a relevant passage from a post body (content question)', () => {
    const { answer } = respond(
      'how does styling cross the boundary',
      kbEnFull,
      tEn
    )
    expect(answer.text).toContain('cross the boundary') // a real passage, not the generic fallback
    expect(answer.text).not.toBe(tEn('chat.fallback'))
    expect(answer.links?.some((l) => l.href.includes('/posts/'))).toBe(true)
  })

  it('does not invent a passage when nothing is relevant', () => {
    expect(respond('asdf qwerty zxcv', kbEnFull, tEn).answer.text).toBe(
      tEn('chat.fallback')
    )
  })
})
