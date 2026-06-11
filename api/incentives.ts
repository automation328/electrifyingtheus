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
//   NREL_API_KEY   Free key from https://developer.nlr.gov/signup/ (recommended).
//                  Falls back to DEMO_KEY if unset — works, but rate-limited.
//
// NREL retired developer.nrel.gov in 2026; its API now lives at developer.nlr.gov
// (confirmed in NREL's own docs repo, github.com/NREL/developer.nrel.gov).

const NREL_ENDPOINT =
  "https://developer.nlr.gov/api/transportation-incentives-laws/v1.json";

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

  // Retry transient upstream failures (slow responses, brief 429/5xx). The
  // DEMO_KEY is heavily rate-limited and shared across all server traffic on one
  // egress IP, so set NREL_API_KEY to make this reliable under real load.
  const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
  let lastStatus = 502;
  let lastMessage = "Couldn't reach the incentives service.";

  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const upstream = await fetch(`${NREL_ENDPOINT}?${params}`);
      const data = await upstream.json().catch(() => null);

      if (upstream.ok && data && !data.error) {
        // Cache hard at the CDN: NREL data changes rarely, and this caching is
        // what keeps us under the rate limit. 1 day fresh, serve-stale for a
        // week while revalidating in the background.
        res.setHeader("Cache-Control", "public, s-maxage=86400, stale-while-revalidate=604800");
        res.status(200).json({ result: Array.isArray(data.result) ? data.result : [] });
        return;
      }

      lastStatus = upstream.status === 429 ? 429 : 502;
      lastMessage = data?.error?.message || `NREL request failed (${upstream.status})`;
      // Don't hammer a hard client error; only retry rate limits / 5xx.
      if (upstream.status >= 400 && upstream.status < 500 && upstream.status !== 429) break;
    } catch (err) {
      console.error("NREL proxy error", err);
      lastStatus = 502;
      lastMessage = "Couldn't reach the incentives service.";
    }
    if (attempt < 2) await sleep(500 * (attempt + 1));
  }

  res.status(lastStatus).json({ error: lastMessage });
}
