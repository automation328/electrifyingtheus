import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Newspaper, Rss, AlertCircle, Loader2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { usePosts } from "@/hooks/use-content";

// E-mobility RSS sources, aggregated client-side through the rss2json proxy
// (CORS-enabled, no key required for low volume). Add/remove feeds here.
const FEEDS = [
  { source: "Electrek", url: "https://electrek.co/feed/" },
  { source: "InsideEVs", url: "https://insideevs.com/rss/articles/all/" },
  { source: "Electrive", url: "https://www.electrive.com/feed/" },
];

interface NewsItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  excerpt: string;
  image: string | null;
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
const toExcerpt = (html: string, max = 180) => {
  const t = html.replace(/<[^>]*>/g, " ").replace(/\s+/g, " ").trim();
  return t.length > max ? `${t.slice(0, max).trimEnd()}…` : t;
};

// Pull the first <img> src out of an HTML blob as a thumbnail fallback.
const imageFromHtml = (html: string): string | null => {
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  return m?.[1] ?? null;
};

const formatDate = (iso: string) => {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? ""
    : d.toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" });
};

async function fetchFeed(feed: (typeof FEEDS)[number]): Promise<NewsItem[]> {
  const res = await fetch(`${RSS2JSON}${encodeURIComponent(feed.url)}`);
  if (!res.ok) throw new Error(`${feed.source} ${res.status}`);
  const json = await res.json();
  if (json?.status !== "ok" || !Array.isArray(json.items)) return [];
  return (json.items as Rss2JsonItem[]).map((it) => {
    const body = it.content || it.description || "";
    return {
      title: it.title ?? "Untitled",
      link: it.link ?? "#",
      pubDate: it.pubDate ?? "",
      source: feed.source,
      excerpt: toExcerpt(it.description || it.content || ""),
      image: it.thumbnail || it.enclosure?.link || imageFromHtml(body),
    };
  });
}

async function fetchAllNews(): Promise<NewsItem[]> {
  const results = await Promise.allSettled(FEEDS.map(fetchFeed));
  const items = results.flatMap((r) => (r.status === "fulfilled" ? r.value : []));
  if (items.length === 0) throw new Error("No feeds available");
  return items
    .filter((i) => i.title && i.link !== "#")
    .sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());
}

const SourceBadge = ({ source }: { source: string }) => (
  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
    {source}
  </span>
);

const News = () => {
  const { data, isLoading, isError } = useQuery({
    queryKey: ["emobility-news"],
    queryFn: fetchAllNews,
    staleTime: 30 * 60 * 1000, // 30 min
    retry: 1,
  });

  const items = data ?? [];
  const featured = items[0];
  const rest = items.slice(1);

  const { posts } = usePosts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-6xl">
          {/* Blogs */}
          <section className="mb-16">
            <div className="mb-8">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-3">
                <BookOpen className="w-3.5 h-3.5" /> Blogs
              </span>
              <h2 className="text-3xl md:text-4xl font-bold font-display text-foreground">
                From the <span className="text-gradient-primary">Electrifying the US</span> team
              </h2>
              <p className="text-muted-foreground mt-1">Guides, explainers, and insights on going electric.</p>
            </div>

            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
              {posts.map((post, i) => (
                <Link
                  key={post.slug}
                  to={`/blog/${post.slug}`}
                  className="group rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all flex flex-col animate-fade-up"
                  style={{ animationDelay: `${(i % 6) * 0.07}s` }}
                >
                  <div className="h-48 overflow-hidden bg-muted shrink-0">
                    <img src={post.image} alt={post.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                        {post.category}
                      </span>
                      <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <Calendar className="w-3.5 h-3.5" /> {post.date}
                      </span>
                    </div>
                    <h3 className="text-lg font-bold font-display text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">
                      {post.title}
                    </h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{post.excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                      Read article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </section>

          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12 animate-fade-up">
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Rss className="w-3.5 h-3.5" /> Live RSS
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
              E-Mobility <span className="text-gradient-primary">News</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              The latest on electric vehicles, charging, and the clean-transport transition —
              aggregated live from {FEEDS.map((f) => f.source).join(", ")}.
            </p>
          </div>

          {/* Loading */}
          {isLoading && (
            <div className="flex flex-col items-center justify-center py-24 text-muted-foreground">
              <Loader2 className="w-8 h-8 animate-spin mb-3 text-primary" />
              Loading the latest e-mobility headlines…
            </div>
          )}

          {/* Error */}
          {isError && (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <AlertCircle className="w-8 h-8 mb-3 text-destructive" />
              <p className="text-foreground font-semibold mb-1">Couldn't load the news feed</p>
              <p className="text-muted-foreground text-sm max-w-sm">
                The RSS source may be temporarily unavailable. Please try again in a few minutes.
              </p>
            </div>
          )}

          {/* Content */}
          {!isLoading && !isError && featured && (
            <>
              {/* Featured */}
              <a
                href={featured.link}
                target="_blank"
                rel="noopener noreferrer"
                className="group grid lg:grid-cols-2 gap-8 items-center rounded-3xl border border-border bg-card overflow-hidden shadow-xl mb-14 hover:shadow-2xl transition-shadow animate-fade-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="h-64 lg:h-full min-h-[280px] overflow-hidden bg-muted">
                  {featured.image ? (
                    <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <Newspaper className="w-16 h-16 text-primary-foreground/40" />
                    </div>
                  )}
                </div>
                <div className="p-8">
                  <div className="flex items-center gap-3 mb-4">
                    <SourceBadge source={featured.source} />
                    <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                      <Calendar className="w-3.5 h-3.5" /> {formatDate(featured.pubDate)}
                    </span>
                  </div>
                  <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">
                    {featured.title}
                  </h2>
                  <p className="text-muted-foreground mb-5">{featured.excerpt}</p>
                  <span className="inline-flex items-center gap-2 text-primary font-semibold group-hover:gap-3 transition-all">
                    Read at {featured.source} <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </a>

              {/* Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map((p, i) => (
                  <a
                    key={p.link}
                    href={p.link}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up flex flex-col"
                    style={{ animationDelay: `${0.15 + (i % 6) * 0.07}s` }}
                  >
                    <div className="h-48 overflow-hidden bg-muted shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center">
                          <Newspaper className="w-10 h-10 text-primary-foreground/40" />
                        </div>
                      )}
                    </div>
                    <div className="p-6 flex flex-col flex-1">
                      <div className="flex items-center gap-3 mb-3">
                        <SourceBadge source={p.source} />
                        <span className="flex items-center gap-1.5 text-xs text-muted-foreground">
                          <Calendar className="w-3.5 h-3.5" /> {formatDate(p.pubDate)}
                        </span>
                      </div>
                      <h3 className="text-lg font-bold font-display text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                      <p className="text-sm text-muted-foreground line-clamp-3">{p.excerpt}</p>
                    </div>
                  </a>
                ))}
              </div>
            </>
          )}
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default News;
