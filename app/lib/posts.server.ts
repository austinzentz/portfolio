import { env } from "cloudflare:workers";

export type PostStatus = "draft" | "published";

export type Post = {
  id: number;
  slug: string;
  title: string;
  description: string;
  body: string;
  status: PostStatus;
  published_on: string | null;
  created_at: string;
  updated_at: string;
};

export type PostSummary = Pick<Post, "slug" | "title" | "description" | "published_on">;

export type PostInput = Pick<Post, "slug" | "title" | "description" | "body" | "status" | "published_on">;

const db = () => env.DB;

export async function listPublished(limit = 1000) {
  const { results } = await db()
    .prepare(
      `SELECT slug, title, description, published_on FROM posts
       WHERE status = 'published' ORDER BY published_on DESC, id DESC LIMIT ?`,
    )
    .bind(limit)
    .all<PostSummary>();
  return results;
}

export function getPublished(slug: string) {
  return db().prepare(`SELECT * FROM posts WHERE slug = ? AND status = 'published'`).bind(slug).first<Post>();
}

export async function listAll() {
  const { results } = await db()
    .prepare(
      `SELECT id, slug, title, status, published_on, updated_at FROM posts
       ORDER BY (status = 'draft') DESC, published_on DESC, id DESC`,
    )
    .all<Pick<Post, "id" | "slug" | "title" | "status" | "published_on" | "updated_at">>();
  return results;
}

export function getById(id: number) {
  return db().prepare(`SELECT * FROM posts WHERE id = ?`).bind(id).first<Post>();
}

export function slugTaken(slug: string, exceptId?: number) {
  return db()
    .prepare(`SELECT 1 FROM posts WHERE slug = ? AND id IS NOT ?`)
    .bind(slug, exceptId ?? null)
    .first()
    .then(Boolean);
}

export async function createPost(p: PostInput) {
  const row = await db()
    .prepare(
      `INSERT INTO posts (slug, title, description, body, status, published_on)
       VALUES (?, ?, ?, ?, ?, ?) RETURNING id`,
    )
    .bind(p.slug, p.title, p.description, p.body, p.status, p.published_on)
    .first<{ id: number }>();
  return row!.id;
}

export async function updatePost(id: number, p: PostInput) {
  await db()
    .prepare(
      `UPDATE posts SET slug = ?, title = ?, description = ?, body = ?, status = ?,
       published_on = ?, updated_at = datetime('now') WHERE id = ?`,
    )
    .bind(p.slug, p.title, p.description, p.body, p.status, p.published_on, id)
    .run();
}

export async function deletePost(id: number) {
  await db().prepare(`DELETE FROM posts WHERE id = ?`).bind(id).run();
}
