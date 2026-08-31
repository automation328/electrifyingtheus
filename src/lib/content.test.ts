// Where an event's "Edit on page" button actually points.
//
// A DB event whose title + date match a curated one ADOPTS the curated slug.
// Re-deriving the slug in the admin would send you to /events/<generated> for
// exactly those events — the ones that matter most — and 404. This pins the
// behaviour so that can't creep back in.

import { describe, it, expect } from "vitest";
import { eventDetailPath, eventAdoptRow, mergeEvents, mergeGallery } from "@/lib/content";
import { GALLERY_PHOTOS, GALLERY_VIDEOS, type GalleryVideo } from "@/data/gallery";
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

describe("giving an event an end date", () => {
  // The slug is built from title + START date. If an end date ever leaked into
  // that key, every event that gained a range would move to a new URL and its
  // existing links would 404. This is the guard on that.
  const curated = EVENTS.find((e) => e.slug === "from-pump-to-plug") as EventItem;

  it("does not move the event's page", () => {
    const single = row(CURATED_TITLE, "2026-08-27");
    const spanning = { ...row(CURATED_TITLE, "2026-08-27"), end_date: "2026-09-30" };
    expect(eventDetailPath(spanning)).toBe(eventDetailPath(single));
    expect(eventDetailPath(spanning)).toBe("/events/from-pump-to-plug");
  });

  it("adopts a curated single-day event with no end date", () => {
    expect(eventAdoptRow(curated).end_date).toBeNull();
  });

  it("carries a span across when adopting, instead of flattening it", () => {
    const span = { ...curated, endDate: "2026-09-30" };
    expect(eventAdoptRow(span).end_date).toBe("2026-09-30");
    // The start must survive the round trip untouched.
    expect(eventAdoptRow(span).event_date).toBe("2026-08-27");
  });
});

describe("keeping an event off the homepage hero (0018)", () => {
  // HeroSection takes the two SOONEST events that don't set heroHidden, so this
  // flag is the only thing standing between a bulk import of other people's
  // events and our own front page.
  const hidden = EVENTS.find((e) => e.heroHidden) as EventItem;
  const shown = EVENTS.find((e) => !e.heroHidden) as EventItem;

  it("carries heroHidden into the adopted row", () => {
    expect(eventAdoptRow(hidden).hero_hidden).toBe(true);
    expect(eventAdoptRow(shown).hero_hidden).toBe(false);
  });

  // site_events.hero_hidden is NOT NULL, and every row written before 0018
  // answers false. `??` would read that false as an answer and overrule the
  // curated flag; `||` keeps the curated one. Either side saying "hide" wins.
  it("does not let a pre-0018 row un-hide a curated event", () => {
    const asRow: EventItem = { ...hidden, id: "row-1", heroHidden: false };
    const merged = mergeEvents([asRow]);
    const found = merged.find((e) => e.title === hidden.title);
    expect(found?.heroHidden).toBe(true);
  });

  it("honours a row that asks to be hidden when nothing curated matches", () => {
    const imported: EventItem = {
      id: "row-2", month: "SEP", day: "11", year: 2026,
      title: "An imported third-party event", type: "EV Showcase",
      location: "Raleigh, NC", region: "Raleigh, NC", time: "3:00 pm",
      description: "", image: "", heroHidden: true,
    };
    const found = mergeEvents([imported]).find((e) => e.id === "row-2");
    expect(found?.heroHidden).toBe(true);
  });
});

describe("removal markers when the curated day is unpadded (0016)", () => {
  // data/events.ts stores the day as the author typed it — six entries use a
  // bare "1", "5", "6", "7", "8" or "9" — while rowToEvent pads it to two
  // digits. eventDedupe used the raw string, so a marker keyed …|2026-SEP-09
  // never matched the event keyed …|2026-SEP-9. The marker did nothing, the
  // event stayed on the live site, and the CMS showed it as REMOVED because
  // CollectionManager.keyOf builds its key from the already-padded event_date.
  const curated = EVENTS.find((e) => e.title === "Fleet Charging and Meet-Up") as EventItem;

  it("the curated entry really is unpadded — the precondition for the bug", () => {
    expect(curated.day).toBe("9");
  });

  it("a marker carrying the padded day still removes it", () => {
    const marker: EventItem = { ...curated, id: "marker-1", day: "09", hidden: true };
    const merged = mergeEvents([marker]);
    expect(merged.find((e) => e.title === curated.title)).toBeUndefined();
  });

  it("and the marker itself is never rendered as an event", () => {
    const marker: EventItem = { ...curated, id: "marker-1", day: "09", hidden: true };
    expect(mergeEvents([marker]).some((e) => e.id === "marker-1")).toBe(false);
  });
});

// ── gallery: the same media must not render twice ────────────────────────────
//
// The CMS "import" button writes the curated seed into site_gallery and strips
// the __static marker, so the row is indistinguishable from an upload. The
// gallery used to concatenate rows and seed unconditionally, which showed every
// imported video and photo twice on /gallery.

describe("merging gallery rows with the curated seed", () => {
  const curatedVideo = GALLERY_VIDEOS[0];
  const curatedPhoto = GALLERY_PHOTOS[0];

  it("keeps the curated entries when the database is empty", () => {
    const merged = mergeGallery({ photos: [], videos: [] });
    expect(merged.videos).toHaveLength(GALLERY_VIDEOS.length);
    expect(merged.photos).toHaveLength(GALLERY_PHOTOS.length);
  });

  it("drops the curated copy of a video a row already carries", () => {
    // What galleryStaticRows writes, round-tripped through fetchGallery: a file
    // video keeps its src, an embed keeps its id.
    const asRow: GalleryVideo = { ...curatedVideo, title: "Renamed in the CMS" };
    const merged = mergeGallery({ photos: [], videos: [asRow] });
    const key = (v: GalleryVideo) => v.id ?? v.src;
    expect(merged.videos.filter((v) => key(v) === key(curatedVideo))).toHaveLength(1);
  });

  it("and the row wins, so a CMS edit is what shows", () => {
    const asRow: GalleryVideo = { ...curatedVideo, title: "Renamed in the CMS" };
    const merged = mergeGallery({ photos: [], videos: [asRow] });
    expect(merged.videos[0].title).toBe("Renamed in the CMS");
  });

  it("drops the curated copy of a photo a row already carries", () => {
    const asRow = { ...curatedPhoto, caption: "Renamed in the CMS" };
    const merged = mergeGallery({ photos: [asRow], videos: [] });
    expect(merged.photos.filter((p) => p.src === curatedPhoto.src)).toHaveLength(1);
  });

  it("keeps a row that matches nothing curated", () => {
    const uploaded: GalleryVideo = { provider: "file", title: "", src: "/media/uploaded.mp4" };
    const merged = mergeGallery({ photos: [], videos: [uploaded] });
    expect(merged.videos).toHaveLength(GALLERY_VIDEOS.length + 1);
    expect(merged.videos[0].src).toBe("/media/uploaded.mp4");
  });
});
