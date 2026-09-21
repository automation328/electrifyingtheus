import { describe, it, expect } from "vitest";
import { EV_RANGE_BY_YEAR, epaRangeFor } from "./ev-range-by-year";
import { EV_CATALOG } from "./ev-catalog";

// The bug this file exists to stop: the marketplace showed every Nissan LEAF as
// a 303-mile car, because the catalog holds one range per nameplate and 303 is
// the 2026 figure. A 2013 LEAF does 75 miles. Someone shopping for a cheap used
// EV was being told it goes four times as far as it does.

describe("epaRangeFor", () => {
  it("gives a 2013 LEAF its own range, not a 2026 LEAF's", () => {
    expect(epaRangeFor("nissan-leaf", 2013)).toEqual({ rangeMi: 75 });
    expect(epaRangeFor("nissan-leaf", 2011)).toEqual({ rangeMi: 73 });
    expect(epaRangeFor("nissan-leaf", 2018)).toEqual({ rangeMi: 151 });
  });

  it("returns the band when a model year sold more than one battery", () => {
    // The 2019 LEAF came as a 40 kWh car and a 62 kWh car. Quoting either single
    // figure is wrong for half the listings, so the card says "150–226".
    expect(epaRangeFor("nissan-leaf", 2019)).toEqual({ rangeMi: 150, rangeMaxMi: 226 });
    expect(epaRangeFor("tesla-model-s", 2013)).toEqual({ rangeMi: 139, rangeMaxMi: 265 });
  });

  it("tracks a car whose range grew over its life", () => {
    const early = epaRangeFor("tesla-model-3", 2018).rangeMi!;
    const late = epaRangeFor("tesla-model-3", 2025).rangeMi!;
    expect(early).toBeLessThan(late);
    expect(epaRangeFor("chevy-bolt-ev", 2017)).toEqual({ rangeMi: 238 });
    expect(epaRangeFor("chevy-bolt-ev", 2020)).toEqual({ rangeMi: 259 });
  });

  it("falls back to a neighbouring year, but not to a distant one", () => {
    const years = Object.keys(EV_RANGE_BY_YEAR["honda-clarity-electric"]).map(Number);
    const newest = Math.max(...years); // 2019 — the car stopped being made
    expect(epaRangeFor("honda-clarity-electric", newest + 1).rangeMi).toBe(89);
    // Ten years on from anything we hold is not evidence about this car.
    expect(epaRangeFor("honda-clarity-electric", newest + 10)).toEqual({});
  });

  it("says nothing rather than guessing for a car or year it has never seen", () => {
    expect(epaRangeFor("ford-e-transit", 2023)).toEqual({});
    expect(epaRangeFor("not-a-car", 2020)).toEqual({});
    expect(epaRangeFor("nissan-leaf", undefined)).toEqual({});
  });
});

describe("the generated table", () => {
  it("covers the cars people actually find second-hand", () => {
    for (const id of [
      "nissan-leaf", "tesla-model-3", "tesla-model-s", "chevy-bolt-ev", "bmw-i3",
      "vw-e-golf", "hyundai-kona-electric", "kia-soul-ev", "ford-focus-electric",
      "mitsubishi-i-miev", "chevy-spark-ev", "honda-fit-ev",
    ]) {
      expect(Object.keys(EV_RANGE_BY_YEAR[id] ?? {}).length, id).toBeGreaterThan(0);
    }
  });

  it("only names cars the catalog knows", () => {
    const known = new Set(EV_CATALOG.map((e) => e.id));
    const strays = Object.keys(EV_RANGE_BY_YEAR).filter((id) => !known.has(id));
    expect(strays).toEqual([]);
  });

  it("holds plausible figures, in order, for real model years", () => {
    for (const [id, byYear] of Object.entries(EV_RANGE_BY_YEAR)) {
      for (const [year, band] of Object.entries(byYear)) {
        expect(Number(year), id).toBeGreaterThanOrEqual(2010);
        expect(Number(year), id).toBeLessThanOrEqual(2030);
        expect(band[0], `${id} ${year}`).toBeGreaterThan(20);
        expect(band[band.length - 1], `${id} ${year}`).toBeLessThan(600);
        if (band.length === 2) expect(band[0]).toBeLessThan(band[1]);
      }
    }
  });
});
