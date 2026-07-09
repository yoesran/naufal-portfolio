'use client'

import { useFormContext, useWatch } from 'react-hook-form'

import { SiteRenderer } from '@/components/site-renderer'
import type { SiteContent } from '@/lib/site'

/**
 * Live preview: the real shell rendering the real section renderers with the
 * current draft values — the same components the published page uses.
 *
 * Draft values are deliberately NOT validated here. Renderers must tolerate
 * partial content anyway, and showing the draft as-is beats freezing on a last
 * valid snapshot when a field is cleared. Validation still drives inline errors.
 */
export function TemplatePreview({
  shellId,
  defaultValue,
}: {
  shellId: string
  defaultValue: SiteContent
}) {
  const { control } = useFormContext()
  const site = useWatch({ control, defaultValue }) as SiteContent

  return <SiteRenderer shellId={shellId} site={site} />
}
