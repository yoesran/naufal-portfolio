import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { Radio } from 'lucide-react'

import mfSvg from '@/assets/tech-stacks/module-federation.svg?raw'
import nextSvg from '@/assets/tech-stacks/nextdotjs.svg?raw'
import reactSvg from '@/assets/tech-stacks/react.svg?raw'
import svelteSvg from '@/assets/tech-stacks/svelte.svg?raw'
import { Cell } from '@/components/Cell'
import {
  Popover,
  PopoverContent,
  PopoverDescription,
  PopoverTitle,
  PopoverTrigger,
} from '@/components/ui/popover'
import { LAB_URL } from '@/lib/lab-remote'
import { BLOG_URL } from '@/lib/links'
import { cn } from '@/lib/utils'

// Shape of the published run summary (produced by scripts/reports.mjs).
type SuiteHealth = {
  runner: string
  total: number
  passed: number
  failed: number
  durationMs: number
}
type WorkspaceHealth = SuiteHealth & { project: string; report?: string }
type Health = {
  generatedAt: string
  commit?: string
  suites: { unit: SuiteHealth; e2e: SuiteHealth }
  workspace?: WorkspaceHealth[]
}

// The reports site (naufal-reports Pages) holds the full HTML reports + the
// summary JSON. Env-overridable; defaults to the live project. In dev the summary
// comes from the same-origin seed, while the report links always point live.
const REPORTS_BASE =
  import.meta.env.VITE_REPORTS_URL ?? 'https://naufal-reports.pages.dev'
const HEALTH_URL = import.meta.env.VITE_REPORTS_URL
  ? `${import.meta.env.VITE_REPORTS_URL}/health.json`
  : '/health.json'

// --- The system as a graph ---------------------------------------------------
// The four apps as nodes on a 0–100 plane (SVG edges + absolutely-placed tiles
// share these coords), wired by their real relationships. This is NOT a test
// runner — it's a live map of the deployed system: the edges carry a subtle
// always-on "current" (those connections really are live), the nodes show the
// last published test result, and each opens a popover to visit the app + its
// report. Nothing here pretends to run tests on the visitor's machine.
type NodeId = 'host' | 'naufal-lab' | 'naufal-party' | 'naufal-blog'

const POS: Record<NodeId, { x: number; y: number }> = {
  host: { x: 20, y: 26 },
  'naufal-lab': { x: 80, y: 26 },
  'naufal-party': { x: 31, y: 82 },
  'naufal-blog': { x: 82, y: 82 },
}
// Honest edges: host imports lab over federation; both talk to the party server
// over a WebSocket; the blog is standalone (no edge — it ships on its own).
const EDGES: {
  from: NodeId
  to: NodeId
  labelKey: 'federation' | 'websocket'
}[] = [
  { from: 'host', to: 'naufal-lab', labelKey: 'federation' },
  { from: 'host', to: 'naufal-party', labelKey: 'websocket' },
  { from: 'naufal-lab', to: 'naufal-party', labelKey: 'websocket' },
]

type ReportLink = { href: string; label: string }
type NodeData = {
  id: NodeId
  name: string
  roleKey: 'host' | 'lab' | 'party' | 'blog'
  aboutKey: 'host' | 'lab' | 'party' | 'blog'
  glyph?: string
  icon?: typeof Radio
  color: string
  badge?: string
  standalone?: boolean
  visit?: string // live app URL (party is a WS server — no web page, so none)
  passed: number
  total: number
  failed: number
  reports: ReportLink[]
}

const fmtDur = (ms: number) =>
  ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

