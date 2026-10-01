import { describe, it, expect } from "vitest";
import { RANGES, normalizeRange } from "./_analytics-core";

// The dashboard offered 24h / 7d / 30d / 90d, so "how did the site do over the
// last six months?" could not be answered from the UI at all — even though
// nothing prunes site_analytics and the rows were sitting there.

describe("analytics ranges", () => {
  it("reaches back six months and a year", () => {
    expect(RANGES["6m"]).toBe(182);
    expect(RANGES["12m"]).toBe(365);
  });

  it("keeps the short ranges exactly as they were", () => {
    expect(RANGES["24h"]).toBe(1);
    expect(RANGES["7d"]).toBe(7);
    expect(RANGES["30d"]).toBe(30);
    expect(RANGES["90d"]).toBe(90);
  });

  it("falls back to a week rather than trusting a client", () => {
    // The range arrives from a query string, so it is untrusted input: a bad
    // value must not become a window length.
    for (const bad of ["", "all", "999d", "-1", null, undefined, {}, "__proto__"]) {
      expect(normalizeRange(bad), String(bad)).toBe("7d");
    }
  });

  it("passes a supported range through untouched", () => {
    for (const key of Object.keys(RANGES)) {
      expect(normalizeRange(key)).toBe(key);
    }
  });
});
