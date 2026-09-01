// Turning typed text into a place, and a place into a search radius.
//
// Only the pure parts are tested — the three fetches are not mocked, matching
// the rest of api/. That is not a gap: every real bug this code has had was in
// the pure parts. A geocoder resolves "GA" to Gainesville, Florida and a bare
// "Georgia" to the country in the Caucasus, so the fifty-one states are matched
// from a table BEFORE anything is searched for; and the radius has to come from
// the size of what was matched, or a state search is a fifteen-mile circle in a
// field and an address search is half a time zone.

import { describe, it, expect } from "vitest";
import {
  matchUsState, isZip, classifyPlace, halfDiagonalMiles, radiusForPlace, placeLabel,
  DEFAULT_RADIUS, MAX_RADIUS,
} from "./_geocode";

describe("matchUsState", () => {
  it("takes a code or a name, however it is typed", () => {
    expect(matchUsState("GA")).toEqual({ abbr: "GA", name: "Georgia" });
    expect(matchUsState("ga")).toEqual({ abbr: "GA", name: "Georgia" });
    expect(matchUsState("Ga.")).toEqual({ abbr: "GA", name: "Georgia" });
    expect(matchUsState("georgia")).toEqual({ abbr: "GA", name: "Georgia" });
    expect(matchUsState("  New   Mexico ")).toEqual({ abbr: "NM", name: "New Mexico" });
    expect(matchUsState("District of Columbia")).toEqual({ abbr: "DC", name: "District of Columbia" });
  });

  // The whole point of matching EXACTLY. "Georgia Avenue" is a street and
  // "Washington, DC" is a city; sending either down the state path would sweep
  // a few hundred miles for somewhere you could walk to.
  it("does not match a string that merely contains a state", () => {
    expect(matchUsState("Georgia Avenue")).toBeNull();
    expect(matchUsState("Washington, DC")).toBeNull();
    expect(matchUsState("Atlanta, GA")).toBeNull();
    expect(matchUsState("")).toBeNull();
    expect(matchUsState("30031")).toBeNull();
  });
});

describe("isZip", () => {
  it("is five digits and nothing else", () => {
    expect(isZip("30031")).toBe(true);
    expect(isZip(" 30031 ")).toBe(true);
    expect(isZip("3003")).toBe(false);
    expect(isZip("30031-1234")).toBe(false);
    expect(isZip("Atlanta")).toBe(false);
  });
});

describe("classifyPlace", () => {
  // A house number is the giveaway, whatever the feature is tagged as. The
  // college in the bug report comes back as amenity/college and a government
  // building as office/government, so an osm_value allowlist misses both.
  it("calls anything with a house number an address", () => {
    expect(classifyPlace({ housenumber: "1000", osm_value: "college" })).toBe("address");
    expect(classifyPlace({ housenumber: "1600", osm_value: "government" })).toBe("address");
  });

  it("reads the place type otherwise", () => {
    expect(classifyPlace({ osm_value: "city" })).toBe("city");
    expect(classifyPlace({ osm_value: "town" })).toBe("city");
    expect(classifyPlace({ osm_value: "county" })).toBe("county");
    expect(classifyPlace({ osm_value: "state" })).toBe("state");
  });

  // Wrong small rather than wrong large: a tight ring finds nothing and the page
  // offers to widen it, while a wide one quietly answers a different question.
  it("treats anything it does not recognise as a point", () => {
    expect(classifyPlace({ osm_value: "supermarket" })).toBe("address");
    expect(classifyPlace({})).toBe("address");
  });
});

describe("halfDiagonalMiles", () => {
  // Photon's live extent for Atlanta, which is [west, north, east, south] —
  // NOT the order its own prose claims. ~16 miles tall, ~15 wide.
  it("measures a real bounding box", () => {
    const atlanta = [-84.550854, 33.886823, -84.28956, 33.6479187];
    expect(halfDiagonalMiles(atlanta)).toBeCloseTo(11.1, 0);
  });

  it("is about nothing for a single building", () => {
    expect(halfDiagonalMiles([-84.0126338, 33.985871, -83.9975834, 33.9763087])!).toBeLessThan(1);
  });

  it("gives up on a box it cannot read", () => {
    expect(halfDiagonalMiles(undefined)).toBeNull();
    expect(halfDiagonalMiles([1, 2, 3])).toBeNull();
    expect(halfDiagonalMiles(["a", "b", "c", "d"])).toBeNull();
  });
});

describe("radiusForPlace", () => {
  it("leaves a ZIP or an address on the page's own default", () => {
    expect(radiusForPlace("zip")).toBe(DEFAULT_RADIUS);
    expect(radiusForPlace("address", [-84.01, 33.98, -83.99, 33.97])).toBe(DEFAULT_RADIUS);
  });

  // Atlanta's box works out at ~11 miles, which floors up to 12 — so the
  // ordinary city search barely moves off the 15 the page always used.
  it("gives a city a city-sized ring", () => {
    expect(radiusForPlace("city", [-84.550854, 33.886823, -84.28956, 33.6479187])).toBe(13);
    expect(radiusForPlace("city", undefined)).toBe(20);
  });

  it("covers a state, and never asks for more than the API allows", () => {
    // Georgia: ~213-mile half-diagonal. Rhode Island: ~38.
    const georgia = radiusForPlace("state", [-85.605165, 35.000771, -80.839729, 30.355757]);
    expect(georgia).toBeGreaterThan(150);
    expect(georgia).toBeLessThanOrEqual(MAX_RADIUS);
    // Alaska's box crosses the antimeridian and computes to thousands of miles.
    // The ceiling is what keeps that from becoming an invalid upstream request.
    expect(radiusForPlace("state", [-179.9, 71.5, 179.9, 51.2])).toBe(MAX_RADIUS);
    // A small state still gets a floor big enough to be worth searching.
    expect(radiusForPlace("state", [-71.9, 42.02, -71.12, 41.14])).toBe(60);
  });
});

describe("placeLabel", () => {
  it("names the place back the way a person would", () => {
    expect(placeLabel({ name: "Atlanta", state: "Georgia" })).toBe("Atlanta, Georgia");
    expect(placeLabel({ name: "Georgia Gwinnett College", city: "Lawrenceville", state: "Georgia" }))
      .toBe("Georgia Gwinnett College, Lawrenceville, Georgia");
  });

  // Photon repeats the name in `city` for a city, and in `state` for a state.
  it("does not say the same word twice", () => {
    expect(placeLabel({ name: "Atlanta", city: "Atlanta", state: "Georgia" })).toBe("Atlanta, Georgia");
    expect(placeLabel({ name: "Georgia", state: "Georgia" })).toBe("Georgia");
  });
});
