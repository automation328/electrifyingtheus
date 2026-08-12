// What an editor actually sees and clicks on the hero.
//
// The unit-level maths (heroLayout) is easy to get right and still ship a broken
// screen — that is exactly how the archive change went out looking like a bug.
// These tests render the real component and drive it the way a person would:
// hover chrome, the settings panel, delete, and restore.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup } from "@testing-library/react";
import HeroSection from "@/components/inline/HeroSection";
import { InlineEditContext, HERO_ID, type InlineEditContextValue } from "@/components/inline/edit-context";
import { INSPECTOR_BODY_ID } from "@/components/inline/Inspector";
import type { PageHero } from "@/lib/page-content";

const makeCtx = (over: Partial<InlineEditContextValue> = {}): InlineEditContextValue => ({
  editing: true,
  activeId: null,
  setActive: vi.fn(),
  set: vi.fn(),
  get: vi.fn(),
  addBlock: vi.fn(),
  updateBlock: vi.fn(),
  moveBlock: vi.fn(),
  duplicateBlock: vi.fn(),
  moveBlockRelative: vi.fn(),
  removeBlock: vi.fn(),
  saveTemplate: vi.fn(),
  insertTemplate: vi.fn(),
  deleteTemplate: vi.fn(),
  ...over,
});

/** Render the hero with a live Inspector target, so its settings panel can portal in. */
const renderHero = (hero: PageHero | undefined, ctx: InlineEditContextValue, heroImage?: string) => {
  const inspector = document.createElement("div");
  inspector.id = INSPECTOR_BODY_ID;
  document.body.appendChild(inspector);
  const view = render(
    <InlineEditContext.Provider value={ctx}>
      <HeroSection hero={hero} heroImage={heroImage}>
        <p>hero copy</p>
      </HeroSection>
    </InlineEditContext.Provider>,
  );
  return { ...view, inspector, header: view.container.querySelector("header") };
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

describe("the hero on the live page", () => {
  it("renders the page's hero copy", () => {
    renderHero(undefined, makeCtx({ editing: false }));
    expect(screen.getByText("hero copy")).toBeTruthy();
  });

  it("shows no editing chrome to a visitor", () => {
    renderHero(undefined, makeCtx({ editing: false }));
    expect(screen.queryByTitle("Hero settings")).toBeNull();
    expect(screen.queryByTitle("Delete hero section")).toBeNull();
  });

  it("keeps the built-in look when nobody has styled it", () => {
    const { header } = renderHero(undefined, makeCtx({ editing: false }));
    expect(header?.style.paddingTop).toBe("128px");
    expect(header?.getAttribute("style")).not.toMatch(/background-color/);
  });

  it("paints the background, text colour and height an editor chose", () => {
    const { header } = renderHero(
      { minH: 46, style: { bg: "#0f172a", color: "#ffffff" } },
      makeCtx({ editing: false }),
    );
    const css = header?.getAttribute("style") ?? "";
    expect(css).toMatch(/background-color:\s*(#0f172a|rgb\(15,\s*23,\s*42\))/i);
    expect(css).toMatch(/(^|[;\s])color:\s*(#ffffff|rgb\(255,\s*255,\s*255\))/i);
    expect(header?.style.minHeight).toBe("46vh");
  });

  it("is gone from the live page once deleted", () => {
    renderHero({ hidden: true }, makeCtx({ editing: false }));
    expect(screen.queryByText("hero copy")).toBeNull();
  });
});

describe("the hero in the editor", () => {
  it("offers settings and delete on the section itself", () => {
    renderHero(undefined, makeCtx());
    expect(screen.getByTitle("Hero settings")).toBeTruthy();
    expect(screen.getByTitle("Delete hero section")).toBeTruthy();
  });

  it("selects the hero when the editor clicks it", () => {
    const ctx = makeCtx();
    const { header } = renderHero(undefined, ctx);
    fireEvent.click(header!);
    expect(ctx.setActive).toHaveBeenCalledWith(HERO_ID);
  });

  it("keeps the settings panel out of the Inspector until the hero is selected", () => {
    const { inspector } = renderHero(undefined, makeCtx({ activeId: null }));
    expect(inspector.textContent).not.toMatch(/Background/);
  });

  it("puts the hero's controls in the Inspector once selected", () => {
    const { inspector } = renderHero(undefined, makeCtx({ activeId: HERO_ID }));
    const text = inspector.textContent ?? "";
    for (const label of ["Background", "Background photo", "Text colour", "Height", "Padding", "Alignment", "Delete hero section"]) {
      expect(text).toContain(label);
    }
  });

  it("changes the background when a swatch is picked", () => {
    const ctx = makeCtx({ activeId: HERO_ID });
    const { inspector } = renderHero({ align: "center" }, ctx);
    // Swatches are titled with the colour they apply.
    const white = inspector.querySelector<HTMLButtonElement>('button[title="#ffffff"]');
    expect(white).toBeTruthy();
    fireEvent.click(white!);
    expect(ctx.set).toHaveBeenCalledWith("hero", expect.objectContaining({
      align: "center",                                  // existing settings survive
      style: expect.objectContaining({ bg: "#ffffff" }),
    }));
  });

  it("deletes the hero from the section toolbar", () => {
    const ctx = makeCtx();
    renderHero({ align: "center" }, ctx);
    fireEvent.click(screen.getByTitle("Delete hero section"));
    expect(ctx.set).toHaveBeenCalledWith("hero", expect.objectContaining({ hidden: true }));
    expect(ctx.setActive).toHaveBeenCalledWith(null);
  });

  it("offers a way back after a delete, so it is never a one-way door", () => {
    const ctx = makeCtx();
    renderHero({ hidden: true }, ctx);
    const restore = screen.getByText(/bring it back/i);
    fireEvent.click(restore);
    expect(ctx.set).toHaveBeenCalledWith("hero", expect.objectContaining({ hidden: false }));
  });

  it("still renders the copy when the icon + label row is switched off", () => {
    const { container } = renderHero({ hideKicker: true }, makeCtx({ editing: false }));
    expect(container.textContent).toContain("hero copy");
  });
});
