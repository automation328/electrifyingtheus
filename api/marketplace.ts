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

import { resolveQuery, type Place } from "./_geocode.js";
import { checkRateLimit, tooManyRequests } from "./_rate-limit.js";
import {
  autoDevProvider, autoDevSearchRaw, autoDevCoords, listingPowertrain,
  normalizeAutoDevListing, haversineMiles, MAX_PAGE,
} from "./_marketplace-provider.js";
import {
  matchCatalogVehicle, catalogSearchModelsFor,
} from "../src/lib/ev-catalog-match.js";
import { isSortKey, providerSortFor } from "../src/lib/marketplace-sort.js";
import { epaRangeFor } from "../src/data/ev-range-by-year.js";
import {
  NATIONWIDE_RADIUS, WIDEN_RADII,
  type VehicleListing, type MarketplaceResponse,
} from "../src/lib/marketplace-types.js";

const MAX_QUERY = 120;
const DEFAULT_RADIUS = 50;

/** A repeated or comma-separated query value, e.g. makes=Nissan,Tesla. */
const list = (v: unknown, max = 12): string[] => {
  const raw = Array.isArray(v) ? v.join(",") : v == null ? "" : String(v);
  return raw.split(",").map((s) => s.trim()).filter(Boolean).slice(0, max);
};

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

/** The rows of one upstream page that are verifiably electrified, as listings
 *  with their catalog id, range and distance from `origin`. */
