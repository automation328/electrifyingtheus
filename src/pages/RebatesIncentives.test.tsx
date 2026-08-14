// Inline editing on the Rebates & Incentives page.
//
// Unlike a blog post or an event, this page shows MANY records at once and each
// card owns its own site_incentives row. The risks tested here are the ones that
// only appear at that scale:
//
//  - a card must save to ITS OWN row, with the bucket it was rendered from;
//  - renaming must not leave the curated original behind as a second card;
//  - the embed view, which runs on third-party sites, must never offer editing.

import { describe, it, expect, vi, beforeEach, afterEach, beforeAll } from "vitest";
import { render, screen, cleanup, fireEvent, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { STATE_INCENTIVES, type Incentive } from "@/data/incentives";

vi.mock("@/components/Navbar", () => ({ default: () => <nav /> }));
vi.mock("@/components/Footer", () => ({ default: () => <footer /> }));
vi.mock("@/components/AfdcSearch", () => ({ default: () => <div>afdc</div> }));
vi.mock("@/components/forms/ShareGate", () => ({ default: () => <div>share</div> }));
vi.mock("@/hooks/useEmbedFrame", () => ({ useEmbedFrame: () => {} }));
vi.mock("sonner", () => ({
  toast: Object.assign(() => {}, { success: () => {}, error: () => {}, message: () => {} }),
}));

const api = vi.hoisted(() => ({
  inserts: [] as [string, Record<string, unknown>][],
  updates: [] as [string, string, Record<string, unknown>][],
}));
vi.mock("@/lib/admin-api", () => ({
  listRows: async () => [],
  insertRow: async (t: string, row: Record<string, unknown>) => { api.inserts.push([t, row]); return { id: "new-row" }; },
  updateRow: async (t: string, id: string, row: Record<string, unknown>) => { api.updates.push([t, id, row]); return {}; },
  uploadImage: async () => "",
  listMedia: async () => [],
}));

const auth = vi.hoisted(() => ({ value: { status: "signed-out" } as unknown }));
vi.mock("@/lib/auth", () => ({ useEditorAuth: () => auth.value, getAccessToken: async () => null }));
vi.mock("@/lib/page-content", async (importOriginal) => ({
  ...(await importOriginal<typeof import("@/lib/page-content")>()),
  usePageOverride: () => null,
}));

import RebatesIncentives from "@/pages/RebatesIncentives";

// The first curated California vehicle program — the card these tests drive.
const CA_VEHICLE = () => STATE_INCENTIVES.CA!.vehicle!;
let snapshot: Incentive[] = [];
let program: Incentive;

beforeAll(() => { window.scrollTo = () => {}; });

beforeEach(() => {
  // Saving merges the override into the curated arrays IN PLACE, so each test
  // has to start from the untouched set.
  snapshot = CA_VEHICLE().map((i) => ({ ...i }));
  program = CA_VEHICLE()[0];
  api.inserts.length = 0;
  api.updates.length = 0;
  // The page auto-detects a ZIP on mount; keep the tests off the network.
  vi.stubGlobal("fetch", vi.fn(() => Promise.reject(new Error("offline"))));
});

afterEach(() => {
  cleanup();
  vi.unstubAllGlobals();
  const b = CA_VEHICLE();
  b.splice(0, b.length, ...snapshot);
  auth.value = { status: "signed-out" };
  window.history.replaceState({}, "", "/rebates-incentives");
});

const renderPage = () => {
  const qc = new QueryClient({ defaultOptions: { queries: { retry: false } } });
  return render(
    <QueryClientProvider client={qc}>
      <MemoryRouter initialEntries={["/rebates-incentives"]}>
        <RebatesIncentives />
      </MemoryRouter>
    </QueryClientProvider>,
  );
};

const asEditor = () => { auth.value = { status: "editor", editor: { role: "admin" } }; };

/** Cards only render once a ZIP resolves to a state. 94108 → CA. */
const lookupCalifornia = () => {
  fireEvent.change(screen.getByLabelText("ZIP code"), { target: { value: "94108" } });
  fireEvent.click(screen.getByRole("button", { name: "View" }));
};

const startEditing = () => fireEvent.click(screen.getByText(/Edit this page/i));

/** Retype a contentEditable the way EditableText reads it: textContent + blur. */
const retype = (el: HTMLElement, text: string) => {
  el.textContent = text;
  fireEvent.blur(el);
};

const publish = async () => {
  fireEvent.click(screen.getByRole("button", { name: /Publish/i }));
  await waitFor(() => expect(api.inserts.some(([t]) => t === "site_pages")).toBe(true));
};

const incentiveWrites = () => api.inserts.filter(([t]) => t === "site_incentives").map(([, r]) => r);

describe("a visitor's incentives page", () => {
  it("lists the curated programs for the ZIP's state", () => {
    renderPage();
    lookupCalifornia();
    expect(screen.getByText(program.name)).toBeTruthy();
  });

  it("offers no editing controls", () => {
    const { container } = renderPage();
    lookupCalifornia();
    expect(container.textContent).not.toContain("Edit this page");
    expect(container.querySelector("[contenteditable]")).toBeNull();
  });

  it("does not show the program URL, which is an editing affordance", () => {
    renderPage();
    lookupCalifornia();
    expect(screen.queryByText("Link:")).toBeNull();
  });
});

describe("an editor on the incentives page", () => {
  it("can edit a card's text once editing starts", () => {
    asEditor();
    const { container } = renderPage();
    lookupCalifornia();
    startEditing();
    expect(container.querySelector("[contenteditable]")).toBeTruthy();
    expect(screen.getAllByText("Link:").length).toBeGreaterThan(0);
  });

  it("does not nest the block description editor inside a paragraph", () => {
    // The description editor is a block element. Inside the card's <p> the
    // browser closes that paragraph early and wrecks the card — invisible in
    // jsdom, obvious on the page. Asserted structurally rather than by watching
    // for React's warning, which it prints only once per violation and so had
    // already been swallowed by an earlier test.
    asEditor();
    const { container } = renderPage();
    lookupCalifornia();
    startEditing();

    const blockEditors = Array.from(container.querySelectorAll("div[contenteditable]"));
    expect(blockEditors.length).toBeGreaterThan(0);
    for (const el of blockEditors) expect(el.closest("p")).toBeNull();
  });

  it("saves an edited description to that card's own row", async () => {
    asEditor();
    renderPage();
    lookupCalifornia();
    startEditing();

    retype(screen.getByText(program.desc), "Rewritten by the editor.");
    await publish();

    const writes = incentiveWrites();
    expect(writes).toHaveLength(1);
    expect(writes[0]).toMatchObject({
      // The bucket the card was rendered from — not a guess from its position.
      scope: "state", state: "CA", category: "vehicle",
      name: program.name,
      description: "Rewritten by the editor.",
      status: "published", hidden: false,
    });
  });

  it("leaves the other cards alone", async () => {
    asEditor();
    renderPage();
    lookupCalifornia();
    startEditing();

    retype(screen.getByText(program.desc), "Only this one changed.");
    await publish();

    expect(incentiveWrites()).toHaveLength(1);
  });

  it("keeps the new text on screen after publishing, instead of reverting", async () => {
    // Overrides merge at boot and there is no query to invalidate, so without a
    // local re-merge the editor would watch their own change disappear.
    asEditor();
    renderPage();
    lookupCalifornia();
    startEditing();

    retype(screen.getByText(program.desc), "Still here after publish.");
    await publish();

    await waitFor(() => expect(screen.getByText("Still here after publish.")).toBeTruthy());
  });

  it("renaming a curated program also writes a tombstone, so it is not listed twice", async () => {
    asEditor();
    renderPage();
    lookupCalifornia();
    startEditing();

    retype(screen.getByText(program.name), "Renamed Program");
    await publish();

    const writes = incentiveWrites();
    expect(writes).toHaveLength(2);
    expect(writes[0]).toMatchObject({ name: "Renamed Program", hidden: false });
    expect(writes[1]).toMatchObject({ name: program.name, hidden: true });
  });

  it("shows the renamed program exactly once afterwards", async () => {
    asEditor();
    renderPage();
    lookupCalifornia();
    startEditing();

    retype(screen.getByText(program.name), "Renamed Program");
    await publish();

    await waitFor(() => expect(screen.getAllByText("Renamed Program")).toHaveLength(1));
    expect(screen.queryByText(program.name)).toBeNull();
  });
});

describe("the embeddable view used on third-party sites", () => {
  it("never offers editing, even to a signed-in editor", () => {
    asEditor();
    window.history.replaceState({}, "", "/rebates-incentives?embed=1");
    const { container } = renderPage();
    lookupCalifornia();
    expect(container.textContent).not.toContain("Edit this page");
    expect(container.querySelector("[contenteditable]")).toBeNull();
  });
});
