// Browser-only (the .client suffix keeps it out of the server build). Loaded lazily from post-editor.tsx,
// so MDXEditor's code only ever downloads on /admin pages.
import {
  BlockTypeSelect,
  BoldItalicUnderlineToggles,
  ChangeCodeMirrorLanguage,
  CodeToggle,
  ConditionalContents,
  CreateLink,
  DiffSourceToggleWrapper,
  InsertCodeBlock,
  InsertImage,
  InsertTable,
  InsertThematicBreak,
  ListsToggle,
  MDXEditor,
  Separator,
  UndoRedo,
  codeBlockPlugin,
  codeMirrorPlugin,
  diffSourcePlugin,
  headingsPlugin,
  imagePlugin,
  linkDialogPlugin,
  linkPlugin,
  listsPlugin,
  markdownShortcutPlugin,
  quotePlugin,
  tablePlugin,
  thematicBreakPlugin,
  toolbarPlugin,
} from "@mdxeditor/editor";
import "@mdxeditor/editor/style.css";
import { EditorView } from "@codemirror/view";

// CodeMirror turns spellcheck off by default. Turn it on for the Markdown source/diff views
// (not for code blocks, where every identifier would be flagged).
const spellcheckSource = EditorView.contentAttributes.of({ spellcheck: "true", lang: "en" });

// Languages offered for code blocks (keys are what's written after ``` in the Markdown).
const CODE_LANGUAGES: Record<string, string> = {
  "": "Plain text",
  ts: "TypeScript",
  tsx: "TSX",
  js: "JavaScript",
  jsx: "JSX",
  json: "JSON",
  bash: "Shell",
  sh: "Shell (sh)",
  css: "CSS",
  html: "HTML",
  sql: "SQL",
  python: "Python",
  yaml: "YAML",
  env: ".env",
  txt: "Text",
};

async function uploadImage(file: File) {
  const form = new FormData();
  form.append("file", file);
  const res = await fetch("/admin/media", { method: "POST", body: form });
  if (!res.ok) {
    const message = (await res.text()) || `Upload failed (${res.status})`;
    alert(message);
    throw new Error(message);
  }
  const { url } = (await res.json()) as { url: string };
  return url;
}

export default function RichEditor({
  markdown,
  savedMarkdown,
  onChange,
}: {
  markdown: string;
  /** Last saved version, shown in the toolbar's diff view. */
  savedMarkdown: string;
  onChange: (markdown: string) => void;
}) {
  return (
    <MDXEditor
      markdown={markdown}
      onChange={(md) => onChange(md)}
      className="mdx-site"
      contentEditableClassName="prose-site mdx-site-content"
      spellCheck
      // Match the existing posts' Markdown style, so opening and saving an old post changes as little as possible.
      toMarkdownOptions={{ emphasis: "_", strong: "*", bullet: "-", rule: "-", fence: "`", listItemIndent: "one" }}
      plugins={[
        headingsPlugin({ allowedHeadingLevels: [2, 3, 4] }),
        listsPlugin(),
        quotePlugin(),
        thematicBreakPlugin(),
        linkPlugin(),
        linkDialogPlugin(),
        tablePlugin(),
        imagePlugin({ imageUploadHandler: uploadImage, disableImageResize: true }),
        codeBlockPlugin({ defaultCodeBlockLanguage: "" }),
        codeMirrorPlugin({ codeBlockLanguages: CODE_LANGUAGES }),
        diffSourcePlugin({
          viewMode: "rich-text",
          diffMarkdown: savedMarkdown,
          codeMirrorExtensions: [spellcheckSource],
        }),
        markdownShortcutPlugin(),
        toolbarPlugin({
          toolbarContents: () => (
            <DiffSourceToggleWrapper options={["rich-text", "source", "diff"]}>
              <ConditionalContents
                options={[
                  {
                    when: (editor) => editor?.editorType === "codeblock",
                    contents: () => <ChangeCodeMirrorLanguage />,
                  },
                  {
                    fallback: () => (
                      <>
                        <UndoRedo />
                        <Separator />
                        <BlockTypeSelect />
                        {/* No underline: Markdown has no syntax for it. */}
                        <BoldItalicUnderlineToggles options={["Bold", "Italic"]} />
                        <CodeToggle />
                        <Separator />
                        <ListsToggle options={["bullet", "number"]} />
                        <Separator />
                        <CreateLink />
                        <InsertImage />
                        <InsertTable />
                        <InsertCodeBlock />
                        <InsertThematicBreak />
                      </>
                    ),
                  },
                ]}
              />
            </DiffSourceToggleWrapper>
          ),
        }),
      ]}
    />
  );
}
