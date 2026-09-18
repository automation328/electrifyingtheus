import { describe, it, expect } from "vitest";
import { EV_CATALOG } from "./ev-catalog";
import { vehicles } from "./vehicles";

// ev-catalog.ts holds the EV identity data the marketplace matches listings
// against, duplicated out of vehicles.ts because the marketplace's serverless
// function cannot import vehicles.ts (it pulls in .jpg assets, which a Node
// function cannot load).
//
// The two lists are not the same size. Everything vehicles.ts PRICES must be
// here, or the comparison pages offer a car the marketplace cannot find. The
// reverse is not required: a used marketplace sells cars the calculator has no
// cost figures for, and those live here alone.
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

  it("may carry vehicles vehicles.ts does not price, and does", () => {
    // The marketplace reaches further back than the calculator: a 2013 Spark EV
    // has no TCO figures here and is still a car someone can buy today.
    const priced = new Set(catalogEvs.map((v) => v.id));
    const marketplaceOnly = EV_CATALOG.filter((e) => !priced.has(e.id));
    expect(marketplaceOnly.length).toBeGreaterThan(0);
    for (const e of marketplaceOnly) {
      expect(e.make, e.id).toBeTruthy();
      expect(e.model, e.id).toBeTruthy();
    }
  });

  it("never reuses a petrol car's name for an electric one", () => {
    // The matcher works on substrings, so a catalog entry called "Camry" would
    // claim every petrol Camry listing and lean entirely on the provider's fuel
    // field to catch the mistake.
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const petrolNames = new Set(
      vehicles.filter((v) => v.type === "gas").map((v) => norm(v.name.split(" ").slice(1).join(" "))),
    );
    const clashes = EV_CATALOG
      .filter((e) => petrolNames.has(norm(e.model)))
      .map((e) => `${e.make} ${e.model}`);
    expect(clashes).toEqual([]);
  });

  it("gives every vehicle its own nameplate", () => {
    const norm = (s: string) => s.toLowerCase().replace(/[^a-z0-9]/g, "");
    const byName = new Map<string, string[]>();
    for (const e of EV_CATALOG) {
      const k = `${norm(e.make)}|${norm(e.model)}`;
      byName.set(k, [...(byName.get(k) ?? []), e.id]);
    }
    const duplicated = [...byName.entries()].filter(([, ids]) => ids.length > 1);
    expect(duplicated).toEqual([]);
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
