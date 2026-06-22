import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import '@/lib/i18n'

import { ChatBlock } from './ChatBlock'

// The blog fetch fails in jsdom (relative URL, no server) → the assistant runs on
// the local experience KB, which is exactly the graceful-degrade path. These
// assertions hit answers that don't need the blog data.
describe('ChatBlock', () => {
  it('answers a suggested question (cold-start chip)', async () => {
    render(<ChatBlock />)
    await userEvent.click(
      await screen.findByRole('button', { name: 'Where has he worked?' })
    )
    // Full answer text is in the sr-only node immediately (announced once).
    expect(
      (await screen.findAllByText(/DBS Bank Indonesia/)).length
    ).toBeGreaterThan(0)
  })

  it('answers a typed question and reveals routing links', async () => {
    render(<ChatBlock />)
    const input = screen.getByRole('textbox', {
      name: /ask the assistant/i,
    })
    await userEvent.type(input, 'is he available{enter}')
    expect(
      (await screen.findAllByText(/open to frontend/i)).length
    ).toBeGreaterThan(0)
    // Availability routes to email.
    expect(
      screen.getByRole('link', { name: /email/i }).getAttribute('href')
    ).toMatch(/^mailto:/)
  })
})
