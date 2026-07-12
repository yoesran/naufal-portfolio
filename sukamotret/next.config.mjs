/** @type {import('next').NextConfig} */
const nextConfig = {
  // Static export → Cloudflare Pages direct upload, same as naufal-blog.
  // No server: sun times are computed in the browser (they must reflect the
  // visitor's "today", not the build day).
  output: 'export',
}

export default nextConfig
