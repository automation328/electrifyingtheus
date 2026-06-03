import { useState } from "react";
import { Link } from "react-router-dom";
import {
  Building2, User, Briefcase, Send, Loader2, CheckCircle2, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EMPTY = {
  firstName: "", lastName: "", email: "", mobile: "", city: "", zip: "",
  title: "", company: "", department: "", industry: "",
  jobTitle: "", jobLocation: "", jobType: "", jobIndustry: "",
  applicationDeadline: "", jobDescription: "", jobLink: "", contact: "",
};

type Field = keyof typeof EMPTY;

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const JOB_WEBHOOK =
  (import.meta as { env?: Record<string, string> }).env?.VITE_JOB_WEBHOOK_URL ??
  (import.meta as { env?: Record<string, string> }).env?.VITE_CONTACT_WEBHOOK_URL ??
  (import.meta as { env?: Record<string, string> }).env?.VITE_N8N_WEBHOOK_URL;

const JOB_TYPES = [
  "Full-time", "Part-time", "Contract", "Temporary",
  "Internship", "Apprenticeship", "Remote", "Volunteer",
];

const JOB_INDUSTRIES = [
  "Automotive", "Energy / Utilities", "EV Charging / Infrastructure",
  "Manufacturing", "Government / Public Sector", "Nonprofit",
  "Technology / Software", "Transportation / Logistics", "Education",
  "Research / Policy", "Other",
];

const PostAJob = () => {
  const [form, setForm] = useState(EMPTY);
  const [permission, setPermission] = useState<"" | "Yes" | "No">("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set =
    (key: Field) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("Please enter your first and last name."); return; }
    if (!isValidEmail(form.email)) { setError("Please enter a valid email address."); return; }
    const required: [string, string][] = [
      [form.city, "your city"],
      [form.zip, "your zip code"],
      [form.title, "your title"],
      [form.company, "your company or organization"],
      [form.department, "your department"],
      [form.industry, "your industry"],
      [form.jobTitle, "the job title"],
      [form.jobLocation, "the job location"],
      [form.jobType, "the job type"],
      [form.jobIndustry, "the job industry"],
      [form.jobDescription, "the job description"],
      [form.jobLink, "a link to the job posting or application page"],
    ];
    const missing = required.find(([v]) => !v.trim());
    if (missing) { setError(`Please add ${missing[1]}.`); return; }
    if (permission !== "Yes") { setError("We can only post jobs you have permission to share. Please confirm with “Yes”."); return; }
    if (!notRobot) { setError("Please confirm you're not a robot."); return; }

    setError("");
    setSubmitting(true);
    if (JOB_WEBHOOK) {
      try {
        await fetch(JOB_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "postJob", ...form, permission, marketingConsent }),
        });
      } catch { /* non-blocking */ }
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelCls = "block text-xs font-medium text-foreground mb-1.5";
  const reqStar = <span className="text-primary">*</span>;

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-3xl">
            <div className="text-center">
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                <Building2 className="w-4 h-4" /> Post a Job
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
                Post a <span className="text-gradient-primary">Job Opening</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Reach a national audience of EV-minded candidates. Share the details of your open role and
                we'll review it for the e-mobility job board.
              </p>
            </div>
          </div>
        </section>

        <div className="container px-4 max-w-3xl mt-10">
          <div className="relative rounded-3xl border border-border bg-card shadow-elevated overflow-hidden">
            <div className="h-1 w-full gradient-hero" aria-hidden />
            <div className="p-6 md:p-8">
              {submitted ? (
                <div className="flex flex-col items-center text-center py-12">
                  <span className="grid place-items-center w-16 h-16 rounded-2xl bg-secondary/10 mb-4">
                    <CheckCircle2 className="w-9 h-9 text-secondary" />
                  </span>
                  <h2 className="font-display font-bold text-foreground text-2xl">
                    Thanks, {form.firstName || "there"}! Your job is in review.
                  </h2>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    We received <span className="font-medium text-foreground">{form.jobTitle}</span> and will
                    email <span className="font-medium text-foreground">{form.email}</span> once it's approved
                    for the board.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center mt-6">
                    <Link to="/careers" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition">
                      Back to Job Board <ArrowRight className="w-4 h-4" />
                    </Link>
                  </div>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="space-y-8" noValidate>
                  {/* ── Your details ── */}
                  <section>
                    <h2 className="flex items-center gap-2 font-display font-bold text-foreground text-lg mb-4">
                      <User className="w-4 h-4 text-primary" /> Your details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>First name {reqStar}</label>
                        <input className={inputCls} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" placeholder="Jane" />
                      </div>
                      <div>
                        <label className={labelCls}>Last name {reqStar}</label>
                        <input className={inputCls} value={form.lastName} onChange={set("lastName")} autoComplete="family-name" placeholder="Doe" />
                      </div>
                      <div>
                        <label className={labelCls}>Email {reqStar}</label>
                        <input type="email" className={inputCls} value={form.email} onChange={set("email")} autoComplete="email" placeholder="jane@company.com" />
                      </div>
                      <div>
                        <label className={labelCls}>Mobile number</label>
                        <input type="tel" className={inputCls} value={form.mobile} onChange={set("mobile")} autoComplete="tel" placeholder="(555) 123-4567" />
                      </div>
                      <div>
                        <label className={labelCls}>City {reqStar}</label>
                        <input className={inputCls} value={form.city} onChange={set("city")} autoComplete="address-level2" placeholder="Atlanta" />
                      </div>
                      <div>
                        <label className={labelCls}>Zip code {reqStar}</label>
                        <input className={inputCls} value={form.zip} onChange={set("zip")} autoComplete="postal-code" placeholder="30301" />
                      </div>
                      <div>
                        <label className={labelCls}>Title {reqStar}</label>
                        <input className={inputCls} value={form.title} onChange={set("title")} autoComplete="organization-title" placeholder="Talent Manager" />
                      </div>
                      <div>
                        <label className={labelCls}>Company or organization {reqStar}</label>
                        <input className={inputCls} value={form.company} onChange={set("company")} autoComplete="organization" placeholder="Acme Utilities" />
                      </div>
                      <div>
                        <label className={labelCls}>Department {reqStar}</label>
                        <input className={inputCls} value={form.department} onChange={set("department")} placeholder="Human Resources" />
                      </div>
                      <div>
                        <label className={labelCls}>Industry {reqStar}</label>
                        <input className={inputCls} value={form.industry} onChange={set("industry")} placeholder="Energy / Utilities" />
                      </div>
                    </div>
                  </section>

                  {/* ── Job details ── */}
                  <section>
                    <h2 className="flex items-center gap-2 font-display font-bold text-foreground text-lg mb-4">
                      <Briefcase className="w-4 h-4 text-primary" /> Job details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Job title {reqStar}</label>
                        <input className={inputCls} value={form.jobTitle} onChange={set("jobTitle")} placeholder="EV Charging Technician" />
                      </div>
                      <div>
                        <label className={labelCls}>Job location {reqStar}</label>
                        <input className={inputCls} value={form.jobLocation} onChange={set("jobLocation")} placeholder="Atlanta, GA / Remote" />
                      </div>
                      <div>
                        <label className={labelCls}>Job type {reqStar}</label>
                        <select className={`${inputCls} cursor-pointer`} value={form.jobType} onChange={set("jobType")}>
                          <option value="" disabled>Select job type</option>
                          {JOB_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div>
                        <label className={labelCls}>Job industry {reqStar}</label>
                        <select className={`${inputCls} cursor-pointer`} value={form.jobIndustry} onChange={set("jobIndustry")}>
                          <option value="" disabled>Select job industry</option>
                          {JOB_INDUSTRIES.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Application deadline <span className="text-muted-foreground font-normal">(if applicable)</span></label>
                        <input type="date" className={inputCls} value={form.applicationDeadline} onChange={set("applicationDeadline")} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Job description / key responsibilities {reqStar}</label>
                        <textarea rows={6} className={`${inputCls} resize-y`} value={form.jobDescription} onChange={set("jobDescription")} placeholder="Describe the role, responsibilities, requirements, and benefits…" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Link to job posting or application page {reqStar}</label>
                        <input type="url" className={inputCls} value={form.jobLink} onChange={set("jobLink")} placeholder="https://example.com/careers/123" />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Who should applicants contact if they have questions?</label>
                        <input className={inputCls} value={form.contact} onChange={set("contact")} placeholder="careers@company.com" />
                      </div>
                    </div>
                  </section>

                  {/* ── Permissions & consent ── */}
                  <section className="space-y-4">
                    <div>
                      <label className={labelCls}>
                        Do you give us permission to share this job publicly on our website and in our
                        communications? {reqStar}
                      </label>
                      <div className="flex gap-2.5 mt-1">
                        {(["Yes", "No"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setPermission(v)}
                            className={`px-5 py-2 rounded-xl border text-sm font-semibold transition ${
                              permission === v
                                ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                : "border-border bg-background text-foreground hover:border-primary/40"
                            }`}
                          >
                            {v}
                          </button>
                        ))}
                      </div>
                    </div>

                    <label className="flex items-start gap-2.5 text-sm text-muted-foreground cursor-pointer">
                      <input
                        type="checkbox"
                        checked={marketingConsent}
                        onChange={(e) => setMarketingConsent(e.target.checked)}
                        className="mt-0.5 h-4 w-4 rounded border-border text-primary focus:ring-primary/30"
                      />
                      <span>
                        I confirm that I want to receive content from this organization using any contact
                        information I provide. <Link to="/privacy-policy" className="text-primary hover:underline">Privacy Policy</Link>{" "}
                        | <Link to="/terms" className="text-primary hover:underline">Terms &amp; Conditions</Link>
                      </span>
                    </label>

                    <label className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer w-fit rounded-xl border border-border bg-background px-4 py-3">
                      <input
                        type="checkbox"
                        checked={notRobot}
                        onChange={(e) => setNotRobot(e.target.checked)}
                        className="h-5 w-5 rounded border-border text-primary focus:ring-primary/30"
                      />
                      I'm not a robot {reqStar}
                    </label>
                  </section>

                  {error && <p className="text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-base px-5 py-3.5 hover:opacity-90 transition disabled:opacity-60"
                  >
                    {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>) : (<><Send className="w-4 h-4" /> Submit job</>)}
                  </button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Electrifying the US reviews and reserves the right to approve or decline job listings.
                    Submitting does not guarantee a posting.
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default PostAJob;