export function QualityBlock() {
  const { t, i18n } = useTranslation()
  const [health, setHealth] = useState<Health | null>(null)
  const [state, setState] = useState<'loading' | 'ready' | 'error'>('loading')
  // Captured in the fetch callback (not during render) so "ago" stays a pure
  // render — the React Compiler forbids Date.now() in the render path.
  const [loadedAt, setLoadedAt] = useState(0)

  useEffect(() => {
    let cancelled = false
    fetch(HEALTH_URL, { cache: 'no-store' })
      .then((r) => (r.ok ? r.json() : Promise.reject(new Error(`${r.status}`))))
      .then((d: Health) => {
        if (!cancelled) {
          setHealth(d)
          setState('ready')
          setLoadedAt(Date.now())
        }
      })
      .catch(() => {
        if (!cancelled) setState('error')
      })
    return () => {
      cancelled = true
    }
  }, [])

  const ws = Object.fromEntries(
    (health?.workspace ?? []).map((w) => [w.project, w])
  )
  const hostUnit = health?.suites.unit
  const hostE2e = health?.suites.e2e
  const wsNode = (id: NodeId) => ws[id] as WorkspaceHealth | undefined
  // A sibling's Vitest report link, but only when that run actually published
  // its HTML (reports.mjs leaves `report` unset otherwise) — no dead links.
  const wsReport = (id: NodeId): ReportLink[] => {
    const n = wsNode(id)
    return n?.report
      ? [{ href: `${REPORTS_BASE}${n.report}`, label: 'Vitest' }]
      : []
  }

  // The node models, built from the published data.
  const nodes: NodeData[] = health
    ? [
        {
          id: 'host',
          name: 'host',
          roleKey: 'host',
          aboutKey: 'host',
          glyph: reactSvg,
          color: '#61DAFB',
          badge: mfSvg,
          // You're already on the host, but link it for completeness.
          visit: window.location.origin,
          passed: (hostUnit?.passed ?? 0) + (hostE2e?.passed ?? 0),
          total: (hostUnit?.total ?? 0) + (hostE2e?.total ?? 0),
          failed: (hostUnit?.failed ?? 0) + (hostE2e?.failed ?? 0),
          reports: [
            { href: `${REPORTS_BASE}/vitest/`, label: 'Vitest' },
            { href: `${REPORTS_BASE}/playwright/`, label: 'Playwright' },
          ],
        },
        {
          id: 'naufal-lab',
          name: 'lab',
          roleKey: 'lab',
          aboutKey: 'lab',
          glyph: svelteSvg,
          color: '#FF3E00',
          visit: LAB_URL,
          passed: wsNode('naufal-lab')?.passed ?? 0,
          total: wsNode('naufal-lab')?.total ?? 0,
          failed: wsNode('naufal-lab')?.failed ?? 0,
          reports: wsReport('naufal-lab'),
        },
        {
          id: 'naufal-party',
          name: 'party',
          roleKey: 'party',
          aboutKey: 'party',
          icon: Radio,
          color: 'oklch(0.702 0.183 293.541)',
          // A WebSocket server — no browsable page, so no visit link.
          passed: wsNode('naufal-party')?.passed ?? 0,
          total: wsNode('naufal-party')?.total ?? 0,
          failed: wsNode('naufal-party')?.failed ?? 0,
          reports: wsReport('naufal-party'),
        },
        {
          id: 'naufal-blog',
          name: 'blog',
          roleKey: 'blog',
          aboutKey: 'blog',
          glyph: nextSvg,
          color: 'var(--foreground)',
          standalone: true,
          visit: BLOG_URL,
          passed: wsNode('naufal-blog')?.passed ?? 0,
          total: wsNode('naufal-blog')?.total ?? 0,
          failed: wsNode('naufal-blog')?.failed ?? 0,
          reports: wsReport('naufal-blog'),
        },
      ]
    : []

  const totals = nodes.reduce(
    (a, n) => ({ passed: a.passed + n.passed, failed: a.failed + n.failed }),
    { passed: 0, failed: 0 }
  )
  const allGreen = nodes.length > 0 && totals.failed === 0

  const ago = (iso: string) => {
    const diffMin = Math.round((loadedAt - new Date(iso).getTime()) / 60000)
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute')
    const hr = Math.round(diffMin / 60)
    if (Math.abs(hr) < 24) return rtf.format(-hr, 'hour')
    return rtf.format(-Math.round(hr / 24), 'day')
  }

  return (
    <Cell id="quality" label="// quality · the system, tested">
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t('quality.description')}
      </p>

      {state === 'ready' && health ? (
        <>
          {/* The live architecture map — the four apps, wired by their real
              edges. Click a node to read about it, visit it, or open its report. */}
          <div
            role="group"
            aria-label={t('quality.mapLabel')}
            className="relative mt-5 h-90 sm:h-80"
          >
            {/* Edges (behind the tiles). non-scaling-stroke keeps width constant
                under the stretched viewBox; `quality-edge` adds the live current. */}
            <svg
              viewBox="0 0 100 100"
              preserveAspectRatio="none"
              className="absolute inset-0 h-full w-full"
              aria-hidden="true"
            >
              {EDGES.map((e) => {
                const a = POS[e.from]
                const b = POS[e.to]
                return (
                  <line
                    key={`${e.from}-${e.to}`}
                    x1={a.x}
                    y1={a.y}
                    x2={b.x}
                    y2={b.y}
                    strokeWidth={1.5}
                    vectorEffect="non-scaling-stroke"
                    className="stroke-brand/45 quality-edge"
                  />
                )
              })}
            </svg>

            {/* Edge labels at midpoints (hidden on phones to avoid clutter). */}
            {EDGES.map((e) => {
              const a = POS[e.from]
              const b = POS[e.to]
              return (
                <span
                  key={`lbl-${e.from}-${e.to}`}
                  aria-hidden="true"
                  className="text-muted-foreground/50 absolute hidden -translate-x-1/2 -translate-y-1/2 font-mono text-[9px] whitespace-nowrap sm:block"
                  style={{
                    left: `${(a.x + b.x) / 2}%`,
                    top: `${(a.y + b.y) / 2}%`,
                  }}
                >
                  {t(`quality.edges.${e.labelKey}`)}
                </span>
              )
            })}

            {/* Nodes */}
            {nodes.map((n) => (
              <Node key={n.id} node={n} />
            ))}
          </div>

          {/* Status line — the last published run (these are recorded results,
              not a live trigger). */}
          <div className="mt-3 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
            <span
              className={cn(
                'flex items-center gap-1.5',
                allGreen ? 'text-emerald-400' : 'text-red-400'
              )}
            >
              <span
                className={cn(
                  'inline-block size-2 rounded-full',
                  allGreen ? 'bg-emerald-400' : 'bg-red-400'
                )}
              />
              {allGreen
                ? t('quality.allPassing')
                : t('quality.failing', { failed: totals.failed })}
            </span>
            <span className="text-muted-foreground/60">
              {t('quality.lastRun', { ago: ago(health.generatedAt) })}
            </span>
            {health.commit && (
              <span className="text-muted-foreground/50">
                · {health.commit.slice(0, 7)}
              </span>
            )}
          </div>
        </>
      ) : (
        <div className="border-border/60 bg-muted/20 mt-4 rounded-lg border border-dashed p-4 font-mono text-xs">
          <p className="text-muted-foreground/70">
            {state === 'loading' ? t('quality.loading') : t('quality.noRun')}
          </p>
        </div>
      )}

      {/* Per-suite durations, quietly, so the "real run" detail isn't lost. */}
      {state === 'ready' && health && (
        <p className="text-muted-foreground/40 mt-3 font-mono text-[10px]">
          {hostUnit && hostE2e
            ? `vitest ${fmtDur(hostUnit.durationMs)} · playwright ${fmtDur(hostE2e.durationMs)}`
            : ''}
        </p>
      )}
    </Cell>
  )
}

