// Inline-editable text. Renders its children plainly unless the page is in edit
// mode, in which case it becomes a contentEditable element with a subtle outline
// that commits to the working override on blur. Commit-on-blur (not on input)
// keeps the caret stable — no re-render happens mid-typing.

import { useInlineEdit } from "@/components/inline/edit-context";

interface EditableProps {
  /** Dotted path into the PageOverride (e.g. "title", "sections.0.body.1"). */
  path: string;
  children: string;
  className?: string;
  /** Element tag to render when editing (default span). */
  as?: "span" | "div";
}

const Editable = ({ path, children, className, as = "span" }: EditableProps) => {
  const ctx = useInlineEdit();
  if (!ctx?.editing) {
    // Not editing → render the text exactly as before (no wrapper side effects).
    return <>{children}</>;
  }
  const Tag = as;
  return (
    <Tag
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-inline-edit
      className={className}
      onKeyDown={(e) => { if (e.key === "Enter" && as === "span") { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
      onBlur={(e) => {
        const text = (e.currentTarget.textContent ?? "").replace(/\s+\n/g, "\n").trim();
        if (text !== children) ctx.set(path, text);
      }}
    >
      {children}
    </Tag>
  );
};

export default Editable;
