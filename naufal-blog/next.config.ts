import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Static export → plain HTML/CSS/JS in `out/`, deployed to Cloudflare Pages
  // (same direct-upload flow as the host/lab). No server runtime; ideal for an
  // SEO-focused content site. See ../docs/deployment.md.
  output: "export",
  // Static export can't use Next's on-request image optimization.
  images: { unoptimized: true },
};

export default nextConfig;
