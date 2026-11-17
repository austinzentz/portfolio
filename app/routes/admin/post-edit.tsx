import { data, redirect, useSearchParams } from "react-router";
import type { Route } from "./+types/post-edit";
import { PostEditor } from "~/components/post-editor";
import { parsePostForm } from "~/lib/post-form.server";
import { deletePost, getById, updatePost } from "~/lib/posts.server";
import { title } from "~/lib/site";

async function load(idParam: string) {
  const id = Number(idParam);
  const post = Number.isInteger(id) ? await getById(id) : null;
  if (!post) throw data("Post not found", { status: 404 });
  return post;
}

export async function loader({ params }: Route.LoaderArgs) {
  return { post: await load(params.id) };
}

export const meta: Route.MetaFunction = ({ loaderData }) => [
  { title: title(loaderData?.post.title ?? "Edit post", "Admin") },
];

export async function action({ request, params }: Route.ActionArgs) {
  const post = await load(params.id);
  const form = await request.formData();

  if (form.get("intent") === "delete") {
    await deletePost(post.id);
    return redirect("/admin");
  }

  const { values, errors, ok } = await parsePostForm(form, post.id);
  if (!ok) return data({ errors, values }, { status: 400 });
  await updatePost(post.id, values);
  return redirect(`/admin/posts/${post.id}?saved=1`);
}

export default function EditPost({ loaderData, actionData }: Route.ComponentProps) {
  const { post } = loaderData;
  const [params] = useSearchParams();
  const initial = actionData?.values ?? post;
  return (
    <>
      <div className="mb-6 flex items-baseline justify-between gap-4">
        <h1 className="font-serif text-2xl font-medium">Edit post</h1>
        {params.get("saved") && !actionData && <span className="text-sm text-accent">Saved</span>}
      </div>
      <PostEditor
        key={`${post.updated_at}-${JSON.stringify(actionData?.errors)}`}
        initial={initial}
        errors={actionData?.errors}
        isNew={false}
        publicUrl={post.status === "published" ? `/posts/${post.slug}` : undefined}
      />
    </>
  );
}
