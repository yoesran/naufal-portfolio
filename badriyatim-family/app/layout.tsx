import type { Metadata } from 'next'
import { Fraunces, Plus_Jakarta_Sans } from 'next/font/google'

import { SiteFooter } from '@/components/site-footer'
import { SiteHeader } from '@/components/site-header'
import { SITE } from '@/lib/site'

import './globals.css'

const display = Fraunces({
  variable: '--font-display',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700'],
  display: 'swap',
})

const body = Plus_Jakarta_Sans({
  variable: '--font-body',
  subsets: ['latin'],
  weight: ['400', '500', '600', '700', '800'],
  display: 'swap',
})

export const metadata: Metadata = {
  title: {
    default: `${SITE.name} — ${SITE.tagline}`,
    template: `%s · ${SITE.name}`,
  },
  description: `${SITE.tagline}. ${SITE.roots}.`,
}

// Apply the saved text size before paint to avoid a flash / hydration mismatch.
const textSizeScript = `(function(){try{var t=localStorage.getItem('textsize');if(t==='lg'||t==='xl'){document.documentElement.setAttribute('data-textsize',t);}}catch(e){}})();`

export default function RootLayout({
  children,
}: Readonly<{ children: React.ReactNode }>) {
  return (
    <html
      lang="id"
      className={`${body.variable} ${display.variable} h-full`}
      suppressHydrationWarning
    >
      <head>
        <script dangerouslySetInnerHTML={{ __html: textSizeScript }} />
      </head>
      <body className="flex min-h-full flex-col">
        <a
          href="#konten"
          className="bg-marun text-gading sr-only rounded-md px-4 py-2 font-medium focus:not-sr-only focus:absolute focus:top-3 focus:left-3 focus:z-50"
        >
          Langsung ke konten
        </a>
        <SiteHeader />
        <main id="konten" className="flex-1">
          {children}
        </main>
        <SiteFooter />
      </body>
    </html>
  )
}
