import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  MapPin, Briefcase, Clock, ArrowRight, Megaphone, GraduationCap, HardHat,
  BarChart3, CalendarDays, Handshake, Building2, Star, MessageSquare,
  CheckCircle2, BellRing, Sparkles, ChevronDown, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import { JOBS, type Job } from "@/data/careers";
import { useExternalJobs } from "@/hooks/use-external-jobs";
import { usePostedJobs } from "@/hooks/use-content";
import { submitLead } from "@/lib/submitLead";
import EmailShareButton from "@/components/forms/EmailShareButton";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

const DEPT_ICON: Record<string, LucideIcon> = {
  Outreach: Megaphone,
  Education: GraduationCap,
  Workforce: HardHat,
  Research: BarChart3,
  Events: CalendarDays,
  Partnerships: Handshake,
  Infrastructure: Building2,
};

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const Careers = () => {
  const [dept, setDept] = useState("All");
  const [alertEmail, setAlertEmail] = useState("");
  const [alertDone, setAlertDone] = useState(false);
  const [alertErr, setAlertErr] = useState("");

  // Apply gate — capture first name + email, then route to the employer's site.
  const [applyJob, setApplyJob] = useState<Job | null>(null);
  const [applyForm, setApplyForm] = useState({ firstName: "", email: "" });
  const [applyErr, setApplyErr] = useState("");

  // Collapsible rows — collapsed shows the preview; expanded reveals the full
  // description + Apply.
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const toggleExpanded = (key: string) =>
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(key) ? next.delete(key) : next.add(key);
      return next;
    });

  // Jobs we post ourselves (Supabase site_jobs, via the n8n job form) show first,
  // then real openings from EV companies' public ATS boards (/api/jobs), falling
  // back to the curated static list when the feed is empty.
  const { jobs: postedJobs } = usePostedJobs();
  const { jobs: externalJobs } = useExternalJobs();
  const liveJobs = useMemo(
    () => [...postedJobs, ...(externalJobs.length ? externalJobs : JOBS)],
    [postedJobs, externalJobs],
  );

  // Department chips — "All" plus the 8 most common departments (real boards can
  // have dozens; the rest still appear under "All").
  const departments = useMemo(() => {
    const counts = new Map<string, number>();
    liveJobs.forEach((j) => counts.set(j.department, (counts.get(j.department) ?? 0) + 1));
    const top = [...counts.entries()].sort((a, b) => b[1] - a[1]).slice(0, 8).map(([d]) => d);
    return ["All", ...top];
  }, [liveJobs]);

  const countFor = (d: string) => (d === "All" ? liveJobs.length : liveJobs.filter((j) => j.department === d).length);

  const filtered = dept === "All" ? liveJobs : liveJobs.filter((j) => j.department === dept);

  const applyTo = (j: Job) =>
    j.applyUrl ?? `https://www.linkedin.com/jobs/search/?keywords=${encodeURIComponent(`${j.title} ${j.company}`)}`;

  const openApply = (j: Job) => { setApplyForm({ firstName: "", email: "" }); setApplyErr(""); setApplyJob(j); };

  const submitApply = (e: React.FormEvent) => {
    e.preventDefault();
    if (!applyForm.firstName.trim()) { setApplyErr("Please enter your first name."); return; }
    if (!isValidEmail(applyForm.email)) { setApplyErr("Please enter a valid email address."); return; }
    const j = applyJob!;
    submitLead("job-apply", {
      firstName: applyForm.firstName, email: applyForm.email,
      jobTitle: j.title, company: j.company, location: j.location, jobType: j.type,
    });
    setApplyJob(null);
    window.open(applyTo(j), "_blank", "noopener,noreferrer");
  };

  // Share a listing via the visitor's webmail (gated) or SMS app.
  const shareUrl = typeof window !== "undefined" ? `${window.location.origin}/careers` : "https://electrifyingtheus.com/careers";
  const shareSubject = (j: Job) => `EV job: ${j.title} at ${j.company}`;
  const shareBody = (j: Job) =>
    `Thought you might be interested in this role:\n\n${j.title} — ${j.company}\n${j.location} · ${j.type}\n\n${shareUrl}`;
  const shareSms = (j: Job) =>
    `sms:?&body=${encodeURIComponent(`EV job: ${j.title} at ${j.company} — ${shareUrl}`)}`;

  const submitAlerts = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(alertEmail)) { setAlertErr("Please enter a valid email address."); return; }
    setAlertErr("");
    submitLead("career-alerts", { email: alertEmail });
    setAlertDone(true);
  };

  const featured = liveJobs.filter((j) => j.featured);

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
              {featured.map((j, i) => {
                const Icon = DEPT_ICON[j.department] ?? Briefcase;
                return (
                  <article key={`${j.company}-${j.title}-${i}`} className="relative p-6 rounded-3xl border border-primary/30 bg-card shadow-card overflow-hidden">
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
                      <button type="button" onClick={() => openApply(j)} className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-2.5 rounded-xl hover:opacity-90 transition">
                        Apply <ArrowRight className="w-4 h-4" />
                      </button>
                      <EmailShareButton
                        formType="job-share"
                        title={`${j.title} at ${j.company}`}
                        summary={`${j.company} · ${j.location}`}
                        subject={shareSubject(j)}
                        body={shareBody(j)}
                        className="grid place-items-center w-9 h-9 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"
                      />
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
              const key = `${j.company}-${j.title}-${i}`;
              const open = expanded.has(key);
              return (
                <article
                  key={key}
                  className="group relative rounded-3xl border border-border bg-card shadow-card hover:shadow-xl hover:border-primary/30 transition-all animate-fade-up overflow-hidden"
                  style={{ animationDelay: `${i * 0.06}s` }}
                >
                  <span className={`absolute left-0 top-0 bottom-0 w-1 gradient-primary origin-top transition-transform ${open ? "scale-y-100" : "scale-y-0 group-hover:scale-y-100"}`} aria-hidden />

                  {/* Clickable header — collapsed shows the preview; click to expand */}
                  <button
                    type="button"
                    onClick={() => toggleExpanded(key)}
                    aria-expanded={open}
                    className="w-full flex items-start gap-5 p-6 text-left"
                  >
                    <span className={`shrink-0 w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${open ? "bg-primary" : "bg-primary/10 group-hover:bg-primary"}`}>
                      <Icon className={`w-6 h-6 transition-colors ${open ? "text-primary-foreground" : "text-primary group-hover:text-primary-foreground"}`} />
                    </span>

                    <div className="flex-1 min-w-0">
                      <h3 className="text-xl font-bold font-display text-foreground mb-1 group-hover:text-primary transition-colors">{j.title}</h3>
                      <p className="text-sm font-medium text-primary mb-2 flex items-center gap-1.5">
                        <Building2 className="w-3.5 h-3.5" /> {j.company}
                      </p>
                      <div className="flex flex-wrap gap-x-5 gap-y-1 text-sm text-muted-foreground mb-3">
                        <span className="flex items-center gap-1.5"><Briefcase className="w-4 h-4 text-primary" /> {j.department}</span>
                        <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4 text-secondary" /> {j.location}</span>
                        <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-secondary" /> {j.type}</span>
                      </div>
                      <p className={`text-sm text-muted-foreground leading-relaxed ${open ? "whitespace-pre-line" : ""}`}>
                        {open ? (j.descriptionFull || j.description) : j.description}
                      </p>
                    </div>

                    <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 mt-1 transition-transform ${open ? "rotate-180 text-primary" : ""}`} />
                  </button>

                  {/* Apply + share — revealed when expanded */}
                  {open && (
                    <div className="px-6 pb-6 md:pl-[68px] flex flex-wrap items-center gap-2">
                      <button type="button" onClick={() => openApply(j)} className="inline-flex items-center justify-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-6 py-3 rounded-xl hover:opacity-90 hover:gap-3 transition-all">
                        Apply <ArrowRight className="w-4 h-4" />
                      </button>
                      <EmailShareButton
                        formType="job-share"
                        title={`${j.title} at ${j.company}`}
                        summary={`${j.company} · ${j.location}`}
                        subject={shareSubject(j)}
                        body={shareBody(j)}
                        className="grid place-items-center w-10 h-10 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"
                      />
                      <a href={shareSms(j)} aria-label="Share via SMS" className="grid place-items-center w-10 h-10 rounded-lg border border-border text-muted-foreground hover:text-primary hover:border-primary/40 transition"><MessageSquare className="w-4 h-4" /></a>
                    </div>
                  )}
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
                  className="flex-1 rounded-xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm outline-none focus:border-primary focus:bg-white focus:ring-2 focus:ring-primary/20"
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

      {/* Apply gate — capture first name + email, then route to the employer's site */}
      <Dialog open={!!applyJob} onOpenChange={(o) => { if (!o) setApplyJob(null); }}>
        <DialogContent aria-describedby={undefined} className="sm:max-w-md rounded-3xl overflow-hidden p-0 bg-white">
          <div className="h-1.5 w-full gradient-hero" aria-hidden />
          <div className="p-6">
            <DialogHeader>
              <DialogTitle className="font-display text-2xl flex items-center gap-2">
                <Briefcase className="w-5 h-5 text-primary" /> Apply for this role
              </DialogTitle>
            </DialogHeader>
            {applyJob && (
              <div className="mt-2 mb-4 rounded-2xl border border-border bg-muted/40 p-3.5">
                <p className="font-semibold text-foreground text-sm">{applyJob.title}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1.5 mt-0.5">
                  <Building2 className="w-3.5 h-3.5" /> {applyJob.company} · {applyJob.location}
                </p>
              </div>
            )}
            <form onSubmit={submitApply} className="space-y-3">
              <Input
                value={applyForm.firstName}
                onChange={(e) => setApplyForm((f) => ({ ...f, firstName: e.target.value }))}
                placeholder="First name *"
                autoComplete="given-name"
                autoFocus
                className="rounded-xl h-11"
              />
              <Input
                type="email"
                value={applyForm.email}
                onChange={(e) => setApplyForm((f) => ({ ...f, email: e.target.value }))}
                placeholder="Email address *"
                autoComplete="email"
                className="rounded-xl h-11"
              />
              {applyErr && <p className="text-xs text-red-500">{applyErr}</p>}
              <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl">
                Continue to apply <ArrowRight className="w-4 h-4" />
              </Button>
              <p className="text-[11px] text-muted-foreground leading-relaxed">
                We'll take you to the employer's application page. Your details help us keep you posted on similar roles.
              </p>
            </form>
          </div>
        </DialogContent>
      </Dialog>

      <Footer />
    </div>
  );
};

export default Careers;
