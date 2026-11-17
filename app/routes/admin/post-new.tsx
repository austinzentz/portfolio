import { data, redirect } from "react-router";
import type { Route } from "./+types/post-new";
import { PostEditor } from "~/components/post-editor";
import { parsePostForm } from "~/lib/post-form.server";
import { createPost } from "~/lib/posts.server";
import { title } from "~/lib/site";

export const meta: Route.MetaFunction = () => [{ title: title("New post", "Admin") }];

export async function action({ request }: Route.ActionArgs) {
  const { values, errors, ok } = await parsePostForm(await request.formData());
  if (!ok) return data({ errors, values }, { status: 400 });
  const id = await createPost(values);
  return redirect(`/admin/posts/${id}?saved=1`);
}

export default function NewPost({ actionData }: Route.ComponentProps) {
  const initial = actionData?.values ?? {
    title: "",
    slug: "",
    description: "",
    body: "",
    status: "draft" as const,
    published_on: null,
  };
  return (
    <>
      <h1 className="mb-6 font-serif text-2xl font-medium">New post</h1>
      <PostEditor key={JSON.stringify(actionData?.errors)} initial={initial} errors={actionData?.errors} isNew />
    </>
  );
}
