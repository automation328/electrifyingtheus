// Where an event's "Edit on page" button actually points.
//
// A DB event whose title + date match a curated one ADOPTS the curated slug.
// Re-deriving the slug in the admin would send you to /events/<generated> for
// exactly those events — the ones that matter most — and 404. This pins the
// behaviour so that can't creep back in.

import { describe, it, expect } from "vitest";
import { eventDetailPath } from "@/lib/content";

// The curated webinar: { month: "AUG", day: "27", year: 2026, slug: "from-pump-to-plug" }.
const CURATED_TITLE = "Part 2: From The Pump To The Plug - How Electric Vehicles Can Save You Thousands";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const row = (title: string, event_date: string) => ({ title, event_date, status: "published" } as any);

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
