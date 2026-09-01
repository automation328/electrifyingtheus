// Turning what a visitor typed into a point on the map, for /api/stations.
//
// The charging map used to take a five-digit ZIP and nothing else. It now takes
// a ZIP, a city, a state, or a street address — which means the typed text has
// to be resolved to coordinates before AFDC can be asked what is near them, and
// the SIZE of the match has to come back with it. Fifteen miles is the right
// ring around "1000 University Center Lane"; it is a rounding error around
// "Georgia".
//
// Everything here is either a pure function (unit-tested in _geocode.test.ts) or
// one fetch. The network lives at the bottom.

/** Coordinates plus whatever the geocoder could tell us about them. */
export interface Place {
  lat: number;
  lon: number;
  /** What to show the visitor: "Atlanta, Georgia", "Georgia", "30010". */
  label: string;
  city?: string;
  state?: string;
  /** How broad the match was, which is what picks the radius. */
  kind: PlaceKind;
  /** Miles to search around it. */
  radius: number;
}

export type PlaceKind = "zip" | "address" | "city" | "county" | "state";

// AFDC's own limits, from the nearest.json docs: radius is 0–500 miles and an
// explicit limit may be up to 200. Both are the ceiling rather than a guess.
export const MAX_RADIUS = 500;
export const MAX_RESULTS = 200;

/** The ring for a ZIP or a street address, and the page's own default. */
export const DEFAULT_RADIUS = 15;

// ── US states ───────────────────────────────────────────────────────────────
//
// Kept locally rather than asked of the geocoder, because a geocoder is bad at
// exactly this. Photon resolves "GA" to Gainesville, Florida and "Georgia"
// (without a country filter) to the country in the Caucasus — both verified
// against the live API. A state is a closed list of fifty-one things, so
// looking it up is more reliable than searching for it.

export const US_STATES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan",
  MN: "Minnesota", MS: "Mississippi", MO: "Missouri", MT: "Montana",
  NE: "Nebraska", NV: "Nevada", NH: "New Hampshire", NJ: "New Jersey",
  NM: "New Mexico", NY: "New York", NC: "North Carolina", ND: "North Dakota",
  OH: "Ohio", OK: "Oklahoma", OR: "Oregon", PA: "Pennsylvania",
  RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota", TN: "Tennessee",
  TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia", WA: "Washington",
  WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const NAME_TO_ABBR: Record<string, string> = Object.fromEntries(
  Object.entries(US_STATES).map(([abbr, name]) => [name.toLowerCase(), abbr]),
);

/**
 * "ga", "GA.", "georgia", "  New  Mexico " → { abbr, name }; anything else null.
 *
 * Only an EXACT state matches. "Georgia Avenue" and "Washington, DC" are a
 * street and a city, and sending either down the state path would search half a
 * time zone for an address someone can walk to.
 */
export function matchUsState(text: string): { abbr: string; name: string } | null {
  const t = text.trim().replace(/\.$/, "").replace(/\s+/g, " ").toLowerCase();
  if (!t) return null;
  const byName = NAME_TO_ABBR[t];
  if (byName) return { abbr: byName, name: US_STATES[byName] };
  const abbr = t.toUpperCase();
  if (US_STATES[abbr]) return { abbr, name: US_STATES[abbr] };
  return null;
}

/** A bare five-digit ZIP, which has its own (better) lookup. */
export const isZip = (text: string): boolean => /^\d{5}$/.test(text.trim());

// ── How big is the thing we found? ──────────────────────────────────────────

/**
 * Photon's `extent` is [west, north, east, south] — [minLon, maxLat, maxLon,
 * minLat]. That is NOT what Photon's prose says (it claims minLat second), but
 * it IS what its own worked example shows and what the live API returns:
 * Atlanta comes back [-84.550854, 33.886823, -84.28956, 33.6479187], and
 * 33.886823 is the northern edge, not the southern one. Verified against three
 * responses. Do not "correct" this without re-checking a live payload — every
 * radius silently inverts if you do.
 */
export function halfDiagonalMiles(extent: unknown): number | null {
  if (!Array.isArray(extent) || extent.length !== 4) return null;
  const [west, north, east, south] = extent.map(Number);
  if (![west, north, east, south].every(Number.isFinite)) return null;
  const midLat = (north + south) / 2;
  const heightMi = Math.abs(north - south) * 69;
  const widthMi = Math.abs(east - west) * 69 * Math.cos((midLat * Math.PI) / 180);
  return Math.hypot(heightMi, widthMi) / 2;
}

