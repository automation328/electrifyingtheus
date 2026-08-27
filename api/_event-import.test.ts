// The weekly event import.
//
// This job writes to site_events on a schedule with nobody watching, so the
// parts that decide WHAT gets written are pinned here. The two that matter most:
//
//   1. the dedupe, because getting it wrong means every Monday re-adds the same
//      backlog until someone clears it by hand;
//   2. sourceKeyFromUrl agreeing with the client's sourceEventKey, because the
//      Events page uses that function to hide a feed event once we hold our own
//      copy — if the two disagree, an imported event renders TWICE.

import { describe, it, expect } from "vitest";
import {
  sourceKeyFromUrl, titleDateKey, isoDate, displayTime, importTitle, toDraftRow, pickNew,
  type FeedEvent,
} from "./_event-import";
import { sourceEventKey } from "@/hooks/use-external-events";

const ev = (over: Partial<FeedEvent> = {}): FeedEvent => ({
  title: "Ride and Drive",
  startISO: "2026-09-12T14:00:00.000Z",
  location: "Denver, CO",
  url: "https://driveelectricmonth.org/event?eventid=5301",
  ...over,
});

const KNOWN_NONE = { sourceKeys: new Set<string>(), titleDates: new Set<string>() };

describe("identifying a feed event", () => {
  it("reads the source id out of a Drive Electric Month URL", () => {
    expect(sourceKeyFromUrl("https://driveelectricmonth.org/event?eventid=5301")).toBe("5301");
  });

  it("reads the slug out of an EventCalendarApp URL", () => {
    // The real shape: the slug sits directly after the host, and the repeatId
    // query is dropped so every occurrence of a repeating event shares one key.
    expect(sourceKeyFromUrl("https://evaevents.eventcalendarapp.com/lafayette-cars-and-coffee-electric-avenue-1?repeatId=2"))
      .toBe("lafayette-cars-and-coffee-electric-avenue-1");
  });

  it("gives nothing for a URL with no id, or no URL at all", () => {
    expect(sourceKeyFromUrl("https://example.org/events/spring")).toBeNull();
    expect(sourceKeyFromUrl(undefined)).toBeNull();
    expect(sourceKeyFromUrl("")).toBeNull();
  });

  it("agrees with the client's sourceEventKey, which is the whole point", () => {
    // These two functions decide, independently, whether a feed event is one we
    // already hold. The server uses its answer to skip the import; the page uses
    // its answer to hide the feed copy. They must never disagree, or an event
    // appears twice on the live site.
    for (const u of [
      "https://driveelectricmonth.org/event?eventid=5301",
      "https://driveelectricmonth.org/event?eventid=5288&utm_source=x",
      "https://evaevents.eventcalendarapp.com/lafayette-cars-and-coffee-electric-avenue-1?repeatId=2",
      "https://example.org/events/spring",
      "",
    ]) {
      expect(sourceKeyFromUrl(u)).toBe(sourceEventKey(u));
    }
  });
});

describe("reading dates and times out of the feed", () => {
  it("takes the date in UTC, matching how the page reads it", () => {
    // Local parsing would move an evening event to the next day for half the
    // world, giving the stored row a different date -- and slug -- from the one
    // the site has been showing all along.
    expect(isoDate("2026-09-12T23:30:00.000Z")).toBe("2026-09-12");
    expect(isoDate("2026-01-05T00:00:00.000Z")).toBe("2026-01-05");
  });

  it("gives nothing for an unparseable date", () => {
    expect(isoDate("not a date")).toBeNull();
    expect(isoDate("")).toBeNull();
  });

  it("calls a midnight start 'All day' rather than 12:00 AM", () => {
    // A midnight-UTC start means the feed carried a date with no time.
    expect(displayTime("2026-09-12T00:00:00.000Z")).toBe("All day");
  });

  it("formats a real start time in Eastern", () => {
    const t = displayTime("2026-09-12T18:00:00.000Z");
    expect(t).toMatch(/^2:00\s?PM\s+EDT$/);
  });
});

describe("naming an imported event", () => {
  it("appends the city to the generic feed title", () => {
    // Dozens of feed events share this exact title. Stored as-is, the CMS fills
    // with identically-named rows nobody can tell apart.
    expect(importTitle("National Drive Electric Month", "Lawrence Township, NJ"))
      .toBe("National Drive Electric Month — Lawrence Township, NJ");
  });

  it("leaves a real event name alone", () => {
    expect(importTitle("Knoxville Drive Electric Festival", "Knoxville, TN"))
      .toBe("Knoxville Drive Electric Festival");
  });

  it("does not append a placeholder location", () => {
    expect(importTitle("National Drive Electric Month", "See event details"))
      .toBe("National Drive Electric Month");
  });
});

