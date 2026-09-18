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

describe("the electric-specific nameplates never claim a petrol car", () => {
  // Every one of these pairs is a real trap: the same word sells two different
  // cars, one of which burns petrol. The catalog carries the electric name, and
  // the matcher must refuse the other. If one of these ever flips, a petrol car
  // reaches an EV marketplace and only the provider's fuel field stands in the
  // way — and that field is not always populated.
  const traps: Array<[string, string, string, string]> = [
    ["Hyundai", "Kona Electric", "Hyundai", "Kona"],
    ["Kia", "Soul EV", "Kia", "Soul"],
    ["Toyota", "RAV4 EV", "Toyota", "RAV4"],
    ["Toyota", "C-HR EV", "Toyota", "C-HR"],
    ["Chevrolet", "Spark EV", "Chevrolet", "Spark"],
    ["Ford", "Focus Electric", "Ford", "Focus"],
    ["Honda", "Fit EV", "Honda", "Fit"],
    ["Mini", "Cooper SE", "Mini", "Cooper S"],
    ["Volkswagen", "e-Golf", "Volkswagen", "Golf"],
    ["Lexus", "ES 350e", "Lexus", "ES 350"],
    ["Ford", "F-150 Lightning", "Ford", "F-150"],
    ["smart", "Fortwo Electric Drive", "smart", "Fortwo"],
  ];

  it.each(traps)("%s %s is found, and %s %s is not", (make, electric, petrolMake, petrol) => {
    expect(matchCatalogVehicle(make, electric), `${make} ${electric}`).not.toBeNull();
    expect(matchCatalogVehicle(petrolMake, petrol), `${petrolMake} ${petrol}`).toBeNull();
  });

  it("reads the trim text dealers actually write", () => {
    expect(matchCatalogVehicle("Hyundai", "KONA ELECTRIC SEL")?.id).toBe("hyundai-kona-electric");
    expect(matchCatalogVehicle("Ford", "F-150 Lightning Lariat")?.id).toBe("ford-f150-lightning");
    expect(matchCatalogVehicle("Chevrolet", "Bolt EUV Premier")?.id).toBe("chevy-bolt-euv");
    expect(matchCatalogVehicle("Tesla", "Model S Plaid")?.id).toBe("tesla-model-s");
    expect(matchCatalogVehicle("Jaguar", "I-PACE HSE")?.id).toBe("jaguar-i-pace");
  });

  it("prefers the more specific nameplate when two could match", () => {
    // "Bolt" and "Bolt EUV" are different cars with different range figures.
    expect(matchCatalogVehicle("Chevrolet", "Bolt EV")?.id).toBe("chevy-bolt-ev");
    expect(matchCatalogVehicle("Chevrolet", "Bolt EUV")?.id).toBe("chevy-bolt-euv");
    expect(matchCatalogVehicle("BMW", "iX xDrive40")?.id).toBe("bmw-ix-xdrive40");
    expect(matchCatalogVehicle("BMW", "iX")?.id).toBe("bmw-ix");
  });

  it("finds the cars whose spelling the catalog used to miss", () => {
    // Dealers write these the other way round from how the catalog names them.
    expect(matchCatalogVehicle("Genesis", "Electrified G80")?.id).toBe("genesis-g80-electrified");
    expect(matchCatalogVehicle("Genesis", "Electrified GV70")?.id).toBe("genesis-gv70-electrified");
    expect(matchCatalogVehicle("Audi", "A6 Sportback e-tron")?.id).toBe("audi-a6-etron");
    expect(matchCatalogVehicle("Audi", "Q4 Sportback e-tron")?.id).toBe("audi-q4-etron");
    expect(matchCatalogVehicle("Volvo", "XC40 Recharge")?.id).toBe("volvo-ex40");
    expect(matchCatalogVehicle("Volvo", "C40 Recharge")?.id).toBe("volvo-c40");
    expect(matchCatalogVehicle("Lexus", "RZ 300e")?.id).toBe("lexus-rz-450e");
  });
});
