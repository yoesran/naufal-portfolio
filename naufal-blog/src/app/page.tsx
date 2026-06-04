export default function Home() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col justify-center px-6 py-16">
      <p className="text-brand font-mono text-sm">naufal.dev</p>
      <h1 className="mt-3 text-3xl font-semibold tracking-tight sm:text-4xl">
        Naufal Yusran
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        Frontend &amp; microfrontend engineer. Writing on the things I build,
        plus my CV — a companion to the{" "}
        <a
          href="https://naufal-host.pages.dev"
          className="text-foreground hover:text-brand underline underline-offset-4 transition-colors"
        >
          live portfolio
        </a>
        .
      </p>
      <nav className="mt-8 flex gap-5 font-mono text-sm">
        <a
          href="/posts"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          posts
        </a>
        <a
          href="/cv"
          className="text-muted-foreground hover:text-foreground transition-colors"
        >
          cv
        </a>
      </nav>
    </main>
  );
}
