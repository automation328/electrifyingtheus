import { afterEach, describe, expect, it, vi } from "vitest";
import { getVehiclesByType } from "@/data/vehicles";
import { citiesWithin, poisWithin, detectZip, lookupPlace, milesBetween, lookupZip, modelsOf, RANGE_MAKES, RANGE_MODELS, rangeRings, variantLabel, variantsOf, yearsOf } from "./range-map";

describe("citiesWithin", () => {
  const smyrna = { lat: 33.88, lon: -84.51 };
  it("measures great-circle miles", () => {
    // Atlanta to Nashville is about 214 miles in a straight line.
    expect(Math.round(milesBetween({ lat: 33.749, lon: -84.388 }, { lat: 36.162, lon: -86.781 }))).toBeGreaterThan(205);
    expect(Math.round(milesBetween({ lat: 33.749, lon: -84.388 }, { lat: 36.162, lon: -86.781 }))).toBeLessThan(220);
  });
  it("lists major cities inside the radius, nearest first", () => {
    const list = citiesWithin(smyrna, 285);
    const names = list.map((c) => `${c.name}, ${c.state}`);
    expect(names).toContain("Atlanta, GA");
    expect(names).toContain("Nashville, TN");
    expect(names).not.toContain("Memphis, TN");
    expect(list.map((c) => c.miles)).toEqual([...list.map((c) => c.miles)].sort((a, b) => a - b));
    expect(list.every((c) => c.miles <= 285)).toBe(true);
  });
  it("is empty for no range", () => {
    expect(citiesWithin(smyrna, 0)).toEqual([]);
  });
});

describe("poisWithin", () => {
  it("lists Colorado places in range, nearest first", () => {
    const denver = { lat: 39.74, lon: -104.99 };
    const list = poisWithin(denver, 100);
    expect(list[0].miles).toBeLessThanOrEqual(list[list.length - 1].miles);
    expect(list.map((p) => p.name)).toContain("Red Rocks Park and Amphitheatre");
    expect(list.map((p) => p.name)).not.toContain("Mesa Verde National Park");
    expect(poisWithin({ lat: 33.88, lon: -84.51 }, 300)).toEqual([]);
  });
});

describe("rangeRings", () => {
  it("scales by charge, then derives winter", () => {
    expect(rangeRings(300, 100)).toEqual({ full: 300, winter: 210 });
    expect(rangeRings(300, 80)).toEqual({ full: 240, winter: 168 });
  });

  it("clamps charge to 0–100%", () => {
    expect(rangeRings(300, 150).full).toBe(300);
    expect(rangeRings(300, -5).full).toBe(0);
  });
});

describe("vehicle lists", () => {
  it("offers exactly the EV vs Gas calculator's EVs", () => {
    const calculator = getVehiclesByType("ev").map((v) => v.id).sort();
    expect(RANGE_MODELS.map((e) => e.id).sort()).toEqual(calculator);
    expect(RANGE_MAKES.flatMap(modelsOf)).toHaveLength(calculator.length);
  });

  it("gives every car a range, EPA or catalog", () => {
    const noRange = RANGE_MODELS.filter((e) => !(variantsOf(e.id, yearsOf(e.id)[0] ?? 0)[0]?.[0] > 0));
    expect(noRange).toEqual([]);
    expect(yearsOf("kia-ev4")).toEqual([]);
    expect(variantsOf("kia-ev4", 0)).toEqual([[330, ""]]);
  });

  it("lists model years newest first", () => {
    const leaf = modelsOf("Nissan").find((m) => m.model.toUpperCase().includes("LEAF"));
    expect(leaf).toBeDefined();
    const years = yearsOf(leaf!.id);
    expect(years).toEqual([...years].sort((a, b) => b - a));
    expect(variantsOf(leaf!.id, 2013)[0]?.[0]).toBe(75);
  });

  it("labels variants with trim, drive and miles", () => {
    expect(variantLabel([330, "a", "long range"])).toBe("Long Range AWD · 330 mi");
    expect(variantLabel([200, ""])).toBe("Standard · 200 mi");
  });
});

const respond = (status: number, body: unknown = {}) =>
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

describe("detectZip", () => {
  afterEach(() => vi.unstubAllGlobals());

  const answer = (geo: unknown, ipapi: unknown) =>
    vi.stubGlobal("fetch", vi.fn((url: string) =>
      Promise.resolve(new Response(JSON.stringify(url === "/api/geo" ? geo : ipapi)))));

  it("prefers our edge headers", async () => {
    answer({ country: "US", postal: "80202" }, { country_code: "US", postal: "94103" });
    expect(await detectZip()).toBe("80202");
  });

  it("falls back to ipapi when the edge has no ZIP", async () => {
    answer({ country: "US" }, { country_code: "US", postal: "94103-1234" });
    expect(await detectZip()).toBe("94103");
  });

  it("gives nothing outside the U.S. or when both fail", async () => {
    answer({ country: "PH", postal: "1000" }, { country_code: "PH", postal: "1000" });
    expect(await detectZip()).toBe("");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    expect(await detectZip()).toBe("");
  });
});

describe("lookupPlace", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("sends a place name to our geocoder, encoded", async () => {
    respond(200, { lat: 39.74, lon: -104.99, label: "Denver, Colorado" });
    expect(await lookupPlace(" Denver, CO ")).toEqual({ lat: 39.74, lon: -104.99, label: "Denver, Colorado" });
    expect(fetch).toHaveBeenCalledWith("/api/stations?op=geocode&q=Denver%2C%20CO", { signal: undefined });
  });

  it("sends a ZIP to the ZIP lookup", async () => {
    respond(404);
    await lookupPlace("00000");
    expect(vi.mocked(fetch).mock.calls[0][0]).toContain("zippopotam");
  });

  it("null for no match or a blank box, throws when the service fails", async () => {
    respond(404);
    expect(await lookupPlace("nowhere")).toBeNull();
    expect(await lookupPlace("  ")).toBeNull();
    respond(500);
    await expect(lookupPlace("Denver")).rejects.toThrow();
  });
});

describe("lookupZip", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("rejects anything but five digits without a request", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await lookupZip("9410")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("parses a hit", async () => {
    respond(200, { places: [{ "place name": "San Francisco", "state abbreviation": "CA", latitude: "37.77", longitude: "-122.41" }] });
    expect(await lookupZip("94103")).toEqual({ lat: 37.77, lon: -122.41, label: "San Francisco, CA 94103" });
  });

  it("null for an unknown ZIP, throws when the service fails", async () => {
    respond(404);
    expect(await lookupZip("00000")).toBeNull();
    respond(503);
    await expect(lookupZip("94103")).rejects.toThrow();
  });
});
