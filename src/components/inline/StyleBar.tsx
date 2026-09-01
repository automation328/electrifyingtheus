// The typography controls an editor gets on a piece of page text: font, size,
// bold, italic, colour.
//
// One component, two homes. EditableText floats it above the contentEditable
// box it belongs to; the event description's block editor sits it above the
// whole description. Before, the markup lived inside EditableText, so the
// description's editor could only have had a second copy — and a second copy of
// a control that writes the same stored map is a control that drifts.

import { useElemStyle } from "@/components/inline/elem-style";
import type { ElemStyle } from "@/lib/page-content";

const SIZES = ["sm", "md", "lg", "xl"] as const;

interface Props {
  /** The styles-map key this bar writes: the same dotted path the text uses. */
  styleKey: string;
  /** Positioning. The floating variant is absolutely placed by its caller. */
  className?: string;
}

const StyleBar = ({ styleKey, className }: Props) => {
  const [s, setStyle] = useElemStyle(styleKey);

  return (
    <span
      contentEditable={false}
      className={`flex items-center gap-1 rounded-lg bg-foreground/95 backdrop-blur px-1.5 py-1 shadow-lg text-white text-[11px] whitespace-nowrap ${className ?? ""}`}
      // Keeps the click off the box below: focusing the bar would blur the text
      // being styled, and a selection-based control needs that selection.
      onMouseDown={(e) => e.preventDefault()}
    >
      <select
        value={s?.font ?? ""}
        onChange={(e) => setStyle({ font: (e.target.value || undefined) as ElemStyle["font"] })}
        className="bg-white/10 rounded px-1 py-0.5 text-white outline-none"
        title="Font"
      >
        <option value="">Font</option>
        <option value="display">Display</option>
        <option value="sans">Sans</option>
        <option value="mono">Mono</option>
      </select>
      {SIZES.map((z) => (
        <button
          key={z}
          type="button"
          onClick={() => setStyle({ size: s?.size === z ? undefined : z })}
          className={`px-1 rounded uppercase ${s?.size === z ? "bg-white/25" : "hover:bg-white/15"}`}
        >
          {z}
        </button>
      ))}
      <span className="w-px h-4 bg-white/25 mx-0.5" />
      <button type="button" onClick={() => setStyle({ bold: !s?.bold })} className={`px-1.5 rounded font-bold ${s?.bold ? "bg-white/25" : "hover:bg-white/15"}`}>B</button>
      <button type="button" onClick={() => setStyle({ italic: !s?.italic })} className={`px-1.5 rounded italic ${s?.italic ? "bg-white/25" : "hover:bg-white/15"}`}>I</button>
      <span className="w-px h-4 bg-white/25 mx-0.5" />
      <input
        type="color"
        value={/^#/.test(s?.color ?? "") ? s!.color! : "#0057b7"}
        onChange={(e) => setStyle({ color: e.target.value })}
        className="w-5 h-5 rounded bg-transparent cursor-pointer"
        title="Text color"
      />
      {s?.color && <button type="button" onClick={() => setStyle({ color: undefined })} className="px-1 rounded hover:bg-white/15" title="Reset color">✕</button>}
    </span>
  );
};

export default StyleBar;
