// Server-side proxy for the AFDC / NREL "Alternative Fuel Stations" API — the
// public charging stations behind /find-a-charger.
//
// Why a proxy rather than calling NREL from the browser:
//   * Keeps the NREL key server-side — no key baked into the public JS bundle.
//   * One CDN-cached response serves every visitor asking about the same ZIP,
//     which is what keeps us inside NREL's rate limit.
//   * Trims the payload. A station row is ~60 fields of which the map uses ten.
//
// Env:
//   NREL_API_KEY   Free key from https://developer.nlr.gov/signup/ (recommended;
//                  DEMO_KEY is shared across all traffic from one egress IP).
//
// NREL retired developer.nrel.gov in 2026; the API now lives at developer.nlr.gov
// (same host api/incentives.ts uses).

const STATIONS_ENDPOINT = "https://developer.nlr.gov/api/alt-fuel-stations/v1/nearest.json";

// Typed text → coordinates. NREL dropped its own `location` parameter in
// February 2025 ("Pass in the 'latitude' and 'longitude' parameters instead"),
// so whatever the visitor typed has to be resolved before the station call.
// _geocode.ts does that and also reports HOW BROAD the match was, which is what
// picks the radius: fifteen miles around a street address, a few hundred around
// a state. Every answer is cached by the CDN with the station list, so a given
// search is looked up once per day no matter how many visitors ask.
import { resolveQuery, MAX_RADIUS, MAX_RESULTS, type Place } from "./_geocode.js";

// The longest search worth honouring. It bounds the upstream URL and, because
// the response is cached per query string, the number of distinct cache entries
// a bored visitor can create.
const MAX_QUERY = 120;

const LEVELS = new Set(["all", "dc_fast", "level2"]);

const pick = (v: unknown, fallback: string) =>
  Array.isArray(v) ? String(v[0] ?? fallback) : typeof v === "string" ? v : fallback;

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

/** The ten fields the map and the list actually render. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const trim = (s: any) => ({
  id: s.id,
  name: s.station_name,
  address: s.street_address,
  city: s.city,
  state: s.state,
  zip: s.zip,
  lat: num(s.latitude),
  lon: num(s.longitude),
  distance: num(s.distance),
  // Port counts, not booleans: "2 DC fast" and "20 DC fast" are different stops.
  dcFast: num(s.ev_dc_fast_num) ?? 0,
  level2: num(s.ev_level2_evse_num) ?? 0,
  connectors: Array.isArray(s.ev_connector_types) ? s.ev_connector_types : [],
  network: s.ev_network || "",
  pricing: s.ev_pricing || "",
  hours: s.access_days_time || "",
});

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  const query = req.query ?? {};
  // `q` is what the box sends now; `zip` is what links shared before free-text
  // search did, and what the IP auto-detect still hands us.
  const text = pick(query.q, pick(query.zip, "")).trim().slice(0, MAX_QUERY);
  const level = pick(query.level, "all").toLowerCase();
  // A radius arrives only when the VISITOR chose one (the "search 50 miles
  // instead" button). Left off, the geocoder's own answer decides — which is the
  // only way "Georgia" and "1000 University Center Lane" can both be sensible.
  // Clamped rather than rejected: a silly number should still return a map.
  const asked = num(query.radius);
  let lat = num(query.lat);
  let lon = num(query.lon);

  if (!LEVELS.has(level)) { res.status(400).json({ error: "Invalid level" }); return; }

  let place: Place | null = lat !== null && lon !== null
    ? { lat, lon, label: "", kind: "address", radius: 15 }
    : null;
  if (!place) {
    if (!text) { res.status(400).json({ error: "Pass a ZIP code, city, state or address — or lat + lon." }); return; }
    place = await resolveQuery(text);
    if (!place) { res.status(404).json({ error: `Couldn't find "${text}". Try a ZIP code, a city and state, or a street address.` }); return; }
  }
  lat = place.lat;
  lon = place.lon;
  const radius = Math.min(Math.max(asked ?? place.radius, 1), MAX_RADIUS);

  const params = new URLSearchParams({
    api_key: process.env.NREL_API_KEY || "DEMO_KEY",
    fuel_type: "ELEC",
    // Public stations that are open. A private fleet depot or a station listed
    // as planned is not somewhere a visitor can plug in tonight.
    access: "public",
    status: "E",
    latitude: String(lat),
    longitude: String(lon),
    radius: String(radius),
    limit: String(MAX_RESULTS),
  });
  // NREL filters by level upstream, so a filtered view fetches only what it draws.
  if (level !== "all") params.set("ev_charging_level", level === "level2" ? "2" : "dc_fast");

  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let lastStatus = 502;
  let lastMessage = "Couldn't reach the charging station service.";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const upstream = await fetch(`${STATIONS_ENDPOINT}?${params}`);
      const data = await upstream.json().catch(() => null);

      if (upstream.ok && data && !data.error && Array.isArray(data.fuel_stations)) {
        // AFDC updates on the order of days, so cache hard: 1 day fresh, a week
        // of serve-stale while revalidating behind it.
        res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
        res.status(200).json({
          center: { lat, lon, city: place.city ?? "", state: place.state ?? "" },
          // What was matched, and how broadly — the page names the place back to
          // the visitor rather than echoing their typing, and hides the
          // "widen the search" offer when the search is already state-sized.
          label: place.label,
          kind: place.kind,
          radius,
          stations: data.fuel_stations.map(trim).filter((s) => s.lat !== null && s.lon !== null),
        });
        return;
      }

      lastStatus = upstream.status === 429 ? 429 : 502;
      lastMessage = data?.errors?.[0] || data?.error?.message || `NREL request failed (${upstream.status})`;
      if (upstream.status >= 400 && upstream.status < 500 && upstream.status !== 429) break;
    } catch (err) {
      console.error("NREL stations proxy error", err);
      lastStatus = 502;
      lastMessage = "Couldn't reach the charging station service.";
    }
    if (attempt < 2) await sleep(500 * (attempt + 1));
  }

  res.status(lastStatus).json({ error: lastMessage });
}
