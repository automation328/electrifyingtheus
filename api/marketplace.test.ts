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
    autoDevSearchRaw: vi.fn().mockResolvedValue({ rows: [], hasMore: false }),
  };
});

import handler from "./marketplace.js";
import { resolveQuery } from "./_geocode.js";
import { autoDevProvider, autoDevSearchRaw } from "./_marketplace-provider.js";
import { checkRateLimit } from "./_rate-limit.js";
import { NATIONWIDE_RADIUS } from "../src/lib/marketplace-types.js";

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
  "@id": "row-1",
  vin: "5YJ3E1EA7KF000001",
  location: [-84.39, 33.76],
  vehicle: { year: 2022, make: "Tesla", model: "Model 3", trim: "Long Range", fuel: "Electric" },
  retailListing: {
    price: 28995, miles: 31000, used: true,
    dealer: "Atlanta Motors", city: "Atlanta", state: "GA",
    primaryImage: "https://img.example/1.jpg", vdp: "https://dealer.example/1",
    ...(over.retailListing as Record<string, unknown> ?? {}),
  },
  ...over,
});

/** One upstream page, in the shape autoDevSearchRaw now returns. */
const providerPage = (rows: unknown[], over: Record<string, unknown> = {}) =>
  ({ rows, hasMore: false, ...over }) as never;

