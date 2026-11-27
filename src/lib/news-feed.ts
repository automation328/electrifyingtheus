// E-mobility news, aggregated client-side from third-party RSS feeds through the
// rss2json proxy (CORS-enabled, no key required for low volume). Shared by the
// /news list and the /news/:slug summary page, which read the same cached query.
import { slugify } from "@/data/events";

export const FEEDS = [
  { source: "Electrek", url: "https://electrek.co/feed/" },
  { source: "InsideEVs", url: "https://insideevs.com/rss/articles/all/" },
  { source: "Electrive", url: "https://www.electrive.com/feed/" },
];

export interface NewsItem {
  title: string;
  /** The publisher's article URL (always http/https). */
  link: string;
  pubDate: string;
  source: string;
  /** Short plain-text excerpt from the feed. Never the full article: the text
   *  belongs to the publisher, so our page summarises and links out. */
  excerpt: string;
  image: string | null;
  /** Our own page for this item: /news/<slug>. */
  slug: string;
}

// rss2json fetches + parses each feed server-side and returns CORS-enabled JSON.
// NOTE: the `count` param is a paid feature — sending it makes the free tier
// reject the request with HTTP 422, so we omit it and take what the feed returns.
const RSS2JSON = "https://api.rss2json.com/v1/api.json?rss_url=";

interface Rss2JsonItem {
  title?: string;
  link?: string;
  pubDate?: string;
  description?: string;
  content?: string;
  thumbnail?: string;
  enclosure?: { link?: string };
}

// Strip HTML tags + collapse whitespace into a short plain-text excerpt.
const toExcerpt = (html: string, max = 280) => {
  const t = html.replace(/<[^>]*>/g, " ").replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
};

// Pull the first <img> src out of an HTML blob as a thumbnail fallback.
const imageFromHtml = (html: string): string | null => {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
};

export const formatNewsDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

/** Stable page slug for a news item: the source plus its headline, so the same
 *  headline from two publishers still gets two pages. */
export const newsSlug = (source: string, title: string): string =>
  slugify(`${source} ${title}`) || "story";

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<NewsItem[]> {
  const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`);
  if (!res.ok) throw new Error(`${feed.source} ${res.status}`);
  const json = await res.json();
  if (json?.status !== "ok" || !Array.isArray(json.items)) return [];
  return (json.items as Rss2JsonItem[]).map((it) => {
    const body = it.content || it.description || "";
    const title = it.title ?? "Untitled";
    return {
      title,
      // Third-party feed: only http(s) links survive; anything else is dropped below.
      link: /^https?:\/\//i.test(it.link ?? "") ? it.link! : "#",
      pubDate: it.pubDate ?? "",
      source: feed.source,
      excerpt: toExcerpt(it.description || it.content || ""),
      image: it.thumbnail || it.enclosure?.link || imageFromHtml(body),
      slug: newsSlug(feed.source, title),
    };
  });
}

export async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (items.length === 0) throw new Error("No feeds available");
  const seen = new Set<string>();
  return items
    .filter((i) => i.title && i.link !== "#")
    .filter((i) => (seen.has(i.slug) ? false : (seen.add(i.slug), true)))
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

/** One react-query setup for both pages, so opening a story from the list
 *  reuses the list's fetch instead of calling the feeds again. */
export const newsQuery = {
  queryKey: ["emobility-news"],
  queryFn: fetchAllNews,
  staleTime: 30 * 60 * 1000, // 30 min
  retry: 1,
} as const;
