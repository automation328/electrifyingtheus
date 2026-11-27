import { useQuery } from "@tanstack/react-query";
import { Link, useParams } from "react-router-dom";
import { ArrowLeft, ArrowRight, Calendar, ExternalLink, Loader2, Newspaper } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareGate from "@/components/forms/ShareGate";
import SeoHead from "@/components/SeoHead";
import NoIndex from "@/components/NoIndex";
import { formatNewsDate, newsQuery } from "@/lib/news-feed";

// Our own page for one story from the live news feed. It shows the headline,
// photo and the feed's short excerpt, then links to the publisher for the full
// article: the article text is theirs, so we summarise rather than copy it.
// noindex: the page holds another site's headline and blurb, which search
// engines treat as duplicate content, and it disappears once the story rolls
// out of the feed.
const NewsArticle = () => {
  const { slug = "" } = useParams();
  const { data, isLoading } = useQuery(newsQuery);
  const items = data ?? [];
  const item = items.find((i) => i.slug === slug);

  if (isLoading) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center text-muted-foreground">
          <NoIndex />
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </main>
        <Footer />
      </div>
    );
  }

  if (!item) {
    return (
      <div className="min-h-screen flex flex-col bg-background">
        <Navbar />
        <main className="flex-1 pt-28 pb-16 flex items-center justify-center">
          <div className="text-center px-4">
            <NoIndex />
            <h1 className="text-3xl font-bold font-display text-foreground mb-3">Story no longer in the feed</h1>
            <p className="text-muted-foreground mb-6">News stories rotate out as new ones arrive. See today's headlines instead.</p>
            <Link to="/news" className="inline-flex items-center gap-2 text-primary font-semibold">
              <ArrowLeft className="w-4 h-4" /> Back to the news
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const date = formatNewsDate(item.pubDate);
  const more = items.filter((i) => i.slug !== item.slug).slice(0, 3);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <SeoHead title={item.title} description={item.excerpt} image={item.image ?? undefined} />
      <NoIndex />
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <article className="container px-4 max-w-3xl">
          <Link to="/news" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to the news
          </Link>

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{item.source}</span>
            {date && (
              <span className="flex items-center gap-1.5 text-sm text-muted-foreground">
                <Calendar className="w-4 h-4" /> {date}
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-6 leading-tight">{item.title}</h1>

          <div className="rounded-3xl overflow-hidden bg-muted mb-8 aspect-[16/9]">
            {item.image ? (
              <img src={item.image} alt={item.title} className="w-full h-full object-cover" />
            ) : (
              <div className="w-full h-full gradient-primary flex items-center justify-center">
                <Newspaper className="w-16 h-16 text-primary-foreground/40" />
              </div>
            )}
          </div>

          {item.excerpt && <p className="text-lg text-foreground/90 leading-relaxed mb-8">{item.excerpt}</p>}

          <div className="flex flex-wrap items-center gap-3 mb-4">
            <a
              href={item.link}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground px-6 py-3 font-semibold shadow-card hover:opacity-90 transition-opacity"
            >
              Read the full story at {item.source} <ExternalLink className="w-4 h-4" />
            </a>
            <ShareGate
              url={`/news/${item.slug}`}
              title={item.title}
              summary={item.source}
              description={item.excerpt}
              image={item.image ?? undefined}
              meta={`${item.source}${date ? ` · ${date}` : ""}`}
              formType="article-share"
              variant="label"
              label="Share"
              className="inline-flex items-center gap-1.5 rounded-full gradient-green text-primary-foreground px-5 py-3 text-sm font-semibold shadow-card hover:opacity-90 transition-opacity"
            />
          </div>
          <p className="text-xs text-muted-foreground mb-12">
            Summary from {item.source}'s news feed. The full article and its text belong to {item.source}.
          </p>

          {/* Keep readers on the site: our own tools next to every story. */}
          <div className="rounded-3xl border !border-primary/25 bg-primary/5 p-6 mb-12">
            <h2 className="text-xl font-bold font-display text-foreground mb-2">Thinking about going electric?</h2>
            <p className="text-muted-foreground mb-4">See what an EV would save you, find chargers, and check the incentives where you live.</p>
            <div className="flex flex-wrap gap-x-6 gap-y-2 text-sm font-semibold">
              <Link to="/electricity-vs-gasoline" className="text-primary inline-flex items-center gap-1.5">EV vs gas savings <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/range-map" className="text-primary inline-flex items-center gap-1.5">Range map <ArrowRight className="w-4 h-4" /></Link>
              <Link to="/events" className="text-primary inline-flex items-center gap-1.5">EV events <ArrowRight className="w-4 h-4" /></Link>
            </div>
          </div>

          {more.length > 0 && (
            <section>
              <h2 className="text-2xl font-bold font-display text-foreground mb-6">More EV news</h2>
              <div className="grid md:grid-cols-3 gap-6">
                {more.map((m) => (
                  <Link key={m.slug} to={`/news/${m.slug}`} className="group rounded-2xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl transition-all flex flex-col">
                    <div className="h-32 bg-muted overflow-hidden">
                      {m.image && <img src={m.image} alt={m.title} loading="lazy" className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />}
                    </div>
                    <div className="p-4">
                      <span className="text-xs font-semibold text-primary">{m.source}</span>
                      <h3 className="text-sm font-bold text-foreground leading-snug mt-1 line-clamp-3 group-hover:text-primary transition-colors">{m.title}</h3>
                    </div>
                  </Link>
                ))}
              </div>
            </section>
          )}
        </article>
      </main>
      <Footer />
    </div>
  );
};

export default NewsArticle;
