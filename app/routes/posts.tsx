import type { Route } from "./+types/posts";
import { PostList } from "~/components/post-list";
import { listPublished } from "~/lib/posts.server";
import { title } from "~/lib/site";

export const meta: Route.MetaFunction = () => [
  { title: title("Writing") },
  { name: "description", content: "Notes and posts, mostly about building for the web." },
];

export async function loader() {
  return { posts: await listPublished() };
}

export default function Posts({ loaderData }: Route.ComponentProps) {
  return (
    <>
      <h1 className="mb-10 font-serif text-3xl font-medium tracking-tight">Writing</h1>
      {loaderData.posts.length ? (
        <PostList posts={loaderData.posts} showDescriptions />
      ) : (
        <p className="text-muted">Nothing here yet.</p>
      )}
    </>
  );
}
