import { useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  Mail, Handshake, Sparkles, CalendarDays, Send, CheckCircle2, Loader2,
  ArrowRight, MessageSquare,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

const EMPTY = { firstName: "", lastName: "", email: "", company: "", topic: "General question", message: "" };

const TOPICS = [
  "General question",
  "Partner with us",
  "Add EVan / EV tools to my site",
  "List an event",
  "Post a job",
  "Press / media",
];

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const CONTACT_WEBHOOK =
  (import.meta as { env?: Record<string, string> }).env?.VITE_CONTACT_WEBHOOK_URL ??
  (import.meta as { env?: Record<string, string> }).env?.VITE_N8N_WEBHOOK_URL;

const REASONS: { icon: ComponentType<{ className?: string }>; title: string; text: string }[] = [
  { icon: Handshake, title: "Partner with us", text: "Utilities, automakers, employers, labor, and community groups — let's collaborate." },
  { icon: Sparkles, title: "Put EVan on your site", text: "Add the E-Mobility Concierge and EV tools to your own website." },
  { icon: CalendarDays, title: "List an event or job", text: "Get your e-mobility event or open role in front of a national audience." },
];

const ContactUs = () => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("Please enter your first and last name."); return; }
    if (!isValidEmail(form.email)) { setError("Please enter a valid email address."); return; }
    if (!form.message.trim()) { setError("Please add a short message."); return; }
    setError("");
    setSubmitting(true);
    if (CONTACT_WEBHOOK) {
      try {
        await fetch(CONTACT_WEBHOOK, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ action: "contact", ...form }),
        });
      } catch { /* non-blocking */ }
    }
    setSubmitting(false);
    setSubmitted(true);
  };

  const inputCls =
    "w-full rounded-xl border border-border bg-background px-3.5 py-3 text-sm text-foreground placeholder:text-muted-foreground outline-none transition focus:border-primary focus:ring-2 focus:ring-primary/20";
  const labelCls = "block text-xs font-medium text-muted-foreground mb-1.5";

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-20">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
                Get In Touch
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
                Contact <span className="text-gradient-primary">Us</span>
              </h1>
              <p className="text-muted-foreground text-lg">
                Have questions about EVs, want EVan on your own site, or want to partner with us?
                We'd love to hear from you.
              </p>
            </div>
          </div>
        </section>

        <div className="container px-4 max-w-5xl mt-12">
          <div className="grid lg:grid-cols-5 gap-8 items-start">
            {/* Info column */}
            <div className="lg:col-span-2 space-y-4">
              <a
                href="mailto:info@electrifyingtheus.com"
                className="group flex items-center gap-4 rounded-2xl border border-border bg-card p-5 hover:border-primary/30 hover:shadow-md transition-all"
              >
                <span className="grid place-items-center w-11 h-11 rounded-xl gradient-primary shrink-0">
                  <Mail className="w-5 h-5 text-primary-foreground" />
                </span>
                <div>
                  <p className="font-semibold text-foreground text-sm">Email us</p>
                  <p className="text-sm text-primary group-hover:underline">info@electrifyingtheus.com</p>
                </div>
              </a>

              {REASONS.map((r) => (
                <div key={r.title} className="flex items-start gap-4 rounded-2xl border border-border bg-card p-5">
                  <span className="grid place-items-center w-11 h-11 rounded-xl bg-primary/10 shrink-0">
                    <r.icon className="w-5 h-5 text-primary" />
                  </span>
                  <div>
                    <p className="font-semibold text-foreground text-sm">{r.title}</p>
                    <p className="text-sm text-muted-foreground mt-0.5 leading-relaxed">{r.text}</p>
                  </div>
                </div>
              ))}

              <div className="rounded-2xl gradient-hero text-primary-foreground p-5">
                <p className="font-display font-bold flex items-center gap-2"><MessageSquare className="w-4 h-4" /> Prefer to chat?</p>
                <p className="text-sm text-primary-foreground/90 mt-1 mb-3">Ask EVan, our E-Mobility Concierge, anything about EVs.</p>
                <Link to="/assistant" className="inline-flex items-center gap-2 bg-primary-foreground text-primary font-semibold text-sm px-4 py-2 rounded-lg hover:opacity-90 transition">
                  Talk to EVan <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </div>

            {/* Form column */}
            <div className="lg:col-span-3">
              <div className="relative rounded-3xl border border-border bg-card shadow-elevated overflow-hidden">
                <div className="h-1 w-full gradient-hero" aria-hidden />
                <div className="p-6 md:p-8">
                  {submitted ? (
                    <div className="flex flex-col items-center text-center py-12">
                      <span className="grid place-items-center w-16 h-16 rounded-2xl bg-secondary/10 mb-4">
                        <CheckCircle2 className="w-9 h-9 text-secondary" />
                      </span>
                      <h2 className="font-display font-bold text-foreground text-2xl">Thanks, {form.firstName || "there"}!</h2>
                      <p className="text-muted-foreground mt-2 max-w-sm">
                        Your message is on its way. We'll get back to you at <span className="font-medium text-foreground">{form.email}</span> soon.
                      </p>
                    </div>
                  ) : (
                    <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-4" noValidate>
                      <div>
                        <label htmlFor="c-first" className={labelCls}>First name *</label>
                        <input id="c-first" className={inputCls} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" placeholder="Jane" />
                      </div>
                      <div>
                        <label htmlFor="c-last" className={labelCls}>Last name *</label>
                        <input id="c-last" className={inputCls} value={form.lastName} onChange={set("lastName")} autoComplete="family-name" placeholder="Doe" />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="c-email" className={labelCls}>Email *</label>
                        <input id="c-email" type="email" className={inputCls} value={form.email} onChange={set("email")} autoComplete="email" placeholder="jane@company.com" />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="c-company" className={labelCls}>Company or organization</label>
                        <input id="c-company" className={inputCls} value={form.company} onChange={set("company")} autoComplete="organization" placeholder="Acme Utilities" />
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="c-topic" className={labelCls}>What can we help with?</label>
                        <select id="c-topic" className={`${inputCls} cursor-pointer`} value={form.topic} onChange={set("topic")}>
                          {TOPICS.map((t) => <option key={t} value={t}>{t}</option>)}
                        </select>
                      </div>
                      <div className="sm:col-span-2">
                        <label htmlFor="c-message" className={labelCls}>Message *</label>
                        <textarea id="c-message" rows={5} className={`${inputCls} resize-y`} value={form.message} onChange={set("message")} placeholder="Tell us a bit about what you're looking for…" />
                      </div>

                      {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}

                      <button
                        type="submit"
                        disabled={submitting}
                        className="sm:col-span-2 inline-flex items-center justify-center gap-2 rounded-xl gradient-primary text-primary-foreground font-semibold text-sm px-5 py-3.5 hover:opacity-90 transition disabled:opacity-60"
                      >
                        {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>) : (<><Send className="w-4 h-4" /> Send message</>)}
                      </button>
                      <p className="sm:col-span-2 text-[11px] text-muted-foreground leading-relaxed">
                        By submitting you agree to be contacted by Electrifying the US. We never sell your data.
                      </p>
                    </form>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContactUs;
