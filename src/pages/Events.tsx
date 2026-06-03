import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Clock, ArrowRight, Ticket, CalendarDays, Mail, MessageSquare,
  CalendarPlus, BellRing, Search, Star, CheckCircle2, Sparkles, Megaphone,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { EVENTS, gcalLink, type EventItem } from "@/data/events";

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());
const shareBase = typeof window !== "undefined" ? `${window.location.origin}/events` : "https://electrifyingtheus.com/events";

const shareEmail = (e: EventItem) =>
  `mailto:?subject=${encodeURIComponent(`EV event: ${e.title}`)}&body=${encodeURIComponent(`${e.title}\n${e.location}\n${e.month} ${e.day}, ${e.year} · ${e.time}\n\n${e.description}\n\n${shareBase}`)}`;
const shareSms = (e: EventItem) =>
  `sms:?&body=${encodeURIComponent(`EV event: ${e.title} — ${e.location}, ${e.month} ${e.day} — ${shareBase}`)}`;

const Events = () => {
  const [query, setQuery] = useState("");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertArea, setAlertArea] = useState("");
  const [alertDone, setAlertDone] = useState(false);
  const [alertErr, setAlertErr] = useState("");

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return EVENTS;
    return EVENTS.filter(
      (e) =>
        e.region.toLowerCase().includes(q) ||
        e.location.toLowerCase().includes(q) ||
        e.title.toLowerCase().includes(q) ||
        e.type.toLowerCase().includes(q),
    );
  }, [query]);

  const featured = EVENTS.filter((e) => e.featured);

  const submitAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(alertEmail)) { setAlertErr("Please enter a valid email address."); return; }
    setAlertErr("");
    setAlertDone(true);
  };

  const ActionRow = ({ e }: { e: EventItem }) => (
    <div className="flex items-center gap-2">
      <Link to="/#contact" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
        <Ticket className="w-4 h-4" /> Register
      </Link>
      <a href={gcalLink(e)} target="_blank" rel="noopener noreferrer" aria-label="Set a reminder" title="Add to calendar / set reminder"
        className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><CalendarPlus className="w-4 h-4" /></a>
      <a href={shareEmail(e)} aria-label="Share via email" title="Share via email"
        className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><Mail className="w-4 h-4" /></a>
      <a href={shareSms(e)} aria-label="Share via SMS" title="Share via SMS"
        className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><MessageSquare className="w-4 h-4" /></a>
    </div>
  );

  // Prominent location chip.
  const LocationChip = ({ e, dark }: { e: EventItem; dark?: boolean }) => (
    <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold ${
      dark ? "bg-primary-foreground/15 text-primary-foreground" : "bg-secondary/10 text-secondary"
    }`}>
      <MapPin className="w-3.5 h-3.5" /> {e.location}
    </span>
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
          <div className="rounded-3xl border border-border bg-card p-6 md:p-7 shadow-card">
            <div className="grid lg:grid-cols-2 gap-6">
              {/* Find events near you */}
              <div>
                <h2 className="font-display font-bold text-foreground text-lg mb-1 flex items-center gap-2">
                  <Search className="w-4 h-4 text-primary" /> Find events near you
                </h2>
                <p className="text-muted-foreground text-sm mb-4">Search by ZIP code, city, or area.</p>
                <div className="relative">
                  <MapPin className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground pointer-events-none" />
                  <input
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="e.g. Atlanta, 30301, or Online"
                    aria-label="Search events by ZIP or area"
                    className="w-full rounded-xl border border-border bg-background pl-10 pr-3 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                  />
                </div>
                <p className="text-xs text-muted-foreground mt-2">{filtered.length} event{filtered.length === 1 ? "" : "s"} match.</p>
              </div>

              {/* Alerts signup */}
              <div className="lg:border-l lg:border-border lg:pl-6">
                <h2 className="font-display font-bold text-foreground text-lg mb-1 flex items-center gap-2">
                  <BellRing className="w-4 h-4 text-primary" /> Get alerts for your area
                </h2>
                <p className="text-muted-foreground text-sm mb-4">We'll email you when events come to your region.</p>
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
                      className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                    />
                    <input
                      value={alertEmail}
                      onChange={(e) => setAlertEmail(e.target.value)}
                      type="email"
                      placeholder="you@email.com"
                      aria-label="Email for event alerts"
                      className="rounded-xl border border-border bg-background px-3.5 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
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

        {/* Featured */}
        {featured.length > 0 && !query && (
          <div className="container px-4 max-w-5xl mt-12">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-primary" fill="currentColor" />
              <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">Featured events</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {featured.map((e) => (
                <article key={e.title} className="relative overflow-hidden rounded-3xl gradient-hero text-primary-foreground shadow-elevated p-7">
                  <CalendarDays className="absolute -right-5 -bottom-5 w-36 h-36 opacity-10" />
                  <div className="relative">
                    <div className="flex items-center gap-3 mb-3">
                      <div className="shrink-0 w-16 h-16 rounded-2xl bg-primary-foreground/15 backdrop-blur flex flex-col items-center justify-center">
                        <span className="text-[10px] font-semibold tracking-wider opacity-90">{e.month}</span>
                        <span className="text-2xl font-bold font-display leading-none">{e.day}</span>
                      </div>
                      <div>
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-primary-foreground/15 text-[11px] font-semibold mb-1">
                          <Star className="w-3 h-3" fill="currentColor" /> Featured · {e.type}
                        </span>
                        <h3 className="text-lg font-bold font-display leading-snug">{e.title}</h3>
                      </div>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 mb-3">
                      <LocationChip e={e} dark />
                      <span className="inline-flex items-center gap-1.5 text-xs text-primary-foreground/90"><Clock className="w-3.5 h-3.5" /> {e.time}</span>
                    </div>
                    <p className="text-sm text-primary-foreground/90 mb-4">{e.description}</p>
                    <ActionRow e={e} />
                  </div>
                </article>
              ))}
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
              {filtered.map((e, i) => (
                <article
                  key={e.title}
                  className="group relative flex flex-col sm:flex-row gap-5 sm:gap-7 p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-card hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/30 transition-all animate-fade-up overflow-hidden"
                  style={{ animationDelay: `${i * 0.05}s` }}
                >
                  <div className="shrink-0 w-20 h-20 rounded-2xl gradient-primary text-primary-foreground flex flex-col items-center justify-center group-hover:scale-105 transition-transform">
                    <span className="text-xs font-semibold tracking-wider opacity-90">{e.month}</span>
                    <span className="text-3xl font-bold font-display leading-none">{e.day}</span>
                  </div>

                  <div className="flex-1">
                    <div className="flex flex-wrap items-center gap-2 mb-2">
                      <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold">{e.type}</span>
                      <LocationChip e={e} />
                    </div>
                    <h3 className="text-xl font-bold font-display text-foreground mb-2 group-hover:text-primary transition-colors">{e.title}</h3>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {e.time}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{e.description}</p>
                    <ActionRow e={e} />
                  </div>
                </article>
              ))}
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
