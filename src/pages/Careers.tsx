import { useState } from "react";
import { MapPin, Briefcase, Clock, ArrowRight } from "lucide-react";
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

const departments = ["All", ...Array.from(new Set(jobs.map((j) => j.department)))];

const Careers = () => {
  const [dept, setDept] = useState("All");
  const filtered = dept === "All" ? jobs : jobs.filter((j) => j.department === dept);
  const mailto = (title: string) =>
    `mailto:careers@evhybridnoire.com?subject=${encodeURIComponent(`Application: ${title}`)}`;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        <div className="container px-4 max-w-5xl">
          {/* Header */}
          <div className="text-center max-w-2xl mx-auto mb-10">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Careers
            </span>
            <h1 className="text-4xl md:text-5xl font-bold font-display text-foreground mb-4">
              Join the <span className="text-gradient-primary">Movement</span>
            </h1>
            <p className="text-muted-foreground text-lg">
              Help electrify America. We're a mission-driven team building a cleaner, more inclusive
              transportation future — and we're hiring.
            </p>
          </div>

          {/* Department filter */}
          <div className="flex flex-wrap justify-center gap-2 mb-10">
            {departments.map((d) => (
              <button
                key={d}
                onClick={() => setDept(d)}
                className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                  dept === d
                    ? "bg-primary text-primary-foreground"
                    : "bg-card border border-border text-foreground hover:border-primary/40"
                }`}
              >
                {d}
              </button>
            ))}
          </div>

          {/* Job list */}
          <div className="space-y-4">
            {filtered.map((j) => (
              <article
                key={j.title}
                className="flex flex-col md:flex-row md:items-center gap-5 p-6 rounded-3xl border border-border bg-card shadow-card hover:shadow-xl transition-all"
              >
                <div className="flex-1">
                  <h2 className="text-xl font-bold font-display text-foreground mb-2">{j.title}</h2>
                  <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-3">
                    <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> {j.department}</span>
                    <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {j.location}</span>
                    <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {j.type}</span>
                  </div>
                  <p className="text-sm text-muted-foreground">{j.description}</p>
                </div>
                <a
                  href={mailto(j.title)}
                  className="shrink-0 inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 transition-opacity"
                >
                  Apply <ArrowRight className="w-4 h-4" />
                </a>
              </article>
            ))}
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
