import type { VehicleListing } from "./marketplace-types";

// How the marketplace orders its results. The search endpoint already returns
// the nearest listings first and caps the response, so this reorders what came
// back rather than re-querying the provider: the visitor is rearranging the
// nearby inventory they can see, not paying for another metered search.

export type SortKey =
  | "distance"
  | "price-asc"
  | "price-desc"
  | "mileage-asc"
  | "mileage-desc"
  | "year-desc"
  | "year-asc"
  | "range-desc";

export const DEFAULT_SORT: SortKey = "distance";

export const SORT_OPTIONS: ReadonlyArray<{ value: SortKey; label: string }> = [
  { value: "distance", label: "Closest first" },
  { value: "price-asc", label: "Lowest price first" },
  { value: "price-desc", label: "Highest price first" },
  { value: "mileage-asc", label: "Lowest mileage first" },
  { value: "mileage-desc", label: "Highest mileage first" },
  { value: "year-desc", label: "Newest first (by car year)" },
  { value: "year-asc", label: "Oldest first (by car year)" },
  { value: "range-desc", label: "Longest range first" },
];

const DIRECTION: Record<SortKey, 1 | -1> = {
  distance: 1,
  "price-asc": 1,
  "price-desc": -1,
  "mileage-asc": 1,
  "mileage-desc": -1,
  "year-desc": -1,
  "year-asc": 1,
  "range-desc": -1,
};

/** Guards the value read off the URL, which anyone can type. */
export function isSortKey(value: string | null | undefined): value is SortKey {
  return SORT_OPTIONS.some((o) => o.value === value);
}

/**
 * The provider's own sort parameter for an order it can apply itself.
 *
 * This is the difference between "the cheapest of the listings we happen to
 * hold" and "the cheapest in the radius": the endpoint returns one capped page,
 * so whichever order the PROVIDER applies decides which cars are on it. Sorting
 * upstream costs no extra request.
 *
 * Distance and range are absent on purpose. The provider cannot sort on either
 * — it has no range figure at all (that comes from our catalog) and does not
 * offer distance as a sort field — so those two are ordered here, over the page
 * that came back.
 */
const PROVIDER_SORT: Partial<Record<SortKey, string>> = {
  "price-asc": "price.asc",
  "price-desc": "price.desc",
  "mileage-asc": "miles.asc",
  "mileage-desc": "miles.desc",
  "year-asc": "year.asc",
  "year-desc": "year.desc",
};

export function providerSortFor(key: SortKey): string | undefined {
  return PROVIDER_SORT[key];
}

/** Whether the order reaches across every listing in the radius (the provider
 *  applied it) or only across the page we were given. */
export function isProviderSorted(key: SortKey): boolean {
  return providerSortFor(key) != null;
}

/** A listing missing the field being sorted on goes last, whichever direction
 *  the sort runs: a hidden price is not "cheapest", and a listing without
 *  coordinates is not "nearest". A naive numeric compare would float those to
 *  the top of a descending sort. */
function compare(a: number | undefined, b: number | undefined, dir: 1 | -1): number {
  if (a == null) return b == null ? 0 : 1;
  if (b == null) return -1;
  return (a - b) * dir;
}

function field(listing: VehicleListing, key: SortKey): number | undefined {
  switch (key) {
    case "price-asc":
    case "price-desc":
      return listing.price;
    case "mileage-asc":
    case "mileage-desc":
      return listing.mileage;
    case "year-desc":
    case "year-asc":
      return listing.year;
    case "range-desc":
      return listing.rangeMi;
    case "distance":
      return listing.distanceMi;
  }
}

/** Returns a new array — the cached search result stays untouched. */
export function sortListings(
  listings: readonly VehicleListing[], key: SortKey,
): VehicleListing[] {
  const dir = DIRECTION[key] ?? 1;
  return [...listings].sort(
    (a, b) =>
      compare(field(a, key), field(b, key), dir) ||
      // Ties fall back to the endpoint's own ordering, then to the id, so two
      // equal listings never swap places between renders.
      compare(a.distanceMi, b.distanceMi, 1) ||
      a.id.localeCompare(b.id),
  );
}
