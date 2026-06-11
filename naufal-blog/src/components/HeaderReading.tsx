'use client'

import { usePathname } from 'next/navigation'

import { ReadingPanel } from '@/components/ReadingPanel'
import type { Dictionary } from '@/lib/i18n/dictionaries'
import { isPostDetailPath } from '@/lib/posts'

// The reading customizer belongs to a post, but lives in the sticky header so it
// stays reachable mid-scroll. Rendered only on a post-detail route — usePathname
// is reliable in this static export (the same hook LocaleToggle and the localized
// not-found already depend on), so the panel is in each post's prerendered HTML
// and absent elsewhere, no flash.
export function HeaderReading({ labels }: { labels: Dictionary['reading'] }) {
  if (!isPostDetailPath(usePathname() ?? '')) return null
  return <ReadingPanel labels={labels} />
}
