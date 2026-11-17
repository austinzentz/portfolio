import { listPublished } from "~/lib/posts.server";
import { site } from "~/lib/site";
import { sandboxes } from "~/sandbox/registry";

export async function loader() {
  const posts = await listPublished();
  const urls = [
    "/",
    "/posts",
    "/sandbox",
    ...sandboxes.map((s) => `/sandbox/${s.slug}`),
    ...posts.map((p) => `/posts/${p.slug}`),
  ];
  const xml = `<?xml version="1.0" encoding="UTF-8"?><urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls
    .map((u) => `<url><loc>${site.url}${u}</loc></url>`)
    .join("")}</urlset>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
