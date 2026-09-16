// Search electrified vehicles for sale near a place.
//
// Deliberately shaped like api/stations.ts: the visitor types a ZIP, a city, a
// state or a street address, resolveQuery turns it into a point and a sensible
// radius, and we search around it. Same rate-limit posture, same clamping rather
// than rejecting of silly input.
//
// The provider cannot filter by fuel type, so this endpoint is what guarantees
// only electrified cars are returned: every listing is matched against the ETUS
// catalog and dropped if it does not match. See api/_marketplace-provider.ts.
//
// Env (server-only):
//   MARKETPLACE_API_KEY   provider key. Unset ⇒ { listings: [], configured: false }.

import { resolveQuery, MAX_RADIUS, type Place } from "./_geocode.js";
import { checkRateLimit, tooManyRequests } from "./_rate-limit.js";
import {
  autoDevProvider, autoDevSearchRaw, autoDevCoords,
  normalizeAutoDevListing, haversineMiles,
} from "./_marketplace-provider.js";
import { matchCatalogVehicle, catalogSearchModels } from "../src/lib/ev-catalog-match.js";
import type { VehicleListing, MarketplaceResponse } from "../src/lib/marketplace-types.js";

const MAX_QUERY = 120;
const MAX_RESULTS = 60;
const DEFAULT_RADIUS = 50;

const pick = (v: unknown, fallback = ""): string =>
  (Array.isArray(v) ? v[0] : v) != null ? String(Array.isArray(v) ? v[0] : v) : fallback;

const num = (v: unknown): number | null => {
  const n = Number(Array.isArray(v) ? v[0] : v);
  return Number.isFinite(n) ? n : null;
};

/** A ZIP for the provider, which anchors its radius on one. A city/state search
 *  resolves to a representative point, so we hand over its postal code when the
 *  geocoder found one and fall back to the raw text otherwise. */
function providerZip(place: Place, typed: string): string {
  const fromPlace = (place as unknown as Record<string, unknown>).postcode;
  if (typeof fromPlace === "string" && /^\d{5}$/.test(fromPlace)) return fromPlace;
  const m = typed.match(/\b\d{5}\b/);
  return m ? m[0] : "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  // Unauthenticated proxy in front of a metered third-party API. Without a cap,
  // anyone can spend our quota (and our money) at their own pace.
  const rl = await checkRateLimit(req, { bucket: "marketplace", limit: 120, windowMinutes: 60 });
  if (!rl.ok) { tooManyRequests(res, rl); return; }

  const query = req.query ?? {};
  const text = pick(query.q, pick(query.zip, "")).trim().slice(0, MAX_QUERY);
  if (!text) {
    res.status(400).json({ error: "Pass a ZIP code, city, state or address." });
    return;
  }

  const place = await resolveQuery(text);
  if (!place) {
    res.status(404).json({
      error: `Couldn't find "${text}". Try a ZIP code, a city and state, or a street address.`,
    });
    return;
  }

  const asked = num(query.radius);
  const radius = Math.min(Math.max(asked ?? place.radius ?? DEFAULT_RADIUS, 1), MAX_RADIUS);

  // No key configured is a different answer from "nothing for sale near you",
  // and the UI says so rather than implying we looked.
  if (!autoDevProvider().configured) {
    const body: MarketplaceResponse = {
      listings: [],
      configured: false,
      place: { label: place.label, lat: place.lat, lon: place.lon, radius },
    };
    res.status(200).json(body);
    return;
  }

  const zip = providerZip(place, text);
  if (!zip) {
    res.status(400).json({
      error: `This search needs a ZIP code. "${text}" resolved to an area without one — try a ZIP.`,
    });
    return;
  }

  const rows = await autoDevSearchRaw({
    zip,
    radius,
    models: catalogSearchModels(),
    priceMin: num(query.priceMin) ?? undefined,
    priceMax: num(query.priceMax) ?? undefined,
    yearMin: num(query.yearMin) ?? undefined,
    yearMax: num(query.yearMax) ?? undefined,
  });

  const listings: VehicleListing[] = [];
  for (const raw of rows) {
    const base = normalizeAutoDevListing(raw);
    if (!base) continue;

    // The verification step. An unmatched listing is not an electrified car we
    // know about, so it does not appear — see the provider file for why.
    const catalog = matchCatalogVehicle(base.make, base.model);
    if (!catalog) continue;

    const coords = autoDevCoords(raw);
    listings.push({
      ...base,
      catalogId: catalog.id,
      powertrain: "ev",
      rangeMi: catalog.rangeMi,
      distanceMi: coords ? haversineMiles(place.lat, place.lon, coords.lat, coords.lon) : undefined,
    });
  }

  // Nearest first; listings without coordinates sort last rather than first,
  // which is what an undefined would do in a naive numeric sort.
  listings.sort((a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity));

  const body: MarketplaceResponse = {
    listings: listings.slice(0, MAX_RESULTS),
    total: listings.length,
    configured: true,
    place: { label: place.label, lat: place.lat, lon: place.lon, radius },
  };
  res.status(200).json(body);
}
