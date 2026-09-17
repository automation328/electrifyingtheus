import { describe, it, expect, vi, afterEach } from "vitest";
import {
  buildAutoDevQuery, normalizeAutoDevListing, haversineMiles, autoDevProvider,
  listingPowertrain, autoDevCoords, autoDevSearchRaw, MAX_PAGE,
} from "./_marketplace-provider.js";

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

  it("asks for the match count, which is opt-in upstream", () => {
    const q = buildAutoDevQuery({ zip: "30301", radius: 25, models: [] });
    expect(q.get("includes")).toBe("total");
  });

  it("passes a sort through and leaves it off when none is asked for", () => {
    expect(buildAutoDevQuery({ zip: "30301", radius: 25, models: [], sort: "price.asc" }).get("sort"))
      .toBe("price.asc");
    expect(buildAutoDevQuery({ zip: "30301", radius: 25, models: [] }).has("sort")).toBe(false);
  });

  it("sends a page only past the first, and never past the cursor-free limit", () => {
    expect(buildAutoDevQuery({ zip: "30301", radius: 25, models: [], page: 1 }).has("page")).toBe(false);
    expect(buildAutoDevQuery({ zip: "30301", radius: 25, models: [], page: 4 }).get("page")).toBe("4");
    expect(Number(buildAutoDevQuery({ zip: "30301", radius: 25, models: [], page: 9999 }).get("page")))
      .toBe(MAX_PAGE);
  });
});

describe("autoDevSearchRaw", () => {
  const search = () => autoDevSearchRaw({ zip: "30301", radius: 25, models: [], limit: 100 });

  it("reads the rows, the match count and the next-page link", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ records: [{ a: 1 }], total: 137, links: { next: "https://api/x?page=2" } }),
    }));
    await expect(search()).resolves.toEqual({ rows: [{ a: 1 }], total: 137, hasMore: true });
  });

  it("treats a full page as more to come when the provider offers no next link", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "k");
    const rows = Array.from({ length: 100 }, (_, i) => ({ i }));
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ records: rows }),
    }));
    const page = await search();
    expect(page.hasMore).toBe(true);
    expect(page.total).toBeUndefined();
  });

  it("does not claim more pages on a short one", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ records: [{ a: 1 }], links: {} }),
    }));
    await expect(search()).resolves.toEqual({ rows: [{ a: 1 }], total: undefined, hasMore: false });
  });

  it("degrades to an empty page when the provider fails", async () => {
    vi.stubEnv("MARKETPLACE_API_KEY", "k");
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({ ok: false, status: 500, json: async () => ({}) }));
    await expect(search()).resolves.toEqual({ rows: [], hasMore: false });
  });
});

describe("normalizeAutoDevListing", () => {
  // Shape taken from a real api.auto.dev response, not the docs.
  const raw = {
    "@id": "https://api.auto.dev/listings/5YJ3E1EA7KF000000",
    vin: "5YJ3E1EA7KF000000",
    location: [-84.388, 33.749],
    vehicle: { year: 2022, make: "Tesla", model: "Model 3", trim: "Long Range", fuel: "Electric" },
    retailListing: {
      price: 28995, miles: 31000, used: true,
      dealer: "Atlanta Motors", city: "Atlanta", state: "GA",
      primaryImage: "https://img.example/1.jpg",
      vdp: "https://dealer.example/listing/abc123",
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

  it("prefers the VIN as the id, falling back to the record @id", () => {
    expect(normalizeAutoDevListing(raw)?.id).toBe(raw.vin);
    const noVin = { ...raw, vin: undefined };
    expect(normalizeAutoDevListing(noVin)?.id).toBe(raw["@id"]);
  });

  it("returns null when there is no usable identity", () => {
    expect(normalizeAutoDevListing({ vehicle: { year: 2022, make: "Tesla", model: "Model 3" } })).toBeNull();
  });

  it("reads condition from the used boolean, not a condition string", () => {
    expect(normalizeAutoDevListing(raw)?.condition).toBe("used");
    expect(normalizeAutoDevListing({ ...raw, retailListing: { ...raw.retailListing, used: false } })?.condition).toBe("new");
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

  it("sends the key as a Bearer header, never in the query string", async () => {
    // The provider also accepts ?apiKey=, which must never be used: query
    // strings are recorded in access logs, proxies and error reports.
    vi.stubEnv("MARKETPLACE_API_KEY", "secret-key-value");
    const fetchSpy = vi.fn().mockResolvedValue({
      ok: true, status: 200, json: async () => ({ records: [] }),
    });
    vi.stubGlobal("fetch", fetchSpy);

    await autoDevProvider().search({ zip: "30301", radius: 25, models: ["Model 3"] });

    const [url, init] = fetchSpy.mock.calls[0];
    expect(String(url)).not.toContain("secret-key-value");
    expect(String(url).toLowerCase()).not.toContain("apikey");
    expect((init.headers as Record<string, string>).Authorization).toBe("Bearer secret-key-value");
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

describe("listingPowertrain", () => {
  const withFuel = (fuel: unknown) => ({ vehicle: { fuel } });

  it("accepts electric", () => {
    expect(listingPowertrain(withFuel("Electric"))).toBe("ev");
  });

  it("accepts plug-in hybrid", () => {
    expect(listingPowertrain(withFuel("Plug-in Hybrid"))).toBe("phev");
  });

  it("REJECTS petrol and diesel, which is the whole point", () => {
    // Observed live: the provider returns "Gasoline" for petrol cars. Without
    // this gate a petrol car whose name resembles an EV would be listed on an
    // EV marketplace.
    expect(listingPowertrain(withFuel("Gasoline"))).toBeNull();
    expect(listingPowertrain(withFuel("Diesel"))).toBeNull();
  });

  it("rejects a plain hybrid, which is not a plug-in", () => {
    expect(listingPowertrain(withFuel("Hybrid"))).toBeNull();
  });

  it("returns null for missing or junk fuel rather than assuming electric", () => {
    expect(listingPowertrain(withFuel(undefined))).toBeNull();
    expect(listingPowertrain({})).toBeNull();
    expect(listingPowertrain(null)).toBeNull();
  });
});

describe("autoDevCoords", () => {
  it("reads location as GeoJSON [longitude, latitude], not [lat, lon]", () => {
    // Atlanta is 33.7N, 84.4W. Reversing these puts every car in the wrong
    // place and ranks results by a meaningless distance.
    expect(autoDevCoords({ location: [-84.388, 33.749] })).toEqual({ lat: 33.749, lon: -84.388 });
  });

  it("falls back to explicit latitude/longitude fields", () => {
    expect(autoDevCoords({ retailListing: { latitude: 33.749, longitude: -84.388 } }))
      .toEqual({ lat: 33.749, lon: -84.388 });
  });

  it("returns null when there are no coordinates", () => {
    expect(autoDevCoords({})).toBeNull();
    expect(autoDevCoords({ location: [1] })).toBeNull();
    expect(autoDevCoords(null)).toBeNull();
  });
});
