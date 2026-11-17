/** Renders HTML produced by renderMarkdown() on the server. */
export function Prose({ html }: { html: string }) {
  return <div className="prose-site" dangerouslySetInnerHTML={{ __html: html }} />;
}
