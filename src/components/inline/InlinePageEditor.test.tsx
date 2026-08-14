// Where an inline field edit actually gets written.
//
// This is the dangerous part of the feature. The page's blocks belong in
// site_pages, but the item's OWN title/body belong in its content table. Send
// them to the wrong place and the edit appears to work, reports success, and is
// gone on reload. Worse, a curated item with no row must be INSERTED once and
// UPDATED thereafter — get that wrong and every save makes a duplicate post.

import { describe, it, expect, vi, afterEach } from "vitest";
import { render, screen, fireEvent, cleanup, waitFor } from "@testing-library/react";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import InlinePageEditor from "@/components/inline/InlinePageEditor";
import { useInlineEdit } from "@/components/inline/edit-context";

// Typed with rest args so `mock.calls[n][i]` is indexable — a zero-arg mock
// infers an empty tuple and every assertion below fails to compile.
const api = vi.hoisted(() => ({
  listRows: vi.fn(async (..._args: unknown[]) => [] as unknown[]),
  insertRow: vi.fn(async (..._args: unknown[]) => ({})),
  updateRow: vi.fn(async (..._args: unknown[]) => ({})),
}));
vi.mock("@/lib/admin-api", () => ({
  listRows: api.listRows,
  insertRow: api.insertRow,
  updateRow: api.updateRow,
  uploadImage: async () => "",
  listMedia: async () => [],
}));
vi.mock("@/lib/auth", () => ({
  useEditorAuth: () => ({ status: "editor", editor: { role: "admin" } }),
  getAccessToken: async () => null,
}));
vi.mock("@/lib/page-content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/page-content")>()),
  usePageOverride: () => null,
}));

/** A child that edits one field and one block, so the split can be observed. */
const Child = () => {
  const ctx = useInlineEdit();
  if (!ctx?.editing) return null;
  return (
    <>
      <button onClick={() => ctx.set("fields.title", "NEW TITLE")}>set title</button>
      <button onClick={() => ctx.addBlock("blog-end", "heading")}>add block</button>
    </>
  );
};

const renderEditor = (fields?: Parameters<typeof InlinePageEditor>[0]["fields"]) => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <InlinePageEditor path="/blog/x" label="X" slots={["blog-top", "blog-end"]} fields={fields}>
        {() => <Child />}
      </InlinePageEditor>
    </QueryClientProvider>,
  );
};

/** Enter edit mode, run the edits, then publish. */
const editAnd = async (...labels: string[]) => {
  fireEvent.click(screen.getByText(/Edit this page/i));
  for (const l of labels) fireEvent.click(await screen.findByText(l));
  fireEvent.click(screen.getByText(/^Publish$/i));
};

afterEach(() => { cleanup(); vi.clearAllMocks(); api.listRows.mockResolvedValue([]); });

describe("saving an inline field edit", () => {
  it("updates the content row when the item already has one", async () => {
    renderEditor({ table: "site_blog_posts", id: "row-1", invalidate: "site-blog-posts" });
    await editAnd("set title");
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    const call = api.updateRow.mock.calls.find((c) => c[0] === "site_blog_posts");
    expect(call?.[1]).toBe("row-1");
    expect(call?.[2]).toMatchObject({ title: "NEW TITLE" });
  });

  it("never writes the field into site_pages as well", async () => {
    renderEditor({ table: "site_blog_posts", id: "row-1" });
    await editAnd("set title");
    await waitFor(() => expect(api.insertRow).toHaveBeenCalled());
    // The site_pages payload must carry blocks/styles — never the item's fields,
    // or the title would exist in two places and they would drift.
    const page = api.insertRow.mock.calls.find((c) => c[0] === "site_pages");
    expect(page?.[1]).toBeDefined();
    expect((page?.[1] as { content?: Record<string, unknown> }).content).not.toHaveProperty("fields");
  });

  it("still saves blocks to site_pages", async () => {
    renderEditor({ table: "site_blog_posts", id: "row-1" });
    await editAnd("add block");
    await waitFor(() => expect(api.insertRow).toHaveBeenCalled());
    const page = api.insertRow.mock.calls.find((c) => c[0] === "site_pages");
    const content = (page?.[1] as { content?: { blocks?: unknown[] } }).content;
    expect(content?.blocks).toHaveLength(1);
  });
});

describe("a curated item with no row yet", () => {
  it("inserts one, carrying the rest of the item with it", async () => {
    renderEditor({
      table: "site_blog_posts",
      adopt: { slug: "x", title: "OLD", excerpt: "E", content: "BODY", status: "published" },
    });
    await editAnd("set title");
    await waitFor(() => expect(api.insertRow).toHaveBeenCalled());
    const insert = api.insertRow.mock.calls.find((c) => c[0] === "site_blog_posts");
    expect(insert).toBeDefined();
    // The edit wins over the adopted value, and nothing else is lost.
    expect(insert?.[1]).toMatchObject({ slug: "x", excerpt: "E", content: "BODY", title: "NEW TITLE" });
  });

  it("inserts exactly once, not once per field", async () => {
    renderEditor({ table: "site_blog_posts", adopt: { slug: "x", title: "OLD" } });
    await editAnd("set title");
    await waitFor(() => expect(api.insertRow).toHaveBeenCalled());
    const inserts = api.insertRow.mock.calls.filter((c) => c[0] === "site_blog_posts");
    expect(inserts).toHaveLength(1);
  });

  it("updates instead of inserting once the row exists", async () => {
    // Same item, second edit — now it has an id, so a duplicate must not appear.
    renderEditor({ table: "site_blog_posts", id: "row-9", adopt: { slug: "x", title: "OLD" } });
    await editAnd("set title");
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    expect(api.insertRow.mock.calls.filter((c) => c[0] === "site_blog_posts")).toHaveLength(0);
  });
});

describe("a page with no field target", () => {
  it("touches no content table at all", async () => {
    renderEditor(undefined);
    await editAnd("add block");
    await waitFor(() => expect(api.insertRow).toHaveBeenCalled());
    expect(api.insertRow.mock.calls.filter((c) => c[0] === "site_blog_posts")).toHaveLength(0);
    expect(api.updateRow.mock.calls.filter((c) => c[0] === "site_blog_posts")).toHaveLength(0);
  });
});
