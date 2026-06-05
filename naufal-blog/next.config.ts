import type { NextConfig } from "next";
import createMDX from "@next/mdx";

const nextConfig: NextConfig = {
  // Static export → plain HTML/CSS/JS in `out/`, deployed to Cloudflare Pages
  // (same direct-upload flow as the host/lab). No server runtime; ideal for an
  // SEO-focused content site. See ../docs/deployment.md.
  output: "export",
  // Static export can't use Next's on-request image optimization.
  images: { unoptimized: true },
  // Let .md/.mdx be compiled as modules (posts live in src/content, imported by
  // the posts/[slug] route — they aren't routes themselves).
  pageExtensions: ["ts", "tsx", "js", "jsx", "md", "mdx"],
};

const withMDX = createMDX({
  options: {
    // Turbopack requires string plugin names — JS functions can't cross to the
    // Rust compiler. remark-gfm adds tables, strikethrough, task lists, etc.
    remarkPlugins: ["remark-gfm"],
  },
});

export default withMDX(nextConfig);
