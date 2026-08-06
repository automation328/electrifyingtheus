// CMS activity log — self-provisioning audit trail, no SQL migration required.
//
// Instead of a Postgres table (which the serverless runtime can't CREATE on its
// own), the log lives as a single JSON object in a PRIVATE Supabase Storage
// bucket the service role creates on first use. That keeps the feature working
// with zero Supabase-dashboard steps, and the private bucket means the audit
// data (editor emails + what they changed) is never publicly readable.
//
// Writes are best-effort: any failure here must NEVER break the mutation the
// caller just performed. Concurrent writers can race on the read-modify-write of
// the single JSON blob and drop an occasional entry — acceptable for an audit
// trail that's advisory, not authoritative. What we DO guard against is wiping
// the whole history: an ambiguous read (transient download error / corrupt blob
// on an object that still exists) skips the append instead of overwriting the
// stored log with a fresh single-entry one. The leading underscore keeps Vercel
// from treating this file as an endpoint.

import { randomUUID } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

const BUCKET = "cms-audit";          // private; service-role only
const KEY = "activity-log.json";
const MAX_ENTRIES = 500;

export interface ActivityEntry {
  id: string;
  created_at: string;
  actor: string;
  role: string | null;
  action: string;
  target: string | null;
  summary: string | null;
}

// Cached per warm lambda so we don't re-check the bucket on every call — but only
// cached once the bucket is CONFIRMED to exist (see ensureBucket).
let bucketEnsured = false;

function alreadyExists(err: unknown): boolean {
  const e = err as { message?: string; status?: number; statusCode?: number | string } | null;
  const msg = String(e?.message ?? "").toLowerCase();
  const status = Number(e?.status ?? e?.statusCode ?? 0);
  return msg.includes("already exists") || msg.includes("duplicate") || status === 409;
}

async function ensureBucket(db: SupabaseClient): Promise<void> {
  if (bucketEnsured) return;
  try {
    const { error } = await db.storage.createBucket(BUCKET, { public: false });
    // Cache success only when the bucket is confirmed present (created now, or it
    // already existed). On any OTHER error (throttle / transient 5xx / network),
    // leave the flag false so the next call retries — otherwise a single early
    // failure would silently disable logging for this instance's whole lifetime.
    if (!error || alreadyExists(error)) bucketEnsured = true;
  } catch { /* transient/throw — leave flag false to retry next time */ }
}

// Does the log object actually exist? Used to tell "genuinely absent" (fresh
// start — safe to write) apart from "present but unreadable right now" (must not
// overwrite). Returns false on any listing failure (treat as absent → nothing to
// lose by writing).
async function objectExists(db: SupabaseClient): Promise<boolean> {
  try {
    const { data, error } = await db.storage.from(BUCKET).list("", { limit: 100, search: KEY });
    if (error || !data) return false;
    return data.some((o) => o.name === KEY);
  } catch { return false; }
}

// ok=false means the current contents are UNKNOWN (a read/parse failure on an
// object that may exist) — callers must NOT overwrite in that case. ok=true means
// the contents are known: parsed entries, or the object is genuinely absent (→ []).
async function readLog(db: SupabaseClient): Promise<{ entries: ActivityEntry[]; ok: boolean }> {
  try {
    const { data, error } = await db.storage.from(BUCKET).download(KEY);
    if (error || !data) {
      return (await objectExists(db)) ? { entries: [], ok: false } : { entries: [], ok: true };
    }
    const arr = JSON.parse(await data.text());
    return { entries: Array.isArray(arr) ? (arr as ActivityEntry[]) : [], ok: true };
  } catch {
    // download threw or the blob was corrupt → don't clobber a log that may exist.
    return (await objectExists(db)) ? { entries: [], ok: false } : { entries: [], ok: true };
  }
}

/** Append one entry (newest-first). Never throws; never wipes existing history. */
export async function appendActivity(
  db: SupabaseClient,
  actor: string,
  role: string,
  action: string,
  target?: string,
  summary?: string,
): Promise<void> {
  try {
    await ensureBucket(db);
    const { entries, ok } = await readLog(db);
    if (!ok) return; // ambiguous read — skip rather than risk overwriting the log
    entries.unshift({
      id: randomUUID(),
      created_at: new Date().toISOString(),
      actor,
      role: role ?? null,
      action,
      target: target ?? null,
      summary: summary ?? null,
    });
    if (entries.length > MAX_ENTRIES) entries.length = MAX_ENTRIES;
    const buf = Buffer.from(JSON.stringify(entries), "utf8");
    await db.storage.from(BUCKET).upload(KEY, buf, { upsert: true, contentType: "application/json" });
  } catch { /* best-effort — swallow so the caller's mutation still succeeds */ }
}

/** Read the most recent `limit` entries (newest-first). */
export async function readActivity(db: SupabaseClient, limit = 200): Promise<ActivityEntry[]> {
  await ensureBucket(db);
  const { entries } = await readLog(db);
  return entries.slice(0, limit);
}
