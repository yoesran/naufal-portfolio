import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { HeroBlock } from '@/components/blocks/HeroBlock'

// The Hero is above the fold (and the likely LCP element), so it stays in the
// initial bundle. The rest are split out of it via React.lazy so first paint
// doesn't wait on parsing/executing them — their chunks fetch right after mount,
// off the critical path. The scroll-reveal (Cell) and federated-load gating
// (RemoteMount) inside each block still apply once it's rendered.
const TechStackBlock = lazy(() =>
  import('@/components/blocks/TechStackBlock').then((m) => ({
    default: m.TechStackBlock,
  }))
)
const MicrofrontendBlock = lazy(() =>
  import('@/components/blocks/MicrofrontendBlock').then((m) => ({
    default: m.MicrofrontendBlock,
  }))
)
const PresenceBlock = lazy(() =>
  import('@/components/blocks/PresenceBlock').then((m) => ({
    default: m.PresenceBlock,
  }))
)
const ThemeLabBlock = lazy(() =>
  import('@/components/blocks/ThemeLabBlock').then((m) => ({
    default: m.ThemeLabBlock,
  }))
)

// Cell-shaped placeholder that reserves height while a block chunk loads, so the
// page doesn't jump. Matches the Cell frame (border + card bg + rounded).
function BlockFallback() {
  return (
    <div className="border-border bg-card h-64 rounded-xl border shadow-sm motion-safe:animate-pulse" />
  )
}

export default function App() {
  const { t } = useTranslation()
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <Header />
      <main
        id="work"
        className="mx-auto w-full max-w-2xl flex-1 scroll-mt-16 px-6 py-12"
      >
        <p className="text-muted-foreground mb-10 text-lg leading-relaxed sm:text-xl">
          {t('intro')}
        </p>
        <div className="space-y-6">
          <HeroBlock />
          <Suspense fallback={<BlockFallback />}>
            <TechStackBlock />
          </Suspense>
          <Suspense fallback={<BlockFallback />}>
            <MicrofrontendBlock />
          </Suspense>
          <Suspense fallback={<BlockFallback />}>
            <PresenceBlock />
          </Suspense>
          <Suspense fallback={<BlockFallback />}>
            <ThemeLabBlock />
          </Suspense>
        </div>
      </main>
      <Footer />
    </div>
  )
}
