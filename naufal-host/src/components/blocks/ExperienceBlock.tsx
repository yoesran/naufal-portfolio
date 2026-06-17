import { Fragment, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { MoreHorizontal, Play, Terminal } from 'lucide-react'

import { Cell } from '@/components/Cell'
import { RemoteMount } from '@/components/RemoteMount'
import { Button, buttonVariants } from '@/components/ui/button'
import {
  EXPERIENCE,
  type ExperienceEntry,
  type ExperienceSelection,
  type ExperienceSlug,
  isExperienceSelection,
} from '@/lib/experience'
import { DEFAULT_LOCALE, type Translations, isLocale } from '@/lib/i18n'
import { BLOG_URL } from '@/lib/links'
import { useInView } from '@/lib/useInView'
import { useMeasuredHeight } from '@/lib/useMeasuredHeight'
import { useMediaQuery } from '@/lib/useMediaQuery'
import { cn } from '@/lib/utils'

type EarlierKey = keyof Translations['experience']['earlier']['roles']
const EARLIER_KEYS: readonly EarlierKey[] = [
  'infosys',
  'geekgarden',
  'ehealth',
  'traveloka',
]

// Sites for the collapsed earlier roles. Infosys Solusi Terpadu is omitted —
// its domain isn't confidently known, and a wrong link is worse than none.
const EARLIER_URL: Partial<Record<EarlierKey, string>> = {
  geekgarden: 'geekgarden.id',
  ehealth: 'ehealth.co.id',
  traveloka: 'traveloka.com',
}

// ---- Graph geometry -------------------------------------------------------
// The career rendered as a `git log --graph`: newest commit on top, the main
// rail in lane 0, parallel gigs in lane 1. The lanes are honest — eDOT ran
// alongside Ajaib and into the DBS era; Doubler's freelance ran alongside
// Danamon — so the branch/merge points anchor at the true neighbours.
const ROW_H = 56
const LANE_X = [18, 58] // commit-centre x per lane (gap > node ⌀ so lanes read)
const GRAPH_W = 80 // svg width; row labels start right of this

const LANES: Record<ExperienceSlug, 0 | 1> = {
  dbs: 0,
  edot: 1,
  ajaib: 0,
  danamon: 0,
  doubler: 1,
}

// Per-row pop-in stagger (ms) during the entrance — referenced by both the
// per-node delay and the "entrance is over" timeout so they can't drift.
const STAGGER_MS = 110

// The session reflog ring: keep a little more history than `git reflog` prints,
// so the listing is a stable window rather than the whole tail.
const REFLOG_KEEP = 12
const REFLOG_SHOW = 8

const rowY = (row: number) => row * ROW_H + ROW_H / 2

function branchPath([top, bottom]: [number, number]): string {
  const [x0, x1] = LANE_X
  const yT = rowY(top)
  const yB = rowY(bottom)
  return `M ${x0} ${yT} C ${x1} ${yT}, ${x1} ${yT}, ${x1} ${yT + 24} L ${x1} ${yB - 24} C ${x1} ${yB}, ${x0} ${yB}, ${x0} ${yB}`
}

// Deterministic fake short-hash per slug — git seasoning, not cryptography.
function hashOf(slug: string): string {
  let h = 2166136261
  for (const ch of slug) h = ((h ^ ch.charCodeAt(0)) * 16777619) >>> 0
  return h.toString(16).padStart(8, '0').slice(0, 7)
}

function yearRange(e: ExperienceEntry): string {
  const start = e.start.slice(0, 4)
  if (!e.end) return `${start} –`
  const end = e.end.slice(0, 4)
  return start === end ? start : `${start} – ${end.slice(2)}`
}

// Blog stories can deep-link a specific entry: /?exp=danamon#experience. Read
// once at mount; an invalid or absent param falls back to the newest role so
// the panel is never empty.
function initialSelection(): ExperienceSelection {
  const param = new URLSearchParams(window.location.search).get('exp')
  return isExperienceSelection(param) ? param : EXPERIENCE[0].slug
}

// A terminal prompt line that types itself (retypes when `text` changes) and
// keeps a blinking block cursor — instant under reduced motion. Screen readers
// get the full line via aria-label instead of the keystroke stream.
function TypedLine({
  text,
  active = true,
  className,
}: {
  text: string
  active?: boolean
  className?: string
}) {
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  // Progress is keyed to the text it was typed for, so a text change *derives*
  // back to 0 instead of a synchronous setState in the effect (the
  // react-hooks compiler rule forbids that — cascading renders).
  const [typed, setTyped] = useState({ for: text, n: 0 })
  const shown = reduce ? text.length : typed.for === text ? typed.n : 0
  useEffect(() => {
    if (!active || reduce) return
    const id = setInterval(() => {
      setTyped((prev) => {
        const current = prev.for === text ? prev.n : 0
        if (current >= text.length) {
          clearInterval(id)
          return prev
        }
        return { for: text, n: current + 1 }
      })
    }, 14)
    return () => clearInterval(id)
  }, [text, active, reduce])
  return (
    // span (not p): this also renders inside the prompt's <button>, which only
    // permits phrasing content.
    <span
      className={cn('text-muted-foreground block font-mono text-xs', className)}
    >
      <span className="sr-only">$ {text}</span>
      <span aria-hidden="true">
        <span className="text-brand">$</span> {text.slice(0, shown)}
        <span className="bg-muted-foreground/60 -mb-0.5 ml-px inline-block h-3.5 w-1.75 motion-safe:animate-pulse" />
      </span>
    </span>
  )
}

// Real architecture endpoints for `git remote -v` — env-aware, so dev shows
// localhost honestly and prod shows the deployed origins.
const LAB_URL = import.meta.env.VITE_LAB_URL ?? 'http://127.0.0.1:5174'
const PARTY_HOST = import.meta.env.VITE_PARTY_HOST ?? '127.0.0.1:1999'

// Refs the prompt understands. `main`/`HEAD` are aliases for the newest role;
// unique prefixes resolve too (`da` → danamon), like shell completion.
const REFS: string[] = [...EXPERIENCE.map((e) => e.slug), 'earlier', 'main']

function resolveRef(token: string): ExperienceSelection | null {
  const t = token.toLowerCase()
  if (t === 'main' || t === 'head') return EXPERIENCE[0].slug
  if (isExperienceSelection(t)) return t
  const matches = REFS.filter((r) => r !== 'main' && r.startsWith(t))
  return matches.length === 1 && isExperienceSelection(matches[0])
    ? matches[0]
    : null
}

// The checkout prompt is a real terminal line: a typed display (block cursor)
// until clicked, then an editable input. Enter executes, Tab completes against
// REFS, ↑/↓ recall command history, Esc exits. Supported commands: checkout
// (also as `checkout <ref>` or a bare ref), diff <a> <b> (stack diff between
// two jobs), log, reflog (the visitor's own session checkouts), whoami, help —
// plus a few guarded eggs (push, rm, stash). Terminal output stays literal
// English on purpose — real git is untranslated; only the input's accessible
// label is localized.
function CheckoutPrompt({
  active,
  onCheckout,
  reflogRef,
  output,
  setOutput,
}: {
  active: ExperienceSelection
  onCheckout: (sel: ExperienceSelection) => void
  reflogRef: { current: ExperienceSelection[] }
  // Terminal output is block-level state (the prompt is one writer, a graph
  // click is another that clears it), so it lives in the parent.
  output: string[]
  setOutput: (lines: string[]) => void
}) {
  const { t } = useTranslation()
  const canonical =
    active === EXPERIENCE[0].slug
      ? 'git checkout main'
      : `git checkout ${active}`
  const [editing, setEditing] = useState(false)
  const [value, setValue] = useState(canonical)
  const historyRef = useRef<string[]>([])
  const histIdxRef = useRef(-1)

  const usage = (cmd: string) => [
    `usage: git ${cmd}`,
    `hint: ${REFS.join(' · ')}`,
  ]
  const hashFor = (sel: ExperienceSelection) =>
    sel === 'earlier' ? 'init' : hashOf(sel)

  function doCheckout(token: string) {
    if (!token) {
      setOutput(usage('checkout <ref>'))
      return
    }
    const sel = resolveRef(token)
    if (!sel) {
      setOutput([
        `error: pathspec '${token}' did not match any ref`,
        `hint: ${REFS.join(' · ')}`,
      ])
      return
    }
    const isMain = sel === EXPERIENCE[0].slug
    setValue(isMain ? 'git checkout main' : `git checkout ${sel}`)
    // Git's real responses: switching to main vs a detached checkout.
    setOutput(
      isMain
        ? ["Switched to branch 'main'"]
        : [`HEAD is now at ${hashFor(sel)} ${t(`experience.commits.${sel}`)}`]
    )
    onCheckout(sel)
  }

  function doDiff(arg: string) {
    const tokens = arg
      .replace(/\.{2,3}/g, ' ')
      .split(/\s+/)
      .filter(Boolean)
    if (tokens.length !== 2) {
      setOutput(usage('diff <ref> <ref>'))
      return
    }
    const entries: ExperienceEntry[] = []
    for (const token of tokens) {
      const sel = resolveRef(token)
      const e =
        sel && sel !== 'earlier'
          ? EXPERIENCE.find((x) => x.slug === sel)
          : undefined
      if (!e) {
        setOutput([`fatal: ambiguous argument '${token}': unknown revision`])
        return
      }
      entries.push(e)
    }
    const [a, b] = entries
    const removed = a.stack.filter((s) => !b.stack.includes(s))
    const added = b.stack.filter((s) => !a.stack.includes(s))
    const lines = [`diff --career ${a.slug}..${b.slug}`]
    if (removed.length === 0 && added.length === 0)
      lines.push('(no stack changes)')
    for (const s of removed) lines.push(`- ${s}`)
    for (const s of added) lines.push(`+ ${s}`)
    setOutput(lines)
  }

  function execute() {
    const raw = value.trim()
    if (!raw) {
      setOutput(usage('checkout <ref>'))
      return
    }
    historyRef.current.push(raw)
    if (historyRef.current.length > 50) historyRef.current.shift()
    histIdxRef.current = -1
    const isGit = /^git\s+/i.test(raw)
    const stripped = raw.replace(/^git\s+/i, '')
    const [cmd = '', ...rest] = stripped.split(/\s+/)
    const arg = rest.join(' ')
    switch (cmd.toLowerCase()) {
      case 'checkout':
      case 'switch':
        doCheckout(arg)
        return
      case 'diff':
        doDiff(arg)
        return
      case 'log':
        setOutput([
          ...EXPERIENCE.map(
            (e) => `${hashOf(e.slug)} ${t(`experience.commits.${e.slug}`)}`
          ),
          `init ${t('experience.commits.earlier')}`,
        ])
        return
      case 'reflog':
        setOutput(
          reflogRef.current
            .slice(0, REFLOG_SHOW)
            .map(
              (sel, i) =>
                `${hashFor(sel)} HEAD@{${i}}: checkout: moving to ${sel}`
            )
        )
        return
      case 'whoami':
        setOutput([
          `naufal · ${t(`experience.roles.${EXPERIENCE[0].slug}`)} @ ${EXPERIENCE[0].company}`,
        ])
        return
      case 'status':
        setOutput([
          'On branch main',
          `nothing to commit, working tree clean — shipping at ${EXPERIENCE[0].company}`,
        ])
        return
      case 'tag':
        setOutput(['cum-laude-2023', 'pkm-funding-2021', 'unity-bootcamp-2022'])
        return
      // The double meaning this portfolio earns: the git remotes ARE the
      // architecture's remotes.
      case 'remote': {
        const bare = (u: string) => u.replace(/^https?:\/\//, '')
        setOutput([
          `lab    ${bare(LAB_URL)}  (federated remote)`,
          `blog   ${bare(BLOG_URL)}  (stories · cv)`,
          `party  ${PARTY_HOST}  (presence relay)`,
        ])
        return
      }
      case 'clear':
        setOutput([])
        return
      case 'help':
      case '--help':
        setOutput([
          'commands: checkout <ref> · diff <a> <b> · log · reflog · status',
          'tag · remote -v · whoami · clear · help',
          `refs: ${REFS.join(' · ')}`,
        ])
        return
      case 'push':
        setOutput(['remote: error: refusing to push — main is production'])
        return
      case 'rm':
      case 'sudo':
        setOutput(['nice try.'])
        return
      case 'stash':
        setOutput(['nothing to stash — everything already shipped.'])
        return
      default: {
        // Bare-ref convenience: `danamon` alone behaves like a checkout.
        if (!isGit && resolveRef(stripped)) {
          doCheckout(stripped)
          return
        }
        setOutput(
          isGit
            ? [`git: '${cmd}' is not a git command. See 'help'.`]
            : [
                `error: pathspec '${stripped}' did not match any ref`,
                `hint: ${REFS.join(' · ')}`,
              ]
        )
      }
    }
  }

  function recall(direction: -1 | 1) {
    const history = historyRef.current
    if (history.length === 0) return
    let idx = histIdxRef.current
    if (direction === -1)
      idx = idx < 0 ? history.length - 1 : Math.max(0, idx - 1)
    else {
      if (idx < 0) return
      idx = idx + 1
      if (idx >= history.length) {
        histIdxRef.current = -1
        setValue('')
        return
      }
    }
    histIdxRef.current = idx
    setValue(history[idx])
  }

  function complete() {
    const parts = value.split(/\s+/)
    const last = parts[parts.length - 1]?.toLowerCase() ?? ''
    if (!last) return
    const matches = REFS.filter((r) => r.startsWith(last))
    if (matches.length === 1) {
      parts[parts.length - 1] = matches[0]
      setValue(parts.join(' '))
      setOutput([])
    } else if (matches.length > 1) {
      setOutput([matches.join('  ')])
    }
  }

  if (!editing) {
    return (
      <div className="mb-2">
        {/* Reads as a clickable terminal input, not static output: a dashed box
            that lights on hover plus a persistent "type" cue — so the visitor
            discovers the prompt is a real shell (the block's richest interaction
            is otherwise easy to miss). */}
        <button
          type="button"
          aria-label={t('experience.promptLabel')}
          title={t('experience.promptLabel')}
          onClick={() => {
            setValue(canonical)
            setOutput([])
            setEditing(true)
          }}
          className="group/prompt border-border/60 hover:border-brand/40 hover:bg-muted/30 focus-visible:ring-brand/40 -mx-1 flex w-[calc(100%+0.5rem)] cursor-text items-center gap-2 rounded-md border border-dashed px-2 py-1.5 text-left transition-colors focus:outline-none focus-visible:ring-2"
        >
          <TypedLine text={canonical} className="min-w-0 flex-1 truncate" />
          <span className="text-muted-foreground/60 group-hover/prompt:text-brand flex shrink-0 items-center gap-1 font-mono text-[10px] transition-colors">
            <Terminal className="size-3" aria-hidden="true" />
            {t('experience.promptCta')}
          </span>
        </button>
        <span className="text-muted-foreground/50 mt-1 block font-mono text-[10px]">
          {'// '}
          {t('experience.promptHint')}
        </span>
      </div>
    )
  }

  return (
    <div className="mb-2">
      <div className="text-foreground flex items-center font-mono text-xs">
        <span className="text-brand">$</span>
        <input
          // Focus on mount is intentional: edit mode only exists because the
          // visitor just clicked the prompt.
          autoFocus
          value={value}
          onChange={(e) => {
            setValue(e.target.value)
            setOutput([])
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') execute()
            else if (e.key === 'Tab') {
              e.preventDefault()
              complete()
            } else if (e.key === 'Escape') setEditing(false)
            else if (e.key === 'ArrowUp') {
              e.preventDefault()
              recall(-1)
            } else if (e.key === 'ArrowDown') {
              e.preventDefault()
              recall(1)
            }
          }}
          onBlur={() => setEditing(false)}
          aria-label={t('experience.promptLabel')}
          placeholder="git checkout <ref>"
          spellCheck={false}
          autoComplete="off"
          autoCapitalize="off"
          className="caret-brand placeholder:text-muted-foreground/40 ml-[0.6em] min-w-0 flex-1 bg-transparent outline-none"
        />
      </div>
      {output.length > 0 && (
        // A distinct output pane (not the bare flow) so terminal output reads
        // as terminal output, separate from the commit card below it.
        <div className="border-border/50 bg-muted/30 relative mt-1.5 max-h-44 overflow-auto rounded-md border py-2 pr-7 pl-3">
          <button
            type="button"
            aria-label={t('experience.clearOutput')}
            title={t('experience.clearOutput')}
            onClick={() => setOutput([])}
            className="text-muted-foreground/50 hover:text-foreground absolute top-1 right-1.5 font-mono text-sm leading-none"
          >
            ×
          </button>
          {output.map((line, i) => (
            // Tones: git errors + diff removals red, diff additions green
            // (status colors stay literal — state, not theme). whitespace-pre +
            // the pane's overflow gives a real terminal's horizontal scroll
            // instead of mid-line wrapping that breaks tabular output.
            <p
              key={i}
              className={cn(
                'text-muted-foreground font-mono text-[11px] whitespace-pre',
                /^(error|fatal|remote:|git:|- )/.test(line) ||
                  line === 'nice try.'
                  ? 'text-red-400'
                  : line.startsWith('+') && 'text-emerald-400'
              )}
            >
              {line}
            </p>
          ))}
        </div>
      )}
    </div>
  )
}

// The block: a git-graph career (commits clickable) + a detail panel with
// role / period / stack / summary. Two conditional actions per entry, driven
// by the registry: "read the story" (blog /work page exists) and "run the
// demo" (a federated remote is registered — mounted inline, LiveRemote-style).
// The graph is host-native; the demos it launches are the boundary-crossing
// part.
export function ExperienceBlock() {
  const { t, i18n } = useTranslation()
  const locale = isLocale(i18n.resolvedLanguage)
    ? i18n.resolvedLanguage
    : DEFAULT_LOCALE
  const [active, setActive] = useState<ExperienceSelection>(initialSelection)
  // Which entry's demo has been explicitly started (no demo loads on its own).
  const [demoFor, setDemoFor] = useState<ExperienceSelection | null>(null)
  // Terminal output, owned here so a graph-node click can clear it (a checkout
  // typed in the prompt keeps its "HEAD is now at…" line; a click resets).
  const [output, setOutput] = useState<string[]>([])

  // Every checkout this session, newest first — `git reflog` in the prompt
  // replays it. Seeded with the initial selection.
  const reflogRef = useRef<ExperienceSelection[]>([active])
  const select = (sel: ExperienceSelection) => {
    if (sel !== active) {
      reflogRef.current = [sel, ...reflogRef.current].slice(0, REFLOG_KEEP)
    }
    setActive(sel)
  }

  const entry = EXPERIENCE.find((e) => e.slug === active)

  const monthFmt = new Intl.DateTimeFormat(locale, {
    month: 'short',
    year: 'numeric',
  })
  const month = (iso: string) => monthFmt.format(new Date(`${iso}-01T00:00:00`))
  const period = (e: ExperienceEntry) =>
    `${month(e.start)} – ${e.end ? month(e.end) : t('experience.present')}`

  // Draw-in: the rails sketch themselves and the commits pop in sequence when
  // the graph scrolls into view (everything is simply visible under reduced
  // motion). `pathLength=1` normalizes every path so dashoffset 1→0 draws it.
  const [graphRef, inView] = useInView<HTMLDivElement>()
  const reduce = useMediaQuery('(prefers-reduced-motion: reduce)')
  const drawn = reduce || inView
  // The pop-in stagger must exist only WHILE the entrance plays — left on the
  // nodes permanently, it made every later selection change wait idx*110ms
  // (the lower the commit, the laggier the ring felt). Once the entrance is
  // over, transitions run with zero delay.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!drawn) return
    const id = setTimeout(
      () => setEntered(true),
      (EXPERIENCE.length + 1) * STAGGER_MS + 400
    )
    return () => clearTimeout(id)
  }, [drawn])

  // Height-animated detail panel — shared measured-height engine.
  const [panelRef, panelHeight] = useMeasuredHeight<HTMLDivElement>()

  const rows: {
    sel: ExperienceSelection
    lane: 0 | 1
    head?: boolean
    e?: ExperienceEntry
  }[] = [
    ...EXPERIENCE.map((e) => ({
      sel: e.slug as ExperienceSelection,
      lane: LANES[e.slug],
      head: e.slug === EXPERIENCE[0].slug,
      e,
    })),
    { sel: 'earlier' as ExperienceSelection, lane: 0 },
  ]
  const graphH = rows.length * ROW_H

  // The selected commit lights its rail: main rail for lane-0 commits, the
  // branch arc for the parallel gigs — checking out eDOT lights its branch.
  const activeLane = rows.find((r) => r.sel === active)?.lane ?? 0
  // Each lane-1 entry is an isolated parallel gig; its branch arc merges at the
  // commit above and forks at the one below. Derived from row positions (not a
  // hand-authored table) so reordering or adding jobs can't desync the geometry
  // or the branch-highlight mapping.
  const branches = rows
    .map((row, i) => ({ slug: row.sel, lane: row.lane, i }))
    .filter((r) => r.lane === 1)
    .map((r) => ({ slug: r.slug, merge: r.i - 1, fork: r.i + 1 }))
  const rail = (path: string, delay: number, highlighted: boolean) => (
    <path
      d={path}
      pathLength={1}
      fill="none"
      className={cn(
        'transition-[stroke]',
        highlighted ? 'stroke-brand/60' : 'stroke-border'
      )}
      strokeWidth="2"
      style={{
        strokeDasharray: 1,
        strokeDashoffset: drawn ? 0 : 1,
        transition: reduce
          ? undefined
          : `stroke-dashoffset 800ms ease-out ${delay}ms, stroke 300ms`,
      }}
    />
  )

  return (
    <Cell id="experience" label="// experience · host-native React">
      <div className="md:grid md:grid-cols-2 md:items-start md:gap-5">
        {/* The graph, headed by its own prompt (types once, on reveal) */}
        <div>
          <TypedLine
            text="git log --graph naufal"
            active={inView}
            className="mb-3"
          />
          <div
            ref={graphRef}
            role="group"
            aria-label={t('experience.lineLabel')}
            className="relative"
            style={{ height: graphH }}
          >
            <svg
              aria-hidden="true"
              width={GRAPH_W}
              height={graphH}
              viewBox={`0 0 ${GRAPH_W} ${graphH}`}
              className="absolute top-0 left-0"
            >
              {rail(
                `M ${LANE_X[0]} ${rowY(0)} L ${LANE_X[0]} ${rowY(rows.length - 1)}`,
                0,
                activeLane === 0
              )}
              {branches.map((b, i) => (
                <Fragment key={b.slug}>
                  {rail(
                    branchPath([b.merge, b.fork]),
                    250 + i * 200,
                    active === b.slug
                  )}
                </Fragment>
              ))}
            </svg>

            {rows.map((row, idx) => {
              const selected = active === row.sel
              return (
                <button
                  key={row.sel}
                  type="button"
                  aria-pressed={selected}
                  onClick={() => {
                    setOutput([])
                    select(row.sel)
                  }}
                  className={cn(
                    'hover:bg-muted/40 focus-visible:ring-brand/40 group relative block w-full rounded-md text-left transition-colors focus:outline-none focus-visible:ring-2',
                    selected && 'bg-muted/30'
                  )}
                  style={{ height: ROW_H }}
                >
                  {/* Commit node, on its lane */}
                  <span
                    className={cn(
                      // NO -translate-y-1/2 class: Tailwind v4 translate is a separate CSS
                      // property and would STACK with the inline transform's
                      // translateY(-50%), floating the node a half-node too high
                      // (it collided with the git-log header line).
                      'bg-card absolute top-1/2 flex size-9 items-center justify-center rounded-full border transition-[transform,border-color,opacity] duration-200',
                      row.sel === 'earlier' && 'border-dashed',
                      selected
                        ? 'border-brand/60 scale-110'
                        : 'border-border group-hover:scale-105'
                    )}
                    style={{
                      left: LANE_X[row.lane] - 18,
                      opacity: drawn ? 1 : 0,
                      transform: drawn
                        ? 'translateY(-50%) scale(1)'
                        : 'translateY(-50%) scale(0.5)',
                      transitionDelay:
                        reduce || entered ? undefined : `${idx * STAGGER_MS}ms`,
                    }}
                  >
                    {row.e ? (
                      <>
                        <span
                          aria-hidden="true"
                          className="[&_path]:fill-current [&_svg]:block [&_svg]:size-5"
                          style={{ color: row.e.glyphColor }}
                          dangerouslySetInnerHTML={{ __html: row.e.glyph }}
                        />
                        {row.e.badge && (
                          <span
                            aria-hidden="true"
                            className="bg-card absolute -right-1 -bottom-1 flex size-4 items-center justify-center rounded-full border [&_path]:fill-current [&_svg]:size-2.5"
                            style={
                              row.e.badgeColor
                                ? { color: row.e.badgeColor }
                                : undefined
                            }
                            dangerouslySetInnerHTML={{ __html: row.e.badge }}
                          />
                        )}
                      </>
                    ) : (
                      <MoreHorizontal className="text-muted-foreground size-4" />
                    )}
                    {/* The pulse marks where HEAD is — it follows the selection
                      (selecting a commit is a checkout). */}
                    {selected && (
                      <span className="bg-brand absolute -top-0.5 -right-0.5 size-2 rounded-full motion-safe:animate-pulse" />
                    )}
                  </span>

                  {/* git-log line: name + refs + date, then hash · message */}
                  <span className="absolute inset-y-0 right-2 left-24 flex min-w-0 flex-col justify-center gap-1 leading-tight">
                    <span className="flex min-w-0 items-center gap-2.5">
                      <span
                        className={cn(
                          'font-mono text-xs',
                          selected ? 'text-foreground' : 'text-muted-foreground'
                        )}
                      >
                        {row.e ? row.e.short : t('experience.earlier.node')}
                      </span>
                      {selected && (
                        <span className="border-brand/40 text-brand shrink-0 rounded border px-1.5 py-px font-mono text-[9px]">
                          {row.head ? 'HEAD → main' : 'HEAD'}
                        </span>
                      )}
                      {row.head && !selected && (
                        <span className="border-border text-muted-foreground shrink-0 rounded border px-1.5 py-px font-mono text-[9px]">
                          main
                        </span>
                      )}
                      {row.e && (
                        <span className="text-muted-foreground/60 ml-auto shrink-0 pl-3 font-mono text-[10px]">
                          {yearRange(row.e)}
                        </span>
                      )}
                    </span>
                    <span className="text-muted-foreground/60 truncate font-mono text-[10px]">
                      {row.e ? hashOf(row.sel) : 'init'} ·{' '}
                      {t(`experience.commits.${row.sel}`)}
                    </span>
                  </span>
                </button>
              )
            })}
          </div>
        </div>

        {/* Detail panel, headed by the checkout prompt (retypes per selection;
            click it to type your own command) */}
        <div className="mt-3 md:mt-0">
          <CheckoutPrompt
            active={active}
            onCheckout={select}
            reflogRef={reflogRef}
            output={output}
            setOutput={setOutput}
          />
          <div
            className="overflow-hidden transition-[height] duration-200 ease-out"
            style={{ height: panelHeight }}
          >
            <div
              ref={panelRef}
              className="border-border/70 rounded-lg border border-dashed px-4 py-3"
            >
              {entry ? (
                <>
                  <div className="flex flex-wrap items-baseline justify-between gap-x-3 gap-y-0.5">
                    <span className="flex items-baseline gap-2">
                      <span className="text-foreground font-medium">
                        {entry.company}
                      </span>
                      <span className="text-muted-foreground/70 font-mono text-[10px]">
                        {t(`experience.industries.${entry.slug}`)}
                      </span>
                    </span>
                    <span className="text-muted-foreground font-mono text-xs">
                      {period(entry)}
                    </span>
                  </div>
                  <div className="text-muted-foreground mt-0.5 font-mono text-xs">
                    {t(`experience.roles.${entry.slug}`)} ·{' '}
                    {entry.stack.join(' · ')}
                  </div>
                  <p className="text-muted-foreground mt-2 text-sm leading-relaxed">
                    {t(`experience.summaries.${entry.slug}`)}
                  </p>
                  {/* git show --stat for a career: what this job added to the
                      toolbox. Status green stays literal — state, not theme. */}
                  {entry.adds.length > 0 && (
                    <p className="mt-2 font-mono text-[11px] leading-relaxed">
                      {entry.adds.map((tool) => (
                        <span
                          key={tool}
                          className="mr-2 inline-block text-emerald-400"
                        >
                          + {tool}
                        </span>
                      ))}
                    </p>
                  )}
                  <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2">
                    <a
                      href={`https://${entry.url}`}
                      target="_blank"
                      rel="noreferrer"
                      className="text-muted-foreground hover:text-foreground font-mono text-xs transition-colors"
                    >
                      {entry.url} ↗
                    </a>
                    {entry.story && (
                      <a
                        href={`${BLOG_URL}/work/${entry.story}`}
                        className={cn(
                          buttonVariants({ variant: 'outline', size: 'sm' }),
                          'font-mono text-xs'
                        )}
                      >
                        {t('experience.actions.story')}
                      </a>
                    )}
                    {entry.demo && demoFor !== entry.slug && (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setDemoFor(entry.slug)}
                      >
                        <Play className="size-3.5" />
                        {t('experience.actions.demo')}
                      </Button>
                    )}
                  </div>
                  {entry.demo && demoFor === entry.slug && (
                    <div className="border-border/70 mt-3 rounded-lg border border-dashed p-4">
                      <RemoteMount
                        eager
                        load={entry.demo.load}
                        opts={{ context: 'host' }}
                        fallback={
                          <p className="text-muted-foreground font-mono text-xs">
                            {t('experience.demoUnavailable')}
                          </p>
                        }
                      />
                    </div>
                  )}
                </>
              ) : (
                <>
                  <span className="text-foreground font-medium">
                    {t('experience.earlier.title')}
                  </span>
                  <ul className="text-muted-foreground mt-2 space-y-1.5 text-sm leading-relaxed">
                    {EARLIER_KEYS.map((key) => (
                      <li key={key}>
                        {t(`experience.earlier.roles.${key}`)}
                        {EARLIER_URL[key] && (
                          <>
                            {' '}
                            <a
                              href={`https://${EARLIER_URL[key]}`}
                              target="_blank"
                              rel="noreferrer"
                              aria-label={`${EARLIER_URL[key]} ↗`}
                              className="text-muted-foreground/60 hover:text-foreground transition-colors"
                            >
                              ↗
                            </a>
                          </>
                        )}
                      </li>
                    ))}
                  </ul>
                  <a
                    href={`${BLOG_URL}/cv`}
                    className="text-muted-foreground hover:text-foreground mt-3 inline-block font-mono text-xs transition-colors"
                  >
                    {t('experience.earlier.cvLink')}
                  </a>
                </>
              )}
            </div>
          </div>
        </div>
      </div>
    </Cell>
  )
}