function verifiedListings(rows: unknown[], origin: { lat: number; lon: number }): VehicleListing[] {
  const listings: VehicleListing[] = [];
  for (const raw of rows) {
    const base = normalizeAutoDevListing(raw);
    if (!base) continue;

    // Verification, in two independent steps. Either one rejecting is enough.
    //
    // 1. The provider's own fuel field. There is no fuel FILTER upstream, but
    //    responses carry `vehicle.fuel`, so a car it calls "Gasoline" is dropped
    //    outright — regardless of what its name looks like.
    const powertrain = listingPowertrain(raw);
    if (powertrain === null) continue;

    // 2. Our catalog. Needed anyway for the range figure and the id the detail
    //    page joins on, and it catches anything the fuel field mislabels.
    const catalog = matchCatalogVehicle(base.make, base.model);
    if (!catalog) continue;

    const coords = autoDevCoords(raw);
    // Range belongs to the model year and to the variant, not to the nameplate.
    // The catalog holds one figure — the current car — so a 2013 LEAF was being
    // sold a 2026 LEAF's 303 miles; and a model year is often several cars, so a
    // 2026 LYRIQ Sport read "285–326 mi" when rear-drive LYRIQs do 326 and only
    // the V-Series does 285. The listing's own trim and drivetrain pick the row.
    // Fall back to the catalog figure only for cars the EPA has no per-year data
    // for, which are the ones that have only just gone on sale.
    const epa = epaRangeFor(catalog.id, base.year, {
      trim: base.trim,
      drivetrain: base.drivetrain,
    });
    const hasPerYear = epa.rangeMi != null;
    listings.push({
      ...base,
      catalogId: catalog.id,
      powertrain,
      rangeMi: hasPerYear ? epa.rangeMi : catalog.rangeMi,
      rangeMaxMi: epa.rangeMaxMi,
      distanceMi: coords ? haversineMiles(origin.lat, origin.lon, coords.lat, coords.lon) : undefined,
    });
  }
  return listings;
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

  // A radius the visitor picked is searched exactly as picked. None picked is
  // "Any distance": start at the ring the place itself suggests and widen
  // from there. The ceiling is the whole country, not AFDC's 500 miles — this
  // provider searches nationwide, and a car people want is often further away.
  const asked = num(query.radius);
  const picked = asked != null && asked > 0;
  const radius = Math.min(
    Math.max(picked ? asked : place.radius ?? DEFAULT_RADIUS, 1),
    NATIONWIDE_RADIUS,
  );
  // An "Any distance" search that widened on page 1 comes back with the ring it
  // landed on in ?ring=, so later pages and the car page search that ring
  // directly. Kept apart from ?radius= on purpose: written there it read as a
  // distance the visitor chose, and the next search was stuck at it.
  const carried = num(query.ring);
  const resumed = !picked && carried != null && carried > radius;
  const start = resumed ? Math.min(carried, NATIONWIDE_RADIUS) : radius;

  // No key configured is a different answer from "nothing for sale near you",
  // and the UI says so rather than implying we looked.
  // The order the PROVIDER applies decides which listings are on the one page
  // it returns, so an order it understands is sent upstream rather than applied
  // to whatever came back. Orders it cannot do — distance, our own range figure
  // — are left off here and applied client-side, over this page.
  const sortParam = pick(query.sort, "");
  const sort = isSortKey(sortParam) ? providerSortFor(sortParam) : undefined;

  const askedPage = num(query.page);
  const page = Math.min(Math.max(askedPage ?? 1, 1), MAX_PAGE);

  if (!autoDevProvider().configured) {
    const body: MarketplaceResponse = {
      listings: [],
      configured: false,
      page,
      hasMore: false,
      place: { label: place.label, lat: place.lat, lon: place.lon, radius },
    };
    res.status(200).json(body);
    return;
  }

  const zip = providerZip(place, text);
  if (!zip && start < NATIONWIDE_RADIUS) {
    res.status(400).json({
      error: `This search needs a ZIP code. "${text}" resolved to an area without one — try a ZIP.`,
    });
    return;
  }

  // Make and model are filters the provider applies across everything it holds,
  // so they travel with the request. Applied here instead, they could only ever
  // hide listings on the page in front of the visitor while the rest of that
  // make sat unreachable on pages they had no reason to open.
  const makes = list(query.makes);
  const models = list(query.models);

  const search = {
    models: catalogSearchModelsFor(models),
    makes,
    priceMin: num(query.priceMin) ?? undefined,
    priceMax: num(query.priceMax) ?? undefined,
    yearMin: num(query.yearMin) ?? undefined,
    yearMax: num(query.yearMax) ?? undefined,
    sort,
    page,
  };

  // "Any distance" on the first page widens a ring at a time until one holds a
  // verified car. A picked radius is a promise about distance and is never
  // widened; nor is a later page, which must stay on the ring page 1 used.
  const rings = picked || resumed || page > 1
    ? [start]
    : [radius, ...WIDEN_RADII.filter((r) => r > radius)];

  const searchRing = (ring: number) => {
    const nationwide = ring >= NATIONWIDE_RADIUS;
    return autoDevSearchRaw({
      ...search,
      zip: nationwide ? undefined : zip,
      radius: nationwide ? undefined : ring,
    });
  };

  let searched = start;
  let upstream = await searchRing(start);
  let listings = verifiedListings(upstream.rows, place);
  for (const ring of rings.slice(1)) {
    // Stop on a provider failure too: widening would only spend more metered
    // calls on a provider that is not answering.
    if (listings.length || upstream.failed) break;
    searched = ring;
    upstream = await searchRing(ring);
    listings = verifiedListings(upstream.rows, place);
  }
  const { rows, total: upstreamTotal, hasMore: providerHasMore } = upstream;

  // No upstream sort asked for means the provider chose the order (most
  // recently updated), so fall back to nearest first. When one WAS asked for,
  // that order is the point of the request and must survive: re-sorting here
  // would throw away the only thing that made this page the cheapest cars in
  // the radius rather than an arbitrary twenty of them. Listings without
  // coordinates sort last rather than first, which is what an undefined would
  // do in a naive numeric sort.
  if (!sort) {
    listings.sort((a, b) => (a.distanceMi ?? Infinity) - (b.distanceMi ?? Infinity));
  }

  // Past MAX_PAGE the provider wants a cursor we do not issue, so asking again
  // would spend a metered call to be handed page 50 a second time.
  const hasMore = providerHasMore && page < MAX_PAGE;

  // How far the results run, in pages. The plan silently clamps the page size we
  // ask for (20 on the free tier, 100 on the next), so the step is measured from
  // a page the provider says is full rather than assumed from our own request —
  // and a page it says is the last one IS the last one, whatever the arithmetic.
  const pageCount = !providerHasMore
    ? page
    : upstreamTotal && rows.length
      ? Math.max(Math.ceil(upstreamTotal / rows.length), page)
      : undefined;

  // Inventory moves slowly and the upstream quota is small and metered, so the
  // same search from another visitor should not spend a second call. Same
  // posture as api/stations.ts, over a much shorter window: listings do change.
  // A provider that did not answer is not "nothing for sale" — caching that
  // would show every visitor an empty page for the next twenty minutes.
  res.setHeader(
    "Cache-Control",
    upstream.failed ? "no-store" : "public, s-maxage=300, stale-while-revalidate=900",
  );

  const body: MarketplaceResponse = {
    listings,
    // Everything the provider matched, before our electrified check ran — so
    // the page can say how much more there is without claiming all of it is
    // electric. The count of cars we verified is listings.length.
    total: upstreamTotal,
    configured: true,
    page,
    pageSize: rows.length,
    pageCount,
    hasMore,
    place: { label: place.label, lat: place.lat, lon: place.lon, radius: searched },
    ...(searched !== radius ? { widenedFrom: radius } : {}),
  };
  res.status(200).json(body);
}
