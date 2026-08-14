// Inline editing on an event page.
//
// Two risks are specific to events and neither exists on blog posts:
//
//  1. The page shows DERIVED text. eventDisplayTitle appends " - City" and
//     eventLocationText substitutes a map pin for a blank location. Editing
//     those strings would write the derived form into the column — and the
//     title is part of the event's dedupe key, which decides its slug, which is
//     its URL. A save could move the page out from under its own link.
//  2. Some events come from an external feed. They are not ours, and must never
//     be written to site_events.

import { describe, it, expect, vi, beforeAll, afterEach } from "vitest";
import { render, screen, cleanup, fireEvent } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import type { EventItem } from "@/data/events";

vi.mock("@/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/forms/ShareGate", () => ({ default: () => <div>share</div> }));
vi.mock("@/components/forms/EventActionGate", () => ({ default: () => <div>register</div> }));

// "Nordic EV Summit 2027" with location "Oslo, Norway" — displayed with the
// city appended, which is exactly the string that must NOT be saved.
const BASE: EventItem = {
  id: "evt-1", month: "MAY", day: "12", year: 2027,
  title: "Nordic EV Summit 2027", type: "Summit",
  location: "Oslo, Norway", region: "Oslo, Norway",
  time: "May 12-13, 2027", description: "Europe's policy-leading EV gathering.",
  image: "https://example.com/e.jpg", slug: "nordic-ev-summit-2027",
};

const ours = vi.hoisted(() => ({ value: [] as unknown[] }));
const external = vi.hoisted(() => ({ value: [] as unknown[] }));
vi.mock("@/hooks/use-content", () => ({ useEvents: () => ({ events: ours.value, loading: false }) }));
vi.mock("@/hooks/use-external-events", () => ({ useExternalEvents: () => ({ events: external.value, loading: false }) }));

const auth = vi.hoisted(() => ({ value: { status: "signed-out" } as unknown }));
vi.mock("@/lib/auth", () => ({ useEditorAuth: () => auth.value, getAccessToken: async () => null }));
vi.mock("@/lib/page-content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/page-content")>()),
  usePageOverride: () => null,
}));
vi.mock("@/lib/admin-api", () => ({
  listRows: async () => [], insertRow: async () => ({}), updateRow: async () => ({}),
  uploadImage: async () => "", listMedia: async () => [],
}));

import EventDetail from "@/pages/EventDetail";

beforeAll(() => { window.scrollTo = () => {}; });
afterEach(() => {
  cleanup();
  auth.value = { status: "signed-out" };
  ours.value = [];
  external.value = [];
});

const renderEvent = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/events/nordic-ev-summit-2027"]}>
        <Routes><Route path="/events/:slug" element={<EventDetail />} /></Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const asEditor = () => { auth.value = { status: "editor", editor: { role: "admin" } }; };

describe("a visitor's event page", () => {
  it("shows the title with its city appended, as before", () => {
    ours.value = [BASE];
    renderEvent();
    expect(screen.getByText(/Nordic EV Summit 2027 - Oslo/)).toBeTruthy();
  });

  it("shows the other details", () => {
    ours.value = [BASE];
    renderEvent();
    expect(screen.getByText("May 12-13, 2027")).toBeTruthy();
    expect(screen.getByText(/Europe's policy-leading EV gathering/)).toBeTruthy();
  });

  it("offers no editing controls", () => {
    ours.value = [BASE];
    const { container } = renderEvent();
    expect(container.textContent).not.toContain("Edit this page");
  });
});

describe("an editor edits the RAW value, not the displayed one", () => {
  it("puts the stored title in the editable box, without the appended city", () => {
    asEditor();
    ours.value = [BASE];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    // The derived form must be gone: saving it would rewrite the title, and the
    // title decides the slug.
    expect(screen.queryByText(/Nordic EV Summit 2027 - Oslo/)).toBeNull();
    expect(screen.getByText("Nordic EV Summit 2027")).toBeTruthy();
  });

  it("shows the derived title again when editing stops", () => {
    asEditor();
    ours.value = [BASE];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    // The edit bar's exit is an icon button, titled rather than labelled.
    fireEvent.click(screen.getByTitle("Exit without saving"));
    expect(screen.getByText(/Nordic EV Summit 2027 - Oslo/)).toBeTruthy();
  });

  it("edits the stored location rather than the map-pin fallback", () => {
    asEditor();
    ours.value = [{ ...BASE, location: "" }];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    // With a blank location a visitor sees a fallback; an editor must get the
    // blank field, not the fallback text baked in.
    expect(screen.queryByText("See event details")).toBeNull();
  });
});

describe("external feed events", () => {
  it("keep their derived title — they are not ours to rewrite", () => {
    asEditor();
    external.value = [{ ...BASE, id: undefined, external: true, source: "example.com" }];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(screen.getByText(/Nordic EV Summit 2027 - Oslo/)).toBeTruthy();
  });
});
