// Inline-editable text WITH typography controls (font, size, color, bold, italic)
// for the native prose on ContentPageLayout pages — title, intro, section
// headings/paragraphs, stat cards. The text commits to its `path`; the style
// commits to styles[styleKey] and is applied in BOTH view and edit mode.
//
// Styles come from PageStylesContext (fed by the merged page override), so they
// render on the published page too — not just while editing.

import { createContext, useContext, useState } from "react";
import { useInlineEdit } from "@/components/inline/edit-context";
import type { ElemStyle } from "@/lib/page-content";

/** Effective per-element styles for the current page (merged override). */
export const PageStylesContext = createContext<Record<string, ElemStyle> | undefined>(undefined);

/** Font-family class (important so it beats the element's base font). */
export const styleClass = (s?: ElemStyle) =>
  s?.font === "display" ? "!font-display" : s?.font === "mono" ? "!font-mono" : s?.font === "sans" ? "!font-sans" : "";

/** Inline CSS for an element style. Size uses `em` so it scales the element's own
 *  (responsive) base size rather than replacing it. */
export const styleCss = (s?: ElemStyle): React.CSSProperties => {
  const css: React.CSSProperties = {};
  if (!s) return css;
  if (s.color) css.color = s.color;
  if (s.bold) css.fontWeight = 700;
  if (s.italic) css.fontStyle = "italic";
  if (s.align) css.textAlign = s.align;
  if (s.size) css.fontSize = { sm: "0.85em", md: "1em", lg: "1.3em", xl: "1.6em" }[s.size];
  return css;
};

export const usePageStyle = (key: string): ElemStyle | undefined => useContext(PageStylesContext)?.[key];

interface Props {
  /** Text-content path in the override (e.g. "title", "sections.0.body.1"). */
  path: string;
  /** styles-map key (defaults to `path`). */
  styleKey?: string;
  children: string;
  className?: string;
  as?: "span" | "div";
}

const SIZES = ["sm", "md", "lg", "xl"] as const;

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

  const setStyle = (patch: Partial<ElemStyle>) => {
    const next: Record<string, unknown> = { ...(s ?? {}), ...patch };
    for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === "") delete next[k];
    // Write the WHOLE flat styles map (keys are dotted paths). ctx.set → setPath
    // would otherwise split "styles.sections.0.heading" into a nested object that
    // the flat reader (usePageStyle) never finds.
    const map = { ...((ctx.get("styles") as Record<string, ElemStyle> | undefined) ?? {}) };
    if (Object.keys(next).length) map[sk] = next as ElemStyle; else delete map[sk];
    ctx.set("styles", map);
  };

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
          const text = (e.currentTarget.textContent ?? "").replace(/\s+\n/g, "\n").trim();
          if (text !== children) ctx.set(path, text);
        }}
      >
        {children}
      </Tag>
      {focused && (
        <span
          contentEditable={false}
          className="absolute -top-10 left-0 z-40 flex items-center gap-1 rounded-lg bg-foreground/95 backdrop-blur px-1.5 py-1 shadow-lg text-white text-[11px] whitespace-nowrap"
          onMouseDown={(e) => e.preventDefault()}
        >
          <select value={s?.font ?? ""} onChange={(e) => setStyle({ font: (e.target.value || undefined) as ElemStyle["font"] })} className="bg-white/10 rounded px-1 py-0.5 text-white outline-none" title="Font">
            <option value="">Font</option>
            <option value="display">Display</option>
            <option value="sans">Sans</option>
            <option value="mono">Mono</option>
          </select>
          {SIZES.map((z) => (
            <button key={z} onClick={() => setStyle({ size: s?.size === z ? undefined : z })} className={`px-1 rounded uppercase ${s?.size === z ? "bg-white/25" : "hover:bg-white/15"}`}>{z}</button>
          ))}
          <span className="w-px h-4 bg-white/25 mx-0.5" />
          <button onClick={() => setStyle({ bold: !s?.bold })} className={`px-1.5 rounded font-bold ${s?.bold ? "bg-white/25" : "hover:bg-white/15"}`}>B</button>
          <button onClick={() => setStyle({ italic: !s?.italic })} className={`px-1.5 rounded italic ${s?.italic ? "bg-white/25" : "hover:bg-white/15"}`}>I</button>
          <span className="w-px h-4 bg-white/25 mx-0.5" />
          <input type="color" value={/^#/.test(s?.color ?? "") ? s!.color! : "#0057b7"} onChange={(e) => setStyle({ color: e.target.value })} className="w-5 h-5 rounded bg-transparent cursor-pointer" title="Text color" />
          {s?.color && <button onClick={() => setStyle({ color: undefined })} className="px-1 rounded hover:bg-white/15" title="Reset color">✕</button>}
        </span>
      )}
    </span>
  );
};

export default EditableText;
