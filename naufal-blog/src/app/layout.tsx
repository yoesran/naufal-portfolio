import type { Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import Script from "next/script";

import "./globals.css";

// Inter to match the host's typeface (brand unity); Geist Mono for code/labels.
const inter = Inter({ variable: "--font-inter", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const viewport: Viewport = {
  themeColor: [
    { media: "(prefers-color-scheme: light)", color: "#ffffff" },
    { media: "(prefers-color-scheme: dark)", color: "#0a0a0a" },
  ],
};

// Root layout — sits ABOVE the dynamic [lang] segment, so it does NOT re-render
// on a locale switch. That's essential: the theme `.dark` class (set imperatively
// on <html> by the toggle / prepaint) survives navigation instead of being
// clobbered by a re-render, and the pre-paint <Script> isn't re-rendered (which
// would trip React 19's "script tag on client render" warning). `lang` is set
// per locale by prepaint.js from the URL (hreflang in each page's metadata
// carries the SEO signal); the "en" default avoids an empty attribute.
export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} h-full antialiased`}
      suppressHydrationWarning
    >
      <body className="flex min-h-full flex-col">
        <Script src="/prepaint.js" strategy="beforeInteractive" />
        {children}
      </body>
    </html>
  );
}
