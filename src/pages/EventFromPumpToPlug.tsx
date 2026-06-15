import { Link } from "react-router-dom";
import {
  CalendarDays, Clock, MapPin, ArrowLeft, Ticket, CalendarPlus,
  Video, CheckCircle2, DollarSign, Plug, BadgeCheck,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import ShareGate from "@/components/forms/ShareGate";
import EventActionGate from "@/components/forms/EventActionGate";
import { EVENTS, gcalLink } from "@/data/events";
import flyer from "@/assets/event-pump-to-plug.jpg";

const SLUG = "from-pump-to-plug";

const LEARN = [
  { icon: DollarSign, text: "How much EV drivers really save on fuel vs. gasoline" },
  { icon: Plug, text: "Charging at home and on the road — costs and the basics" },
  { icon: BadgeCheck, text: "Federal, state, and utility incentives you can claim" },
];

const EventFromPumpToPlug = () => {
  const event = EVENTS.find((e) => e.slug === SLUG) ?? EVENTS[0];
  const registerUrl = event.registerUrl ?? "https://bit.ly/SaveWithEVs";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-5xl">
          <Link to="/events" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground mb-6 transition-colors">
            <ArrowLeft className="w-4 h-4" /> Back to events
          </Link>

          <div className="grid lg:grid-cols-2 gap-8 lg:gap-12 items-start">
            {/* Flyer */}
            <div className="relative animate-fade-up">
              <div className="overflow-hidden rounded-3xl shadow-elevated ring-1 ring-border">
                <img src={flyer} alt={event.title} className="w-full h-auto object-cover" width={900} height={600} />
              </div>
              {/* Date badge */}
              <div className="absolute -top-4 -left-4 w-20 rounded-2xl bg-white text-center shadow-lg overflow-hidden">
                <div className="bg-secondary text-primary-foreground text-[11px] font-bold tracking-wider py-1">{event.month}</div>
                <div className="text-foreground text-3xl font-bold font-display leading-none py-2">{event.day}</div>
              </div>
            </div>

            {/* Details */}
            <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
                <Video className="w-4 h-4" /> {event.type}
              </span>

              <h1 className="text-3xl md:text-4xl font-bold font-display text-foreground leading-tight mb-4">
                {event.title}
              </h1>

              <div className="flex flex-col gap-2 text-foreground mb-5">
                <span className="flex items-center gap-2.5"><CalendarDays className="w-5 h-5 text-primary shrink-0" /> Thursday, {event.month} {event.day}, {event.year}</span>
                <span className="flex items-center gap-2.5"><Clock className="w-5 h-5 text-primary shrink-0" /> {event.time}</span>
                <span className="flex items-center gap-2.5"><MapPin className="w-5 h-5 text-primary shrink-0" /> {event.location}</span>
              </div>

              <p className="text-muted-foreground leading-relaxed mb-6">{event.description}</p>

              {/* CTAs — Add to calendar, Share, then Register. Each captures the
                  visitor's first name + email before proceeding. */}
              <div className="flex flex-wrap gap-3 mb-6">
                <EventActionGate
                  href={gcalLink(event)}
                  formType="event-calendar"
                  title={event.title}
                  summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                  label="Add to calendar"
                  icon={<CalendarPlus className="w-5 h-5" />}
                  className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-6 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition"
                />
                <ShareGate
                  url={event.slug ? `/events/${event.slug}` : "/events"}
                  title={event.title}
                  summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                  description={event.description}
                  image={event.image}
                  meta={`${event.type} · ${event.location} · ${event.month} ${event.day}, ${event.year} · ${event.time}`}
                  formType="event-share"
                  variant="label"
                  label="Share"
                  className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold px-6 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition"
                />
                <EventActionGate
                  href={registerUrl}
                  formType="event-register"
                  title={event.title}
                  summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
                  label="Register"
                  icon={<Ticket className="w-5 h-5" />}
                  className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-card hover:opacity-90 transition"
                />
              </div>

              <p className="text-xs text-muted-foreground">
                Powered by <span className="font-semibold text-foreground">Electrifying Michigan</span>,{" "}
                <span className="font-semibold text-foreground">Electrifying the US</span>, and{" "}
                <span className="font-semibold text-foreground">Electrifying Virginia</span>.
              </p>
            </div>
          </div>

          {/* What you'll learn */}
          <div className="mt-12 rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card">
            <h2 className="font-display font-bold text-foreground text-xl mb-5 flex items-center gap-2">
              <CheckCircle2 className="w-5 h-5 text-secondary" /> What you'll learn
            </h2>
            <div className="grid sm:grid-cols-3 gap-4">
              {LEARN.map((l) => (
                <div key={l.text} className="flex items-start gap-3 rounded-2xl bg-background border border-border p-4">
                  <span className="grid place-items-center w-10 h-10 rounded-xl bg-primary/10 text-primary shrink-0">
                    <l.icon className="w-5 h-5" />
                  </span>
                  <span className="text-sm text-foreground leading-snug">{l.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Bottom register band */}
          <div className="mt-8 rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">Save your seat</h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              Free to attend · {event.time}. Register now and we'll send you the link.
            </p>
            <EventActionGate
              href={registerUrl}
              formType="event-register"
              title={event.title}
              summary={`${event.location} · ${event.month} ${event.day}, ${event.year}`}
              label="Register at bit.ly/SaveWithEVs"
              icon={<Ticket className="w-5 h-5" />}
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-bold px-7 py-3.5 rounded-2xl hover:opacity-90 transition"
            />
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default EventFromPumpToPlug;
