// The gate in front of every gallery and home-page video. The visitor gives us
// the full profile once; the video they clicked then plays, and so does every
// video afterwards (see src/lib/videoAccess.ts for why that memory is its own
// store rather than leadIdentity).
//
// Same ten fields as the site contact form, so the lead lands in GoHighLevel and
// in site_form_submissions with nothing custom on the server side — api/lead.ts
// already maps every one of them.
//
// Non-blocking, like every other gate here: the video unlocks even if the lead
// POST fails, so a backend hiccup never leaves someone staring at a poster.

import { useEffect, useState } from "react";
import {
  User, Mail, Phone, MapPin, Hash, Building2, Briefcase, Layers, Factory,
  PlayCircle, Loader2,
} from "lucide-react";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { FloatingInput, FloatingSelect } from "@/components/forms/FloatingField";
import { submitLead } from "@/lib/submitLead";
import { rememberLeadEmail } from "@/lib/emailCompose";
import { getLeadIdentity, saveLeadIdentity } from "@/lib/leadIdentity";
import { saveVideoAccess } from "@/lib/videoAccess";

// Matches the list in ContactForm — one vocabulary across every form keeps the
// CRM's industry field reportable.
const INDUSTRIES = [
  "Utility / Energy",
  "Automotive / OEM",
  "Government / Public Sector",
  "Nonprofit / Community",
  "Education",
  "Fleet / Logistics",
  "Technology",
  "Finance / Insurance",
  "Other",
];

const EMPTY = {
  firstName: "", lastName: "", mobile: "", city: "", zip: "",
  company: "", email: "", title: "", department: "", industry: "",
};

// Every field is required. Someone with no company or department is expected to
// type "n/a" rather than leave a blank, which is why there is no optional set.
const REQUIRED: Array<[keyof typeof EMPTY, string]> = [
  ["firstName", "First name"],
  ["lastName", "Last name"],
  ["mobile", "Mobile number"],
  ["city", "City"],
  ["zip", "Zip code"],
  ["company", "Company or organization"],
  ["email", "Email"],
  ["title", "Title"],
  ["department", "Department"],
  ["industry", "Industry"],
];

const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

interface Props {
  open: boolean;
  onOpenChange: (o: boolean) => void;
  /** Fired once the profile is captured — start the video the visitor clicked. */
  onUnlock: () => void;
  /** Title of the video that triggered the gate, recorded on the lead. */
  videoTitle?: string;
}

const VideoGateDialog = ({ open, onOpenChange, onUnlock, videoTitle }: Props) => {
  // A visitor who identified at a lighter gate still owes us the other eight
  // fields, but there is no reason to make them retype the two we hold.
  const saved = getLeadIdentity();
  const [form, setForm] = useState({
    ...EMPTY,
    firstName: saved?.firstName ?? "",
    email: saved?.email ?? "",
  });
  const [hp, setHp] = useState("");            // honeypot — bots fill it, people can't see it
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);

  // One instance of this dialog serves every video on a page, so opening it
  // again would otherwise show the last attempt: a half-filled form and an
  // error message about a video the visitor is no longer looking at.
  useEffect(() => {
    if (!open) return;
    const id = getLeadIdentity();
    setForm({ ...EMPTY, firstName: id?.firstName ?? "", email: id?.email ?? "" });
    setError("");
    setHp("");
    setSending(false);
  }, [open]);

  const set =
    (k: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((prev) => ({ ...prev, [k]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (sending) return;
    if (hp) return;                            // silent drop: only a bot got here
    for (const [k, label] of REQUIRED) {
      if (!form[k].trim()) { setError(`Please fill in: ${label}.`); return; }
    }
    if (!isEmail(form.email)) { setError("Please enter a valid email address."); return; }
    setError("");
    setSending(true);

    const trimmed = Object.fromEntries(
      Object.entries(form).map(([k, v]) => [k, v.trim()]),
    ) as typeof EMPTY;

    await submitLead("video-access", {
      ...trimmed,
      subject: videoTitle ? `Video access: ${videoTitle}` : "Video access",
    });
    rememberLeadEmail(trimmed.email);
    saveLeadIdentity({ firstName: trimmed.firstName, email: trimmed.email });
    saveVideoAccess();

    setSending(false);
    onUnlock();
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      {/* The dialog itself does not scroll: the shared DialogContent renders its
          ✕ button absolutely inside this box, so scrolling here would carry the
          close button off screen. Ten fields on a phone always overflow, so the
          body below scrolls instead and ✕ stays where the visitor left it. */}
      <DialogContent className="sm:max-w-2xl max-h-[90vh] overflow-hidden rounded-3xl bg-white p-0">
        <div className="max-h-[90vh] overflow-y-auto p-6 grid gap-4">
          <DialogHeader>
            <DialogTitle className="font-display text-2xl flex items-center gap-2">
              <PlayCircle className="w-5 h-5 text-primary" /> Watch the video
            </DialogTitle>
            <DialogDescription>
              Tell us who you are and {videoTitle ? `"${videoTitle}"` : "the video"} starts
              playing. We only ask once — every video after this one plays right away.
            </DialogDescription>
          </DialogHeader>

          <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" noValidate>
            {/* Honeypot — hidden from users */}
            <input
              type="text" name="company_website" tabIndex={-1} autoComplete="off"
              value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" aria-hidden="true"
            />

            <FloatingInput id="vg-first" label="First name" required icon={User} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
            <FloatingInput id="vg-last" label="Last name" required icon={User} value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
            <FloatingInput id="vg-mobile" label="Mobile number" required type="tel" icon={Phone} value={form.mobile} onChange={set("mobile")} autoComplete="tel" />
            <FloatingInput id="vg-city" label="City" required icon={MapPin} value={form.city} onChange={set("city")} autoComplete="address-level2" />
            <FloatingInput id="vg-zip" label="Zip code" required icon={Hash} value={form.zip} onChange={set("zip")} autoComplete="postal-code" inputMode="numeric" />
            <FloatingInput id="vg-company" label="Company or organization" required icon={Building2} value={form.company} onChange={set("company")} autoComplete="organization" />
            <FloatingInput id="vg-email" label="Email" required type="email" icon={Mail} value={form.email} onChange={set("email")} autoComplete="email" />
            <FloatingInput id="vg-title" label="Title" required icon={Briefcase} value={form.title} onChange={set("title")} autoComplete="organization-title" />
            <FloatingInput id="vg-department" label="Department" required icon={Layers} value={form.department} onChange={set("department")} />
            <FloatingSelect id="vg-industry" label="Industry" required icon={Factory} value={form.industry} onChange={set("industry")} placeholder="Select industry…">
              {INDUSTRIES.map((t) => <option key={t} value={t}>{t}</option>)}
            </FloatingSelect>

            {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}

            <Button type="submit" variant="hero" className="sm:col-span-2 w-full rounded-xl" disabled={sending}>
              {sending
                ? (<><Loader2 className="w-4 h-4 animate-spin" /> Unlocking…</>)
                : (<><PlayCircle className="w-4 h-4" /> Watch now</>)}
            </Button>
            <p className="sm:col-span-2 text-[11px] leading-snug text-muted-foreground text-center">
              Every field is required — type "n/a" for anything that doesn't apply to you.
              We'll send occasional EV news and updates. Unsubscribe anytime.
            </p>
          </form>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default VideoGateDialog;
