import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'

import { FlaskConical, Package, Terminal } from 'lucide-react'

import { Cell } from '@/components/Cell'
import { cn } from '@/lib/utils'

// Shape of the published run summary (produced by scripts/reports.mjs).
type SuiteHealth = {
  runner: string
  total: number
  passed: number
  failed: number
  durationMs: number
}
// The host's two suites publish full HTML reports; each workspace project's own
// Vitest also publishes one (`report` is its path on the reports site). See
// scripts/reports.mjs.
type WorkspaceHealth = SuiteHealth & { project: string; report?: string }
type Health = {
  generatedAt: string
  commit?: string
  suites: { unit: SuiteHealth; e2e: SuiteHealth }
  workspace?: WorkspaceHealth[]
}

// The reports site (naufal-reports Pages) holds the full HTML reports + the
// summary JSON. Env-overridable for a future custom domain; defaults to the live
// project. In dev the summary comes from the same-origin seed so the smoke suite
// stays self-contained, while the report links always point at the live site.
const REPORTS_BASE =
  import.meta.env.VITE_REPORTS_URL ?? 'https://naufal-reports.pages.dev'
const HEALTH_URL = import.meta.env.VITE_REPORTS_URL
  ? `${import.meta.env.VITE_REPORTS_URL}/health.json`
  : '/health.json'

const fmtDur = (ms: number) =>
  ms < 1000 ? `${ms}ms` : `${(ms / 1000).toFixed(1)}s`

// A host-native health view of the whole project's test suites: the host's own
// Vitest (unit + RTL component) and Playwright (e2e, with video) as full cards
// linking to their published HTML reports, plus a card per sibling project's
// Vitest (lab/blog/party). Counts come from the reports site's health.json; the
// reports themselves are the substance.
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

  const ago = (iso: string) => {
    const diffMin = Math.round((loadedAt - new Date(iso).getTime()) / 60000)
    const rtf = new Intl.RelativeTimeFormat(i18n.language, { numeric: 'auto' })
    if (Math.abs(diffMin) < 60) return rtf.format(-diffMin, 'minute')
    const hr = Math.round(diffMin / 60)
    if (Math.abs(hr) < 24) return rtf.format(-hr, 'hour')
    return rtf.format(-Math.round(hr / 24), 'day')
  }

  const workspace = health?.workspace ?? []
  const wsFailed = workspace.reduce((n, s) => n + s.failed, 0)
  const allGreen =
    health !== null &&
    health.suites.unit.failed === 0 &&
    health.suites.e2e.failed === 0 &&
    wsFailed === 0

  return (
    <Cell id="quality" label="// quality · host-native React">
      <p className="text-muted-foreground text-sm leading-relaxed">
        {t('quality.description')}
      </p>

      {state === 'ready' && health ? (
        <>
          {/* Run header — overall status + when it ran + the commit. */}
          <div className="mt-4 flex flex-wrap items-center gap-x-3 gap-y-1 font-mono text-xs">
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
                : t('quality.failing', {
                    failed:
                      health.suites.unit.failed +
                      health.suites.e2e.failed +
                      wsFailed,
                  })}
            </span>
            <span className="text-muted-foreground/60">
              {t('quality.updatedAgo', { ago: ago(health.generatedAt) })}
            </span>
            {health.commit && (
              <span className="text-muted-foreground/50">
                · {health.commit.slice(0, 7)}
              </span>
            )}
          </div>

          {/* The two suite cards, each linking to its full report. */}
          <div className="mt-3 grid gap-3 sm:grid-cols-2">
            <SuiteCard
              icon={<FlaskConical className="size-3.5" />}
              title={t('quality.unitTitle')}
              suite={health.suites.unit}
              passingLabel={t('quality.passing', {
                passed: health.suites.unit.passed,
                total: health.suites.unit.total,
              })}
              reportUrl={`${REPORTS_BASE}/vitest/`}
              reportLabel={t('quality.openReport')}
            />
            <SuiteCard
              icon={<Terminal className="size-3.5" />}
              title={t('quality.e2eTitle')}
              suite={health.suites.e2e}
              passingLabel={t('quality.passing', {
                passed: health.suites.e2e.passed,
                total: health.suites.e2e.total,
              })}
              reportUrl={`${REPORTS_BASE}/playwright/`}
              reportLabel={t('quality.openReportVideo')}
            />
          </div>

          {/* The rest of the workspace — each project's own Vitest as a full card
              like the host's, linking to its published report. */}
          {workspace.length > 0 && (
            <div className="mt-4">
              <div className="text-muted-foreground/70 mb-2 font-mono text-[11px]">
                {t('quality.workspaceTitle')}
              </div>
              <div className="grid gap-3 sm:grid-cols-2">
                {workspace.map((s) => (
                  <SuiteCard
                    key={s.project}
                    icon={<Package className="size-3.5" />}
                    title={`${s.project} · Vitest`}
                    suite={s}
                    passingLabel={t('quality.passing', {
                      passed: s.passed,
                      total: s.total,
                    })}
                    reportUrl={
                      s.report ? `${REPORTS_BASE}${s.report}` : undefined
                    }
                    reportLabel={t('quality.openReport')}
                    reportAriaLabel={`${s.project} — ${t('quality.openReport')}`}
                  />
                ))}
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="border-border/60 bg-muted/20 mt-4 rounded-lg border border-dashed p-4 font-mono text-xs">
          <p className="text-muted-foreground/70">
            {state === 'loading' ? t('quality.loading') : t('quality.noRun')}
          </p>
        </div>
      )}
    </Cell>
  )
}

function SuiteCard({
  icon,
  title,
  suite,
  passingLabel,
  reportUrl,
  reportLabel,
  reportAriaLabel,
}: {
  icon: React.ReactNode
  title: string
  suite: SuiteHealth
  passingLabel: string
  // Optional so a card can render even if its report didn't publish. A distinct
  // aria-label keeps each "open report" link uniquely named (gotcha #34).
  reportUrl?: string
  reportLabel: string
  reportAriaLabel?: string
}) {
  const green = suite.failed === 0
  return (
    <div className="border-border/60 bg-muted/20 flex flex-col rounded-lg border p-3">
      <div className="text-muted-foreground flex items-center gap-2 font-mono text-xs">
        {icon}
        {title}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2 font-mono">
        <span
          className={cn(
            'flex items-center gap-1.5 text-sm',
            green ? 'text-emerald-400' : 'text-red-400'
          )}
        >
          <span
            className={cn(
              'inline-block size-2 rounded-full',
              green ? 'bg-emerald-400' : 'bg-red-400'
            )}
          />
          {passingLabel}
        </span>
        <span className="text-muted-foreground/50 text-[11px] tabular-nums">
          {fmtDur(suite.durationMs)}
        </span>
      </div>
      {reportUrl && (
        <a
          href={reportUrl}
          target="_blank"
          rel="noreferrer"
          aria-label={reportAriaLabel}
          className="text-brand hover:text-brand/80 mt-3 inline-block font-mono text-xs transition-colors"
        >
          {reportLabel}
          <span aria-hidden="true"> ↗</span>
        </a>
      )}
    </div>
  )
}
