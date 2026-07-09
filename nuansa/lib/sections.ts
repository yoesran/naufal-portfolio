/**
 * SECTIONS — composable content blocks.
 * ─────────────────────────────────────────────────────────────────────────────
 * A section owns a *contract* and nothing else: no markup, no styling. How a
 * section looks is the shell's business (see `lib/shells.ts`), which is what
 * keeps two shells from converging on the same reskinned page — the mistake
 * that killed the first section system.
 *
 * Sections are self-contained: the countdown carries its own target date rather
 * than reaching into the event section. Reordering must never break a section.
 * ─────────────────────────────────────────────────────────────────────────────
 */
import type { LucideIcon } from 'lucide-react'
import * as z from 'zod'

import { type ContentOf, type Contract, buildSchema } from './fields'

export interface SectionDefinition<C extends Contract = Contract> {
  id: string
  /** Shown in the editor's add-section list, and used as the nav label. */
  label: string
  Icon: LucideIcon
  contract: C
  defaultContent: ContentOf<C>
}

export function defineSection<C extends Contract>(
  definition: SectionDefinition<C>
): SectionDefinition<C> {
  return definition
}

/** Loose registry view — `any` lets sections of different contracts sit together. */
export type AnySection = Omit<SectionDefinition, 'defaultContent'> & {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  defaultContent: any
}

/** One section placed on a site: which kind, in what order, with what content. */
export interface SectionInstance {
  /** Stable per-instance id — a site may hold two of the same section kind. */
  key: string
  type: string
  visible: boolean
  /** Shape is the section's own contract; only known at runtime here. */
  content: Record<string, unknown>
}

/**
 * Validation for a site's section array, restricted to the kinds a given shell
 * can actually render. Each variant reuses the section's own contract, so the
 * field vocabulary still enforces required fields and list limits per section.
 */
export function sectionsSchema(sections: AnySection[]) {
  const variants = sections.map((section) =>
    z.object({
      key: z.string(),
      type: z.literal(section.id),
      visible: z.boolean(),
      content: buildSchema(section.contract),
    })
  )

  // discriminatedUnion needs a non-empty tuple; a shell with no sections is a
  // programming error, not a runtime state.
  return z.array(
    z.discriminatedUnion(
      'type',
      variants as unknown as [(typeof variants)[number], ...typeof variants]
    )
  )
}

/**
 * A fresh instance of a section kind. `key` defaults to a uuid, which is only
 * safe in the browser — see `seedSite`, which passes a deterministic key
 * because the editor is also rendered on the server.
 */
export function createInstance(
  section: AnySection,
  key: string = crypto.randomUUID()
): SectionInstance {
  return {
    key,
    type: section.id,
    visible: true,
    content: structuredClone(section.defaultContent),
  }
}
