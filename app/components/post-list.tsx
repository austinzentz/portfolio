import { Link } from "react-router";
import { formatDate } from "~/lib/site";

type Item = { slug: string; title: string; description: string; published_on: string | null };

export function PostList({ posts, showDescriptions = false }: { posts: Item[]; showDescriptions?: boolean }) {
  return (
    <ul className="divide-y divide-rule">
      {posts.map((p) => (
        <li key={p.slug} className="py-4 first:pt-0">
          <Link to={`/posts/${p.slug}`} className="group block no-underline">
            <div className="flex flex-col gap-0.5 sm:flex-row sm:items-baseline sm:justify-between sm:gap-6">
              <span className="font-serif text-lg leading-snug group-hover:text-accent">{p.title}</span>
              {p.published_on && (
                <time dateTime={p.published_on} className="shrink-0 text-sm text-muted tabular-nums">
                  {formatDate(p.published_on, "short")}
                </time>
              )}
            </div>
            {showDescriptions && p.description && (
              <p className="mt-1 text-sm leading-relaxed text-muted">{p.description}</p>
            )}
          </Link>
        </li>
      ))}
    </ul>
  );
}
