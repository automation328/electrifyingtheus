// Blog posts gained the block builder. The thing most worth guarding is what
// did NOT change: a reader's post must render exactly as before, and the
// markdown body must stay the body.

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { PageBlock, PageOverride } from "@/lib/page-content";

vi.mock("@/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/forms/ShareGate", () => ({ default: () => <div>share</div> }));

const POST = {
  slug: "test-post", title: "A Post Title", excerpt: "The excerpt.", category: "News",
  author: "Someone", date: "June 1, 2026", readTime: "3 min read",
  image: "https://example.com/hero.jpg", content: "MARKDOWN BODY TEXT",
};

// Real shapes: usePost -> { post, loading }, usePosts -> { posts, loading }.
vi.mock("@/hooks/use-content", () => ({
  usePost: () => ({ post: POST, loading: false }),
  usePosts: () => ({ posts: [POST], loading: false }),
}));

// Signed-out by default; individual tests re-mock for an editor.
const auth = vi.hoisted(() => ({ value: { status: "signed-out" } as unknown }));
vi.mock("@/lib/auth", () => ({
  useEditorAuth: () => auth.value,
  getAccessToken: async () => null,
}));

// Blocks live in site_pages; feed them straight in rather than hitting Supabase.
// Deliberately PATH-AWARE: blocks come back only for this post's own path, so a
// change to where they are stored fails a test instead of silently reading the
// wrong row.
const override = vi.hoisted(() => ({ value: null as PageOverride | null, askedFor: [] as string[] }));
vi.mock("@/lib/page-content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/page-content")>()),
  usePageOverride: (path: string) => {
    override.askedFor.push(path);
    return path === "/blog/test-post" ? override.value : null;
  },
}));
vi.mock("@/lib/admin-api", () => ({
  listRows: async () => [],
  insertRow: async () => ({}),
  updateRow: async () => ({}),
  uploadImage: async () => "",
  listMedia: async () => [],
}));

import BlogPost from "@/pages/BlogPost";

beforeAll(() => { window.scrollTo = () => {}; });
afterEach(() => { cleanup(); auth.value = { status: "signed-out" }; override.value = null; override.askedFor = []; });

const renderPost = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/blog/test-post"]}>
        <Routes><Route path="/blog/:slug" element={<BlogPost />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const block = (slot: string, text: string): PageBlock => ({ id: `b-${slot}`, slot, type: "heading", text });

describe("a reader's blog post", () => {
  it("still renders the post", () => {
    renderPost();
    expect(screen.getByText("A Post Title")).toBeTruthy();
    expect(screen.getByText("MARKDOWN BODY TEXT")).toBeTruthy();
  });

  it("shows no editing controls", () => {
    const { container } = renderPost();
    expect(container.textContent).not.toContain("Edit this page");
    expect(container.textContent).not.toContain("Add block");
  });

  it("adds nothing to a post with no blocks", () => {
    const { container } = renderPost();
    expect(container.querySelector("[data-block-id]")).toBeNull();
  });
});

describe("where a post's blocks are stored", () => {
  it("reads them from the post's own path", () => {
    renderPost();
    // Wrong path = blocks read from, and saved to, the wrong row.
    expect(override.askedFor).toContain("/blog/test-post");
  });

  it("asks for no other path", () => {
    renderPost();
    expect(override.askedFor.filter((p) => p !== "/blog/test-post")).toEqual([]);
  });
});

describe("blocks on a post", () => {
  it("puts a blog-end block after the article body", () => {
    override.value = { blocks: [block("blog-end", "AFTER THE ARTICLE")] };
    const { container } = renderPost();
    const body = screen.getByText("MARKDOWN BODY TEXT");
    const added = screen.getByText("AFTER THE ARTICLE");
    // DOCUMENT_POSITION_FOLLOWING === the added node comes later in the page.
    expect(body.compareDocumentPosition(added) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    expect(container.querySelector("article")?.contains(added)).toBe(true);
  });

  it("puts a blog-top block before the article body", () => {
    override.value = { blocks: [block("blog-top", "BEFORE THE ARTICLE")] };
    renderPost();
    const body = screen.getByText("MARKDOWN BODY TEXT");
    const added = screen.getByText("BEFORE THE ARTICLE");
    expect(body.compareDocumentPosition(added) & Node.DOCUMENT_POSITION_PRECEDING).toBeTruthy();
  });

  it("leaves the post's own words alone", () => {
    override.value = { blocks: [block("blog-top", "EXTRA")] };
    renderPost();
    expect(screen.getByText("MARKDOWN BODY TEXT")).toBeTruthy();
    expect(screen.getByText("A Post Title")).toBeTruthy();
  });
});

describe("the article-text dialog", () => {
  /** Open the body editor the way an editor does. */
  const openBodyEditor = () => {
    auth.value = { status: "editor", editor: { role: "admin" } };
    const view = renderPost();
    fireEvent.click(screen.getByText(/Edit this page/i));
    fireEvent.click(screen.getByText(/Edit article text/i));
    return view;
  };

  it("escapes the editor's shifted container", () => {
    // Inside it, the page showed straight through the panel: that container is
    // a transform + clip ancestor, and it tinted everything beneath it.
    openBodyEditor();
    const panel = screen.getByText("Article text").closest("div");
    const shifted = document.querySelector(".cms-editor-shift");
    expect(panel).toBeTruthy();
    expect(shifted?.contains(panel as Node)).toBe(false);
  });

  it("renders as a child of body, not of the page", () => {
    const { container } = openBodyEditor();
    expect(container.textContent).not.toContain("Article text");
    expect(document.body.textContent).toContain("Article text");
  });

  it("gives the panel a solid background of its own", () => {
    openBodyEditor();
    const panel = screen.getByText("Article text").closest("div[style]") as HTMLElement;
    expect(panel.style.backgroundColor).toBe("rgb(255, 255, 255)");
    expect(panel.style.opacity).toBe("1");
  });

  it("offers the formatting toolbar inside it", () => {
    openBodyEditor();
    expect(screen.getByTitle(/^Bold/)).toBeTruthy();
    expect(screen.getByTitle("Bulleted list")).toBeTruthy();
  });
});

describe("an editor's blog post", () => {
  it("offers the page builder", () => {
    auth.value = { status: "editor", editor: { role: "admin" } };
    const { container } = renderPost();
    expect(container.textContent).toContain("Edit this page");
  });

  it("does not offer it to a viewer-role account", () => {
    auth.value = { status: "editor", editor: { role: "viewer" } };
    const { container } = renderPost();
    expect(container.textContent).not.toContain("Edit this page");
  });
});
