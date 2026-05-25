import { MicrofrontendBlock } from '@/components/blocks/MicrofrontendBlock'
import { PresenceBlock } from '@/components/blocks/PresenceBlock'

export default function App() {
  return (
    <main className="bg-background text-foreground min-h-dvh">
      <div className="mx-auto max-w-2xl space-y-6 px-6 py-16">
        <MicrofrontendBlock />
        <PresenceBlock />
      </div>
    </main>
  )
}
