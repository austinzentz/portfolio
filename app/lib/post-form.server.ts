import { slugTaken, type PostInput } from "./posts.server";

export type FieldErrors = Partial<Record<keyof PostInput, string>>;

const SLUG = /^[a-z0-9]+(?:-[a-z0-9]+)*$/;
const DAY = /^\d{4}-\d{2}-\d{2}$/;

export async function parsePostForm(form: FormData, exceptId?: number) {
  const str = (k: string) => String(form.get(k) ?? "").trim();
  const values: PostInput = {
    title: str("title"),
    slug: str("slug").toLowerCase(),
    description: str("description"),
    body: String(form.get("body") ?? "").replace(/\r\n/g, "\n"),
    status: str("status") === "published" ? "published" : "draft",
    published_on: str("published_on") || null,
  };

  const errors: FieldErrors = {};
  if (!values.title) errors.title = "Add a title.";
  if (!SLUG.test(values.slug)) errors.slug = "Use lowercase letters, numbers and dashes.";
  else if (await slugTaken(values.slug, exceptId)) errors.slug = "Another post already uses this slug.";
  if (values.published_on && !DAY.test(values.published_on)) errors.published_on = "Use YYYY-MM-DD.";
  if (values.status === "published" && !values.published_on) {
    values.published_on = new Date().toISOString().slice(0, 10);
  }

  return { values, errors, ok: Object.keys(errors).length === 0 };
}
