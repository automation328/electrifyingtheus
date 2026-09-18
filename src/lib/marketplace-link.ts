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

/**
 * One link covering several catalog vehicles at once — the three EV matches a
 * comparison page offers, say.
 *
 * Make and model both go as lists, which the provider ORs, so the search comes
 * back as "any of these three cars" rather than three separate errands. Ids it
 * does not know are skipped, and nothing but unknown ids gives null.
 */
export function marketplacePathForMany(
  catalogIds: readonly string[], { zip }: MarketplaceLinkOptions = {},
): string | null {
  const vehicles = catalogIds.map((id) => BY_ID.get(id)).filter(Boolean);
  if (!vehicles.length) return null;

  const params = new URLSearchParams();
  const clean = (zip ?? "").trim();
  if (/^\d{5}$/.test(clean)) params.set("q", clean);
  params.set("makes", [...new Set(vehicles.map((v) => v!.make))].join(","));
  params.set("models", [...new Set(vehicles.map((v) => v!.model))].join(","));
  return `/marketplace?${params}`;
}

/**
 * Every make the marketplace could ever show, from the catalog rather than from
 * the listings on screen.
 *
 * The provider filters on make now, so a page already narrowed to Nissan holds
 * no evidence that Tesla exists — options drawn from it would collapse to the
 * one make chosen and there would be no way back out.
 */
export function catalogMakes(): string[] {
  return [...new Set(EV_CATALOG.map((v) => v.make))].sort((a, b) => a.localeCompare(b));
}

/** Models for one make, or every model when no make is chosen. */
export function catalogModelsFor(make?: string): string[] {
  const wanted = (make ?? "").toLowerCase();
  const models = EV_CATALOG
    .filter((v) => !wanted || v.make.toLowerCase() === wanted)
    .map((v) => v.model);
  return [...new Set(models)].sort((a, b) => a.localeCompare(b));
}

/** Whether the marketplace has anything to say about this vehicle at all. */
export function isInMarketplaceCatalog(catalogId: string): boolean {
  return BY_ID.has(catalogId);
}
