import { Link } from "react-router";
import type { Route } from "./+types/home";
import { Prose } from "~/components/prose";
import { renderMarkdown } from "~/lib/markdown.server";
import { PostList } from "~/components/post-list";
import { listPublished } from "~/lib/posts.server";
import { site } from "~/lib/site";
import { sandboxes } from "~/sandbox/registry";
import about from "../../content/about.md?raw";

const bio = about.replace(/<!--[\s\S]*?-->/g, "").trim();

export const meta: Route.MetaFunction = () => [
  { title: site.name },
  { name: "description", content: site.description },
  { property: "og:title", content: site.name },
  { property: "og:description", content: site.description },
  { property: "og:url", content: site.url },
  { tagName: "link", rel: "canonical", href: site.url },
];

export async function loader() {
  return { posts: await listPublished(5), bio: await renderMarkdown(bio) };
}

function SectionHeading({ children, to, linkLabel }: { children: string; to: string; linkLabel: string }) {
  return (
    <div className="mb-4 flex items-baseline justify-between border-b border-rule pb-2">
      <h2 className="text-sm font-medium uppercase tracking-[0.08em] text-muted">{children}</h2>
      <Link to={to} className="text-sm text-muted hover:text-fg">
        {linkLabel}
      </Link>
    </div>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <section className="pt-4 sm:pt-8">
        <img
          src="/portrait-400.jpg"
          alt={site.name}
          width={96}
          height={96}
          className="mb-8 size-24 rounded-full object-cover grayscale"
        />
        <h1 className="sr-only">{site.name}</h1>
        <Prose html={loaderData.bio} />
        <p className="mt-8 flex flex-wrap gap-x-5 gap-y-2 text-sm">
          <a href={`mailto:${site.email}`} className="text-accent underline">
            Email
          </a>
          {site.links.map((l) => (
            <a key={l.href} href={l.href} className="text-accent underline">
              {l.label}
            </a>
          ))}
        </p>
      </section>

      {loaderData.posts.length > 0 && (
        <section className="mt-16">
          <SectionHeading to="/posts" linkLabel="All writing">
            Writing
          </SectionHeading>
          <PostList posts={loaderData.posts} />
        </section>
      )}

      {sandboxes.length > 0 && (
      <section className="mt-16">
        <SectionHeading to="/sandbox" linkLabel="All demos">
          Sandbox
        </SectionHeading>
        <ul className="space-y-4">
          {sandboxes.map((s) => (
            <li key={s.slug}>
              <Link to={`/sandbox/${s.slug}`} className="group block no-underline">
                <span className="font-serif text-lg group-hover:text-accent">{s.title}</span>
                <p className="mt-1 text-sm leading-relaxed text-muted">{s.summary}</p>
              </Link>
            </li>
          ))}
        </ul>
      </section>
      )}
    </>
  );
}
