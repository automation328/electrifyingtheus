// The event description, edited as the same blocks the reader gets: prose sits
// in a textarea, a run of bullets becomes one row per item with a • beside it.
// What is stored is still the single plain-text column — descriptionBlocks
// parses it on the way in, blocksToText writes it back on the way out (see
// @/lib/event-description), so a description nobody edits is untouched and one
// that is edited comes back in exactly the format the page already reads.
//
// It exists because the description could not be edited as prose at all. It
// used to be one EditableText, whose contentEditable span BLURS on Enter
// (EditableText.tsx) — so there was no way to start a new line, and therefore
// no way to type the bullet an editor wanted. Reaching for the block palette
// instead put the list below the "Save your spot" band, because the only
// insertion slots on the page bracket it.
//
// ── Two rules hold this together ────────────────────────────────────────────
//
// 1. Every box is UNCONTROLLED: it takes a defaultValue and commits on blur,
//    rather than being re-rendered from `value` on each keystroke. Two reasons,
//    both load-bearing. descriptionBlocks TRIMS a bullet's text, so a controlled
//    input would round every keystroke through that trim and the space you type
//    between two words would vanish before you typed the second one. And
//    InlinePageEditor's history has no debounce — every ctx.set is its own undo
//    step — so committing per keystroke would cost one Ctrl+Z per letter.
//
//    The price is that a box only shows a value it was not typed into if
//    something pushes it in: useExternalValue does that, and deliberately skips
//    the box the cursor is in, so an Undo lands everywhere except under the
//    editor's hands.
//
// 2. Every handler reads the CURRENT blocks from a ref, never from the render
//    that drew the button. Clicking a control blurs whatever box had focus
//    first, and React flushes that commit before the click handler runs — so
//    the blocks the button was drawn from are one edit out of date by the time
//    it fires. Reading the ref is what lets an editor type in one box and click
//    a control in another without one edit swallowing the other.

import { useEffect, useRef } from "react";
import { List, Plus, Trash2 } from "lucide-react";
import { togglePrefix } from "@/lib/markdown-edit";
import { descriptionBlocks, blocksToText, isBulletLine, bulletText, type DescBlock } from "@/lib/event-description";
import StyleBar from "@/components/inline/StyleBar";
import { styleClass, styleCss, usePageStyle } from "@/components/inline/elem-style";

type Box = HTMLInputElement | HTMLTextAreaElement;

/** Grow a box to fit its text, so a long paragraph is never hidden in a scroller. */
const autosize = (el: HTMLTextAreaElement | null) => {
  if (!el) return;
  el.style.height = "auto";
  // jsdom has no layout and reports scrollHeight 0, so the floor is what keeps
  // the box a usable size there — and on a genuinely empty paragraph too.
  el.style.height = `${Math.max(el.scrollHeight, 96)}px`;
};

/**
 * Close the blank lines sitting inside a run of bullets.
 *
 * togglePrefix leaves a blank line blank, which is right for a heading and
 * wrong here: on the way back out a blank line between two bullets re-parses as
 * an empty paragraph, so one list the editor made with a single click comes
 * back as two lists with a stray empty box between them. Only gaps with a
 * bullet on BOTH sides are closed — a blank line before or after the list is
 * the editor's own paragraph break and stays.
 */
const closeGapsInLists = (text: string): string => {
  const lines = text.split("\n");
  const out: string[] = [];
  for (let i = 0; i < lines.length; i++) {
    if (lines[i].trim() !== "") { out.push(lines[i]); continue; }
    let end = i;
    while (end < lines.length && lines[end].trim() === "") end++;
    if (!(isBulletLine(out[out.length - 1] ?? "") && isBulletLine(lines[end] ?? ""))) {
      out.push(...lines.slice(i, end));
    }
    i = end - 1;
  }
  return out.join("\n");
};

/** Show a value the editor did not type — an Undo landing, or a block moving up
 *  when the one above it is removed. Skips the focused box: overwriting what
 *  somebody is mid-sentence in is worse than showing it a beat late. */
const useExternalValue = (ref: React.RefObject<Box | null>, value: string, after?: (el: Box) => void) => {
  useEffect(() => {
    const el = ref.current;
    if (!el || el === document.activeElement || el.value === value) return;
    el.value = value;
    after?.(el);
  }, [ref, value, after]);
};

interface Props {
  /** The raw stored description. */
  value: string;
  /** Called with the whole new description whenever a block changes. */
  onChange: (text: string) => void;
  /** Where this text's typography is stored. The boxes wear it while you type,
   *  so the editor is looking at what a visitor will get. */
  styleKey?: string;
}

