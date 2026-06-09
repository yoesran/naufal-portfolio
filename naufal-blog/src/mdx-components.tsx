import type { MDXComponents } from 'mdx/types'

// Global MDX element overrides. Required by @next/mdx with the App Router.
// Most typography comes from the `prose` wrapper in posts/[slug]/page.tsx; this
// only adjusts a few elements that prose doesn't nail for this site's look.
const components: MDXComponents = {
  a: ({ href = '', children, ...props }) => {
    const external = /^https?:\/\//.test(href)
    return (
      <a
        href={href}
        {...(external ? { target: '_blank', rel: 'noreferrer' } : {})}
        {...props}
      >
        {children}
      </a>
    )
  },
  // Wrap tables so wide ones scroll horizontally instead of overflowing the
  // page on narrow screens.
  table: ({ children, ...props }) => (
    <div className="overflow-x-auto">
      <table {...props}>{children}</table>
    </div>
  ),
}

export function useMDXComponents(): MDXComponents {
  return components
}
