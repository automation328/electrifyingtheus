import { afterEach, describe, expect, it, vi } from "vitest";
import { lookupZip, modelsOf, RANGE_MAKES, rangeRings, variantLabel, variantsOf, yearsOf } from "./range-map";

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
  it("only offers cars with EPA figures, newest year first", () => {
    expect(RANGE_MAKES.length).toBeGreaterThan(0);
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

describe("lookupZip", () => {
  afterEach(() => vi.unstubAllGlobals());

  const respond = (status: number, body: unknown = {}) =>
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue(new Response(JSON.stringify(body), { status })));

  it("rejects anything but five digits without a request", async () => {
    const f = vi.fn();
    vi.stubGlobal("fetch", f);
    expect(await lookupZip("9410")).toBeNull();
    expect(f).not.toHaveBeenCalled();
  });

  it("parses a hit", async () => {
    respond(200, { places: [{ "place name": "San Francisco", "state abbreviation": "CA", latitude: "37.77", longitude: "-122.41" }] });
    expect(await lookupZip("94103")).toEqual({ zip: "94103", lat: 37.77, lon: -122.41, label: "San Francisco, CA 94103" });
  });

  it("null for an unknown ZIP, throws when the service fails", async () => {
    respond(404);
    expect(await lookupZip("00000")).toBeNull();
    respond(503);
    await expect(lookupZip("94103")).rejects.toThrow();
  });
});
