import { render, screen } from '@testing-library/react'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import '@/lib/i18n'

import { QualityBlock } from './QualityBlock'

// A published run for the dashboard to render. `fetch` is stubbed so the
// component reads this instead of hitting the network.
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
  it('renders both suites with counts and links to their reports', async () => {
    render(<QualityBlock />)

    expect(
      await screen.findByText('Unit + component · Vitest')
    ).toBeInTheDocument()
    expect(screen.getByText('End-to-end · Playwright')).toBeInTheDocument()
    expect(screen.getByText('11/11 passing')).toBeInTheDocument()
    expect(screen.getByText('7/7 passing')).toBeInTheDocument()

    // Each card links out to its full HTML report on the reports site.
    expect(
      screen.getByRole('link', { name: 'open report' }).getAttribute('href')
    ).toContain('/vitest/')
    expect(
      screen
        .getByRole('link', { name: 'open report (with video)' })
        .getAttribute('href')
    ).toContain('/playwright/')
  })
})
