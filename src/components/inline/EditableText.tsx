// Inline-editable text WITH typography controls (font, size, color, bold, italic)
// for the native prose on ContentPageLayout pages — title, intro, section
// headings/paragraphs, stat cards. The text commits to its `path`; the style
// commits to styles[styleKey] and is applied in BOTH view and edit mode.
//
// The style primitives live in @/components/inline/elem-style and the toolbar in
// StyleBar, because the event description's block editor applies the same
// typography without being a contentEditable box. They are re-exported here so
// the pages that already import them from this file keep working.

import { useState } from "react";
import { useInlineEdit } from "@/components/inline/edit-context";
import StyleBar from "@/components/inline/StyleBar";
import { styleClass, styleCss, usePageStyle } from "@/components/inline/elem-style";

export { PageStylesContext, styleClass, styleCss, usePageStyle } from "@/components/inline/elem-style";

interface Props {
  /** Text-content path in the override (e.g. "title", "sections.0.body.1"). */
  path: string;
  /** styles-map key (defaults to `path`). */
  styleKey?: string;
  children: string;
  className?: string;
  as?: "span" | "div";
}

const EditableText = ({ path, styleKey, children, className, as = "span" }: Props) => {
  const ctx = useInlineEdit();
  const sk = styleKey ?? path;
  const s = usePageStyle(sk);
  const [focused, setFocused] = useState(false);

  const cls = `${className ?? ""} ${styleClass(s)}`.trim();
  const css = styleCss(s);
  const hasCss = Object.keys(css).length > 0;

  if (!ctx?.editing) {
    const Tag = as;
    return <Tag className={cls || undefined} style={hasCss ? css : undefined}>{children}</Tag>;
  }

  const Tag = as;
  return (
    <span className="relative inline-block">
      <Tag
        contentEditable
        suppressContentEditableWarning
        spellCheck={false}
        data-inline-edit
        className={`${cls} outline-none focus:bg-primary/5 rounded px-0.5`}
        style={hasCss ? css : undefined}
        onKeyDown={(e) => { if (e.key === "Enter" && as === "span") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
        onFocus={() => setFocused(true)}
        onBlur={(e) => {
          setFocused(false);
          // [ \t]+ and not \s+: \s matches a newline too, so the old rule read a
          // blank line as "whitespace before a newline" and deleted it — every
          // paragraph break in a multi-line field vanished on the first blur,
          // whether or not anything had been typed.
          const text = (e.currentTarget.textContent ?? "").replace(/[ \t]+\n/g, "\n").trim();
          if (text !== children) ctx.set(path, text);
        }}
      >
        {children}
      </Tag>
      {focused && <StyleBar styleKey={sk} className="absolute -top-10 left-0 z-40" />}
    </span>
  );
};

export default EditableText;
