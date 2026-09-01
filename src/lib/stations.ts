// Public charging stations from the AFDC / NREL station API, via /api/stations.
//
// The page's whole point is the distinction the old Google Maps embed could not
// draw: which of these pins is a DC fast charger and which is Level 2. Every
// helper here exists to answer that from the two port counts NREL gives us.

export interface Station {
  id: number;
  name: string;
  address: string;
  city: string;
  state: string;
  zip: string;
  lat: number;
  lon: number;
  distance: number | null;
  /** Number of DC fast ports (0 when the station has none). */
  dcFast: number;
  /** Number of Level 2 ports (0 when the station has none). */
  level2: number;
  connectors: string[];
  network: string;
  pricing: string;
  hours: string;
}

export interface StationsResult {
  center: { lat: number; lon: number; city: string; state: string };
  /** The place as the geocoder named it — "Atlanta, Georgia", not what was typed. */
  label?: string;
  /** How broad the match was. A state search has no useful "widen it" offer. */
  kind?: PlaceKind;
  radius: number;
  stations: Station[];
}

/** Mirrors api/_geocode.ts. How broad the thing the visitor searched for is. */
export type PlaceKind = "zip" | "address" | "city" | "county" | "state";

/** What a station offers. "both" is common — a fast charger with L2 beside it. */
export type StationKind = "dc" | "both" | "l2" | "other";

export const kindOf = (s: Pick<Station, "dcFast" | "level2">): StationKind =>
  s.dcFast > 0 && s.level2 > 0 ? "both" : s.dcFast > 0 ? "dc" : s.level2 > 0 ? "l2" : "other";

// One color and one name per kind, shared by the map pins, the legend and the
// station list so a color always means the same thing. Concrete hex rather than
// the CSS tokens: these are painted into Leaflet's own DOM, outside the Tailwind
// theme, and a var() that failed to resolve would render an invisible pin.
export const KIND_COLORS: Record<StationKind, string> = {
  dc: "#c2410c",    // DC fast — orange
  both: "#1f7a4d",  // both kinds — green
  l2: "#0057b8",    // Level 2 — blue
  other: "#64748b", // nothing reported — grey
};

export const KIND_LABELS: Record<StationKind, string> = {
  dc: "DC fast",
  both: "DC fast + Level 2",
  l2: "Level 2",
  other: "Unspecified",
};

/** The filter the visitor picked. */
export type LevelFilter = "all" | "dc_fast" | "level2";

/** Does a station belong in the current filter? */
export const matchesLevel = (s: Pick<Station, "dcFast" | "level2">, level: LevelFilter): boolean =>
  level === "all" ? true : level === "dc_fast" ? s.dcFast > 0 : s.level2 > 0;

// NREL's connector codes are not what anyone calls them at the plug. J1772COMBO
// IS CCS, and the Tesla connector is now the NACS standard — a driver looking
// for "NACS" would not recognise "TESLA".
const CONNECTOR_LABELS: Record<string, string> = {
  J1772: "J1772",
  J1772COMBO: "CCS",
  CHADEMO: "CHAdeMO",
  TESLA: "NACS (Tesla)",
  NEMA1450: "NEMA 14-50",
  NEMA515: "NEMA 5-15",
  NEMA520: "NEMA 5-20",
};

export const connectorLabel = (code: string): string => CONNECTOR_LABELS[code] ?? code;

/** "16 DC fast ports", "4 Level 2 · 2 DC fast" — what you can actually plug into. */
export const portSummary = (s: Pick<Station, "dcFast" | "level2">): string => {
  const parts: string[] = [];
  if (s.dcFast > 0) parts.push(`${s.dcFast} DC fast`);
  if (s.level2 > 0) parts.push(`${s.level2} Level 2`);
  return parts.length ? parts.join(" · ") : "Ports not reported";
};

/** "1.2 mi" — NREL returns miles. Null distance means we asked by coordinates. */
export const distanceLabel = (miles: number | null): string =>
  miles === null ? "" : miles < 10 ? `${miles.toFixed(1)} mi` : `${Math.round(miles)} mi`;

/** Where to search: what the visitor typed, or coordinates. */
export interface StationsWhere { q?: string; lat?: number; lon?: number }

/**
 * Query string for /api/stations. The typed text wins; coordinates are the
 * fallback.
 *
 * `radius` is left OUT unless the visitor picked one. The server sizes the
 * search from what it matched — fifteen miles around a street address, a few
 * hundred around a state — and a radius sent on every request would flatten
 * that back to one number for every kind of place.
 *
 * The text is squared up first — trimmed, inner runs of spaces collapsed,
 * lower-cased. Geocoders do not care about any of that, but the CDN does: the
 * response is cached for a day PER URL, so "Atlanta, GA" and "atlanta,  ga"
 * would otherwise be two entries holding the same answer, and every variant
 * anyone types is another upstream lookup.
 */
export const canonicalPlace = (text: string): string =>
  text.trim().replace(/\s+/g, " ").toLowerCase();

export const stationsQuery = (
  where: StationsWhere,
  level: LevelFilter,
  radius?: number | null,
): string => {
  const p = new URLSearchParams();
  if (where.q) p.set("q", canonicalPlace(where.q));
  else if (typeof where.lat === "number" && typeof where.lon === "number") {
    p.set("lat", String(where.lat));
    p.set("lon", String(where.lon));
  }
  if (level !== "all") p.set("level", level);
  if (typeof radius === "number") p.set("radius", String(radius));
  return p.toString();
};

export async function fetchStations(
  where: StationsWhere,
  level: LevelFilter,
  radius?: number | null,
): Promise<StationsResult> {
  const res = await fetch(`/api/stations?${stationsQuery(where, level, radius)}`);
  const data = await res.json().catch(() => null);
  if (!res.ok) throw new Error(data?.error || "Couldn't load charging stations.");
  return data as StationsResult;
}
