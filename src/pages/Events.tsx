import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Clock, CalendarDays, ArrowRight, MessageSquare,
  CalendarPlus, BellRing, Search, Star, CheckCircle2, Sparkles, Megaphone,
  ChevronLeft, ChevronRight, ChevronDown,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import {
  gcalLink, isUpcoming, isActive, byDateAsc, eventFullDate, eventDisplayTitle,
  eventLocationPin, type EventItem,
} from "@/data/events";
import { filterEvents } from "@/lib/event-search";
import { splitEventDescription } from "@/lib/event-description";
import EventSpeakers from "@/components/EventSpeakers";
import { useEvents } from "@/hooks/use-content";
import { useExternalEvents, sourceEventKey } from "@/hooks/use-external-events";
import { submitLead } from "@/lib/submitLead";
import EmailShareButton from "@/components/forms/EmailShareButton";
import ShareGate from "@/components/forms/ShareGate";

const eventShareUrl = (e: EventItem) => (e.slug ? `/events/${e.slug}` : "/events");
const eventShareSummary = (e: EventItem) => `${e.location} · ${e.month} ${e.day}, ${e.year}`;

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const shareBase = typeof window !== "undefined" ? `${window.location.origin}/events` : "https://electrifyingtheus.com/events";

const shareSubject = (e: EventItem) => `EV event: ${e.title}`;
const shareBody = (e: EventItem) =>
  `${e.title}\n${e.location}\n${e.month} ${e.day}, ${e.year} · ${e.time}\n\n${e.description}\n\n${shareBase}`;
const shareSms = (e: EventItem) =>
  `sms:?&body=${encodeURIComponent(`EV event: ${e.title} — ${e.location}, ${e.month} ${e.day} — ${shareBase}`)}`;

