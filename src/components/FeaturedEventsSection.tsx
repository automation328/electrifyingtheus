import { Link } from "react-router-dom";
import { MapPin, Clock, ArrowRight, CalendarDays, Star } from "lucide-react";
import { useEvents } from "@/hooks/use-content";

const FeaturedEventsSection = () => {
  const { events } = useEvents();
  // Promote a few events on the home page; deep-links to the full Events page.
  const featuredEvents = events.filter((e) => e.featured);
  const highlights = (featuredEvents.length ? featuredEvents : events).slice(0, 3);

  return (
    <section id="events" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-10">
          <div>
            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              <CalendarDays className="w-3.5 h-3.5" /> Events
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground">
              Featured <span className="text-gradient-primary">Events</span>
            </h2>
            <p className="text-muted-foreground text-lg mt-2 max-w-2xl">
              Ride &amp; drives, webinars, expos, and more — experience e-mobility in person and online.
            </p>
          </div>
          <Link to="/events" className="inline-flex items-center gap-2 shrink-0 text-primary font-semibold hover:gap-3 transition-all">
            View all events <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {highlights.map((e, i) => {
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
      </div>
    </section>
  );
};

export default FeaturedEventsSection;
