// The Events list is our own events plus an aggregated feed that already
// carries many of the same events. What the dedupe DROPS is invisible on the
// page, so it gets tests: the bug it exists to prevent is silent in both
// directions — a duplicate looks like an import mistake, and a suppression that
// fails to apply looks like the CMS ignoring an editor.

import { describe, it, expect } from "vitest";
import { mergeFeedEvents } from "@/lib/event-feed";
import type { EventItem } from "@/data/events";

// Far enough out that these stay upcoming for the life of this test file.
const YEAR = new Date().getFullYear() + 3;

const ev = (title: string, registerUrl?: string, day = "11"): EventItem =>
  ({
    month: "SEP", day, year: YEAR,
    title, type: "EV Event", location: "Denver, CO", region: "Denver, CO",
    time: "11a - 4p", description: "", image: "", registerUrl,
  }) as EventItem;

const FEED_URL = "https://driveelectricmonth.org/event?eventid=5361";
const OTHER_FEED_URL = "https://evaevents.eventcalendarapp.com/poutinefest-usa";

describe("the Events list dedupes the feed against our own events", () => {
  it("keeps a feed event we do not hold ourselves", () => {
    const out = mergeFeedEvents([], [ev("Santa Ana", FEED_URL)], []);
    expect(out.map((e) => e.title)).toEqual(["Santa Ana"]);
  });

  it("drops the feed copy of an event we publish ourselves", () => {
    const out = mergeFeedEvents([ev("Santa Ana - Santa Ana, CA", FEED_URL)], [ev("Santa Ana", FEED_URL)], []);
    expect(out.map((e) => e.title)).toEqual(["Santa Ana - Santa Ana, CA"]);
  });

  it("keeps a feed event whose link carries no source id — a guess would lose a real event", () => {
    const out = mergeFeedEvents(
      [ev("Ours", "https://example.com/tickets")],
      [ev("Theirs", "https://example.com/tickets")],
      [],
    );
    expect(out.map((e) => e.title)).toEqual(["Ours", "Theirs"]);
  });
});

// The regression this file was written for. Archiving an imported event used to
// bring its feed twin back: the row left the visible set, and the dedupe was
// built from the visible set alone, so the suppression left with it.
describe("a row the site does not show still suppresses its feed twin", () => {
  it("drops the feed copy of an archived or draft event", () => {
    const out = mergeFeedEvents([], [ev("Santa Ana", FEED_URL)], [FEED_URL]);
    expect(out).toEqual([]);
  });

  it("matches on the source id, not the URL, so a rewritten link still suppresses", () => {
    // The stored row and the feed entry rarely agree character for character —
    // tracking parameters, http vs https, a trailing slash. Both sides reduce to
    // eventid=5361.
    const out = mergeFeedEvents(
      [],
      [ev("Santa Ana", "http://driveelectricmonth.org/event?eventid=5361&utm_source=x")],
      ["https://driveelectricmonth.org/event?eventid=5361"],
    );
    expect(out).toEqual([]);
  });

  it("suppresses eventcalendarapp links too", () => {
    const out = mergeFeedEvents([], [ev("PoutineFest USA", OTHER_FEED_URL)], [OTHER_FEED_URL]);
    expect(out).toEqual([]);
  });

  it("suppresses only the event named, leaving the rest of the feed alone", () => {
    const out = mergeFeedEvents(
      [],
      [ev("Santa Ana", FEED_URL), ev("PoutineFest USA", OTHER_FEED_URL)],
      [FEED_URL],
    );
    expect(out.map((e) => e.title)).toEqual(["PoutineFest USA"]);
  });

  it("ignores a suppression whose link carries no source id", () => {
    const out = mergeFeedEvents([], [ev("Theirs", "https://example.com/x")], ["https://example.com/x"]);
    expect(out.map((e) => e.title)).toEqual(["Theirs"]);
  });

  it("behaves as before when the suppression list is missing entirely", () => {
    // A database that has not run 0030 yet, or a failed fetch. The page must
    // still render — one feed event too many beats an empty Events page.
    const out = mergeFeedEvents([], [ev("Santa Ana", FEED_URL)]);
    expect(out.map((e) => e.title)).toEqual(["Santa Ana"]);
  });
});

describe("ordering", () => {
  it("puts our own events first, then the feed, each soonest first", () => {
    const out = mergeFeedEvents(
      [ev("Ours later", undefined, "20"), ev("Ours sooner", undefined, "12")],
      [ev("Feed later", undefined, "25"), ev("Feed sooner", undefined, "15")],
      [],
    );
    expect(out.map((e) => e.title)).toEqual(["Ours later", "Ours sooner", "Feed sooner", "Feed later"]);
  });
});
