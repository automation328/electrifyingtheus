import { describe, it, expect } from "vitest";
import {
  readFilters, writeFilters, serverFilters, applyFilters, activeFilterCount,
  filterChips, localFilterCount, bodyStyleOf, EMPTY_FILTERS, type FilterState,
} from "./marketplace-filters";
import type { VehicleListing } from "./marketplace-types";

const listing = (id: string, over: Partial<VehicleListing> = {}): VehicleListing => ({
  id,
  year: 2022,
  make: "Tesla",
  model: "Model 3",
  condition: "used",
  powertrain: "ev",
  catalogId: "tesla-model-3", // a sedan in the catalog
  ...over,
});

const ids = (rows: VehicleListing[]) => rows.map((r) => r.id).sort();
const state = (over: Partial<FilterState> = {}): FilterState => ({ ...EMPTY_FILTERS, ...over });

describe("readFilters", () => {
  it("reads every filter off the URL", () => {
    const params = new URLSearchParams(
      "condition=new&powertrain=phev&makes=Tesla,Kia&models=Model 3&bodies=sedan,truck"
      + "&priceMin=10000&priceMax=45000&yearMin=2020&yearMax=2024&mileageMax=40000&rangeMin=250",
    );
    expect(readFilters(params)).toEqual({
      condition: "new",
      powertrain: "phev",
      makes: ["Tesla", "Kia"],
      models: ["Model 3"],
      bodies: ["sedan", "truck"],
      priceMin: 10000,
      priceMax: 45000,
      yearMin: 2020,
      yearMax: 2024,
      mileageMax: 40000,
      rangeMin: 250,
    });
  });

  it("falls back for junk anyone can type into the address bar", () => {
    const params = new URLSearchParams(
      "condition=cheap&powertrain=diesel&bodies=spaceship,sedan&priceMin=-5&mileageMax=abc",
    );
    const read = readFilters(params);
    expect(read.condition).toBe("all");
    expect(read.powertrain).toBe("all");
    expect(read.bodies).toEqual(["sedan"]);
    expect(read.priceMin).toBeUndefined();
    expect(read.mileageMax).toBeUndefined();
  });

  it("round-trips through writeFilters", () => {
    const original = state({
      condition: "used", powertrain: "ev", makes: ["Kia"], bodies: ["suv-compact"],
      priceMin: 15000, yearMax: 2023, mileageMax: 60000, rangeMin: 200,
    });
    expect(readFilters(writeFilters(new URLSearchParams(), original))).toEqual(original);
  });
});

describe("writeFilters", () => {
  it("leaves params it does not own alone and clears the ones it does", () => {
    const before = new URLSearchParams("q=30080&radius=50&sort=price-asc&embed=1&makes=Tesla");
    const after = writeFilters(before, state({ condition: "new" }));
    expect(after.get("q")).toBe("30080");
    expect(after.get("radius")).toBe("50");
    expect(after.get("sort")).toBe("price-asc");
    expect(after.get("embed")).toBe("1");
    expect(after.get("makes")).toBeNull();
    expect(after.get("condition")).toBe("new");
  });

  it("does not mutate the params it was given", () => {
    const before = new URLSearchParams("q=30080");
    writeFilters(before, state({ condition: "new" }));
    expect(before.toString()).toBe("q=30080");
  });
});

describe("serverFilters", () => {
  it("passes upstream every filter the provider can apply", () => {
    const full = state({
      condition: "new", powertrain: "ev", makes: ["Tesla"], models: ["Model 3"],
      bodies: ["sedan"], priceMin: 10000, priceMax: 50000, yearMin: 2021, yearMax: 2025,
      mileageMax: 30000, rangeMin: 250,
    });
    // Make and model belong here: applied locally they could only hide cars on
    // the page while the rest of that make sat on pages nobody would open.
    expect(serverFilters(full)).toEqual({
      priceMin: 10000, priceMax: 50000, yearMin: 2021, yearMax: 2025,
      makes: ["Tesla"], models: ["Model 3"],
    });
  });

  it("leaves out the ones the provider has no filter for", () => {
    const keys = Object.keys(serverFilters(state({
      condition: "new", powertrain: "ev", bodies: ["sedan"], mileageMax: 30000, rangeMin: 250,
    })));
    for (const local of ["condition", "powertrain", "bodies", "mileageMax", "rangeMin"]) {
      expect(keys).not.toContain(local);
    }
  });
});

describe("localFilterCount", () => {
  it("counts only the filters that hide listings the search returned", () => {
    expect(localFilterCount(EMPTY_FILTERS)).toBe(0);
    // These change WHICH listings come back, so nothing on screen is hidden.
    expect(localFilterCount(state({
      makes: ["Tesla"], models: ["Model 3"], priceMax: 40000, yearMin: 2020,
    }))).toBe(0);
    // These are applied to the page, so "3 of 18" is the honest reading.
    expect(localFilterCount(state({ condition: "new" }))).toBe(1);
    expect(localFilterCount(state({ bodies: ["sedan", "truck"], rangeMin: 250 }))).toBe(3);
    expect(localFilterCount(state({ powertrain: "ev", mileageMax: 50000 }))).toBe(2);
  });
});

