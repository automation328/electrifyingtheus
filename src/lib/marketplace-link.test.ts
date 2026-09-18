import { describe, it, expect } from "vitest";
import {
  marketplacePathFor, marketplacePathForMany, isInMarketplaceCatalog,
} from "./marketplace-link";
import { readFilters } from "./marketplace-filters";
import { EV_CATALOG } from "@/data/ev-catalog";
import { vehicles } from "@/data/vehicles";

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

describe("marketplacePathForMany", () => {
  it("asks for all three matches in one search", () => {
    const path = marketplacePathForMany(
      ["hyundai-ioniq-6", "kia-ev6", "tesla-model-3"], { zip: "30080" },
    );
    const params = paramsOf(path!);
    expect(params.get("q")).toBe("30080");
    expect(params.get("makes")).toBe("Hyundai,Kia,Tesla");
    expect(params.get("models")).toBe("IONIQ 6,EV6,Model 3");
  });

  it("says each make once, however many of its cars are matched", () => {
    const params = paramsOf(marketplacePathForMany(["tesla-model-3", "tesla-model-y"])!);
    expect(params.get("makes")).toBe("Tesla");
    expect(params.get("models")).toBe("Model 3,Model Y");
  });

  it("skips a car the marketplace cannot match, and gives up only when all are", () => {
    const params = paramsOf(marketplacePathForMany(["toyota-camry", "kia-ev6"])!);
    expect(params.get("makes")).toBe("Kia");
    expect(marketplacePathForMany(["toyota-camry", "honda-accord"])).toBeNull();
    expect(marketplacePathForMany([])).toBeNull();
  });

  it("reads back as the filter the marketplace applies", () => {
    const filters = readFilters(paramsOf(marketplacePathForMany(["kia-ev6", "bmw-i4"])!));
    expect(filters.makes).toEqual(["Kia", "BMW"]);
    expect(filters.models).toEqual(["EV6", "i4"]);
  });
});

describe("coverage of the site's own catalog", () => {
  // The comparison pages can load any EV in vehicles.ts. Every one of them has
  // to be searchable in the marketplace, or the page offers a car it cannot
  // then help anyone buy.
  const siteEvs = vehicles.filter((v) => v.type === "ev");

  it("has a marketplace search for every EV the site compares", () => {
    const unreachable = siteEvs
      .filter((v) => marketplacePathFor(v.id) == null)
      .map((v) => v.name);
    expect(unreachable).toEqual([]);
    expect(siteEvs.length).toBeGreaterThan(50);
  });

  it("names the make and model the provider will recognise", () => {
    for (const v of siteEvs) {
      const params = paramsOf(marketplacePathFor(v.id)!);
      const make = params.get("makes")!;
      const model = params.get("models")!;
      expect(make, v.name).not.toBe("");
      expect(model, v.name).not.toBe("");
      // vehicles.ts writes the name as "<make> <model>", which is what the
      // catalog is checked against — so the search asks for the same car.
      expect(v.name.startsWith(make), v.name).toBe(true);
    }
  });

  it("offers no marketplace search for a petrol car", () => {
    // The marketplace verifies every listing as electrified; a link for a
    // Camry would promise a search that can only come back empty.
    const gas = vehicles.filter((v) => v.type === "gas");
    expect(gas.length).toBeGreaterThan(10);
    for (const v of gas) expect(marketplacePathFor(v.id), v.name).toBeNull();
  });
});
