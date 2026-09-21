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

describe("epaRangeFor, given what the listing says it is", () => {
  // The second half of the same complaint: a model year is often four cars. The
  // EPA rates the 2026 LYRIQ at 326 rear-drive, 319 PAWD, 303 AWD and 285 for
  // the V-Series, so every LYRIQ card read "285–326 mi" — a spread no LYRIQ on
  // the lot actually does.

  it("pins one figure when the drivetrain settles it", () => {
    expect(epaRangeFor("cadillac-lyriq", 2026, { drivetrain: "RWD", trim: "Sport" }))
      .toEqual({ rangeMi: 326 });
    expect(epaRangeFor("cadillac-lyriq", 2026))
      .toEqual({ rangeMi: 285, rangeMaxMi: 326 });
  });

  it("uses the trim when the drivetrain is not enough", () => {
    expect(epaRangeFor("cadillac-lyriq", 2026, { drivetrain: "AWD", trim: "V-Series" }))
      .toEqual({ rangeMi: 285 });
    // Luxury is not a word the EPA files under, so the AWD cars stay a band —
    // but a narrow one: 326 is rear-drive, and 285 is the V-Series, which this
    // car would have said it was.
    expect(epaRangeFor("cadillac-lyriq", 2026, { drivetrain: "AWD", trim: "Luxury" }))
      .toEqual({ rangeMi: 303, rangeMaxMi: 319 });
  });

  it("drops the badged trims a listing would have named", () => {
    // A dealer does not leave "GT" out of the trim field, so a Mach-E that says
    // Premium is not one — but "extended range" is an option, not a badge, and
    // is left in the band because listings do leave it out.
    expect(epaRangeFor("ford-mustang-mach-e", 2022, { drivetrain: "AWD", trim: "GT" }))
      .toEqual({ rangeMi: 260, rangeMaxMi: 270 });
    expect(epaRangeFor("ford-mustang-mach-e", 2022, { drivetrain: "AWD", trim: "Premium" }))
      .toEqual({ rangeMi: 224, rangeMaxMi: 312 });
    expect(epaRangeFor("cadillac-optiq", 2026, { drivetrain: "AWD", trim: "Luxury" }))
      .toEqual({ rangeMi: 303 });
  });

  it("finds a trim the EPA files under a catalog entry of its own", () => {
    // "Model 3 Performance" is its own catalog vehicle, but a dealer lists the
    // car as model "Model 3" with trim "Performance".
    expect(epaRangeFor("tesla-model-3", 2026, { trim: "Performance" }))
      .toEqual({ rangeMi: 309, rangeMaxMi: 314 });
    expect(epaRangeFor("tesla-model-3", 2025, { drivetrain: "AWD", trim: "Long Range AWD" }))
      .toEqual({ rangeMi: 346 });
    expect(epaRangeFor("nissan-leaf", 2025, { trim: "SV", drivetrain: "FWD" }))
      .toEqual({ rangeMi: 212 });
  });

  it("keeps the whole band rather than guessing", () => {
    const bare = epaRangeFor("nissan-leaf", 2025);
    expect(epaRangeFor("nissan-leaf", 2025, { trim: "S" })).toEqual(bare);
    expect(epaRangeFor("nissan-leaf", 2025, { trim: "Base 4dr Sedan" })).toEqual(bare);
    // A drivetrain no variant has is evidence about nothing.
    expect(epaRangeFor("nissan-leaf", 2025, { drivetrain: "AWD" })).toEqual(bare);
    expect(epaRangeFor("nissan-leaf", 2025, {})).toEqual(bare);
  });

  it("does not read a one-letter trim word as a badge", () => {
    // Hyundai sells an IONIQ 5 N (221 miles) and an IONIQ 5 SEL with the N Line
    // package (259-290). The lone "n" was handing the SEL the N's rating.
    const sel = epaRangeFor("hyundai-ioniq-5", 2025, { trim: "SEL", drivetrain: "AWD" });
    expect(epaRangeFor("hyundai-ioniq-5", 2025, { trim: "SEL N Package", drivetrain: "AWD" })).toEqual(sel);
    expect(epaRangeFor("hyundai-ioniq-5", 2025, { trim: "N Line", drivetrain: "AWD" })).toEqual(sel);
    // On its own it is the car.
    expect(epaRangeFor("hyundai-ioniq-5", 2025, { trim: "N", drivetrain: "AWD" })).toEqual({ rangeMi: 221 });
  });

  it("still says nothing when it knows nothing", () => {
    expect(epaRangeFor("not-a-car", 2020, { trim: "Long Range" })).toEqual({});
    expect(epaRangeFor("nissan-leaf", undefined, { trim: "SV" })).toEqual({});
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
