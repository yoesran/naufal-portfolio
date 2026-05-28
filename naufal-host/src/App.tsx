import { Footer } from '@/components/Footer'
import { Header } from '@/components/Header'
import { HeroBlock } from '@/components/blocks/HeroBlock'
import { MicrofrontendBlock } from '@/components/blocks/MicrofrontendBlock'
import { PresenceBlock } from '@/components/blocks/PresenceBlock'
import { TechStackBlock } from '@/components/blocks/TechStackBlock'

export default function App() {
  return (
    <div className="flex min-h-dvh flex-col bg-background text-foreground">
      <Header />
      <main className="mx-auto w-full max-w-2xl flex-1 px-6 py-12">
        <p className="mb-10 text-lg leading-relaxed text-muted-foreground sm:text-xl">
          A playground of interactive things I build.
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
