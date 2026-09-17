import { describe, it, expect } from "vitest";
import {
  sortListings, isSortKey, providerSortFor, isProviderSorted,
  SORT_OPTIONS, DEFAULT_SORT,
} from "./marketplace-sort";
import type { VehicleListing } from "./marketplace-types";

const listing = (id: string, over: Partial<VehicleListing> = {}): VehicleListing => ({
  id,
  year: 2022,
  make: "Tesla",
  model: "Model 3",
  condition: "used",
  powertrain: "ev",
  catalogId: "tesla-model-3",
  ...over,
});

const ids = (rows: VehicleListing[]) => rows.map((r) => r.id);

describe("sortListings", () => {
  const rows = [
    listing("far", { price: 20_000, mileage: 90_000, year: 2019, rangeMi: 220, distanceMi: 40 }),
    listing("near", { price: 50_000, mileage: 4_000, year: 2026, rangeMi: 310, distanceMi: 2 }),
    listing("mid", { price: 35_000, mileage: 30_000, year: 2023, rangeMi: 272, distanceMi: 12 }),
  ];

  it("orders by distance, price, mileage, year and range", () => {
    expect(ids(sortListings(rows, "distance"))).toEqual(["near", "mid", "far"]);
    expect(ids(sortListings(rows, "price-asc"))).toEqual(["far", "mid", "near"]);
    expect(ids(sortListings(rows, "price-desc"))).toEqual(["near", "mid", "far"]);
    expect(ids(sortListings(rows, "mileage-asc"))).toEqual(["near", "mid", "far"]);
    expect(ids(sortListings(rows, "year-desc"))).toEqual(["near", "mid", "far"]);
    expect(ids(sortListings(rows, "range-desc"))).toEqual(["near", "mid", "far"]);
  });

  it("puts a listing missing the sorted field last in both directions", () => {
    const withHiddenPrice = [
      listing("hidden", { distanceMi: 1 }),
      listing("cheap", { price: 10_000, distanceMi: 5 }),
      listing("dear", { price: 80_000, distanceMi: 9 }),
    ];
    expect(ids(sortListings(withHiddenPrice, "price-asc"))).toEqual(["cheap", "dear", "hidden"]);
    expect(ids(sortListings(withHiddenPrice, "price-desc"))).toEqual(["dear", "cheap", "hidden"]);
  });

  it("sorts a listing without coordinates last, not nearest", () => {
    const noCoords = [listing("unknown"), listing("close", { distanceMi: 3 })];
    expect(ids(sortListings(noCoords, "distance"))).toEqual(["close", "unknown"]);
  });

  it("breaks ties by distance, then by id, so order is stable", () => {
    const tied = [
      listing("b", { price: 30_000, distanceMi: 10 }),
      listing("a", { price: 30_000, distanceMi: 10 }),
      listing("c", { price: 30_000, distanceMi: 2 }),
    ];
    expect(ids(sortListings(tied, "price-asc"))).toEqual(["c", "a", "b"]);
  });

  it("does not mutate the array it was given", () => {
    const original = [...rows];
    sortListings(rows, "price-asc");
    expect(rows).toEqual(original);
  });
});

describe("providerSortFor", () => {
  it("maps the orders the provider can apply to its own parameter", () => {
    expect(providerSortFor("price-asc")).toBe("price.asc");
    expect(providerSortFor("price-desc")).toBe("price.desc");
    expect(providerSortFor("mileage-asc")).toBe("miles.asc");
    expect(providerSortFor("mileage-desc")).toBe("miles.desc");
    expect(providerSortFor("year-asc")).toBe("year.asc");
    expect(providerSortFor("year-desc")).toBe("year.desc");
  });

  it("has nothing for distance or range, which the provider cannot sort on", () => {
    expect(providerSortFor("distance")).toBeUndefined();
    expect(providerSortFor("range-desc")).toBeUndefined();
    expect(isProviderSorted("distance")).toBe(false);
    expect(isProviderSorted("price-asc")).toBe(true);
  });

  it("covers every offered option one way or the other", () => {
    for (const option of SORT_OPTIONS) {
      expect(typeof isProviderSorted(option.value)).toBe("boolean");
    }
  });
});

describe("isSortKey", () => {
  it("accepts every offered option and rejects anything else", () => {
    for (const option of SORT_OPTIONS) expect(isSortKey(option.value)).toBe(true);
    expect(isSortKey(DEFAULT_SORT)).toBe(true);
    expect(isSortKey("price")).toBe(false);
    expect(isSortKey(null)).toBe(false);
    expect(isSortKey("")).toBe(false);
  });
});
