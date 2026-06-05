import type { MetadataRoute } from "next";

import { SITE_URL } from "@/lib/site";
import { posts } from "./posts/posts-data";

// Emitted as a static sitemap.xml at build (output: 'export'). Lists the fixed
// pages plus one entry per post from the registry.
export const dynamic = "force-static";

export default function sitemap(): MetadataRoute.Sitemap {
  const pages: MetadataRoute.Sitemap = [
    { url: SITE_URL, lastModified: new Date(), priority: 1 },
    { url: `${SITE_URL}/posts`, lastModified: new Date() },
    { url: `${SITE_URL}/cv`, lastModified: new Date() },
  ];

  const postPages: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${SITE_URL}/posts/${post.slug}`,
    lastModified: new Date(post.date),
  }));

  return [...pages, ...postPages];
}
