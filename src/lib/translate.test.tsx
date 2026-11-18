import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { guardReactAgainstTranslation, isSpanish } from "./translate";

describe("isSpanish", () => {
  it("reads Google's googtrans cookie", () => {
    expect(isSpanish("a=1; googtrans=/en/es; b=2")).toBe(true);
    expect(isSpanish("googtrans=/en/en")).toBe(false);
    expect(isSpanish("")).toBe(false);
  });
});

// Does what Google Translate does to each text node.
function googleTranslate(root: Element) {
  const walker = document.createTreeWalker(root, NodeFilter.SHOW_TEXT);
  const texts: Text[] = [];
  while (walker.nextNode()) texts.push(walker.currentNode as Text);
  for (const t of texts) {
    const font = document.createElement("font");
    font.textContent = `ES:${t.data}`;
    t.parentNode!.insertBefore(font, t);
    t.parentNode!.removeChild(t);
  }
}

describe("guardReactAgainstTranslation", () => {
  guardReactAgainstTranslation();
  const Price = ({ v, show = true }: { v: string; show?: boolean }) => (
    <p>
      Gas {v} /gal{show && <b>!</b>}
    </p>
  );

  it("shows React's new value instead of the frozen translation", () => {
    const { container, rerender } = render(<Price v="5.90" />);
    googleTranslate(container);
    expect(container.textContent).toBe("ES:Gas ES:5.90ES: /galES:!");
    rerender(<Price v="4.10" />);
    expect(container.textContent).toContain("4.10");
    expect(container.textContent).not.toContain("5.90");
  });

  it("does not crash when React removes translated text", () => {
    const { container, rerender, unmount } = render(<Price v="1" />);
    googleTranslate(container);
    expect(() => rerender(<Price v="1" show={false} />)).not.toThrow();
    expect(container.textContent).not.toContain("!");
    expect(() => unmount()).not.toThrow();
  });
});
