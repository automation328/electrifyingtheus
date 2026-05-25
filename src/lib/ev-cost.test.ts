import { describe, it, expect } from "vitest";
import { calculate, evKwhPerMile, homeShareFor, DEFAULTS, type EvCostInputs } from "./ev-cost";

// Golden file — EV Cost Calculator spec, Appendix A "Worked Example".
//   2020 Honda Civic LX (32 MPG) → Tesla Model 3 RWD (0.244 kWh/mi)
//   ZIP 45202, Home charging = Yes
//   Gas $3.62/gal, home electricity $0.13/kWh, public $0.41/kWh
//   Federal $7,500 + Ohio $0 + Duke Energy $250
// Expected: $853/yr, $0.113 vs $0.050 /mi, $50 → 442 vs 1,000 mi, $12,015 / 5yr.
describe("calculate() — Appendix A worked example", () => {
  const inputs: EvCostInputs = {
    annualMiles: 13_500,
    horizonYears: 5,
    gasPricePerGallon: 3.62,
    homeKwhPrice: 0.13,
    publicKwhPrice: 0.41,
    homeChargingShare: homeShareFor(true), // 0.80
    chargingLoss: 0.1,
    gas: { mpgCombined: 32 },
    ev: { kwhPer100mi: 24.4 }, // 0.244 kWh/mi, the spec's Model 3 RWD figure
    federalCredit: 7500,
    stateRebate: 0,
    utilityRebate: 250,
    dollarAmount: 50,
  };

  const r = calculate(inputs);

  it("annual fuel costs match (gas ~$1,527, ev ~$674)", () => {
    expect(r.annualGasCost).toBeCloseTo(1527, 0);
    expect(r.annualEvCost).toBeCloseTo(674, 0);
  });

  it("annual savings is ~$853 (fuel only, no incentives)", () => {
    expect(r.annualSavings).toBeCloseTo(853, 0);
    expect(r.monthlySavings).toBeCloseTo(71, 0);
  });

  it("cost per mile is $0.113 (gas) vs $0.050 (ev)", () => {
    expect(r.gasCostPerMile).toBeCloseTo(0.113, 3);
    expect(r.evCostPerMile).toBeCloseTo(0.05, 3);
  });

  it("blended kWh price is $0.186", () => {
    expect(r.blendedKwhPrice).toBeCloseTo(0.186, 3);
  });

  it("dollar-driving: $50 → 442 mi (gas) vs ~1,000 mi (ev)", () => {
    expect(Math.round(r.gasRangeOnDollar)).toBe(442);
    expect(Math.round(r.evRangeOnDollar / 10) * 10).toBe(1000);
  });

  it("5-year total saved is ~$12,015 (fuel delta + stacked incentives)", () => {
    expect(r.totalIncentives).toBe(7750);
    expect(r.horizonTotalSaved).toBeCloseTo(12015, -1); // within $10
  });
});

describe("ev energy helpers", () => {
  it("derives kWh/mi from MPGe via 33.7 kWh/gal", () => {
    // 138 MPGe → 33.7/138 ≈ 0.244 kWh/mi (spec's Model 3 RWD)
    expect(evKwhPerMile({ mpgeCombined: 138 })).toBeCloseTo(0.244, 3);
  });

  it("prefers MPGe over kWh/100mi when both are present", () => {
    const r = evKwhPerMile({ mpgeCombined: 138, kwhPer100mi: 99 });
    expect(r).toBeCloseTo(0.244, 3);
  });

  it("home share follows the spec mixes", () => {
    expect(homeShareFor(true)).toBe(DEFAULTS.homeShareWithHome);
    expect(homeShareFor(false)).toBe(DEFAULTS.homeShareWithoutHome);
  });
});

describe("break-even", () => {
  it("returns null when the EV never pays back (no annual savings)", () => {
    const r = calculate({
      annualMiles: 12000, horizonYears: 5, gasPricePerGallon: 2,
      homeKwhPrice: 0.4, publicKwhPrice: 0.5, homeChargingShare: 0.3, chargingLoss: 0.1,
      gas: { mpgCombined: 55 }, ev: { kwhPer100mi: 40 },
      federalCredit: 0, stateRebate: 0, utilityRebate: 0, evPricePremium: 15000,
    });
    expect(r.breakEvenYears).toBeNull();
  });

  it("is 0 when incentives already cover the premium", () => {
    const r = calculate({
      annualMiles: 13500, horizonYears: 5, gasPricePerGallon: 3.62,
      homeKwhPrice: 0.13, publicKwhPrice: 0.41, homeChargingShare: 0.8, chargingLoss: 0.1,
      gas: { mpgCombined: 32 }, ev: { kwhPer100mi: 24.4 },
      federalCredit: 7500, stateRebate: 0, utilityRebate: 250, evPricePremium: 5000,
    });
    expect(r.breakEvenYears).toBe(0);
  });
});
