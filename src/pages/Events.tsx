import { Link } from "react-router-dom";
import { MapPin, Clock, ArrowRight, Ticket } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface EventItem {
  month: string;
  day: string;
  title: string;
  type: string;
  location: string;
  time: string;
  description: string;
}

const events: EventItem[] = [
  {
    month: "JUN", day: "14",
    title: "National Drive Electric — Ride & Drive",
    type: "Ride & Drive",
    location: "Atlanta, GA · Piedmont Park",
    time: "10:00 AM – 4:00 PM EDT",
    description: "Test-drive the latest EVs from multiple automakers, talk to owners, and learn about incentives — all in one place. Free and open to the public.",
  },
  {
    month: "JUN", day: "26",
    title: "Charging at Home: Free Webinar",
    type: "Webinar",
    location: "Online · Zoom",
    time: "6:00 PM – 7:00 PM EDT",
    description: "Everything you need to know about Level 2 home charging — equipment, installation, costs, and utility rebates. Live Q&A with EV experts.",
  },
  {
    month: "JUL", day: "10",
    title: "Clean Mobility Workforce Summit",
    type: "Conference",
    location: "Detroit, MI · TCF Center",
    time: "9:00 AM – 5:00 PM EDT",
    description: "Connect with employers, training programs, and labor partners building the clean-energy workforce. Career fair and hands-on demos included.",
  },
  {
    month: "AUG", day: "02",
    title: "Electrifying Virginia Community Expo",
    type: "Expo",
    location: "Richmond, VA · Main Street Station",
    time: "11:00 AM – 6:00 PM EDT",
    description: "A family-friendly celebration of e-mobility: EVs, e-bikes, electric buses, food trucks, and STEAM activities for kids.",
  },
  {
    month: "SEP", day: "18",
    title: "Fleet Electrification Workshop",
    type: "Workshop",
    location: "Online · Virtual",
    time: "1:00 PM – 3:00 PM EDT",
    description: "For businesses and municipalities: how to plan, fund, and roll out electric fleets. Case studies, TCO modeling, and grant guidance.",
  },
];

const Events = () => {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-12">
            <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
              Events
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
              Upcoming <span className="text-gradient-primary">Events</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Ride & drives, webinars, workshops, and community expos — experience electric mobility in person and online.
            </p>
          </div>

          {/* Event list */}
          <div className="space-y-5">
            {events.map((e) => (
              <article
                key={e.title}
                className="flex flex-col sm:flex-row gap-5 sm:gap-7 p-5 sm:p-6 rounded-3xl border border-border bg-card shadow-card hover:shadow-xl transition-all"
              >
                {/* Date badge */}
                <div className="shrink-0 w-20 h-20 rounded-2xl gradient-primary text-primary-foreground flex flex-col items-center justify-center">
                  <span className="text-xs font-semibold tracking-wider opacity-90">{e.month}</span>
                  <span className="text-3xl font-bold font-display leading-none">{e.day}</span>
                </div>

                {/* Details */}
                <div className="flex-1">
                  <span className="inline-block px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-semibold mb-2">
                    {e.type}
                  </span>
                  <h2 className="text-xl font-bold font-display text-foreground mb-2">{e.title}</h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {e.location}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {e.time}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{e.description}</p>
                </div>

                {/* Register */}
                <div className="shrink-0 flex sm:flex-col items-center justify-center">
                  <Link
                    to="/#contact"
                    className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity"
                  >
                    <Ticket className="w-4 h-4" /> Register
                  </Link>
                </div>
              </article>
            ))}
          </div>

          {/* Host CTA */}
          <div className="mt-14 rounded-3xl border border-border bg-card p-8 text-center">
            <h2 className="text-2xl font-bold font-display text-foreground mb-2">Want to host an event?</h2>
            <p className="text-muted-foreground mb-6 max-w-xl mx-auto">
              Bring a ride & drive or e-mobility workshop to your community, campus, or workplace.
            </p>
            <Link to="/#contact" className="inline-flex items-center gap-2 text-primary font-semibold hover:gap-3 transition-all">
              Get in touch <ArrowRight className="w-4 h-4" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Events;
