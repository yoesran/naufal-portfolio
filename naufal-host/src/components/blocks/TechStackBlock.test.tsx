import { render, screen } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { describe, expect, it } from 'vitest'

import '@/lib/i18n'

import { TechStackBlock } from './TechStackBlock'

describe('TechStackBlock', () => {
  it('renders a pill per tech and reveals the note on selection', async () => {
    render(<TechStackBlock />)

    // One button per tech in the orbit (8 of them).
    expect(screen.getAllByRole('button')).toHaveLength(8)
    expect(screen.getByRole('button', { name: 'React' })).toBeInTheDocument()
    expect(screen.getByRole('button', { name: 'Svelte' })).toBeInTheDocument()

    // Selecting a pill (focus is the keyboard path, wired regardless of pointer
    // type — and a click focuses) reveals that tech's note in the panel.
    await userEvent.click(screen.getByRole('button', { name: 'Svelte' }))
    expect(screen.getByText(/federated remote/i)).toBeInTheDocument()
  })
})
