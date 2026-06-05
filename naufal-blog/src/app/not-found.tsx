import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Page not found",
};

export default function NotFound() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-brand font-mono text-sm">404</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Page not found
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        That page doesn&apos;t exist (or it moved). Try one of these instead.
      </p>
      <nav className="mt-8 flex gap-5 font-mono text-sm">
        <Link
          href="/"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          home
        </Link>
        <Link
          href="/posts"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          posts
        </Link>
        <Link
          href="/cv"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          cv
        </Link>
      </nav>
    </main>
  );
}
