// Runs the real middleware on /sitemap.xml with fake CMS rows, to check that
// the event URLs it lists are the ones the app actually serves.
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { readFileSync } from "node:fs";
import middleware from "../../middleware";
import { OG_EVENTS } from "../../og-events";

const bySlug = (slug: string) => OG_EVENTS.find((e) => e.slug === slug)!;

async function sitemapWith(events: object[]): Promise<string[]> {
  vi.stubGlobal("fetch", vi.fn(async (url: string) => {
    const rows = String(url).includes("site_events") ? events : [];
    return new Response(JSON.stringify(rows), { status: 200 });
  }));
  const res = await middleware(new Request("https://electrifyingtheus.com/sitemap.xml"));
  const xml = await (res as Response).text();
  return [...xml.matchAll(/<loc>https:\/\/electrifyingtheus\.com([^<]*)<\/loc>/g)].map((m) => m[1]);
}

describe("what crawlers get", () => {
  afterEach(() => vi.unstubAllGlobals());

  it("serves Bing the real app with the page's own head", async () => {
    const shell = readFileSync("index.html", "utf8");
    vi.stubGlobal("fetch", vi.fn(async (url: string) =>
      String(url).endsWith("/index.html") ? new Response(shell) : new Response("[]")));
    const res = await middleware(new Request("https://electrifyingtheus.com/range-map", {
      headers: { "user-agent": "Mozilla/5.0 (compatible; bingbot/2.0)" },
    }));
    const html = await (res as Response).text();
    expect(html).toContain('<div id="root"></div>');
    expect(html).toMatch(/<title>EV Range Map/);
    expect(html.match(/<title>/g)).toHaveLength(1);
    expect(html).toContain('<meta property="og:type" content="website">');
  });

  it("falls back to the stand-in page when the shell can't be fetched", async () => {
    vi.stubGlobal("fetch", vi.fn(async () => { throw new Error("offline"); }));
    const res = await middleware(new Request("https://electrifyingtheus.com/range-map", {
      headers: { "user-agent": "bingbot/2.0" },
    }));
    expect(await (res as Response).text()).toMatch(/<h1>EV Range Map/);
  });
});

describe("sitemap event URLs", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-11-27T12:00:00Z"));
    vi.stubEnv("VITE_SUPABASE_URL", "https://db.example");
    vi.stubEnv("VITE_SUPABASE_ANON_KEY", "anon");
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.unstubAllEnvs();
    vi.unstubAllGlobals();
  });

  it("drops built-in events that have ended", async () => {
    const paths = await sitemapWith([]);
    expect(bySlug("demo-days-los-angeles").end < "2026-11-27").toBe(true);
    expect(paths).not.toContain("/events/demo-days-los-angeles");
    expect(paths).toContain("/events/act-expo-2027");
  });

  it("lists a CMS row that took over a built-in event under the built-in URL only", async () => {
    const act = bySlug("act-expo-2027");
    const paths = await sitemapWith([{ title: act.title, event_date: act.date, end_date: null, hidden: false }]);
    // The URL the row would get on its own ends in its date, e.g. "-may-17-2027".
    const [y, m, d] = act.date.split("-");
    const ownSuffix = `-${["jan", "feb", "mar", "apr", "may", "jun", "jul", "aug", "sep", "oct", "nov", "dec"][Number(m) - 1]}-${d}-${y}`;
    expect(paths).toContain("/events/act-expo-2027");
    expect(paths.filter((p) => p.endsWith(ownSuffix))).toEqual([]);
  });

  it("lists new upcoming CMS events and skips past ones and removal markers", async () => {
    const nordic = bySlug("nordic-ev-summit-2027");
    const paths = await sitemapWith([
      { title: "New Meetup", event_date: "2027-01-10", end_date: null, hidden: false },
      { title: "Old Meetup", event_date: "2026-01-10", end_date: null, hidden: false },
      { title: nordic.title, event_date: nordic.date, end_date: null, hidden: true },
    ]);
    expect(paths).toContain("/events/new-meetup-jan-10-2027");
    expect(paths.some((p) => p.startsWith("/events/old-meetup"))).toBe(false);
    expect(paths).not.toContain("/events/nordic-ev-summit-2027");
  });
});
