// The toolbar, driven the way a person drives it.
//
// markdown-edit.test.ts proves the text maths. This proves the buttons are
// actually wired to it and read the live selection — the gap where "logic is
// correct but the screen does nothing" hides.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import MarkdownEditor from "@/components/inline/MarkdownEditor";

afterEach(cleanup);

/** Render, then select `select` inside the textarea so a button has something to act on. */
const setup = (value: string, select?: string) => {
  const onChange = vi.fn();
  const view = render(<MarkdownEditor value={value} onChange={onChange} />);
  const area = view.container.querySelector("textarea") as HTMLTextAreaElement;
  if (select) {
    const at = value.indexOf(select);
    area.setSelectionRange(at, at + select.length);
  }
  return { onChange, area };
};

describe("the formatting buttons", () => {
  it("bolds the selected words", () => {
    const { onChange } = setup("make this bold", "bold");
    fireEvent.click(screen.getByTitle(/^Bold/));
    expect(onChange).toHaveBeenCalledWith("make this **bold**");
  });

  it("italicises the selected words", () => {
    const { onChange } = setup("an aside here", "aside");
    fireEvent.click(screen.getByTitle(/^Italic/));
    expect(onChange).toHaveBeenCalledWith("an *aside* here");
  });

  it("turns a line into a heading", () => {
    const { onChange } = setup("A section title", "A");
    fireEvent.click(screen.getByTitle("Heading"));
    expect(onChange).toHaveBeenCalledWith("## A section title");
  });

  it("makes a bulleted list from several lines", () => {
    const { onChange } = setup("one\ntwo", "one\ntwo");
    fireEvent.click(screen.getByTitle("Bulleted list"));
    expect(onChange).toHaveBeenCalledWith("- one\n- two");
  });

  it("numbers a list", () => {
    const { onChange } = setup("one\ntwo", "one\ntwo");
    fireEvent.click(screen.getByTitle("Numbered list"));
    expect(onChange).toHaveBeenCalledWith("1. one\n2. two");
  });

  it("builds a link from the selected words", () => {
    const { onChange } = setup("see the calculator", "the calculator");
    fireEvent.click(screen.getByTitle(/^Link/));
    expect(onChange).toHaveBeenCalledWith("see [the calculator](url)");
  });

  it("inserts a table an editor can fill in", () => {
    const { onChange } = setup("");
    fireEvent.click(screen.getByTitle("Table"));
    const written = onChange.mock.calls[0][0] as string;
    expect(written).toContain("| Column | Column |");
    expect(written).toContain("| --- | --- |");
  });

  it("inserts a divider", () => {
    const { onChange } = setup("");
    fireEvent.click(screen.getByTitle("Divider"));
    expect(onChange).toHaveBeenCalledWith("\n---\n");
  });
});

describe("keyboard shortcuts", () => {
  it("bolds on Ctrl+B", () => {
    const { onChange, area } = setup("bold me", "bold");
    fireEvent.keyDown(area, { key: "b", ctrlKey: true });
    expect(onChange).toHaveBeenCalledWith("**bold** me");
  });

  it("italicises on Ctrl+I", () => {
    const { onChange, area } = setup("thing", "thing");
    fireEvent.keyDown(area, { key: "i", ctrlKey: true });
    expect(onChange).toHaveBeenCalledWith("*thing*");
  });

  it("ignores a plain keypress", () => {
    const { onChange, area } = setup("x", "x");
    fireEvent.keyDown(area, { key: "b" });
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("preview", () => {
  it("shows the writing box first", () => {
    const { area } = setup("## Hello");
    expect(area).toBeTruthy();
  });

  it("renders the markdown when switched to preview", () => {
    const { container } = render(<MarkdownEditor value={"## Hello there"} onChange={() => {}} />);
    fireEvent.click(screen.getByText("Preview"));
    // An actual heading element, not the raw "##" text.
    expect(container.querySelector("h2")?.textContent).toBe("Hello there");
    expect(container.querySelector("textarea")).toBeNull();
  });

  it("goes back to writing", () => {
    const { container } = render(<MarkdownEditor value={"hi"} onChange={() => {}} />);
    fireEvent.click(screen.getByText("Preview"));
    fireEvent.click(screen.getByText("Write"));
    expect(container.querySelector("textarea")).toBeTruthy();
  });

  it("says so when there is nothing written", () => {
    render(<MarkdownEditor value={"   "} onChange={() => {}} />);
    fireEvent.click(screen.getByText("Preview"));
    expect(screen.getByText(/Nothing written yet/)).toBeTruthy();
  });
});
