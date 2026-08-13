import { Link, useParams } from "react-router-dom";
import {
  CalendarDays, Clock, MapPin, ArrowLeft, Ticket, CalendarPlus, Tag, Loader2, Megaphone,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import InlinePageEditor from "@/components/inline/InlinePageEditor";
import BlockSlot from "@/components/inline/blocks/BlockSlot";
import ShareGate from "@/components/forms/ShareGate";
import EventActionGate from "@/components/forms/EventActionGate";
import EventDisclaimer from "@/components/EventDisclaimer";
import { gcalLink, eventDate, eventDisplayTitle, eventLocationText, type EventItem } from "@/data/events";
import { useEvents } from "@/hooks/use-content";
import { useExternalEvents } from "@/hooks/use-external-events";

const weekday = (e: EventItem) => {
  try { return eventDate(e).toLocaleDateString("en-US", { weekday: "long" }); }
  catch { return ""; }
};

// Where blocks may be dropped on an event page, in page order.
const EVENT_SLOTS = ["event-top", "event-end"];

const Shell = ({ children }: { children: React.ReactNode }) => (
  <div className="min-h-screen flex flex-col bg-background">
    <Navbar />
    <main className="flex-1 pt-28 pb-16">{children}</main>
    <Footer />
  </div>
);

const EventDetail = () => {
  const { slug } = useParams<{ slug: string }>();
  const { events, loading } = useEvents();
  const { events: externalEvents, loading: extLoading } = useExternalEvents();
  // ETU/Supabase events first, then the aggregated US-wide feed (external).
  const event =
    events.find((e) => e.slug === slug) ?? externalEvents.find((e) => e.slug === slug);

  if (!event) {
    // Supabase + feed events resolve async — show a loader before "not found".
    if (loading || extLoading) {
      return (
        <Shell>
          <div className="flex items-center justify-center py-24 text-muted-foreground">
            <Loader2 className="w-6 h-6 animate-spin mr-2" /> Loading event…
          </div>
        </Shell>
      );
    }
    return (
      <Shell>
        <div className="container px-4 max-w-3xl text-center py-16">
          <h1 className="text-3xl font-bold font-display text-foreground mb-3">Event not found</h1>
          <p className="text-muted-foreground mb-6">That event doesn't exist or may have ended.</p>
          <Link to="/events" className="inline-flex items-center gap-2 text-primary font-semibold">
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Link>
        </div>
      </Shell>
    );
  }

  const hasReg = Boolean(event.registerUrl);
  const day = weekday(event);

  return (
    // Same builder the blog posts have. `event.slug` here is already resolved
    // by mergeEvents, so a curated event stores its blocks under the same path
    // its page actually lives at.
    <InlinePageEditor path={`/events/${event.slug}`} label={event.title} slots={EVENT_SLOTS}>
      {(blocks) => (
    <Shell>
      <div className="container px-4 max-w-5xl">
        <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4" /> Back to events
        </Link>
        <BlockSlot slot="event-top" blocks={blocks} />

        <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
          {/* Poster */}
          <div className="relative animate-fade-up">
            {/* Fixed 4:3 frame so every event's poster is the same size. The whole
                flyer shows (object-contain), with a soft blurred fill of itself
                behind so mismatched aspect ratios don't leave flat bars. */}
            <div className="relative aspect-[4/3] overflow-hidden rounded-3xl shadow-elevated ring-1 ring-border bg-muted">
              <img src={event.image} alt="" aria-hidden className="absolute inset-0 w-full h-full object-cover scale-110 blur-2xl opacity-50" />
              <img src={event.image} alt={event.title} className="relative w-full h-full object-contain" loading="lazy" />
            </div>
            <div className="absolute -top-4 -left-4 w-20 rounded-2xl bg-white text-center shadow-lg overflow-hidden">
              <div className="bg-secondary text-primary-foreground text-[11px] font-bold tracking-wider py-1">{event.month}</div>
              <div className="text-foreground text-3xl font-bold font-display leading-none py-2">{event.day}</div>
            </div>

            {/* CTAs — below the image. Each captures the visitor's first name + email. */}
            <div className="flex flex-wrap items-center gap-2.5 mt-6">
              <EventActionGate
                href={gcalLink(event)}
                formType="event-calendar"
                title={event.title}
                summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                label="Add to calendar"
                icon={<CalendarPlus className="w-5 h-5" />}
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition"
              />
              <ShareGate
                url={`/events/${event.slug}`}
                title={event.title}
                summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                description={event.description}
                image={event.image}
                meta={`${event.type} · ${event.location} · ${event.month} ${event.day}, ${event.year} · ${event.time}`}
                formType="event-share"
                variant="label"
                label="Share"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition"
              />
              {hasReg ? (
                <EventActionGate
                  href={event.registerUrl!}
                  formType="event-register"
                  title={event.title}
                  summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                  label="Register"
                  icon={<Ticket className="w-5 h-5" />}
                  className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl shadow-card hover:opacity-90 transition"
                />
              ) : (
                <Link to="/contact-us"
                  className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl shadow-card hover:opacity-90 transition">
                  <Ticket className="w-5 h-5" /> Register
                </Link>
              )}
              <Link to="/list-your-event"
                className="inline-flex items-center gap-2 bg-green-600 text-white font-semibold px-5 py-3 rounded-xl shadow-card hover:bg-green-700 transition">
                <Megaphone className="w-5 h-5" /> List Your Event
              </Link>
              <Link to="/events"
                className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition">
                <CalendarDays className="w-5 h-5" /> View more events
              </Link>
            </div>
          </div>

          {/* Details */}
          <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              <Tag className="w-4 h-4" /> {event.type}
            </span>

            <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground leading-tight mb-4">
              {eventDisplayTitle(event)}
            </h1>

            <div className="flex flex-col gap-2 text-foreground mb-5">
              <span className="flex items-center gap-2.5"><CalendarDays className="w-5 h-5 text-primary shrink-0" /> {day ? `${day}, ` : ""}{event.month} {event.day}, {event.year}</span>
              <span className="flex items-center gap-2.5"><Clock className="w-5 h-5 text-primary shrink-0" /> {event.time}</span>
              <span className="flex items-center gap-2.5"><MapPin className="w-5 h-5 text-primary shrink-0" /> {eventLocationText(event)}</span>
            </div>

            <p className="text-foreground leading-relaxed whitespace-pre-line">{event.description}</p>
          </div>
        </div>

        {/* Event disclaimers — above the register band */}
        <EventDisclaimer className="mt-10" />

        {/* Register band */}
        <div className="mt-8 rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
          <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">Save your spot</h2>
          <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
            {event.time} · {event.location}. Register and we'll make sure you have the details.
          </p>
          {hasReg ? (
            <EventActionGate
              href={event.registerUrl!}
              formType="event-register"
              title={event.title}
              summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
              label="Register now"
              icon={<Ticket className="w-5 h-5" />}
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-bold px-7 py-3.5 rounded-2xl hover:opacity-90 transition"
            />
          ) : (
            <Link to="/contact-us"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-bold px-7 py-3.5 rounded-2xl hover:opacity-90 transition">
              <Ticket className="w-5 h-5" /> Register now
            </Link>
          )}
        </div>
        <BlockSlot slot="event-end" blocks={blocks} />
      </div>
    </Shell>
      )}
    </InlinePageEditor>
  );
};

export default EventDetail;