/**
 * What kind of place Photon returned.
 *
 * A house number is the giveaway for a specific address, whatever the feature is
 * tagged as — the college in the screenshot comes back as amenity/college, and a
 * government building as office/government, so an osm_value allowlist would miss
 * both. Everything unrecognised is treated as a point, which is the safe end to
 * be wrong at: a too-small ring finds nothing and the page already offers to
 * widen it, while a too-large one silently answers a different question.
 */
export function classifyPlace(props: Record<string, unknown>): PlaceKind {
  if (props.housenumber) return "address";
  const value = String(props.osm_value ?? "");
  if (["city", "town", "village", "hamlet", "borough", "suburb", "neighbourhood"].includes(value)) return "city";
  if (["county", "state_district", "district"].includes(value)) return "county";
  if (value === "state") return "state";
  return "address";
}

const clamp = (n: number, lo: number, hi: number) => Math.min(Math.max(n, lo), hi);

/**
 * Miles to search, from how broad the match was and how big its box is.
 *
 * The floors matter more than the maths: a city whose bounding box is tight
 * still deserves a ring big enough to catch the chargers just outside it, and a
 * state with a wrapped or missing box still has to return something. Alaska's
 * box crosses the antimeridian and computes to ~6000 miles — the ceiling is what
 * makes that harmless.
 */
export function radiusForPlace(kind: PlaceKind, extent?: unknown): number {
  const half = halfDiagonalMiles(extent);
  switch (kind) {
    case "zip":
    case "address":
      return DEFAULT_RADIUS;
    case "city":
      return Math.round(half === null ? 20 : clamp(half * 1.2, 12, 35));
    case "county":
      return Math.round(half === null ? 35 : clamp(half * 1.1, 25, 60));
    case "state":
      // No upper clamp below the API's own: a state search should cover the
      // state. Georgia works out at ~213 miles, Rhode Island at ~40.
      return Math.round(half === null ? 200 : clamp(half * 1.05, 60, MAX_RADIUS));
  }
}

/** "Atlanta, Georgia" — the place as the page should name it back to the visitor. */
export function placeLabel(props: Record<string, unknown>): string {
  const parts = [
    props.name,
    props.city && props.city !== props.name ? props.city : null,
    props.state && props.state !== props.name ? props.state : null,
  ].filter(Boolean).map(String);
  return parts.join(", ") || String(props.name ?? "");
}

// ── The network ─────────────────────────────────────────────────────────────

// Fair-use identification. Nominatim's policy asks for a real contact, and
// Photon's asks callers to be identifiable.
const UA = "ElectrifyingTheUS/1.0 (+https://electrifyingtheus.com)";
const ZIPPOPOTAM = "https://api.zippopotam.us/us";
const PHOTON = "https://photon.komoot.io/api/";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

/**
 * A fetch that gives up.
 *
 * Three geocoders run in front of an AFDC call that has its own retries, all
 * inside one serverless invocation. Without a deadline a single unresponsive
 * free service holds the whole request open until the platform kills it, and
 * the visitor watches a spinner instead of getting the fallback's answer.
 */
