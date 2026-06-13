'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { defaultLocale, isLocale } from '@/lib/i18n/config'

// The apex `/` has no content of its own — it redirects to a locale, honoring
// the visitor's browser language: an `id-*` preference lands on /id, anything
// else on the default locale. A static export has no server, so Accept-Language
// can't be read at the edge — this client check is the only place detection can
// happen, which is why the apex `/` rule was dropped from public/_redirects in
// favour of serving this stub. The <noscript> meta-refresh covers crawlers and
// JS-disabled clients (they get the default locale).
function detectLocale(): string {
  if (typeof navigator === 'undefined') return defaultLocale
  const prefs = navigator.languages?.length
    ? navigator.languages
    : [navigator.language]
  for (const lang of prefs) {
    const base = lang.toLowerCase().split('-')[0]
    if (isLocale(base)) return base
  }
  return defaultLocale
}

export default function RootRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(`/${detectLocale()}`)
  }, [router])
  return (
    <noscript>
      <meta httpEquiv="refresh" content={`0; url=/${defaultLocale}`} />
    </noscript>
  )
}
