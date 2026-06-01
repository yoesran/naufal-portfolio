import { useTranslation } from 'react-i18next'

import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { HeroBlock } from '@/components/blocks/HeroBlock'
import { MicrofrontendBlock } from '@/components/blocks/MicrofrontendBlock'
import { PresenceBlock } from '@/components/blocks/PresenceBlock'
import { TechStackBlock } from '@/components/blocks/TechStackBlock'

export default function App() {
  const { t } = useTranslation()
  return (
    <div className="bg-background text-foreground flex min-h-dvh flex-col">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="text-muted-foreground mb-10 text-lg leading-relaxed sm:text-xl">
          {t('intro')}
        </p>
        <div className="space-y-6">
          <HeroBlock />
          <TechStackBlock />
          <MicrofrontendBlock />
          <PresenceBlock />
        </div>
      </main>
      <Footer />
    </div>
  )
}
