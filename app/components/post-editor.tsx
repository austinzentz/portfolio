import { lazy, Suspense, useEffect, useState } from "react";
import { Form, Link, useNavigation } from "react-router";

// MDXEditor only runs in the browser. Until it has loaded (or if JavaScript is off), a plain
// Markdown text box stands in, so the form always works.
const RichEditor = lazy(() => import("./rich-editor.client"));

function PlainBody({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  return (
    <textarea
      aria-label="Body (Markdown)"
      value={value}
      onChange={(e) => onChange(e.target.value)}
      className={`${input} min-h-[60vh] font-mono text-sm leading-relaxed`}
    />
  );
}

export type EditorValues = {
  title: string;
  slug: string;
  description: string;
  body: string;
  status: "draft" | "published";
  published_on: string | null;
};
type Errors = Partial<Record<keyof EditorValues, string>>;

const slugify = (s: string) =>
  s.toLowerCase().normalize("NFKD").replace(/[^\w\s-]/g, "").trim().replace(/[\s_-]+/g, "-").replace(/^-|-$/g, "");

const input =
  "mt-1 block w-full rounded-md border border-rule bg-bg px-3 py-2 text-base text-fg placeholder:text-muted/70 focus:border-accent focus:outline-none";

function Field({ label, error, hint, children }: { label: string; error?: string; hint?: string; children: React.ReactNode }) {
  return (
    <label className="block text-sm">
      <span className="font-medium">{label}</span>
      {children}
      {error ? <span className="mt-1 block text-[#b3261e] dark:text-[#f2b8b5]">{error}</span> : hint ? <span className="mt-1 block text-muted">{hint}</span> : null}
    </label>
  );
}

export function PostEditor({
  initial,
  errors = {},
  isNew,
  publicUrl,
}: {
  initial: EditorValues;
  errors?: Errors;
  isNew: boolean;
  publicUrl?: string;
}) {
  const [title, setTitle] = useState(initial.title);
  const [slug, setSlug] = useState(initial.slug);
  const [slugEdited, setSlugEdited] = useState(!isNew);
  const [body, setBody] = useState(initial.body);
  const [mounted, setMounted] = useState(false);
  useEffect(() => setMounted(true), []);
  const busy = useNavigation().state === "submitting";

  return (
    <Form method="post" className="space-y-5">
      <Field label="Title" error={errors.title}>
        <input
          name="title"
          className={`${input} font-serif text-xl`}
          value={title}
          onChange={(e) => {
            setTitle(e.target.value);
            if (!slugEdited) setSlug(slugify(e.target.value));
          }}
          required
        />
      </Field>

      <div className="grid gap-5 sm:grid-cols-[1fr_auto_auto]">
        <Field
          label="Slug"
          error={errors.slug}
          hint={!isNew && initial.status === "published" ? "Changing this breaks existing links." : `/posts/${slug || "…"}`}
        >
          <input
            name="slug"
            className={`${input} font-mono text-sm`}
            value={slug}
            onChange={(e) => {
              setSlug(e.target.value);
              setSlugEdited(true);
            }}
            required
          />
        </Field>
        <Field label="Date" error={errors.published_on}>
          <input type="date" name="published_on" className={input} defaultValue={initial.published_on ?? ""} />
        </Field>
        <Field label="Status">
          <select name="status" className={input} defaultValue={initial.status}>
            <option value="draft">Draft</option>
            <option value="published">Published</option>
          </select>
        </Field>
      </div>

      <Field label="Description" hint="Shown in lists, search results and link previews.">
        <textarea name="description" rows={2} className={input} defaultValue={initial.description} />
      </Field>

      <div>
        <span className="text-sm font-medium">Body</span>
        <input type="hidden" name="body" value={body} />
        <div className="mt-1">
          {mounted ? (
            <Suspense fallback={<PlainBody value={body} onChange={setBody} />}>
              <RichEditor markdown={initial.body} savedMarkdown={initial.body} onChange={setBody} />
            </Suspense>
          ) : (
            <PlainBody value={body} onChange={setBody} />
          )}
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3 border-t border-rule pt-5">
        <div className="flex items-center gap-3">
          <button
            type="submit"
            name="intent"
            value="save"
            disabled={busy}
            className="rounded-md bg-accent px-4 py-2 text-sm font-medium text-bg hover:opacity-90 disabled:opacity-60"
          >
            {busy ? "Saving…" : isNew ? "Create post" : "Save"}
          </button>
          <Link to="/admin" className="text-sm text-muted hover:text-fg">
            Cancel
          </Link>
          {publicUrl && (
            <a href={publicUrl} className="text-sm text-muted hover:text-fg" target="_blank" rel="noreferrer">
              View live ↗
            </a>
          )}
        </div>
        {!isNew && (
          <button
            type="submit"
            name="intent"
            value="delete"
            formNoValidate
            onClick={(e) => {
              if (!confirm("Delete this post permanently?")) e.preventDefault();
            }}
            className="text-sm text-[#b3261e] hover:underline dark:text-[#f2b8b5]"
          >
            Delete post
          </button>
        )}
      </div>
    </Form>
  );
}