describe("building the row", () => {
  it("stores a draft, kept off the homepage", () => {
    const row = toDraftRow(ev())!;
    expect(row.status).toBe("draft");        // invisible to the site until published
    expect(row.hero_hidden).toBe(true);      // 0018 -- never the homepage carousel
    expect(row.featured).toBe(false);
    expect(row.event_date).toBe("2026-09-12");
    expect(row.register_url).toBe("https://driveelectricmonth.org/event?eventid=5301");
  });

  it("refuses an event with no usable date or no title", () => {
    // event_date is NOT NULL and drives sorting, the slug and isActive.
    expect(toDraftRow(ev({ startISO: "nonsense" }))).toBeNull();
    expect(toDraftRow(ev({ title: "   " }))).toBeNull();
  });

  it("keeps a genuine multi-day span and discards a fake one", () => {
    expect(toDraftRow(ev({ endISO: "2026-09-14T14:00:00.000Z" }))!.end_date).toBe("2026-09-14");
    // Same day, or earlier: noise from the feed. Storing it would render a
    // one-day "range" on the card.
    expect(toDraftRow(ev({ endISO: "2026-09-12T20:00:00.000Z" }))!.end_date).toBeNull();
    expect(toDraftRow(ev({ endISO: "2026-09-01T14:00:00.000Z" }))!.end_date).toBeNull();
  });

  it("leaves the image null rather than inventing one", () => {
    // A null image gets the site's placeholder anyway, and tells an editor at a
    // glance which drafts still want a real picture.
    expect(toDraftRow(ev())!.image).toBeNull();
    expect(toDraftRow(ev({ image: "https://cdn.example/x.jpg" }))!.image).toBe("https://cdn.example/x.jpg");
  });

  it("falls back to a usable location and description", () => {
    const row = toDraftRow(ev({ location: "", description: "" }))!;
    expect(row.location).toBe("See event details");
    expect(String(row.description).length).toBeGreaterThan(0);
  });
});

describe("choosing what to import", () => {
  const TODAY = "2026-09-01";

  it("skips events that have already happened", () => {
    const feed = [ev({ startISO: "2026-08-01T14:00:00.000Z" }), ev({ url: "x", startISO: "2026-09-20T14:00:00.000Z" })];
    const { fresh } = pickNew(feed, KNOWN_NONE, TODAY);
    expect(fresh).toHaveLength(1);
    expect(fresh[0].startISO).toBe("2026-09-20T14:00:00.000Z");
  });

  it("keeps an event happening today", () => {
    const { fresh } = pickNew([ev({ startISO: `${TODAY}T14:00:00.000Z` })], KNOWN_NONE, TODAY);
    expect(fresh).toHaveLength(1);
  });

  it("skips an event we already hold, matched on its source id", () => {
    const known = { sourceKeys: new Set(["5301"]), titleDates: new Set<string>() };
    expect(pickNew([ev()], known, TODAY).fresh).toHaveLength(0);
  });

  it("skips an event we already hold even when it was renamed", () => {
    // The 0019 import rewrote titles that were unusable as-is, so the two copies
    // no longer agree on the name. The source id is what still matches.
    const known = { sourceKeys: new Set(["5301"]), titleDates: new Set<string>() };
    expect(pickNew([ev({ title: "Completely Different Name" })], known, TODAY).fresh).toHaveLength(0);
  });

  it("falls back to title + date when the URL carries no id", () => {
    const e = ev({ url: "https://example.org/events/spring", title: "Spring EV Expo" });
    const known = { sourceKeys: new Set<string>(), titleDates: new Set([titleDateKey("Spring EV Expo", "2026-09-12")]) };
    expect(pickNew([e], known, TODAY).fresh).toHaveLength(0);
  });

  it("does not import the same event twice from one run", () => {
    // A feed can list an event more than once. Without this, the first Monday
    // creates duplicate drafts that a person then has to delete.
    const { fresh } = pickNew([ev(), ev(), ev()], KNOWN_NONE, TODAY);
    expect(fresh).toHaveLength(1);
  });

  it("counts what it looked at, not just what it took", () => {
    const feed = [
      ev(),                                                          // fresh
      ev({ url: "https://driveelectricmonth.org/event?eventid=99" }), // known
      ev({ url: "y", startISO: "2026-01-01T00:00:00.000Z" }),        // past
      ev({ url: "z", startISO: "broken" }),                          // unusable
    ];
    const known = { sourceKeys: new Set(["99"]), titleDates: new Set<string>() };
    const { usable, fresh } = pickNew(feed, known, TODAY);
    expect(usable).toHaveLength(2);   // past and unusable both excluded
    expect(fresh).toHaveLength(1);
  });
});
