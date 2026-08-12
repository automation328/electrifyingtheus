// Blocks that live INSIDE the hero band.
//
// The point of the "hero" slot is placement: a block assigned to it has to land
// in the hero itself, not in the body far below. That is a rendering fact, so
// it is asserted against the real <header> element rather than by reading the
// data back.

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, cleanup } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { FileText } from "lucide-react";
import ContentPageLayout from "@/components/ContentPageLayout";
import { InlineEditContext, type InlineEditContextValue } from "@/components/inline/edit-context";
import type { PageBlock } from "@/lib/page-content";

// The chrome around the page pulls in image assets and site settings; neither is
// what these tests are about.
vi.mock("@/components/Navbar", () => ({ default: () => <nav data-testid="navbar" /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer data-testid="footer" /> }));

beforeAll(() => {
  window.scrollTo = () => {};
});

const makeCtx = (over: Partial<InlineEditContextValue> = {}): InlineEditContextValue => ({
  editing: false,
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

const renderPage = (blocks: PageBlock[], ctx = makeCtx(), extra: Record<string, unknown> = {}) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  const view = render(
    <QueryClientProvider client={qc}>
      <MemoryRouter>
        <InlineEditContext.Provider value={ctx}>
          <ContentPageLayout
            badge="" title="Page title" highlight="" intro="Intro line"
            icon={FileText} sections={[]} blocks={blocks} hideMeta hideCta
            {...extra}
          />
        </InlineEditContext.Provider>
      </MemoryRouter>
    </QueryClientProvider>,
  );
  return { ...view, header: view.container.querySelector("header"), article: view.container.querySelector("article") };
};

afterEach(cleanup);

describe("blocks inside the hero", () => {
  it("puts a hero-slot block in the hero, not in the body", () => {
    const blocks: PageBlock[] = [{ id: "h1", slot: "hero", type: "heading", text: "LIVES IN THE HERO" }];
    const { header, article } = renderPage(blocks);
    expect(header?.textContent).toContain("LIVES IN THE HERO");
    expect(article?.textContent ?? "").not.toContain("LIVES IN THE HERO");
  });

  it("still puts a body block in the body, not in the hero", () => {
    const blocks: PageBlock[] = [{ id: "b1", slot: "after-stats", type: "heading", text: "LIVES IN THE BODY" }];
    const { header, article } = renderPage(blocks);
    expect(article?.textContent).toContain("LIVES IN THE BODY");
    expect(header?.textContent ?? "").not.toContain("LIVES IN THE BODY");
  });

  it("takes any kind of block, not just text", () => {
    const blocks: PageBlock[] = [
      { id: "h1", slot: "hero", type: "image", src: "https://example.com/x.jpg", alt: "a photo" },
      { id: "h2", slot: "hero", type: "button", text: "PRESS ME", href: "/" },
    ];
    const { header } = renderPage(blocks);
    expect(header?.querySelector('img[src="https://example.com/x.jpg"]')).toBeTruthy();
    expect(header?.textContent).toContain("PRESS ME");
  });

  it("gives the editor an Add control inside the hero itself", () => {
    const { header } = renderPage([], makeCtx({ editing: true }));
    expect(header?.textContent).toContain("Add block");
  });

  it("shows no Add control to a visitor", () => {
    const { header } = renderPage([], makeCtx({ editing: false }));
    expect(header?.textContent ?? "").not.toContain("Add block");
  });

  it("hides hero blocks along with the hero when it is deleted", () => {
    const blocks: PageBlock[] = [{ id: "h1", slot: "hero", type: "heading", text: "LIVES IN THE HERO" }];
    const { container } = renderPage(blocks, makeCtx(), { hero: { hidden: true } });
    expect(container.querySelector("header")).toBeNull();
    expect(container.textContent).not.toContain("LIVES IN THE HERO");
  });
});

describe("the gap under the hero", () => {
  it("stays tight on a page built only from blocks", () => {
    const { article } = renderPage([]);
    expect(article?.className).toContain("mt-6");
    expect(article?.className).not.toContain("md:mt-24");
  });

  it("keeps the generous spacing on a page with written sections", () => {
    const { article } = renderPage([], makeCtx(), {
      sections: [{ heading: "One", body: ["Body copy."] }],
    });
    expect(article?.className).toContain("md:mt-24");
  });
});
