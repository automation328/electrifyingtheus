import { Check, Building2, ArrowUpRight, Zap } from "lucide-react";
import evFamily from "@/assets/ev-family.jpg";

const features = [
  "Hands-On EV Ride & Drive Experiences",
  "Cutting-Edge Mobility Research & Analysis",
  "E-Mobility Workforce Upskilling & Economic Inclusion",
  "Public Health Education — Zero Emission Mobility",
  "Multi-Channel Digital Education & Engagement",
  "Strategic Data Collection & Analysis",
];

const partners = ["Utilities", "Automakers", "Community Orgs", "Labor Unions"];

const AboutSection = () => {
  return (
    <section id="about" className="relative overflow-hidden pt-6 md:pt-10 pb-20 md:pb-28">
      {/* Soft brand glow */}
      <div aria-hidden className="pointer-events-none absolute inset-0 -z-10">
        <div className="absolute -left-24 top-8 h-72 w-72 rounded-full blur-3xl" style={{ background: "hsl(var(--primary) / 0.06)" }} />
        <div className="absolute -right-24 bottom-0 h-72 w-72 rounded-full blur-3xl" style={{ background: "hsl(var(--secondary) / 0.06)" }} />
      </div>

      <div className="container">
        <div className="grid items-center gap-12 lg:grid-cols-2 lg:gap-16">
          {/* Image */}
          <div className="relative animate-fade-up">
            <div className="relative overflow-hidden rounded-[28px] shadow-elevated ring-1 ring-border">
              <img
                src={evFamily}
                alt="Family enjoying an electric vehicle"
                className="h-full w-full object-cover"
                loading="lazy"
                width={1280}
                height={720}
              />
              <span aria-hidden className="absolute inset-0 bg-gradient-to-t from-foreground/25 via-transparent to-transparent" />
            </div>

            {/* Top-left accent tag */}
            <div className="absolute -left-3 -top-3 hidden items-center gap-2 rounded-2xl px-3.5 py-2 md:inline-flex glass-card">
              <Zap className="h-4 w-4 text-secondary" />
              <span className="text-xs font-semibold text-foreground">Brand-agnostic · National</span>
            </div>

            {/* Bottom-right stat */}
            <div className="animate-float absolute -bottom-6 -right-4 rounded-2xl px-5 py-4 md:right-6 glass-card">
              <div className="font-charge text-3xl leading-none text-gradient-primary">50+</div>
              <div className="mt-1 text-xs text-muted-foreground">States · nationwide impact</div>
            </div>
          </div>

          {/* Content */}
          <div className="animate-fade-up" style={{ animationDelay: "0.08s" }}>
            <div className="brief-mono mb-4 inline-flex items-center gap-2 text-[11px] text-muted-foreground">
              <Building2 className="h-3.5 w-3.5" /> About Us
            </div>

            <h2 className="mb-5 font-display text-3xl font-bold leading-[1.08] text-foreground md:text-4xl lg:text-5xl">
              Driving America's <span className="text-gradient-primary">Zero-Emission &amp; Clean Energy</span> Future
            </h2>

            <p className="mb-6 max-w-xl text-base leading-relaxed text-muted-foreground md:text-lg">
              ElectrifyingTheUS is a groundbreaking, national brand-agnostic partnership transforming how
              Americans understand and embrace multimodal Zero-Emission Mobility and Clean Energy — uniting
              utilities, automakers, community organizations, and labor unions in a shared mission to advance
              transportation electrification across the country.
            </p>

            {/* Partner strip */}
            <div className="mb-7 flex flex-wrap gap-2">
              {partners.map((p) => (
                <span
                  key={p}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-muted/40 px-3 py-1 text-xs font-medium text-muted-foreground"
                >
                  <span className="h-1.5 w-1.5 rounded-full bg-secondary" /> {p}
                </span>
              ))}
            </div>

            {/* Features */}
            <div className="grid gap-2.5 sm:grid-cols-2">
              {features.map((f) => (
                <div
                  key={f}
                  className="group flex items-center gap-3 rounded-2xl border border-border bg-card/70 p-3 backdrop-blur transition-all hover:-translate-y-0.5 hover:border-secondary/30 hover:shadow-card"
                >
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-secondary/10 text-secondary transition-colors group-hover:bg-secondary group-hover:text-secondary-foreground">
                    <Check className="h-4 w-4" />
                  </span>
                  <span className="text-sm font-medium leading-snug text-foreground">{f}</span>
                </div>
              ))}
            </div>

            {/* Regional links */}
            <div className="mt-8 flex flex-wrap items-center gap-3">
              <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">Regional movements</span>
              <a
                href="https://www.electrifyingva.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl bg-primary/10 px-5 py-2.5 text-sm font-semibold text-primary transition-colors hover:bg-primary/15"
              >
                Electrifying Virginia
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
              <a
                href="https://www.electrifyingmi.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="group inline-flex items-center gap-2 rounded-xl bg-secondary/10 px-5 py-2.5 text-sm font-semibold text-secondary transition-colors hover:bg-secondary/15"
              >
                Electrifying Michigan
                <ArrowUpRight className="h-4 w-4 transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