beforeEach(() => {
  vi.mocked(resolveQuery).mockResolvedValue(ATLANTA as never);
  vi.mocked(autoDevProvider).mockReturnValue({ configured: true, search: vi.fn() } as never);
  vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([]));
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
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([listingRow()]));
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
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow(),
      listingRow({ "@id": "row-2", vin: "JT2BF22K1W0000000", vehicle: { year: 2021, make: "Toyota", model: "Corolla", fuel: "Gasoline" } }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);

    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    expect(body.listings).toHaveLength(1);
    expect(body.listings.some((l) => l.model === "Corolla")).toBe(false);
  });

  it("sorts nearest first and puts listings without coordinates last", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({ vin: "VINFAR000000000001", location: [-84.9, 34.5] }),
      listingRow({ vin: "VINNOC000000000001", location: undefined }),
      listingRow({ vin: "VINNEA000000000001", location: [-84.39, 33.75] }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);

    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    expect(body.listings.map((l) => l.id)).toEqual(["VINNEA000000000001", "VINFAR000000000001", "VINNOC000000000001"]);
  });

  it("hands a sort the provider understands upstream and keeps its order", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({ vin: "VINFAR000000000001", location: [-84.9, 34.5] }),
      listingRow({ vin: "VINNEA000000000001", location: [-84.39, 33.75] }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", sort: "price-asc" } }, res);

    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].sort).toBe("price.asc");
    // Upstream said these two are the cheapest, in this order. Re-sorting them
    // by distance here would discard exactly what the sort was for.
    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    expect(body.listings.map((l) => l.id))
      .toEqual(["VINFAR000000000001", "VINNEA000000000001"]);
  });

  it("sorts by distance itself for an order the provider cannot apply", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({ vin: "VINFAR000000000001", location: [-84.9, 34.5] }),
      listingRow({ vin: "VINNEA000000000001", location: [-84.39, 33.75] }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", sort: "range-desc" } }, res);

    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].sort).toBeUndefined();
    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    expect(body.listings.map((l) => l.id))
      .toEqual(["VINNEA000000000001", "VINFAR000000000001"]);
  });

  it("ignores a sort nobody offers rather than passing it through", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", sort: "price.asc; DROP" } }, res);
    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].sort).toBeUndefined();
  });

  it("passes the requested page upstream and reports paging back", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(
      providerPage([listingRow()], { total: 137, hasMore: true }),
    );
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", page: "3" } }, res);

    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].page).toBe(3);
    const body = res._out.body as Record<string, unknown>;
    expect(body.page).toBe(3);
    expect(body.hasMore).toBe(true);
    // The provider's count, not ours: it includes cars our fuel check drops.
    expect(body.total).toBe(137);
    expect(body.pageSize).toBe(1);
  });

  it("stops offering more once it reaches the last page it can fetch", async () => {
    // Past this the provider wants a cursor we do not issue, so another click
    // would spend a metered call to be handed the same page again.
    vi.mocked(autoDevSearchRaw).mockResolvedValue(
      providerPage([listingRow()], { total: 9999, hasMore: true }),
    );
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", page: "50" } }, res);
    expect((res._out.body as Record<string, unknown>).hasMore).toBe(false);
  });

  it("counts pages from a page the provider says is full", async () => {
    const rows = Array.from({ length: 20 }, (_, i) => listingRow({ vin: `VIN${String(i).padStart(14, "0")}` }));
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage(rows, { total: 137, hasMore: true }));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    expect((res._out.body as Record<string, unknown>).pageCount).toBe(7);
  });

  it("calls a page the provider says is the last one the last one", async () => {
    // Counting 137/3 here would promise 46 pages that do not exist.
    vi.mocked(autoDevSearchRaw).mockResolvedValue(
      providerPage([listingRow()], { total: 137, hasMore: false }),
    );
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", page: "7" } }, res);
    const body = res._out.body as Record<string, unknown>;
    expect(body.pageCount).toBe(7);
    expect(body.hasMore).toBe(false);
  });

  it("lets the CDN absorb a repeat of the same search", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    expect(res._out.headers["Cache-Control"]).toMatch(/s-maxage=\d+/);
  });

  it("clamps a page number outside what the provider will serve", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", page: "9999" } }, res);
    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].page).toBe(50);

    vi.mocked(autoDevSearchRaw).mockClear();
    await handler({ method: "GET", query: { q: "30303", page: "-4" } }, mockRes());
    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].page).toBe(1);
  });

  it("hands the make filter upstream instead of applying it to the page", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", makes: "Nissan,Tesla" } }, res);
    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].makes).toEqual(["Nissan", "Tesla"]);
  });

  it("narrows the model list it asks for to the model chosen", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", models: "Leaf" } }, res);
    // Narrowed to the catalog's own spelling — "LEAF", not what was typed —
    // because that is the text the provider indexes.
    const asked = vi.mocked(autoDevSearchRaw).mock.calls[0][0].models;
    expect(asked).toEqual(["LEAF"]);
  });

  it("still asks only for catalog models when the model is one we do not list", async () => {
    // The model list is the only thing stopping a page of petrol cars coming
    // back, so an unknown model must widen to the catalog, never to everything.
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", models: "Altima" } }, res);
    const asked = vi.mocked(autoDevSearchRaw).mock.calls[0][0].models;
    expect(asked.length).toBeGreaterThan(20);
    expect(asked).not.toContain("Altima");
  });

  it("asks for the whole catalog when no make or model is chosen", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    const call = vi.mocked(autoDevSearchRaw).mock.calls[0][0];
    expect(call.makes).toEqual([]);
    expect(call.models.length).toBeGreaterThan(20);
  });

  it("gives a listing the range of ITS model year, not the nameplate's", async () => {
    // The bug behind this test: every LEAF on the page claimed 303 miles, the
    // 2026 figure, including a 2013 car that does 75.
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({
        vin: "1N4AZ0CP0DC000001",
        vehicle: { year: 2013, make: "Nissan", model: "LEAF", fuel: "Electric" },
      }),
      listingRow({
        vin: "1N4AZ1CP0PC000002",
        vehicle: { year: 2026, make: "Nissan", model: "LEAF", fuel: "Electric" },
      }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);

    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    const byYear = new Map(body.listings.map((l) => [l.year, l]));
    expect(byYear.get(2013)?.rangeMi).toBe(75);
    expect(byYear.get(2026)?.rangeMi).toBe(259);
    expect(byYear.get(2026)?.rangeMaxMi).toBe(303);
  });

  it("carries the band when a model year sold two batteries", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({
        vin: "1N4AZ1CP0KC000003",
        vehicle: { year: 2019, make: "Nissan", model: "LEAF", fuel: "Electric" },
      }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    const listing = (res._out.body as { listings: Array<Record<string, unknown>> }).listings[0];
    expect(listing.rangeMi).toBe(150);
    expect(listing.rangeMaxMi).toBe(226);
  });

  it("narrows the range to the trim and drivetrain the listing names", async () => {
    // A 2026 LYRIQ Sport was reading "285–326 mi": the spread from the V-Series
    // to the rear-drive car. This one is the rear-drive car.
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({
        vin: "1GYKPMRK0PZ000001",
        vehicle: {
          year: 2026, make: "Cadillac", model: "LYRIQ", trim: "Sport",
          drivetrain: "RWD", fuel: "Electric",
        },
      }),
      listingRow({
        vin: "1GYKPMRK0PZ000002",
        vehicle: {
          year: 2026, make: "Cadillac", model: "LYRIQ", trim: "V-Series",
          drivetrain: "AWD", fuel: "Electric",
        },
      }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);

    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    const byTrim = new Map(body.listings.map((l) => [l.trim, l]));
    expect(byTrim.get("Sport")?.rangeMi).toBe(326);
    expect(byTrim.get("Sport")?.rangeMaxMi).toBeUndefined();
    expect(byTrim.get("V-Series")?.rangeMi).toBe(285);
    expect(byTrim.get("V-Series")?.rangeMaxMi).toBeUndefined();
  });

  it("keeps the year's whole band when the listing says nothing useful", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({
        vin: "1GYKPMRK0PZ000003",
        vehicle: { year: 2026, make: "Cadillac", model: "LYRIQ", fuel: "Electric" },
      }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    const listing = (res._out.body as { listings: Array<Record<string, unknown>> }).listings[0];
    expect(listing.rangeMi).toBe(285);
    expect(listing.rangeMaxMi).toBe(326);
  });

  it("clamps an absurd radius to the whole country instead of rejecting it", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", radius: "99999" } }, res);
    expect(res._out.code).toBe(200);
    // Nationwide is asked with no ZIP and no distance, which is how this
    // provider searches everything it holds.
    const passed = vi.mocked(autoDevSearchRaw).mock.calls[0][0];
    expect(passed.zip).toBeUndefined();
    expect(passed.radius).toBeUndefined();
    expect((res._out.body as { place: { radius: number } }).place.radius).toBe(NATIONWIDE_RADIUS);
  });

  it("returns an empty list, not an error, when the provider yields nothing", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([]));
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

