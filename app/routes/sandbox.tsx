import { Link } from "react-router";
import type { Route } from "./+types/sandbox";
import { title } from "~/lib/site";
import { sandboxes } from "~/sandbox/registry";

export const meta: Route.MetaFunction = () => [
  { title: title("Sandbox") },
  { name: "description", content: "Small working demos of the kinds of tools I build." },
];

export default function Sandbox() {
  return (
    <>
      <h1 className="font-serif text-3xl font-medium tracking-tight">Sandbox</h1>
      <p className="mt-3 mb-10 text-muted">Sandbox, local-only versions of apps and tools I've built.</p>
      {sandboxes.length === 0 && <p className="text-muted">Nothing here yet.</p>}
      <ul className="divide-y divide-rule">
        {sandboxes.map((s) => (
          <li key={s.slug} className="py-4 first:pt-0">
            <Link to={`/sandbox/${s.slug}`} className="group block no-underline">
              <span className="font-serif text-lg group-hover:text-accent">{s.title}</span>
              <p className="mt-1 text-sm leading-relaxed text-muted">{s.summary}</p>
            </Link>
          </li>
        ))}
      </ul>
    </>
  );
}
