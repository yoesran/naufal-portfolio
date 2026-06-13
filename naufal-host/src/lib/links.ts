// External sibling-site URLs. Env-driven (like VITE_LAB_URL / VITE_PARTY_HOST /
// VITE_SITE_URL) so the custom-domain swap (e.g. https://blog.naufal.dev) is a
// one-line env flip, not a code edit. The default keeps dev + an unconfigured
// build on the Pages name. See ../../../docs/deployment.md.
export const BLOG_URL =
  import.meta.env.VITE_BLOG_URL ?? 'https://naufal-blog.pages.dev'
