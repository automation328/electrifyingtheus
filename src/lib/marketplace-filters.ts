import type { VehicleListing } from "./marketplace-types";
import type { BodyStyle } from "./tco-calculator";
import { vehicles } from "@/data/vehicles";

// The marketplace's filter state, and the pure functions that read it from a
// URL, write it back, and apply it to a page of listings.
//
// Two of these filters travel upstream and the rest do not. Price and year are
// parameters the provider itself understands, so sending them decides WHICH
// listings come back — worth doing, because the endpoint returns a capped page
// and we would rather that page be full of cars the visitor could actually buy.
// Everything else (make, body, powertrain, mileage, range) is applied here,
// over what came back.

export interface FilterState {
  condition: "all" | "new" | "used";
  powertrain: "all" | "ev" | "phev";
  makes: string[];
  bodies: BodyStyle[];
  priceMin?: number;
  priceMax?: number;
  yearMin?: number;
  yearMax?: number;
  mileageMax?: number;
  rangeMin?: number;
}

export const EMPTY_FILTERS: FilterState = {
  condition: "all",
  powertrain: "all",
  makes: [],
  bodies: [],
};

export const BODY_LABELS: Record<BodyStyle, string> = {
  sedan: "Sedan",
  hatchback: "Hatchback",
  coupe: "Coupe",
  "suv-compact": "Compact SUV",
  "suv-mid": "Midsize SUV",
  "suv-large": "Large SUV",
  truck: "Truck",
  minivan: "Minivan",
};

const POWERTRAIN_LABELS: Record<"ev" | "phev", string> = {
  ev: "Electric",
  phev: "Plug-in hybrid",
};

/** catalogId → body style, from the catalog the listings are matched against.
 *  Built once: vehicles.ts is a few hundred static entries. */
const BODY_BY_CATALOG_ID = new Map<string, BodyStyle>(
  vehicles.map((v) => [v.id, v.bodyStyle]),
);

export function bodyStyleOf(listing: VehicleListing): BodyStyle | undefined {
  return BODY_BY_CATALOG_ID.get(listing.catalogId);
}

const posInt = (raw: string | null): number | undefined => {
  if (!raw) return undefined;
  const n = Number(raw);
  return Number.isFinite(n) && n >= 0 ? Math.floor(n) : undefined;
};

const csv = (raw: string | null): string[] =>
  (raw ?? "").split(",").map((s) => s.trim()).filter(Boolean);

/** Every URL key this module owns. Listed once so writing state back can clear
 *  the keys it is not setting without disturbing q, radius, sort or embed. */
const KEYS = [
  "condition", "powertrain", "makes", "bodies",
  "priceMin", "priceMax", "yearMin", "yearMax", "mileageMax", "rangeMin",
] as const;

export function readFilters(params: URLSearchParams): FilterState {
  const condition = params.get("condition");
  const powertrain = params.get("powertrain");
  const bodies = csv(params.get("bodies")).filter(
    (b): b is BodyStyle => b in BODY_LABELS,
  );
  return {
    condition: condition === "new" || condition === "used" ? condition : "all",
    powertrain: powertrain === "ev" || powertrain === "phev" ? powertrain : "all",
    makes: csv(params.get("makes")),
    bodies,
    priceMin: posInt(params.get("priceMin")),
    priceMax: posInt(params.get("priceMax")),
    yearMin: posInt(params.get("yearMin")),
    yearMax: posInt(params.get("yearMax")),
    mileageMax: posInt(params.get("mileageMax")),
    rangeMin: posInt(params.get("rangeMin")),
  };
}

/** Writes state onto a copy of `params`, leaving keys this module does not own
 *  (q, radius, sort, embed) exactly as they were. */
export function writeFilters(params: URLSearchParams, state: FilterState): URLSearchParams {
  const next = new URLSearchParams(params);
  for (const key of KEYS) next.delete(key);

  if (state.condition !== "all") next.set("condition", state.condition);
  if (state.powertrain !== "all") next.set("powertrain", state.powertrain);
  if (state.makes.length) next.set("makes", state.makes.join(","));
  if (state.bodies.length) next.set("bodies", state.bodies.join(","));
  for (const key of ["priceMin", "priceMax", "yearMin", "yearMax", "mileageMax", "rangeMin"] as const) {
    const value = state[key];
    if (value != null) next.set(key, String(value));
  }
  return next;
}

/** The subset the search endpoint understands. */
export function serverFilters(state: FilterState) {
  return {
    priceMin: state.priceMin,
    priceMax: state.priceMax,
    yearMin: state.yearMin,
    yearMax: state.yearMax,
  };
}

type Dimension = "condition" | "powertrain" | "makes" | "bodies" | "price" | "year" | "mileage" | "range";

/** One dimension's verdict on one listing.
 *
 *  A listing missing the value a filter asks about fails that filter: someone
 *  who asked for under 40,000 miles has said they will not take a car whose
 *  mileage is unknown, and showing it anyway quietly overrides them. */
