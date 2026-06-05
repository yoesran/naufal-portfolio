// Post registry — the single source of truth for the index ordering and each
// post's metadata. To publish a post: add a `<slug>.mdx` body in src/content/
// and an entry here (newest first). The posts/[slug] route renders the body and
// pulls its <title>/description from this list, so there's no metadata to keep
// in sync inside the MDX file.
export type PostMeta = {
  slug: string;
  title: string;
  description: string;
  date: string; // ISO 8601, e.g. "2026-06-05"
};

export const posts: PostMeta[] = [
  {
    slug: "writing-with-mdx",
    title: "Writing posts with MDX",
    description:
      "How this blog's posts are authored — MDX bodies in src/content, metadata in one registry, statically exported. Doubles as the template for the next post.",
    date: "2026-06-05",
  },
];

export function getPost(slug: string): PostMeta | undefined {
  return posts.find((post) => post.slug === slug);
}
