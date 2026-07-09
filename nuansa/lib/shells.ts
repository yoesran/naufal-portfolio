/**
 * SHELLS — a design. The visual identity a template (preset) wears.
 * ─────────────────────────────────────────────────────────────────────────────
 * A shell owns the chrome (frame, ornament, navigation, music) *and one
 * renderer per section it supports*. Renderers live here rather than on the
 * section so two shells can present the same content in genuinely different
 * designs — without that, every design collapses into the same page reskinned.
 *
 * Compatibility needs no metadata: a shell can render exactly the sections it
 * wrote a renderer for. A vertical-only section is one no paged shell renders.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { ComponentType, ReactNode } from 'react'

import type { LucideIcon } from 'lucide-react'

export interface ChromeItem {
  key: string
  type: string
  label: string
  Icon: LucideIcon
  node: ReactNode
}

export interface ChromeProps {
  items: ChromeItem[]
  musicUrl?: string
}

export interface Shell {
  id: string
  name: string
  Chrome: ComponentType<ChromeProps>
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  renderers: Record<string, ComponentType<{ content: any }>>
}

export function defineShell(shell: Shell): Shell {
  return shell
}

/**
 * The section kinds this shell can render. Deliberately ids, not definitions:
 * this module is platform machinery and must not know the section library —
 * joining the two is `lib/site.ts`'s job.
 */
export function supportedSectionIds(shell: Shell): string[] {
  return Object.keys(shell.renderers)
}
