import type { Metadata, Viewport } from 'next'

import { faseBootScript } from '@/lib/fase-boot'

import './globals.css'

// Bahasa-only on purpose (the audience is local; no i18n — YAGNI).
export const metadata: Metadata = {
  title: 'Kopi Lima — Daily Cruisin’ | Kopi 15K, Balikpapan & Samarinda',
  description:
    'Kopi Lima: lima pit stop kopi di Balikpapan dan Samarinda, tiga di antaranya buka 24 jam. Semua minuman Rp15.000. Lihat cabang mana yang buka sekarang.',
}

export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,
}

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    // suppressHydrationWarning: the boot script stamps data-fase on this very
    // element before React hydrates — a legitimate mismatch, and shallow
    // (this element's own attributes only). Same pattern as sukamotret.
    <html lang="id" suppressHydrationWarning>
      <head>
        {/* Blocking, on purpose: the page must open already lit for the
            visitor's hour — without this the palette visibly corrects itself
            after hydration. */}
        <script dangerouslySetInnerHTML={{ __html: faseBootScript() }} />
      </head>
      <body>{children}</body>
    </html>
  )
}
