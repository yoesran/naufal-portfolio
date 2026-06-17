import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/lib/i18n'

import { QualityBlock } from './QualityBlock'

// A published run for the map to render. `fetch` is stubbed so the component
// reads this instead of hitting the network.
const HEALTH = {
  generatedAt: new Date().toISOString(),
  commit: 'abcdef0',
  suites: {
    unit: {
      runner: 'vitest',
      total: 11,
      passed: 11,
      failed: 0,
      durationMs: 1800,
    },
    e2e: {
      runner: 'playwright',
      total: 7,
      passed: 7,
      failed: 0,
      durationMs: 30000,
    },
  },
  workspace: [
    {
      project: 'naufal-lab',
      runner: 'vitest',
      total: 7,
      passed: 7,
      failed: 0,
      durationMs: 1200,
      report: '/naufal-lab/',
    },
    {
      project: 'naufal-blog',
      runner: 'vitest',
      total: 14,
      passed: 14,
      failed: 0,
      durationMs: 400,
      report: '/naufal-blog/',
    },
    {
      project: 'naufal-party',
      runner: 'vitest',
      total: 12,
      passed: 12,
      failed: 0,
      durationMs: 330,
      report: '/naufal-party/',
    },
  ],
}

beforeEach(() => {
  vi.stubGlobal(
    'fetch',
    vi.fn().mockResolvedValue({ ok: true, json: async () => HEALTH })
  )
})
afterEach(() => {
  vi.unstubAllGlobals()
})

describe('QualityBlock', () => {
  it('maps the four apps, each with its role and status', async () => {
    render(<QualityBlock />)

    // One node per app, named by project + role (this is what makes the
    // workspace self-explanatory). Querying the trigger buttons avoids the
    // role text that also appears in the block's description.
    expect(
      await screen.findByRole('button', { name: /host — React host/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /naufal-lab — Svelte remote/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /naufal-party — PartyKit presence/ })
    ).toBeInTheDocument()
    expect(
      screen.getByRole('button', { name: /naufal-blog — Next.js content/ })
    ).toBeInTheDocument()

    // Static counts from the published run (host aggregates unit + e2e).
    expect(screen.getByText('18/18')).toBeInTheDocument()
    expect(screen.getByText('7/7')).toBeInTheDocument()
    expect(screen.getByText('all passing')).toBeInTheDocument()
  })
})
