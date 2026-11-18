import { existsSync } from "node:fs";
import { describe, expect, it } from "vitest";
import { EVENTS } from "@/data/events";
import { OG_ENTRIES } from "../../og-data";
import { OG_EVENTS } from "../../og-events";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

describe("share previews", () => {
  it("has a prepared flyer for every built-in event (else run: npx vite-node scripts/make-og-events.ts)", () => {
    const expected = EVENTS.filter((e) => e.slug && typeof e.image === "string").map((e) => ({
      slug: e.slug,
      title: e.title.trim(),
      date: `${e.year}-${String(MONTHS.indexOf(e.month) + 1).padStart(2, "0")}-${String(Number(e.day) || 0).padStart(2, "0")}`,
    }));
    expect(OG_EVENTS.map(({ slug, title, date }) => ({ slug, title, date }))).toEqual(expected);
  });

  it("points every page and event at an image that exists", () => {
    const missing = [...OG_ENTRIES, ...OG_EVENTS]
      .map((e) => e.image)
      .filter((img) => !img.startsWith("http") && !existsSync(`public${img}`));
    expect(missing).toEqual([]);
  });

  it("gives every page its own image", () => {
    const byImage = new Map<string, string[]>();
    for (const e of OG_ENTRIES) byImage.set(e.image, [...(byImage.get(e.image) ?? []), e.path]);
    // Pages that are the same subject on purpose: the blog post about the
    // webinar, and the old URL of the Part 2 webinar.
    const allowed = [["/blog/from-the-pump-to-the-plug-ev-savings-webinar", "/save-with-evs-webinar"], ["/from-pump-to-plug-part-2", "/events/from-pump-to-plug"], ["/news", "/blog"]];
    const shared = [...byImage.values()].filter((paths) => paths.length > 1)
      .filter((paths) => !allowed.some((a) => a.length === paths.length && a.every((p) => paths.includes(p))));
    expect(shared).toEqual([]);
  });
});