async function fetchWithTimeout(url: string, ms = 4000): Promise<Response | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), ms);
  try {
    return await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": UA } });
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** A ZIP, via the service that only does ZIPs and therefore never guesses. */
export async function geocodeZip(zip: string): Promise<Place | null> {
  try {
    const r = await fetchWithTimeout(`${ZIPPOPOTAM}/${zip}`);
    if (r?.ok) {
      const d = await r.json();
      const p = Array.isArray(d?.places) ? d.places[0] : null;
      const lat = num(p?.latitude);
      const lon = num(p?.longitude);
      if (lat !== null && lon !== null) {
        const city = p?.["place name"];
        const state = p?.["state abbreviation"];
        return {
          lat, lon, city, state, kind: "zip", radius: DEFAULT_RADIUS,
          label: city ? `${city}, ${state} ${zip}`.trim() : zip,
        };
      }
    }
  } catch { /* fall through to Nominatim */ }

  try {
    const params = new URLSearchParams({ postalcode: zip, country: "us", format: "json", limit: "1" });
    const r = await fetchWithTimeout(`${NOMINATIM}?${params}`);
    if (r?.ok) {
      const d = await r.json();
      const hit = Array.isArray(d) ? d[0] : null;
      const lat = num(hit?.lat);
      const lon = num(hit?.lon);
      if (lat !== null && lon !== null) {
        return { lat, lon, kind: "zip", radius: DEFAULT_RADIUS, label: zip };
      }
    }
  } catch { /* no coordinates — the caller reports it */ }

  return null;
}

/**
 * Free text — a city, an address, a landmark — via Photon, with Nominatim
 * behind it.
 *
 * countrycode=us is load-bearing, not tidiness: without it Photon answers
 * "Georgia" with the country in the Caucasus and "30010" with a postcode in
 * Spain. This is a US charging map, so every search is a US search.
 */
export async function geocodePlace(text: string): Promise<Place | null> {
  try {
    const params = new URLSearchParams({ q: text, limit: "1", lang: "en", countrycode: "us" });
    const r = await fetchWithTimeout(`${PHOTON}?${params}`);
    if (r?.ok) {
      const d = await r.json();
      const hit = Array.isArray(d?.features) ? d.features[0] : null;
      const coords = hit?.geometry?.coordinates;
      const lon = num(coords?.[0]);
      const lat = num(coords?.[1]);
      if (lat !== null && lon !== null) {
        const props = (hit.properties ?? {}) as Record<string, unknown>;
        const kind = classifyPlace(props);
        return {
          lat, lon, kind,
          radius: radiusForPlace(kind, props.extent),
          label: placeLabel(props) || text,
          city: props.city ? String(props.city) : undefined,
          state: props.state ? String(props.state) : undefined,
        };
      }
    }
  } catch { /* fall through to Nominatim */ }

  try {
    const params = new URLSearchParams({
      q: text, countrycodes: "us", format: "json", limit: "1", addressdetails: "1",
    });
    const r = await fetchWithTimeout(`${NOMINATIM}?${params}`);
    if (r?.ok) {
      const d = await r.json();
      const hit = Array.isArray(d) ? d[0] : null;
      const lat = num(hit?.lat);
      const lon = num(hit?.lon);
      if (lat !== null && lon !== null) {
        // Nominatim's boundingbox is [south, north, west, east] — a different
        // order from Photon's extent, so it is reshaped rather than trusted.
        const bb = Array.isArray(hit.boundingbox) ? hit.boundingbox.map(Number) : null;
        const extent = bb && bb.length === 4 ? [bb[2], bb[1], bb[3], bb[0]] : undefined;
        // `addresstype`, not `type`: Nominatim answers a state, a county and most
        // cities with type "administrative", because that is the OSM boundary tag.
        // The semantic kind is in addresstype, and reading the wrong one made
        // every boundary match fall through to "address" and get a 15-mile ring.
        // `addressdetails` above is what puts house_number within reach at all.
        const kind = classifyPlace({
          osm_value: hit.addresstype ?? hit.type,
          housenumber: hit.address?.house_number,
        });
        return {
          lat, lon, kind,
          radius: radiusForPlace(kind, extent),
          label: String(hit.display_name ?? text).split(",").slice(0, 3).join(",").trim(),
        };
      }
    }
  } catch { /* no coordinates — the caller reports it */ }

  return null;
}

/**
 * Resolve whatever the visitor typed, cheapest and most certain route first: a
 * bare ZIP goes to the ZIP service, an exact state name or code is answered from
 * the table above, and everything else is a search.
 */
export async function resolveQuery(text: string): Promise<Place | null> {
  const q = text.trim();
  if (!q) return null;
  if (isZip(q)) return geocodeZip(q);

  const state = matchUsState(q);
  if (state) {
    const found = await geocodePlace(state.name);
    if (!found) return null;
    // The table owns the NAME — which is why "GA" cannot become Gainesville —
    // and the geocoder owns where it is. When it agreed this is a state its
    // bounding box has already given the right radius; when it found something
    // narrower under the same name, widen back out to state size.
    const radius = found.kind === "state" ? found.radius : radiusForPlace("state", undefined);
    return { ...found, kind: "state", radius, label: state.name, state: state.abbr };
  }

  return geocodePlace(q);
}
