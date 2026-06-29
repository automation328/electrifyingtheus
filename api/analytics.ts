// Password-gated read API for the internal analytics dashboard (/admin).
// Reads site_analytics with the service role key and returns aggregates as JSON.
// Never exposes raw rows to the client beyond small recent feeds.
//
// Env (server-only):
//   ANALYTICS_PASSWORD          shared dashboard password (required)
//   SUPABASE_SERVICE_ROLE_KEY   read access (see api/_supabase.ts)

import { timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

// Server-only Supabase client (service role → bypasses RLS). null until configured.
function adminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

const RANGES: Record<string, number> = {
  "24h": 1, "7d": 7, "30d": 30, "90d": 90,
};

function passwordOk(supplied: string): boolean {
  const expected = process.env.ANALYTICS_PASSWORD || "";
  if (!expected || !supplied) return false;
  const a = Buffer.from(supplied);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  try { return timingSafeEqual(a, b); } catch { return false; }
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

interface Row {
  created_at: string;
  type: string;
  path: string;
  referrer: string;
  label: string | null;
  session_id: string | null;
  visitor_id: string | null;
  first_name: string | null;
  email: string | null;
  is_known: boolean;
  city: string | null;
  region: string | null;
  country: string | null;
}

function topN(counts: Map<string, number>, n: number) {
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, n)
    .map(([key, count]) => ({ key, count }));
}

function bump(map: Map<string, number>, key: string | null | undefined) {
  const k = (key || "").trim();
  if (!k) return;
  map.set(k, (map.get(k) || 0) + 1);
}

function normReferrer(r: string): string {
  if (!r) return "direct / none";
  try {
    const u = new URL(r);
    if (u.hostname.includes("electrifyingtheus")) return "internal";
    return u.hostname.replace(/^www\./, "");
  } catch { return r.slice(0, 60); }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "method" }); return; }

  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = body && typeof body === "object" ? body : {};

  if (!passwordOk(String(b.password ?? ""))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "analytics_not_configured" }); return; }

  const rangeKey = RANGES[String(b.range ?? "7d")] ? String(b.range) : "7d";
  const days = RANGES[rangeKey];
  const since = new Date(Date.now() - days * 24 * 60 * 60 * 1000);
  const sinceIso = since.toISOString();

  const { data, error } = await db
    .from("site_analytics")
    .select("created_at,type,path,referrer,label,session_id,visitor_id,first_name,email,is_known,city,region,country")
    .gte("created_at", sinceIso)
    .order("created_at", { ascending: false })
    .limit(100000);

  if (error) { res.status(500).json({ error: "query_failed", detail: error.message }); return; }

  const rows = (data || []) as Row[];
  const pageviews = rows.filter((r) => r.type === "pageview");
  const clicks = rows.filter((r) => r.type === "click");

  const sessions = new Set<string>();
  const visitors = new Set<string>();
  const knownVisitors = new Set<string>();
  const leadEmails = new Set<string>();
  const pages = new Map<string, number>();
  const referrers = new Map<string, number>();
  const countries = new Map<string, number>();
  const cities = new Map<string, number>();
  const clickLabels = new Map<string, number>();

  // Per-day pageview + session series (oldest → newest).
  const dayKeys: string[] = [];
  for (let i = days - 1; i >= 0; i--) {
    const d = new Date(Date.now() - i * 24 * 60 * 60 * 1000);
    dayKeys.push(d.toISOString().slice(0, 10));
  }
  const seriesViews = new Map(dayKeys.map((d) => [d, 0]));
  const seriesSessions = new Map(dayKeys.map((d) => [d, new Set<string>()]));

  let knownViews = 0;
  for (const r of pageviews) {
    if (r.session_id) sessions.add(r.session_id);
    if (r.visitor_id) {
      visitors.add(r.visitor_id);
      if (r.is_known) knownVisitors.add(r.visitor_id);
    }
    if (r.is_known) { knownViews++; if (r.email) leadEmails.add(r.email.toLowerCase()); }
    bump(pages, r.path || "/");
    bump(referrers, normReferrer(r.referrer));
    bump(countries, r.country);
    bump(cities, [r.city, r.region].filter(Boolean).join(", "));
    const day = r.created_at.slice(0, 10);
    if (seriesViews.has(day)) seriesViews.set(day, (seriesViews.get(day) || 0) + 1);
    if (seriesSessions.has(day) && r.session_id) seriesSessions.get(day)!.add(r.session_id);
  }
  for (const r of clicks) bump(clickLabels, r.label);

  // Recent named-visitor feed (latest event per known visitor).
  const seenVisitor = new Set<string>();
  const recentKnown: Array<{ name: string; email: string; path: string; place: string; when: string }> = [];
  for (const r of rows) {
    if (!r.is_known || !r.email) continue;
    const key = r.visitor_id || r.email;
    if (seenVisitor.has(key)) continue;
    seenVisitor.add(key);
    recentKnown.push({
      name: r.first_name || "—",
      email: r.email,
      path: r.path || "/",
      place: [r.city, r.region, r.country].filter(Boolean).join(", "),
      when: r.created_at,
    });
    if (recentKnown.length >= 25) break;
  }

  res.status(200).json({
    range: rangeKey,
    since: sinceIso,
    totals: {
      pageviews: pageviews.length,
      clicks: clicks.length,
      sessions: sessions.size,
      visitors: visitors.size,
      knownVisitors: knownVisitors.size,
      leads: leadEmails.size,
      knownViews,
      anonViews: pageviews.length - knownViews,
    },
    series: dayKeys.map((d) => ({
      date: d,
      views: seriesViews.get(d) || 0,
      sessions: (seriesSessions.get(d)?.size) || 0,
    })),
    topPages: topN(pages, 12),
    topReferrers: topN(referrers, 10),
    topCountries: topN(countries, 10),
    topCities: topN(cities, 10),
    topClicks: topN(clickLabels, 12),
    recentKnown,
  });
}