function passes(listing: VehicleListing, state: FilterState, dimension: Dimension): boolean {
  switch (dimension) {
    case "condition":
      return state.condition === "all" || listing.condition === state.condition;
    case "powertrain":
      return state.powertrain === "all" || listing.powertrain === state.powertrain;
    case "makes":
      return !state.makes.length || state.makes.includes(listing.make);
    case "bodies": {
      if (!state.bodies.length) return true;
      const body = bodyStyleOf(listing);
      return body != null && state.bodies.includes(body);
    }
    case "price":
      if (state.priceMin == null && state.priceMax == null) return true;
      if (listing.price == null) return false;
      return (state.priceMin == null || listing.price >= state.priceMin)
        && (state.priceMax == null || listing.price <= state.priceMax);
    case "year":
      if (state.yearMin == null && state.yearMax == null) return true;
      return (state.yearMin == null || listing.year >= state.yearMin)
        && (state.yearMax == null || listing.year <= state.yearMax);
    case "mileage":
      if (state.mileageMax == null) return true;
      return listing.mileage != null && listing.mileage <= state.mileageMax;
    case "range":
      if (state.rangeMin == null) return true;
      return listing.rangeMi != null && listing.rangeMi >= state.rangeMin;
  }
}

const ALL_DIMENSIONS: Dimension[] = [
  "condition", "powertrain", "makes", "bodies", "price", "year", "mileage", "range",
];

export function applyFilters(
  listings: readonly VehicleListing[], state: FilterState,
): VehicleListing[] {
  return listings.filter((l) => ALL_DIMENSIONS.every((d) => passes(l, state, d)));
}

export function activeFilterCount(state: FilterState): number {
  let n = 0;
  if (state.condition !== "all") n++;
  if (state.powertrain !== "all") n++;
  n += state.makes.length;
  n += state.bodies.length;
  if (state.priceMin != null || state.priceMax != null) n++;
  if (state.yearMin != null || state.yearMax != null) n++;
  if (state.mileageMax != null) n++;
  if (state.rangeMin != null) n++;
  return n;
}

export interface FilterChip {
  /** Stable key for React and for tests. */
  id: string;
  label: string;
  /** The state with just this chip removed. */
  next: FilterState;
}

const money = (n: number) => `$${n.toLocaleString("en-US")}`;

/** The removable summary of what is currently applied, in the order the panel
 *  presents the filters. */
export function filterChips(state: FilterState): FilterChip[] {
  const chips: FilterChip[] = [];

  if (state.condition !== "all") {
    chips.push({
      id: "condition",
      label: state.condition === "new" ? "New" : "Used",
      next: { ...state, condition: "all" },
    });
  }
  if (state.powertrain !== "all") {
    chips.push({
      id: "powertrain",
      label: POWERTRAIN_LABELS[state.powertrain],
      next: { ...state, powertrain: "all" },
    });
  }
  for (const make of state.makes) {
    chips.push({
      id: `make:${make}`,
      label: make,
      next: { ...state, makes: state.makes.filter((m) => m !== make) },
    });
  }
  for (const body of state.bodies) {
    chips.push({
      id: `body:${body}`,
      label: BODY_LABELS[body],
      next: { ...state, bodies: state.bodies.filter((b) => b !== body) },
    });
  }
  if (state.priceMin != null || state.priceMax != null) {
    const label = state.priceMin != null && state.priceMax != null
      ? `${money(state.priceMin)}–${money(state.priceMax)}`
      : state.priceMin != null ? `${money(state.priceMin)} and up` : `Under ${money(state.priceMax!)}`;
    chips.push({ id: "price", label, next: { ...state, priceMin: undefined, priceMax: undefined } });
  }
  if (state.yearMin != null || state.yearMax != null) {
    const label = state.yearMin != null && state.yearMax != null
      ? `${state.yearMin}–${state.yearMax}`
      : state.yearMin != null ? `${state.yearMin} and newer` : `${state.yearMax} and older`;
    chips.push({ id: "year", label, next: { ...state, yearMin: undefined, yearMax: undefined } });
  }
  if (state.mileageMax != null) {
    chips.push({
      id: "mileage",
      label: `Under ${state.mileageMax.toLocaleString("en-US")} mi`,
      next: { ...state, mileageMax: undefined },
    });
  }
  if (state.rangeMin != null) {
    chips.push({
      id: "range",
      label: `${state.rangeMin}+ mi range`,
      next: { ...state, rangeMin: undefined },
    });
  }
  return chips;
}

export interface Facet<T extends string> {
  value: T;
  label: string;
  count: number;
}

/** How many listings each choice would leave, counted against the other filters
 *  but NOT against its own dimension — so ticking a second make widens the list
 *  the way it reads like it should, and a choice that would empty the page
 *  shows a zero before it is clicked. */
function facetCounts<T extends string>(
  listings: readonly VehicleListing[],
  state: FilterState,
  dimension: Dimension,
  valueOf: (l: VehicleListing) => T | undefined,
): Map<T, number> {
  const others = ALL_DIMENSIONS.filter((d) => d !== dimension);
  const counts = new Map<T, number>();
  for (const listing of listings) {
    if (!others.every((d) => passes(listing, state, d))) continue;
    const value = valueOf(listing);
    if (value == null) continue;
    counts.set(value, (counts.get(value) ?? 0) + 1);
  }
  return counts;
}

export function makeFacets(
  listings: readonly VehicleListing[], state: FilterState,
): Facet<string>[] {
  const counts = facetCounts(listings, state, "makes", (l) => l.make);
  return [...counts.entries()]
    .map(([value, count]) => ({ value, label: value, count }))
    .sort((a, b) => b.count - a.count || a.label.localeCompare(b.label));
}

export function bodyFacets(
  listings: readonly VehicleListing[], state: FilterState,
): Facet<BodyStyle>[] {
  const counts = facetCounts(listings, state, "bodies", bodyStyleOf);
  const order = Object.keys(BODY_LABELS) as BodyStyle[];
  return order
    .filter((body) => counts.has(body) || state.bodies.includes(body))
    .map((body) => ({ value: body, label: BODY_LABELS[body], count: counts.get(body) ?? 0 }));
}