const Events = () => {
  const [query, setQuery] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertArea, setAlertArea] = useState("");
  const [alertDone, setAlertDone] = useState(false);
  const [alertErr, setAlertErr] = useState("");
  const [featPage, setFeatPage] = useState(0);

  // Collapsible event descriptions — "Read more" reveals the full details while
  // the Register button stays visible.
  const [expandedEvents, setExpandedEvents] = useState<Set<string>>(new Set());
  const toggleEvent = (key: string) =>
    setExpandedEvents((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  const { events } = useEvents();
  const { events: externalEvents } = useExternalEvents();

  // List = ETU's own events first (soonest first), then the aggregated US-wide
  // EV feed (soonest first). Past events are dropped — except our own, which we
  // keep on the site after they're done (isActive). External-feed events always
  // drop once past.
  const allUpcoming = useMemo(() => {
    const etu = events.filter(isActive).sort(byDateAsc);
    // Drop feed events we already hold ourselves. The /api/events feed
    // aggregates driveelectricmonth.org, and so did the 0019 import — 57 events
    // arrive from both directions, and concatenating rendered every one of them
    // twice. Ours wins: a site_events row carries the full venue address, local
    // start and end times and a longer description, where the feed has only
    // what the ICS entry held. The 57th is Poolesville, where "ours" is a
    // hand-authored row with an uploaded flyer — the feed copy has neither.
    //
    // A feed event with no recognisable source id is KEPT. We cannot prove it
    // is a duplicate, and dropping it on a guess loses a real event.
    const mine = new Set(
      etu.map((e) => sourceEventKey(e.registerUrl)).filter((k): k is string => !!k),
    );
    const ext = externalEvents
      .filter((e) => {
        const k = sourceEventKey(e.registerUrl);
        return isUpcoming(e) && !(k && mine.has(k));
      })
      .sort(byDateAsc);
    return [...etu, ...ext];
  }, [events, externalEvents]);

  // Every rule the box follows lives in filterEvents, with its own tests.
  const filtered = useMemo(() => filterEvents(allUpcoming, query), [query, allUpcoming]);

  // Paginate the list: show 12, then "View more events" loads 24 more per click.
  //
  // Was 4 + 3, which was fine for a dozen events and absurd once the National
  // Drive Electric Month import landed — 130 upcoming events took 43 clicks to
  // reach the end. 12 + 24 gets there in five, while still keeping the first
  // paint to roughly two screens rather than a wall of 130 cards.
  //
  // The search box is the real answer for anyone hunting a specific area, so
  // these numbers only need to make BROWSING bearable, not exhaustive.
  const PAGE_START = 12;
  const PAGE_STEP = 24;
  const [visibleCount, setVisibleCount] = useState(PAGE_START);
  useEffect(() => { setVisibleCount(PAGE_START); }, [query]);
  const visibleEvents = filtered.slice(0, visibleCount);

  const featured = events.filter((e) => e.featured && isActive(e));

  // Featured shows 2 cards at a time; arrows page through the rest.
  const FEAT_PER = 2;
  const featPages = Math.max(1, Math.ceil(featured.length / FEAT_PER));
  const featClamped = Math.min(featPage, featPages - 1);
  const featVisible = featured.slice(featClamped * FEAT_PER, featClamped * FEAT_PER + FEAT_PER);
  const featPrev = () => setFeatPage((p) => (p - 1 + featPages) % featPages);
  const featNext = () => setFeatPage((p) => (p + 1) % featPages);
  const [featPaused, setFeatPaused] = useState(false);

  // Auto-advance the featured carousel; pauses on hover / while searching.
  useEffect(() => {
    if (featPaused || featPages <= 1 || query) return;
    const id = window.setInterval(() => setFeatPage((p) => (p + 1) % featPages), 6000);
    return () => window.clearInterval(id);
  }, [featPaused, featPages, query]);

  const submitAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(alertEmail)) { setAlertErr("Please enter a valid email address."); return; }
    setAlertErr("");
    submitLead("event-alerts", { email: alertEmail, zip: alertArea });
    setAlertDone(true);
  };

  // Secondary actions (More info, calendar, share) — revealed once expanded.
  const ActionRow = ({ e, expanded = true }: { e: EventItem; expanded?: boolean }) => (
    <div className="flex flex-wrap items-center gap-2">
      {expanded && (
        <>
          {e.slug && (
            <Link to={`/events/${e.slug}`} className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
              More Info <ArrowRight className="w-4 h-4" />
            </Link>
          )}
          <a href={gcalLink(e)} target="_blank" rel="noopener noreferrer" aria-label="Set a reminder" title="Add to calendar / set reminder"
            className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><CalendarPlus className="w-4 h-4" /></a>
          <ShareGate
            url={eventShareUrl(e)}
            title={e.title}
            summary={eventShareSummary(e)}
            description={e.description}
            image={e.image}
            meta={`${e.type} · ${eventShareSummary(e)} · ${e.time}`}
            formType="event-share"
            className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"
          />
        </>
      )}
    </div>
  );

  // Action row for the colored featured cards — white "More info" + translucent share icons.
  const FeaturedActions = ({ e }: { e: EventItem }) => (
    <div className="mt-auto flex items-center gap-2">
      <Link to={e.slug ? `/events/${e.slug}` : "/events"} className="inline-flex items-center gap-2 bg-white text-foreground font-bold text-sm px-5 py-2.5 rounded-xl hover:bg-white/90 transition">
        More info <ArrowRight className="w-4 h-4" />
      </Link>
      <a href={gcalLink(e)} target="_blank" rel="noopener noreferrer" aria-label="Set a reminder" title="Add to calendar / set reminder"
        className="grid place-items-center w-9 h-9 rounded-lg bg-white/15 text-primary-foreground hover:bg-white/25 transition"><CalendarPlus className="w-4 h-4" /></a>
      <ShareGate
        url={eventShareUrl(e)}
        title={e.title}
        summary={eventShareSummary(e)}
        description={e.description}
        image={e.image}
        meta={`${e.type} · ${eventShareSummary(e)} · ${e.time}`}
        formType="event-share"
        className="grid place-items-center w-9 h-9 rounded-lg bg-white/15 text-primary-foreground hover:bg-white/25 transition"
      />
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-secondary/5 via-primary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-5xl">
            <div className="text-center max-w-3xl mx-auto">
              <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 animate-fade-up">
                Events
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4 animate-fade-up" style={{ animationDelay: "0.08s" }}>
                Upcoming <span className="text-gradient-primary">Events</span>
              </h1>
              <p className="text-muted-foreground text-lg animate-fade-up" style={{ animationDelay: "0.16s" }}>
                We provide a platform for all e-mobility events to gain more visibility and attendees —
                including Ride &amp; Drives, AV events, Webinars, Sustainable Aviation / eGSE events,
                Workshops, Charging Demos, Community Engagement, and more.
                List your event at <span className="font-semibold text-foreground">ElectrifyingTheUS.com</span>.
              </p>
              <div className="flex flex-wrap gap-3 justify-center mt-6 animate-fade-up" style={{ animationDelay: "0.24s" }}>
                <Link to="/list-your-event" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition">
                  <Megaphone className="w-4 h-4" /> List Your Event
                </Link>
                <a href="#alerts" className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition">
                  <BellRing className="w-4 h-4" /> Event Alerts Near You
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Search + alerts by area/ZIP */}
        <div id="alerts" className="container px-4 max-w-5xl mt-12 scroll-mt-28">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card">
            <div className="h-1.5 w-full gradient-hero" aria-hidden />
            <div className="p-6 md:p-7">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Find events near you */}
              <div>
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid place-items-center w-10 h-10 rounded-xl gradient-hero shadow-md shrink-0">
                    <Search className="w-5 h-5 text-primary-foreground" />
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-foreground text-lg leading-tight">Find events near you</h2>
                    <p className="text-muted-foreground text-sm">Search by ZIP code, city, or area.</p>
                  </div>
                </div>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Atlanta, 30301, or Online"
                    aria-label="Search events by ZIP or area"
                    className="w-full rounded-xl border border-slate-300 bg-slate-50 pl-10 pr-3 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{filtered.length} event{filtered.length === 1 ? "" : "s"} match.</p>
              </div>

              {/* Alerts signup */}
              <div className="lg:border-l lg:border-border lg:pl-6">
                <div className="flex items-center gap-3 mb-4">
                  <span className="grid place-items-center w-10 h-10 rounded-xl gradient-hero shadow-md shrink-0">
                    <BellRing className="w-5 h-5 text-primary-foreground" />
                  </span>
                  <div>
                    <h2 className="font-display font-bold text-foreground text-lg leading-tight">Get alerts for your area</h2>
                    <p className="text-muted-foreground text-sm">We'll email you when events come to your region.</p>
                  </div>
                </div>
                {alertDone ? (
                  <p className="inline-flex items-center gap-2 text-secondary font-semibold text-sm">
                    <CheckCircle2 className="w-5 h-5" /> You're set{alertArea ? ` for ${alertArea}` : ""} — we'll be in touch.
                  </p>
                ) : (
                  <form onSubmit={submitAlerts} className="grid sm:grid-cols-2 gap-2.5">
                    <input
                      value={alertArea}
                      onChange={(e) => setAlertArea(e.target.value)}
                      placeholder="ZIP or area"
                      aria-label="Your ZIP or area"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      type="email"
                      placeholder="you@email.com"
                      aria-label="Email for event alerts"
                      className="rounded-xl border border-slate-300 bg-slate-50 px-3.5 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
                    />
                    <button type="submit" className="sm:col-span-2 inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition">
                      Notify me <ArrowRight className="w-4 h-4" />
                    </button>
                  </form>
                )}
                {alertErr && <p className="text-sm text-red-500 mt-2">{alertErr}</p>}
              </div>
            </div>
            </div>
          </div>
        </div>

        {/* Featured */}
        {featured.length > 0 && !query && (
          <div className="container px-4 max-w-5xl mt-12">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-primary" fill="currentColor" />
              <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">Featured events</h2>
              {featPages > 1 && (
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">{featClamped + 1} / {featPages}</span>
              )}
            </div>

            <div
              className="relative"
              onMouseEnter={() => setFeatPaused(true)}
              onMouseLeave={() => setFeatPaused(false)}
            >
              {featPages > 1 && (
                <>
                  <button type="button" onClick={featPrev} aria-label="Previous featured events"
                    className="absolute left-0 md:-left-5 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-11 h-11 rounded-full bg-white text-foreground shadow-elevated border border-border hover:text-primary hover:scale-105 transition">
                    <ChevronLeft className="w-5 h-5" />
                  </button>
                  <button type="button" onClick={featNext} aria-label="Next featured events"
                    className="absolute right-0 md:-right-5 top-1/2 -translate-y-1/2 z-10 grid place-items-center w-11 h-11 rounded-full bg-white text-foreground shadow-elevated border border-border hover:text-primary hover:scale-105 transition">
                    <ChevronRight className="w-5 h-5" />
                  </button>
                </>
              )}
            <div className="grid md:grid-cols-2 gap-6">
              {featVisible.map((e, i) => {
                // Blue↔green hero gradient bodies, alternating direction (matches the reference cards).
                const body = (featClamped * FEAT_PER + i) % 2 === 0 ? "gradient-hero" : "gradient-hero-rev";
                const { intro, speakers } = splitEventDescription(e.description);
                return (
                  <article
                    key={e.title}
                    className="group flex flex-col rounded-3xl overflow-hidden shadow-elevated hover:shadow-xl hover:-translate-y-0.5 transition-all"
                  >
                    {/* Poster image with date badge + featured flag */}
                    <div className="relative aspect-[16/9] overflow-hidden">
                      <img
                        src={e.image}
                        alt={e.title}
                        loading="lazy"
                        className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                      />
                      <span className="absolute inset-0 bg-gradient-to-t from-foreground/40 to-transparent" aria-hidden />
                      <div className="absolute top-3 left-3 w-16 rounded-2xl bg-white text-center shadow-lg overflow-hidden">
                        <div className="bg-secondary text-primary-foreground text-[10px] font-bold tracking-wider py-1">{e.month}</div>
                        <div className="text-foreground text-2xl font-bold font-display leading-none py-1.5">{e.day}</div>
                      </div>
                      <span className="absolute top-3 right-3 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-white/90 text-foreground text-[11px] font-bold shadow">
                        <Star className="w-3 h-3 text-secondary" fill="currentColor" /> Featured
                      </span>
                    </div>

                    {/* Gradient body */}
                    <div className={`${body} text-primary-foreground p-6 flex flex-col flex-1`}>
                      <span className="inline-block self-start px-2.5 py-0.5 rounded-full bg-white/20 text-[11px] font-semibold mb-2.5">{e.type}</span>
                      <h3 className="text-lg font-bold font-display leading-snug mb-3">{eventDisplayTitle(e)}</h3>
                      <div className="flex flex-wrap items-center gap-2 mb-3">
                        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/15 text-xs font-semibold"><MapPin className="w-3.5 h-3.5" /> {eventLocationPin(e) || e.location}</span>
                        <span className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/90"><Clock className="w-3.5 h-3.5" /> {e.time}</span>
                      </div>
                      <p className="text-sm text-primary-foreground/90 mb-4">{intro}</p>
                      <EventSpeakers speakers={speakers} tone="gradient" className="mb-4" />
                      <FeaturedActions e={e} />
                    </div>
                  </article>
                );
              })}
            </div>
            </div>
          </div>
        )}

        {/* All / filtered events */}
        <div className="container px-4 max-w-5xl mt-12">
          <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-5">
            {query ? "Matching events" : "All upcoming events"}
          </h2>

          {filtered.length === 0 ? (
            <div className="rounded-3xl border border-border bg-card p-10 text-center text-muted-foreground">
              No events match “{query}”. Try a different area, or set an alert above and we'll notify you.
            </div>
          ) : (
            <div className="space-y-5">
              {visibleEvents.map((e, i) => {
                const key = `${e.title}-${i}`;
                const open = expandedEvents.has(key);
                const { intro, speakers } = splitEventDescription(e.description);
                const clipped = intro.length > 180;
                // Speakers sit behind "More Info" so the collapsed card stays compact.
                const long = clipped || speakers.length > 0;
                const preview = clipped ? `${intro.slice(0, 180).trimEnd()}…` : intro;
                return (
                  <article
                    key={key}
                    className="group relative rounded-3xl border border-border bg-card shadow-card hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/30 transition-all animate-fade-up overflow-hidden"
                    style={{ animationDelay: `${i * 0.05}s` }}
                  >
                    {/* Header — thumbnail + title link to the event's own page;
                        the description expands via the "More Info" toggle. */}
                    <div className="w-full flex flex-col sm:flex-row gap-5 sm:gap-7 p-5 sm:p-6">
                      {(() => {
                        const thumbInner = (
                          <>
                            <img
                              src={e.image}
                              alt={e.title}
                              loading="lazy"
                              className="absolute inset-0 w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                            />
                            <span className="absolute inset-0 bg-gradient-to-t from-foreground/35 to-transparent" aria-hidden />
                            <div className="absolute top-2.5 left-2.5 w-14 rounded-xl bg-white text-center shadow-lg overflow-hidden">
                              <div className="bg-secondary text-primary-foreground text-[9px] font-bold tracking-wider py-0.5">{e.month}</div>
                              <div className="text-foreground text-xl font-bold font-display leading-none py-1">{e.day}</div>
                            </div>
                          </>
                        );
                        const thumbCls = "relative shrink-0 w-full sm:w-52 h-44 sm:h-auto sm:self-stretch rounded-2xl overflow-hidden bg-muted block";
                        return e.slug ? (
                          <Link to={`/events/${e.slug}`} className={thumbCls} aria-label={`View ${e.title}`}>{thumbInner}</Link>
                        ) : (
                          <div className={thumbCls}>{thumbInner}</div>
                        );
                      })()}

                      <div className="flex-1 min-w-0">
                        <div className="flex flex-wrap items-center gap-2 mb-2">
                          <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{e.type}</span>
                        </div>
                        {e.slug ? (
                          <Link to={`/events/${e.slug}`} className="block">
                            <h3 className="text-xl font-bold font-display text-foreground mb-2 group-hover:text-primary transition-colors">{eventDisplayTitle(e)}</h3>
                          </Link>
                        ) : (
                          <h3 className="text-xl font-bold font-display text-foreground mb-2">{eventDisplayTitle(e)}</h3>
                        )}
                        <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-3">
                          <span className="flex items-center gap-1.5"><CalendarDays className="w-4 h-4 text-secondary" /> {eventFullDate(e)}</span>
                          <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {e.time}</span>
                          {eventLocationPin(e) && (
                            <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {eventLocationPin(e)}</span>
                          )}
                        </div>
                        <p className={`text-sm text-muted-foreground ${open ? "whitespace-pre-line" : ""}`}>
                          {open ? intro : preview}
                        </p>
                        {open && <EventSpeakers speakers={speakers} tone="card" className="mt-4" />}
                        {long && (
                          <button
                            type="button"
                            onClick={() => toggleEvent(key)}
                            aria-expanded={open}
                            className="mt-1.5 inline-flex items-center gap-1 text-sm font-semibold text-primary hover:gap-2 transition-all"
                          >
                            {open ? "Less" : "More Info"}
                            <ChevronDown className={`w-4 h-4 transition-transform ${open ? "rotate-180" : ""}`} />
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Actions — revealed when expanded */}
                    {open && (
                      <div className="px-5 sm:px-6 pb-5 sm:pb-6 sm:pl-[236px]">
                        <ActionRow e={e} expanded={open} />
                      </div>
                    )}
                  </article>
                );
              })}

              {visibleCount < filtered.length && (
                <div className="flex flex-col items-center gap-2 pt-3">
                  <button
                    type="button"
                    onClick={() => setVisibleCount((c) => c + PAGE_STEP)}
                    className="inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground font-semibold text-sm px-6 py-3 shadow-card hover:opacity-90 transition"
                  >
                    View more events <ChevronDown className="w-4 h-4" />
                  </button>
                  <span className="text-xs text-muted-foreground">
                    Showing {visibleEvents.length} of {filtered.length}
                  </span>
                </div>
              )}
            </div>
          )}
        </div>

        {/* List your event — tiers */}
        <div id="list" className="container px-4 max-w-5xl mt-16 scroll-mt-28">
          <div className="text-center max-w-2xl mx-auto mb-8">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">List your event</h2>
            <p className="text-muted-foreground">
              Get your e-mobility event in front of an engaged national audience. Start free, or boost reach with a Featured listing.
            </p>
          </div>
          <div className="grid md:grid-cols-2 gap-5">
            <div className="rounded-3xl border border-border bg-card p-7">
              <h3 className="font-display font-bold text-foreground text-xl mb-1">Free</h3>
              <p className="text-muted-foreground text-sm mb-4">For standard community listings.</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {["Listed in All Events", "Searchable by area", "Add-to-calendar + share"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> {f}</li>
                ))}
              </ul>
              <Link to="/list-your-event" className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:border-primary/40 hover:text-primary transition">
                Submit for free <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="relative rounded-3xl border-2 border-primary/40 bg-card p-7 shadow-elevated">
              <span className="absolute top-5 right-5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full gradient-primary text-primary-foreground text-[11px] font-bold">
                <Star className="w-3 h-3" fill="currentColor" /> Featured
              </span>
              <h3 className="font-display font-bold text-foreground text-xl mb-1">Featured</h3>
              <p className="text-muted-foreground text-sm mb-4">Maximum visibility for priority events.</p>
              <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                {["Top of the page + Featured section", "Highlighted card + badge", "Included in area alert emails", "Social promotion"].map((f) => (
                  <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> {f}</li>
                ))}
              </ul>
              <Link to="/list-your-event" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                <Sparkles className="w-4 h-4" /> Feature my event
              </Link>
            </div>
          </div>
        </div>

        {/* Disclaimer */}
        <div className="container px-4 max-w-5xl mt-12">
          <p className="text-xs leading-relaxed text-muted-foreground border-t border-border pt-6">
            Electrifying the US reserves the right to select, approve, and decline which events are included in
            our event listings. Listings are provided for informational purposes only. Electrifying the US is not
            the organizer or host of third-party events and is not responsible for these events, their content,
            accuracy, safety, or any changes, cancellations, or outcomes. Please confirm details directly with the
            event organizer before attending.
          </p>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
