// The visitor's country + region (U.S. state code) from Vercel's edge geo
// headers — reliable and rate-limit-free, unlike third-party IP lookups
// (ipapi.co's free tier is throttled and frequently blocked). Used to preselect
// the visitor's state in the incentives search, the calculator, Find a Charger
// and the marketplace.
//
// This lives in a helper rather than its own api/geo.ts because the Hobby plan
// allows only 12 Serverless Functions per deployment, and adding the marketplace
// took us to 13. It is now served by api/stations.ts under ?op=geo, with a
// rewrite in vercel.json keeping the public /api/geo URL unchanged — the same
// technique the weekly-events cron already uses. Files prefixed with _ are not
// deployed as functions, so this costs nothing against the limit.

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function header(req: any, name: string): string {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) || "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export function geoFromHeaders(req: any, res: any): void {
  const country = header(req, "x-vercel-ip-country").toUpperCase();
  // For the U.S. this is the state code (e.g. "CA", "TX"); ISO 3166-2 subdivision.
  const region = header(req, "x-vercel-ip-country-region").toUpperCase();
  const city = header(req, "x-vercel-ip-city");
  const postal = header(req, "x-vercel-ip-postal-code");
  const latitude = header(req, "x-vercel-ip-latitude");
  const longitude = header(req, "x-vercel-ip-longitude");
  // Per-visitor geo — never cache at the CDN.
  res.setHeader("Cache-Control", "no-store");
  res.status(200).json({ country, region, city, postal, latitude, longitude });
}
