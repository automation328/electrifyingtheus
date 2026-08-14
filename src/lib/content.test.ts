// Where an event's "Edit on page" button actually points.
//
// A DB event whose title + date match a curated one ADOPTS the curated slug.
// Re-deriving the slug in the admin would send you to /events/<generated> for
// exactly those events — the ones that matter most — and 404. This pins the
// behaviour so that can't creep back in.

import { describe, it, expect } from "vitest";
import { eventDetailPath, eventAdoptRow } from "@/lib/content";
import { EVENTS, type EventItem } from "@/data/events";

// The curated webinar: { month: "AUG", day: "27", year: 2026, slug: "from-pump-to-plug" }.
const CURATED_TITLE = "Part 2: From The Pump To The Plug - How Electric Vehicles Can Save You Thousands";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const row = (title: string, event_date: string) => ({ title, event_date, status: "published" } as any);

describe("adopting a curated event into the database", () => {
  // The row is only built when someone edits a curated event for the first
  // time. Getting event_date wrong would move the event AND change its slug,
  // because the slug is derived from title + date — so the page would 404.
  const curated = EVENTS.find((e) => e.slug === "from-pump-to-plug") as EventItem;

  it("rebuilds the ISO date from the display month, day and year", () => {
    // The curated entry is { month: "AUG", day: "27", year: 2026 }.
    expect(eventAdoptRow(curated).event_date).toBe("2026-08-27");
  });

  it("pads single-digit months and days", () => {
    const e = { ...curated, month: "JAN", day: "05", year: 2027 };
    expect(eventAdoptRow(e).event_date).toBe("2027-01-05");
  });

  it("handles a day stored without a leading zero", () => {
    const e = { ...curated, month: "MAR", day: "7", year: 2027 };
    expect(eventAdoptRow(e).event_date).toBe("2027-03-07");
  });

  it("carries the event's own words across, so adopting loses nothing", () => {
    const row = eventAdoptRow(curated);
    expect(row.title).toBe(curated.title);
    expect(row.location).toBe(curated.location);
    expect(row.time).toBe(curated.time);
    expect(row.description).toBe(curated.description);
    expect(row.image).toBe(curated.image);
  });

  it("arrives published, matching what a visitor already sees", () => {
    expect(eventAdoptRow(curated).status).toBe("published");
  });

  it("never produces a broken date, even from nonsense", () => {
    const e = { ...curated, month: "???", day: "", year: 2027 };
    expect(eventAdoptRow(e).event_date).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("round-trips: every curated event yields a parseable date", () => {
    for (const e of EVENTS) {
      const d = String(eventAdoptRow(e).event_date);
      expect(d).toMatch(/^\d{4}-\d{2}-\d{2}$/);
      expect(Number.isNaN(new Date(`${d}T00:00:00`).getTime())).toBe(false);
    }
  });
});

describe("an event's live page path", () => {
  it("uses the curated slug when the row matches a curated event", () => {
    expect(eventDetailPath(row(CURATED_TITLE, "2026-08-27"))).toBe("/events/from-pump-to-plug");
  });

  it("generates a slug for an event that matches nothing curated", () => {
    const path = eventDetailPath(row("Some Brand New Expo", "2027-09-07"));
    expect(path).toMatch(/^\/events\/some-brand-new-expo-/);
  });

  it("always returns a path under /events/", () => {
    expect(eventDetailPath(row("Another One", "2027-01-02"))).toMatch(/^\/events\/[a-z0-9-]+$/);
  });

  it("does not return the bare list page", () => {
    // The old config always linked to /events, which is what this replaces.
    expect(eventDetailPath(row(CURATED_TITLE, "2026-08-27"))).not.toBe("/events");
  });
});
