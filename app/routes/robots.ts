import { site } from "~/lib/site";

export const loader = () =>
  new Response(`User-agent: *\nDisallow: /admin\n\nSitemap: ${site.url}/sitemap.xml\n`, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=86400" },
  });
