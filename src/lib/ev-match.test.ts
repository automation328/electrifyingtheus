import { describe, it, expect } from "vitest";
import { recommendEvs } from "./ev-match";
import { vehicles, getVehicleById, getVehiclesByType } from "@/data/vehicles";

const rec = (id: string) => recommendEvs(getVehicleById(id)!, vehicles);
const ids = (id: string) => rec(id).map((m) => m.ev.id);
const styles = (id: string) => rec(id).map((m) => m.ev.bodyStyle);

describe("recommendEvs — class matching (spec §6)", () => {
  it("returns three distinct, labelled matches for a mainstream car", () => {
    const matches = rec("toyota-camry");
    expect(matches).toHaveLength(3);
    expect(new Set(matches.map((m) => m.ev.id)).size).toBe(3);
    expect(matches.map((m) => m.label)).toEqual([
      "Closest match", "Lowest total cost", "Best overall value",
    ]);
  });

  it("Camry → electric sedans (Model 3 / Ioniq 6 / Polestar 2 territory)", () => {
    const got = ids("toyota-camry");
    expect(styles("toyota-camry").every((b) => b === "sedan")).toBe(true);
    expect(got).toEqual(expect.arrayContaining(["hyundai-ioniq-6"]));
    // The closest match must be a sedan, never an SUV or truck.
    expect(rec("toyota-camry")[0].ev.bodyStyle).toBe("sedan");
  });

  it("compact SUV (CR-V) → compact-SUV EVs, never sedans or trucks", () => {
    const bs = styles("honda-crv");
    expect(bs.every((b) => b === "suv-compact" || b === "suv-mid")).toBe(true);
    expect(ids("honda-crv")).not.toContain("tesla-model-3");
  });

  it("truck (F-150) → only electric trucks, never a sedan", () => {
    const matches = rec("ford-f150");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.ev.bodyStyle === "truck")).toBe(true);
    expect(ids("ford-f150")).toEqual(
      expect.arrayContaining(["chevy-silverado-ev"]),
    );
    expect(ids("ford-f150").some((id) => id.includes("model-3"))).toBe(false);
  });

  /* Positioning belongs to the "Closest match" card, not to all three.
     It used to be a hard filter that ran BEFORE scoring, so every mainstream EV
     left the pool and "Cheapest to own over five years" was awarded to the
     cheapest premium car - a superlative over a subset the reader could not see.
     For an Alfa Romeo Giulia that badge sat on a Mercedes CLA EV while a Hyundai
     IONIQ 6, same body style and one size class down, cost about $11.5k less
     over five years and was never in the running. */
  it("performance car (Mustang GT) → a performance EV as the closest match", () => {
    const matches = rec("ford-mustang");
    expect(matches.length).toBeGreaterThan(0);
    const closest = matches.find((m) => m.label === "Closest match")!;
    expect(closest.ev.performance).toBe(true);
  });

  it("luxury sedan (BMW 5 Series) → a premium EV as the closest match", () => {
    const matches = rec("bmw-5-series");
    expect(matches.length).toBeGreaterThan(0);
    const closest = matches.find((m) => m.label === "Closest match")!;
    expect(closest.ev.luxury).toBe(true);
  });

  it("does not answer a Porsche 911 with a Mercedes CLA", () => {
    // the regression from lifting the pre-filter without replacing it:
    // classMatchScore clamps at 100, so a perfect-fitting mainstream EV tied a
    // premium one and the cost-weighted composite broke the tie the wrong way
    const closest = rec("porsche-911-carrera").find((m) => m.label === "Closest match")!;
    expect(closest.ev.performance || closest.ev.luxury).toBe(true);
  });

  it("holds the closest match in segment for EVERY luxury and performance car", () => {
    const violations: string[] = [];
    for (const gas of vehicles.filter((v) => v.type === "gas")) {
      if (!gas.luxury && !gas.performance) continue;
      const closest = recommendEvs(gas, vehicles).find((m) => m.label === "Closest match");
      if (!closest) continue;
      if (gas.performance && !closest.ev.performance) violations.push(`${gas.name} → ${closest.ev.name}`);
      else if (gas.luxury && !closest.ev.luxury && !closest.ev.performance)
        violations.push(`${gas.name} → ${closest.ev.name}`);
    }
    expect(violations).toEqual([]);
  });

  it("lets the cost card leave the segment, and says so when it does", () => {
    // a Giulia shopper should be told the cheaper option exists
    const matches = rec("alfa-romeo-giulia");
    const cheapest = matches.find((m) => m.label === "Lowest total cost")!;
    expect(cheapest.ev.luxury).toBeFalsy();
    expect(cheapest.reason).toContain("outside your car");
  });

  it("never claims an unqualified cheapest when the pick left the segment", () => {
    for (const gas of vehicles.filter((v) => v.type === "gas")) {
      const cheapest = recommendEvs(gas, vehicles).find((m) => m.label === "Lowest total cost");
      if (!cheapest) continue;
      const steppedOut =
        (gas.performance && !cheapest.ev.performance) || (gas.luxury && !cheapest.ev.luxury);
      if (steppedOut) expect(cheapest.reason, gas.name).toContain("outside your car");
    }
  });

  it("does not promise a premium closest match the catalog cannot supply", () => {
    for (const gas of vehicles.filter((v) => v.type === "gas")) {
      const closest = recommendEvs(gas, vehicles).find((m) => m.label === "Closest match");
      if (!closest) continue;
      if (closest.reason.includes("premium")) expect(closest.ev.luxury, gas.name).toBe(true);
      if (closest.reason.includes("performance EV")) expect(closest.ev.performance, gas.name).toBe(true);
    }
  });

  it("prices five-year totals at the real purchase price", () => {
    // fiveYearTotal used to subtract a $7,500 federal credit that has ended and
    // that the rest of the app passes as zero. It cancelled out of the ranking,
    // so nothing caught it, but the number itself was $7,500 light.
    const m = rec("toyota-camry").find((x) => x.label === "Closest match")!;
    expect(m.fiveYearTotal).toBeGreaterThan(m.ev.msrp);
  });

  it("3-row hauler (Highlander, 8 seats) → 3-row EVs, with a capacity caveat", () => {
    const matches = rec("toyota-highlander");
    expect(matches.every((m) => m.ev.bodyStyle === "suv-large")).toBe(true);
    expect(matches.every((m) => (m.ev.seats ?? 0) >= 7)).toBe(true);
    // No EV seats 8, so the algorithm relaxed capacity and flags it.
    expect(matches[0].caveat).toBeTruthy();
  });

  it("the 'Lowest total cost' pick really is the cheapest of the matches", () => {
    const matches = rec("toyota-rav4");
    const cheapest = matches.find((m) => m.label === "Lowest total cost")!;
    expect(Math.min(...matches.map((m) => m.fiveYearTotal))).toBe(cheapest.fiveYearTotal);
  });

  it("holds that claim for EVERY gas car in the catalog, not just the RAV4", () => {
    // The three matches are shown side by side with their five-year totals on
    // them, so "Lowest total cost" is checkable by eye. It once wasn't true: one
    // EV can win both class fit and cost, and when the IONIQ 5 took "Closest
    // match" for a RAV4 shopper, the cost badge fell through to an EV6 costing
    // $3,033 more -- displayed directly beside the cheaper car.
    //
    // A single-vehicle assertion missed it for as long as the catalog's numbers
    // happened to avoid the collision, so this sweeps the whole gas side.
    const violations: string[] = [];
    for (const gas of getVehiclesByType("gas")) {
      const matches = recommendEvs(gas, vehicles);
      if (!matches.length) continue;
      const tagged = matches.find((m) => m.label === "Lowest total cost");
      const min = Math.min(...matches.map((m) => m.fiveYearTotal));
      if (!tagged || tagged.fiveYearTotal !== min) {
        violations.push(`${gas.id}: badge ${tagged?.fiveYearTotal} vs cheapest ${min}`);
      }
      if (new Set(matches.map((m) => m.label)).size !== matches.length) {
        violations.push(`${gas.id}: repeated label`);
      }
    }
    expect(violations).toEqual([]);
  });
});
