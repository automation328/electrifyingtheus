// Password-gated read API for the internal analytics dashboard (/admin).
// Reads site_analytics with the service role key and returns aggregates as JSON.
// The heavy lifting lives in api/_analytics-core.ts, shared with the editor-gated
// op:"analytics" in api/admin.ts (the CMS-embedded Statistics view).
//
// Env (server-only):
//   ANALYTICS_PASSWORD          shared dashboard password (required)
//   SUPABASE_SERVICE_ROLE_KEY   read access

import { createHash, timingSafeEqual } from "node:crypto";
import { createClient } from "@supabase/supabase-js";
import { analyticsSummary, visitorJourney } from "./_analytics-core.js";
import { checkAuthRateLimit, tooManyRequests } from "./_rate-limit.js";

// Server-only Supabase client (service role → bypasses RLS). null until configured.
function adminSupabase() {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function passwordOk(supplied: string): boolean {
  const expected = process.env.ANALYTICS_PASSWORD || "";
  if (!expected || !supplied) return false;
  // Hash both sides so the compare is fixed-length and leaks nothing about the secret's length.
  const a = createHash("sha256").update(supplied).digest();
  const b = createHash("sha256").update(expected).digest();
  return timingSafeEqual(a, b);
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "method" }); return; }

  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = body && typeof body === "object" ? body : {};

  // One shared password is the only thing between the internet and the visitor
  // table (IPs, names, emails). The comparison below is constant-time, but that
  // is worthless without a cap on attempts, so bound guesses before checking.
  // Fails CLOSED, unlike the contact form: if the limiter's database is down we
  // would rather this dashboard be briefly unavailable than unguarded.
  const rl = await checkAuthRateLimit(req, {
    bucket: "analytics-login", limit: 10, windowMinutes: 15, failClosed: true,
  });
  if (!rl.ok) { tooManyRequests(res, rl); return; }

  if (!passwordOk(String(b.password ?? ""))) {
    res.status(401).json({ error: "unauthorized" });
    return;
  }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "analytics_not_configured" }); return; }

  // Single-visitor journey: every page this person visited, grouped by session.
  if (b.visitorId) {
    const out = await visitorJourney(db, String(b.visitorId));
    if ("error" in out) { res.status(500).json({ error: "query_failed", detail: out.error }); return; }
    res.status(200).json(out.data);
    return;
  }

  const out = await analyticsSummary(db, b.range);
  if ("error" in out) { res.status(500).json({ error: "query_failed", detail: out.error }); return; }
  res.status(200).json(out.data);
}
