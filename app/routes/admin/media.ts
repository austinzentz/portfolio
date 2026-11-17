import type { Route } from "./+types/media";
import { saveImage, UploadError } from "~/lib/media.server";

// Image uploads from the post editor. Lives under /admin, so the admin middleware
// (Cloudflare Access check + same-origin check) runs first.
export async function action({ request }: Route.ActionArgs) {
  if (request.method !== "POST") return new Response("Method not allowed", { status: 405 });

  const file = (await request.formData()).get("file");
  if (!(file instanceof File)) return new Response("No file received.", { status: 400 });

  try {
    return Response.json({ url: await saveImage(file) }, { status: 201 });
  } catch (e) {
    if (e instanceof UploadError) return new Response(e.message, { status: 400 });
    throw e;
  }
}
