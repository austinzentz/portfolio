import { unified } from "unified";
import remarkParse from "remark-parse";
import remarkGfm from "remark-gfm";
import remarkRehype from "remark-rehype";
import rehypeHighlight from "rehype-highlight";
import rehypeStringify from "rehype-stringify";

// GFM Markdown with highlighted code blocks, rendered once on the server
// so public pages don't ship a Markdown parser. Raw HTML in Markdown is dropped (remark-rehype default).
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(rehypeHighlight, { plainText: ["env", "txt", "text"] })
  .use(rehypeStringify);

export async function renderMarkdown(md: string) {
  return String(await processor.process(md));
}
