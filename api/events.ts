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

  if (feeds.length === 0) {
    // No feeds configured — return empty so the page just shows ETU's own events.
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.status(200).json({ events: [] });
    return;
  }

  try {
    const results = await Promise.all(feeds.map(fetchFeed));
    const now = Date.now();
    const seen = new Set<string>();
    const events = results
      .flat()
      .filter((e) => Date.parse(e.startISO) >= now - 12 * 3600 * 1000) // upcoming (allow today)
      .filter((e) => { const k = `${e.title}|${e.startISO}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .sort((a, b) => Date.parse(a.startISO) - Date.parse(b.startISO))
      .slice(0, 60);

    // Cache hard at the CDN — calendars change slowly. 1h fresh, serve-stale 6h.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=21600");
    res.status(200).json({ events });
  } catch (err) {
    console.error("events feed error", err);
    res.status(502).json({ error: "Couldn't load the events feed.", events: [] });
  }
}
