import { describe, it, expect } from "vitest";
import { parseCalcState, serializeCalcState, type CalcState } from "./evg-url";

const defaults: CalcState = {
  gasId: "toyota-camry", evId: null, stateCode: "CA", homeCharging: true,
  annualMiles: 13500, ownershipYears: 5, gasPrice: 4.8, homeKwh: 0.31,
  publicKwh: 0.43, chargingLoss: 0.1, dollarAmount: 50,
};

const sp = (obj: Record<string, string>) => new URLSearchParams(obj);

describe("evg-url", () => {
  it("falls back to defaults for an empty query string", () => {
    expect(parseCalcState(sp({}), defaults)).toEqual(defaults);
  });

  it("only writes scenario fields when nothing is customised", () => {
    const out = serializeCalcState(defaults, defaults);
    expect(out).toEqual({ car: "toyota-camry", state: "CA", home: "1" });
    expect(out.ev).toBeUndefined();
    expect(out.miles).toBeUndefined();
  });

  it("writes advanced fields once they diverge from defaults", () => {
    const out = serializeCalcState(
      { ...defaults, evId: "tesla-model-3", annualMiles: 20000, gasPrice: 3.59, homeCharging: false },
      defaults,
    );
    expect(out).toMatchObject({ car: "toyota-camry", ev: "tesla-model-3", home: "0", miles: "20000", gas: "3.59" });
    expect(out.years).toBeUndefined();
  });

  it("round-trips a fully-customised state identically (share fidelity)", () => {
    const custom: CalcState = {
      gasId: "ford-f150", evId: "rivian-r1t", stateCode: "TX", homeCharging: false,
      annualMiles: 18000, ownershipYears: 7, gasPrice: 3.05, homeKwh: 0.14,
      publicKwh: 0.5, chargingLoss: 0.12, dollarAmount: 100,
    };
    const round = parseCalcState(sp(serializeCalcState(custom, defaults)), defaults);
    expect(round).toEqual(custom);
  });

  it("ignores malformed numbers and uppercases state", () => {
    const r = parseCalcState(sp({ state: "ny", miles: "abc", gas: "" }), defaults);
    expect(r.stateCode).toBe("NY");
    expect(r.annualMiles).toBe(defaults.annualMiles);
    expect(r.gasPrice).toBe(defaults.gasPrice);
  });
});
