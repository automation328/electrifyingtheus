import { useState } from "react";
import {
  DollarSign, Zap, PlugZap, BadgeCheck, ArrowRight,
  MapPin, ExternalLink, Search, Info, Home, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import AfdcSearch from "@/components/AfdcSearch";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";

type CatKey = "vehicle" | "charging" | "electricity" | "perks";

interface Incentive {
  name: string;
  jurisdiction: string;
  amount?: string;
  income?: boolean;
  used?: boolean;
  desc: string;
  link: string;
}

const CATEGORIES: { key: CatKey; title: string; icon: LucideIcon; color: string }[] = [
  { key: "vehicle", title: "Vehicle Tax Credits and Rebates", icon: DollarSign, color: "from-primary to-primary/80" },
  { key: "charging", title: "Charging Station Incentives", icon: PlugZap, color: "from-primary to-secondary" },
  { key: "electricity", title: "Electricity Discounts", icon: Zap, color: "from-blue-500 to-primary" },
  { key: "perks", title: "Driving Perks", icon: BadgeCheck, color: "from-secondary to-primary" },
];

// Federal / nationwide programs — merged into every ZIP's results.
const FEDERAL: Partial<Record<CatKey, Incentive[]>> = {
  vehicle: [{
    name: "OBBBA Auto-Loan Interest Deduction",
    jurisdiction: "Federal Incentive",
    amount: "Up to $10,000/yr",
    income: true,
    desc: "Deduct interest paid on a loan for a U.S.-assembled vehicle (2025–2028). No itemizing required; phases out above $100,000 (single) / $200,000 (joint) modified AGI. Replaces the retired $7,500 purchase credit.",
    link: "https://www.cleanenergycu.org/resources/blog/obbba-ev-tax-deduction-2026-guide/",
  }],
  charging: [{
    name: "Alternative Fuel Vehicle Refueling Property Credit",
    jurisdiction: "Federal Incentive",
    amount: "Up to $1,000",
    income: true,
    desc: "Individuals in low-income communities and non-urban areas who purchase and install qualifying residential charging equipment may receive a tax credit of 30% of the cost, up to $1,000. Sunsets June 30, 2026.",
    link: "https://www.irs.gov/credits-deductions/alternative-fuel-vehicle-refueling-property-credit",
  }],
};

// State / local programs stacked on top of federal. Region-specific, mirroring electricforall.org.
const STATE_INCENTIVES: Record<string, Partial<Record<CatKey, Incentive[]>>> = {
  CA: {
    vehicle: [
      {
        name: "Vehicle Retirement Consumer Assistance Program",
        jurisdiction: "California Incentive",
        amount: "$1,350 - $2,000",
        used: true,
        desc: "The Consumer Assistance Program provides $1,350 to $2,000 to support the retirement of old, polluting vehicles. Dealer registration is not required to be eligible for the incentive.",
        link: "https://bar.ca.gov/cap/retirement",
      },
      {
        name: "Clean Cars for All",
        jurisdiction: "Bay Area Air District Incentive",
        amount: "Up to $12,000",
        income: true,
        used: true,
        desc: "Clean Cars For All (CCFA) provides incentives to lower-income California drivers to scrap their older, high-polluting car and replace it with a zero- or near-zero emission replacement. Cannot be stacked with the Clean Vehicle Assistance Program. Dealer registration is required.",
        link: "https://www.baaqmd.gov/funding-and-incentives/residents/clean-cars-for-all/program-overview",
      },
      {
        name: "Driving Clean Assistance Program / Clean Cars 4 All",
        jurisdiction: "California Incentive",
        amount: "Up to $12,000",
        income: true,
        used: true,
        desc: "DCAP provides incentives for eligible low-income consumers to purchase or lease new or used clean vehicles — up to $12K to those in disadvantaged communities who scrap an older vehicle ($10K outside DACs). Also provides low-interest loans up to $45K capped at 8%. Dealer registration is required.",
        link: "https://drivingcleanca.org/",
      },
      {
        name: "Ride and Drive Clean",
        jurisdiction: "Bay Area Air District Incentive",
        desc: "Ride and Drive Clean is here to help you save time, money, and the planet. With Exclusive EV Discounts, take advantage of savings on EVs and a no-hassle car buying experience. All vehicles must be purchased before May 31st, 2026.",
        link: "https://rideanddriveclean.org/ev-discounts-spring-2026/",
      },
      {
        name: "Pre-Owned Electric Vehicle Rebate Program",
        jurisdiction: "PG&E Incentive",
        amount: "$1,000 - $4,000",
        used: true,
        desc: "PG&E offers a $1,000 rebate for the purchase or lease of a pre-owned (used) EV. Income-qualified customers can receive up to $4,000. Dealer registration is not required to be eligible for the incentive.",
        link: "https://evrebates.pge.com/",
      },
    ],
    charging: [
      {
        name: "PACE Loss Reserve Program",
        jurisdiction: "California Incentive",
        desc: "Administered by CAEATFA, the PACE Loss Reserve Program supports PACE financing for energy/water efficiency and clean-energy home improvements. Property owners in a PACE-designated area can finance improvements without a down payment, repaid through their property tax bills.",
        link: "https://www.treasurer.ca.gov/caeatfa/pace/index.asp",
      },
      {
        name: "CCFA Charger Rebate",
        jurisdiction: "Bay Area Air District Incentive",
        amount: "Up to $2,000",
        desc: "CCFA offers up to $2,000 for a Level 2 home charger installation and up to $1,000 for a Level 2 portable charger for your new, used, or leased PHEV or BEV. Funding is first come, first served. Approval required before installation.",
        link: "https://www.baaqmd.gov/funding-and-incentives/residents/clean-cars-for-all/resources/charging-your-ev",
      },
      {
        name: "V2X Residential",
        jurisdiction: "PG&E Incentive",
        amount: "$2,500 - $8,000",
        desc: "Residential PG&E customers with standard split-phase 240v service and a qualifying vehicle/charger. Enrollment in customer group A.5 Vehicle-Grid Integrations of the Emergency Load Reduction Program (ELRP) is required and offers additional incentives.",
        link: "https://www.pge.com/en/clean-energy/electric-vehicles/getting-started-with-electric-vehicles/vehicle-to-everything-v2x-pilot-programs.html",
      },
      {
        name: "Residential Charging Solutions Rebate",
        jurisdiction: "PG&E Incentive",
        amount: "Up to $1,999",
        desc: "The Residential Charging Solutions program offers eligible customers a rebate on PG&E-approved electric vehicle (EV) charging equipment.",
        link: "https://www.pge.com/en/clean-energy/electric-vehicles/getting-started-with-electric-vehicles/residential-charging-solutions-rebate.html",
      },
      {
        name: "Residential Vehicle-to-Everything (V2X) Pilot",
        jurisdiction: "PG&E Incentive",
        amount: "Up to $4,500",
        desc: "The V2X Pilot helps PG&E and customers leverage bidirectional charging. In exchange for allowing PG&E to observe the technology during a grid outage, enrollees are compensated with up to $4,500 in incentives.",
        link: "https://www.pge.com/en/clean-energy/electric-vehicles/getting-started-with-electric-vehicles/vehicle-to-everything-v2x-pilot-programs.html",
      },
    ],
    perks: [
      {
        name: "Old Car Buy Back Program",
        jurisdiction: "Bay Area Air District Incentive",
        amount: "$1,500",
        desc: "The Bay Area Air Quality Management District Old Car Buy Back and Scrap Program will pay up to $1,500 for a qualified operating and registered 1998-and-older vehicle. A voluntary program that takes older vehicles off the road and dismantles them.",
        link: "https://www.baaqmd.gov/funding-and-incentives/residents/vehicle-buy-back-program",
      },
      {
        name: "Zero-Emission Assurance Project",
        jurisdiction: "California Incentive",
        amount: "Up to $7,500",
        income: true,
        desc: "The Zero-Emission Assurance Project (ZAP) assists Californians who purchased a used ZEV/NZEV through a CARB incentive program and suspect critical battery or fuel-cell components need major repair. Open to South Coast, San Joaquin Valley, Bay Area, and Sacramento Metro Districts.",
        link: "https://drivingcleanca.org/zap/",
      },
      {
        name: "Go Electric Incentive",
        jurisdiction: "National Uber Incentive",
        amount: "Up to $4,000",
        desc: "Uber offers a $4,000 incentive for existing Platinum and Diamond drivers who switch to an owned or personally leased battery electric vehicle. Applicants must apply before switching and must not have previously owned/leased an EV on the Uber platform.",
        link: "https://www.uber.com/us/en/drive/services/electric/zero-emissions-incentive/",
      },
    ],
  },
  CO: {
    vehicle: [{
      name: "Colorado EV Tax Credit",
      jurisdiction: "Colorado Incentive",
      amount: "Up to $3,500",
      desc: "State income-tax credit for new EV purchases and leases. The credit amount steps down over time, so verify the current value before you buy.",
      link: "https://energyoffice.colorado.gov/zero-emission-vehicles/zero-emission-vehicle-tax-credits",
    }],
  },
  NY: {
    vehicle: [{
      name: "Drive Clean Rebate",
      jurisdiction: "New York Incentive",
      amount: "Up to $2,000",
      desc: "Point-of-sale rebate at participating New York dealers on eligible new EVs.",
      link: "https://www.nyserda.ny.gov/All-Programs/Drive-Clean-Rebate",
    }],
  },
  NJ: {
    vehicle: [{
      name: "Charge Up New Jersey",
      jurisdiction: "New Jersey Incentive",
      amount: "Up to $4,000",
      desc: "Point-of-sale incentive on new EVs. New Jersey also exempts EV sales and leases from state sales tax.",
      link: "https://chargeup.njcleanenergy.com/",
    }],
  },
  MA: {
    vehicle: [{
      name: "MOR-EV Rebate",
      jurisdiction: "Massachusetts Incentive",
      amount: "Up to $3,500 (+$1,500 LMI)",
      income: true,
      desc: "Massachusetts rebate for new EVs, with an added bonus for income-eligible buyers.",
      link: "https://mor-ev.org/",
    }],
  },
  OR: {
    vehicle: [{
      name: "Oregon Clean Vehicle / Charge Ahead",
      jurisdiction: "Oregon Incentive",
      amount: "Up to $7,500",
      income: true,
      used: true,
      desc: "Standard rebate plus a Charge Ahead bonus for low- and moderate-income Oregonians buying new or used EVs.",
      link: "https://evrebate.oregon.gov/",
    }],
  },
  IL: {
    vehicle: [{
      name: "Illinois EV Rebate",
      jurisdiction: "Illinois Incentive",
      amount: "Up to $4,000",
      used: true,
      desc: "State rebate for new and used EV purchases by Illinois residents, subject to annual program funding.",
      link: "https://epa.illinois.gov/topics/ceja/electric-vehicle-rebates.html",
    }],
  },
};

// 3-digit ZIP prefix ranges → USPS state. Covers the 50 states + DC.
const ZIP_RANGES: [number, number, string][] = [
  [5, 5, "NY"], [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"],
  [50, 59, "VT"], [60, 69, "CT"], [70, 89, "NJ"], [100, 149, "NY"], [150, 196, "PA"],
  [197, 199, "DE"], [200, 205, "DC"], [206, 219, "MD"], [220, 246, "VA"], [247, 269, "WV"],
  [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"], [320, 349, "FL"], [350, 369, "AL"],
  [370, 385, "TN"], [386, 397, "MS"], [398, 399, "GA"], [400, 427, "KY"], [430, 459, "OH"],
  [460, 479, "IN"], [480, 499, "MI"], [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"],
  [570, 577, "SD"], [580, 588, "ND"], [590, 599, "MT"], [600, 629, "IL"], [630, 658, "MO"],
  [660, 679, "KS"], [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"], [730, 749, "OK"],
  [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"], [832, 838, "ID"], [840, 847, "UT"],
  [850, 865, "AZ"], [870, 884, "NM"], [889, 898, "NV"], [900, 961, "CA"], [967, 968, "HI"],
  [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];

const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

const stateFromZip = (zip: string): string | null => {
  const prefix = parseInt(zip.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return null;
  for (const [lo, hi, st] of ZIP_RANGES) if (prefix >= lo && prefix <= hi) return st;
  return null;
};

// State programs first, then federal — matching electricforall ordering within a category.
const incentivesFor = (state: string, key: CatKey): Incentive[] => [
  ...(STATE_INCENTIVES[state]?.[key] ?? []),
  ...(FEDERAL[key] ?? []),
];

type VFilter = "all" | "income" | "used";

const FAQS = [
  {
    q: "Is the $7,500 federal EV tax credit still available?",
    a: "No. Under the One Big Beautiful Bill Act (OBBBA), the $7,500 new and $4,000 used clean-vehicle credits ended for vehicles placed in service after September 30, 2025. The current federal benefit is a deduction of up to $10,000 per year on interest paid for a loan on a U.S.-assembled vehicle (2025–2028).",
  },
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
    a: "Not necessarily. We show a curated set of state and local programs in detail; many more local and utility incentives exist. Use the 'See all programs' link to view the full, live list for your state from the U.S. DOE.",
  },
];

const RebatesIncentives = () => {
  const [zip, setZip] = useState("");
  const [loc, setLoc] = useState<{ zip: string; state: string; name: string } | null>(null);
  const [error, setError] = useState("");
  const [vFilter, setVFilter] = useState<VFilter>("all");

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
          <div className="glass-card rounded-3xl p-6 md:p-8 animate-fade-up" style={{ animationDelay: "0.2s" }}>
            <div className="flex items-center gap-2 mb-4">
              <span className="w-10 h-10 rounded-2xl bg-primary/10 flex items-center justify-center">
                <Search className="w-5 h-5 text-primary" />
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

            <div className="flex flex-col sm:flex-row gap-3">
              <Input
                type="text"
                inputMode="numeric"
                maxLength={5}
                placeholder="Enter ZIP code (e.g. 94108)"
                value={zip}
                onChange={(e) => setZip(e.target.value.replace(/\D/g, ""))}
                onKeyDown={(e) => e.key === "Enter" && lookup()}
                className="sm:max-w-xs h-12 text-base"
                aria-label="ZIP code"
              />
              <Button onClick={lookup} size="lg" className="gradient-primary text-primary-foreground h-12">
                <Search className="w-4 h-4 mr-1" /> View
              </Button>
            </div>

            {error && <p className="text-sm text-destructive mt-3">{error}</p>}

            <p className="flex items-start gap-2 text-xs text-muted-foreground mt-4">
              <Info className="w-4 h-4 shrink-0 mt-0.5 text-primary" />
              Conditions apply for each incentive, and depending on specific requirements, you may or may not be eligible.
            </p>
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
                          <a
                            href={it.link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1.5 mt-3 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
                          >
                            Read More <ExternalLink className="w-3.5 h-3.5" />
                          </a>
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
                      <a
                        href="https://homecharging.electricforall.org/"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1.5 gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 rounded-xl hover:opacity-90 transition-opacity shrink-0"
                      >
                        Find your charger <ArrowRight className="w-4 h-4" />
                      </a>
                    </div>
                  )}
                </section>
              );
            })}

            <div>
              <a
                href={`https://afdc.energy.gov/laws/all?state=${loc.state}`}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2.5 transition-all"
              >
                See all {loc.name} programs from the U.S. Department of Energy <ArrowRight className="w-4 h-4" />
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

        {/* AFDC laws & incentives search */}
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
