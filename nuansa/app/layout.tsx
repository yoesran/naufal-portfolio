import { Geist_Mono, Inter } from 'next/font/google'

import { cn } from '@/lib/utils'

import './globals.css'

const inter = Inter({ subsets: ['latin'], variable: '--font-sans' })

const fontMono = Geist_Mono({
  subsets: ['latin'],
  variable: '--font-mono',
})

// lang="id": single-locale Bahasa product — editor chrome, contract labels, and
// validation messages are all Indonesian. No theme provider: nothing toggles a
// theme, and templates carry their own palettes.
export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html
      lang="id"
      className={cn(
        'antialiased',
        fontMono.variable,
        'font-sans',
        inter.variable
      )}
    >
      <body>{children}</body>
    </html>
  )
}
