import { useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  Megaphone, User, Building2, CalendarDays, MapPin, Globe, Image as ImageIcon,
  Upload, X, Send, Loader2, CheckCircle2, Monitor, Users, Boxes, ArrowRight,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

// Text fields live in one object; choice/file/consent state is held separately.
const EMPTY = {
  firstName: "", lastName: "", email: "", mobile: "", city: "", zip: "",
  title: "", company: "", department: "", industry: "",
  eventTitle: "", eventLocation: "", eventStartDate: "", eventEndDate: "", eventTime: "",
  eventDescription: "", eventWebsite: "", eventVenue: "",
};

type Field = keyof typeof EMPTY;

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

// Posts the event submission. Prefers a dedicated event webhook, falling back to
// the shared n8n flow. Sent as multipart/form-data so image files come along.
const EVENT_WEBHOOK =
  (import.meta as { env?: Record<string, string> }).env?.VITE_EVENT_WEBHOOK_URL ??
  (import.meta as { env?: Record<string, string> }).env?.VITE_CONTACT_WEBHOOK_URL ??
  (import.meta as { env?: Record<string, string> }).env?.VITE_N8N_WEBHOOK_URL;

const FORMATS = [
  { value: "In Person", icon: Users, desc: "Attendees gather at a physical venue." },
  { value: "Virtual", icon: Monitor, desc: "Fully online — webinar or livestream." },
  { value: "Hybrid", icon: Boxes, desc: "Both in-person and online attendance." },
  { value: "Other", icon: MapPin, desc: "Something else — describe it below." },
];

const MAX_FILES = 3;
const OK_TYPES = ["image/png", "image/jpeg"];

const ListYourEvent = () => {
  const [form, setForm] = useState(EMPTY);
  const [eventFormat, setEventFormat] = useState("");
  const [files, setFiles] = useState<File[]>([]);
  const [rightToShare, setRightToShare] = useState<"" | "Yes" | "No">("");
  const [marketingConsent, setMarketingConsent] = useState(false);
  const [notRobot, setNotRobot] = useState(false);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);

  const set =
    (key: Field) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const addFiles = (incoming: FileList | null) => {
    if (!incoming) return;
    const picked = Array.from(incoming);
    const bad = picked.find((f) => !OK_TYPES.includes(f.type));
    if (bad) { setError("Images must be JPG or PNG only."); return; }
    setError("");
    setFiles((prev) => [...prev, ...picked].slice(0, MAX_FILES));
  };

  const removeFile = (idx: number) =>
    setFiles((prev) => prev.filter((_, i) => i !== idx));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!isValidEmail(form.email)) { setError("Please enter a valid email address."); return; }
    const required: [string, string][] = [
      [form.title, "your title"],
      [form.company, "your company or organization"],
      [form.department, "your department"],
      [form.industry, "your industry"],
      [form.eventTitle, "the event title"],
      [form.eventLocation, "the event location / address"],
      [form.eventDescription, "an event description"],
      [form.eventWebsite, "the event website / registration link"],
      [form.eventVenue, "the event venue or platform"],
    ];
    const missing = required.find(([v]) => !v.trim());
    if (missing) { setError(`Please add ${missing[1]}.`); return; }
    if (!eventFormat) { setError("Please choose the event format."); return; }
    if (rightToShare !== "Yes") { setError("We can only list events you have the right to share. Please confirm with “Yes”."); return; }
    if (!notRobot) { setError("Please confirm you're not a robot."); return; }

    setError("");
    setSubmitting(true);

    const fd = new FormData();
    fd.append("action", "listEvent");
    (Object.keys(form) as Field[]).forEach((k) => fd.append(k, form[k]));
    fd.append("eventFormat", eventFormat);
    fd.append("rightToShare", rightToShare);
    fd.append("marketingConsent", String(marketingConsent));
    files.forEach((f, i) => fd.append(`image_${i + 1}`, f, f.name));

    if (EVENT_WEBHOOK) {
      try {
        await fetch(EVENT_WEBHOOK, { method: "POST", body: fd });
      } catch { /* non-blocking — still confirm to the user */ }
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
                <Megaphone className="w-4 h-4" /> List Your Event
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
                Request to <span className="text-gradient-primary">List Your Event</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Get your e-mobility event in front of an engaged national audience — Ride &amp; Drives,
                webinars, charging demos, AV events, workshops, and more. Tell us the details and we'll
                review your submission.
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
                    Thanks, {form.firstName || "there"}! Your event is in review.
                  </h2>
                  <p className="text-muted-foreground mt-2 max-w-md">
                    We received <span className="font-medium text-foreground">{form.eventTitle}</span> and
                    will email <span className="font-medium text-foreground">{form.email}</span> once it's
                    approved for listing.
                  </p>
                  <div className="flex flex-wrap gap-3 justify-center mt-6">
                    <Link to="/events" className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold text-sm px-5 py-3 rounded-xl hover:opacity-90 transition">
                      Back to Events <ArrowRight className="w-4 h-4" />
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
                        <label className={labelCls}>First name</label>
                        <input className={inputCls} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" placeholder="Jane" />
                      </div>
                      <div>
                        <label className={labelCls}>Last name</label>
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
                        <label className={labelCls}>City</label>
                        <input className={inputCls} value={form.city} onChange={set("city")} autoComplete="address-level2" placeholder="Atlanta" />
                      </div>
                      <div>
                        <label className={labelCls}>Zip code</label>
                        <input className={inputCls} value={form.zip} onChange={set("zip")} autoComplete="postal-code" placeholder="30301" />
                      </div>
                      <div>
                        <label className={labelCls}>Title {reqStar}</label>
                        <input className={inputCls} value={form.title} onChange={set("title")} autoComplete="organization-title" placeholder="Events Manager" />
                      </div>
                      <div>
                        <label className={labelCls}>Company or organization {reqStar}</label>
                        <input className={inputCls} value={form.company} onChange={set("company")} autoComplete="organization" placeholder="Acme Utilities" />
                      </div>
                      <div>
                        <label className={labelCls}>Department {reqStar}</label>
                        <input className={inputCls} value={form.department} onChange={set("department")} placeholder="Marketing" />
                      </div>
                      <div>
                        <label className={labelCls}>Industry {reqStar}</label>
                        <input className={inputCls} value={form.industry} onChange={set("industry")} placeholder="Energy / Utilities" />
                      </div>
                    </div>
                  </section>

                  {/* ── Event details ── */}
                  <section>
                    <h2 className="flex items-center gap-2 font-display font-bold text-foreground text-lg mb-4">
                      <CalendarDays className="w-4 h-4 text-primary" /> Event details
                    </h2>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      <div>
                        <label className={labelCls}>Event title {reqStar}</label>
                        <input className={inputCls} value={form.eventTitle} onChange={set("eventTitle")} placeholder="EV Ride & Drive — Downtown" />
                      </div>
                      <div>
                        <label className={labelCls}>Event location / address {reqStar}</label>
                        <input className={inputCls} value={form.eventLocation} onChange={set("eventLocation")} placeholder="123 Main St, Atlanta, GA" />
                      </div>
                      <div>
                        <label className={labelCls}>Event start date</label>
                        <input type="date" className={inputCls} value={form.eventStartDate} onChange={set("eventStartDate")} />
                      </div>
                      <div>
                        <label className={labelCls}>Event end date</label>
                        <input type="date" className={inputCls} value={form.eventEndDate} onChange={set("eventEndDate")} />
                      </div>
                      <div className="sm:col-span-2">
                        <label className={labelCls}>Event time</label>
                        <input type="text" className={inputCls} value={form.eventTime} onChange={set("eventTime")} placeholder="10:00 AM – 2:00 PM EST" />
                      </div>
                    </div>

                    {/* Event format (radio cards) */}
                    <div className="mt-4">
                      <label className={labelCls}>Event format {reqStar}</label>
                      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5">
                        {FORMATS.map((f) => {
                          const active = eventFormat === f.value;
                          return (
                            <button
                              key={f.value}
                              type="button"
                              onClick={() => setEventFormat(f.value)}
                              title={f.desc}
                              className={`flex flex-col items-center gap-1.5 rounded-xl border p-3 text-sm font-medium transition ${
                                active
                                  ? "border-primary bg-primary/10 text-primary ring-2 ring-primary/20"
                                  : "border-border bg-background text-foreground hover:border-primary/40"
                              }`}
                            >
                              <f.icon className="w-5 h-5" />
                              {f.value}
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    <div className="mt-4">
                      <label className={labelCls}>Event description {reqStar}</label>
                      <textarea rows={5} className={`${inputCls} resize-y`} value={form.eventDescription} onChange={set("eventDescription")} placeholder="What is the event about? Who is it for? What can attendees expect?" />
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mt-4">
                      <div>
                        <label className={labelCls}>Event website / registration link {reqStar}</label>
                        <input type="url" className={inputCls} value={form.eventWebsite} onChange={set("eventWebsite")} placeholder="https://example.com/register" />
                      </div>
                      <div>
                        <label className={labelCls}>Event venue or platform {reqStar}</label>
                        <input className={inputCls} value={form.eventVenue} onChange={set("eventVenue")} placeholder="Georgia World Congress Center / Zoom" />
                      </div>
                    </div>
                  </section>

                  {/* ── Event image / logo ── */}
                  <section>
                    <h2 className="flex items-center gap-2 font-display font-bold text-foreground text-lg mb-2">
                      <ImageIcon className="w-4 h-4 text-primary" /> Event image / logo
                    </h2>
                    <p className="text-xs text-muted-foreground mb-3">
                      Please upload your image in <span className="font-semibold text-foreground">JPG or PNG</span> format only.
                      Other file types will not be accepted. Max {MAX_FILES} files.
                    </p>
                    <button
                      type="button"
                      onClick={() => fileInput.current?.click()}
                      className="w-full rounded-2xl border-2 border-dashed border-border hover:border-primary/50 bg-background transition p-6 text-center"
                    >
                      <Upload className="w-6 h-6 mx-auto text-primary mb-2" />
                      <span className="block text-sm font-medium text-foreground">Click to upload</span>
                      <span className="block text-xs text-muted-foreground mt-1">PNG, JPEG or JPG · max {MAX_FILES} files</span>
                    </button>
                    <input
                      ref={fileInput}
                      type="file"
                      accept="image/png,image/jpeg"
                      multiple
                      className="hidden"
                      onChange={(e) => { addFiles(e.target.files); e.target.value = ""; }}
                    />
                    {files.length > 0 && (
                      <ul className="mt-3 space-y-2">
                        {files.map((f, i) => (
                          <li key={`${f.name}-${i}`} className="flex items-center justify-between gap-3 rounded-xl border border-border bg-background px-3.5 py-2.5">
                            <span className="flex items-center gap-2 text-sm text-foreground truncate">
                              <ImageIcon className="w-4 h-4 text-primary shrink-0" /> <span className="truncate">{f.name}</span>
                            </span>
                            <button type="button" onClick={() => removeFile(i)} aria-label={`Remove ${f.name}`} className="text-muted-foreground hover:text-red-500 transition shrink-0">
                              <X className="w-4 h-4" />
                            </button>
                          </li>
                        ))}
                      </ul>
                    )}
                  </section>

                  {/* ── Permissions & consent ── */}
                  <section className="space-y-4">
                    <div>
                      <label className={labelCls}>
                        I confirm I have the right to share this event and give permission to include it on our
                        public website and promotional materials {reqStar}
                      </label>
                      <div className="flex gap-2.5 mt-1">
                        {(["Yes", "No"] as const).map((v) => (
                          <button
                            key={v}
                            type="button"
                            onClick={() => setRightToShare(v)}
                            className={`px-5 py-2 rounded-xl border text-sm font-semibold transition ${
                              rightToShare === v
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
                    {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>) : (<><Send className="w-4 h-4" /> Submit event</>)}
                  </button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    Electrifying the US reviews and reserves the right to approve or decline event listings.
                    Submitting does not guarantee a listing.
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

export default ListYourEvent;
