// Inline editing on an event page.
//
// Two risks are specific to events and neither exists on blog posts:
//
//  1. The page shows DERIVED text. eventLocationText substitutes a map pin for
//     a blank location, and eventDisplayTitle appends " - City" to an event
//     that has no site_events row. Editing those strings would write the
//     derived form into the column — and the title is part of the event's
//     dedupe key, which decides its slug, which is its URL. A save could move
//     the page out from under its own link.
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
// Rendered as a link so the tests can read the label AND the destination the
// page handed it — the two things an editor now controls. Keyed by formType
// because this same gate also renders "Add to calendar", which is not a
// Register button and must not be counted as one.
vi.mock("@/components/forms/EventActionGate", () => ({
  default: ({ href, label, formType }: { href: string; label: string; formType: string }) => (
    <a data-testid={`gate-${formType}`} href={href}>{label}</a>
  ),
}));

// "Nordic EV Summit 2027" with location "Oslo, Norway". It carries an id, so it
// is a site_events row and its stored title is shown verbatim. FEED is the same
// event without a row: that one still gets its city appended, and the appended
// form is exactly the string that must never be saved.
const BASE: EventItem = {
  id: "evt-1", month: "MAY", day: "12", year: 2027,
  title: "Nordic EV Summit 2027", type: "Summit",
  location: "Oslo, Norway", region: "Oslo, Norway",
  time: "May 12-13, 2027", description: "Europe's policy-leading EV gathering.",
  image: "https://example.com/e.jpg", slug: "nordic-ev-summit-2027",
};

/** The same event as it arrives from the aggregated feed: no row, no id. */
const FEED: EventItem = { ...BASE, id: undefined };

const ours = vi.hoisted(() => ({ value: [] as unknown[] }));
const external = vi.hoisted(() => ({ value: [] as unknown[] }));
const draft = vi.hoisted(() => ({ value: undefined as unknown }));
vi.mock("@/hooks/use-content", () => ({
  useEvents: () => ({ events: ours.value, loading: false }),
  // The page also asks for a draft behind this slug when the published lookup
  // misses. These tests are about the rendered page, not that lookup, so it
  // answers "no draft" -- but it must EXIST, or the component calls undefined.
  useDraftEvent: () => ({ event: draft.value, loading: false }),
}));
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
import { descriptionBlocks, blocksToText, descriptionPreview, splitEventDescription } from "@/lib/event-description";

