import { Link } from "react-router";
import type { Route } from "./+types/index";
import { listAll } from "~/lib/posts.server";
import { formatDate, title } from "~/lib/site";

export const meta: Route.MetaFunction = () => [{ title: title("Posts", "Admin") }];

export async function loader() {
  return { posts: await listAll() };
}

export default function AdminIndex({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <div className="mb-6 flex items-baseline justify-between">
        <h1 className="font-serif text-2xl font-medium">Posts</h1>
        <Link
          to="/admin/posts/new"
          className="rounded-md bg-accent px-3 py-1.5 text-sm font-medium text-bg no-underline hover:opacity-90"
        >
          New post
        </Link>
      </div>
      <ul className="divide-y divide-rule border-y border-rule">
        {loaderData.posts.map((p) => (
          <li key={p.id} className="flex items-baseline justify-between gap-4 py-3">
            <Link to={`/admin/posts/${p.id}`} className="min-w-0 truncate hover:text-accent">
              {p.title}
            </Link>
            <span className="flex shrink-0 items-baseline gap-3 text-sm text-muted">
              {p.status === "draft" ? (
                <span className="rounded border border-rule px-1.5 text-xs tracking-wide uppercase">Draft</span>
              ) : (
                p.published_on && formatDate(p.published_on, "short")
              )}
            </span>
          </li>
        ))}
      </ul>
    </>
  );
}
