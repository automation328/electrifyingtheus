import { describe, it, expect, vi, afterEach } from "vitest";
import { buildAutoDevQuery, normalizeAutoDevListing, haversineMiles, autoDevProvider } from "./_marketplace-provider.js";

afterEach(() => { vi.unstubAllGlobals(); vi.unstubAllEnvs(); });

describe("haversineMiles", () => {
  it("is zero for the same point", () => {
    expect(haversineMiles(33.75, -84.39, 33.75, -84.39)).toBe(0);
  });

  it("matches a known distance (Atlanta to Athens GA ~60mi)", () => {
    const d = haversineMiles(33.749, -84.388, 33.9519, -83.3576);
    expect(d).toBeGreaterThan(55);
    expect(d).toBeLessThan(70);
  });

  it("is symmetric", () => {
    const a = haversineMiles(40.7, -74.0, 34.05, -118.24);
    const b = haversineMiles(34.05, -118.24, 40.7, -74.0);
    expect(Math.abs(a - b)).toBeLessThan(0.001);
  });
});

describe("buildAutoDevQuery", () => {
  it("sends zip and distance, which is how this provider does geography", () => {
    const q = buildAutoDevQuery({ zip: "30301", radius: 25, models: ["Model 3"] });
    expect(q.get("zip")).toBe("30301");
    expect(q.get("distance")).toBe("25");
  });

  it("joins models into one comma-separated OR filter", () => {
    // One upstream request per search rather than one per model is what keeps
    // ordinary usage inside the free tier.
    const q = buildAutoDevQuery({ zip: "30301", radius: 25, models: ["Model 3", "Ioniq 5"] });
    expect(q.get("vehicle.model")).toBe("Model 3,Ioniq 5");
  });

  it("omits the model filter when no models are given rather than sending empty", () => {
    const q = buildAutoDevQuery({ zip: "30301", radius: 25, models: [] });
    expect(q.has("vehicle.model")).toBe(false);
  });

  it("passes price and year ranges through in the provider's range syntax", () => {
    const q = buildAutoDevQuery({
      zip: "30301", radius: 25, models: [], priceMin: 10000, priceMax: 30000, yearMin: 2020, yearMax: 2024,
    });
    expect(q.get("retailListing.price")).toBe("10000-30000");
    expect(q.get("vehicle.year")).toBe("2020-2024");
  });

  it("clamps the page size to the provider cap", () => {
    const q = buildAutoDevQuery({ zip: "30301", radius: 25, models: [], limit: 5000 });
    expect(Number(q.get("limit"))).toBeLessThanOrEqual(100);
  });
});

describe("normalizeAutoDevListing", () => {
  const raw = {
    id: "abc123",
    vin: "5YJ3E1EA7KF000000",
    vehicle: { year: 2022, make: "Tesla", model: "Model 3", trim: "Long Range" },
    retailListing: {
      price: 28995, miles: 31000, condition: "used",
      dealerName: "Atlanta Motors", city: "Atlanta", state: "GA",
      latitude: 33.749, longitude: -84.388,
      photoUrls: ["https://img.example/1.jpg"],
      vdpUrl: "https://dealer.example/listing/abc123",
    },
  };

  it("maps a well-formed listing onto our shape", () => {
    const l = normalizeAutoDevListing(raw);
    expect(l).toMatchObject({
      id: "5YJ3E1EA7KF000000", year: 2022, make: "Tesla", model: "Model 3",
      price: 28995, mileage: 31000, condition: "used",
      dealerName: "Atlanta Motors", city: "Atlanta", state: "GA",
    });
    expect(l?.photoUrl).toBe("https://img.example/1.jpg");
    expect(l?.listingUrl).toBe("https://dealer.example/listing/abc123");
  });

  it("prefers the VIN as the id, falling back to the provider id", () => {
    expect(normalizeAutoDevListing(raw)?.id).toBe(raw.vin);
    const noVin = { ...raw, vin: undefined };
    expect(normalizeAutoDevListing(noVin)?.id).toBe("abc123");
  });

  it("returns null when there is no usable identity", () => {
    expect(normalizeAutoDevListing({ vehicle: { year: 2022, make: "Tesla", model: "Model 3" } })).toBeNull();
  });

  it("returns null without a year, make or model — we cannot match it to a catalog EV", () => {
    expect(normalizeAutoDevListing({ id: "x", vehicle: { make: "Tesla", model: "Model 3" } })).toBeNull();
    expect(normalizeAutoDevListing({ id: "x", vehicle: { year: 2022, model: "Model 3" } })).toBeNull();
    expect(normalizeAutoDevListing({ id: "x", vehicle: { year: 2022, make: "Tesla" } })).toBeNull();
  });

  it("tolerates a missing price rather than inventing one", () => {
    const hidden = { ...raw, retailListing: { ...raw.retailListing, price: undefined } };
    const l = normalizeAutoDevListing(hidden);
    expect(l).not.toBeNull();
    expect(l?.price).toBeUndefined();
  });

  it("survives junk without throwing", () => {
    expect(normalizeAutoDevListing(null)).toBeNull();
    expect(normalizeAutoDevListing({})).toBeNull();
    expect(normalizeAutoDevListing({ id: "x", vehicle: "not-an-object" })).toBeNull();
  });
});

describe("autoDevProvider", () => {
  it("reports itself unconfigured with no API key, and never calls out", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "");
    const fetchSpy = vi.fn();
    vi.stubGlobal("fetch", fetchSpy);
    const p = autoDevProvider();
    expect(p.configured).toBe(false);
    expect(fetchSpy).not.toHaveBeenCalled();
  });

  it("sends the key as a header, never in the query string", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "secret-key-value");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ records: [] }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await autoDevProvider().search({ zip: "30301", radius: 25, models: ["Model 3"] });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).not.toContain("secret-key-value");
    expect((init.headers as Record<string, string>)["X-API-Key"]).toBe("secret-key-value");
  });

  it("returns an empty list rather than throwing when the provider errors", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 503, json: async () => ({}) }));
    await expect(autoDevProvider().search({ zip: "30301", radius: 25, models: [] })).resolves.toEqual([]);
  });

  it("returns an empty list when the network fails", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("ECONNRESET")));
    await expect(autoDevProvider().search({ zip: "30301", radius: 25, models: [] })).resolves.toEqual([]);
  });
});
