// On-page webinar registration form. Captures the registrant (first/last/email)
// into GoHighLevel via the shared /api/lead proxy (formType "event-register"),
// remembers them site-wide via leadIdentity, and shows a confirmation — so
// visitors register without leaving the page. A GHL automation on the
// "event-register" tag can email the join link; the Zoom link stays available as
// a fallback on the success screen.

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

const WebinarRegisterForm = ({ eventTitle, eventTime, eventSummary, registerUrl, calendarUrl }: Props) => {
  const saved = getLeadIdentity();
  const [firstName, setFirstName] = useState(saved?.firstName ?? "");
  const [lastName, setLastName] = useState("");
  const [email, setEmail] = useState(saved?.email ?? "");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!firstName.trim()) { setErr("Please enter your first name."); return; }
    if (!isValidEmail(email)) { setErr("Please enter a valid email address."); return; }
    setErr("");
    setBusy(true);

    saveLeadIdentity({ firstName: firstName.trim(), email: email.trim() });
    // Non-blocking: confirm to the user even if the network call hiccups.
    await submitLead("event-register", {
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      email: email.trim(),
      subject: `Webinar registration: ${eventTitle}`,
      topic: eventSummary,
    });
    setBusy(false);
    setDone(true);
  };

  if (done) {
    return (
      <div id="register" className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card text-center scroll-mt-28">
        <span className="grid place-items-center w-14 h-14 rounded-2xl bg-primary/10 text-primary mx-auto mb-4">
          <CheckCircle2 className="w-7 h-7" />
        </span>
        <h2 className="font-display font-bold text-2xl text-foreground mb-2">You're registered, {firstName.trim()}!</h2>
        <p className="text-muted-foreground max-w-md mx-auto mb-6">
          We've saved your spot for {eventTime}. We'll email your join link to <span className="font-semibold text-foreground">{email.trim()}</span> before the webinar.
        </p>
        <div className="flex flex-wrap items-center justify-center gap-3">
          <a
            href={calendarUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-5 py-3 rounded-xl shadow-card hover:opacity-90 transition"
          >
            <CalendarPlus className="w-5 h-5" /> Add to calendar
          </a>
          <a
            href={registerUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-primary transition"
          >
            Prefer Zoom? Complete registration there <ExternalLink className="w-4 h-4" />
          </a>
        </div>
      </div>
    );
  }

  return (
    <div id="register" className="rounded-3xl border border-border bg-card p-6 md:p-8 shadow-card scroll-mt-28">
      <div className="flex items-center gap-2 mb-1">
        <Ticket className="w-5 h-5 text-primary" />
        <h2 className="font-display font-bold text-2xl text-foreground">Register for the webinar</h2>
      </div>
      <p className="text-muted-foreground mb-6">{eventTime}. It's free — reserve your seat and we'll send you the join link.</p>

      <form onSubmit={onSubmit} className="space-y-4">
        <div className="grid sm:grid-cols-2 gap-4">
          <div>
            <label htmlFor="wr-first" className="block text-sm font-medium text-foreground mb-1.5">First name</label>
            <input
              id="wr-first" type="text" autoComplete="given-name" value={firstName}
              onChange={(e) => setFirstName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Jordan"
            />
          </div>
          <div>
            <label htmlFor="wr-last" className="block text-sm font-medium text-foreground mb-1.5">Last name</label>
            <input
              id="wr-last" type="text" autoComplete="family-name" value={lastName}
              onChange={(e) => setLastName(e.target.value)}
              className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
              placeholder="Rivera"
            />
          </div>
        </div>
        <div>
          <label htmlFor="wr-email" className="block text-sm font-medium text-foreground mb-1.5">Email</label>
          <input
            id="wr-email" type="email" autoComplete="email" value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full rounded-xl border border-border bg-background px-4 py-3 text-foreground outline-none focus:ring-2 focus:ring-primary/40"
            placeholder="you@email.com"
          />
        </div>
        {err && <p className="text-sm text-destructive">{err}</p>}
        <button
          type="submit"
          disabled={busy}
          className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-bold px-7 py-3.5 rounded-2xl shadow-card hover:opacity-90 transition disabled:opacity-70"
        >
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
