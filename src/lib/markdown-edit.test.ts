// The selection maths behind the rich-text toolbar.
//
// The toolbar has to feel like a word processor while the STORED text stays
// markdown — so every button is a text transform on the current selection.
// Getting the returned caret wrong is what makes an editor feel broken, so the
// caret is asserted as carefully as the text.

import { describe, it, expect } from "vitest";
import { toggleWrap, togglePrefix, toggleNumbered, insertSnippet } from "@/lib/markdown-edit";

describe("bold and italic", () => {
  it("wraps the selected words", () => {
    const r = toggleWrap("make this bold", 10, 14, "**");
    expect(r.text).toBe("make this **bold**");
    // The selection still covers the same words, now inside the markers.
    expect(r.text.slice(r.selectionStart, r.selectionEnd)).toBe("bold");
  });

  it("unwraps when the selection is already bold", () => {
    const r = toggleWrap("make this **bold**", 12, 16, "**");
    expect(r.text).toBe("make this bold");
    expect(r.text.slice(r.selectionStart, r.selectionEnd)).toBe("bold");
  });

  it("puts the caret between the markers when nothing is selected", () => {
    const r = toggleWrap("ab", 1, 1, "**");
    expect(r.text).toBe("a****b");
    expect(r.selectionStart).toBe(3);
    expect(r.selectionEnd).toBe(3);
  });

  it("handles italic with a single marker", () => {
    const r = toggleWrap("aside", 0, 5, "*");
    expect(r.text).toBe("*aside*");
  });
});

describe("headings and quotes", () => {
  it("prefixes the selected line", () => {
    const r = togglePrefix("A title", 0, 0, "## ");
    expect(r.text).toBe("## A title");
  });

  it("prefixes every line in a multi-line selection", () => {
    const r = togglePrefix("one\ntwo", 0, 7, "- ");
    expect(r.text).toBe("- one\n- two");
  });

  it("removes the prefix when it is already there", () => {
    const r = togglePrefix("## A title", 0, 0, "## ");
    expect(r.text).toBe("A title");
  });

  it("swaps one heading level for another instead of stacking them", () => {
    const r = togglePrefix("### Small", 0, 0, "## ");
    expect(r.text).toBe("## Small");
  });

  it("leaves blank lines alone", () => {
    const r = togglePrefix("one\n\ntwo", 0, 8, "- ");
    expect(r.text).toBe("- one\n\n- two");
  });

  it("keeps the whole edited range selected", () => {
    const r = togglePrefix("one\ntwo", 0, 7, "- ");
    expect(r.text.slice(r.selectionStart, r.selectionEnd)).toBe("- one\n- two");
  });
});

describe("numbered lists", () => {
  it("numbers the selected lines in order", () => {
    const r = toggleNumbered("one\ntwo\nthree", 0, 13);
    expect(r.text).toBe("1. one\n2. two\n3. three");
  });

  it("removes the numbers when they are already there", () => {
    const r = toggleNumbered("1. one\n2. two", 0, 13);
    expect(r.text).toBe("one\ntwo");
  });
});

describe("inserting a snippet", () => {
  it("replaces the selection", () => {
    const r = insertSnippet("see here", 4, 8, "[here](https://example.com)");
    expect(r.text).toBe("see [here](https://example.com)");
  });

  it("places the caret where the snippet asks", () => {
    // Offset 1 = just inside the opening bracket, ready to type the label.
    const r = insertSnippet("go", 2, 2, "[](url)", 1);
    expect(r.selectionStart).toBe(3);
  });

  it("puts the caret after the snippet when no offset is given", () => {
    const r = insertSnippet("", 0, 0, "---\n");
    expect(r.text).toBe("---\n");
    expect(r.selectionStart).toBe(4);
  });
});

describe("a link built from the selection", () => {
  it("uses the selected words as the label", () => {
    const sel = "our calculator";
    const r = insertSnippet(`see ${sel}`, 4, 4 + sel.length, `[${sel}](url)`, sel.length + 3);
    expect(r.text).toBe("see [our calculator](url)");
    // Caret lands on "url" so it can be typed over.
    expect(r.selectionStart).toBe(21);
  });
});
