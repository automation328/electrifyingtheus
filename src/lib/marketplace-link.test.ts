import { describe, it, expect } from "vitest";
import { marketplacePathFor, isInMarketplaceCatalog } from "./marketplace-link";
import { readFilters } from "./marketplace-filters";
import { EV_CATALOG } from "@/data/ev-catalog";

const paramsOf = (path: string) => new URLSearchParams(path.split("?")[1] ?? "");

describe("marketplacePathFor", () => {
  it("asks the marketplace for that one car, near the visitor", () => {
    const path = marketplacePathFor("hyundai-ioniq-5", { zip: "30080" });
    const params = paramsOf(path!);
    expect(path!.startsWith("/marketplace?")).toBe(true);
    expect(params.get("q")).toBe("30080");
    expect(params.get("makes")).toBe("Hyundai");
    expect(params.get("models")).toBe("IONIQ 5");
  });

  it("leaves the location out when the page does not have a usable ZIP", () => {
    for (const zip of [undefined, "", "   ", "GA", "3008"]) {
      expect(paramsOf(marketplacePathFor("kia-ev6", { zip })!).has("q")).toBe(false);
    }
  });

  it("produces a path the marketplace reads back as the same filter", () => {
    const filters = readFilters(paramsOf(marketplacePathFor("tesla-model-3")!));
    expect(filters.makes).toEqual(["Tesla"]);
    expect(filters.models).toEqual(["Model 3"]);
  });

  it("returns nothing for a car the marketplace cannot match, so no dead link is drawn", () => {
    expect(marketplacePathFor("toyota-camry")).toBeNull();
    expect(isInMarketplaceCatalog("toyota-camry")).toBe(false);
    expect(isInMarketplaceCatalog("tesla-model-y")).toBe(true);
  });

  it("works for every vehicle the marketplace knows", () => {
    for (const entry of EV_CATALOG) {
      const path = marketplacePathFor(entry.id);
      expect(path, entry.id).not.toBeNull();
      expect(paramsOf(path!).get("makes")).toBe(entry.make);
    }
  });
});
