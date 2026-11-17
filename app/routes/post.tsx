import { data, Link } from "react-router";
import type { Route } from "./+types/post";
import { Prose } from "~/components/prose";
import { renderMarkdown } from "~/lib/markdown.server";
import { getPublished } from "~/lib/posts.server";
import { formatDate, site, title } from "~/lib/site";

const STALE_AFTER_YEARS = 3;

export async function loader({ params }: Route.LoaderArgs) {
  const post = await getPublished(params.slug);
  if (!post) throw data("Post not found", { status: 404 });
  const { body, ...meta } = post;
  return { post: meta, html: await renderMarkdown(body) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => {
  if (!loaderData) return [{ title: title("Not found") }];
  const { post } = loaderData;
  const url = `${site.url}/posts/${post.slug}`;
  return [
    { title: title(post.title) },
    { name: "description", content: post.description },
    { property: "og:type", content: "article" },
    { property: "og:title", content: post.title },
    { property: "og:description", content: post.description },
    { property: "og:url", content: url },
    { tagName: "link", rel: "canonical", href: url },
  ];
};

export default function PostPage({ loaderData: { post, html } }: Route.ComponentProps) {
  const year = post.published_on ? Number(post.published_on.slice(0, 4)) : null;
  const isOld = year !== null && new Date().getUTCFullYear() - year >= STALE_AFTER_YEARS;

  return (
    <article>
      <header className="mb-10">
        <h1 className="font-serif text-3xl leading-tight font-medium tracking-tight sm:text-4xl">{post.title}</h1>
        {post.published_on && (
          <time dateTime={post.published_on} className="mt-3 block text-sm text-muted">
            {formatDate(post.published_on)}
          </time>
        )}
        {isOld && (
          <p className="mt-6 rounded-md border border-rule bg-surface px-4 py-3 text-sm text-muted">
            This is an older post from {year}. Some of the details (and opinions) may be out of date.
          </p>
        )}
      </header>
      <Prose html={html} />
      <footer className="mt-16 border-t border-rule pt-6 text-sm">
        <Link to="/posts" className="text-muted hover:text-fg">
          ← All writing
        </Link>
      </footer>
    </article>
  );
}
