// The read-only render of an event description, shared by the detail page and
// the events list.
//
// The typography case is the one worth guarding. It used to be applied by
// EditableText, which only exists in EDIT mode — so an editor set the
// description bold, saw it bold while editing, published, and a visitor got
// plain text. Nothing errored; the styling simply never left the editor.

import { describe, it, expect, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import EventDescription from "@/components/EventDescription";
import { PageStylesContext } from "@/components/inline/elem-style";
import type { ElemStyle } from "@/lib/page-content";

afterEach(cleanup);

const withStyles = (styles: Record<string, ElemStyle>, node: React.ReactNode) =>
  render(<PageStylesContext.Provider value={styles}>{node}</PageStylesContext.Provider>);

describe("rendering the description", () => {
  it("keeps prose in one pre-line paragraph and turns typed bullets into a list", () => {
    const { container } = render(<EventDescription text={"Come by for:\n- savings\n- charging"} />);
    expect([...container.querySelectorAll("p.whitespace-pre-line")].map((p) => p.textContent)).toEqual(["Come by for:"]);
    expect([...container.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["savings", "charging"]);
  });

  it("adds no wrapper when there is no styling to put on one", () => {
    const { container } = render(<EventDescription text="Plain." styleKey="fields.description" />);
    expect(container.firstElementChild?.tagName).toBe("P");
  });
});

describe("typography an editor applied", () => {
  it("reaches the visitor, not just the edit view", () => {
    const { container } = withStyles(
      { "fields.description": { bold: true, italic: true, size: "lg", color: "#ff0000", font: "display" } },
      <EventDescription text="Styled." styleKey="fields.description" />,
    );
    const wrap = container.firstElementChild as HTMLElement;
    expect(wrap.tagName).toBe("DIV");
    expect(wrap.className).toContain("!font-display");
    expect(wrap.style.fontWeight).toBe("700");
    expect(wrap.style.fontStyle).toBe("italic");
    expect(wrap.style.fontSize).toBe("1.3em");
    expect(wrap.style.color).toBe("rgb(255, 0, 0)");
  });

  it("ignores styling meant for a different piece of text", () => {
    const { container } = withStyles(
      { "fields.title": { bold: true } },
      <EventDescription text="Plain." styleKey="fields.description" />,
    );
    expect(container.firstElementChild?.tagName).toBe("P");
  });

  it("takes none at all without a styleKey, so an events card stays a card", () => {
    const { container } = withStyles(
      { "fields.description": { bold: true } },
      <EventDescription text="Plain." />,
    );
    expect(container.firstElementChild?.tagName).toBe("P");
  });
});
