// The publish controls in the CMS editor.
//
// These buttons decide what is on the live site, and until now the whole
// CollectionManager had no test coverage at all. Two behaviours matter more
// than the rest:
//
//   1. Publish must actually publish, and must email the organiser — the list's
//      toggle already did that, so the editor doing it differently would mean
//      which button you happened to use decides whether the person who
//      submitted an event ever hears back.
//   2. Plain Save on a live row must NOT change its status. Editing the wording
//      of a published event and having it silently drop off the site is the
//      worst thing this screen could do.

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { eventsConfig } from "@/pages/admin/collections/configs";

const rows = vi.hoisted(() => ({ value: [] as Record<string, unknown>[] }));
const api = vi.hoisted(() => ({
  updateRow: vi.fn(async () => ({})),
  insertRow: vi.fn(async () => ({ id: "new-1" })),
  notifyEventPublished: vi.fn(async () => ({ sent: true, detail: "" })),
}));
const auth = vi.hoisted(() => ({ value: { status: "editor", editor: { role: "admin" } } as unknown }));

vi.mock("@/lib/auth", () => ({ useEditorAuth: () => auth.value }));
vi.mock("sonner", () => ({ toast: { success: vi.fn(), error: vi.fn() } }));
vi.mock("@/lib/admin-api", () => ({
  listRows: async () => rows.value,
  insertRow: (...a: unknown[]) => api.insertRow(...(a as [])),
  updateRow: (...a: unknown[]) => api.updateRow(...(a as [])),
  deleteRow: async () => ({}),
  destroyRow: async () => ({}),
  listMedia: async () => [],
  uploadImage: async () => "",
  notifyEventPublished: (...a: unknown[]) => api.notifyEventPublished(...(a as [])),
}));

import CollectionManager from "@/components/admin/CollectionManager";

const EVENT = {
  id: "evt-1",
  title: "Ride and Drive",
  event_date: "2026-09-12",
  location: "Denver, CO",
  region: "Denver, CO",
  time: "All day",
  description: "An EV event.",
  type: "EV Event",
  status: "draft",
};

const show = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter><CollectionManager config={eventsConfig} /></MemoryRouter>
    </QueryClientProvider>,
  );
};

/**
 * Open the editor for our one database row.
 *
 * Two things make this fiddly and both are real behaviour, not test noise:
 * the list is split into Live / Drafts / Archive tabs and opens on Live, so a
 * draft has to be reached through its tab; and the events collection also
 * renders ~25 curated built-in rows, whose edit buttons are titled at length.
 * The database row's button is titled exactly "Edit", which is what picks it
 * out of the crowd.
 */
const openEditor = async (tab: "Live" | "Drafts") => {
  fireEvent.click(await screen.findByText(tab));
  fireEvent.click(await screen.findByTitle("Edit"));
  await screen.findByText("Cancel");
};

beforeEach(() => {
  auth.value = { status: "editor", editor: { role: "admin" } };
  rows.value = [{ ...EVENT }];
  api.updateRow.mockClear();
  api.insertRow.mockClear();
  api.notifyEventPublished.mockClear();
});
afterEach(cleanup);

const statusOf = (call: unknown[]) => (call[2] as Record<string, unknown>).status;

describe("editing a draft", () => {
  it("offers Publish and Save as draft", async () => {
    show();
    await openEditor("Drafts");
    expect(screen.getByText("Publish")).toBeTruthy();
    expect(screen.getByText("Save as draft")).toBeTruthy();
    expect(screen.queryByText("Take offline")).toBeNull();
  });

  it("Publish sets the row live", async () => {
    show();
    await openEditor("Drafts");
    fireEvent.click(screen.getByText("Publish"));
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    expect(statusOf(api.updateRow.mock.calls[0])).toBe("published");
  });

  it("Publish emails the organiser, exactly as the list toggle does", async () => {
    show();
    await openEditor("Drafts");
    fireEvent.click(screen.getByText("Publish"));
    await waitFor(() => expect(api.notifyEventPublished).toHaveBeenCalledWith("evt-1"));
  });

  it("Save as draft leaves it off the site", async () => {
    show();
    await openEditor("Drafts");
    fireEvent.click(screen.getByText("Save as draft"));
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    expect(statusOf(api.updateRow.mock.calls[0])).toBe("draft");
    expect(api.notifyEventPublished).not.toHaveBeenCalled();
  });
});

describe("editing a published event", () => {
  beforeEach(() => { rows.value = [{ ...EVENT, status: "published" }]; });

  it("offers Save and Take offline, not Publish", async () => {
    show();
    await openEditor("Live");
    expect(screen.getByText("Save")).toBeTruthy();
    expect(screen.getByText("Take offline")).toBeTruthy();
    expect(screen.queryByText("Publish")).toBeNull();
  });

  it("Save does NOT quietly take it off the site", async () => {
    // The regression that would matter most: fix a typo in a live event, and it
    // vanishes from the site because Save reset the status.
    show();
    await openEditor("Live");
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    expect(statusOf(api.updateRow.mock.calls[0])).toBe("published");
  });

  it("Save does not re-email the organiser, because nothing went live", async () => {
    show();
    await openEditor("Live");
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    expect(api.notifyEventPublished).not.toHaveBeenCalled();
  });

  it("Take offline moves it back to draft", async () => {
    show();
    await openEditor("Live");
    fireEvent.click(screen.getByText("Take offline"));
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    expect(statusOf(api.updateRow.mock.calls[0])).toBe("draft");
  });
});

describe("an author, who may not publish", () => {
  beforeEach(() => { auth.value = { status: "editor", editor: { role: "author" } }; });

  it("gets no publish control at all", async () => {
    show();
    await openEditor("Drafts");
    expect(screen.queryByText("Publish")).toBeNull();
    expect(screen.queryByText("Take offline")).toBeNull();
    expect(screen.getByText("Save")).toBeTruthy();
  });

  it("saves as a draft whatever the row said", async () => {
    rows.value = [{ ...EVENT, status: "published" }];
    show();
    await openEditor("Live");
    fireEvent.click(screen.getByText("Save"));
    await waitFor(() => expect(api.updateRow).toHaveBeenCalled());
    expect(statusOf(api.updateRow.mock.calls[0])).toBe("draft");
  });
});
