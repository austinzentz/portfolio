import { type RouteConfig, index, prefix, route } from "@react-router/dev/routes";

export default [
  index("routes/home.tsx"),
  route("posts", "routes/posts.tsx"),
  route("posts/:slug", "routes/post.tsx"),
  route("sandbox", "routes/sandbox.tsx"),
  route("sandbox/staffing-budget", "sandbox/staffing-budget/route.tsx"),

  // Old URLs and machine-readable files
  route("contact", "routes/contact.ts"),
  route("rss.xml", "routes/rss.ts"),
  route("sitemap.xml", "routes/sitemap.ts"),
  route("robots.txt", "routes/robots.ts"),
  route("media/*", "routes/media.ts"),

  route("admin", "routes/admin/layout.tsx", [
    index("routes/admin/index.tsx"),
    route("media", "routes/admin/media.ts"),
    ...prefix("posts", [
      route("new", "routes/admin/post-new.tsx"),
      route(":id", "routes/admin/post-edit.tsx"),
    ]),
  ]),
] satisfies RouteConfig;
