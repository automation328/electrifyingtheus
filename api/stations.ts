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

// ZIP → coordinates. NREL dropped its own `location` parameter in February 2025
// ("Pass in the 'latitude' and 'longitude' parameters instead"), so the ZIP has
// to be resolved before the station call. Zippopotam is free and needs no key;
// Nominatim is the fallback. Both answers are cached by the CDN with the station
// list, so a given ZIP is looked up once per day no matter how many visitors ask.
const ZIPPOPOTAM = "https://api.zippopotam.us/us";
const NOMINATIM = "https://nominatim.openstreetmap.org/search";

// Fair-use identification for Nominatim, whose policy asks for a real contact.
const UA = "ElectrifyingTheUS/1.0 (+https://electrifyingtheus.com)";

const LEVELS = new Set(["all", "dc_fast", "level2"]);

const pick = (v: unknown, fallback: string) =>
  Array.isArray(v) ? String(v[0] ?? fallback) : typeof v === "string" ? v : fallback;

const num = (v: unknown): number | null => {
  const n = typeof v === "number" ? v : parseFloat(String(v ?? ""));
  return Number.isFinite(n) ? n : null;
};

interface Center { lat: number; lon: number; city?: string; state?: string }

async function geocodeZip(zip: string): Promise<Center | null> {
  try {
    const r = await fetch(`${ZIPPOPOTAM}/${zip}`, { headers: { "User-Agent": UA } });
    if (r.ok) {
      const d = await r.json();
      const p = Array.isArray(d?.places) ? d.places[0] : null;
      const lat = num(p?.latitude);
      const lon = num(p?.longitude);
      if (lat !== null && lon !== null) {
        return { lat, lon, city: p?.["place name"], state: p?.["state abbreviation"] };
      }
    }
  } catch { /* fall through to Nominatim */ }

  try {
    const params = new URLSearchParams({ postalcode: zip, country: "us", format: "json", limit: "1" });
    const r = await fetch(`${NOMINATIM}?${params}`, { headers: { "User-Agent": UA } });
    if (r.ok) {
      const d = await r.json();
      const hit = Array.isArray(d) ? d[0] : null;
      const lat = num(hit?.lat);
      const lon = num(hit?.lon);
      if (lat !== null && lon !== null) return { lat, lon };
    }
  } catch { /* no coordinates — the caller reports it */ }

  return null;
}

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

  const q = req.query ?? {};
  const zip = pick(q.zip, "").replace(/\D/g, "").slice(0, 5);
  const level = pick(q.level, "all").toLowerCase();
  // Radius is clamped rather than rejected: it only widens the search, and a
  // silly value should still return a map rather than an error.
  const radius = Math.min(Math.max(num(q.radius) ?? 15, 1), 50);
  let lat = num(q.lat);
  let lon = num(q.lon);

  if (!LEVELS.has(level)) { res.status(400).json({ error: "Invalid level" }); return; }

  let center: Center | null = lat !== null && lon !== null ? { lat, lon } : null;
  if (!center) {
    if (zip.length !== 5) { res.status(400).json({ error: "Pass a five-digit ZIP, or lat + lon." }); return; }
    center = await geocodeZip(zip);
    if (!center) { res.status(404).json({ error: `Couldn't find ZIP ${zip}.` }); return; }
  }
  lat = center.lat;
  lon = center.lon;

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
    limit: "150",
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
          center: { lat, lon, city: center.city ?? "", state: center.state ?? "" },
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
