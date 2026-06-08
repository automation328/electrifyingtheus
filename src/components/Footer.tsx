import { useState, type ComponentType } from "react";
import { Link } from "react-router-dom";
import {
  CheckCircle2, Loader2, ArrowRight, Mail, Zap, ChevronDown,
  User, Phone, MapPin, Building2, Briefcase, Network, Factory,
} from "lucide-react";
import logo from "@/assets/logo-white.png";
import { submitLead } from "@/lib/submitLead";

const EMPTY = {
  firstName: "", lastName: "", email: "", mobile: "",
  zip: "", company: "", title: "", department: "", industry: "",
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

// Transparent, white-outlined field on the blue footer.
const fieldCls =
  "w-full rounded-xl border border-white/30 bg-transparent pl-10 pr-3 py-3 text-sm text-white placeholder:text-white/60 outline-none transition focus:border-white focus:bg-white/10 focus:ring-2 focus:ring-white/25";

const Footer = () => {
  const [form, setForm] = useState(EMPTY);
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(false);

  const set =
    (key: keyof typeof EMPTY) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) =>
      setForm((f) => ({ ...f, [key]: e.target.value }));

  const onSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.firstName.trim() || !form.lastName.trim()) {
      setError("Please enter your first and last name.");
      return;
    }
    if (!isValidEmail(form.email)) {
      setError("Please enter a valid email address.");
      return;
    }
    setError("");
    setSubmitting(true);

    await submitLead("newsletter", form);

    setSubmitting(false);
    setSubmitted(true);
  };

  // Label-less iconed field — white leading icon + transparent input.
  const Field = ({
    icon: Icon, full, children,
  }: {
    icon: ComponentType<{ className?: string }>;
    full?: boolean; children: React.ReactNode;
  }) => (
    <div className={`relative ${full ? "sm:col-span-2" : ""}`}>
      <Icon className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none z-10" />
      {children}
    </div>
  );

  const navLink = "text-white/65 hover:text-white text-sm transition-colors footer-link";

  return (
    <footer className="gradient-primary relative overflow-hidden text-white">
      <div className="container py-16 md:py-20">
        <div className="grid lg:grid-cols-12 gap-12 lg:gap-10">
          {/* Brand + nav */}
          <div className="lg:col-span-7">
            <img src={logo} alt="Electrifying the US" className="h-16 w-auto mb-5" />
            <p className="text-white/70 text-sm max-w-sm leading-relaxed mb-5">
              Transforming how America moves toward a zero-emission and clean-energy future —
              from EVs and e-bikes to electric buses, eVTOLs, and beyond.
            </p>
            <a
              href="mailto:info@electrifyingtheus.com"
              className="inline-flex items-center gap-2 text-sm text-white/80 hover:text-white transition-colors footer-link mb-10"
            >
              <Mail className="w-4 h-4" /> info@electrifyingtheus.com
            </a>

            <div className="grid sm:grid-cols-3 gap-8 mt-2">
              <div>
                <h4 className="font-display font-bold text-white mb-4 text-sm tracking-wide">Quick Links</h4>
                <div className="flex flex-col gap-2.5">
                  {["About", "EV Dashboard", "EV 101", "Benefits", "Multimodal", "Contact"].map((l) => (
                    <a
                      key={l}
                      href={l === "Contact" ? "/contact-us" : `#${l.toLowerCase().replace(/ /g, "")}`}
                      className={navLink}
                    >
                      {l}
                    </a>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-display font-bold text-white mb-4 text-sm tracking-wide">Resources</h4>
                <div className="flex flex-col gap-2.5">
                  {[
                    { label: "News", to: "/news" },
                    { label: "Events", to: "/events" },
                    { label: "Careers", to: "/careers" },
                    { label: "EV vs Gas", to: "/electricity-vs-gasoline" },
                    { label: "Talk to EVan", to: "/assistant" },
                  ].map((l) => (
                    <Link key={l.to} to={l.to} className={navLink}>
                      {l.label}
                    </Link>
                  ))}
                </div>
              </div>

              <div>
                <h4 className="font-display font-bold text-white mb-4 text-sm tracking-wide">Partner Sites</h4>
                <div className="flex flex-col gap-2.5">
                  <a href="https://www.electrifyingva.com/" target="_blank" rel="noopener noreferrer" className={navLink}>
                    Electrifying Virginia
                  </a>
                  <a href="https://www.electrifyingmi.com/" target="_blank" rel="noopener noreferrer" className={navLink}>
                    Electrifying Michigan
                  </a>
                  <Link to="/find-a-charger" className={navLink}>
                    Find Charging Stations
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Signup */}
          <div className="lg:col-span-5">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 border border-white/20 text-white text-xs font-semibold mb-3 backdrop-blur">
              <Zap className="w-3.5 h-3.5" /> Newsletter
            </span>
            <h3 className="font-display font-bold text-2xl md:text-3xl text-white leading-tight mb-2">
              Stay Charged
            </h3>
            <p className="text-white/70 text-sm mb-6 max-w-md">
              Join the movement — EV news, incentives, and program updates, straight to your inbox.
            </p>

            {submitted ? (
              <div className="flex flex-col items-center text-center py-10 rounded-2xl border border-white/20 bg-white/5">
                <span className="grid place-items-center w-14 h-14 rounded-2xl bg-white/15 mb-4">
                  <CheckCircle2 className="w-8 h-8 text-white" />
                </span>
                <p className="font-display font-bold text-white text-xl">You're on the list!</p>
                <p className="text-white/70 text-sm mt-1.5 max-w-xs">
                  Thanks, {form.firstName || "friend"}. We'll keep you posted on EV news and incentives.
                </p>
              </div>
            ) : (
              <form onSubmit={onSubmit} className="grid grid-cols-1 sm:grid-cols-2 gap-3" noValidate>
                <Field icon={User}>
                  <input className={fieldCls} value={form.firstName} onChange={set("firstName")} autoComplete="given-name" placeholder="First name *" aria-label="First name" />
                </Field>
                <Field icon={User}>
                  <input className={fieldCls} value={form.lastName} onChange={set("lastName")} autoComplete="family-name" placeholder="Last name *" aria-label="Last name" />
                </Field>

                <Field icon={Mail} full>
                  <input type="email" className={fieldCls} value={form.email} onChange={set("email")} autoComplete="email" placeholder="Email *" aria-label="Email" />
                </Field>

                <Field icon={Phone}>
                  <input type="tel" className={fieldCls} value={form.mobile} onChange={set("mobile")} autoComplete="tel" placeholder="Mobile number" aria-label="Mobile number" />
                </Field>
                <Field icon={MapPin}>
                  <input inputMode="numeric" className={fieldCls} value={form.zip} onChange={set("zip")} autoComplete="postal-code" placeholder="ZIP code" aria-label="ZIP code" />
                </Field>

                <Field icon={Building2} full>
                  <input className={fieldCls} value={form.company} onChange={set("company")} autoComplete="organization" placeholder="Company or organization" aria-label="Company or organization" />
                </Field>

                <Field icon={Briefcase}>
                  <input className={fieldCls} value={form.title} onChange={set("title")} autoComplete="organization-title" placeholder="Title" aria-label="Title" />
                </Field>
                <Field icon={Network}>
                  <input className={fieldCls} value={form.department} onChange={set("department")} placeholder="Department" aria-label="Department" />
                </Field>

                <Field icon={Factory} full>
                  <select
                    className={`${fieldCls} pr-10 appearance-none cursor-pointer ${form.industry ? "text-white" : "text-white/60"}`}
                    value={form.industry}
                    onChange={set("industry")}
                    aria-label="Industry"
                  >
                    <option value="" className="text-slate-900">Industry</option>
                    {INDUSTRIES.map((i) => (
                      <option key={i} value={i} className="text-slate-900">{i}</option>
                    ))}
                  </select>
                  <ChevronDown className="absolute right-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-white/70 pointer-events-none" />
                </Field>

                {error && <p className="sm:col-span-2 text-sm text-red-200">{error}</p>}

                <button
                  type="submit"
                  disabled={submitting}
                  className="sm:col-span-2 mt-1 inline-flex items-center justify-center gap-2 rounded-xl gradient-green text-white font-bold text-sm px-5 py-3.5 shadow-lg hover:brightness-110 hover:shadow-xl transition disabled:opacity-60"
                >
                  {submitting ? (
                    <><Loader2 className="w-4 h-4 animate-spin" /> Submitting…</>
                  ) : (
                    <>Subscribe <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>

                <p className="sm:col-span-2 text-[11px] text-white/55 leading-relaxed">
                  By subscribing you agree to receive updates from Electrifying the US. We never sell your data.
                </p>
              </form>
            )}
          </div>
        </div>

        {/* Bottom bar */}
        <div className="border-t border-white/15 mt-14 pt-6 flex flex-col sm:flex-row items-center justify-between gap-3">
          <p className="text-white/50 text-sm">
            © {new Date().getFullYear()} Electrifying The US. All rights reserved.
          </p>
          <div className="flex items-center gap-6">
            <Link to="/privacy-policy" className="text-white/65 hover:text-white text-sm transition-colors footer-link">
              Privacy Policy
            </Link>
            <Link to="/terms" className="text-white/65 hover:text-white text-sm transition-colors footer-link">
              Terms &amp; Conditions
            </Link>
          </div>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
