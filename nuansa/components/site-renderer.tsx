'use client'

import type { SiteContent } from '@/lib/site'
import { SECTIONS } from '@/sections'
import { SHELLS } from '@/shells'

/**
 * Turns a site's section list into chrome items by pairing each instance with
 * the shell's renderer for that kind. Sections the shell can't render are
 * skipped rather than crashing — a site can outlive a shell losing a renderer.
 */
export function SiteRenderer({
  shellId,
  site,
}: {
  shellId: string
  site: SiteContent
}) {
  const shell = SHELLS[shellId]
  if (!shell) return null

  const { Chrome } = shell

  const items = (site.sections ?? [])
    .filter((section) => section.visible)
    .flatMap((section) => {
      const definition = SECTIONS[section.type]
      const Renderer = shell.renderers[section.type]
      if (!definition || !Renderer) return []

      return [
        {
          key: section.key,
          type: section.type,
          label: definition.label,
          Icon: definition.Icon,
          node: <Renderer content={section.content} />,
        },
      ]
    })

  return <Chrome items={items} musicUrl={site.musicUrl || undefined} />
}
