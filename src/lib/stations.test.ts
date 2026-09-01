import { describe, it, expect } from "vitest";
import { kindOf, matchesLevel, connectorLabel, portSummary, distanceLabel, stationsQuery } from "./stations";

describe("kindOf", () => {
  it("separates DC fast from Level 2", () => {
    expect(kindOf({ dcFast: 16, level2: 0 })).toBe("dc");
    expect(kindOf({ dcFast: 0, level2: 4 })).toBe("l2");
  });

  // The common case at a mall or a dealership: fast chargers with L2 beside them.
  it("calls a station with both kinds 'both'", () => {
    expect(kindOf({ dcFast: 2, level2: 6 })).toBe("both");
  });

  // NREL reports null for a count it does not have; the proxy turns that into 0.
  it("falls back to 'other' when no ports are reported", () => {
    expect(kindOf({ dcFast: 0, level2: 0 })).toBe("other");
  });
});

describe("matchesLevel", () => {
  const dcOnly = { dcFast: 4, level2: 0 };
  const l2Only = { dcFast: 0, level2: 2 };
  const both = { dcFast: 4, level2: 2 };

  it("keeps everything under 'all'", () => {
    expect([dcOnly, l2Only, both].every((s) => matchesLevel(s, "all"))).toBe(true);
  });

  it("filters to stations carrying that kind", () => {
    expect(matchesLevel(dcOnly, "dc_fast")).toBe(true);
    expect(matchesLevel(l2Only, "dc_fast")).toBe(false);
    expect(matchesLevel(l2Only, "level2")).toBe(true);
    expect(matchesLevel(dcOnly, "level2")).toBe(false);
  });

  // A mixed station belongs in BOTH filters — a driver who wants Level 2 can use
  // the L2 ports there, and dropping it would hide a real option.
  it("keeps a mixed station under either filter", () => {
    expect(matchesLevel(both, "dc_fast")).toBe(true);
    expect(matchesLevel(both, "level2")).toBe(true);
  });
});

describe("connectorLabel", () => {
  // The codes are not what anyone calls them at the plug.
  it("translates NREL codes to plug names", () => {
    expect(connectorLabel("J1772COMBO")).toBe("CCS");
    expect(connectorLabel("TESLA")).toBe("NACS (Tesla)");
    expect(connectorLabel("CHADEMO")).toBe("CHAdeMO");
  });

  it("passes an unknown code through rather than dropping it", () => {
    expect(connectorLabel("SOMETHING_NEW")).toBe("SOMETHING_NEW");
  });
});

describe("portSummary", () => {
  it("lists DC fast first, then Level 2", () => {
    expect(portSummary({ dcFast: 2, level2: 6 })).toBe("2 DC fast · 6 Level 2");
  });

  it("names only what the station has", () => {
    expect(portSummary({ dcFast: 0, level2: 6 })).toBe("6 Level 2");
    expect(portSummary({ dcFast: 16, level2: 0 })).toBe("16 DC fast");
  });

  it("says so when NREL reported no counts", () => {
    expect(portSummary({ dcFast: 0, level2: 0 })).toBe("Ports not reported");
  });
});

describe("distanceLabel", () => {
  it("keeps a decimal close by and rounds further out", () => {
    expect(distanceLabel(1.24)).toBe("1.2 mi");
    expect(distanceLabel(12.6)).toBe("13 mi");
  });

  // Searching by coordinates returns no distance; an empty label renders nothing.
  it("renders nothing without a distance", () => {
    expect(distanceLabel(null)).toBe("");
  });
});

describe("stationsQuery", () => {
  it("sends whatever was searched for", () => {
    expect(stationsQuery({ q: "30031" }, "all")).toBe("q=30031");
    expect(stationsQuery({ q: "Atlanta, GA" }, "all")).toBe("q=atlanta%2C+ga");
  });

  // The response is CDN-cached per URL for a day, so every spelling variant of
  // the same place would otherwise be its own entry and its own upstream lookup.
  it("squares the text up so one place is one cache entry", () => {
    const one = stationsQuery({ q: "Atlanta, GA" }, "all");
    expect(stationsQuery({ q: "  atlanta,   ga " }, "all")).toBe(one);
    expect(stationsQuery({ q: "ATLANTA, GA" }, "all")).toBe(one);
  });

  // 'all' is the API default, so leaving it out keeps one CDN cache entry per
  // search rather than two that hold the same answer.
  it("omits the level for 'all' and sends it otherwise", () => {
    expect(stationsQuery({ q: "30031" }, "dc_fast")).toBe("q=30031&level=dc_fast");
  });

  // The server sizes the search from what it matched — fifteen miles around an
  // address, a few hundred around a state. Sending a radius every time would
  // flatten that back to one number for every kind of place.
  it("leaves the radius out unless the visitor picked one", () => {
    expect(stationsQuery({ q: "Georgia" }, "all")).toBe("q=georgia");
    expect(stationsQuery({ q: "Georgia" }, "all", null)).toBe("q=georgia");
    expect(stationsQuery({ q: "Georgia" }, "all", 50)).toBe("q=georgia&radius=50");
  });

  it("falls back to coordinates when there is no search text", () => {
    expect(stationsQuery({ lat: 33.89, lon: -84.07 }, "all", 25)).toBe("lat=33.89&lon=-84.07&radius=25");
  });

  // A half-typed search must not silently become a coordinate search elsewhere.
  it("sends nothing at all when it has neither", () => {
    expect(stationsQuery({}, "all")).toBe("");
  });
});
