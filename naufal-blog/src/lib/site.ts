// Canonical origin for the blog — feeds metadata (canonical/OG/metadataBase),
// sitemap, robots, and hreflang. Env-driven (mirrors the host's VITE_SITE_URL)
// so the custom-domain switch (e.g. https://blog.naufal.dev) is a one-line env
// flip, not a code edit. NEXT_PUBLIC_* is inlined at build → public by design.
// The default keeps dev and an unconfigured build on the Pages name. See
// .env.production and ../../docs/deployment.md.
export const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL ?? 'https://naufal-blog.pages.dev'

// The sibling portfolio's origin — linked from the home page. Env-driven for the
// same reason as SITE_URL (mirrors the host's VITE_BLOG_URL pointing back here);
// flip to https://naufal.dev when the custom domain goes live.
export const HOST_URL =
  process.env.NEXT_PUBLIC_HOST_URL ?? 'https://naufal-host.pages.dev'