beforeAll(() => { window.scrollTo = () => {}; });
afterEach(() => {
  cleanup();
  auth.value = { status: "signed-out" };
  ours.value = [];
  external.value = [];
  draft.value = undefined;
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
  it("shows a stored title exactly as the CMS holds it", () => {
    // The back end and the live page must read the same. Deriving on top of a
    // stored title is what produced "Roadmap Conference - Seattle, WA - WA
    // 98101" on eight live events.
    ours.value = [BASE];
    renderEvent();
    expect(screen.getByText("Nordic EV Summit 2027")).toBeTruthy();
    expect(screen.queryByText(/Nordic EV Summit 2027 - Oslo/)).toBeNull();
  });

  it("still appends the city for a feed event, which has no stored title", () => {
    ours.value = [FEED];
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

// The CTAs sit inside the floated poster column. The details block beside it is
// a later sibling whose animate-fade-up leaves a transform behind (fill mode
// forwards), which makes a stacking context; its box is full container width,
// because a float shortens line boxes and never the block box. Without a lift
// on the poster that block covers the buttons and every CTA on the page stops
// responding — Add to calendar, Share, Register, List Your Event and View more
// events all went dead this way. jsdom has no layout, so the guard is on the
// two classes that produce it rather than on a hit test.
// Bullets are typed, not marked up: an editor writes "- " or "•" at the start
// of a line and the reader gets a real list. The rule that matters most is the
// one about text that types NO bullets — that is every event on the site today,
// and it has to come out byte for byte as it did before.
describe("typed bullet lines become a real list", () => {
  it("leaves ordinary prose as one pre-line paragraph", () => {
    expect(descriptionBlocks("First line.\nSecond line.")).toEqual([
      { kind: "p", lines: ["First line.", "Second line."] },
    ]);
  });

  it("takes -, * and • as bullets, and drops the marker", () => {
    expect(descriptionBlocks("- one\n* two\n• three")).toEqual([
      { kind: "ul", items: ["one", "two", "three"] },
    ]);
  });

  it("keeps the prose around a list in its own paragraphs", () => {
    expect(descriptionBlocks("Visit our tent for:\n- savings\n- charging\nSee you there.")).toEqual([
      { kind: "p", lines: ["Visit our tent for:"] },
      { kind: "ul", items: ["savings", "charging"] },
      { kind: "p", lines: ["See you there."] },
    ]);
  });

  it("does not treat an em dash or a bare hyphen as a bullet", () => {
    // "— Denver, CO" and "well-known" must stay prose. Only a marker followed
    // by a space starts a list item.
    expect(descriptionBlocks("— Denver, CO\n-notabullet")).toEqual([
      { kind: "p", lines: ["— Denver, CO", "-notabullet"] },
    ]);
  });

  it("renders the list to the page, with the markers stripped", () => {
    ours.value = [{ ...BASE, description: "Come by for:\n- EV incentives\n- Public charging" }];
    const { container } = renderEvent();
    const items = [...container.querySelectorAll("li")].map((li) => li.textContent);
    expect(items).toEqual(["EV incentives", "Public charging"]);
    expect(container.textContent).not.toContain("- EV incentives");
  });

  // The block editor re-parses the stored string on every render and writes it
  // back through blocksToText, so anything the pair cannot round-trip would be
  // lost the moment an editor touched an unrelated part of the description.
  it("round-trips back to the same string through blocksToText", () => {
    for (const text of [
      "",
      "First line.\nSecond line.",
      "para one\n\npara two",
      "Visit our tent for:\n- savings\n- charging\nSee you there.",
      "Intro text.\n\n- one\n- two\n\nOutro text.",
      "\u2014 Denver, CO\n-notabullet",
    ]) {
      expect(blocksToText(descriptionBlocks(text))).toBe(text);
    }
  });

  it("settles * and \u2022 on a single marker once a description is edited", () => {
    // The parser drops the marker, so there is nowhere to remember which one
    // was typed. The reader sees the same list either way.
    expect(blocksToText(descriptionBlocks("- one\n* two\n\u2022 three"))).toBe("- one\n- two\n- three");
  });

  // The events list clamps a description to a couple of lines. Left as typed,
  // "- savings\n- charging" collapsed to "- savings - charging" there, which
  // reads as a typo rather than a list.
  it("flattens to a teaser with the markers off and the items separated", () => {
    expect(descriptionPreview("Visit our tent for:\n- savings\n- charging\nSee you there."))
      .toBe("Visit our tent for: savings \u00b7 charging See you there.");
  });

  it("leaves ordinary prose as one line, blank lines and all", () => {
    expect(descriptionPreview("Para one.\n\nPara two.")).toBe("Para one. Para two.");
    expect(descriptionPreview("")).toBe("");
  });
});

// A speaker panel is stored inline in the same description column, and the
// block editor writes a list as "- " lines. The entry splitter breaks on
// newlines but not on the marker, so without stripping it every speaker card on
// the events page showed "- Jane Doe".
describe("speakers typed as a bulleted list", () => {
  it("keeps the marker out of the speaker's name", () => {
    const { speakers } = splitEventDescription("Speakers Includes:\n- Jane Doe - ACME\n- John Smith - Beta Corp");
    expect(speakers).toEqual([
      { name: "Jane Doe", org: "ACME", role: undefined },
      { name: "John Smith", org: "Beta Corp", role: undefined },
    ]);
  });

  it("still reads the run-on form the events already store", () => {
    const { intro, speakers } = splitEventDescription(
      "A panel on charging. Speakers Includes: \u2022 Terry Travis (Moderator) - EVNoire \u2022 Jane Doe - ACME",
    );
    expect(intro).toBe("A panel on charging.");
    expect(speakers).toEqual([
      { name: "Terry Travis", org: "EVNoire", role: "Moderator" },
      { name: "Jane Doe", org: "ACME", role: undefined },
    ]);
  });
});

// An editor could not type a bullet into the description at all. It was one
// contentEditable span, and EditableText blurs a span on Enter, so there was no
// way to start a line — which is what sent an editor to the block palette, whose
// only insertion points bracket the page. Anything added there landed under the
// "Save your spot" band.
describe("an editor writes the description as blocks", () => {
  const prose = () => screen.getByPlaceholderText("Write a paragraph\u2026") as HTMLTextAreaElement;
  /** Show the working draft through the read-only components, as a visitor gets it. */
  const previewDraft = () => fireEvent.click(screen.getByTitle("Preview as a visitor"));

  it("keeps a line typed with Enter all the way to the rendered page", () => {
    asEditor();
    ours.value = [{ ...BASE, description: "One line only." }];
    const { container } = renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    const box = prose();
    fireEvent.change(box, { target: { value: "One line only.\nA second line." } });
    fireEvent.blur(box);
    previewDraft();
    const paras = [...container.querySelectorAll("p.whitespace-pre-line")].map((p) => p.textContent);
    expect(paras).toContain("One line only.\nA second line.");
  });

  it("does not eat the blank line between paragraphs when the box is merely focused", () => {
    asEditor();
    ours.value = [{ ...BASE, description: "Para one.\n\nPara two." }];
    const { container } = renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    const box = prose();
    expect(box.value).toBe("Para one.\n\nPara two.");
    fireEvent.blur(box);
    previewDraft();
    const paras = [...container.querySelectorAll("p.whitespace-pre-line")].map((p) => p.textContent);
    expect(paras).toContain("Para one.\n\nPara two.");
  });

  it("turns selected lines into a real list on the page, not text below the register band", () => {
    asEditor();
    ours.value = [{ ...BASE, description: "Bring these:\nEV incentives and savings" }];
    const { container } = renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    const box = prose();
    const at = box.value.indexOf("EV incentives and savings");
    box.setSelectionRange(at, at + "EV incentives and savings".length);
    fireEvent.click(screen.getByTitle("Bulleted list"));
    previewDraft();

    const desc = container.querySelector('div[class*="lg:clear-left"][class*="leading-relaxed"]')!;
    expect([...desc.querySelectorAll("li")].map((li) => li.textContent)).toEqual(["EV incentives and savings"]);
    // The register band is where the list used to end up.
    const band = container.querySelector('div[class*="gradient-hero"]')!;
    expect(band.querySelector("li")).toBeNull();
  });

  it("gives the description boxes instead of a contentEditable span", () => {
    asEditor();
    ours.value = [BASE];
    const { container } = renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    const desc = container.querySelector('div[class*="lg:clear-left"][class*="leading-relaxed"]')!;
    expect(desc.querySelector('[contenteditable="true"]')).toBeNull();
    expect(desc.querySelector("textarea")).toBeTruthy();
  });

  it("leaves a feed event's description alone, because it is not ours", () => {
    asEditor();
    external.value = [{ ...BASE, id: undefined, external: true }];
    const { container } = renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(container.querySelector("textarea")).toBeNull();
  });
});

// The description used to start in the half-width channel beside the floated
// poster and jump to full width partway through, so one paragraph rendered at
// two measures. It clears the float instead.
describe("the description clears the poster", () => {
  it("starts below the float rather than beside it", () => {
    ours.value = [BASE];
    const { container } = renderEvent();
    // The CTA row clears the float too, so match on the description's own
    // prose class rather than on lg:clear-left alone.
    const desc = container.querySelector('div[class*="lg:clear-left"][class*="leading-relaxed"]');
    expect(desc).toBeTruthy();
    expect(desc!.textContent).toContain("Europe's policy-leading EV gathering");
  });
});

describe("the poster column stays above the details block", () => {
  it("carries a stacking lift, so the CTAs under the poster stay clickable", () => {
    ours.value = [BASE];
    const { container } = renderEvent();
    const poster = container.querySelector('div[class*="lg:float-left"]');
    expect(poster).toBeTruthy();
    expect(poster!.className).toMatch(/(^|\s)z-\d+(\s|$)/);
    expect(poster!.className).toContain("relative");
  });

  it("is lifted above the sibling whose animation creates the layer", () => {
    ours.value = [BASE];
    const { container } = renderEvent();
    const poster = container.querySelector('div[class*="lg:float-left"]')!;
    const details = poster.nextElementSibling!;
    expect(details.className).toContain("animate-fade-up");
    expect(details.className).not.toMatch(/(^|\s)z-\d+(\s|$)/);
  });
});

describe("an editor edits the RAW value, not the displayed one", () => {
  it("puts the stored title in the editable box, without the appended city", () => {
    asEditor();
    ours.value = [FEED];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    // The derived form must be gone: saving it would rewrite the title, and the
    // title decides the slug.
    expect(screen.queryByText(/Nordic EV Summit 2027 - Oslo/)).toBeNull();
    expect(screen.getByText("Nordic EV Summit 2027")).toBeTruthy();
  });

  it("shows the derived title again when editing stops", () => {
    asEditor();
    ours.value = [FEED];
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

  it("offer no Register controls — there is nowhere to save them", () => {
    asEditor();
    external.value = [{ ...BASE, id: undefined, external: true, registerUrl: "https://feed.example/signup" }];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(screen.queryAllByPlaceholderText(LINK_PLACEHOLDER)).toHaveLength(0);
    // Its own link still works, it just isn't editable here.
    expect(screen.getAllByTestId("gate-event-register")[0].getAttribute("href")).toBe("https://feed.example/signup");
  });
});

// ── The two Register buttons ────────────────────────────────────────────────
// Both send people to one link (an event has one registration page) but carry
// their own words, because they read differently where they sit.
const LINK_PLACEHOLDER = "https://… or /page";
const linkBoxes = () => screen.getAllByPlaceholderText(LINK_PLACEHOLDER) as HTMLInputElement[];

describe("a visitor's Register buttons", () => {
  it("say Register and Register now when the event names nothing else", () => {
    ours.value = [{ ...BASE, registerUrl: "https://example.org/signup" }];
    renderEvent();
    const labels = screen.getAllByTestId("gate-event-register").map((el) => el.textContent);
    expect(labels).toEqual(["Register", "Register now"]);
  });

  it("say what the event says, when it says something", () => {
    ours.value = [{
      ...BASE, registerUrl: "https://example.org/signup",
      registerLabel: "Save my seat", registerCtaLabel: "Claim a spot",
    }];
    renderEvent();
    const labels = screen.getAllByTestId("gate-event-register").map((el) => el.textContent);
    expect(labels).toEqual(["Save my seat", "Claim a spot"]);
  });

  it("both point at the event's one registration link", () => {
    ours.value = [{ ...BASE, registerUrl: "https://example.org/signup" }];
    renderEvent();
    const hrefs = screen.getAllByTestId("gate-event-register").map((el) => el.getAttribute("href"));
    expect(hrefs).toEqual(["https://example.org/signup", "https://example.org/signup"]);
  });

  it("fall back to Contact us when the event has no link", () => {
    ours.value = [BASE];
    renderEvent();
    expect(screen.queryAllByTestId("gate-event-register")).toHaveLength(0);
    const contact = screen.getAllByRole("link", { name: /Register/ });
    expect(contact.map((el) => el.getAttribute("href"))).toEqual(["/contact-us", "/contact-us"]);
  });

  // The link is typed by an editor and handed to window.open, so a script URL
  // must never reach it. Treated as no link at all rather than opened.
  it("refuse a javascript: link and go to Contact us instead", () => {
    ours.value = [{ ...BASE, registerUrl: "javascript:alert(1)" }];
    renderEvent();
    expect(screen.queryAllByTestId("gate-event-register")).toHaveLength(0);
    expect(screen.getAllByRole("link", { name: /Register/ })[0].getAttribute("href")).toBe("/contact-us");
  });
});

describe("an editor changes the Register buttons on the page", () => {
  it("offers a text box and a link box on each button", () => {
    asEditor();
    ours.value = [BASE];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(screen.getAllByPlaceholderText("Register")).toHaveLength(1);
    expect(screen.getAllByPlaceholderText("Register now")).toHaveLength(1);
    expect(linkBoxes()).toHaveLength(2);
  });

  it("keeps one link between the two buttons", () => {
    asEditor();
    ours.value = [BASE];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    fireEvent.change(linkBoxes()[0], { target: { value: "https://example.org/signup" } });
    // The second box is the same field, so it must not still read blank —
    // otherwise whichever button an editor saved last would win.
    expect(linkBoxes().map((el) => el.value))
      .toEqual(["https://example.org/signup", "https://example.org/signup"]);
  });

  it("keeps the two button labels apart", () => {
    asEditor();
    ours.value = [BASE];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    fireEvent.change(screen.getByPlaceholderText("Register"), { target: { value: "Save my seat" } });
    expect((screen.getByPlaceholderText("Register") as HTMLInputElement).value).toBe("Save my seat");
    expect((screen.getByPlaceholderText("Register now") as HTMLInputElement).value).toBe("");
  });

  it("shows the event's stored link in the box, ready to change", () => {
    asEditor();
    ours.value = [{ ...BASE, registerUrl: "https://example.org/signup" }];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(linkBoxes()[0].value).toBe("https://example.org/signup");
  });

  // The live button opens the lead-capture dialog on click, so the one shown
  // while editing is an inert preview — see RegisterCta.
  it("does not leave a live Register button in the way", () => {
    asEditor();
    ours.value = [{ ...BASE, registerUrl: "https://example.org/signup" }];
    renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(screen.queryAllByTestId("gate-event-register")).toHaveLength(0);
  });
});

describe("an editor opening a DRAFT from the CMS", () => {
  // "Edit on page" in the CMS navigates to /events/<slug>. The public site only
  // fetches published events, so the draft was invisible here -- and because an
  // imported event usually still exists in the aggregated feed under the same
  // slug, the page silently rendered the FEED's copy instead. Feed events are
  // deliberately not editable, so the editor landed on their own draft's URL
  // looking at someone else's text with no editable fields.
  const FEED_TWIN = { ...BASE, id: undefined, external: true, title: "Santa Ana", description: "EV event in the U.S." };
  const DRAFT = { ...BASE, id: "draft-1", title: "Santa Ana EV Showcase", description: "The real write-up." };

  it("shows the draft, not the feed's copy of the same event", () => {
    external.value = [FEED_TWIN];
    draft.value = DRAFT;
    renderEvent();
    expect(screen.getByText("Santa Ana EV Showcase")).toBeTruthy();
    expect(screen.queryByText("EV event in the U.S.")).toBeNull();
  });

  it("gives the editor real editable fields on it", () => {
    // "Edit this page" alone proves nothing: that is the BLOCK builder, which an
    // editor gets on any page. What was missing is the event's OWN fields being
    // editable, and Field only renders a contentEditable box when the event is
    // ours. That is the thing to assert.
    asEditor();
    external.value = [FEED_TWIN];
    draft.value = DRAFT;
    const { container } = renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(container.querySelectorAll('[contenteditable="true"]').length).toBeGreaterThan(0);
  });

  it("still gives a feed event no editable fields, because it is not ours", () => {
    asEditor();
    external.value = [FEED_TWIN];
    draft.value = undefined;
    const { container } = renderEvent();
    fireEvent.click(screen.getByText(/Edit this page/i));
    expect(container.querySelectorAll('[contenteditable="true"]').length).toBe(0);
  });

  it("prefers a PUBLISHED row over both", () => {
    ours.value = [{ ...BASE, id: "published-1", title: "The published one" }];
    external.value = [FEED_TWIN];
    draft.value = DRAFT;
    renderEvent();
    expect(screen.getByText("The published one")).toBeTruthy();
  });
});
