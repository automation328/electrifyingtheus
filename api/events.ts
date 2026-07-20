// Aggregates upcoming EV events from public ICS / RSS calendar feeds and returns
// them normalized for the Events page. ElectrifyingTheUS's own events are
// prioritized by the page itself — this proxy only supplies the external feed.
//
// Configure feeds via env (comma- OR newline-separated URLs):
//   EVENT_FEEDS=https://calendar.google.com/calendar/ical/…/public/basic.ics,https://example.org/events/feed
//
// ICS is the reliable format for events (it carries real start/end dates). RSS
// is supported best-effort (uses <pubDate> as the date, which is often the
// publish date, not the event date) — prefer ICS where possible.

interface NormEvent {
  title: string;
  startISO: string;
  endISO?: string;
  location?: string;
  description?: string;
  url?: string;
  source?: string;
  /** Explicit source label that wins over the url-derived host (e.g. "myeva.org"
   *  for EventCalendarApp events, whose event pages live on a CDN/widget host). */
  sourceLabel?: string;
  image?: string;
}

// ── Detail-page enrichment ───────────────────────────────────────────────────
// Calendar feeds (esp. Drive Electric Month) list events by CITY, so the ICS
// SUMMARY is just "Lawrence Township". The real event name + featured image live
// on each event's page as og:title / og:image. We fetch those (browser UA — the
// sources 403 generic agents) and override. Best-effort + per-request timeout;
// the whole /api/events response is CDN-cached, so this runs ~once/hour.
const ENRICH_UA =
  "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36";

function metaContent(html: string, prop: string): string | undefined {
  const a = html.match(new RegExp(`<meta[^>]+(?:property|name)=["']${prop}["'][^>]*?content=["']([^"']+)["']`, "i"));
  if (a) return a[1];
  const b = html.match(new RegExp(`<meta[^>]+content=["']([^"']+)["'][^>]*?(?:property|name)=["']${prop}["']`, "i"));
  return b ? b[1] : undefined;
}

