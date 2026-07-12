import type { Metadata, Viewport } from 'next'

import { phaseBootScript } from '@/lib/phase-boot'

import './globals.css'

// Bahasa-only on purpose (the audience is local; no i18n — YAGNI).
export const metadata: Metadata = {
  title: 'Sukamotret — Studio Foto Tabalong | Turning Moment Into Memories',
  description:
    'Studio foto di Tabalong, Kalimantan Selatan: prewedding, wisuda, keluarga, maternity, dan acara. Lihat jam cahaya terbaik hari ini dan booking lewat WhatsApp.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the boot script below stamps data-phase on this
    // very element BEFORE React hydrates, so the client <html> legitimately has
    // an attribute the server HTML never had. React would flag that as a
    // mismatch. The suppression is shallow — it covers only this element's own
    // attributes, not the tree — which is exactly the intent (same reason
    // next-themes does it).
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Blocking, on purpose: it stamps data-phase before the first paint,
            so the page opens already lit by the real sun. Without it the hero
            paints with a guessed accent and visibly corrects itself. */}
        <script dangerouslySetInnerHTML={{ __html: phaseBootScript() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