describe("Any distance", () => {
  // The bug behind these: a Cadillac LYRIQ searched from Haslet, TX with "Any
  // distance" said nothing was for sale. "Any distance" sent no radius, so it
  // searched the ZIP's 15 miles and stopped — with 297 LYRIQs inside 500 miles.
  const HASLET = { lat: 32.9557, lon: -97.3372, label: "Haslet, TX 76052", kind: "zip", radius: 15, postcode: "76052" };
  const lyriq = listingRow({
    vin: "1GYKPMRK8PZ001753",
    location: [-97.69, 30.39],
    vehicle: { year: 2023, make: "Cadillac", model: "LYRIQ", fuel: "Electric" },
  });

  beforeEach(() => {
    vi.mocked(resolveQuery).mockResolvedValue(HASLET as never);
  });

  const radii = () => vi.mocked(autoDevSearchRaw).mock.calls.map((c) => c[0].radius ?? "nationwide");

  it("widens ring by ring until it finds a car, and says how far it went", async () => {
    vi.mocked(autoDevSearchRaw).mockImplementation(async (p) =>
      providerPage(p.radius === 250 ? [lyriq] : []));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052", makes: "Cadillac", models: "LYRIQ" } }, res);

    expect(radii()).toEqual([15, 25, 50, 100, 250]);
    const body = res._out.body as { listings: unknown[]; place: { radius: number }; widenedFrom?: number };
    expect(body.listings).toHaveLength(1);
    expect(body.place.radius).toBe(250);
    expect(body.widenedFrom).toBe(15);
  });

  it("stops widening, returning what it has, once the upstream budget is spent", async () => {
    vi.mocked(checkRateLimit).mockImplementation((async (_r: unknown, o: { bucket: string }) => ({
      ok: o.bucket !== "marketplace-upstream", hits: 1, limit: 1, retryAfter: 60,
    })) as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052" } }, res);
    expect(radii()).toEqual([15]);
    expect(res._out.code).toBe(200);
  });

  it("drops out-of-range numeric filters instead of forwarding them", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303", priceMin: "-5", priceMax: "1e12", yearMin: "20", yearMax: "2024" } }, res);
    const p = vi.mocked(autoDevSearchRaw).mock.calls[0][0];
    expect([p.priceMin, p.priceMax, p.yearMin, p.yearMax]).toEqual([undefined, undefined, undefined, 2024]);
  });

  it("goes nationwide when nothing is listed within 500 miles", async () => {
    vi.mocked(autoDevSearchRaw).mockImplementation(async (p) =>
      providerPage(p.zip == null ? [lyriq] : []));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052" } }, res);

    expect(radii()).toEqual([15, 25, 50, 100, 250, 500, "nationwide"]);
    const last = vi.mocked(autoDevSearchRaw).mock.calls.at(-1)![0];
    expect(last.zip).toBeUndefined();
    const body = res._out.body as { place: { radius: number }; widenedFrom?: number };
    expect(body.place.radius).toBe(NATIONWIDE_RADIUS);
    expect(body.widenedFrom).toBe(15);
  });

  it("makes one call and reports no widening when the first ring has a car", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([lyriq]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052" } }, res);
    expect(autoDevSearchRaw).toHaveBeenCalledTimes(1);
    expect(res._out.body).not.toHaveProperty("widenedFrom");
  });

  it("keeps widening past a ring whose rows are all petrol", async () => {
    // The provider's rows are not our listings: a ring full of cars we drop
    // is still a ring with nothing to show.
    const petrol = listingRow({ vehicle: { year: 2022, make: "Cadillac", model: "LYRIQ", fuel: "Gasoline" } });
    vi.mocked(autoDevSearchRaw).mockImplementation(async (p) =>
      providerPage(p.radius === 15 ? [petrol] : [lyriq]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052" } }, res);
    expect(radii()).toEqual([15, 25]);
  });

  it("never widens a radius the visitor picked", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052", radius: "50" } }, res);
    expect(radii()).toEqual([50]);
    expect(res._out.body).not.toHaveProperty("widenedFrom");
  });

  it("never widens a later page, which stays on the ring it was given", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052", page: "2" } }, res);
    expect(radii()).toEqual([15]);
  });

  it("stops widening when the provider is not answering, and does not cache that", async () => {
    // Each ring is a metered call. An outage must not spend six of them, and a
    // provider that did not answer is not "nothing for sale" for the CDN to
    // hand every visitor for the next twenty minutes.
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([], { failed: true }));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052" } }, res);
    expect(autoDevSearchRaw).toHaveBeenCalledTimes(1);
    expect(res._out.headers["Cache-Control"]).toBe("no-store");
  });

  it("searches a carried ring directly and still reports it as widened", async () => {
    // Page 2 of a search that widened to 250 — and the car page opened from
    // it — must search 250, once, and keep saying it widened.
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([lyriq]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052", ring: "250", page: "2" } }, res);
    expect(radii()).toEqual([250]);
    const body = res._out.body as { place: { radius: number }; widenedFrom?: number };
    expect(body.place.radius).toBe(250);
    expect(body.widenedFrom).toBe(15);
  });

  it("lets a picked radius win over a carried ring", async () => {
    const res = mockRes();
    await handler({ method: "GET", query: { q: "76052", radius: "50", ring: "250" } }, res);
    expect(radii()).toEqual([50]);
  });

  it("searches nationwide without a ZIP when the place has none", async () => {
    vi.mocked(resolveQuery).mockResolvedValue({ ...HASLET, postcode: undefined, label: "Texas", kind: "state" } as never);
    const res = mockRes();
    await handler({ method: "GET", query: { q: "Texas", radius: String(NATIONWIDE_RADIUS) } }, res);
    expect(res._out.code).toBe(200);
    expect(vi.mocked(autoDevSearchRaw).mock.calls[0][0].zip).toBeUndefined();
  });
});

describe("fuel verification", () => {
  it("drops a petrol car even when its NAME matches a catalog EV", async () => {
    // The strongest guard: a mislabelled or oddly-named petrol car must not be
    // rescued by name matching. Fuel wins.
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({ vehicle: { year: 2022, make: "Tesla", model: "Model 3", fuel: "Gasoline" } }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    expect((res._out.body as { listings: unknown[] }).listings).toEqual([]);
  });

  it("keeps a plug-in hybrid and labels it phev", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({ vehicle: { year: 2022, make: "Tesla", model: "Model 3", fuel: "Plug-in Hybrid" } }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    const body = res._out.body as { listings: Array<Record<string, unknown>> };
    expect(body.listings).toHaveLength(1);
    expect(body.listings[0].powertrain).toBe("phev");
  });

  it("drops a listing with no fuel field rather than assuming electric", async () => {
    vi.mocked(autoDevSearchRaw).mockResolvedValue(providerPage([
      listingRow({ vehicle: { year: 2022, make: "Tesla", model: "Model 3" } }),
    ]));
    const res = mockRes();
    await handler({ method: "GET", query: { q: "30303" } }, res);
    expect((res._out.body as { listings: unknown[] }).listings).toEqual([]);
  });
});
