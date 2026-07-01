// On-page webinar registration form. Mirrors the official Zoom registration
// fields so we collect the full registrant profile on our own page, then upsert
// into GoHighLevel via the shared /api/lead proxy (formType "event-register").
// Remembers the visitor site-wide via leadIdentity and shows a confirmation.
// The Zoom link stays available as a fallback on the success screen.

import { useState } from "react";
import { Ticket, CheckCircle2, CalendarPlus, Loader2, ExternalLink } from "lucide-react";
import { submitLead } from "@/lib/submitLead";
import { isValidEmail } from "@/lib/lead";
import { getLeadIdentity, saveLeadIdentity } from "@/lib/leadIdentity";

interface Props {
  eventTitle: string;
  eventTime: string;
  eventSummary: string;
  /** Official Zoom registration URL — offered as a fallback after registering. */
  registerUrl: string;
  /** Google Calendar "add" link for the confirmation screen. */
  calendarUrl: string;
}

// These must match the Zoom webinar's registration dropdown answers exactly —
// Zoom validates custom-question values character-for-character.
const VEHICLE_OPTIONS = [
  "I drive a gas or hybrid car and want to save money",
  "I already own an electric vehicle (EV)",
  "I am looking to switch to an EV in the next 6 months",
  "I don't own a car but interested in purchasing one",
];
const CONCERN_OPTIONS = [
  "Upfront cost",
  "Range/charging availability in my area",
  "Not sure if it makes financial sense",
  "I live in a rural area",
  "I rent my home and can't install a charger",
  "I already own an EV",
];

const EMPTY = {
  firstName: "", lastName: "", email: "", city: "", zip: "",
  company: "", industry: "", title: "", mobile: "",
  vehicle: "", concern: "", question: "",
};

// Register the person on Zoom (if the ZOOM_* env vars are configured server-side)
// and return their unique join link, or null. Best-effort — never blocks the form.
async function registerOnZoom(f: typeof EMPTY): Promise<string | null> {
  try {
    const r = await fetch("/api/register-webinar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        firstName: f.firstName.trim(), lastName: f.lastName.trim(), email: f.email.trim(),
        city: f.city.trim(), zip: f.zip.trim(), company: f.company.trim(),
        industry: f.industry.trim(), title: f.title.trim(), mobile: f.mobile.trim(),
        vehicle: f.vehicle, concern: f.concern, question: f.question.trim(),
      }),
    });
    const d = await r.json();
    return d?.joinUrl ?? null;
  } catch { return null; }
}

const inputCls =
  "w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40";
const Req = () => <span className="text-destructive">*</span>;

