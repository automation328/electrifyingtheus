import { describe, it, expect } from "vitest";
import { EV_CATALOG } from "./ev-catalog";
import { vehicles } from "./vehicles";

// ev-catalog.ts is a hand-maintained copy of the EV identity data in vehicles.ts,
// duplicated because the marketplace's serverless function cannot import
// vehicles.ts (it pulls in .jpg assets, which a Node function cannot load).
//
// Duplicated data drifts. These tests are what stop it: add an EV to vehicles.ts
// without adding it here and the suite fails, naming the car.

describe("EV_CATALOG stays in step with vehicles.ts", () => {
  const catalogEvs = vehicles.filter((v) => v.type === "ev");

  it("covers every EV in vehicles.ts", () => {
    const known = new Set(EV_CATALOG.map((e) => e.id));
    const missing = catalogEvs.filter((v) => !known.has(v.id)).map((v) => v.name);
    expect(missing).toEqual([]);
  });

  it("contains no vehicle that vehicles.ts does not have", () => {
    const known = new Set(catalogEvs.map((v) => v.id));
    const extra = EV_CATALOG.filter((e) => !known.has(e.id)).map((e) => `${e.make} ${e.model}`);
    expect(extra).toEqual([]);
  });

  it("agrees on make, model and range for every entry", () => {
    const byId = new Map(catalogEvs.map((v) => [v.id, v]));
    const mismatched: string[] = [];
    for (const e of EV_CATALOG) {
      const v = byId.get(e.id);
      if (!v) continue;
      if (`${e.make} ${e.model}`.trim() !== v.name.trim()) {
        mismatched.push(`${e.id}: "${e.make} ${e.model}" vs "${v.name}"`);
      }
      if (e.rangeMi !== v.rangeMi) {
        mismatched.push(`${e.id}: range ${e.rangeMi} vs ${v.rangeMi}`);
      }
    }
    expect(mismatched).toEqual([]);
  });

  it("never includes a petrol vehicle", () => {
    const gasIds = new Set(vehicles.filter((v) => v.type === "gas").map((v) => v.id));
    expect(EV_CATALOG.filter((e) => gasIds.has(e.id))).toEqual([]);
  });

  it("has unique ids", () => {
    const ids = EV_CATALOG.map((e) => e.id);
    expect(new Set(ids).size).toBe(ids.length);
  });
});
