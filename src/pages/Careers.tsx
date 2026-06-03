import { useState } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Briefcase, Clock, ArrowRight, Megaphone, GraduationCap, HardHat,
  BarChart3, CalendarDays, Handshake, Building2, Star, Mail, MessageSquare,
  CheckCircle2, BellRing, Sparkles, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { JOBS as jobs, type Job } from "@/data/careers";

const DEPT_ICON: Record<string, LucideIcon> = {
  Outreach: Megaphone,
  Education: GraduationCap,
  Workforce: HardHat,
  Research: BarChart3,
  Events: CalendarDays,
  Partnerships: Handshake,
  Infrastructure: Building2,
};

const departments = ["All", ...Array.from(new Set(jobs.map((j) => j.department)))];
const countFor = (d: string) => (d === "All" ? jobs.length : jobs.filter((j) => j.department === d).length);

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const Careers = () => {
  const [dept, setDept] = useState("All");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertDone, setAlertDone] = useState(false);
  const [alertErr, setAlertErr] = useState("");

  const filtered = dept === "All" ? jobs : jobs.filter((j) => j.department === dept);

  const applyHref = (j: Job) =>
    `mailto:${j.applyEmail ?? "careers@electrifyingtheus.com"}?subject=${encodeURIComponent(`Application: ${j.title} — ${j.company}`)}`;

  // Share a listing via the visitor's email or SMS app.
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/careers` : "https://electrifyingtheus.com/careers";
  const shareEmail = (j: Job) =>
    `mailto:?subject=${encodeURIComponent(`EV job: ${j.title} at ${j.company}`)}&body=${encodeURIComponent(`Thought you might be interested in this role:\n\n${j.title} — ${j.company}\n${j.location} · ${j.type}\n\n${shareUrl}`)}`;
  const shareSms = (j: Job) =>
    `sms:?&body=${encodeURIComponent(`EV job: ${j.title} at ${j.company} — ${shareUrl}`)}`;

  const submitAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(alertEmail)) { setAlertErr("Please enter a valid email address."); return; }
    setAlertErr("");
    setAlertDone(true);
  };

  const featured = jobs.filter((j) => j.featured);

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto pb-2">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 animate-fade-up">
                E-Mobility Job Board
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4 animate-fade-up" style={{ animationDelay: "0.08s" }}>
                Join the <span className="text-gradient-primary">Movement</span>
              </h1>
              <p className="text-muted-foreground text-lg animate-fade-up mb-6" style={{ animationDelay: "0.16s" }}>
                Help electrify America. We're a mission-driven team building a cleaner, more inclusive
                transportation future — and we're hiring. Companies across the e-mobility industry list
                openings here, and candidates apply directly.
              </p>
              <div className="flex flex-wrap gap-3 justify-center animate-fade-up" style={{ animationDelay: "0.24s" }}>
                <Link to="/post-a-job" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition">
                  <Building2 className="w-4 h-4" /> Post a Job
                </Link>
                <a href="#alerts" className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:border-primary/40 hover:text-primary transition">
                  <BellRing className="w-4 h-4" /> Get Job Alerts
                </a>
              </div>
            </div>
          </div>
        </section>

        {/* Featured roles */}
        {featured.length > 0 && (
          <div className="container px-4 max-w-5xl mt-14">
            <div className="flex items-center gap-2 mb-5">
              <Star className="w-5 h-5 text-primary" fill="currentColor" />
              <h2 className="text-xl md:text-2xl font-bold font-display text-foreground">Featured roles</h2>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              {featured.map((j) => {
                const Icon = DEPT_ICON[j.department] ?? Briefcase;
                return (
                  <article key={j.title} className="relative p-6 rounded-3xl border border-primary/30 bg-card shadow-card overflow-hidden">
                    <span className="absolute top-4 right-4 inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-primary/10 text-primary text-[11px] font-bold">
                      <Star className="w-3 h-3" fill="currentColor" /> Featured
                    </span>
                    <span className="inline-flex w-11 h-11 rounded-2xl bg-primary/10 items-center justify-center mb-4">
                      <Icon className="w-5 h-5 text-primary" />
                    </span>
                    <h3 className="text-lg font-bold font-display text-foreground mb-1">{j.title}</h3>
                    <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> {j.company}
                    </p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {j.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {j.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground mb-4">{j.description}</p>
                    <div className="flex items-center gap-2">
                      <a href={applyHref(j)} className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                        Apply <ArrowRight className="w-4 h-4" />
                      </a>
                      <a href={shareEmail(j)} aria-label="Share via email" className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><Mail className="w-4 h-4" /></a>
                      <a href={shareSms(j)} aria-label="Share via SMS" className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><MessageSquare className="w-4 h-4" /></a>
                    </div>
                  </article>
                );
              })}
            </div>
          </div>
        )}

        <div className="container px-4 max-w-5xl">
          {/* All roles + filter */}
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mt-16 mb-6">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">
              All roles <span className="text-muted-foreground font-sans font-medium text-lg">({filtered.length})</span>
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
                  <span className="absolute left-0 top-0 bottom-0 w-1 gradient-primary scale-y-0 group-hover:scale-y-100 origin-top transition-transform" aria-hidden />

                  <span className="shrink-0 w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center group-hover:bg-primary transition-colors">
                    <Icon className="w-6 h-6 text-primary group-hover:text-primary-foreground transition-colors" />
                  </span>

                  <div className="flex-1">
                    <h3 className="text-xl font-bold font-display text-foreground mb-1 group-hover:text-primary transition-colors">{j.title}</h3>
                    <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1.5">
                      <Building2 className="w-3.5 h-3.5" /> {j.company}
                    </p>
                    <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-3">
                      <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> {j.department}</span>
                      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {j.location}</span>
                      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {j.type}</span>
                    </div>
                    <p className="text-sm text-muted-foreground">{j.description}</p>
                  </div>

                  <div className="shrink-0 flex items-center gap-2">
                    <a href={shareEmail(j)} aria-label="Share via email" className="grid place-items-center w-10 h-10 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><Mail className="w-4 h-4" /></a>
                    <a href={shareSms(j)} aria-label="Share via SMS" className="grid place-items-center w-10 h-10 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><MessageSquare className="w-4 h-4" /></a>
                    <a href={applyHref(j)} className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 group-hover:gap-3 transition-all">
                      Apply <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </article>
              );
            })}
          </div>

          {/* Job alerts */}
          <div id="alerts" className="mt-14 rounded-3xl border border-border bg-card p-8 scroll-mt-28">
            <div className="flex items-center gap-2 mb-2">
              <BellRing className="w-5 h-5 text-primary" />
              <h2 className="text-2xl font-bold font-display text-foreground">Get job alerts</h2>
            </div>
            <p className="text-muted-foreground mb-5 max-w-xl">
              New e-mobility roles, in your inbox. Be the first to hear about openings that match your interests.
            </p>
            {alertDone ? (
              <p className="inline-flex items-center gap-2 text-secondary font-semibold">
                <CheckCircle2 className="w-5 h-5" /> You're subscribed — we'll send new roles your way.
              </p>
            ) : (
              <form onSubmit={submitAlerts} className="flex flex-col sm:flex-row gap-3 max-w-md">
                <input
                  value={alertEmail}
                  onChange={(e) => setAlertEmail(e.target.value)}
                  type="email"
                  placeholder="you@email.com"
                  aria-label="Email for job alerts"
                  className="flex-1 rounded-xl border border-border bg-background px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
                <button type="submit" className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition">
                  Subscribe <ArrowRight className="w-4 h-4" />
                </button>
              </form>
            )}
            {alertErr && <p className="text-sm text-red-500 mt-2">{alertErr}</p>}
          </div>

          {/* Employer tiers — Post a job */}
          <div id="post" className="mt-10 scroll-mt-28">
            <div className="text-center max-w-2xl mx-auto mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">List your opening</h2>
              <p className="text-muted-foreground">
                Reach a national audience of EV-minded candidates. Start free, or stand out with a Featured listing.
              </p>
            </div>
            <div className="grid md:grid-cols-2 gap-5">
              <div className="rounded-3xl border border-border bg-card p-7">
                <h3 className="font-display font-bold text-foreground text-xl mb-1">Free</h3>
                <p className="text-muted-foreground text-sm mb-4">For standard listings on the job board.</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  {["Listed in All Roles", "Apply-by-email", "Department filtering"].map((f) => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-secondary" /> {f}</li>
                  ))}
                </ul>
                <Link to="/post-a-job" className="inline-flex items-center gap-2 bg-card border border-border text-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:border-primary/40 hover:text-primary transition">
                  Post for free <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
              <div className="relative rounded-3xl border-2 border-primary/40 bg-card p-7 shadow-elevated">
                <span className="absolute top-5 right-5 inline-flex items-center gap-1 px-2.5 py-1 rounded-full gradient-primary text-primary-foreground text-[11px] font-bold">
                  <Star className="w-3 h-3" fill="currentColor" /> Featured
                </span>
                <h3 className="font-display font-bold text-foreground text-xl mb-1">Featured</h3>
                <p className="text-muted-foreground text-sm mb-4">Maximum visibility for priority roles.</p>
                <ul className="space-y-2 text-sm text-muted-foreground mb-6">
                  {["Top of the board + Featured section", "Company highlight + badge", "Shared to our job-alerts list", "Social promotion"].map((f) => (
                    <li key={f} className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-primary" /> {f}</li>
                  ))}
                </ul>
                <Link to="/post-a-job" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                  <Sparkles className="w-4 h-4" /> Feature my job
                </Link>
              </div>
            </div>
          </div>

          {/* Partner band */}
          <div className="mt-14 rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
            <Handshake className="w-10 h-10 mx-auto mb-3 opacity-90" />
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">
              Would you, individually, or your company or organization, like to partner with us?
            </h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              We collaborate with utilities, automakers, employers, labor, and community groups to grow the
              clean-mobility economy. Let's build something together.
            </p>
            <Link
              to="/contact-us"
              className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-2xl hover:opacity-90 transition-opacity"
            >
              Partner with us <ArrowRight className="w-5 h-5" />
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default Careers;
