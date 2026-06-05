import type { Metadata } from "next";
import Link from "next/link";

import { posts } from "./posts-data";

export const metadata: Metadata = {
  title: "Posts",
  description:
    "Writing on frontend and microfrontend engineering by Naufal Yusran — the portfolio's architecture and the traps hit building it.",
};

const dateFmt = new Intl.DateTimeFormat("en", {
  year: "numeric",
  month: "short",
  day: "numeric",
});

export default function PostsPage() {
  return (
    <main className="mx-auto flex min-h-dvh w-full max-w-2xl flex-col px-6 py-16">
      <Link
        href="/"
        className="text-muted-foreground hover:text-foreground font-mono text-sm transition-colors"
      >
        ← naufal.dev
      </Link>
      <h1 className="mt-8 text-3xl font-semibold tracking-tight sm:text-4xl">
        Posts
      </h1>
      <p className="text-muted-foreground mt-4 text-lg leading-relaxed">
        Writing on the things I build — cross-framework Module Federation, the
        portfolio&apos;s architecture, and the traps I hit along the way.
      </p>

      {posts.length === 0 ? (
        <p className="text-muted-foreground mt-12 font-mono text-sm">
          First post in the works — check back soon.
        </p>
      ) : (
        <ul className="mt-12 flex flex-col gap-8">
          {posts.map((post) => (
            <li key={post.slug}>
              <Link href={`/posts/${post.slug}`} className="group block">
                <time
                  className="text-muted-foreground font-mono text-xs"
                  dateTime={post.date}
                >
                  {dateFmt.format(new Date(post.date))}
                </time>
                <h2 className="group-hover:text-brand mt-1 text-xl font-medium tracking-tight transition-colors">
                  {post.title}
                </h2>
                <p className="text-muted-foreground mt-1 leading-relaxed">
                  {post.description}
                </p>
              </Link>
            </li>
          ))}
        </ul>
      )}
    </main>
  );
}
