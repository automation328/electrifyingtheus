import { Link } from "react-router-dom";
import { MapPin, Clock, ArrowRight, CalendarDays, Star, Newspaper } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { useEvents, usePosts } from "@/hooks/use-content";
import { formatNewsDate, newsQuery } from "@/lib/news-feed";
import { eventDate, eventFullDate } from "@/data/events";
import { EVENT_THIRD_PARTY_NOTICE } from "@/lib/disclaimers";
import ShareGate from "@/components/forms/ShareGate";

// Green share trigger overlaid on each card image.
const GREEN_SHARE =
  "inline-grid place-items-center w-9 h-9 rounded-full gradient-green text-primary-foreground shadow-sm hover:opacity-90 transition-opacity";

// One height for every event card and the lead news card, so the two columns
// read as a matched set whatever a title or flyer looks like.
const CARD_H = "lg:h-[30rem]";

const FeaturedEventsSection = () => {
  const { events } = useEvents();
  const { posts } = usePosts();

  // Promote a few featured events + featured news on the home page.
  // Featured events first, then the next upcoming ones: one lead card plus a
  // compact list, mirroring the news column beside it.
  const byDate = [...events].sort((a, b) => eventDate(a).getTime() - eventDate(b).getTime());
  const leadEvent = byDate.find((e) => e.featured) ?? byDate[0];
  const eventCards = leadEvent ? [leadEvent, ...byDate.filter((e) => e !== leadEvent)].slice(0, 7) : [];
  // Newest first: the lead story, then a compact list that fills the column
  // beside the event cards. An undated post sorts last.
  const time = (d: string) => { const t = Date.parse(d); return Number.isNaN(t) ? 0 : t; };
  const newsCards = [...posts].sort((a, b) => time(b.date) - time(a.date)).slice(0, 3);
  // Below our own three posts: the latest stories from the live RSS feed, each
  // opening its on-site summary page. Shares the /news page's cached query.
  const { data: feed } = useQuery(newsQuery);
  const rssItems = (feed ?? []).slice(0, 4);

  return (
    <section id="events" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              <CalendarDays className="w-3.5 h-3.5" /> Events &amp; News
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground">
              Featured <span className="text-gradient-primary">Events &amp; News</span>
            </h2>
            <p className="text-muted-foreground text-lg mt-2 max-w-2xl">
              Ride &amp; drives, webinars, and expos — plus the latest guides and insights on going electric.
            </p>
          </div>
          <Link to="/events" className="inline-flex items-center gap-2 shrink-0 text-primary font-semibold hover:gap-3 transition-all">
            View all events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        {/* Featured Events (left) + Featured News (right), side by side */}
        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
        <div>
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="w-5 h-5 text-secondary" />
          <h3 className="text-xl md:text-2xl font-bold font-display text-foreground">Featured Events</h3>
        </div>
        <div className="space-y-6">
          {eventCards.slice(0, 1).map((e, i) => {
            // Blue↔green hero gradient bodies, alternating direction (matches the reference cards).
            const body = i % 2 === 0 ? "gradient-hero" : "gradient-hero-rev";
            return (
              <Link
                to={e.slug ? `/events/${e.slug}` : "/events"}
                key={e.title}
                className={`group flex flex-col ${CARD_H} rounded-3xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Poster image with date badge + featured flag overlaid */}
                <div className="relative h-56 overflow-hidden bg-foreground shrink-0">
                  {/* Flyers carry their own text, so show the whole image
                      (contain) over a blurred, cropped copy of itself. */}
                  <img src={e.image} alt="" aria-hidden loading="lazy" className="absolute inset-0 w-full h-full object-cover blur-xl scale-110 opacity-70" />
                  <img
                    src={e.image}
                    alt={e.title}
                    loading="lazy"
                    className="relative w-full h-full object-contain transition-transform duration-500 group-hover:scale-105"
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-foreground/30 to-transparent" aria-hidden />
                  <div className="absolute top-3 left-3 w-16 rounded-2xl bg-white text-center shadow-lg overflow-hidden">
                    <div className="bg-secondary text-primary-foreground text-[10px] font-bold tracking-wider py-1">{e.month}</div>
                    <div className="text-foreground text-2xl font-bold font-display leading-none py-1.5">{e.day}</div>
                  </div>
                  {e.featured && (
                    <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-foreground text-[11px] font-bold shadow">
                      <Star className="w-3 h-3 text-secondary" fill="currentColor" /> Featured
                    </span>
                  )}
                  <div className="absolute bottom-3 right-3">
                    <ShareGate
                      url={e.slug ? `/events/${e.slug}` : "/events"}
                      title={e.title}
                      summary={`${e.location} · ${e.month} ${e.day}, ${e.year}`}
                      description={e.description}
                      image={e.image}
                      meta={`${e.type} · ${e.location} · ${e.month} ${e.day}, ${e.year} · ${e.time}`}
                      eventDateTime={`${eventFullDate(e)} · ${e.time}`}
                      disclaimer={EVENT_THIRD_PARTY_NOTICE}
                      formType="event-share"
                      className={GREEN_SHARE}
                    />
                  </div>
                </div>

                {/* Colored body */}
                <div className={`${body} text-primary-foreground px-5 py-4 flex flex-col flex-1`}>
                  <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold mb-2">{e.type}</span>
                  <h3 className="text-lg font-bold font-display leading-snug mb-2 line-clamp-2">{e.title}</h3>
                  <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-primary-foreground/90 mb-3">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {e.location}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {e.time}</span>
                  </div>
                  {e.description && <p className="text-sm text-primary-foreground/80 line-clamp-2 mb-3">{e.description}</p>}
                  <span className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-white text-foreground text-sm font-bold py-2 transition-colors group-hover:bg-white/90">
                    More info <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}

          {/* More events — compact rows (flyer thumbnail + date + title) */}
          {eventCards.length > 1 && (
            <ul className="rounded-3xl bg-card border border-border shadow-card divide-y divide-border overflow-hidden">
              {eventCards.slice(1).map((e) => (
                <li key={`${e.title}-${e.year}-${e.month}-${e.day}`}>
                  <Link to={e.slug ? `/events/${e.slug}` : "/events"} className="group flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors">
                    <img
                      src={e.image}
                      alt=""
                      loading="lazy"
                      className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl object-cover shrink-0 bg-muted"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <span className="text-[11px] font-semibold text-secondary">{e.type}</span>
                        <span className="text-[11px] text-muted-foreground">{eventFullDate(e)}</span>
                      </div>
                      <h4 className="text-sm md:text-[15px] font-bold font-display text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{e.title}</h4>
                      <span className="flex items-center gap-1 text-[11px] text-muted-foreground mt-1 truncate"><MapPin className="w-3 h-3 shrink-0" /> {e.location}</span>
                    </div>
                    <ArrowRight className="w-4 h-4 text-primary shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </div>
        </div>

        {/* Featured News (right column) */}
        {newsCards.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-5">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary" />
                <h3 className="text-xl md:text-2xl font-bold font-display text-foreground">Featured News</h3>
              </div>
              <Link to="/news" className="inline-flex items-center gap-2 shrink-0 text-primary font-semibold hover:gap-3 transition-all">
                View all news <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="space-y-6">
              {/* Lead story — large card */}
              {newsCards[0] && (
                <Link
                  to={`/blog/${newsCards[0].slug}`}
                  className={`group flex flex-col ${CARD_H} rounded-3xl overflow-hidden bg-card border border-border shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up`}
                >
                  <div className="relative h-56 overflow-hidden bg-muted shrink-0">
                    <img
                      src={newsCards[0].image}
                      alt={newsCards[0].title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {newsCards[0].featured && (
                      <span className="absolute top-3 left-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-foreground text-[11px] font-bold shadow">
                        <Star className="w-3 h-3 text-secondary" fill="currentColor" /> Featured
                      </span>
                    )}
                    <div className="absolute bottom-3 right-3">
                      <ShareGate
                        url={`/blog/${newsCards[0].slug}`}
                        title={newsCards[0].title}
                        summary={newsCards[0].category}
                        description={newsCards[0].excerpt}
                        image={newsCards[0].image}
                        meta={`${newsCards[0].category} · ${newsCards[0].date}`}
                        formType="article-share"
                        className={GREEN_SHARE}
                      />
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{newsCards[0].category}</span>
                      <span className="text-xs text-muted-foreground">{newsCards[0].date}</span>
                    </div>
                    <h3 className="text-xl font-bold font-display text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">{newsCards[0].title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{newsCards[0].excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                      Read article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              )}

              {/* More stories — compact rows (thumbnail + headline) */}
              {newsCards.length > 1 && (
                <ul className="rounded-3xl bg-card border border-border shadow-card divide-y divide-border overflow-hidden">
                  {newsCards.slice(1).map((p) => (
                    <li key={p.slug}>
                      <Link to={`/blog/${p.slug}`} className="group flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors">
                        <img
                          src={p.image}
                          alt=""
                          loading="lazy"
                          className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl object-cover shrink-0 bg-muted"
                        />
                        <div className="min-w-0 flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-[11px] font-semibold text-primary">{p.category}</span>
                            <span className="text-[11px] text-muted-foreground">{p.date}</span>
                          </div>
                          <h4 className="text-sm md:text-[15px] font-bold font-display text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{p.title}</h4>
                        </div>
                        <ArrowRight className="w-4 h-4 text-primary shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                      </Link>
                    </li>
                  ))}
                </ul>
              )}

              {/* Latest from the live RSS feed */}
              {rssItems.length > 0 && (
                <div>
                  <h4 className="text-sm font-bold uppercase tracking-wider text-muted-foreground mb-3">Latest EV news</h4>
                  <ul className="rounded-3xl bg-card border border-border shadow-card divide-y divide-border overflow-hidden">
                    {rssItems.map((n) => (
                      <li key={n.slug}>
                        <Link to={`/news/${n.slug}`} className="group flex items-center gap-4 p-4 hover:bg-primary/5 transition-colors">
                          {n.image ? (
                            <img src={n.image} alt="" loading="lazy" className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl object-cover shrink-0 bg-muted" />
                          ) : (
                            <span className="w-24 h-16 sm:w-28 sm:h-20 rounded-xl shrink-0 gradient-primary grid place-items-center" aria-hidden>
                              <Newspaper className="w-6 h-6 text-primary-foreground/60" />
                            </span>
                          )}
                          <div className="min-w-0 flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="text-[11px] font-semibold text-secondary">{n.source}</span>
                              <span className="text-[11px] text-muted-foreground">{formatNewsDate(n.pubDate)}</span>
                            </div>
                            <h4 className="text-sm md:text-[15px] font-bold font-display text-foreground leading-snug line-clamp-2 group-hover:text-primary transition-colors">{n.title}</h4>
                          </div>
                          <ArrowRight className="w-4 h-4 text-primary shrink-0 opacity-0 -translate-x-1 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </Link>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEventsSection;
