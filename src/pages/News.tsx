import { useQuery } from "@tanstack/react-query";
import { ArrowRight, Calendar, Newspaper, Rss, AlertCircle, Loader2, BookOpen } from "lucide-react";
import { Link } from "react-router-dom";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareGate from "@/components/forms/ShareGate";
import { usePosts } from "@/hooks/use-content";
import { FEEDS, formatNewsDate as formatDate, newsQuery } from "@/lib/news-feed";

const SourceBadge = ({ source }: { source: string }) => (
  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">
    {source}
  </span>
);

// Green share trigger used on every News card.
const GREEN_SHARE =
  "inline-grid place-items-center w-9 h-9 rounded-full gradient-green text-primary-foreground shadow-sm hover:opacity-90 transition-opacity";

const News = () => {
  const { data, isLoading, isError } = useQuery(newsQuery);

  const items = data ?? [];
  const featured = items[0];
  const rest = items.slice(1);

  const { posts } = usePosts();

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-6xl">
          {/* The page's two sections (our blog, then the live feed) each have a
              visible H2; this is the page heading they sit under. */}
          <h1 className="sr-only">E-Mobility News &amp; Guides</h1>
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
                  <div className="relative h-48 overflow-hidden bg-muted shrink-0">
                    <img src={post.image} alt={post.title} loading="lazy"
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                    <div className="absolute top-3 right-3">
                      <ShareGate
                        url={`/blog/${post.slug}`}
                        title={post.title}
                        summary={post.category}
                        description={post.excerpt}
                        image={post.image}
                        meta={`${post.category} · ${post.date}`}
                        formType="article-share"
                        className={GREEN_SHARE}
                      />
                    </div>
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
            <h2 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
              E-Mobility <span className="text-gradient-primary">News</span>
            </h2>
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
              <Link
                to={`/news/${featured.slug}`}
                className="group grid lg:grid-cols-2 gap-8 items-center rounded-3xl border border-border bg-card overflow-hidden shadow-xl mb-14 hover:shadow-2xl transition-shadow animate-fade-up"
                style={{ animationDelay: "0.1s" }}
              >
                <div className="relative h-64 lg:h-full min-h-[280px] overflow-hidden bg-muted">
                  {featured.image ? (
                    <img src={featured.image} alt={featured.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                  ) : (
                    <div className="w-full h-full gradient-primary flex items-center justify-center">
                      <Newspaper className="w-16 h-16 text-primary-foreground/40" />
                    </div>
                  )}
                  <div className="absolute top-3 right-3">
                    <ShareGate url={`/news/${featured.slug}`} title={featured.title} summary={featured.source} description={featured.excerpt} image={featured.image ?? undefined} meta={`${featured.source} · ${formatDate(featured.pubDate)}`} formType="article-share" className={GREEN_SHARE} />
                  </div>
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
                    Read the summary <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>

              {/* Grid */}
              <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
                {rest.map((p, i) => (
                  <Link
                    key={p.slug}
                    to={`/news/${p.slug}`}
                    className="group rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up flex flex-col"
                    style={{ animationDelay: `${0.15 + (i % 6) * 0.07}s` }}
                  >
                    <div className="relative h-48 overflow-hidden bg-muted shrink-0">
                      {p.image ? (
                        <img src={p.image} alt={p.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" loading="lazy" />
                      ) : (
                        <div className="w-full h-full gradient-primary flex items-center justify-center">
                          <Newspaper className="w-10 h-10 text-primary-foreground/40" />
                        </div>
                      )}
                      <div className="absolute top-3 right-3">
                        <ShareGate url={`/news/${p.slug}`} title={p.title} summary={p.source} description={p.excerpt} image={p.image ?? undefined} meta={`${p.source} · ${formatDate(p.pubDate)}`} formType="article-share" className={GREEN_SHARE} />
                      </div>
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
                  </Link>
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
