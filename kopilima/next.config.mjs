/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export → Cloudflare Pages direct upload, same as naufal-blog.
  // No server: the WITA clock is computed in the browser (it must reflect the
  // visitor's "now", not the build time).
  output: 'export',
}

export default nextConfig
