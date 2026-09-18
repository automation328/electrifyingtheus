import { EV_CATALOG } from "@/data/ev-catalog";

// Links from elsewhere on the site into the marketplace, for one particular car.
//
// The marketplace only ever shows vehicles it can match to the EV catalog, so a
// link for a car that is not in it would land on an empty results page. Callers
// get null instead and render no button: a dead end is worse than no door.

const BY_ID = new Map(EV_CATALOG.map((v) => [v.id, v]));

export interface MarketplaceLinkOptions {
  /** The visitor's ZIP, when the page already knows it. Without one the
   *  marketplace opens on its "start with a location" state, filter intact. */
  zip?: string;
}

/**
 * Path to the marketplace, pre-filtered to one catalog vehicle.
 *
 * Make and model are sent separately because that is how the listings arrive:
 * make is matched exactly, model loosely, which is what dealer text demands.
 */
export function marketplacePathFor(
  catalogId: string, { zip }: MarketplaceLinkOptions = {},
): string | null {
  const vehicle = BY_ID.get(catalogId);
  if (!vehicle) return null;

  const params = new URLSearchParams();
  const clean = (zip ?? "").trim();
  if (/^\d{5}$/.test(clean)) params.set("q", clean);
  params.set("makes", vehicle.make);
  params.set("models", vehicle.model);
  return `/marketplace?${params}`;
}

/** Whether the marketplace has anything to say about this vehicle at all. */
export function isInMarketplaceCatalog(catalogId: string): boolean {
  return BY_ID.has(catalogId);
}
