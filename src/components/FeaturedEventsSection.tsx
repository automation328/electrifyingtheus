import { Link } from "react-router-dom";
import { MapPin, Clock, ArrowRight, CalendarDays, Star, Newspaper } from "lucide-react";
import { useEvents, usePosts } from "@/hooks/use-content";
import ShareGate from "@/components/forms/ShareGate";

// Green share trigger overlaid on each card image.
const GREEN_SHARE =
  "inline-grid place-items-center w-9 h-9 rounded-full gradient-green text-primary-foreground shadow-sm hover:opacity-90 transition-opacity";

const FeaturedEventsSection = () => {
  const { events } = useEvents();
  const { posts } = usePosts();

  // Promote a few featured events + featured news on the home page.
  const featuredEvents = events.filter((e) => e.featured);
  const eventCards = (featuredEvents.length ? featuredEvents : events).slice(0, 3);
  const featuredPosts = posts.filter((p) => p.featured);
  const newsCards = (featuredPosts.length ? featuredPosts : posts).slice(0, 3);

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

        {/* Featured Events */}
        <div className="flex items-center gap-2 mb-5">
          <CalendarDays className="w-5 h-5 text-secondary" />
          <h3 className="text-xl md:text-2xl font-bold font-display text-foreground">Featured Events</h3>
        </div>
        <div className="grid md:grid-cols-3 gap-6">
          {eventCards.map((e, i) => {
            // Blue↔green hero gradient bodies, alternating direction (matches the reference cards).
            const body = i % 2 === 0 ? "gradient-hero" : "gradient-hero-rev";
            return (
              <Link
                to={e.slug ? `/events/${e.slug}` : "/events"}
                key={e.title}
                className="group flex flex-col rounded-3xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up"
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {/* Poster image with date badge + featured flag overlaid */}
                <div className="relative aspect-[4/3] overflow-hidden">
                  <img
                    src={e.image}
                    alt={e.title}
                    loading="lazy"
                    className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
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
                      formType="event-share"
                      className={GREEN_SHARE}
                    />
                  </div>
                </div>

                {/* Colored body */}
                <div className={`${body} text-primary-foreground p-5 flex flex-col flex-1`}>
                  <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold mb-2.5">{e.type}</span>
                  <h3 className="text-lg font-bold font-display leading-snug mb-3">{e.title}</h3>
                  <div className="flex flex-col gap-1.5 text-sm text-primary-foreground/90 mb-4">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {e.location}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {e.time}</span>
                  </div>
                  <span className="mt-auto inline-flex items-center justify-center gap-1.5 rounded-xl bg-white text-foreground text-sm font-bold py-2.5 transition-colors group-hover:bg-white/90">
                    Register <ArrowRight className="w-4 h-4" />
                  </span>
                </div>
              </Link>
            );
          })}
        </div>

        {/* Featured News */}
        {newsCards.length > 0 && (
          <>
            <div className="flex items-center justify-between mt-14 mb-5">
              <div className="flex items-center gap-2">
                <Newspaper className="w-5 h-5 text-primary" />
                <h3 className="text-xl md:text-2xl font-bold font-display text-foreground">Featured News</h3>
              </div>
              <Link to="/news" className="inline-flex items-center gap-2 shrink-0 text-primary font-semibold hover:gap-3 transition-all">
                View all news <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid md:grid-cols-3 gap-6">
              {newsCards.map((p, i) => (
                <Link
                  to={`/blog/${p.slug}`}
                  key={p.slug}
                  className="group flex flex-col rounded-3xl overflow-hidden bg-card border border-border shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up"
                  style={{ animationDelay: `${i * 0.08}s` }}
                >
                  <div className="relative h-48 overflow-hidden bg-muted shrink-0">
                    <img
                      src={p.image}
                      alt={p.title}
                      loading="lazy"
                      className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {p.featured && (
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-foreground text-[11px] font-bold shadow">
                        <Star className="w-3 h-3 text-secondary" fill="currentColor" /> Featured
                      </span>
                    )}
                    <div className="absolute bottom-3 right-3">
                      <ShareGate
                        url={`/blog/${p.slug}`}
                        title={p.title}
                        summary={p.category}
                        formType="article-share"
                        className={GREEN_SHARE}
                      />
                    </div>
                  </div>
                  <div className="p-6 flex flex-col flex-1">
                    <div className="flex items-center gap-3 mb-3">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{p.category}</span>
                      <span className="text-xs text-muted-foreground">{p.date}</span>
                    </div>
                    <h3 className="text-lg font-bold font-display text-foreground mb-2 leading-snug group-hover:text-primary transition-colors">{p.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-3 flex-1">{p.excerpt}</p>
                    <span className="inline-flex items-center gap-1.5 mt-4 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                      Read article <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </>
        )}
      </div>
    </section>
  );
};

export default FeaturedEventsSection;
