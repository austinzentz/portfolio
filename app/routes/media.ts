import type { Route } from "./+types/media";
import { getImage, isMediaKey } from "~/lib/media.server";

// Serves uploaded images from R2. Keys contain a random UUID and never change, so they cache forever.
export async function loader({ params, request }: Route.LoaderArgs) {
  const key = params["*"] ?? "";
  if (!isMediaKey(key)) return new Response("Not found", { status: 404 });

  const object = await getImage(key, request);
  if (!object) return new Response("Not found", { status: 404 });

  const headers = new Headers();
  object.writeHttpMetadata(headers);
  headers.set("ETag", object.httpEtag);
  headers.set("Cache-Control", "public, max-age=31536000, immutable");
  headers.set("X-Content-Type-Options", "nosniff");
  headers.set("Content-Security-Policy", "default-src 'none'; style-src 'unsafe-inline'; sandbox");

  // onlyIf matched an If-None-Match: the browser's copy is current.
  if (!("body" in object)) return new Response(null, { status: 304, headers });
  return new Response(object.body, { headers });
}
