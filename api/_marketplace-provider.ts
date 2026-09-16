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

import type { VehicleListing } from "../src/lib/marketplace-types.js";

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
}

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
  return q;
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
  const id = vin ?? str(r.id);
  if (!id) return null;

  const year = num(v.year);
  const make = str(v.make);
  const model = str(v.model);
  if (!year || !make || !model) return null;

  const photos = Array.isArray(rl.photoUrls) ? rl.photoUrls : Array.isArray(r.photoUrls) ? r.photoUrls : [];

  return {
    id,
    vin,
    year,
    make,
    model,
    trim: str(v.trim),
    price: num(rl.price),
    mileage: num(rl.miles) ?? num(rl.mileage),
    condition: str(rl.condition)?.toLowerCase() === "new" ? "new" : "used",
    dealerName: str(rl.dealerName) ?? str(rl.dealer),
    city: str(rl.city),
    state: str(rl.state),
    photoUrl: str(photos[0]),
    listingUrl: str(rl.vdpUrl) ?? str(rl.url) ?? str(r.url),
    distanceMi: (() => {
      const la = num(rl.latitude), lo = num(rl.longitude);
      return la != null && lo != null ? undefined : undefined; // filled in by the caller, which knows the origin
    })(),
  };
}

/** Latitude/longitude of a raw record, when it carries them. The caller needs
 *  these to rank by true distance and cannot get them from the normalised shape. */
export function autoDevCoords(raw: unknown): { lat: number; lon: number } | null {
  if (!raw || typeof raw !== "object") return null;
  const rl = (raw as Record<string, unknown>).retailListing;
  if (!rl || typeof rl !== "object") return null;
  const o = rl as Record<string, unknown>;
  const lat = num(o.latitude), lon = num(o.longitude);
  return lat != null && lon != null ? { lat, lon } : null;
}

/** Raw records from one upstream search, for callers that need coordinates too. */
export async function autoDevSearchRaw(p: ProviderSearch): Promise<unknown[]> {
  const key = process.env.MARKETPLACE_API_KEY;
  if (!key) return [];

  try {
    // AbortSignal.timeout is absent in some runtimes (jsdom, older Node). Without
    // this guard its absence throws inside the try and is swallowed as "provider
    // unreachable", so every search would silently return nothing forever.
    const signal = typeof AbortSignal?.timeout === "function"
      ? AbortSignal.timeout(TIMEOUT_MS)
      : undefined;
    const res = await fetch(`${ENDPOINT}?${buildAutoDevQuery(p)}`, {
      headers: { "X-API-Key": key, Accept: "application/json" },
      ...(signal ? { signal } : {}),
    });
    if (!res.ok) {
      console.warn(`[marketplace] provider responded ${res.status}`);
      return [];
    }
    const body = await res.json() as Record<string, unknown>;
    const rows = body.records ?? body.listings ?? body.data ?? body.results;
    return Array.isArray(rows) ? rows : [];
  } catch (err) {
    // A provider outage must degrade to "no results", never to a 500 on our site.
    console.warn(`[marketplace] provider unreachable: ${(err as Error)?.message ?? err}`);
    return [];
  }
}

export function autoDevProvider(): MarketplaceProvider {
  return {
    configured: Boolean(process.env.MARKETPLACE_API_KEY),
    async search(p) {
      const rows = await autoDevSearchRaw(p);
      return rows
        .map((r) => normalizeAutoDevListing(r))
        .filter(Boolean) as VehicleListing[];
    },
  };
}
