// Editing an event description as blocks.
//
// The bug this component exists for: the description was one contentEditable
// span, and EditableText blurs a span on Enter. An editor could not start a new
// line, so could not type a bullet, and the blur handler's whitespace rule
// deleted the blank line between paragraphs every time the box lost focus. Both
// symptoms are asserted here, because both are silent — nothing errors, the
// text is just quietly shorter than what was typed.
//
// DescriptionEditor takes value/onChange and reads no InlineEditContext, so
// these tests need no editor session around them.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import DescriptionEditor from "@/components/inline/DescriptionEditor";
import { InlineEditContext, type InlineEditContextValue } from "@/components/inline/edit-context";
import { PageStylesContext } from "@/components/inline/elem-style";
import type { ElemStyle } from "@/lib/page-content";

afterEach(cleanup);

const prose = () => screen.getByPlaceholderText("Write a paragraph…") as HTMLTextAreaElement;
const bullets = () => screen.getAllByPlaceholderText("Bullet text") as HTMLInputElement[];

describe("typing prose", () => {
  it("puts the stored text in a real textarea, where Enter is just a newline", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value="One line." onChange={onChange} />);
    const box = prose();
    expect(box.value).toBe("One line.");
    fireEvent.change(box, { target: { value: "One line.\nA second line." } });
    fireEvent.blur(box);
    expect(onChange).toHaveBeenCalledWith("One line.\nA second line.");
  });

  it("keeps the blank line between paragraphs, and commits nothing when nothing was typed", () => {
    // The old blur rule (/\s+\n/) collapsed "\n\n" to "\n" and then committed
    // the shorter string, so merely clicking into the description and out again
    // merged every paragraph.
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Para one.\n\nPara two."} onChange={onChange} />);
    const box = prose();
    expect(box.value).toBe("Para one.\n\nPara two.");
    fireEvent.blur(box);
    expect(onChange).not.toHaveBeenCalled();
  });
});

describe("making bullets", () => {
  it("turns the selected line into a bullet, without waiting for a blur", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Come by for:\nEV incentives"} onChange={onChange} />);
    const box = prose();
    const at = box.value.indexOf("EV incentives");
    box.setSelectionRange(at, at + "EV incentives".length);
    fireEvent.click(screen.getByTitle("Bulleted list"));
    expect(onChange).toHaveBeenCalledWith("Come by for:\n- EV incentives");
  });

  it("bullets every line the selection touches", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Savings\nCharging\nTest drives"} onChange={onChange} />);
    const box = prose();
    box.setSelectionRange(0, box.value.length);
    fireEvent.click(screen.getByTitle("Bulleted list"));
    expect(onChange).toHaveBeenCalledWith("- Savings\n- Charging\n- Test drives");
  });

  it("shows a stored list as one row per item", () => {
    render(<DescriptionEditor value={"- one\n- two"} onChange={() => {}} />);
    expect(bullets().map((i) => i.value)).toEqual(["one", "two"]);
    // A list is the only block, so there is no prose box to type into.
    expect(screen.queryByPlaceholderText("Write a paragraph…")).toBeNull();
  });

  it("commits an edited bullet on blur", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Come by for:\n- one\n- two"} onChange={onChange} />);
    const [first] = bullets();
    fireEvent.change(first, { target: { value: "EV incentives and savings" } });
    fireEvent.blur(first);
    expect(onChange).toHaveBeenCalledWith("Come by for:\n- EV incentives and savings\n- two");
  });

  it("does not eat a trailing space while a bullet is being typed", () => {
    // descriptionBlocks trims a bullet's text. A controlled input would round
    // every keystroke through that trim, so the space between two words would
    // disappear before the second one was typed.
    render(<DescriptionEditor value={"- EV"} onChange={() => {}} />);
    const [first] = bullets();
    fireEvent.change(first, { target: { value: "EV " } });
    expect(first.value).toBe("EV ");
  });

  it("Enter in a bullet opens the next one and puts the cursor in it", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionEditor value={"- one"} onChange={onChange} />);
    const [first] = bullets();
    fireEvent.change(first, { target: { value: "one" } });
    fireEvent.keyDown(first, { key: "Enter" });
    expect(onChange).toHaveBeenCalledWith("- one\n- ");
    rerender(<DescriptionEditor value={"- one\n- "} onChange={onChange} />);
    expect(document.activeElement).toBe(bullets()[1]);
  });

  it("Add bullet appends an empty row to type into", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value="- one" onChange={onChange} />);
    fireEvent.click(screen.getByText("Add bullet"));
    expect(onChange).toHaveBeenCalledWith("- one\n- ");
  });

  it("keeps one list together when the selection spans a paragraph break", () => {
    // togglePrefix leaves a blank line blank, and a blank line between two
    // bullets re-parses as an empty paragraph — so one click used to produce two
    // one-item lists with a stray box between them.
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionEditor value={"Intro line.\n\nSecond para line."} onChange={onChange} />);
    const box = prose();
    box.setSelectionRange(0, box.value.length);
    fireEvent.click(screen.getByTitle("Bulleted list"));
    expect(onChange).toHaveBeenCalledWith("- Intro line.\n- Second para line.");
    rerender(<DescriptionEditor value={"- Intro line.\n- Second para line."} onChange={onChange} />);
    expect(bullets().map((i) => i.value)).toEqual(["Intro line.", "Second para line."]);
    expect(screen.queryByPlaceholderText("Write a paragraph…")).toBeNull();
  });

  it("leaves the blank line around a list alone", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Intro line.\n\nSavings\nCharging"} onChange={onChange} />);
    const box = prose();
    const at = box.value.indexOf("Savings");
    box.setSelectionRange(at, box.value.length);
    fireEvent.click(screen.getByTitle("Bulleted list"));
    expect(onChange).toHaveBeenCalledWith("Intro line.\n\n- Savings\n- Charging");
  });

  it("puts the cursor in the list it just made", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionEditor value={"Savings\nCharging\nTest drives"} onChange={onChange} />);
    const box = prose();
    box.setSelectionRange(0, box.value.length);
    fireEvent.click(screen.getByTitle("Bulleted list"));
    rerender(<DescriptionEditor value={"- Savings\n- Charging\n- Test drives"} onChange={onChange} />);
    expect(document.activeElement).toBe(bullets()[0]);
  });

  it("Add bullet list starts one under existing prose", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value="Come by for:" onChange={onChange} />);
    fireEvent.click(screen.getByText("Add bullet list"));
    expect(onChange).toHaveBeenCalledWith("Come by for:\n- ");
  });
});

