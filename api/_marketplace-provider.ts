// Vehicle listings provider. Everything above this file speaks VehicleListing;
// only this file knows which upstream service is in use.
//
// Auto.dev is the current implementation: it takes `zip` + `distance` natively,
// which is exactly the search we need, and has a free tier for validation.
//
// It has NO fuel-type filter, so we cannot ask for "electric cars near me". We
// send the models from our own EV catalog as one comma-separated OR filter and
// verify each result against that catalog afterwards. One upstream request per
// search, not one per model, which is what keeps normal use inside the free tier.
//
// MarketCheck filters on fuel type natively and is the obvious upgrade if volume
// justifies its pricing. Swapping it in means implementing MarketplaceProvider
// here and changing nothing else.
//
// Env (server-only):
//   MARKETPLACE_API_KEY   provider key. Unset ⇒ configured:false, no upstream call.

import { MAX_MARKETPLACE_PAGE, type VehicleListing } from "../src/lib/marketplace-types.js";

const ENDPOINT = "https://api.auto.dev/listings";
/** Auto.dev caps page size by plan (Free 20, Growth 100, Scale 500). Ask for no
 *  more than the Growth cap; a smaller plan simply returns fewer. */
const MAX_LIMIT = 100;
const TIMEOUT_MS = 12_000;

export interface ProviderSearch {
  zip: string;
  radius: number;
  models: string[];
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  limit?: number;
  /** Upstream sort, as "<field>.<direction>" — see providerSortFor(). Omitted,
   *  the provider returns its own default order (most recently updated). */
  sort?: string;
  /** 1-based. The provider's own paging; deep paging past 50 needs a cursor,
   *  which we do not use, so callers stay inside MAX_PAGE. */
  page?: number;
}

/** One upstream page, with what the provider says about the rest of them. */
export interface ProviderPage {
  rows: unknown[];
  /** Listings matching the query, ignoring paging. Undefined when the provider
   *  did not report one. Counts everything it matched — including cars our own
   *  electrified check will drop — so it is an upper bound, never our count. */
  total?: number;
  /** The provider offered a next page. */
  hasMore: boolean;
}

/** Deep paging past this needs cursors, which this adapter does not implement.
 *  Shared with the client so both stop asking at the same place. */
export const MAX_PAGE = MAX_MARKETPLACE_PAGE;

export interface MarketplaceProvider {
  configured: boolean;
  search(params: ProviderSearch): Promise<VehicleListing[]>;
}

/** Great-circle distance in miles. The provider's radius is ZIP-anchored and
 *  coarse, so we recompute true distance locally for ranking. */
export function haversineMiles(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 3958.7613;
  const toRad = (d: number) => (d * Math.PI) / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a = Math.sin(dLat / 2) ** 2
    + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLon / 2) ** 2;
  return 2 * R * Math.asin(Math.min(1, Math.sqrt(a)));
}

export function buildAutoDevQuery(p: ProviderSearch): URLSearchParams {
  const q = new URLSearchParams();
  q.set("zip", p.zip);
  q.set("distance", String(p.radius));
  // Commas are the provider's OR. catalogSearchModels() guarantees no model
  // contains a comma, which would otherwise split one model into two bogus ones.
  if (p.models.length) q.set("vehicle.model", p.models.join(","));
  if (p.priceMin != null || p.priceMax != null) {
    q.set("retailListing.price", `${p.priceMin ?? 0}-${p.priceMax ?? 999999}`);
  }
  if (p.yearMin != null || p.yearMax != null) {
    q.set("vehicle.year", `${p.yearMin ?? 1990}-${p.yearMax ?? 2100}`);
  }
  q.set("limit", String(Math.min(p.limit ?? MAX_LIMIT, MAX_LIMIT)));
  if (p.sort) q.set("sort", p.sort);
  if (p.page && p.page > 1) q.set("page", String(Math.min(Math.floor(p.page), MAX_PAGE)));
  // The match count is opt-in upstream and is what lets the page say how much
  // more there is rather than implying one page is everything.
  q.set("includes", "total");
  return q;
}

/**
 * Below this, a "price" is not an asking price.
 *
 * Real listings hit live: five 2022–2023 Mach-Es and a Model Y from one dealer,
 * all at $695 — a deposit, or a number typed to win the sort on whatever site
 * consumes this feed. Genuine cheap EVs in the same search start at $3,549, and
 * even salvage Leafs sit above $2,000.
 *
 * So the car is kept and the number is dropped: the vehicle is real, the price
 * is not, and a listing with no price already sorts last and reads "Call for
 * price". Dropping the listing instead would hide inventory over a bad field,
 * and trusting the number would open every cheapest-first search with bait.
 */
const MIN_PLAUSIBLE_PRICE = 2000;

/** A price we are willing to repeat to a visitor, or nothing. */
export function plausiblePrice(price: number | undefined): number | undefined {
  return price != null && price >= MIN_PLAUSIBLE_PRICE ? price : undefined;
}

const str = (v: unknown): string | undefined => {
  const s = typeof v === "string" ? v.trim() : typeof v === "number" ? String(v) : "";
  return s || undefined;
};
const num = (v: unknown): number | undefined => {
  const n = typeof v === "number" ? v : typeof v === "string" ? Number(v) : NaN;
  return Number.isFinite(n) ? n : undefined;
};

/**
 * One upstream record → our shape, or null if it is unusable.
 *
 * Returns null rather than a half-filled listing whenever identity or the
 * year/make/model needed to match it to a catalog EV is missing: a listing we
 * cannot identify is one we cannot verify is electric.
 */
