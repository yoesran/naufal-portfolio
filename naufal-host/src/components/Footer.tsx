const YEAR = new Date().getFullYear()

import { BLOG_URL } from '@/lib/links'

const LINKS = [
  { label: 'github', href: 'https://github.com/naufalyoesran' },
  { label: 'linkedin', href: 'https://www.linkedin.com/in/naufal-yusran' },
  { label: 'email', href: 'mailto:naufalyoesran@gmail.com' },
  { label: 'blog', href: BLOG_URL },
]

export function Footer() {
  return (
    <footer className="border-border/50 mt-16 border-t">
      <div className="text-muted-foreground mx-auto flex max-w-2xl flex-col gap-3 px-6 py-8 font-mono text-xs sm:flex-row sm:items-center sm:justify-between">
        <div>© {YEAR} naufal.dev — React + Svelte + PartyKit</div>
        <nav className="flex items-center gap-5">
          {LINKS.map(({ label, href }) => (
            <a
              key={label}
              href={href}
              target={href.startsWith('http') ? '_blank' : undefined}
              rel={href.startsWith('http') ? 'noreferrer' : undefined}
              className="hover:text-foreground transition-colors"
            >
              {label}
            </a>
          ))}
        </nav>
      </div>
    </footer>
  )
}