const decodeEntities = (s: string) =>
  s.replace(/&bull;|&#8226;/g, "•").replace(/&nbsp;/g, " ").replace(/&amp;/g, "&")
    .replace(/&#0?39;|&rsquo;|&apos;/g, "'").replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();

// Strip the "• City, ST • Date" / ", Fri, Jun 26, 2026 | Meetup" tails that
// sources append to og:title, leaving just the event name.
function cleanFeedTitle(og: string): string {
  let t = decodeEntities(og).split(/\s*[•|]\s*/)[0];                       // cut at • or |
  t = t.replace(/,\s*(?:Mon|Tue|Wed|Thu|Fri|Sat|Sun)[a-z]*,.*$/i, "");    // ", Fri, …"
  t = t.replace(/,\s*(?:Jan|Feb|Mar|Apr|May|Jun|Jul|Aug|Sep|Oct|Nov|Dec)[a-z]*\s+\d.*$/i, ""); // ", Jun 26 …"
  return t.trim();
}

async function enrich(e: NormEvent): Promise<void> {
  if (!e.url || !/^https?:\/\//.test(e.url)) return;
  // Drive Electric Month/Earth Month block datacenter IPs (403 from serverless),
  // so read them through r.jina.ai (a reader proxy that isn't blocked); its
  // output starts with "Title: <real page title>". Everything else is fetched
  // directly for og:title + og:image.
  const isDem = /driveelectric(?:month|earthmonth)\.org/i.test(e.url);
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), isDem ? 12000 : 6000);
  try {
    if (isDem) {
      const r = await fetch(`https://r.jina.ai/${e.url}`, { signal: ctrl.signal, headers: { Accept: "text/plain" } });
      if (!r.ok) return;
      const m = (await r.text()).match(/^Title:\s*(.+)$/m);
      if (m) {
        // Page title is "Real Title • City, ST • Date".
        const segs = m[1].split(/\s*•\s*/);
        const real = cleanFeedTitle(segs[0]);
        if (real.length > 2) e.title = real;
        // 2nd segment ("City, ST") is a better venue than the bare state.
        if (segs[1] && /,\s*[A-Z]{2}\b/.test(segs[1])) e.location = segs[1].replace(/\s+/g, " ").trim();
      }
      return;
    }
    const res = await fetch(e.url, { signal: ctrl.signal, headers: { "User-Agent": ENRICH_UA, Accept: "text/html" } });
    if (!res.ok) return;
    const html = await res.text();
    const ogTitle = metaContent(html, "og:title") || html.match(/<title>([^<]+)<\/title>/i)?.[1];
    if (ogTitle) {
      const real = cleanFeedTitle(ogTitle);
      if (real.length > 2) e.title = real;
    }
    // Pull the real event blurb (og:description → meta description) so the card +
    // detail page show the full description instead of the feed's stub/fallback.
    const ogDesc = metaContent(html, "og:description") || metaContent(html, "description");
    if (ogDesc) {
      const d = decodeEntities(ogDesc);
      if (d.length > 20 && d.length > (e.description?.length ?? 0)) e.description = d;
    }
    const ogImg = metaContent(html, "og:image");
    // Use the source's featured image, but skip the generic Drive Electric banner
    // (every DEM event shares it) so those keep varied fallback photos instead.
    if (ogImg && /^https?:\/\//.test(ogImg) && !/ndem-social|social-\d{4}|placeholder|default-/i.test(ogImg)) {
      e.image = ogImg.trim();
    }
  } catch {
    /* blocked / slow / offline — keep the feed's original title + fallback image */
  } finally {
    clearTimeout(timer);
  }
}

// ── ICS parsing ──────────────────────────────────────────────────────────────
// Unfold RFC-5545 folded lines (continuation lines begin with a space/tab).
function unfold(ics: string): string[] {
  const raw = ics.replace(/\r\n/g, "\n").replace(/\r/g, "\n").split("\n");
  const out: string[] = [];
  for (const line of raw) {
    if ((line.startsWith(" ") || line.startsWith("\t")) && out.length) {
      out[out.length - 1] += line.slice(1);
    } else {
      out.push(line);
    }
  }
  return out;
}

const unescapeIcs = (s: string) =>
  s.replace(/\\n/gi, "\n").replace(/\\,/g, ",").replace(/\\;/g, ";").replace(/\\\\/g, "\\");

// Parse 20260625 / 20260625T140000Z / 20260625T140000 → ISO (best-effort UTC).
function icsDateToISO(val: string): string | null {
  const m = val.trim().match(/^(\d{4})(\d{2})(\d{2})(?:T(\d{2})(\d{2})(\d{2}))?/);
  if (!m) return null;
  const [, y, mo, d, hh, mi, ss] = m;
  return new Date(Date.UTC(+y, +mo - 1, +d, +(hh ?? 0), +(mi ?? 0), +(ss ?? 0))).toISOString();
}

function parseIcs(ics: string, source: string): NormEvent[] {
  const out: NormEvent[] = [];
  let cur: Record<string, string> | null = null;
  for (const line of unfold(ics)) {
    if (line === "BEGIN:VEVENT") { cur = {}; continue; }
    if (line === "END:VEVENT") {
      if (cur && cur.SUMMARY && cur.DTSTART) {
        const startISO = icsDateToISO(cur.DTSTART);
        if (startISO) {
          out.push({
            title: unescapeIcs(cur.SUMMARY),
            startISO,
            endISO: cur.DTEND ? icsDateToISO(cur.DTEND) ?? undefined : undefined,
            location: cur.LOCATION ? unescapeIcs(cur.LOCATION) : undefined,
            description: cur.DESCRIPTION ? unescapeIcs(cur.DESCRIPTION) : undefined,
            url: cur.URL || undefined,
            source,
          });
        }
      }
      cur = null;
      continue;
    }
    if (!cur) continue;
    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const name = line.slice(0, colon).split(";")[0].toUpperCase();
    const value = line.slice(colon + 1);
    if (["SUMMARY", "DTSTART", "DTEND", "LOCATION", "DESCRIPTION", "URL"].includes(name) && !(name in cur)) {
      cur[name] = value;
    }
  }
  return out;
}

// ── RSS parsing (best-effort) ────────────────────────────────────────────────
const tag = (block: string, name: string): string | undefined => {
  const m = block.match(new RegExp(`<${name}[^>]*>([\\s\\S]*?)</${name}>`, "i"));
  if (!m) return undefined;
  return m[1].replace(/<!\[CDATA\[([\s\S]*?)\]\]>/g, "$1").replace(/<[^>]+>/g, "").trim() || undefined;
};

function parseRss(xml: string, source: string): NormEvent[] {
  const out: NormEvent[] = [];
  const items = xml.match(/<item[\s\S]*?<\/item>/gi) ?? [];
  for (const it of items) {
    const title = tag(it, "title");
    const dateStr = tag(it, "pubDate") || tag(it, "dc:date") || tag(it, "start");
    if (!title || !dateStr) continue;
    const t = Date.parse(dateStr);
    if (Number.isNaN(t)) continue;
    out.push({
      title,
      startISO: new Date(t).toISOString(),
      description: tag(it, "description"),
      url: tag(it, "link"),
      source,
    });
  }
  return out;
}

// ── EventCalendarApp JSON (e.g. the Electric Vehicle Association calendar on
// myeva.org) ─────────────────────────────────────────────────────────────────
// utcStartTime/utcEndTime are Unix epochs in SECONDS; `location` is an object;
// recurring events arrive as separate dated entries (no RRULE expansion needed);
// results are paginated via pages.nextPage — the default response is the page
// straddling "today", so following nextPage forward collects all upcoming ones.
// The chapters' internal monthly "Chapter Leadership Zoom" calls are dropped —
// we list public EV events only (per the site owner's instruction).
const ECA_EXCLUDE = /chapter leadership|leadership zoom/i;
const httpUrl = (v: unknown): string | undefined =>
  typeof v === "string" && /^https?:\/\//.test(v) ? v : undefined;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function parseEventCalendarApp(json: any, sourceLabel: string): NormEvent[] {
  const list = Array.isArray(json?.events) ? json.events : [];
  const out: NormEvent[] = [];
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  for (const e of list as any[]) {
    const title = typeof e?.summary === "string" ? e.summary.trim() : "";
    const startSec = Number(e?.utcStartTime);
    if (!title || !Number.isFinite(startSec)) continue;
    if (ECA_EXCLUDE.test(title)) continue;                         // skip internal chapter calls
    const endSec = Number(e?.utcEndTime);
    const addr = typeof e?.location?.description === "string" ? e.location.description.trim() : "";
    const venue = typeof e?.venueName === "string" ? e.venueName.trim() : "";
    const location = e?.onlineEvent ? "Online" : ([venue, addr].filter(Boolean).join(", ") || undefined);
    const html = e?.longDescription || e?.description || e?.shortDescription || "";
    const description = typeof html === "string" ? (decodeEntities(html.replace(/<[^>]+>/g, " ")) || undefined) : undefined;
    out.push({
      title,
      startISO: new Date(startSec * 1000).toISOString(),
      endISO: Number.isFinite(endSec) ? new Date(endSec * 1000).toISOString() : undefined,
      location,
      description,
      url: httpUrl(e?.url) ?? httpUrl(e?.ticketsLink),
      image: httpUrl(e?.image) ?? httpUrl(e?.thumbnail),
      source: sourceLabel,
      sourceLabel,
    });
  }
  return out;
}

