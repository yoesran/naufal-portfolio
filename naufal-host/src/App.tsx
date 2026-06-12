import { Suspense, lazy } from 'react'
import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { PresenceOverlay } from '@/components/PresenceOverlay'
import { HeroBlock } from '@/components/blocks/HeroBlock'
import { usePresenceActive } from '@/lib/presence'

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
const LiveRemoteBlock = lazy(() =>
  import('@/components/blocks/LiveRemoteBlock').then((m) => ({
    default: m.LiveRemoteBlock,
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
  // While the presence overlay is on, dock space for its floating count pill
  // (fixed bottom-center, rendered by the remote): without it the pill parks on
  // top of the footer links at the end of the page. The spacer reserves the
  // pill's strip below the footer, so it floats over empty dock, not content.
  const presenceActive = usePresenceActive()
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <Header />
      <PresenceOverlay />
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
            <LiveRemoteBlock />
          </Suspense>
        </div>
      </main>
      <Footer />
      {presenceActive && <div aria-hidden className="h-16" />}
    </div>
  )
}