// A click blurs the focused box before the click handler runs, and React
// flushes that commit first — so a handler reading the blocks its own render
// drew would undo the typing that just landed. These are the cases that caught
// it: type in one box, act on another, expect to keep both.
describe("typing in one box while acting on another", () => {
  it("keeps a bullet just typed when Add bullet is pressed", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionEditor value="- one" onChange={onChange} />);
    const [first] = bullets();
    fireEvent.change(first, { target: { value: "one two three" } });
    fireEvent.blur(first);
    expect(onChange).toHaveBeenLastCalledWith("- one two three");
    rerender(<DescriptionEditor value="- one two three" onChange={onChange} />);
    fireEvent.click(screen.getByText("Add bullet"));
    expect(onChange).toHaveBeenLastCalledWith("- one two three\n- ");
  });

  it("keeps a paragraph just typed when a list below it is removed", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionEditor value={"First para.\n- x"} onChange={onChange} />);
    const box = prose();
    fireEvent.change(box, { target: { value: "First para, edited." } });
    fireEvent.blur(box);
    expect(onChange).toHaveBeenLastCalledWith("First para, edited.\n- x");
    rerender(<DescriptionEditor value={"First para, edited.\n- x"} onChange={onChange} />);
    fireEvent.click(screen.getByText("Remove list"));
    expect(onChange).toHaveBeenLastCalledWith("First para, edited.");
  });

  it("leaves an untouched bullet's unsaved text alone when a sibling commits", () => {
    // Rows are keyed by position, not by their text, so committing one does not
    // remount the others and throw away what is half-typed in them.
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionEditor value={"- one\n- two"} onChange={onChange} />);
    const [first, second] = bullets();
    fireEvent.change(second, { target: { value: "two and a half" } });
    fireEvent.change(first, { target: { value: "one edited" } });
    fireEvent.blur(first);
    rerender(<DescriptionEditor value={"- one edited\n- two"} onChange={onChange} />);
    expect(bullets()[1].value).toBe("two and a half");
  });

  it("shows a value that arrived from outside, such as an Undo", () => {
    const { rerender } = render(<DescriptionEditor value="Before." onChange={() => {}} />);
    rerender(<DescriptionEditor value="After an undo." onChange={() => {}} />);
    expect(prose().value).toBe("After an undo.");
  });
});

describe("removing things", () => {
  it("drops the whole list with its last bullet, rather than leaving a blank line", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Intro.\n- only one"} onChange={onChange} />);
    fireEvent.click(screen.getByTitle("Remove bullet"));
    expect(onChange).toHaveBeenCalledWith("Intro.");
  });

  it("Remove list drops a list with several items in it", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Intro.\n- one\n- two"} onChange={onChange} />);
    fireEvent.click(screen.getByText("Remove list"));
    expect(onChange).toHaveBeenCalledWith("Intro.");
  });

  it("Remove paragraph drops the prose and keeps the list", () => {
    const onChange = vi.fn();
    render(<DescriptionEditor value={"Intro.\n- one"} onChange={onChange} />);
    fireEvent.click(screen.getByTitle("Remove paragraph"));
    expect(onChange).toHaveBeenCalledWith("- one");
  });
});

