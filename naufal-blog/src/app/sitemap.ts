import type { MetadataRoute } from "next";

import { locales } from "@/lib/i18n/config";
import { posts } from "@/lib/posts";
import { SITE_URL } from "@/lib/site";

// Static sitemap.xml at build. One entry per locale × route, each carrying
// hreflang `alternates` so search engines see the language variants.
export const dynamic = "force-static";

function languagesFor(tail: string) {
  return Object.fromEntries(locales.map((l) => [l, `${SITE_URL}/${l}${tail}`]));
}

export default function sitemap(): MetadataRoute.Sitemap {
  const entries: MetadataRoute.Sitemap = [];

  for (const route of ["", "posts", "cv"]) {
    const tail = route ? `/${route}` : "";
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}/${lang}${tail}`,
        lastModified: new Date(),
        alternates: { languages: languagesFor(tail) },
      });
    }
  }

  for (const post of posts) {
    const tail = `/posts/${post.slug}`;
    for (const lang of locales) {
      entries.push({
        url: `${SITE_URL}/${lang}${tail}`,
        lastModified: new Date(post.date),
        alternates: { languages: languagesFor(tail) },
      });
    }
  }

  return entries;
}