const DescriptionEditor = ({ value, onChange, styleKey }: Props) => {
  const blocks = descriptionBlocks(value);
  const s = usePageStyle(styleKey ?? "");
  const boxClass = styleClass(s);
  const boxCss = styleCss(s);
  const latest = useRef({ value, blocks });
  latest.current = { value, blocks };

  // A paragraph whose every line becomes a bullet UNMOUNTS — the block changes
  // kind, so a whole different component draws it — and the cursor would be
  // left on nothing. Remember the first item the click made and put the cursor
  // in its row once React has drawn it.
  const root = useRef<HTMLDivElement>(null);
  const landOn = useRef<string | null>(null);
  useEffect(() => {
    const want = landOn.current;
    if (want === null) return;
    landOn.current = null;
    const rows = [...(root.current?.querySelectorAll("input") ?? [])];
    (rows.find((n) => n.value === want) ?? rows[0])?.focus();
  });

  const commit = (make: (blocks: DescBlock[]) => DescBlock[]) => {
    // A list with no items serialises to nothing but still occupies a line, so
    // an emptied list would leave a blank gap behind it. Drop it instead —
    // which is also what "Remove list" does, by the same route.
    const next = make(latest.current.blocks).filter((b) => b.kind !== "ul" || b.items.length > 0);
    const text = blocksToText(next);
    if (text !== latest.current.value) onChange(text);
  };
  const mapBlock = (i: number, f: (b: DescBlock) => DescBlock) =>
    commit((bs) => bs.map((b, j) => (j === i ? f(b) : b)));
  const dropBlock = (i: number) => commit((bs) => bs.filter((_, j) => j !== i));

  // Only offered when the text does not already end in prose. Two adjacent
  // paragraphs and one paragraph with a blank line at the end are the same
  // string, so "add a paragraph" after prose could only ever add a blank line
  // to the box that is already there — a button that appears to do nothing.
  const endsInProse = blocks.length > 0 && blocks[blocks.length - 1].kind === "p";

  return (
    <div ref={root} className="space-y-3">
      {styleKey && (
        <div className="flex">
          <StyleBar styleKey={styleKey} />
        </div>
      )}
      {blocks.map((b, i) =>
        b.kind === "ul" ? (
          <BulletBlock
            key={i}
            items={b.items}
            onItems={(f) => mapBlock(i, (block) => (block.kind === "ul" ? { kind: "ul", items: f(block.items) } : block))}
            onRemove={() => dropBlock(i)}
            boxClass={boxClass}
            boxCss={boxCss}
          />
        ) : (
          <ParagraphBlock
            key={i}
            text={b.lines.join("\n")}
            onText={(text, focus) => {
              if (focus !== undefined) landOn.current = focus;
              mapBlock(i, () => ({ kind: "p", lines: text.split("\n") }));
            }}
            onRemove={() => dropBlock(i)}
            boxClass={boxClass}
            boxCss={boxCss}
          />
        ),
      )}

      <div className="flex flex-wrap items-center gap-4 pt-1 text-sm">
        <button
          type="button"
          onClick={() => commit((bs) => [...bs, { kind: "ul", items: [""] }])}
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <Plus className="w-4 h-4" /> Add bullet list
        </button>
        {!endsInProse && (
          <button
            type="button"
            onClick={() => commit((bs) => [...bs, { kind: "p", lines: [""] }])}
            className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
          >
            <Plus className="w-4 h-4" /> Add paragraph
          </button>
        )}
      </div>

      <p className="text-[11px] text-muted-foreground">
        Press Enter for a new line. To make bullets, select the lines and press <strong>Bulleted list</strong> —
        or start a line with “- ”.
      </p>
    </div>
  );
};

/** One run of prose. Enter here is an ordinary newline, which is the whole point. */
const ParagraphBlock = ({ text, onText, onRemove, boxClass, boxCss }: {
  text: string;
  /** `focus` names the bullet the cursor should land in, when one was made. */
  onText: (text: string, focus?: string) => void;
  onRemove: () => void;
  boxClass: string;
  boxCss: React.CSSProperties;
}) => {
  const ref = useRef<HTMLTextAreaElement>(null);
  // Re-fit on mount and whenever the TYPOGRAPHY changes, not only when the text
  // does: the height is set imperatively, so React's style diffing leaves it
  // alone when a bigger font suddenly needs more room, and the last lines of the
  // paragraph end up clipped inside the box.
  useEffect(() => { autosize(ref.current); }, [boxClass, boxCss.fontSize, boxCss.fontWeight, boxCss.fontStyle]);
  useExternalValue(ref, text, autosizeBox);

  // The selected lines become bullets. togglePrefix is the same transform the
  // article-body toolbar uses, so the two toolbars cannot drift apart. Reading
  // el.value rather than `text` matters: the box has not been blurred yet, so
  // its live value is the only place the editor's latest typing exists.
  const bulletize = () => {
    const el = ref.current;
    if (!el) return;
    const before = el.value.split("\n");
    const r = togglePrefix(el.value, el.selectionStart, el.selectionEnd, "- ");
    // togglePrefix also takes markers OFF. Only chase the cursor into a list
    // when the click actually made one.
    const made = r.text.split("\n").find((line, i) => isBulletLine(line) && !isBulletLine(before[i] ?? ""));
    onText(closeGapsInLists(r.text), made === undefined ? undefined : bulletText(made));
  };

  return (
    <div>
      <div className="mb-1 flex items-center gap-1">
        <button
          type="button"
          title="Bulleted list"
          // The one control that must NOT let the box blur first: it works on
          // the live selection, and blurring drops it.
          onMouseDown={(e) => e.preventDefault()}
          onClick={bulletize}
          className="inline-flex items-center gap-1.5 rounded-lg px-2 py-1 text-xs font-semibold text-foreground/80 hover:bg-primary/10 hover:text-primary"
        >
          <List className="h-3.5 w-3.5" strokeWidth={2.2} /> Bulleted list
        </button>
        <button
          type="button"
          title="Remove paragraph"
          onClick={onRemove}
          className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-xs text-muted-foreground hover:bg-red-50 hover:text-red-600"
        >
          <Trash2 className="h-3.5 w-3.5" />
        </button>
      </div>
      <textarea
        ref={ref}
        defaultValue={text}
        rows={Math.max(3, text.split("\n").length)}
        placeholder="Write a paragraph…"
        onInput={(e) => autosize(e.currentTarget)}
        onBlur={(e) => { if (e.currentTarget.value !== text) onText(e.currentTarget.value); }}
        style={boxCss}
        className={`w-full resize-y rounded-xl border border-border bg-background p-3 text-base leading-relaxed text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${boxClass}`}
      />
    </div>
  );
};

