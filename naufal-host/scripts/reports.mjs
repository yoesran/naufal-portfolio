// Builds the public test reports for the quality block. Runs the host's Vitest
// (unit + RTL component) and Playwright (e2e, with video) suites with their HTML
// reporters, distils the counts into health.json, and assembles everything into
// .reports/ for a manual `wrangler pages deploy` to the naufal-reports Pages
// project. The portfolio's `// quality` block links into these reports.
//
//   npm run reports         # build .reports/
//   npm run reports:deploy  # publish it to naufal-reports.pages.dev
import { execFileSync } from 'node:child_process'
import {
  existsSync,
  mkdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs'
import path from 'node:path'

const OUT = '.reports'

rmSync(OUT, { recursive: true, force: true })
mkdirSync(OUT, { recursive: true })

// A non-zero exit just means a suite had failures — we still read its JSON and
// report the numbers, so swallow the throw and rely on the output files.
function softRun(cmd, args, { env, cwd } = {}) {
  try {
    execFileSync(cmd, args, {
      stdio: 'inherit',
      shell: true,
      cwd,
      env: { ...process.env, ...env },
    })
  } catch {
    /* failing tests exit non-zero; the reporters still write their output */
  }
}

function gitSha() {
  try {
    return execFileSync('git', ['rev-parse', '--short', 'HEAD'], {
      shell: true,
    })
      .toString()
      .trim()
  } catch {
    return undefined
  }
}

// --- Unit + component · Vitest → HTML report + JSON summary -------------------
const unitT0 = Date.now()
softRun('npx', [
  'vitest',
  'run',
  '--reporter=html',
  '--reporter=json',
  `--outputFile.html=${OUT}/vitest/index.html`,
  `--outputFile.json=${OUT}/unit.json`,
])
const unitRaw = JSON.parse(readFileSync(`${OUT}/unit.json`, 'utf8'))
const unit = {
  runner: 'vitest',
  total: unitRaw.numTotalTests ?? 0,
  passed: unitRaw.numPassedTests ?? 0,
  failed: unitRaw.numFailedTests ?? 0,
  durationMs: Date.now() - unitT0,
}

// --- End-to-end · Playwright → HTML report (with video) + JSON summary --------
softRun('npx', ['playwright', 'test', '--reporter=html,json'], {
  env: {
    PW_MEDIA: '1', // records video + full trace (see playwright.config.ts)
    PLAYWRIGHT_HTML_REPORT: `${OUT}/playwright`,
    PLAYWRIGHT_JSON_OUTPUT_NAME: `${OUT}/e2e.json`,
    PW_TEST_HTML_REPORT_OPEN: 'never',
  },
})
const e2eRaw = existsSync(`${OUT}/e2e.json`)
  ? JSON.parse(readFileSync(`${OUT}/e2e.json`, 'utf8'))
  : { stats: {} }
const s = e2eRaw.stats ?? {}
const expected = s.expected ?? 0
const flaky = s.flaky ?? 0
const e2e = {
  runner: 'playwright',
  total: expected + (s.unexpected ?? 0) + flaky,
  passed: expected + flaky,
  failed: s.unexpected ?? 0,
  durationMs: Math.round(s.duration ?? 0),
}

// Drop the intermediate JSON so only the reports + health.json ship.
rmSync(`${OUT}/unit.json`, { force: true })
rmSync(`${OUT}/e2e.json`, { force: true })

// --- Rest of the workspace · each project's own Vitest ------------------------
// Run from each sibling so it uses that project's own config + deps. Each emits
// its own HTML report into .reports/<project>/ (published alongside the host's
// vitest/ + playwright/), and we keep the pass/total/duration for the health row.
const WORKSPACE = ['naufal-lab', 'naufal-blog', 'naufal-party']
const workspace = []
for (const project of WORKSPACE) {
  const jsonPath = path.resolve(OUT, `${project}.json`)
  const htmlIndex = path.resolve(OUT, project, 'index.html')
  const t0 = Date.now()
  softRun(
    'npx',
    [
      'vitest',
      'run',
      '--reporter=html',
      '--reporter=json',
      `--outputFile.html=${htmlIndex}`,
      `--outputFile.json=${jsonPath}`,
    ],
    { cwd: path.resolve('..', project) }
  )
  if (!existsSync(jsonPath)) continue // run produced no output — skip the card
  const raw = JSON.parse(readFileSync(jsonPath, 'utf8'))
  rmSync(jsonPath, { force: true })
  workspace.push({
    project,
    runner: 'vitest',
    total: raw.numTotalTests ?? 0,
    passed: raw.numPassedTests ?? 0,
    failed: raw.numFailedTests ?? 0,
    durationMs: Date.now() - t0,
    // Path on the reports site (REPORTS_BASE) — only when the HTML report landed.
    report: existsSync(htmlIndex) ? `/${project}/` : undefined,
  })
}

const health = {
  generatedAt: new Date().toISOString(),
  commit: gitSha(),
  suites: { unit, e2e },
  workspace,
}
const json = JSON.stringify(health, null, 2) + '\n'
writeFileSync(`${OUT}/health.json`, json)
writeFileSync('public/health.json', json) // refresh the host's dev seed too

// noindex (these are test artifacts, not portfolio content) + CORS so the host
// can read health.json cross-origin; plus a landing page for the root.
writeFileSync(
  `${OUT}/_headers`,
  '/*\n  X-Robots-Tag: noindex\n/health.json\n  Access-Control-Allow-Origin: *\n'
)
writeFileSync(
  `${OUT}/index.html`,
  `<!doctype html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <meta name="robots" content="noindex" />
    <title>naufal.dev — test reports</title>
    <style>
      body { font-family: system-ui, sans-serif; max-width: 40rem; margin: 4rem auto; padding: 0 1.25rem; line-height: 1.6; }
      a { color: #0b7; }
    </style>
  </head>
  <body>
    <h1>naufal.dev — test reports</h1>
    <p>Live reports for the portfolio's own test suites.</p>
    <p><strong>naufal-host</strong></p>
    <ul>
      <li><a href="/vitest/">Vitest</a> — unit + component (React Testing Library)</li>
      <li><a href="/playwright/">Playwright</a> — end-to-end, with video recordings</li>
    </ul>
    <p><strong>Across the workspace</strong> — each project's own Vitest</p>
    <ul>
      <li><a href="/naufal-lab/">naufal-lab</a> — Svelte remote (mount contract + i18n)</li>
      <li><a href="/naufal-blog/">naufal-blog</a> — blog lib (posts, hreflang, sitemap)</li>
      <li><a href="/naufal-party/">naufal-party</a> — presence server (colours, echoes)</li>
    </ul>
  </body>
</html>
`
)

console.log(
  `reports → ${OUT}/ : unit ${unit.passed}/${unit.total}, e2e ${e2e.passed}/${e2e.total}` +
    (workspace.length
      ? ', ' +
        workspace.map((w) => `${w.project} ${w.passed}/${w.total}`).join(', ')
      : '')
)
