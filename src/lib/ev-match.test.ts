import { describe, it, expect } from "vitest";
import { recommendEvs } from "./ev-match";
import { vehicles, getVehicleById } from "@/data/vehicles";

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
      expect.arrayContaining(["ford-f150-lightning"]),
    );
    expect(ids("ford-f150").some((id) => id.includes("model-3"))).toBe(false);
  });

  it("performance car (Mustang GT) → performance EVs", () => {
    const matches = rec("ford-mustang");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.ev.performance)).toBe(true);
  });

  it("luxury sedan (BMW 5 Series) → luxury EVs", () => {
    const matches = rec("bmw-5-series");
    expect(matches.length).toBeGreaterThan(0);
    expect(matches.every((m) => m.ev.luxury)).toBe(true);
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
});
