// The weekly event import.
//
// /api/events already scrapes the ICS/RSS calendars listed in EVENT_FEEDS,
// follows each event's page for its real title and image, and serves the result
// CDN-cached. What it does NOT do is keep any of it: those events are rendered
// straight from the feed, so they cannot be edited in the CMS, cannot be given a
// custom image, cannot be featured, and disappear the moment a source drops
// them.
//
// This module closes that gap once a week. It reads the site's OWN /api/events
// rather than re-parsing the calendars, which is deliberate:
//
//   * one parser, not two — the feed logic is fiddly (ICS folding, a reader
//     proxy for sources that 403 datacenter IPs) and duplicating it guarantees
//     the two copies drift;
//   * the enrichment is already applied, so a stored title is the real event
//     name rather than "Lawrence Township";
//   * an imported row therefore looks exactly like what visitors already see,
//     which is the whole point — nothing on the page changes, the events just
//     stop being disposable.
//
// Everything lands as a DRAFT. Drafts are invisible to the site (every public
// fetch filters status = 'published') and show up in the CMS Drafts tab, so a
// person decides what goes live. That matters more here than for a form
// submission: a feed can hand us a hundred events in one run.

import type { SupabaseClient } from "@supabase/supabase-js";

// ── Shapes ───────────────────────────────────────────────────────────────────

/** One event as /api/events returns it. */
export interface FeedEvent {
  title: string;
  startISO: string;
  endISO?: string;
  location?: string;
  description?: string;
  url?: string;
  source?: string;
  image?: string;
}

export interface ImportedRow {
  id: string;
  title: string;
  date: string;
  location: string;
  url: string;
}

export interface ImportResult {
  /** Everything the feed returned. */
  scanned: number;
  /** Of those, still upcoming and carrying the fields a row needs. */
  usable: number;
  /** Of those, already in site_events under any status. */
  known: number;
  /** Rows actually inserted. */
  added: number;
  /** Usable, unknown, but the insert failed. */
  failed: number;
  rows: ImportedRow[];
}

// ── Pure helpers (all tested in _event-import.test.ts) ───────────────────────

/**
 * The stable id for a feed event, taken from its source URL.
 *
 * MUST match sourceEventKey in src/hooks/use-external-events.ts. That function
 * is what the Events page uses to hide a feed event once we hold our own copy,
 * so if the two disagree an imported event shows up TWICE — once from the feed
 * and once from the database.
 *
 * It keys on the URL rather than title + date because the two copies of an
 * event routinely disagree about its name: the 0019 import rewrote titles that
 * were unusable as-is ("NDEM", "Poolesville, MD"). The source URL is the only
 * field both sides carry verbatim.
 */
