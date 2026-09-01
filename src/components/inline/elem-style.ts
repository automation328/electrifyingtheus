// Per-element typography an editor sets on a page: font, size, weight, slant,
// colour, alignment.
//
// The style is stored beside the text rather than in it — a FLAT map keyed by
// the same dotted path the text commits to ("intro", "sections.0.heading",
// "fields.description"), living in the page override's `styles`. Keeping it out
// of the text is what lets the stored value stay plain prose that other surfaces
// (a card, a share email, a meta tag) can read without knowing about markup.
//
// It lives in its own module, not in EditableText, because more than one editor
// applies it: the contentEditable boxes, and the event description's block
// editor. Both read it through here, so a page renders the same typography to a
// visitor as the editor saw while setting it.

import { createContext, useContext } from "react";
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

/** The style at `key` plus a setter that patches it. The setter is a no-op
 *  outside edit mode, so a caller can render the controls unconditionally. */
export function useElemStyle(key: string): [ElemStyle | undefined, (patch: Partial<ElemStyle>) => void] {
  const ctx = useInlineEdit();
  const style = usePageStyle(key);
  const setStyle = (patch: Partial<ElemStyle>) => {
    if (!ctx) return;
    const next: Record<string, unknown> = { ...(style ?? {}), ...patch };
    for (const k of Object.keys(next)) if (next[k] === undefined || next[k] === "") delete next[k];
    // Write the WHOLE flat styles map (keys are dotted paths). ctx.set → setPath
    // would otherwise split "styles.sections.0.heading" into a nested object that
    // the flat reader (usePageStyle) never finds.
    const map = { ...((ctx.get("styles") as Record<string, ElemStyle> | undefined) ?? {}) };
    if (Object.keys(next).length) map[key] = next as ElemStyle; else delete map[key];
    ctx.set("styles", map);
  };
  return [style, setStyle];
}