describe("applyFilters", () => {
  const rows = [
    listing("tesla-used", { price: 30000, mileage: 40000, rangeMi: 321 }),
    listing("tesla-new", { condition: "new", price: 45000, mileage: 12, rangeMi: 321 }),
    listing("kia-phev", {
      make: "Kia", model: "Niro", catalogId: "kia-niro-ev",
      powertrain: "phev", price: 22000, mileage: 65000, rangeMi: 253,
    }),
    listing("no-price", { price: undefined, mileage: undefined, rangeMi: undefined }),
  ];

  it("returns everything when nothing is set", () => {
    expect(applyFilters(rows, EMPTY_FILTERS)).toHaveLength(4);
  });

  it("filters on condition, powertrain and make", () => {
    expect(ids(applyFilters(rows, state({ condition: "new" })))).toEqual(["tesla-new"]);
    expect(ids(applyFilters(rows, state({ powertrain: "phev" })))).toEqual(["kia-phev"]);
    expect(ids(applyFilters(rows, state({ makes: ["Kia"] })))).toEqual(["kia-phev"]);
  });

  it("treats several makes as OR, not AND", () => {
    expect(ids(applyFilters(rows, state({ makes: ["Tesla", "Kia"] }))))
      .toEqual(["kia-phev", "no-price", "tesla-new", "tesla-used"]);
  });

  it("drops a listing whose value is unknown rather than letting it through", () => {
    expect(ids(applyFilters(rows, state({ priceMax: 50000 }))))
      .toEqual(["kia-phev", "tesla-new", "tesla-used"]);
    expect(ids(applyFilters(rows, state({ mileageMax: 50000 }))))
      .toEqual(["tesla-new", "tesla-used"]);
    expect(ids(applyFilters(rows, state({ rangeMin: 300 }))))
      .toEqual(["tesla-new", "tesla-used"]);
  });

  it("combines dimensions as AND", () => {
    expect(ids(applyFilters(rows, state({ makes: ["Tesla"], condition: "used", priceMax: 35000 }))))
      .toEqual(["tesla-used"]);
  });

  it("matches a model the loose way dealer text demands", () => {
    const written = [
      listing("exact", { model: "Mustang Mach-E", catalogId: "ford-mustang-mach-e" }),
      listing("shortened", { model: "Mach E", catalogId: "ford-mustang-mach-e" }),
      listing("shouted", { model: "MUSTANG MACH-E Premium AWD", catalogId: "ford-mustang-mach-e" }),
      listing("other", { model: "Model 3" }),
    ];
    expect(ids(applyFilters(written, state({ models: ["Mustang Mach-E"] }))))
      .toEqual(["exact", "shortened", "shouted"]);
    expect(ids(applyFilters(written, state({ models: ["Model 3"] })))).toEqual(["other"]);
  });

  it("treats several models as OR and ignores an empty one", () => {
    const written = [
      listing("a", { model: "EV6" }),
      listing("b", { model: "Model Y" }),
      listing("c", { model: "i4" }),
    ];
    expect(ids(applyFilters(written, state({ models: ["EV6", "Model Y"] })))).toEqual(["a", "b"]);
    expect(applyFilters(written, state({ models: ["  "] }))).toHaveLength(0);
  });

  it("filters on body style through the catalog join", () => {
    expect(bodyStyleOf(rows[0])).toBe("sedan");
    expect(ids(applyFilters(rows, state({ bodies: ["sedan"] }))))
      .toEqual(["no-price", "tesla-new", "tesla-used"]);
  });
});

describe("activeFilterCount", () => {
  it("counts a price or year range once, and each tick separately", () => {
    expect(activeFilterCount(EMPTY_FILTERS)).toBe(0);
    expect(activeFilterCount(state({ priceMin: 1000, priceMax: 2000 }))).toBe(1);
    expect(activeFilterCount(state({ makes: ["Tesla", "Kia"], bodies: ["sedan"] }))).toBe(3);
    expect(activeFilterCount(state({ condition: "new", powertrain: "ev", rangeMin: 200 }))).toBe(3);
  });
});

describe("filterChips", () => {
  it("labels what is applied and hands back the state without it", () => {
    const applied = state({ condition: "used", makes: ["Tesla"], priceMax: 40000 });
    const chips = filterChips(applied);
    expect(chips.map((c) => c.label)).toEqual(["Used", "Tesla", "Under $40,000"]);
    expect(chips[1].next.makes).toEqual([]);
    expect(chips[1].next.condition).toBe("used");
    expect(chips[2].next.priceMax).toBeUndefined();
  });

  it("is empty when nothing is applied", () => {
    expect(filterChips(EMPTY_FILTERS)).toEqual([]);
  });
});