export function sourceKeyFromUrl(url?: string): string | null {
  if (!url) return null;
  return (
    url.match(/eventid=(\d+)/)?.[1] ||
    url.match(/eventcalendarapp\.com\/([^/?#]+)/i)?.[1] ||
    null
  );
}

/** Fallback dedupe for feed events with no recognisable source id: the title,
 *  stripped to letters and digits, plus the date. Deliberately crude — it only
 *  has to catch the same event arriving twice, not match across renames. */
export function titleDateKey(title: string, dateISO: string): string {
  return `${(title || "").toLowerCase().replace(/[^a-z0-9]/g, "")}|${dateISO}`;
}

/** YYYY-MM-DD from an ISO timestamp, read in UTC.
 *
 *  UTC, not local: mapToEventItem in use-external-events.ts builds its month/day
 *  from getUTC* too. Reading one of them locally would shift an evening event to
 *  the next day for half the world and give the stored row a different date —
 *  and therefore a different slug — from the one the site has been showing. */
export function isoDate(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const m = String(d.getUTCMonth() + 1).padStart(2, "0");
  const day = String(d.getUTCDate()).padStart(2, "0");
  return `${d.getUTCFullYear()}-${m}-${day}`;
}

/** The display time for a feed event, mirroring mapToEventItem: a midnight-UTC
 *  start means the feed carried a date only, which reads as "All day" rather
 *  than a spurious "12:00 AM". */
export function displayTime(iso: string): string {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return "";
  if (d.getUTCHours() === 0 && d.getUTCMinutes() === 0) return "All day";
  try {
    return new Intl.DateTimeFormat("en-US", {
      hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short",
    }).format(d);
  } catch {
    return "";
  }
}

/** Many feed events share the generic "National Drive Electric Month" title.
 *  The site appends the city to tell them apart; a stored row must do the same,
 *  or the CMS fills with a hundred identically-named events. */
export function importTitle(rawTitle: string, location: string): string {
  const t = (rawTitle || "").trim();
  if (!t) return "";
  const generic = /^national drive electric (month|week)$/i.test(t);
  return generic && location && location !== "See event details" ? `${t} — ${location}` : t;
}

/** How many header images live in public/media/events/headers (1.jpg .. 30.jpg). */
const HEADER_COUNT = 30;

/**
 * One of the site's own event headers, chosen deterministically from a seed.
 *
 * Migration 0024 dealt these 30 headers across every event that had no picture,
 * precisely so the Events list would not be a column of identical placeholders.
 * The first version of this importer ignored that and stored null, reasoning
 * that a blank thumbnail flags "this draft still needs a picture". In the CMS it
 * just looks broken — twenty-one drafts in a row with an empty grey icon — and
 * on the public site every one of them would fall back to the SAME stock photo,
 * which is the identical-thumbnails problem 0024 existed to solve.
 *
 * Seeded by the event's own identity rather than its position in the run, so the
 * same event keeps the same header if it is ever re-imported, and neighbouring
 * events in a batch get different ones.
 */
export function headerImage(seed: string): string {
  // FNV-1a. Any stable spread would do; this one is short and has no deps.
  let h = 2166136261;
  for (let i = 0; i < seed.length; i++) {
    h ^= seed.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  const n = ((h >>> 0) % HEADER_COUNT) + 1;
  return `https://electrifyingtheus.com/media/events/headers/${n}.jpg`;
}

/** A site_events insert for one feed event, or null when the feed gave us too
 *  little to store. A row with no title or no valid date is not an event:
 *  event_date is NOT NULL and drives sorting, the slug, and isActive. */
export function toDraftRow(e: FeedEvent): Record<string, unknown> | null {
  const startDate = isoDate(e.startISO);
  if (!startDate) return null;
  const location = (e.location || "").trim() || "See event details";
  const title = importTitle(e.title, location);
  if (!title) return null;

  const endDate = e.endISO ? isoDate(e.endISO) : null;
  return {
    event_date: startDate,
    // Only a genuine multi-day span. An endISO equal to (or before) the start is
    // noise from the feed, and storing it would make eventDateRange render a
    // one-day "range".
    end_date: endDate && endDate > startDate ? endDate : null,
    title,
    type: "EV Event",
    location,
    region: location,
    time: displayTime(e.startISO),
    description:
      (e.description || "").slice(0, 1200) ||
      "EV event in the U.S. — see the organizer's page for full details.",
    register_url: (e.url || "").trim() || null,
    // The source page's own photo when it advertised one, otherwise one of the
    // site's 30 event headers. Never null: see headerImage above.
    image: (e.image || "").trim() || headerImage(e.url || `${e.title}|${startDate}`),
    featured: false,
    // 0018. Someone else's unreviewed event has no business on the homepage
    // carousel, even after an editor publishes it.
    hero_hidden: true,
    hidden: false,
    status: "draft",
  };
}

/**
 * The events worth inserting: upcoming, storable, and not already held.
 *
 * `todayISO` is passed in rather than read from the clock so this is testable
 * and so one run uses one date throughout.
 */
export function pickNew(
  feed: FeedEvent[],
  known: { sourceKeys: Set<string>; titleDates: Set<string> },
  todayISO: string,
): { usable: FeedEvent[]; fresh: FeedEvent[] } {
  const usable: FeedEvent[] = [];
  const fresh: FeedEvent[] = [];
  // Within one run too: a feed can list the same event twice.
  const seenKeys = new Set<string>();
  const seenTitles = new Set<string>();

  for (const e of feed) {
    const date = isoDate(e.startISO);
    if (!date || date < todayISO) continue;
    if (!toDraftRow(e)) continue;
    usable.push(e);

    const key = sourceKeyFromUrl(e.url);
    const tdk = titleDateKey(importTitle(e.title, (e.location || "").trim() || "See event details"), date);
    if (key && (known.sourceKeys.has(key) || seenKeys.has(key))) continue;
    if (known.titleDates.has(tdk) || seenTitles.has(tdk)) continue;

    if (key) seenKeys.add(key);
    seenTitles.add(tdk);
    fresh.push(e);
  }
  return { usable, fresh };
}

// ── The run ──────────────────────────────────────────────────────────────────

/**
 * Everything site_events already holds, in the two shapes pickNew compares
 * against.
 *
 * Reads EVERY status, not just published. A draft still awaiting review, and a
 * published event alike, must not be imported a second time — otherwise every
 * Monday re-adds the same backlog until somebody clears it.
 */
async function loadKnown(db: SupabaseClient): Promise<{ sourceKeys: Set<string>; titleDates: Set<string> }> {
  const sourceKeys = new Set<string>();
  const titleDates = new Set<string>();
  const { data, error } = await db.from("site_events").select("title,event_date,register_url").limit(5000);
  if (error || !data) return { sourceKeys, titleDates };
  for (const r of data as Array<{ title?: string; event_date?: string; register_url?: string }>) {
    const key = sourceKeyFromUrl(r.register_url || undefined);
    if (key) sourceKeys.add(key);
    if (r.title && r.event_date) titleDates.add(titleDateKey(r.title, r.event_date));
  }
  return { sourceKeys, titleDates };
}

/** Fetch the site's own aggregated feed. */
export async function fetchSiteFeed(siteUrl: string): Promise<FeedEvent[]> {
  const ctrl = new AbortController();
  // Generous: /api/events enriches every event by fetching its source page, and
  // a cold cache legitimately takes a while. A weekly job can afford to wait.
  const timer = setTimeout(() => ctrl.abort(), 60_000);
  try {
    const r = await fetch(`${siteUrl.replace(/\/+$/, "")}/api/events`, { signal: ctrl.signal });
    if (!r.ok) return [];
    const j = (await r.json()) as { events?: FeedEvent[] };
    return Array.isArray(j?.events) ? j.events : [];
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

/** Scrape, dedupe, and insert this week's new events as drafts. */
export async function runWeeklyImport(
  db: SupabaseClient,
  siteUrl: string,
  todayISO: string,
): Promise<ImportResult> {
  const feed = await fetchSiteFeed(siteUrl);
  const known = await loadKnown(db);
  const { usable, fresh } = pickNew(feed, known, todayISO);

  const rows: ImportedRow[] = [];
  let failed = 0;
  for (const e of fresh) {
    const row = toDraftRow(e);
    if (!row) { failed++; continue; }
    // One at a time, on purpose. A single bulk insert fails as a unit, so one
    // malformed event from a feed we do not control would cost the whole week's
    // import. Inserting individually means a bad row costs only itself.
    const { data, error } = await db.from("site_events").insert(row).select("id").single();
    if (error || !data?.id) { failed++; continue; }
    rows.push({
      id: String(data.id),
      title: String(row.title),
      date: String(row.event_date),
      location: String(row.location),
      url: String(row.register_url ?? ""),
    });
  }

  return {
    scanned: feed.length,
    usable: usable.length,
    known: usable.length - fresh.length,
    added: rows.length,
    failed,
    rows,
  };
}

// ── The Monday digest ────────────────────────────────────────────────────────

const prettyDate = (iso: string): string => {
  const d = new Date(`${iso}T00:00:00Z`);
  if (Number.isNaN(d.getTime())) return iso;
  return new Intl.DateTimeFormat("en-US", {
    weekday: "short", month: "short", day: "numeric", year: "numeric", timeZone: "UTC",
  }).format(d);
};

/**
 * One message for the whole run, not one per event.
 *
 * A weekly sweep can add twenty events; twenty Slack cards with Approve buttons
 * is not a review, it is a wall nobody reads. The digest says what arrived and
 * sends people to the Drafts tab, where they can see all of them side by side.
 */
export function buildImportDigest(
  result: ImportResult,
  siteUrl: string,
): Record<string, unknown> | null {
  if (!process.env.SLACK_WEBHOOK_URL) return null;
  const site = siteUrl.replace(/\/+$/, "");
  const mentions = (process.env.SLACK_REVIEW_MENTIONS || "").trim();

  if (result.added === 0) {
    // Still worth posting. Silence is ambiguous — it reads the same whether
    // there was nothing new or the job never ran.
    return {
      text: "Weekly event import: nothing new",
      blocks: [
        { type: "section", text: { type: "mrkdwn",
          text: `*Weekly event import* — nothing new this week.\n_${result.scanned} events in the feed, ${result.known} already on file._` } },
      ],
    };
  }

  const SHOWN = 10;
  const listed = result.rows.slice(0, SHOWN).map((r) => {
    const label = r.url ? `<${r.url}|${r.title}>` : r.title;
    return `• ${label}\n   ${prettyDate(r.date)} · ${r.location}  ·  <${site}/admin/content/events?edit=${r.id}|edit>`;
  }).join("\n");
  const more = result.rows.length > SHOWN ? `\n_…and ${result.rows.length - SHOWN} more._` : "";

  const blocks: Record<string, unknown>[] = [
    { type: "header", text: { type: "plain_text", text: `${result.added} new event${result.added === 1 ? "" : "s"} imported`, emoji: true } },
    { type: "context", elements: [{ type: "mrkdwn",
      text: `${result.scanned} in the feed · ${result.known} already on file${result.failed ? ` · ${result.failed} could not be stored` : ""}` }] },
    { type: "section", text: { type: "mrkdwn", text: `${listed}${more}` } },
    { type: "section", text: { type: "mrkdwn",
      text: "These are *drafts* — nothing is on the site until someone publishes them." } },
    { type: "actions", elements: [
      { type: "button", style: "primary", text: { type: "plain_text", text: "Review drafts", emoji: true },
        url: `${site}/admin/content/events` },
    ] },
  ];
  if (mentions) blocks.push({ type: "context", elements: [{ type: "mrkdwn", text: mentions }] });

  return { text: `${result.added} new events imported`, blocks };
}

/** Post the digest. Best-effort: a Slack outage must not fail the import that
 *  already succeeded, so this never throws. */
export async function postDigest(payload: Record<string, unknown> | null): Promise<void> {
  const hook = process.env.SLACK_WEBHOOK_URL;
  if (!hook || !payload) return;
  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
  } catch {
    /* ignore */
  }
}
