// Build-time URL inventory for /sitemap.xml.
//
// Root-level so middleware.ts can import it the same way it imports ./og-data.js
// (src/ modules can't be used: src/data/events.ts imports image assets through
// Vite's "@/assets" alias, which doesn't resolve in the Edge runtime).
//
// This list is EXPLICIT on purpose, but it is not trusted to stay correct by
// hand — src/lib/sitemap-urls.test.ts fails if a route or slug is added without
// updating this file. That guard exists because og-data.ts is the same shape of
// hand-maintained list and has already gone stale.
//
// Excluded deliberately:
//   • /admin*, /thank-you  — noindex (mirrors SeoRouteHead + middleware)
//   • six <Navigate> redirects (App.tsx:90-95) — a sitemap must list canonical
//     destinations, never redirects
//   • /blog/:slug and /events/:slug wildcards — CMS rows, unioned in at runtime

/** Routes that redirect elsewhere. Never list these in a sitemap. */
export const SITEMAP_REDIRECTS: string[] = [
  "/blog",
  "/blog/beyond-cars-multimodal-future",
  "/blog/clean-energy-workforce-opportunities",
  "/blog/cleaner-air-healthier-neighborhoods",
  "/blog/evs-in-winter-myths-vs-reality",
  "/blog/real-cost-of-going-electric",
  // Retired event registration page → its recording.
  "/events/from-pump-to-plug",
];

/** Routes intentionally kept out of the index. */
// Post-conversion confirmation pages and the CMS. None of these should be in a
// sitemap: a thank-you page has nothing to rank for, and an indexed one can be
// reached without ever submitting the form it is meant to confirm.
export const SITEMAP_EXCLUDE: string[] = ["/admin", "/thank-you", "/list-your-event/thank-you"];

/** Static top-level pages (App.tsx route literals, minus redirects/excluded). */
export const SITEMAP_PAGES: string[] = [
  "/",
  "/assistant",
  "/calculator",
  "/careers",
  "/contact-us",
  "/electric-public-transit",
  "/electric-school-buses",
  "/electricity-vs-gasoline",
  "/ev-charging-101",
  "/ev-road-safety",
  "/events",
  "/evs-in-winter",
  "/evsafetywebinar",
  "/evtol-drone-delivery",
  "/financial-savings",
  "/from-pump-to-plug-part-2",
  "/find-a-charger",
  "/gallery",
  "/gm-ev-vs-gas",
  "/heavy-duty-electrification",
  "/list-your-event",
  "/micro-mobility",
  "/news",
  "/post-a-job",
  "/privacy-policy",
  "/rebate-eligibility",
  "/rebates-incentives",
  "/reduced-emissions",
  "/rideshare-rental-fleets",
  "/save-with-evs-webinar",
  "/self-driving-vehicles",
  "/steam-education",
  "/sustainable-aviation",
  "/sustainable-maritime",
  "/terms",
  "/us-ev-policies",
  "/workforce-economic-development",
];

/** Curated blog posts (src/data/blog-posts.ts). */
export const SITEMAP_BLOG: string[] = [
  "/blog/2026-ev-tipping-point-electric-vehicle-adoption-america",
  "/blog/beyond-cars-electric-bikes-buses-multimodal-transportation",
  "/blog/charging-101-levels",
  "/blog/electric-vehicle-myths-2026",
  "/blog/electric-vehicles-air-quality-public-health-benefits",
  "/blog/ev-clean-energy-workforce-jobs-opportunities",
  "/blog/ev-cold-weather-winter-range-myths-vs-reality",
  "/blog/from-the-pump-to-the-plug-ev-savings-webinar",
  "/blog/real-cost-of-going-electric-ev-savings-breakdown",
];

/** Curated events (src/data/events.ts). */
export const SITEMAP_EVENTS: string[] = [
  "/events/act-expo-2027",
  "/events/august-coalition-conversation-2026",
  "/events/auto-shanghai-2027",
  "/events/demo-days-los-angeles",
  "/events/drive-clean-summit-expo-2026",
  "/events/ev-charging-meet-up-2026",
  "/events/ev-charging-summit-expo-2027",
  "/events/evadc-ask-an-ev-owner-2026",
  "/events/evadc-monthly-meeting-2026",
  "/events/evadc-picnic-2026",
  "/events/fleet-charging-meet-up-2026",
  "/events/forth-roadmap-conference-2026",
  "/events/iaa-mobility-2027",
  "/events/july-coalition-conversation-2026",
  "/events/la-auto-show-automobility-la-2026",
  "/events/move-america-2026",
  "/events/multi-modal-emobility-summit",
  "/events/nordic-ev-summit-2027",
  "/events/october-coalition-conversation-2026",
  "/events/september-coalition-conversation-2026",
  "/events/soco-charging-meet-up-2026",
  "/events/state-of-charge-2026",
  "/events/the-battery-show-north-america-2026",
  "/events/unity-fest-2026",
];

/** Every build-time URL, deduped (the pump-to-plug event has its own route). */
export const SITEMAP_STATIC: string[] = [
  ...new Set([...SITEMAP_PAGES, ...SITEMAP_BLOG, ...SITEMAP_EVENTS]),
];

/** True when a path must never appear in the sitemap. */
export function isSitemapExcluded(path: string): boolean {
  if (SITEMAP_REDIRECTS.includes(path)) return true;
  return SITEMAP_EXCLUDE.some((p) => path === p || path.startsWith(`${p}/`));
}
