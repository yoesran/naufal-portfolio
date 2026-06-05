import type { Metadata, Viewport } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SITE_URL } from "@/lib/site";

// Inter to match the host's typeface (brand unity); Geist Mono for code/labels.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

const TITLE = "Naufal Yusran — Engineering writing & CV";
const DESCRIPTION =
  "Writing on frontend and microfrontend engineering, plus my CV. By Naufal Yusran — companion to the live portfolio at naufal-host.pages.dev.";

export const metadata: Metadata = {
  metadataBase: new URL(SITE_URL),
  title: {
    default: TITLE,
    template: "%s — Naufal Yusran",
  },
  description: DESCRIPTION,
  openGraph: {
    type: "website",
    siteName: "Naufal Yusran",
    title: TITLE,
    description: DESCRIPTION,
    url: SITE_URL,
    images: [{ url: "/og.png", width: 1200, height: 630 }],
  },
  twitter: {
    card: "summary_large_image",
    title: TITLE,
    description: DESCRIPTION,
    images: ["/og.png"],
  },
};

// Near-black to match the dark-only background (oklch(0.145 0 0) ≈ #0a0a0a), so
// mobile browser chrome blends with the page instead of flashing white.
export const viewport: Viewport = {
  themeColor: "#0a0a0a",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  // Dark-only for now (like the lab's standalone page), matching the
  // portfolio's signature near-black look. A light/system toggle can come later.
  return (
    <html
      lang="en"
      className={`${inter.variable} ${geistMono.variable} dark h-full antialiased`}
    >
      <body className="flex min-h-full flex-col">{children}</body>
    </html>
  );
}
