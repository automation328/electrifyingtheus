// A rich-text editor for article bodies.
//
// It behaves like a word processor — press Bold, Heading, Link — but what it
// STORES is markdown. That is deliberate: a true WYSIWYG has to convert HTML
// back to markdown on every save, and that round-trip is where tables, links
// and nested lists quietly break. Here there is no conversion at all.
//
// Preview renders with the page's own components, so it shows what visitors get.

import { useRef, useState } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Bold, Italic, Heading2, Heading3, List, ListOrdered, Quote, Link2,
  Minus, Table as TableIcon, Code, Eye, Pencil,
} from "lucide-react";
import { toggleWrap, togglePrefix, toggleNumbered, insertSnippet, type EditResult } from "@/lib/markdown-edit";

const TABLE_SNIPPET = "\n| Column | Column |\n| --- | --- |\n| Value | Value |\n";

interface Props {
  value: string;
  onChange: (v: string) => void;
  /** Rendering components, so Preview matches the real page exactly. */
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  components?: any;
  className?: string;
}

const MarkdownEditor = ({ value, onChange, components, className }: Props) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  const [preview, setPreview] = useState(false);

  /** Run a transform on the live selection, then restore the caret it asks for. */
  const apply = (fn: (text: string, start: number, end: number) => EditResult) => {
    const el = ref.current;
    if (!el) return;
    const r = fn(el.value, el.selectionStart, el.selectionEnd);
    onChange(r.text);
    // The value comes back through props, so the caret has to be restored after
    // the re-render or the browser drops it to the end of the box.
    requestAnimationFrame(() => {
      const node = ref.current;
      if (!node) return;
      node.focus();
      node.setSelectionRange(r.selectionStart, r.selectionEnd);
    });
  };

  const link = () => apply((t, s, e) => {
    const label = t.slice(s, e) || "link text";
    // Caret lands on "url" so it can be typed straight over.
    return insertSnippet(t, s, e, `[${label}](url)`, label.length + 3);
  });

  const btn = "inline-flex items-center justify-center h-8 w-8 rounded-lg text-muted-foreground hover:bg-muted hover:text-foreground transition-colors";

  const tools: { title: string; icon: typeof Bold; run: () => void }[] = [
    { title: "Bold  (Ctrl+B)", icon: Bold, run: () => apply((t, s, e) => toggleWrap(t, s, e, "**")) },
    { title: "Italic  (Ctrl+I)", icon: Italic, run: () => apply((t, s, e) => toggleWrap(t, s, e, "*")) },
    { title: "Heading", icon: Heading2, run: () => apply((t, s, e) => togglePrefix(t, s, e, "## ")) },
    { title: "Smaller heading", icon: Heading3, run: () => apply((t, s, e) => togglePrefix(t, s, e, "### ")) },
    { title: "Bulleted list", icon: List, run: () => apply((t, s, e) => togglePrefix(t, s, e, "- ")) },
    { title: "Numbered list", icon: ListOrdered, run: () => apply((t, s, e) => toggleNumbered(t, s, e)) },
    { title: "Quote", icon: Quote, run: () => apply((t, s, e) => togglePrefix(t, s, e, "> ")) },
    { title: "Link  (Ctrl+K)", icon: Link2, run: link },
    { title: "Table", icon: TableIcon, run: () => apply((t, s, e) => insertSnippet(t, s, e, TABLE_SNIPPET)) },
    { title: "Divider", icon: Minus, run: () => apply((t, s, e) => insertSnippet(t, s, e, "\n---\n")) },
    { title: "Code", icon: Code, run: () => apply((t, s, e) => toggleWrap(t, s, e, "`")) },
  ];

  const onKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (!(e.metaKey || e.ctrlKey)) return;
    const k = e.key.toLowerCase();
    if (k === "b") { e.preventDefault(); apply((t, s, x) => toggleWrap(t, s, x, "**")); }
    else if (k === "i") { e.preventDefault(); apply((t, s, x) => toggleWrap(t, s, x, "*")); }
    else if (k === "k") { e.preventDefault(); link(); }
  };

  return (
    <div className={className}>
      <div className="mb-2 flex flex-wrap items-center gap-0.5 rounded-xl border border-border bg-muted/40 p-1">
        {tools.map((t, i) => (
          <span key={t.title} className="inline-flex items-center">
            <button type="button" title={t.title} onClick={t.run} disabled={preview} className={`${btn} ${preview ? "opacity-40" : ""}`}>
              <t.icon className="h-4 w-4" />
            </button>
            {(i === 1 || i === 3 || i === 6) && <span className="mx-1 h-5 w-px bg-border" />}
          </span>
        ))}
        <button
          type="button"
          onClick={() => setPreview((p) => !p)}
          className="ml-auto inline-flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10"
        >
          {preview ? <><Pencil className="h-3.5 w-3.5" /> Write</> : <><Eye className="h-3.5 w-3.5" /> Preview</>}
        </button>
      </div>

      {preview ? (
        <div className="h-[55vh] overflow-y-auto rounded-xl border border-border bg-background p-4 text-base">
          {value.trim()
            ? <ReactMarkdown remarkPlugins={[remarkGfm]} components={components}>{value}</ReactMarkdown>
            : <p className="text-sm text-muted-foreground">Nothing written yet.</p>}
        </div>
      ) : (
        <textarea
          ref={ref}
          autoFocus
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          spellCheck
          className="h-[55vh] w-full resize-y rounded-xl border border-border bg-background p-3 font-mono text-sm leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-primary/40"
        />
      )}
    </div>
  );
};

export default MarkdownEditor;
