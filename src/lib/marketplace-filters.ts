import type { VehicleListing } from "./marketplace-types";
import { normalizeModelText } from "./ev-catalog-match";
import type { BodyStyle } from "./tco-calculator";
import { vehicles } from "@/data/vehicles";

// The marketplace's filter state, and the pure functions that read it from a
// URL, write it back, and apply it to a page of listings.
//
// Some of these filters travel upstream and the rest cannot. Price, year, make
// and model are parameters the provider itself understands, so sending them
// decides WHICH listings come back: ask for Nissan and every Leaf in the radius
// is reachable, page by page. Applied here they could only hide cars already on
// the page while the rest sat on pages nobody would open.
//
// Body style, powertrain, condition, mileage and range have no upstream
// equivalent, so those are applied here, to the page that came back — which is
// why the results heading says "on this page" whenever one of them is set.

export interface FilterState {
  condition: "all" | "new" | "used";
  powertrain: "all" | "ev" | "phev";
  makes: string[];
  /** Model names, as loosely matched as dealer listings demand. No panel
   *  exposes this — it is how a link from elsewhere on the site asks for one
   *  particular car, e.g. the EV matches on the comparison pages. */
  models: string[];
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
  models: [],
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
  "condition", "powertrain", "makes", "models", "bodies",
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
    models: csv(params.get("models")),
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
  if (state.models.length) next.set("models", state.models.join(","));
  if (state.bodies.length) next.set("bodies", state.bodies.join(","));
  for (const key of ["priceMin", "priceMax", "yearMin", "yearMax", "mileageMax", "rangeMin"] as const) {
    const value = state[key];
    if (value != null) next.set(key, String(value));
  }
  return next;
}

/** The subset the search endpoint understands — the filters the PROVIDER can
 *  apply, so they decide which listings come back rather than which of the ones
 *  already on the page get hidden. */
export function serverFilters(state: FilterState) {
  return {
    priceMin: state.priceMin,
    priceMax: state.priceMax,
    yearMin: state.yearMin,
    yearMax: state.yearMax,
    makes: state.makes,
    models: state.models,
  };
}

type Dimension =
  | "condition" | "powertrain" | "makes" | "models" | "bodies"
  | "price" | "year" | "mileage" | "range";

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
    case "makes": {
      if (!state.makes.length) return true;
      // Case-insensitive: the provider writes "NISSAN" as readily as "Nissan",
      // and an exact compare here would empty a page it had already filtered.
      const listed = listing.make.toLowerCase();
      return state.makes.some((m) => m.toLowerCase() === listed);
    }
    case "models": {
      if (!state.models.length) return true;
      // Dealers write the same car as "Mustang Mach-E", "Mach E" and
      // "MUSTANG MACH-E Premium AWD", so match the way the catalog matcher
      // does: normalised, and either string may contain the other.
      const listed = normalizeModelText(listing.model);
      return state.models.some((wanted) => {
        const want = normalizeModelText(wanted);
        return want.length > 0 && (listed.includes(want) || want.includes(listed));
      });
    }
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
  "condition", "powertrain", "makes", "models", "bodies",
  "price", "year", "mileage", "range",
];

export function applyFilters(
  listings: readonly VehicleListing[], state: FilterState,
): VehicleListing[] {
  return listings.filter((l) => ALL_DIMENSIONS.every((d) => passes(l, state, d)));
}

/**
 * How many filters are applied to the page in front of the visitor rather than
 * to the search itself. Only these can make the results read "3 of 18" — the
 * upstream ones change what the 18 are, they do not hide any of them.
 */
export function localFilterCount(state: FilterState): number {
  let n = 0;
  if (state.condition !== "all") n++;
  if (state.powertrain !== "all") n++;
  n += state.bodies.length;
  if (state.mileageMax != null) n++;
  if (state.rangeMin != null) n++;
  return n;
}

export function activeFilterCount(state: FilterState): number {
  let n = 0;
  if (state.condition !== "all") n++;
  if (state.powertrain !== "all") n++;
  n += state.makes.length;
  n += state.models.length;
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
  for (const model of state.models) {
    chips.push({
      id: `model:${model}`,
      label: model,
      next: { ...state, models: state.models.filter((m) => m !== model) },
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
