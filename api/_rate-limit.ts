// Shared request rate limiting (see supabase/migrations/0017_rate_limit.sql).
//
// Underscore-prefixed, so Vercel treats this as a module rather than a
// Serverless Function: it costs none of the 12 Hobby slots.
//
// WHY THIS EXISTS: nothing in api/ was bounded. /api/lead performs a
// GoHighLevel upsert, a Supabase insert and a Slack post on every request, so an
// unauthenticated script could burn the invocation budget, fill the CRM, and
// flood the one table holding visitors' personal data.
//
// THREE RULES IT HOLDS TO:
//
//  1. IT FAILS OPEN. If Supabase is unset, slow or down, the request proceeds.
//     A limiter that takes the contact form offline when the database hiccups
//     has caused more damage than the abuse it was guarding against. The one
//     exception is a caller that explicitly asks to fail closed.
//
//  2. IT NEVER STORES AN ADDRESS. The key is sha256(ip + RATE_LIMIT_SALT).
//     Without the salt the rows are meaningless, so this cannot quietly become
//     a log of who visited.
//
//  3. IT IS DELIBERATELY COARSE. Shared offices, schools, libraries and mobile
//     carrier NAT put many real people behind one address — exactly the people
//     an EV incentives site should not be turning away. Limits are set well
//     above believable human use, so the first person to trip one is a script.

import { createHash } from "node:crypto";
import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function db(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null;
  return createClient(url, key, { auth: { persistSession: false } });
}

/** The client address, as Vercel reports it. The first entry of
 *  x-forwarded-for is the real client; the rest are proxies.
 *
 *  Tries several headers because an empty result here silently disables the
 *  limiter for that request (see the `!ip` branch in checkRateLimit), which is
 *  the worst possible failure mode for a control whose whole job is to say no.
 *  api/track.ts and api/gate-login.ts already fall back to x-real-ip; this is
 *  the same chain, plus Vercel's own header. */
const IP_HEADERS = ["x-forwarded-for", "x-real-ip", "x-vercel-forwarded-for"] as const;

export function clientIp(req: { headers?: Record<string, unknown> }): string {
  for (const h of IP_HEADERS) {
    const raw = req.headers?.[h];
    const s = typeof raw === "string" ? raw : Array.isArray(raw) ? String(raw[0] ?? "") : "";
    const first = s.split(",")[0].trim();
    if (first) return first;
  }
  return "";
}

/** Salted so the table cannot be reversed into a record of who visited. The
 *  salt is optional — without it this still works, it is just weaker, and a
 *  missing env var must never disable the limiter itself. */
function hashIp(ip: string): string {
  return createHash("sha256")
    .update(ip + (process.env.RATE_LIMIT_SALT || "etus-rate-limit"))
    .digest("hex")
    .slice(0, 32);
}

export interface RateLimitOptions {
  /** Which budget this counts against, e.g. "lead". Keeps one noisy endpoint
   *  from locking a visitor out of the others. */
  bucket: string;
  /** Requests allowed per window. */
  limit: number;
  /** Window length in minutes. */
  windowMinutes: number;
  /** Block the request when the check itself fails. Default false — see rule 1.
   *  Only worth setting on a path where letting an unbounded request through is
   *  worse than a false rejection. */
  failClosed?: boolean;
}

export interface RateLimitResult {
  ok: boolean;
  /** Requests used in this window; 0 when the check could not run. */
  hits: number;
  limit: number;
  /** Seconds until the window resets — what to put in Retry-After. */
  retryAfter: number;
}

/**
 * Count this request and say whether it is within budget.
 *
 * Never throws. A caller can treat a rejection as final and ignore everything
 * else, because the failure modes all resolve to "allowed".
 */
export async function checkRateLimit(
  req: { headers?: Record<string, unknown> },
  opts: RateLimitOptions,
): Promise<RateLimitResult> {
  const windowMs = opts.windowMinutes * 60_000;
  const startMs = Math.floor(Date.now() / windowMs) * windowMs;
  const retryAfter = Math.max(1, Math.ceil((startMs + windowMs - Date.now()) / 1000));
  const allow = (hits: number): RateLimitResult => ({ ok: true, hits, limit: opts.limit, retryAfter });

  try {
    const ip = clientIp(req);
    // No address to key on — a local request, or a proxy that stripped it.
    // Counting every such request together would rate-limit them as one visitor.
    //
    // This branch disables the limiter for the request, so it must be loud: a
    // silent early-allow here is indistinguishable from a working limiter, and
    // that is exactly how a limit can appear to be enforced while never firing.
    if (!ip) {
      console.warn(
        `[rate-limit] no client IP for bucket "${opts.bucket}" — request NOT limited. Headers seen: ${
          Object.keys(req.headers ?? {}).filter((k) => k.includes("ip") || k.includes("forward")).join(", ") || "(none matching)"
        }`,
      );
      return allow(0);
    }

    const client = db();
    if (!client) return opts.failClosed
      ? { ok: false, hits: 0, limit: opts.limit, retryAfter }
      : allow(0);

    const { data, error } = await client.rpc("bump_rate_limit", {
      p_ip_hash: hashIp(ip),
      p_bucket: opts.bucket,
      p_window: new Date(startMs).toISOString(),
    });

    if (error || typeof data !== "number") {
      return opts.failClosed
        ? { ok: false, hits: 0, limit: opts.limit, retryAfter }
        : allow(0);
    }
    return { ok: data <= opts.limit, hits: data, limit: opts.limit, retryAfter };
  } catch {
    return opts.failClosed
      ? { ok: false, hits: 0, limit: opts.limit, retryAfter }
      : allow(0);
  }
}

/** The 429 body. Written for a person who has hit it by accident — which, on a
 *  shared network, is who will hit it first. */
export function tooManyRequests(
  res: { status: (n: number) => { json: (o: unknown) => void }; setHeader?: (k: string, v: string) => void },
  r: RateLimitResult,
) {
  res.setHeader?.("Retry-After", String(r.retryAfter));
  res.status(429).json({
    error: "rate_limited",
    detail: `That's more requests than we allow in a short window. Try again in about ${
      r.retryAfter < 90 ? `${r.retryAfter} seconds` : `${Math.ceil(r.retryAfter / 60)} minutes`
    }. If you're on a shared or office network, that limit is shared too.`,
    retryAfter: r.retryAfter,
  });
}
