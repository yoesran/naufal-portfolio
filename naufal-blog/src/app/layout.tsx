import type { Metadata } from "next";
import { Inter, Geist_Mono } from "next/font/google";
import "./globals.css";

// Inter to match the host's typeface (brand unity); Geist Mono for code/labels.
const inter = Inter({
  variable: "--font-inter",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: {
    default: "Naufal Yusran — Engineering writing & CV",
    template: "%s — Naufal Yusran",
  },
  description:
    "Writing on frontend and microfrontend engineering, plus my CV. By Naufal Yusran — companion to the live portfolio at naufal-host.pages.dev.",
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
