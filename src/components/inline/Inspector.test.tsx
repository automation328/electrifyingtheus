// The left editor panel.
//
// Two things a screenshot caught that no unit test would have: with nothing
// selected the panel was an empty prompt (so the editor's tools were never on
// screen), and the hero had no entry in the layer tree. These drive the real
// panel and assert the tools are actually reachable.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, within } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import Inspector from "@/components/inline/Inspector";
import { InlineEditContext, HERO_ID, type InlineEditContextValue } from "@/components/inline/edit-context";
import type { PageBlock } from "@/lib/page-content";

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

const SLOTS = ["after-stats", "after-section-0", "end"];

const renderPanel = (ctx: InlineEditContextValue, blocks: PageBlock[] = [], slots = SLOTS) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <InlineEditContext.Provider value={ctx}>
        <Inspector blocks={blocks} slots={slots} />
      </InlineEditContext.Provider>
    </QueryClientProvider>,
  );
};

afterEach(() => {
  cleanup();
  document.body.innerHTML = "";
});

/** Which tab is actually on show. Every panel stays MOUNTED (the Settings body
 *  is a live portal target), so presence in the DOM proves nothing — only the
 *  absence of the `hidden` class does. jsdom applies no stylesheet, so
 *  toBeVisible() cannot see a Tailwind class; this reads it directly. */
const showing = (container: HTMLElement, name: "add" | "settings" | "layers") => {
  const panel = container.querySelector(`[data-panel="${name}"]`);
  if (!panel) throw new Error(`no ${name} panel rendered`);
  return !panel.className.split(/\s+/).includes("hidden");
};

describe("the editor's tools are always on screen", () => {
  it("opens on the block palette, not an empty prompt", () => {
    const { container } = renderPanel(makeCtx({ activeId: null }));
    expect(showing(container, "add")).toBe(true);
    expect(showing(container, "settings")).toBe(false);
    expect(showing(container, "layers")).toBe(false);
  });

  it("shows the block palette when nothing is selected", () => {
    renderPanel(makeCtx({ activeId: null }));
    for (const label of ["Heading", "Text", "Image", "Button", "Container"]) {
      expect(screen.getByRole("button", { name: label })).toBeTruthy();
    }
  });

  it("offers the ready-made sections too", () => {
    renderPanel(makeCtx({ activeId: null }));
    expect(screen.getByRole("button", { name: "Hero band" })).toBeTruthy();
    expect(screen.getByRole("button", { name: "3 features" })).toBeTruthy();
  });

  it("adds a block to the page when one is picked", () => {
    const ctx = makeCtx();
    renderPanel(ctx);
    fireEvent.click(screen.getByRole("button", { name: "Heading" }));
    // Defaults to the end of the page — the last insertion point.
    expect(ctx.addBlock).toHaveBeenCalledWith("end", "heading");
  });

  it("drops in a ready-made section when one is picked", () => {
    const ctx = makeCtx();
    renderPanel(ctx);
    fireEvent.click(screen.getByRole("button", { name: "Hero band" }));
    expect(ctx.insertTemplate).toHaveBeenCalledWith("end", expect.objectContaining({ type: "container" }));
  });

  it("lets the editor choose where the block lands", () => {
    const ctx = makeCtx();
    renderPanel(ctx);
    const where = screen.getByRole("combobox");
    // Every insertion point on the page is offered, in plain words.
    expect(within(where).getByRole("option", { name: "Top of page" })).toBeTruthy();
    expect(within(where).getByRole("option", { name: "After section 1" })).toBeTruthy();
    expect(within(where).getByRole("option", { name: "End of page" })).toBeTruthy();

    fireEvent.change(where, { target: { value: "after-stats" } });
    fireEvent.click(screen.getByRole("button", { name: "Text" }));
    expect(ctx.addBlock).toHaveBeenCalledWith("after-stats", "text");
  });

  it("still finds a block's settings when one is selected", () => {
    const blocks: PageBlock[] = [{ id: "b1", slot: "end", type: "heading", text: "Hi" }];
    const { container } = renderPanel(makeCtx({ activeId: "b1" }), blocks);
    expect(screen.getByText("Heading settings")).toBeTruthy();
    // Selecting something swaps the panel over to its settings.
    expect(showing(container, "settings")).toBe(true);
    expect(showing(container, "add")).toBe(false);
  });

  it("names the hero when the hero is selected", () => {
    renderPanel(makeCtx({ activeId: HERO_ID }));
    expect(screen.getByText("Hero settings")).toBeTruthy();
  });

  it("lists the hero in the layer tree, above the blocks", () => {
    const { container } = renderPanel(makeCtx());
    fireEvent.click(screen.getByRole("button", { name: /Layers/ }));
    expect(showing(container, "layers")).toBe(true);
    expect(screen.getByRole("button", { name: "Hero" })).toBeTruthy();
  });

  it("can be switched back to the tools at any time", () => {
    const blocks: PageBlock[] = [{ id: "b1", slot: "end", type: "heading", text: "Hi" }];
    const { container } = renderPanel(makeCtx({ activeId: "b1" }), blocks);
    expect(showing(container, "add")).toBe(false);
    fireEvent.click(screen.getByRole("button", { name: /^Add$/ }));
    expect(showing(container, "add")).toBe(true);
  });

  it("deletes the hero from the layer tree", () => {
    const ctx = makeCtx({ get: vi.fn(() => undefined) });
    renderPanel(ctx);
    fireEvent.click(screen.getByRole("button", { name: /Layers/ }));
    fireEvent.click(screen.getByTitle("Delete the hero section"));
    expect(ctx.set).toHaveBeenCalledWith("hero", expect.objectContaining({ hidden: true }));
  });

  it("shows nothing at all outside edit mode", () => {
    const { container } = renderPanel(makeCtx({ editing: false }));
    expect(container.innerHTML).toBe("");
  });
});
