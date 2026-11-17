import { listPublished } from "~/lib/posts.server";
import { site } from "~/lib/site";

const esc = (s: string) => s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

export async function loader() {
  const posts = await listPublished(50);
  const items = posts
    .map((p) => {
      const url = `${site.url}/posts/${p.slug}`;
      const date = p.published_on ? new Date(`${p.published_on}T12:00:00Z`).toUTCString() : "";
      return `<item><title>${esc(p.title)}</title><link>${url}</link><guid>${url}</guid>${
        date ? `<pubDate>${date}</pubDate>` : ""
      }<description>${esc(p.description)}</description></item>`;
    })
    .join("");
  const xml = `<?xml version="1.0" encoding="UTF-8"?><rss version="2.0"><channel><title>${esc(
    site.name,
  )} — Writing</title><link>${site.url}</link><description>${esc(site.description)}</description>${items}</channel></rss>`;
  return new Response(xml, {
    headers: { "Content-Type": "application/rss+xml; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
