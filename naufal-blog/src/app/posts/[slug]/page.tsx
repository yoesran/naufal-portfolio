import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";

import { getPost, posts } from "../posts-data";

const dateFmt = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "long",
  day: "numeric",
});

// Prerender one static page per known slug; 404 anything else (no SSR fallback
// exists in a static export anyway).
export function generateStaticParams() {
  return posts.map((post) => ({ slug: post.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  return { title: post.title, description: post.description };
}

export default async function PostPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const { default: Body } = await import(`@/content/${slug}.mdx`);

  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-16">
      <Link
        href="/posts"
        className="text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
      >
        ← posts
      </Link>

      <header className="mt-8">
        <time
          className="text-muted-foreground font-mono text-xs"
          dateTime={post.date}
        >
          {dateFmt.format(new Date(post.date))}
        </time>
        <h1 className="mt-2 text-3xl font-semibold tracking-tight sm:text-4xl">
          {post.title}
        </h1>
      </header>

      <article className="prose prose-invert post-prose mt-10 max-w-none">
        <Body />
      </article>
    </main>
  );
}