async function fetchEventCalendarApp(url: string, sourceLabel: string): Promise<NormEvent[]> {
  const raw: NormEvent[] = [];
  let next: string | undefined = url;
  for (let page = 0; page < 4 && next; page++) {                   // current + up to 3 forward pages
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 8000);
    try {
      const res = await fetch(next, { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": ENRICH_UA } });
      if (!res.ok) break;
      const json = await res.json();
      raw.push(...parseEventCalendarApp(json, sourceLabel));
      next = typeof json?.pages?.nextPage === "string" ? json.pages.nextPage : undefined;
    } catch {
      break;
    } finally {
      clearTimeout(timer);
    }
  }
  // Recurring meetups (e.g. a monthly "Cars & Coffee") arrive as one entry per
  // occurrence — collapse each same-titled series to its soonest UPCOMING date so
  // one recurring event can't flood the list with a dozen identical cards.
  const cutoff = Date.now() - 12 * 3600 * 1000;
  const soonestByTitle = new Map<string, NormEvent>();
  for (const e of raw) {
    if (Date.parse(e.startISO) < cutoff) continue;                 // drop past occurrences
    const prev = soonestByTitle.get(e.title);
    if (!prev || Date.parse(e.startISO) < Date.parse(prev.startISO)) soonestByTitle.set(e.title, e);
  }
  return Array.from(soonestByTitle.values());
}

// Built-in EventCalendarApp sources beyond the ICS/RSS feeds in EVENT_FEEDS.
const ECA_SOURCES: { url: string; label: string }[] = [
  // Electric Vehicle Association — public EV showcases & ride-and-drives nationwide.
  { url: "https://api.eventcalendarapp.com/events?id=13662&widgetUuid=6cab85cd-92a5-486c-b6d6-af38fa5d9b25", label: "myeva.org" },
];

// Curated one-off events from sources that publish no machine-readable feed.
// Each auto-drops from the site once its date passes (upcoming filter below).
const STATIC_EVENTS: NormEvent[] = [
  {
    title: "Discover Electric Vehicles in Falmouth",
    startISO: "2026-07-25T14:00:00Z", // 10:00 AM EDT
    location: "Mullen Hall, Falmouth, MA",
    description: "Learn about electric cars this summer at Mullen Hall with the Green Energy Consumers Alliance — meet local EV drivers and see the latest models up close.",
    url: "https://www.greenenergyconsumers.org/event/discoverelectricvehiclesfalmouth",
    source: "greenenergyconsumers.org",
  },
];

function hostOf(url: string): string {
  try { return new URL(url).hostname.replace(/^www\./, ""); } catch { return "feed"; }
}

async function fetchFeed(url: string): Promise<NormEvent[]> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { "User-Agent": "ElectrifyingTheUS/1.0" } });
    if (!res.ok) return [];
    const body = await res.text();
    const source = hostOf(url);
    const looksIcs = /BEGIN:VCALENDAR/i.test(body) || url.toLowerCase().includes(".ics");
    return looksIcs ? parseIcs(body, source) : parseRss(body, source);
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  const feeds = (process.env.EVENT_FEEDS ?? "")
    .split(/[\n,]/).map((s) => s.trim()).filter(Boolean);

  try {
    // ICS/RSS feeds (env) + EventCalendarApp JSON sources + curated one-offs.
    const [feedResults, ecaResults] = await Promise.all([
      Promise.all(feeds.map(fetchFeed)),
      Promise.all(ECA_SOURCES.map((s) => fetchEventCalendarApp(s.url, s.label))),
    ]);
    const now = Date.now();
    const seen = new Set<string>();
    const events = [...feedResults.flat(), ...ecaResults.flat(), ...STATIC_EVENTS]
      .filter((e) => Date.parse(e.startISO) >= now - 12 * 3600 * 1000) // upcoming (allow today)
      .filter((e) => { const k = `${e.title}|${e.startISO}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => Date.parse(a.startISO) - Date.parse(b.startISO))
      .slice(0, 80);

    // Enrich with the real event title + featured image from each event's page
    // (parallel, best-effort). Skip EventCalendarApp events — their JSON already
    // carries a clean title, description, and per-event image. Cached below, so
    // this only runs on a cache miss.
    await Promise.all(events.map((e) => (e.sourceLabel ? Promise.resolve() : enrich(e))));

    // Show each event's real public source. An explicit sourceLabel wins (e.g.
    // myeva.org); otherwise derive it from the event page host (e.g.
    // driveelectricmonth.org) — never the internal feed/proxy host.
    for (const e of events) {
      if (e.sourceLabel) { e.source = e.sourceLabel; continue; }
      if (e.url) { try { e.source = hostOf(e.url); } catch { /* keep */ } }
    }

    // Post-enrich dedup: enrichment can converge two sources onto the same real
    // title (e.g. an EVA event that is also a Drive Electric Month event) — which
    // the pre-enrich pass couldn't see. Collapse same-title, same-DAY events, but
    // keep the generic "National Drive Electric Month/Week" placeholders, which
    // the Events page disambiguates by city.
    const generic = /^national drive electric (month|week)\b/i;
    const seenReal = new Set<string>();
    const deduped = events.filter((e) => {
      if (generic.test(e.title)) return true;
      const k = `${e.title.trim().toLowerCase()}|${e.startISO.slice(0, 10)}`;
      if (seenReal.has(k)) return false;
      seenReal.add(k);
      return true;
    });

    // Cache hard at the CDN — calendars change slowly. 1h fresh, serve-stale 6h.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=21600");
    res.status(200).json({ events: deduped });
  } catch (err) {
    console.error("events feed error", err);
    res.status(502).json({ error: "Couldn't load the events feed.", events: [] });
  }
}