export function normalizeAutoDevListing(raw: unknown): Omit<VehicleListing, "catalogId" | "powertrain"> | null {
  if (!raw || typeof raw !== "object") return null;
  const r = raw as Record<string, unknown>;

  const v = r.vehicle && typeof r.vehicle === "object" ? r.vehicle as Record<string, unknown> : null;
  const rl = r.retailListing && typeof r.retailListing === "object" ? r.retailListing as Record<string, unknown> : {};
  if (!v) return null;

  const vin = str(r.vin) ?? str(v.vin);
  const id = vin ?? str(r["@id"]) ?? str(r.id);
  if (!id) return null;

  const year = num(v.year);
  const make = str(v.make);
  const model = str(v.model);
  if (!year || !make || !model) return null;

  // Field names below are taken from real responses, not the docs: the array is
  // `data`, the dealer is `dealer`, condition is a `used` boolean, the photo is
  // `primaryImage` and the listing link is `vdp`.
  const photos = Array.isArray(rl.photoUrls) ? rl.photoUrls : [];

  return {
    id,
    vin,
    year,
    make,
    model,
    trim: str(v.trim),
    price: plausiblePrice(num(rl.price)),
    mileage: num(rl.miles) ?? num(rl.mileage),
    condition: rl.used === false ? "new" : "used",
    dealerName: str(rl.dealer) ?? str(rl.dealerName),
    city: str(rl.city),
    state: str(rl.state),
    photoUrl: str(rl.primaryImage) ?? str(photos[0]),
    listingUrl: str(rl.vdp) ?? str(rl.vdpUrl) ?? str(rl.url),
  };
}

/**
 * The powertrain a listing claims, from the provider's own `vehicle.fuel`.
 *
 * There is no fuel-type FILTER upstream, but responses do carry the field, and
 * it is far better evidence than matching model names. Returns null when the
 * fuel is absent or is something we will not list (petrol, diesel).
 */
export function listingPowertrain(raw: unknown): "ev" | "phev" | null {
  if (!raw || typeof raw !== "object") return null;
  const v = (raw as Record<string, unknown>).vehicle;
  if (!v || typeof v !== "object") return null;
  const fuel = String((v as Record<string, unknown>).fuel ?? "").toLowerCase();
  if (!fuel) return null;
  if (fuel.includes("plug")) return "phev";        // "Plug-in Hybrid"
  if (fuel.includes("electric")) return "ev";      // "Electric"
  return null;                                      // Gasoline, Diesel, Hybrid…
}

/**
 * Coordinates of a raw record.
 *
 * `location` is GeoJSON order — [longitude, latitude]. Reading it as [lat, lon]
 * silently places every car in the wrong hemisphere and ranks results by a
 * nonsense distance, so the order is asserted in the tests.
 */
export function autoDevCoords(raw: unknown): { lat: number; lon: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const loc = (raw as Record<string, unknown>).location;
  if (Array.isArray(loc) && loc.length >= 2) {
    const lon = num(loc[0]), lat = num(loc[1]);
    if (lat != null && lon != null) return { lat, lon };
  }
  const rl = (raw as Record<string, unknown>).retailListing;
  if (rl && typeof rl === "object") {
    const o = rl as Record<string, unknown>;
    const lat = num(o.latitude), lon = num(o.longitude);
    if (lat != null && lon != null) return { lat, lon };
  }
  return null;
}

/** Raw records from one upstream search, for callers that need coordinates too. */
export async function autoDevSearchRaw(p: ProviderSearch): Promise<ProviderPage> {
  const empty: ProviderPage = { rows: [], hasMore: false };
  const key = process.env.MARKETPLACE_API_KEY;
  if (!key) return empty;

  try {
    // AbortSignal.timeout is absent in some runtimes (jsdom, older Node). Without
    // this guard its absence throws inside the try and is swallowed as "provider
    // unreachable", so every search would silently return nothing forever.
    const signal = typeof AbortSignal?.timeout === "function"
      ? AbortSignal.timeout(TIMEOUT_MS)
      : undefined;
    // Bearer, per Auto.dev's own docs. The provider also accepts the key as an
    // ?apiKey= query parameter — never use that: query strings end up in access
    // logs, proxy logs and error reports, which is how keys leak.
    const res = await fetch(`${ENDPOINT}?${buildAutoDevQuery(p)}`, {
      headers: {
        Authorization: `Bearer ${key}`,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      ...(signal ? { signal } : {}),
    });
    if (!res.ok) {
      console.warn(`[marketplace] provider responded ${res.status}`);
      return empty;
    }
    const body = await res.json() as Record<string, unknown>;
    const rows = body.records ?? body.listings ?? body.data ?? body.results;
    const list = Array.isArray(rows) ? rows : [];

    const links = body.links && typeof body.links === "object"
      ? body.links as Record<string, unknown>
      : {};
    // A next link is the provider's own word on whether more exist. Without one
    // (an older response shape), a full page is the only evidence available.
    const hasMore = typeof links.next === "string" && links.next.length > 0
      ? true
      : list.length >= Math.min(p.limit ?? MAX_LIMIT, MAX_LIMIT);

    return { rows: list, total: num(body.total), hasMore };
  } catch (err) {
    // A provider outage must degrade to "no results", never to a 500 on our site.
    console.warn(`[marketplace] provider unreachable: ${(err as Error)?.message ?? err}`);
    return empty;
  }
}

export function autoDevProvider(): MarketplaceProvider {
  return {
    configured: Boolean(process.env.MARKETPLACE_API_KEY),
    async search(p) {
      const { rows } = await autoDevSearchRaw(p);
      return rows
        .map((r) => normalizeAutoDevListing(r))
        .filter(Boolean) as VehicleListing[];
    },
  };
}
