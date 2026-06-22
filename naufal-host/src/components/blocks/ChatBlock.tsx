import { useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { CornerDownLeft } from 'lucide-react'

import { Cell } from '@/components/Cell'
import { Button } from '@/components/ui/button'
import { DEFAULT_SUGGEST, respond } from '@/lib/chat/engine'
import {
  buildLocalKB,
  fetchBlogKnowledge,
  mergeBlogKnowledge,
} from '@/lib/chat/knowledge'
import type { AnswerLink, BlogKnowledge, ChatContext } from '@/lib/chat/types'
import { DEFAULT_LOCALE, isLocale } from '@/lib/i18n'
import { useTypewriter } from '@/lib/useTypewriter'

// The `// ask` block: a hand-built, no-LLM assistant. It scores the question
// against a knowledge base merged from the host's own experience registry (always
// present) and the blog's published knowledge.json (fetched at runtime; absent →
// answers degrade gracefully). All matching/answers live in lib/chat; this is the
// conversation surface — a transcript (announced to screen readers), a typewriter
// reveal, suggested-question chips, and links that route into the real content.
type Msg = {
  role: 'you' | 'bot'
  text: string
  links?: AnswerLink[]
  suggestions?: string[]
}

export function ChatBlock() {
  const { t, i18n } = useTranslation()
  const locale = isLocale(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LOCALE

  // Blog knowledge: fetched once, merged when it arrives (null → local-only KB).
  const [blog, setBlog] = useState<BlogKnowledge | null>(null)
  useEffect(() => {
    let cancelled = false
    fetchBlogKnowledge().then((b) => {
      if (!cancelled) setBlog(b)
    })
    return () => {
      cancelled = true
    }
  }, [])

  // Rebuilt in the active locale (so a language switch re-localizes answers) and
  // when the blog knowledge lands.
  const kb = useMemo(() => {
    const base = buildLocalKB(locale, i18n.getFixedT(locale))
    return blog ? mergeBlogKnowledge(base, blog) : base
  }, [locale, blog, i18n])

  const ctxRef = useRef<ChatContext>({})
  const [messages, setMessages] = useState<Msg[]>([])
  const scrollRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const [input, setInput] = useState('')

  function ask(raw: string) {
    const query = raw.trim()
    if (!query) return
    const { answer, context } = respond(
      query,
      kb,
      i18n.getFixedT(locale),
      ctxRef.current
    )
    ctxRef.current = context
    setMessages((m) => [
      ...m,
      { role: 'you', text: query },
      {
        role: 'bot',
        text: answer.text,
        links: answer.links,
        suggestions: answer.suggestions,
      },
    ])
    setInput('')
    // Return focus to the field (a chip click moved it to the button) so the
    // visitor can keep typing the next question.
    inputRef.current?.focus()
  }

  // Keep the latest turn in view (scrolls the transcript, never the page).
  useEffect(() => {
    const el = scrollRef.current
    if (el) el.scrollTop = el.scrollHeight
  }, [messages])

  // ask() always pushes [you, bot] together, so the last message is the latest
  // bot turn — both its follow-up chips and the typing flag key off that.
  const lastBotIndex = messages.length - 1
  const chips =
    messages.length === 0
      ? DEFAULT_SUGGEST.map((k) => t(`chat.suggest.${k}`))
      : (messages.at(-1)?.suggestions ?? [])

  return (
    <Cell id="chat" label="// ask · no LLM, just JavaScript">
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t('chat.description')}
      </p>

      {messages.length > 0 && (
        <div
          ref={scrollRef}
          role="log"
          aria-live="polite"
          aria-label={t('chat.transcriptLabel')}
          className="border-border/60 bg-muted/20 mt-4 max-h-96 space-y-3 overflow-y-auto rounded-lg border p-4"
        >
          {messages.map((m, i) =>
            m.role === 'you' ? (
              <UserMessage
                key={i}
                text={m.text}
                youLabel={t('chat.youLabel')}
              />
            ) : (
              <BotMessage
                key={i}
                text={m.text}
                links={m.links}
                botLabel={t('chat.botLabel')}
                typing={i === lastBotIndex}
              />
            )
          )}
        </div>
      )}

      {/* Suggested questions — seed the cold start, then follow-ups per answer. */}
      {chips.length > 0 && (
        <div className="mt-4 flex flex-wrap gap-2">
          {chips.map((q) => (
            <button
              key={q}
              type="button"
              onClick={() => ask(q)}
              className="border-border/70 text-muted-foreground hover:border-brand/40 hover:text-foreground focus-visible:ring-brand/40 cursor-pointer rounded-full border px-3 py-1 font-mono text-xs transition-colors focus:outline-none focus-visible:ring-2"
            >
              {q}
            </button>
          ))}
        </div>
      )}

      <form
        className="mt-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          ask(input)
        }}
      >
        <input
          ref={inputRef}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          aria-label={t('chat.inputLabel')}
          placeholder={t('chat.placeholder')}
          autoComplete="off"
          className="border-border/70 focus-visible:ring-brand/40 bg-card min-w-0 flex-1 rounded-lg border px-3 py-2 font-mono text-xs outline-none focus-visible:ring-2"
        />
        <Button
          type="submit"
          variant="outline"
          size="sm"
          disabled={!input.trim()}
        >
          <CornerDownLeft className="size-3.5" />
          <span className="sr-only">{t('chat.sendLabel')}</span>
        </Button>
      </form>

      <p className="text-muted-foreground/40 mt-2 font-mono text-[10px]">
        {t('chat.disclaimer')}
      </p>
    </Cell>
  )
}

function UserMessage({ text, youLabel }: { text: string; youLabel: string }) {
  return (
    <div className="text-right">
      <span className="sr-only">{youLabel}: </span>
      <span className="bg-brand/10 text-foreground inline-block rounded-lg px-3 py-1.5 text-left font-mono text-xs">
        {text}
      </span>
    </div>
  )
}

// A bot turn. The full text is in an sr-only node inside the live region, so a
// screen reader announces the answer ONCE when it arrives; the visible text types
// out in an aria-hidden node (no per-character announcements). Older turns render
// full (typing=false). Links route into the real content (CV / post / timeline).
function BotMessage({
  text,
  links,
  botLabel,
  typing,
}: {
  text: string
  links?: AnswerLink[]
  botLabel: string
  typing: boolean
}) {
  const { shown } = useTypewriter(text, { active: typing })
  const display = typing ? shown : text
  return (
    <div className="text-sm leading-relaxed">
      <span className="sr-only">
        {botLabel}: {text}
      </span>
      <span
        aria-hidden="true"
        className="text-muted-foreground block font-mono text-xs whitespace-pre-wrap"
      >
        {display}
      </span>
      {links && links.length > 0 && (
        <div className="mt-2 flex flex-wrap gap-x-4 gap-y-1 font-mono text-xs">
          {links.map((l) => (
            <a
              key={l.href + l.label}
              href={l.href}
              target={l.href.startsWith('http') ? '_blank' : undefined}
              rel={l.href.startsWith('http') ? 'noreferrer' : undefined}
              className="text-brand hover:text-brand/80 transition-colors"
            >
              {l.label}
            </a>
          ))}
        </div>
      )}
    </div>
  )
}
