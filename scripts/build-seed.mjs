// Turns the Markdown files in content/archive/ into INSERT statements for D1.
// Slugs match the old Next.js URLs (/posts/<filename>), so existing links keep working.
// Uses INSERT OR IGNORE, so re-running never overwrites posts you've edited in /admin.
import { mkdirSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import matter from "gray-matter";

const dir = "content/archive";
const sql = (v) => (v == null ? "NULL" : `'${String(v).replaceAll("'", "''")}'`);

const rows = readdirSync(dir)
  .filter((f) => f.endsWith(".md"))
  .sort()
  .map((file) => {
    const { data, content } = matter(readFileSync(join(dir, file), "utf8"));
    const slug = file.replace(/\.md$/, "");
    return `INSERT OR IGNORE INTO posts (slug, title, description, body, status, published_on) VALUES (${[
      slug,
      data.title,
      data.description ?? "",
      content.trim() + "\n",
      "published",
      String(data.date),
    ]
      .map(sql)
      .join(", ")});`;
  });

mkdirSync(".seed", { recursive: true });
writeFileSync(".seed/archive-posts.sql", rows.join("\n") + "\n");
console.log(`Wrote ${rows.length} posts to .seed/archive-posts.sql`);
