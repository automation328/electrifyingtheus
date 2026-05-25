import { useState } from "react";
import {
  MapPin, Briefcase, Clock, ArrowRight, Megaphone, GraduationCap, HardHat,
  BarChart3, CalendarDays, Handshake, Sprout, Users, TrendingUp, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

interface Job {
  title: string;
  department: string;
  location: string;
  type: string;
  description: string;
}

const jobs: Job[] = [
  {
    title: "Community Engagement Manager",
    department: "Outreach",
    location: "Hybrid · Detroit, MI",
    type: "Full-time",
    description: "Lead grassroots EV education and ride & drive events, building relationships with community organizations, utilities, and local leaders.",
  },
  {
    title: "EV Education Specialist",
    department: "Education",
    location: "Remote · U.S.",
    type: "Full-time",
    description: "Develop and deliver clear, engaging content that helps everyday drivers understand EVs, charging, incentives, and total cost of ownership.",
  },
  {
    title: "Workforce Development Coordinator",
    department: "Workforce",
    location: "Richmond, VA",
    type: "Full-time",
    description: "Connect job seekers with clean-energy training and career pathways, partnering with labor unions, employers, and community colleges.",
  },
  {
    title: "Data & Research Analyst",
    department: "Research",
    location: "Remote · U.S.",
    type: "Full-time",
    description: "Turn mobility, energy, and adoption data into insights and reports that guide our programs and inform public conversation.",
  },
  {
    title: "Ride & Drive Event Coordinator",
    department: "Events",
    location: "Atlanta, GA",
    type: "Contract",
    description: "Plan and run hands-on EV experiences end-to-end — logistics, vehicles, vendors, volunteers, and an unforgettable attendee experience.",
  },
  {
    title: "Partnerships Lead",
    department: "Partnerships",
    location: "Remote · U.S.",
    type: "Full-time",
    description: "Cultivate strategic relationships with automakers, utilities, and sponsors to expand the reach and impact of our initiatives.",
  },
];

const DEPT_ICON: Record<string, LucideIcon> = {
  Outreach: Megaphone,
  Education: GraduationCap,
  Workforce: HardHat,
  Research: BarChart3,
  Events: CalendarDays,
  Partnerships: Handshake,
};

const VALUES = [
  { icon: Sprout, title: "Mission that matters", text: "Every role moves America toward cleaner, healthier, more affordable transportation.", color: "text-secondary" },
  { icon: Users, title: "Inclusive by design", text: "We partner with community groups and labor unions to widen access to the EV economy.", color: "text-primary" },
  { icon: TrendingUp, title: "Room to grow", text: "A fast-growing team where your work shapes programs and events nationwide.", color: "text-secondary" },
];

const departments = ["All", ...Array.from(new Set(jobs.map((j) => j.department)))];
const countFor = (d: string) => (d === "All" ? jobs.length : jobs.filter((j) => j.department === d).length);

const Careers = () => {
  const [dept, setDept] = useState("All");
  const filtered = dept === "All" ? jobs : jobs.filter((j) => j.department === dept);
  const mailto = (title: string) =>
    `mailto:careers@evhybridnoire.com?subject=${encodeURIComponent(`Application: ${title}`)}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Header — soft brand wash */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto pb-2">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 animate-fade-up">
                Careers
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4 animate-fade-up" style={{ animationDelay: "0.08s" }}>
                Join the <span className="text-gradient-primary">Movement</span>
              </h1>
              <p className="text-muted-foreground text-lg animate-fade-up" style={{ animationDelay: "0.16s" }}>
                Help electrify America. We're a mission-driven team building a cleaner, more inclusive
                transportation future — and we're hiring.
              </p>
            </div>
          </div>
        </section>

        {/* Values band */}
        <div className="container px-4 max-w-5xl mt-10">
          <div className="grid sm:grid-cols-3 gap-5">
            {VALUES.map((v, i) => (
              <div
                key={v.title}
                className="glass-card rounded-3xl p-6 hover:shadow-xl hover:-translate-y-1 transition-all animate-fade-up"
                style={{ animationDelay: `${0.2 + i * 0.1}s` }}
              >
                <span className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center mb-3">
                  <v.icon className={`w-5 h-5 ${v.color}`} />
                </span>
                <h3 className="font-bold font-display text-foreground mb-1">{v.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{v.text}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="container px-4 max-w-5xl">
          {/* Open roles header + filter */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-16 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              Open roles <span className="text-muted-foreground font-sans font-medium text-lg">({filtered.length})</span>
            </h2>
          </div>

          <div className="flex flex-wrap gap-2 mb-8">
            {departments.map((d) => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-all ${
                  dept === d
                    ? "gradient-primary text-primary-foreground shadow-md"
                    : "bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary"
                }`}
              >
                {d} <span className={dept === d ? "opacity-80" : "text-muted-foreground"}>· {countFor(d)}</span>
              </button>
            ))}
          </div>

          {/* Job list */}
          <div className="space-y-4">
            {filtered.map((j, i) => {
              const Icon = DEPT_ICON[j.department] ?? Briefcase;
              return (
                <article
                  key={j.title}
                  className="group relative flex flex-col md:flex-row md:items-center gap-5 p-6 rounded-3xl border border-border bg-card shadow-card hover:shadow-xl hover:-translate-y-0.5 hover:border-primary/30 transition-all animate-fade-up overflow-hidden"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  {/* Accent bar reveals on hover */}
                  <span className="absolute left-0 top-0 bottom-0 w-1 gradient-primary scale-y-0 group-hover:scale-y-100 origin-top transition-transform" aria-hidden />

                  <span className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                    <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </span>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-display text-foreground mb-2 group-hover:text-primary transition-colors">{j.title}</h3>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> {j.department}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {j.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {j.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{j.description}</p>
                  </div>

                  <a
                    href={mailto(j.title)}
                    className="shrink-0 inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 group-hover:gap-3 transition-all"
                  >
                    Apply <ArrowRight className="w-4 h-4" />
                  </a>
                </article>
              );
            })}
          </div>

          {/* Open application */}
          <div className="mt-14 rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">Don't see the right role?</h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              We're always looking for passionate people. Send us your résumé and tell us how you'd help electrify the U.S.
            </p>
            <a
              href="mailto:careers@evhybridnoire.com?subject=General%20Application"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Send an open application <ArrowRight className="w-5 h-5" />
            </a>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
