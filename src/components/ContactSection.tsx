import { useState } from "react";
import {
  Send, CheckCircle2, Loader2, User, Mail, Phone, MapPin, Hash,
  Building2, Briefcase, Layers, Factory, Tag, MessageSquare, Sparkles,
} from "lucide-react";
import { submitLead } from "@/lib/submitLead";
import { FloatingInput, FloatingSelect, FloatingTextarea } from "@/components/forms/FloatingField";

const EMPTY = {
  firstName: "", lastName: "", email: "", mobile: "",
  city: "", zip: "", company: "", title: "",
  department: "", industry: "", subject: "", message: "",
};

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

const isValidEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v.trim());

const ContactSection = () => {
  const [form, setForm] = useState(EMPTY);
  const [hp, setHp] = useState(""); // honeypot — bots fill this, humans never see it
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hp) return; // silently drop bots
    if (!form.firstName.trim() || !form.lastName.trim()) { setError("Please enter your first and last name."); return; }
    if (!isValidEmail(form.email)) { setError("Please enter a valid email address."); return; }
    if (!form.mobile.trim()) { setError("Please enter your mobile number."); return; }
    if (!form.company.trim() || !form.title.trim() || !form.department.trim() || !form.industry) {
      setError("Please complete your company, title, department, and industry.");
      return;
    }
    if (!form.subject.trim()) { setError("Please add a subject or reason for contacting us."); return; }
    if (!form.message.trim()) { setError("Please add a short message."); return; }
    setError("");
    setSubmitting(true);
    await submitLead("homepage-contact", form);
    setSubmitting(false);
    setSubmitted(true);
  };

  return (
    <section id="contact" className="py-20 md:py-28">
      <div className="container">
        <div className="max-w-2xl mx-auto">
          <div className="text-center mb-12">
            <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              <Sparkles className="w-3.5 h-3.5" /> Get In Touch
            </span>
            <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
              Contact <span className="text-gradient-primary">Us</span>
            </h2>
            <p className="text-muted-foreground text-lg">
              Have questions about EVs or want to partner with us? We'd love to hear from you.
            </p>
          </div>

          <div className="relative rounded-[1.75rem] border border-border bg-card shadow-elevated overflow-hidden">
            <div className="h-1.5 w-full gradient-hero" aria-hidden />
            <div className="p-6 md:p-9">
              {submitted ? (
                <div className="flex flex-col items-center text-center py-12">
                  <span className="grid place-items-center w-16 h-16 rounded-2xl bg-secondary/10 mb-4">
                    <CheckCircle2 className="w-9 h-9 text-secondary" />
                  </span>
                  <h3 className="font-display font-bold text-foreground text-2xl">Thanks, {form.firstName || "there"}!</h3>
                  <p className="text-muted-foreground mt-2 max-w-sm">
                    Your message is on its way. We'll get back to you at{" "}
                    <span className="font-medium text-foreground">{form.email}</span> soon.
                  </p>
                </div>
              ) : (
                <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3.5" noValidate>
                  {/* Honeypot — hidden from users */}
                  <input
                    type="text" name="company_website" tabIndex={-1} autoComplete="off"
                    value={hp} onChange={(e) => setHp(e.target.value)} className="hidden" aria-hidden="true"
                  />

                  <FloatingInput id="h-first" label="First name" required icon={User} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" />
                  <FloatingInput id="h-last" label="Last name" required icon={User} value={form.lastName} onChange={set("lastName")} autoComplete="family-name" />
                  <FloatingInput id="h-email" label="Email" required type="email" icon={Mail} value={form.email} onChange={set("email")} autoComplete="email" />
                  <FloatingInput id="h-mobile" label="Mobile number" required type="tel" icon={Phone} value={form.mobile} onChange={set("mobile")} autoComplete="tel" />
                  <FloatingInput id="h-city" label="City" icon={MapPin} value={form.city} onChange={set("city")} autoComplete="address-level2" />
                  <FloatingInput id="h-zip" label="Zip code" icon={Hash} value={form.zip} onChange={set("zip")} autoComplete="postal-code" inputMode="numeric" />
                  <FloatingInput id="h-company" label="Company or organization" required icon={Building2} value={form.company} onChange={set("company")} autoComplete="organization" />
                  <FloatingInput id="h-title" label="Title" required icon={Briefcase} value={form.title} onChange={set("title")} autoComplete="organization-title" />
                  <FloatingInput id="h-department" label="Department" required icon={Layers} value={form.department} onChange={set("department")} />
                  <FloatingSelect id="h-industry" label="Industry" required icon={Factory} value={form.industry} onChange={set("industry")} placeholder="Select industry…">
                    {INDUSTRIES.map((t) => <option key={t} value={t}>{t}</option>)}
                  </FloatingSelect>
                  <FloatingInput id="h-subject" label="Subject or reason for contacting Electrifying the US" required icon={Tag} className="sm:col-span-2" value={form.subject} onChange={set("subject")} />
                  <FloatingTextarea id="h-message" label="Leave us a message" required icon={MessageSquare} className="sm:col-span-2" rows={5} value={form.message} onChange={set("message")} />

                  {error && <p className="sm:col-span-2 text-sm text-red-500">{error}</p>}

                  <button
                    type="submit"
                    disabled={submitting}
                    className="sm:col-span-2 group inline-flex items-center justify-center gap-2 rounded-2xl gradient-primary text-primary-foreground font-semibold px-5 py-4 shadow-md hover:shadow-lg hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-60 disabled:hover:translate-y-0"
                  >
                    {submitting ? (<><Loader2 className="w-4 h-4 animate-spin" /> Sending…</>) : (<><Send className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" /> Send message</>)}
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
    </section>
  );
};

export default ContactSection;
