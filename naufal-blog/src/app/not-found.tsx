import type { Metadata } from 'next'

import { Link } from '@/components/Link'
import { defaultLocale } from '@/lib/i18n/config'

// Root 404 for URLs that match no route at all (rendered inside the root layout,
// which owns <html>/<body>). In-locale notFound() uses [lang]/not-found.tsx
// instead. English/default — there's no locale context at the root.
export const metadata: Metadata = {
  title: 'Page not found',
}

export default function NotFound() {
  return (
    <main className="mx-auto flex w-full max-w-2xl flex-1 flex-col justify-center px-6 py-16">
      <p className="text-brand font-mono text-sm">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        That page doesn&apos;t exist (or it moved).
      </p>
      <nav className="mt-8 font-mono text-sm">
        <Link
          href={`/${defaultLocale}`}
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          ← naufal.dev
        </Link>
      </nav>
    </main>
  )
}