describe("adding a paragraph", () => {
  it("is offered after a list, and gives a genuinely separate box", () => {
    const onChange = vi.fn();
    const { rerender } = render(<DescriptionEditor value="- one" onChange={onChange} />);
    fireEvent.click(screen.getByText("Add paragraph"));
    expect(onChange).toHaveBeenCalledWith("- one\n");
    rerender(<DescriptionEditor value={"- one\n"} onChange={onChange} />);
    expect(prose().value).toBe("");
  });

  it("is not offered when the text already ends in prose", () => {
    // Two adjacent paragraphs and one paragraph with a blank line at the end
    // are the same string, so the button could only add a blank line to the box
    // already on screen. Better absent than apparently broken.
    render(<DescriptionEditor value="Ends in prose." onChange={() => {}} />);
    expect(screen.queryByText("Add paragraph")).toBeNull();
  });
});

// The description's typography used to come from EditableText, so it only ever
// existed while editing and a visitor never saw it. The bar writes the same flat
// styles map the published page reads.
describe("typography", () => {
  /** Enough of the edit context for the style bar: it reads and writes "styles". */
  const editCtx = (get: (path: string) => unknown, set: (path: string, value: unknown) => void) =>
    ({
      editing: true, activeId: null, setActive: () => {}, set, get,
      addBlock: () => {}, updateBlock: () => {}, moveBlock: () => {}, duplicateBlock: () => {},
      moveBlockRelative: () => {}, removeBlock: () => {}, saveTemplate: () => {},
      insertTemplate: () => {}, deleteTemplate: () => {},
    }) as InlineEditContextValue;

  const renderStyled = (styles: Record<string, ElemStyle>, set: (path: string, value: unknown) => void) =>
    render(
      <InlineEditContext.Provider value={editCtx((path) => (path === "styles" ? styles : undefined), set)}>
        <PageStylesContext.Provider value={styles}>
          <DescriptionEditor value={"Prose.\n- bullet"} onChange={() => {}} styleKey="fields.description" />
        </PageStylesContext.Provider>
      </InlineEditContext.Provider>,
    );

  it("writes the whole flat styles map, keyed by the text's own path", () => {
    const set = vi.fn();
    renderStyled({}, set);
    fireEvent.click(screen.getByText("B"));
    expect(set).toHaveBeenCalledWith("styles", { "fields.description": { bold: true } });
  });

  it("leaves another element's styling alone", () => {
    const set = vi.fn();
    renderStyled({ "fields.title": { italic: true } }, set);
    fireEvent.click(screen.getByText("B"));
    expect(set).toHaveBeenCalledWith("styles", {
      "fields.title": { italic: true },
      "fields.description": { bold: true },
    });
  });

  it("puts the styling on the boxes, so the editor types in what a visitor gets", () => {
    renderStyled({ "fields.description": { bold: true, size: "lg", font: "mono" } }, () => {});
    for (const box of [prose(), bullets()[0]]) {
      expect(box.style.fontWeight).toBe("700");
      expect(box.style.fontSize).toBe("1.3em");
      expect(box.className).toContain("!font-mono");
    }
  });

  it("re-fits the paragraph box when the size changes, not only when the text does", () => {
    // The height is set imperatively, so React's style diffing does not touch it
    // when a bigger font needs more room. jsdom has no layout, so the box's own
    // scrollHeight has to be faked to see this at all.
    const scrollHeight = vi.spyOn(HTMLTextAreaElement.prototype, "scrollHeight", "get").mockReturnValue(120);
    const { rerender } = render(
      <PageStylesContext.Provider value={{}}>
        <DescriptionEditor value="A long paragraph." onChange={() => {}} styleKey="fields.description" />
      </PageStylesContext.Provider>,
    );
    expect(prose().style.height).toBe("120px");

    scrollHeight.mockReturnValue(280);
    rerender(
      <PageStylesContext.Provider value={{ "fields.description": { size: "xl" } }}>
        <DescriptionEditor value="A long paragraph." onChange={() => {}} styleKey="fields.description" />
      </PageStylesContext.Provider>,
    );
    expect(prose().style.fontSize).toBe("1.6em");
    expect(prose().style.height).toBe("280px");
    scrollHeight.mockRestore();
  });

  it("shows no bar at all without a styleKey", () => {
    render(<DescriptionEditor value="Prose." onChange={() => {}} />);
    expect(screen.queryByText("B")).toBeNull();
  });
});
