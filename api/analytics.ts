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

// Pathname only — drop query string + hash and trailing slash, so each page
// aggregates to one row regardless of its params.
function stripQuery(path: string): string {
  let p = (path || "/").split("?")[0].split("#")[0];
  if (p.length > 1) p = p.replace(/\/+$/, "");
  return p || "/";
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

  // ── Single-visitor journey: every page this person visited, in order ────────
  // Looks back 90 days regardless of the selected range, grouped by session.
  if (b.visitorId) {
    const vid = String(b.visitorId).slice(0, 80);
    const winceIso = new Date(Date.now() - 90 * 24 * 60 * 60 * 1000).toISOString();
    const { data: vrows, error: verr } = await db
      .from("site_analytics")
      .select("created_at,type,path,referrer,label,session_id,first_name,email,is_known,city,region,country")
      .eq("visitor_id", vid)
      .gte("created_at", winceIso)
      .order("created_at", { ascending: true })
      .limit(3000);
    if (verr) { res.status(500).json({ error: "query_failed", detail: verr.message }); return; }
    const evs = (vrows || []) as Row[];

    let name = "", email = "", known = false, place = "";
    const sids = new Set<string>();
    let views = 0, clk = 0;
    for (const r of evs) {
      if (r.is_known) { known = true; if (r.first_name) name = r.first_name; if (r.email) email = r.email; }
      if (r.type === "click") clk++; else views++;
      if (r.session_id) sids.add(r.session_id);
      const pl = [r.city, r.region, r.country].filter(Boolean).join(", ");
      if (pl) place = pl;
    }

    // Group into sessions (ordered by first event); newest session first.
    const order: string[] = [];
    const groups = new Map<string, { sessionId: string; start: string; end: string; events: Array<{ when: string; type: string; path: string; label: string | null; referrer: string }> }>();
    for (const r of evs) {
      const sid = r.session_id || "—";
      let g = groups.get(sid);
      if (!g) { g = { sessionId: sid, start: r.created_at, end: r.created_at, events: [] }; groups.set(sid, g); order.push(sid); }
      g.end = r.created_at;
      g.events.push({ when: r.created_at, type: r.type, path: r.path || "/", label: r.label, referrer: r.referrer });
    }
    const journeySessions = order.map((sid) => groups.get(sid)!).reverse();

    res.status(200).json({
      visitor: {
        visitorId: vid, isKnown: known, name: name || null, email: email || null,
        views, clicks: clk, sessions: sids.size, place,
        firstSeen: evs[0]?.created_at || null, lastSeen: evs[evs.length - 1]?.created_at || null,
      },
      sessions: journeySessions,
    });
    return;
  }

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
  const pageViews = new Map<string, number>();
  const pageVisitors = new Map<string, Set<string>>();
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
    const page = stripQuery(r.path);
    pageViews.set(page, (pageViews.get(page) || 0) + 1);
    if (r.visitor_id) {
      let set = pageVisitors.get(page);
      if (!set) { set = new Set(); pageVisitors.set(page, set); }
      set.add(r.visitor_id);
    }
    bump(referrers, normReferrer(r.referrer));
    bump(countries, r.country);
    bump(cities, [r.city, r.region].filter(Boolean).join(", "));
    const day = r.created_at.slice(0, 10);
    if (seriesViews.has(day)) seriesViews.set(day, (seriesViews.get(day) || 0) + 1);
    if (seriesSessions.has(day) && r.session_id) seriesSessions.get(day)!.add(r.session_id);
  }
  for (const r of clicks) bump(clickLabels, r.label);

  // Views + unique visitors per page (pathname), most-viewed first.
  const pages = [...pageViews.entries()]
    .map(([key, views]) => ({ key, count: views, visitors: pageVisitors.get(key)?.size || 0 }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30);

  // Per-visitor roster (by persistent device id) — for the drill-down list. rows
  // are newest-first, so the first event seen for a visitor is their latest.
  interface VAgg {
    visitorId: string; isKnown: boolean; name: string; email: string;
    views: number; clicks: number; sessions: Set<string>;
    firstSeen: string; lastSeen: string; lastPage: string; place: string;
  }
  const vmap = new Map<string, VAgg>();
  for (const r of rows) {
    const vid = r.visitor_id;
    if (!vid) continue;
    let v = vmap.get(vid);
    if (!v) {
      v = { visitorId: vid, isKnown: false, name: "", email: "", views: 0, clicks: 0, sessions: new Set(), firstSeen: r.created_at, lastSeen: r.created_at, lastPage: "", place: "" };
      vmap.set(vid, v);
    }
    if (r.created_at > v.lastSeen) v.lastSeen = r.created_at;
    if (r.created_at < v.firstSeen) v.firstSeen = r.created_at;
    if (r.type === "click") v.clicks++;
    else { v.views++; if (!v.lastPage) v.lastPage = stripQuery(r.path); }
    if (r.session_id) v.sessions.add(r.session_id);
    if (r.is_known) { v.isKnown = true; if (r.first_name && !v.name) v.name = r.first_name; if (r.email && !v.email) v.email = r.email; }
    if (!v.place) { const pl = [r.city, r.region, r.country].filter(Boolean).join(", "); if (pl) v.place = pl; }
  }
  const visitorsList = [...vmap.values()]
    .sort((a, b2) => (a.lastSeen < b2.lastSeen ? 1 : a.lastSeen > b2.lastSeen ? -1 : 0))
    .slice(0, 200)
    .map((v) => ({
      visitorId: v.visitorId, isKnown: v.isKnown, name: v.name || null, email: v.email || null,
      views: v.views, clicks: v.clicks, sessions: v.sessions.size,
      lastSeen: v.lastSeen, firstSeen: v.firstSeen, lastPage: v.lastPage || "/", place: v.place,
    }));

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
    pages,
    visitors: visitorsList,
    topReferrers: topN(referrers, 10),
    topCountries: topN(countries, 10),
    topCities: topN(cities, 10),
    topClicks: topN(clickLabels, 12),
    recentKnown,
  });
}
