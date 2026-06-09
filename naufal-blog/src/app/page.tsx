'use client'

import { useEffect } from 'react'

import { useRouter } from 'next/navigation'

import { defaultLocale } from '@/lib/i18n/config'

// The apex `/` has no content of its own — send it to the default locale. In
// production a Cloudflare `_redirects` rule (public/_redirects) does this at the
// edge; this client redirect covers `next dev` and any host without that rule.
export default function RootRedirect() {
  const router = useRouter()
  useEffect(() => {
    router.replace(`/${defaultLocale}`)
  }, [router])
  return null
}