// One app on the map: a status-ringed glyph + name + role + count, opening a
// popover (its one-line explanation, plus links to visit it and open its report).
function Node({ node }: { node: NodeData }) {
  const { t } = useTranslation()
  const green = node.failed === 0

  return (
    <div
      className="absolute -translate-x-1/2 -translate-y-1/2"
      style={{ left: `${POS[node.id].x}%`, top: `${POS[node.id].y}%` }}
    >
      <Popover>
        <PopoverTrigger
          aria-label={`${node.id} — ${t(`quality.roles.${node.roleKey}`)}`}
          className="hover:bg-muted/40 focus-visible:ring-brand/40 -m-1 flex w-32 cursor-pointer flex-col items-center gap-1 rounded-lg p-1 text-center transition-colors focus:outline-none focus-visible:ring-2 sm:w-36"
        >
          <span
            className={cn(
              'bg-card relative flex size-12 items-center justify-center rounded-full border transition-colors',
              green ? 'border-emerald-400/60' : 'border-red-400/60'
            )}
          >
            {node.icon ? (
              <node.icon className="size-5" style={{ color: node.color }} />
            ) : (
              <span
                aria-hidden="true"
                className="[&_path]:fill-current [&_svg]:size-6"
                style={{ color: node.color }}
                dangerouslySetInnerHTML={{ __html: node.glyph ?? '' }}
              />
            )}
            {node.badge && (
              <span
                aria-hidden="true"
                className="bg-card absolute -right-1 -bottom-1 flex size-5 items-center justify-center rounded-full border [&_svg]:size-3.5"
                dangerouslySetInnerHTML={{ __html: node.badge }}
              />
            )}
            <span
              className={cn(
                'border-card absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2',
                green ? 'bg-emerald-400' : 'bg-red-400'
              )}
            />
          </span>

          <span className="leading-tight">
            <span className="text-foreground block font-mono text-xs">
              {node.name}
            </span>
            <span className="text-muted-foreground/70 block font-mono text-[10px]">
              {t(`quality.roles.${node.roleKey}`)}
            </span>
          </span>
          <span
            className={cn(
              'font-mono text-[11px] tabular-nums',
              green ? 'text-emerald-400' : 'text-red-400'
            )}
          >
            {node.passed}/{node.total}
          </span>
          {node.standalone && (
            <span className="border-border/60 text-muted-foreground/60 rounded border px-1.5 py-px font-mono text-[9px]">
              {t('quality.edges.standalone')}
            </span>
          )}
        </PopoverTrigger>

        <PopoverContent>
          <PopoverTitle className="font-mono">{node.id}</PopoverTitle>
          <PopoverDescription className="mt-1 leading-relaxed">
            {t(`quality.about.${node.aboutKey}`)}
          </PopoverDescription>
          <p className="text-muted-foreground/70 mt-2 font-mono text-xs">
            {t('quality.passing', { passed: node.passed, total: node.total })}
          </p>
          <div className="mt-3 flex flex-wrap gap-x-4 gap-y-1.5 font-mono text-xs">
            {node.visit && (
              <a
                href={node.visit}
                target="_blank"
                rel="noreferrer"
                className="text-brand hover:text-brand/80 transition-colors"
              >
                {t('quality.visit')}
                <span aria-hidden="true"> ↗</span>
              </a>
            )}
            {node.reports.map((r) => (
              <a
                key={r.href}
                href={r.href}
                target="_blank"
                rel="noreferrer"
                aria-label={`${node.id} ${r.label} — ${t('quality.openReport')}`}
                className="text-brand hover:text-brand/80 transition-colors"
              >
                {r.label}
                <span aria-hidden="true"> ↗</span>
              </a>
            ))}
          </div>
        </PopoverContent>
      </Popover>
    </div>
  )
}
