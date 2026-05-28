const NAV = [
  { label: 'work', href: '#' },
  { label: 'blog', href: '#' },
  { label: 'cv', href: '#' },
]

export function Header() {
  return (
    <header className="border-border/50 bg-background/80 sticky top-0 z-50 border-b backdrop-blur-md">
      <div className="mx-auto flex max-w-2xl items-center justify-between px-6 py-3">
        <a
          href="/"
          className="text-foreground font-mono text-sm font-medium transition-colors hover:text-emerald-300"
        >
          naufal.dev
        </a>
        <nav className="flex items-center gap-5 font-mono text-xs">
          {NAV.map((item) => (
            <a
              key={item.label}
              href={item.href}
              className="text-muted-foreground hover:text-foreground transition-colors"
            >
              {item.label}
            </a>
          ))}
        </nav>
      </div>
    </header>
  )
}
