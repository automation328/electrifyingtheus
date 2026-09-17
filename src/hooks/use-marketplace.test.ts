import { describe, it, expect } from "vitest";
import { buildMarketplaceQuery } from "./use-marketplace";
import { isSortKey, providerSortFor, SORT_OPTIONS } from "@/lib/marketplace-sort";

// The contract between this file and api/marketplace.ts. It was briefly broken
// in a way nothing else could catch: the page sent the provider's own sort
// dialect ("price.asc"), the endpoint only accepts our SortKey ("price-asc"),
// and the mismatch silently degraded every price, mileage and year sort back to
// one arbitrary page. Types could not see it — both sides are strings.

describe("buildMarketplaceQuery", () => {
  it("sends the location and nothing else by default", () => {
    const q = buildMarketplaceQuery("30080", null, {}, undefined, 1);
    expect(q.get("q")).toBe("30080");
    expect(q.has("radius")).toBe(false);
    expect(q.has("sort")).toBe(false);
    expect(q.has("page")).toBe(false);
  });

  it("sends the radius and the upstream filters", () => {
    const q = buildMarketplaceQuery(
      "30080", 100, { priceMin: 10000, priceMax: 45000, yearMin: 2020 }, undefined, 1,
    );
    expect(q.get("radius")).toBe("100");
    expect(q.get("priceMin")).toBe("10000");
    expect(q.get("priceMax")).toBe("45000");
    expect(q.get("yearMin")).toBe("2020");
    expect(q.has("yearMax")).toBe(false);
  });

  it("sends our own sort key, which is what the endpoint validates", () => {
    const q = buildMarketplaceQuery("30080", null, {}, "price-asc", 1);
    expect(q.get("sort")).toBe("price-asc");
    // The endpoint's guard, applied to exactly what went over the wire.
    expect(isSortKey(q.get("sort"))).toBe(true);
    expect(providerSortFor(q.get("sort") as never)).toBe("price.asc");
  });

  it("never sends the provider's dialect, which the endpoint would reject", () => {
    for (const option of SORT_OPTIONS) {
      const dialect = providerSortFor(option.value);
      if (!dialect) continue;
      const q = buildMarketplaceQuery("30080", null, {}, option.value, 1);
      expect(q.get("sort")).not.toBe(dialect);
      expect(isSortKey(q.get("sort"))).toBe(true);
    }
  });

  it("omits the first page and sends every later one", () => {
    expect(buildMarketplaceQuery("30080", null, {}, undefined, 1).has("page")).toBe(false);
    expect(buildMarketplaceQuery("30080", null, {}, undefined, 4).get("page")).toBe("4");
  });
});
