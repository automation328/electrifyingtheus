// Server-side proxy for the NREL AFDC "Laws & Incentives" API.
//
// The browser calls /api/incentives instead of developer.nrel.gov directly.
// Why a proxy (same reasoning as api/lead.ts):
//   * Keeps the NREL key server-side — no key baked into the public JS bundle.
//   * CDN-caches results so thousands of visitors collapse into a handful of
//     upstream calls. This caching is what keeps us under NREL's rate limit —
//     critical when the key is the shared DEMO_KEY (throttled to ~30/hr, 50/day
//     per IP), which is what was causing "Couldn't load incentives right now."
//
// Env (Vercel → Project → Settings → Environment Variables):
//   NREL_API_KEY   Free key from https://developer.nrel.gov/signup/ (recommended).
//                  Falls back to DEMO_KEY if unset — works, but rate-limited.

const NREL_ENDPOINT =
  "https://developer.nrel.gov/api/transportation-incentives-laws/v1.json";

// Allowlists so this can't be abused as an open proxy to arbitrary NREL params.
const JURISDICTIONS = new Set([
  "US", "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI",
  "ID", "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS",
  "MO", "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR",
  "PA", "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);
const TECHNOLOGIES = new Set(["ELEC", "PHEV", "HEV", "HY", "BIOD", "ETH", "NG", "LPG"]);

const pick = (v: unknown, fallback: string) =>
  Array.isArray(v) ? String(v[0] ?? fallback) : typeof v === "string" ? v : fallback;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  const q = req.query ?? {};
  const jurisdiction = pick(q.jurisdiction, "US").toUpperCase();
  const technology = pick(q.technology, "ELEC").toUpperCase();
  if (!JURISDICTIONS.has(jurisdiction) || !TECHNOLOGIES.has(technology)) {
    res.status(400).json({ error: "Invalid jurisdiction or technology" }); return;
  }

  const params = new URLSearchParams({
    api_key: process.env.NREL_API_KEY || "DEMO_KEY",
    jurisdiction,
    technology,
    limit: "200",
  });

  try {
    const upstream = await fetch(`${NREL_ENDPOINT}?${params}`);
    const data = await upstream.json().catch(() => null);

    if (!upstream.ok || !data || data.error) {
      const message = data?.error?.message || `NREL request failed (${upstream.status})`;
      // Surface a 429 as a 429 so the client knows it's a rate limit, not a bug.
      res.status(upstream.status === 429 ? 429 : 502).json({ error: message });
      return;
    }

    // Cache hard at the CDN: NREL data changes rarely, and this caching is what
    // keeps us under the rate limit. 1 day fresh, serve-stale for a week while
    // revalidating in the background.
    res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
    res.status(200).json({ result: Array.isArray(data.result) ? data.result : [] });
  } catch (err) {
    console.error("NREL proxy error", err);
    res.status(502).json({ error: "Couldn't reach the incentives service." });
  }
}
