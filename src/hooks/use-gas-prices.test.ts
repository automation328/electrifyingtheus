import { describe, it, expect } from "vitest";
import { medianGasPrice, gasExtremes, resolveStateGasPrice, gasSourceMeta } from "./use-gas-prices";
import { STATIC_GAS_PRICES, STATE_ENERGY_RATES, NATIONAL_AVG, GAS_PRICES_AS_OF } from "@/data/state-energy-rates";
import { SOURCES } from "@/data/sources";

describe("medianGasPrice", () => {
  it("returns the middle value for an odd-sized map", () => {
    expect(medianGasPrice({ A: 3, B: 1, C: 2 })).toBe(2);
  });

  it("averages the two middle values for an even-sized map", () => {
    expect(medianGasPrice({ A: 1, B: 2, C: 3, D: 4 })).toBe(2.5);
  });

  it("returns null for an empty, null or undefined map so callers can fall back", () => {
    expect(medianGasPrice({})).toBeNull();
    expect(medianGasPrice(null)).toBeNull();
    expect(medianGasPrice(undefined)).toBeNull();
  });

  it("ignores non-finite entries rather than poisoning the sort", () => {
    expect(medianGasPrice({ A: 1, B: NaN, C: 3, D: Infinity } as Record<string, number>)).toBe(2);
  });

  it("is not the mean — a few very expensive states pull the mean above the median", () => {
    // Shape of the real AAA feed: a long right tail (CA/WA/HI).
    const prices = { A: 3.5, B: 3.6, C: 3.7, D: 5.5, E: 5.9 };
    const values = Object.values(prices);
    const mean = values.reduce((s, n) => s + n, 0) / values.length;
    expect(medianGasPrice(prices)).toBe(3.7);
    expect(mean).toBeGreaterThan(medianGasPrice(prices)!);
  });

  it("covers every state in the static fallback table", () => {
    expect(Object.keys(STATIC_GAS_PRICES)).toHaveLength(Object.keys(STATE_ENERGY_RATES).length);
    expect(STATIC_GAS_PRICES.CA).toBe(STATE_ENERGY_RATES.CA.gasPricePerGallon);
    expect(medianGasPrice(STATIC_GAS_PRICES)).toBeGreaterThan(0);
  });
});

describe("resolveStateGasPrice", () => {
  it("prefers the live price for that state", () => {
    expect(resolveStateGasPrice("CA", { CA: 5.8992 })).toBe(5.8992);
  });

  it("falls back per state, so one missing state does not drag the rest to static", () => {
    expect(resolveStateGasPrice("TX", { CA: 5.8992 })).toBe(STATE_ENERGY_RATES.TX.gasPricePerGallon);
    expect(resolveStateGasPrice("CA", { CA: 5.8992 })).toBe(5.8992);
  });

  it("falls back when there is no live data at all", () => {
    expect(resolveStateGasPrice("CA", null)).toBe(STATE_ENERGY_RATES.CA.gasPricePerGallon);
  });
});

describe("gasExtremes", () => {
  it("computes the real min and max rather than assuming CA/TX", () => {
    // Live shape as of the 2026-09-10 AAA pull: Indiana is cheapest, not Texas.
    const live = Object.fromEntries(Object.keys(STATE_ENERGY_RATES).map((c) => [c, 4.2]));
    live.IN = 3.5623;
    live.CA = 5.8992;
    const { low, high } = gasExtremes(live);
    expect(low.code).toBe("IN");
    expect(low.name).toBe("Indiana");
    expect(high.code).toBe("CA");
  });

  it("never reports Texas as lowest just because it used to be", () => {
    const live = Object.fromEntries(Object.keys(STATE_ENERGY_RATES).map((c) => [c, 4.2]));
    live.MS = 3.1;
    expect(gasExtremes(live).low.code).toBe("MS");
  });

  it("still returns a real state pair with no live data", () => {
    const { low, high } = gasExtremes(null);
    expect(low.price).toBeLessThanOrEqual(high.price);
    expect(STATE_ENERGY_RATES[low.code]).toBeDefined();
    expect(STATE_ENERGY_RATES[high.code]).toBeDefined();
  });
});

describe("gasSourceMeta", () => {
  it("reports the feed's own timestamp for a live figure", () => {
    const meta = gasSourceMeta({
      prices: { CA: 5.8992 }, national: 4.301, updatedAt: "2026-09-10T10:00:10.822Z", source: "AAA",
    });
    expect(meta.asOf).toBe("September 10, 2026");
    expect(meta.asOf).not.toBe(SOURCES.gas.asOf);
    expect(meta.label).toContain("AAA");
  });

  it("falls back to the curated date when there is no live figure", () => {
    expect(gasSourceMeta(null).asOf).toBe(SOURCES.gas.asOf);
    expect(gasSourceMeta({ prices: {}, national: null, updatedAt: null, source: null }).asOf).toBe(SOURCES.gas.asOf);
  });

  it("does not claim freshness from an unparseable timestamp", () => {
    expect(gasSourceMeta({ prices: { CA: 5.9 }, national: 4.3, updatedAt: "not-a-date", source: "AAA" }).asOf)
      .toBe(SOURCES.gas.asOf);
  });
});

describe("static fallback table", () => {
  it("stays within a few percent of the live feed it stands in for", () => {
    // Regression guard: the table had drifted 22% low, silently understating
    // every savings figure the site quotes whenever the feed was unreachable.
    const median = medianGasPrice(STATIC_GAS_PRICES)!;
    expect(median).toBeGreaterThan(4.0);
    expect(median).toBeLessThan(4.5);
    expect(NATIONAL_AVG.gasPricePerGallon).toBeGreaterThan(4.0);
  });
});

describe("fallback table cannot drift internally", () => {
  it("derives NATIONAL_AVG from the per-state table, not a hand-written literal", () => {
    const vals = Object.values(STATE_ENERGY_RATES).map((r) => r.gasPricePerGallon);
    const mean = Math.round((vals.reduce((a, b) => a + b, 0) / vals.length) * 100) / 100;
    expect(NATIONAL_AVG.gasPricePerGallon).toBe(mean);
  });

  it("carries a pull date the refresh script maintains", () => {
    expect(GAS_PRICES_AS_OF).toMatch(/^\d{4}-\d{2}-\d{2}$/);
  });

  it("covers 50 states plus DC", () => {
    expect(Object.keys(STATE_ENERGY_RATES)).toHaveLength(51);
  });
});
