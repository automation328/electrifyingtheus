import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import {
  DollarSign, Zap, PlugZap, BadgeCheck, ArrowRight,
  MapPin, ExternalLink, Search, Info, Home, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AfdcSearch from "@/components/AfdcSearch";
import ShareGate from "@/components/forms/ShareGate";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import {
  type CatKey, type Incentive, incentivesFor, utilityIncentivesFor, utilityProgramsUrl,
  stateFromZip, STATE_NAMES,
} from "@/data/incentives";
import { INCENTIVES_DISCLAIMER } from "@/lib/disclaimers";

// Split the disclaimer into its two clauses (intro + the all-caps liability
// clause) so each gets its own hierarchy in the callout. The liability clause's
// leading sentence is bolded.
const [DISC_INTRO, DISC_LIABILITY = ""] = INCENTIVES_DISCLAIMER.split("\n\n");
const DISC_LEAD_END = DISC_LIABILITY.indexOf(". ");
const DISC_LEAD = DISC_LEAD_END >= 0 ? DISC_LIABILITY.slice(0, DISC_LEAD_END + 1) : "";
const DISC_REST = DISC_LEAD_END >= 0 ? DISC_LIABILITY.slice(DISC_LEAD_END + 1).trim() : DISC_LIABILITY;

const CATEGORIES: { key: CatKey; title: string; icon: LucideIcon; color: string }[] = [
  { key: "vehicle", title: "Vehicle Tax Credits and Rebates", icon: DollarSign, color: "from-primary to-primary/80" },
  { key: "charging", title: "Charging Station Incentives", icon: PlugZap, color: "from-primary to-secondary" },
  { key: "electricity", title: "Electricity Discounts", icon: Zap, color: "from-blue-500 to-primary" },
  { key: "perks", title: "Driving Perks", icon: BadgeCheck, color: "from-secondary to-primary" },
];

type VFilter = "all" | "income" | "used";

const FAQS = [
  {
    q: "Can I combine federal, state, and utility incentives?",
    a: "Usually yes. Federal tax benefits, state rebates, and utility programs are administered separately, so they often stack. Read each program's terms — a few state or utility offers reduce the amount when another incentive is claimed.",
  },
  {
    q: "Why are some amounts shown as ranges?",
    a: "Most rebates depend on your income, the vehicle, and how much program funding is left. The figures here are typical maximums — your actual amount may be lower. Always confirm the current offer on the official program page before you buy.",
  },
  {
    q: "My ZIP shows mostly federal programs — does my state have nothing?",
    a: "Not necessarily. We show a curated set of state and local programs in detail; many more local and utility incentives exist. Use the 'See all programs' link to view the full, live list for your state.",
  },
];

const RebatesIncentives = () => {
  const [zip, setZip] = useState("");
  const [loc, setLoc] = useState<{ zip: string; state: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [vFilter, setVFilter] = useState<VFilter>("all");
  const didDetect = useRef(false);

  // Auto-detect the visitor's ZIP on first load (Vercel edge geo, ipapi fallback)
  // and show their local programs immediately — same pattern as the calculator,
  // Find a Charger, and the laws & incentives search below.
  useEffect(() => {
    if (didDetect.current) return;
    didDetect.current = true;
    let cancelled = false;
    (async () => {
      try {
        let postal = "";
        // Primary: our own edge-geo endpoint (Vercel headers — reliable, no rate limit).
        try {
          const g = await fetch("/api/geo");
          if (g.ok) {
            const gd = await g.json();
            if (gd?.country === "US") postal = String(gd?.postal ?? "").replace(/\D/g, "").slice(0, 5);
          }
        } catch { /* fall through to the third-party lookup */ }
        // Fallback: third-party IP lookup.
        if (!postal && !cancelled) {
          const res = await fetch("https://ipapi.co/json/");
          if (res.ok) {
            const data = await res.json();
            if (data?.country_code === "US") postal = String(data?.postal ?? "").replace(/\D/g, "").slice(0, 5);
          }
        }
        // Only auto-fill if the visitor hasn't typed a ZIP themselves in the meantime.
        if (cancelled || postal.length !== 5) return;
        const st = stateFromZip(postal);
        if (!st) return;
        setZip((prev) => (prev ? prev : postal));
        setLoc((prev) => (prev ? prev : { zip: postal, state: st, name: STATE_NAMES[st] }));
      } catch {
        /* offline / blocked / rate-limited — keep the empty entry state */
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const lookup = () => {
    const z = zip.trim();
    if (!/^\d{5}$/.test(z)) {
      setError("Enter a valid 5-digit ZIP code.");
      setLoc(null);
      return;
    }
    const st = stateFromZip(z);
    if (!st) {
      setError("Couldn't match that ZIP code to a U.S. state.");
      setLoc(null);
      return;
    }
    setError("");
    setVFilter("all");
    setLoc({ zip: z, state: st, name: STATE_NAMES[st] });
  };

  const filterVehicle = (items: Incentive[]) =>
    items.filter((it) =>
      vFilter === "all" ? true : vFilter === "income" ? it.income : it.used,
    );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Hero */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto pb-2">
              <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4 animate-fade-up">
                EV 101 · Incentives
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4 animate-fade-up" style={{ animationDelay: "0.08s" }}>
                Search for <span className="text-gradient-primary">Incentives</span>
              </h1>
              <p className="text-muted-foreground text-lg animate-fade-up" style={{ animationDelay: "0.16s" }}>
                Learn about the incentives available in your area — vehicle tax credits and rebates, charging
                rebates, utility programs, and special driving perks. Enter your ZIP code to view incentives
                applicable to you.
              </p>
            </div>
          </div>
        </section>

        {/* ZIP finder */}
        <div className="container px-4 max-w-5xl mt-10">
          <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="h-1.5 w-full gradient-hero" aria-hidden />
            <div className="p-6 md:p-8">
            <div className="flex items-center gap-3 mb-5">
              <span className="grid place-items-center w-10 h-10 rounded-xl gradient-hero shadow-md shrink-0">
                <Search className="w-5 h-5 text-primary-foreground" />
              </span>
              <div>
                {loc ? (
                  <h2 className="text-xl font-bold font-display text-foreground">
                    Your Location: {loc.name} · ZIP {loc.zip}
                  </h2>
                ) : (
                  <h2 className="text-xl font-bold font-display text-foreground">Find incentives near you</h2>
                )}
                <p className="text-sm text-muted-foreground">
                  {loc ? "Enter a different ZIP code to view other areas." : "Type your ZIP code to view local programs by category."}
                </p>
              </div>
            </div>

            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter ZIP code (e.g. 94108)"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
                className="sm:max-w-xs h-12 text-base border-2 border-primary/40 bg-background focus-visible:border-primary focus-visible:ring-primary/30"
                aria-label="ZIP code"
              />
              <Button onClick={lookup} size="lg" className="btn-cta-pulse gradient-primary text-primary-foreground h-12">
                <Search className="cta-icon-bob w-4 h-4 mr-1" /> View
              </Button>
            </div>

            {error && <p className="text-sm text-destructive mt-3">{error}</p>}

            {/* Disclaimer — subtle, always open (matches the calculator card). */}
            <p className="text-[11px] leading-relaxed text-muted-foreground mt-6 pt-4 border-t border-border flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              <span>
                <strong className="text-foreground">Estimates only — not financial advice.</strong> {DISC_INTRO}
              </span>
            </p>
            <p className="text-[11px] leading-relaxed text-muted-foreground mt-3 pt-3 border-t border-border flex items-start gap-2">
              <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
              <span>
                <strong className="text-foreground">{DISC_LEAD}</strong> {DISC_REST}
              </span>
            </p>
            </div>
          </div>
        </div>

        {/* Results */}
        {loc ? (
          <div className="container px-4 max-w-5xl mt-10 space-y-10">
            {CATEGORIES.map((cat) => {
              const all = incentivesFor(loc.state, cat.key);
              if (all.length === 0) return null;
              const items = cat.key === "vehicle" ? filterVehicle(all) : all;

              return (
                <section key={cat.key} className="animate-fade-up">
                  <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
                    <div className="flex items-center gap-3">
                      <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color}`}>
                        <cat.icon className="text-primary-foreground" size={20} />
                      </span>
                      <h2 className="text-2xl font-bold font-display text-foreground">{cat.title}</h2>
                    </div>

                    {cat.key === "vehicle" && (
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-semibold text-muted-foreground">FILTER BY:</span>
                        <Select value={vFilter} onValueChange={(v) => setVFilter(v as VFilter)}>
                          <SelectTrigger className="h-9 w-44 text-sm">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="all">- All -</SelectItem>
                            <SelectItem value="income">Income Requirement</SelectItem>
                            <SelectItem value="used">Used Car Eligible</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>

                  {items.length === 0 ? (
                    <p className="text-sm text-muted-foreground italic px-1">
                      No programs match this filter for {loc.name}.
                    </p>
                  ) : (
                    <div className="grid md:grid-cols-2 gap-4">
                      {items.map((it, i) => (
                        <article
                          key={i}
                          className="rounded-2xl border border-border bg-card shadow-card p-5 flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                          <div className="mb-1">
                            <h3 className="font-bold font-display text-foreground leading-snug">{it.name}</h3>
                            <p className="text-xs text-muted-foreground">— {it.jurisdiction}</p>
                          </div>

                          {(it.amount || it.income || it.used) && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 mb-1">
                              {it.amount && (
                                <span className="text-lg font-bold text-gradient-primary">{it.amount}</span>
                              )}
                              {it.income && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">
                                  Income Requirement
                                </span>
                              )}
                              {it.used && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">
                                  Used Car Eligible
                                </span>
                              )}
                            </div>
                          )}

                          <hr className="border-border/70 my-3" />
                          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{it.desc}</p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <a
                              href={it.link}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                            >
                              Learn More and Apply Here <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <ShareGate
                              url="/rebates-incentives"
                              title={it.name}
                              summary={[it.jurisdiction, it.amount].filter(Boolean).join(" · ")}
                              description={it.desc}
                              image="/og/incentives.jpg"
                              meta={[it.jurisdiction, it.amount].filter(Boolean).join(" · ")}
                              formType="incentive-share"
                              variant="label"
                              label="Share"
                              disclaimer={INCENTIVES_DISCLAIMER}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  )}

                  {/* Charging section: national Home Charging Advisor + see-all link */}
                  {cat.key === "charging" && (
                    <div className="mt-4 rounded-2xl border border-dashed border-primary/40 bg-primary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                      <span className="w-11 h-11 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Home className="w-5 h-5 text-primary" />
                      </span>
                      <div className="flex-1">
                        <h3 className="font-bold font-display text-foreground">Home Charging Advisor</h3>
                        <p className="text-sm text-muted-foreground">Find chargers and apply for incentives for charging your EV at home.</p>
                      </div>
                      <Link
                        to="/find-a-charger"
                        className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shrink-0"
                      >
                        Find your charger <ArrowRight className="w-4 h-4" />
                      </Link>
                    </div>
                  )}
                </section>
              );
            })}

            {/* Utility Company Incentives — curated flagship programs + a live
                deep-link to the "Utility/Private Incentives" sector. */}
            {(() => {
              const utilProgs = utilityIncentivesFor(loc.state);
              return (
                <section className="animate-fade-up">
                  <div className="flex items-center gap-3 mb-5">
                    <span className="inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br from-secondary to-blue-500">
                      <Zap className="text-primary-foreground" size={20} />
                    </span>
                    <h2 className="text-2xl font-bold font-display text-foreground">Utility Company Incentives</h2>
                  </div>

                  {utilProgs.length > 0 ? (
                    <div className="grid md:grid-cols-2 gap-4">
                      {utilProgs.map((it, i) => (
                        <article
                          key={i}
                          className="rounded-2xl border border-border bg-card shadow-card p-5 flex flex-col hover:shadow-xl hover:-translate-y-0.5 transition-all"
                        >
                          <div className="mb-1">
                            <h3 className="font-bold font-display text-foreground leading-snug">{it.name}</h3>
                            <p className="text-xs text-muted-foreground">— {it.jurisdiction}</p>
                          </div>
                          {(it.amount || it.income || it.used) && (
                            <div className="flex flex-wrap items-center gap-2 mt-2 mb-1">
                              {it.amount && <span className="text-lg font-bold text-gradient-primary">{it.amount}</span>}
                              {it.income && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-secondary/10 text-secondary">Income Requirement</span>
                              )}
                              {it.used && (
                                <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-primary/10 text-primary">Used Car Eligible</span>
                              )}
                            </div>
                          )}
                          <hr className="border-border/70 my-3" />
                          <p className="text-sm text-muted-foreground leading-relaxed flex-1">{it.desc}</p>
                          <div className="mt-3 flex items-center justify-between gap-3">
                            <a href={it.link} target="_blank" rel="noopener noreferrer"
                              className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all">
                              Learn More and Apply Here <ExternalLink className="w-3.5 h-3.5" />
                            </a>
                            <ShareGate
                              url="/rebates-incentives"
                              title={it.name}
                              summary={[it.jurisdiction, it.amount].filter(Boolean).join(" · ")}
                              description={it.desc}
                              image="/og/incentives.jpg"
                              meta={[it.jurisdiction, it.amount].filter(Boolean).join(" · ")}
                              formType="incentive-share"
                              variant="label"
                              label="Share"
                              disclaimer={INCENTIVES_DISCLAIMER}
                            />
                          </div>
                        </article>
                      ))}
                    </div>
                  ) : (
                    <p className="text-sm text-muted-foreground px-1">
                      Your electric utility may offer EV charger rebates, off-peak charging credits, or special
                      EV rate plans. See the current utility programs for {loc.name} below.
                    </p>
                  )}

                  <div className="mt-4 rounded-2xl border border-dashed border-secondary/40 bg-secondary/5 p-5 flex flex-col sm:flex-row sm:items-center gap-4">
                    <span className="w-11 h-11 rounded-2xl bg-secondary/10 flex items-center justify-center shrink-0">
                      <Zap className="w-5 h-5 text-secondary" />
                    </span>
                    <div className="flex-1">
                      <h3 className="font-bold font-display text-foreground">All utility &amp; private incentives in {loc.name}</h3>
                      <p className="text-sm text-muted-foreground">
                        Live, currently-active utility programs in your area.
                      </p>
                    </div>
                    <a href={utilityProgramsUrl(loc.state)} target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shrink-0">
                      See utility programs <ArrowRight className="w-4 h-4" />
                    </a>
                  </div>
                </section>
              );
            })()}

            <div>
              <a
                href={`https://afdc.energy.gov/laws/all?state=${loc.state}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
              >
                See all {loc.name} programs <ArrowRight className="w-4 h-4" />
              </a>
            </div>
          </div>
        ) : (
          // Empty state — category preview before a ZIP is entered.
          <div className="container px-4 max-w-5xl mt-10">
            <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {CATEGORIES.map((cat) => (
                <div key={cat.key} className="rounded-3xl border border-dashed border-border bg-card/50 p-5 text-center">
                  <span className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${cat.color} mb-3`}>
                    <cat.icon className="text-primary-foreground" size={20} />
                  </span>
                  <h3 className="font-bold font-display text-foreground text-sm">{cat.title}</h3>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Laws & incentives search */}
        <AfdcSearch />

        {/* FAQ */}
        <div className="container px-4 max-w-3xl mt-16">
          <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground text-center mb-8">
            Frequently asked <span className="text-gradient-primary">questions</span>
          </h2>
          <Accordion type="single" collapsible className="space-y-3">
            {FAQS.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="border border-border rounded-2xl bg-card px-5"
              >
                <AccordionTrigger className="text-left font-semibold text-foreground hover:no-underline">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>

        {/* CTA */}
        <div className="container px-4 max-w-5xl mt-16">
          <div className="rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
            <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">See what you'd actually save</h2>
            <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
              Run your numbers with our cost calculator, then lock in the incentives above before they're gone.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <a href="/electricity-vs-gasoline">
                <Button variant="default" size="lg" className="bg-primary-foreground text-primary hover:opacity-90">
                  Open the cost calculator <ArrowRight className="w-5 h-5 ml-1" />
                </Button>
              </a>
              <a
                href="https://afdc.energy.gov/laws/search"
                target="_blank"
                rel="noopener noreferrer"
              >
                <Button variant="hero" size="lg">
                  Search all incentives <ExternalLink className="w-4 h-4 ml-1" />
                </Button>
              </a>
            </div>
          </div>
        </div>

      </main>
      <Footer />
    </div>
  );
};

export default RebatesIncentives;