const WebinarRegisterForm = ({ eventTitle, eventTime, eventSummary, registerUrl, calendarUrl }: Props) => {
  const saved = getLeadIdentity();
  const [f, setF] = useState({ ...EMPTY, firstName: saved?.firstName ?? "", email: saved?.email ?? "" });
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);
  const [joinUrl, setJoinUrl] = useState<string | null>(null);

  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setF((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const required: Array<[keyof typeof EMPTY, string]> = [
      ["firstName", "First name"], ["lastName", "Last name"], ["email", "Email"],
      ["city", "City"], ["zip", "Zip code"], ["company", "Company or organization"],
      ["industry", "Industry"], ["title", "Title"],
      ["vehicle", "Vehicle situation"], ["concern", "EV concern"], ["question", "Your question"],
    ];
    for (const [k, label] of required) {
      if (!String(f[k]).trim()) { setErr(`Please fill in: ${label}.`); return; }
    }
    if (!isValidEmail(f.email)) { setErr("Please enter a valid email address."); return; }
    setErr("");
    setBusy(true);

    saveLeadIdentity({ firstName: f.firstName.trim(), email: f.email.trim() });
    // Capture the lead in the CRM, and — if Zoom is wired up — register the person
    // on the webinar for their unique join link. Both run together; neither blocks.
    const [, zoomJoin] = await Promise.all([
      submitLead("event-register", {
        firstName: f.firstName.trim(),
        lastName: f.lastName.trim(),
        email: f.email.trim(),
        mobile: f.mobile.trim(),
        company: f.company.trim(),
        industry: f.industry.trim(),
        title: f.title.trim(),
        city: f.city.trim(),
        zip: f.zip.trim(),
        subject: `Webinar registration: ${eventTitle}`,
        topic: eventSummary,
        message:
          `Vehicle situation: ${f.vehicle}\n` +
          `Biggest EV concern: ${f.concern}\n` +
          `Question for the webinar: ${f.question.trim()}`,
      }),
      registerOnZoom(f),
    ]);
    setJoinUrl(zoomJoin);
    setBusy(false);
    setDone(true);
  };

  if (done) {
    return (
      <div id="register" className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card text-center scroll-mt-28">
        <span className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </span>
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">You're registered, {f.firstName.trim()}!</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          {joinUrl
            ? <>Your spot for {eventTime} is confirmed. Your personal join link is below and we've also emailed it to <span className="font-semibold text-foreground">{f.email.trim()}</span>.</>
            : <>We've saved your spot for {eventTime}. We'll email your join link to <span className="font-semibold text-foreground">{f.email.trim()}</span> before the webinar.</>}
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          {joinUrl && (
            <a href={joinUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl shadow-card hover:opacity-90 transition">
              <Ticket className="w-5 h-5" /> Join the webinar
            </a>
          )}
          <a href={calendarUrl} target="_blank" rel="noopener noreferrer"
            className={`inline-flex items-center gap-2 font-semibold px-5 py-3 rounded-xl transition ${joinUrl ? "bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary" : "gradient-primary text-primary-foreground shadow-card hover:opacity-90"}`}>
            <CalendarPlus className="w-5 h-5" /> Add to calendar
          </a>
          {!joinUrl && (
            <a href={registerUrl} target="_blank" rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition">
              Prefer Zoom? Complete registration there <ExternalLink className="w-4 h-4" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <div id="register" className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card scroll-mt-28">
      <div className="flex items-center gap-2 mb-1">
        <Ticket className="w-5 h-5 text-primary" />
        <h2 className="font-display font-bold text-2xl text-foreground">Webinar registration</h2>
      </div>
      <p className="text-muted-foreground mb-6">{eventTime}. It's free — reserve your seat and we'll send you the join link.</p>

      <form onSubmit={onSubmit} className="space-y-4" noValidate>
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wr-first" className="block text-sm font-medium text-foreground mb-1.5">First name <Req /></label>
            <input id="wr-first" type="text" autoComplete="given-name" value={f.firstName} onChange={set("firstName")} className={inputCls} placeholder="Jordan" />
          </div>
          <div>
            <label htmlFor="wr-last" className="block text-sm font-medium text-foreground mb-1.5">Last name <Req /></label>
            <input id="wr-last" type="text" autoComplete="family-name" value={f.lastName} onChange={set("lastName")} className={inputCls} placeholder="Rivera" />
          </div>
        </div>

        <div>
          <label htmlFor="wr-email" className="block text-sm font-medium text-foreground mb-1.5">Email address <Req /></label>
          <input id="wr-email" type="email" autoComplete="email" value={f.email} onChange={set("email")} className={inputCls} placeholder="you@email.com" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wr-city" className="block text-sm font-medium text-foreground mb-1.5">City <Req /></label>
            <input id="wr-city" type="text" autoComplete="address-level2" value={f.city} onChange={set("city")} className={inputCls} placeholder="Detroit" />
          </div>
          <div>
            <label htmlFor="wr-zip" className="block text-sm font-medium text-foreground mb-1.5">Zip code <Req /></label>
            <input id="wr-zip" type="text" inputMode="numeric" autoComplete="postal-code" value={f.zip} onChange={set("zip")} className={inputCls} placeholder="48201" />
          </div>
        </div>

        <div>
          <label htmlFor="wr-company" className="block text-sm font-medium text-foreground mb-1.5">Company or organization <Req /></label>
          <input id="wr-company" type="text" autoComplete="organization" value={f.company} onChange={set("company")} className={inputCls} placeholder="Company or organization" />
        </div>

        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wr-industry" className="block text-sm font-medium text-foreground mb-1.5">Industry <Req /></label>
            <input id="wr-industry" type="text" value={f.industry} onChange={set("industry")} className={inputCls} placeholder="Industry" />
          </div>
          <div>
            <label htmlFor="wr-title" className="block text-sm font-medium text-foreground mb-1.5">Title <Req /></label>
            <input id="wr-title" type="text" autoComplete="organization-title" value={f.title} onChange={set("title")} className={inputCls} placeholder="Title" />
          </div>
        </div>

        <div>
          <label htmlFor="wr-mobile" className="block text-sm font-medium text-foreground mb-1.5">Mobile number</label>
          <input id="wr-mobile" type="tel" autoComplete="tel" value={f.mobile} onChange={set("mobile")} className={inputCls} placeholder="(optional)" />
        </div>

        <div>
          <label htmlFor="wr-vehicle" className="block text-sm font-medium text-foreground mb-1.5">What best describes your current vehicle situation? <Req /></label>
          <select id="wr-vehicle" value={f.vehicle} onChange={set("vehicle")} className={inputCls}>
            <option value="">Select</option>
            {VEHICLE_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="wr-concern" className="block text-sm font-medium text-foreground mb-1.5">What's your biggest concern about switching to an EV? <Req /></label>
          <select id="wr-concern" value={f.concern} onChange={set("concern")} className={inputCls}>
            <option value="">Select</option>
            {CONCERN_OPTIONS.map((o) => <option key={o} value={o}>{o}</option>)}
          </select>
        </div>

        <div>
          <label htmlFor="wr-question" className="block text-sm font-medium text-foreground mb-1.5">What is one question you hope we answer during this webinar? <Req /></label>
          <input id="wr-question" type="text" value={f.question} onChange={set("question")} className={inputCls} placeholder="Your question" />
        </div>

        {err && <p className="text-sm text-destructive">{err}</p>}

        <button type="submit" disabled={busy}
          className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-bold px-7 py-3.5 rounded-2xl shadow-card hover:opacity-90 transition disabled:opacity-70">
          {busy ? <Loader2 className="w-5 h-5 animate-spin" /> : <Ticket className="w-5 h-5" />}
          {busy ? "Registering…" : "Register for the webinar"}
        </button>
        <p className="text-xs text-muted-foreground">
          By registering you agree to receive the webinar join link and related updates. Unsubscribe anytime.
        </p>
      </form>
    </div>
  );
};

export default WebinarRegisterForm;
