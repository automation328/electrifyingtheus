import { describe, it, expect } from "vitest";
import { matchCatalogVehicle, catalogSearchModels, normalizeModelText } from "./ev-catalog-match";
import { vehicles } from "@/data/vehicles";

describe("normalizeModelText", () => {
  it("lowercases and strips punctuation so 'Mach-E' and 'Mach E' agree", () => {
    expect(normalizeModelText("Mach-E")).toBe(normalizeModelText("Mach E"));
    expect(normalizeModelText("IONIQ 5")).toBe(normalizeModelText("ioniq5"));
  });

  it("collapses whitespace", () => {
    expect(normalizeModelText("  Model   3  ")).toBe("model3");
  });

  it("survives empty and nullish input", () => {
    expect(normalizeModelText("")).toBe("");
    expect(normalizeModelText(undefined)).toBe("");
  });
});

describe("matchCatalogVehicle", () => {
  it("matches an exact catalog name", () => {
    const m = matchCatalogVehicle("Tesla", "Model 3");
    expect(m?.id).toBe("tesla-model-3");
  });

  it("matches when the listing repeats the make inside the model", () => {
    // Listings commonly write "Ford Mustang Mach-E" in the model field.
    expect(matchCatalogVehicle("Ford", "Mustang Mach-E")?.id)
      .toBe(matchCatalogVehicle("Ford", "Mach-E")?.id);
  });

  it("ignores trim noise after the model name", () => {
    const base = matchCatalogVehicle("Tesla", "Model 3");
    expect(matchCatalogVehicle("Tesla", "Model 3 Long Range AWD")?.id).toBe(base?.id);
  });

  it("is case and punctuation insensitive", () => {
    expect(matchCatalogVehicle("TESLA", "model  3")?.id).toBe("tesla-model-3");
  });

  it("returns null for a petrol car that is not in the EV catalog", () => {
    expect(matchCatalogVehicle("Toyota", "Corolla")).toBeNull();
  });

  it("returns null rather than guessing on unknown text", () => {
    expect(matchCatalogVehicle("Acme", "Rocket Sled")).toBeNull();
    expect(matchCatalogVehicle("", "")).toBeNull();
  });

  it("matches no petrol vehicle at all", () => {
    // The guard that matters most. A petrol car that matches is not merely
    // missed — it is shown on an EV marketplace, labelled as the electric car it
    // was mistaken for. This caught "BMW X5 xDrive40i" being matched to the
    // electric "BMW iX xDrive40" by a generated-alias rule, which is why aliases
    // are now curated by hand.
    const falsePositives = vehicles
      .filter((v) => v.type === "gas")
      .map((g) => {
        const [make, ...rest] = g.name.split(" ");
        const m = matchCatalogVehicle(make, rest.join(" "));
        return m ? `"${g.name}" matched ${m.make} ${m.model}` : null;
      })
      .filter(Boolean);
    expect(falsePositives).toEqual([]);
  });

  it("matches every EV in the catalog by its own name", () => {
    // Guards the alias table against drift as the catalog grows.
    const evs = vehicles.filter((v) => v.type === "ev");
    const missed = evs.filter((v) => {
      const [make, ...rest] = v.name.split(" ");
      return matchCatalogVehicle(make, rest.join(" ")) === null;
    });
    expect(missed.map((v) => v.name)).toEqual([]);
  });
});

describe("catalogSearchModels", () => {
  it("returns distinct model names for the upstream OR query", () => {
    const models = catalogSearchModels();
    expect(models.length).toBeGreaterThan(0);
    expect(new Set(models).size).toBe(models.length);
  });

  it("contains no empty entries and nothing with a comma", () => {
    // The provider joins these with commas as a logical OR, so an embedded
    // comma would silently split one model into two bogus ones.
    for (const m of catalogSearchModels()) {
      expect(m.trim()).not.toBe("");
      expect(m).not.toContain(",");
    }
  });
});
