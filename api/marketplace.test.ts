import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

// The endpoint resolves places and talks to a provider. Both are stubbed: no
// test performs a live geocode or a live upstream call.
vi.mock("./_geocode.js", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("./_geocode.js");
  return {
    ...actual,
    resolveQuery: vi.fn(),
  };
});
vi.mock("./_rate-limit.js", () => ({
  checkRateLimit: vi.fn().mockResolvedValue({ ok: true, hits: 1, limit: 120, retryAfter: 60 }),
  tooManyRequests: vi.fn((res: { status: (n: number) => { json: (o: unknown) => void } }) =>
    res.status(429).json({ error: "rate_limited" })),
}));
vi.mock("./_marketplace-provider.js", async () => {
  const actual = await vi.importActual<Record<string, unknown>>("./_marketplace-provider.js");
  return {
    ...actual,
    autoDevProvider: vi.fn(() => ({ configured: true, search: vi.fn() })),
    autoDevSearchRaw: vi.fn().mockResolvedValue([]),
  };
});

import handler from "./marketplace.js";
import { resolveQuery } from "./_geocode.js";
import { autoDevProvider, autoDevSearchRaw } from "./_marketplace-provider.js";
import { checkRateLimit } from "./_rate-limit.js";

const ATLANTA = { lat: 33.749, lon: -84.388, label: "Atlanta, GA", kind: "city", radius: 30, postcode: "30303" };

function mockRes() {
  const out: { code?: number; body?: unknown; headers: Record<string, string> } = { headers: {} };
  const res = {
    status(c: number) { out.code = c; return res; },
    json(b: unknown) { out.body = b; return res; },
    setHeader(k: string, v: string) { out.headers[k] = v; },
    _out: out,
  };
  return res;
}

const listingRow = (over: Record<string, unknown> = {}) => ({
  id: "row-1",
  vin: "5YJ3E1EA7KF000001",
  vehicle: { year: 2022, make: "Tesla", model: "Model 3", trim: "Long Range" },
  retailListing: {
    price: 28995, miles: 31000, condition: "used",
    dealerName: "Atlanta Motors", city: "Atlanta", state: "GA",
    latitude: 33.76, longitude: -84.39,
    photoUrls: ["https://img.example/1.jpg"], vdpUrl: "https://dealer.example/1",
    ...(over.retailListing as Record<string, unknown> ?? {}),
  },
  ...over,
});

beforeEach(() => {
  vi.mocked(resolveQuery).mockResolvedValue(ATLANTA as never);
  vi.mocked(autoDevProvider).mockReturnValue({ configured: true, search: vi.fn() } as never);
  vi.mocked(autoDevSearchRaw).mockResolvedValue([]);
  vi.mocked(checkRateLimit).mockResolvedValue({ ok: true, hits: 1, limit: 120, retryAfter: 60 } as never);
});
afterEach(() => vi.clearAllMocks());

describe("GET /api/marketplace", () => {
  it("rejects a non-GET method", async () => {
    const res = mockRes();
    await handler({ method: "POST", query: {} }, res);
    expect(res._out.code).toBe(405);
  });

  it("requires a location", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: {} }, res);
    expect(res._out.code).toBe(400);
  });

  it("returns 429 when rate limited, before doing any work", async () => {
    vi.mocked(checkRateLimit).mockResolvedValue({ ok: false, hits: 999, limit: 120, retryAfter: 60 } as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    expect(res._out.code).toBe(429);
    expect(resolveQuery).not.toHaveBeenCalled();
  });

  it("404s a location it cannot resolve", async () => {
    vi.mocked(resolveQuery).mockResolvedValue(null as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "nowhere at all" } }, res);
    expect(res._out.code).toBe(404);
  });

  it("says configured:false and does not call the provider without a key", async () => {
    vi.mocked(autoDevProvider).mockReturnValue({ configured: false, search: vi.fn() } as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    expect(res._out.code).toBe(200);
    expect(res._out.body).toMatchObject({ configured: false, listings: [] });
    expect(autoDevSearchRaw).not.toHaveBeenCalled();
  });

  it("returns a matched EV listing with its catalog id and distance", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue([listingRow()] as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);

    const body = res._out.body as { listings: Array<Record<string, unknown>>; configured: boolean };
    expect(body.configured).toBe(true);
    expect(body.listings).toHaveLength(1);
    expect(body.listings[0]).toMatchObject({
      catalogId: "tesla-model-3", make: "Tesla", model: "Model 3", price: 28995,
    });
    expect(body.listings[0].distanceMi).toBeTypeOf("number");
    expect(body.listings[0].distanceMi as number).toBeLessThan(5);
  });

  it("DROPS a listing that is not a known electrified model", async () => {
    // The whole point of the verification step: the provider cannot filter by
    // fuel type, so a petrol car can come back and must never be shown.
    vi.mocked(autoDevSearchRaw).mockResolvedValue([
      listingRow(),
      listingRow({ id: "row-2", vin: "JT2BF22K1W0000000", vehicle: { year: 2021, make: "Toyota", model: "Corolla" } }),
    ] as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);

    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    expect(body.listings).toHaveLength(1);
    expect(body.listings.some((l) => l.model === "Corolla")).toBe(false);
  });

  it("sorts nearest first and puts listings without coordinates last", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue([
      listingRow({ id: "far", vin: "VINFAR000000000001", retailListing: { latitude: 34.5, longitude: -84.9 } }),
      listingRow({ id: "nocoord", vin: "VINNOC000000000001", retailListing: { latitude: undefined, longitude: undefined } }),
      listingRow({ id: "near", vin: "VINNEA000000000001", retailListing: { latitude: 33.75, longitude: -84.39 } }),
    ] as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);

    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    expect(body.listings.map((l) => l.id)).toEqual(["VINNEA000000000001", "VINFAR000000000001", "VINNOC000000000001"]);
  });

  it("clamps an absurd radius instead of rejecting it", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue([] as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", radius: "99999" } }, res);
    expect(res._out.code).toBe(200);
    const passed = vi.mocked(autoDevSearchRaw).mock.calls[0][0];
    expect(passed.radius).toBeLessThanOrEqual(500);
  });

  it("returns an empty list, not an error, when the provider yields nothing", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue([] as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    expect(res._out.code).toBe(200);
    expect((res._out.body as { listings: unknown[] }).listings).toEqual([]);
  });

  it("echoes the resolved place so the UI can name it", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "Atlanta, GA" } }, res);
    expect((res._out.body as { place: { label: string } }).place.label).toBe("Atlanta, GA");
  });
});