/** Stable identity, so useExternalValue's effect does not re-run every render. */
function autosizeBox(el: Box) {
  autosize(el as HTMLTextAreaElement);
}

/** One bulleted list. Enter starts the next bullet, the way a list should behave. */
const BulletBlock = ({ items, onItems, onRemove, boxClass, boxCss }: {
  items: string[];
  /** Applies a transform to THIS list's items, resolved against the live blocks. */
  onItems: (f: (items: string[]) => string[]) => void;
  onRemove: () => void;
  boxClass: string;
  boxCss: React.CSSProperties;
}) => {
  const list = useRef<HTMLUListElement>(null);
  // The row to put the cursor in once React has drawn it. Set by Enter, spent by
  // the effect below — the row does not exist yet when the key is pressed.
  const focusRow = useRef<number | null>(null);
  useEffect(() => {
    const j = focusRow.current;
    if (j === null) return;
    focusRow.current = null;
    list.current?.querySelectorAll("input")[j]?.focus();
  });

  return (
    <div className="rounded-xl border border-border bg-muted/30 p-3">
      <ul ref={list} className="space-y-1.5">
        {items.map((item, j) => (
          <BulletRow
            key={j}
            item={item}
            onText={(text) => onItems((its) => its.map((x, k) => (k === j ? text : x)))}
            onEnter={(text) => {
              onItems((its) => {
                const next = its.map((x, k) => (k === j ? text : x));
                next.splice(j + 1, 0, "");
                return next;
              });
              focusRow.current = j + 1;
            }}
            onRemove={() => onItems((its) => its.filter((_, k) => k !== j))}
            boxClass={boxClass}
            boxCss={boxCss}
          />
        ))}
      </ul>
      <div className="mt-2 flex items-center gap-4 text-sm">
        <button
          type="button"
          onClick={() => onItems((its) => [...its, ""])}
          className="inline-flex items-center gap-1.5 font-medium text-primary hover:underline"
        >
          <Plus className="w-4 h-4" /> Add bullet
        </button>
        <button
          type="button"
          onClick={onRemove}
          className="inline-flex items-center gap-1.5 text-muted-foreground hover:text-red-600 hover:underline"
        >
          <Trash2 className="w-3.5 h-3.5" /> Remove list
        </button>
      </div>
    </div>
  );
};

const BulletRow = ({ item, onText, onEnter, onRemove, boxClass, boxCss }: {
  item: string;
  onText: (text: string) => void;
  onEnter: (text: string) => void;
  onRemove: () => void;
  boxClass: string;
  boxCss: React.CSSProperties;
}) => {
  const ref = useRef<HTMLInputElement>(null);
  useExternalValue(ref, item);

  return (
    <li className="flex items-center gap-2">
      <span className="text-muted-foreground" aria-hidden="true">•</span>
      <input
        ref={ref}
        defaultValue={item}
        placeholder="Bullet text"
        onBlur={(e) => { if (e.currentTarget.value !== item) onText(e.currentTarget.value); }}
        onKeyDown={(e) => {
          if (e.key !== "Enter") return;
          e.preventDefault();
          onEnter(e.currentTarget.value);
        }}
        style={boxCss}
        className={`flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 ${boxClass}`}
      />
      <button
        type="button"
        title="Remove bullet"
        onClick={onRemove}
        className="p-1.5 rounded-md text-muted-foreground hover:bg-red-50 hover:text-red-600"
      >
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </li>
  );
};

export default DescriptionEditor;
