// Text transforms for a markdown toolbar.
//
// The point is that an editor never types syntax — they press Bold, or Heading,
// and this turns the current selection into markdown. Markdown stays what we
// STORE, so nothing is lost converting between formats: there is no conversion.
//
// Every function is pure and returns the new caret, because a toolbar that
// leaves the caret in the wrong place feels broken even when the text is right.

export interface EditResult {
  text: string;
  selectionStart: number;
  selectionEnd: number;
}

/** Any markdown heading prefix, so one level replaces another rather than stacking. */
const HEADING = /^(#{1,6} )/;
/** An ordered-list marker: "1. ", "12. ". */
const NUMBERED = /^(\d+\. )/;

/**
 * Wrap the selection in `marker` — or unwrap it if it is already wrapped.
 * With nothing selected, inserts the pair and puts the caret between them.
 */
export function toggleWrap(text: string, start: number, end: number, marker: string): EditResult {
  const m = marker.length;
  const before = text.slice(0, start);
  const selected = text.slice(start, end);
  const after = text.slice(end);

  // Already wrapped, markers just outside the selection → remove them.
  if (before.endsWith(marker) && after.startsWith(marker)) {
    return {
      text: before.slice(0, -m) + selected + after.slice(m),
      selectionStart: start - m,
      selectionEnd: end - m,
    };
  }
  // Already wrapped, markers inside the selection → remove them.
  if (selected.length >= m * 2 && selected.startsWith(marker) && selected.endsWith(marker)) {
    const inner = selected.slice(m, -m);
    return { text: before + inner + after, selectionStart: start, selectionEnd: start + inner.length };
  }
  return {
    text: `${before}${marker}${selected}${marker}${after}`,
    selectionStart: start + m,
    selectionEnd: end + m,
  };
}

/** The lines the selection touches, as [lineStart, lineEnd] offsets in `text`. */
function selectedLineRange(text: string, start: number, end: number): [number, number] {
  const from = text.lastIndexOf("\n", start - 1) + 1;
  const nl = text.indexOf("\n", end);
  return [from, nl === -1 ? text.length : nl];
}

/**
 * Put `prefix` at the start of each selected line — heading, bullet, quote.
 * Removes it if every non-blank line already has it. A heading prefix replaces
 * any other heading level instead of stacking hashes.
 */
export function togglePrefix(text: string, start: number, end: number, prefix: string): EditResult {
  const [from, to] = selectedLineRange(text, start, end);
  const lines = text.slice(from, to).split("\n");
  const isHeading = HEADING.test(prefix);
  const meaningful = lines.filter((l) => l.trim() !== "");
  const allPrefixed = meaningful.length > 0 && meaningful.every((l) => l.startsWith(prefix));

  const next = lines.map((line) => {
    if (line.trim() === "") return line;                       // blank lines stay blank
    if (allPrefixed) return line.slice(prefix.length);
    const bare = isHeading ? line.replace(HEADING, "") : line;
    return bare.startsWith(prefix) ? bare : prefix + bare;
  });

  const block = next.join("\n");
  return {
    text: text.slice(0, from) + block + text.slice(to),
    selectionStart: from,
    selectionEnd: from + block.length,
  };
}

/** Number the selected lines 1., 2., 3. — or strip the numbers if present. */
export function toggleNumbered(text: string, start: number, end: number): EditResult {
  const [from, to] = selectedLineRange(text, start, end);
  const lines = text.slice(from, to).split("\n");
  const meaningful = lines.filter((l) => l.trim() !== "");
  const allNumbered = meaningful.length > 0 && meaningful.every((l) => NUMBERED.test(l));

  let n = 0;
  const next = lines.map((line) => {
    if (line.trim() === "") return line;
    if (allNumbered) return line.replace(NUMBERED, "");
    n += 1;
    return `${n}. ${line.replace(NUMBERED, "")}`;
  });

  const block = next.join("\n");
  return {
    text: text.slice(0, from) + block + text.slice(to),
    selectionStart: from,
    selectionEnd: from + block.length,
  };
}

/**
 * Replace the selection with `snippet`. `caretOffset` positions the caret inside
 * it (e.g. on the "url" of a link so it can be typed over); without one the
 * caret lands after the snippet.
 */
export function insertSnippet(text: string, start: number, end: number, snippet: string, caretOffset?: number): EditResult {
  const at = start + (caretOffset ?? snippet.length);
  return {
    text: text.slice(0, start) + snippet + text.slice(end),
    selectionStart: at,
    selectionEnd: at,
  };
}
