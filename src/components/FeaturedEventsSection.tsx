import { Link } from "react-router-dom";
import { MapPin, Clock, ArrowRight, CalendarDays, Star } from "lucide-react";
import { EVENTS } from "@/data/events";

// Promote a few events on the home page; deep-links to the full Events page.
const highlights = (EVENTS.filter((e) => e.featured).length ? EVENTS.filter((e) => e.featured) : EVENTS).slice(0, 3);

const FeaturedEventsSection = () => {
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
          {highlights.map((e, i) => (
            <Link
              to="/events"
              key={e.title}
              className="group relative rounded-3xl border border-border bg-card overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="relative gradient-primary text-primary-foreground p-6">
                {e.featured && (
                  <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary-foreground/15 text-[11px] font-bold">
                    <Star className="w-3 h-3" fill="currentColor" /> Featured
                  </span>
                )}
                <div className="flex items-center gap-3">
                  <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 backdrop-blur flex flex-col items-center justify-center">
                    <span className="text-[10px] font-semibold tracking-wider opacity-90">{e.month}</span>
                    <span className="text-2xl font-bold font-display leading-none">{e.day}</span>
                  </div>
                  <span className="inline-block px-3 py-1 rounded-full bg-primary-foreground/15 text-xs font-semibold">{e.type}</span>
                </div>
              </div>
              <div className="p-6">
                <h3 className="text-lg font-bold font-display text-foreground mb-3 leading-snug group-hover:text-primary transition-colors">{e.title}</h3>
                <div className="flex flex-col gap-1.5 text-sm text-muted-foreground mb-4">
                  <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {e.location}</span>
                  <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {e.time}</span>
                </div>
                <span className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary group-hover:gap-2.5 transition-all">
                  Details &amp; register <ArrowRight className="w-4 h-4" />
                </span>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
};

export default FeaturedEventsSection;
