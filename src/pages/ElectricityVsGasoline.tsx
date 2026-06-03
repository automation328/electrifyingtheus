import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ComposedChart, Line, Area, ReferenceLine, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
} from "@/components/ui/dialog";
import {
  TrendingDown, Gauge, MapPin, BarChart3, Zap, Fuel, Clock, Trophy,
  Info, SlidersHorizontal, ChevronDown, ShieldCheck, House, Sparkles, Award, CircleDollarSign,
  Share2, Code2, Car, Tag, Facebook, Linkedin, MessageCircle, Mail, Copy, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UsElectricityMap from "@/components/UsElectricityMap";
import { vehicles, getVehiclesByType } from "@/data/vehicles";
import { useGasPrices } from "@/hooks/use-gas-prices";
import { STATE_ENERGY_RATES, NATIONAL_AVG } from "@/data/state-energy-rates";
import { calculate, homeShareFor, DEFAULTS } from "@/lib/ev-cost";
import { recommendEvs, type MatchLabel } from "@/lib/ev-match";
import { parseCalcState, serializeCalcState, type CalcState } from "@/lib/evg-url";
import { zipToState } from "@/lib/zip-to-state";
import {
  SOURCES, CONFIDENCE_COPY, overallConfidence, type SourceMeta, type Confidence,
} from "@/data/sources";
import { type Lead, EMPTY_LEAD, isValidEmail } from "@/lib/lead";

// Best-effort lead notification — same n8n flow EVan uses. Set in .env.local:
//   VITE_N8N_WEBHOOK_URL="https://<your-n8n-host>/webhook/<id>/chat"
const N8N_WEBHOOK_URL = (import.meta as { env?: Record<string, string> }).env?.VITE_N8N_WEBHOOK_URL;

const EV_COLOR = "hsl(145, 55%, 42%)"; // green
const GAS_COLOR = "#f97316"; // orange
// The $7,500 federal EV tax credit has ended — no purchase incentive is applied here.

const currency = (n: number, frac = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: frac, minimumFractionDigits: frac }).format(n);

const miles = (n: number) => `${Math.round(n).toLocaleString()} mi`;
const priceK = (msrp: number) => `$${Math.round(msrp / 1000)}k`;

// X (formerly Twitter) wordmark — lucide ships only the legacy bird.
const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const gasVehicles = getVehiclesByType("gas");
const evVehicles = getVehiclesByType("ev");

// Animates a number toward its target with an ease-out cubic — used for the
// headline figures so they "settle in" as inputs change.
const useCountUp = (target: number, duration = 850) => {
  const [value, setValue] = useState(target);
  const fromRef = useRef(target);
  useEffect(() => {
    const from = fromRef.current;
    const start = performance.now();
    let raf = 0;
    const tick = (t: number) => {
      const p = Math.min(1, (t - start) / duration);
      const eased = 1 - Math.pow(1 - p, 3);
      setValue(from + (target - from) * eased);
      if (p < 1) raf = requestAnimationFrame(tick);
      else fromRef.current = target;
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [target, duration]);
  return value;
};

// Tap-to-reveal source + timestamp chip (§7 — non-negotiable trust mechanism).
const SourceChip = ({ src }: { src: SourceMeta }) => (
  <Popover>
    <PopoverTrigger asChild>
      <button
        type="button"
        className="inline-flex items-center text-muted-foreground/60 hover:text-primary transition-colors align-middle"
        aria-label="Show data source"
      >
        <Info className="w-3.5 h-3.5" />
      </button>
    </PopoverTrigger>
    <PopoverContent align="start" className="w-64 text-xs rounded-2xl">
      <div className="font-semibold text-foreground mb-0.5">{src.label}</div>
      <div className="text-muted-foreground">Updated {src.asOf}</div>
      <a href={src.href} target="_blank" rel="noopener noreferrer" className="text-primary font-medium underline mt-1.5 inline-block">
        Verify at source →
      </a>
    </PopoverContent>
  </Popover>
);

// Labelled slider used inside the assumptions drawer.
const SliderField = ({ label, display, value, onChange, min, max, step, source }: {
  label: string; display: string; value: number; onChange: (v: number) => void;
  min: number; max: number; step: number; source?: SourceMeta;
}) => (
  <div>
    <div className="flex items-baseline justify-between mb-2">
      <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground flex items-center gap-1.5">
        {label}{source && <SourceChip src={source} />}
      </label>
      <span className="font-charge text-lg text-foreground">{display}</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
  </div>
);

const DOLLAR_OPTIONS = [25, 50, 100];

// Chip styling + icon for each recommendation label (§6).
const MATCH_META: Record<MatchLabel, { icon: LucideIcon; chip: string }> = {
  "Closest match": { icon: Sparkles, chip: "bg-primary/10 text-primary" },
  "Lowest total cost": { icon: CircleDollarSign, chip: "bg-secondary/10 text-secondary" },
  "Best overall value": { icon: Award, chip: "bg-amber-500/10 text-amber-600" },
};

// Baseline state (California presets) used as the default for URL (de)serialisation.
const DEFAULT_STATE: CalcState = {
  gasId: "toyota-camry", evId: null, stateCode: "CA", homeCharging: true,
  annualMiles: DEFAULTS.annualMiles, ownershipYears: DEFAULTS.horizonYears,
  gasPrice: STATE_ENERGY_RATES.CA.gasPricePerGallon,
  homeKwh: STATE_ENERGY_RATES.CA.electricityCentsPerKwh / 100,
  publicKwh: DEFAULTS.publicKwhPrice, chargingLoss: DEFAULTS.chargingLoss,
  dollarAmount: DEFAULTS.dollarAmount,
};

const ElectricityVsGasoline = () => {
  const [searchParams, setSearchParams] = useSearchParams();
  const embed = searchParams.get("embed") === "1";

  // Hydrate once from the URL. Price fallbacks use the URL's state preset so a
  // link like ?car=…&state=TX restores TX prices even without explicit values.
  const initial = useMemo(() => {
    const sc = (searchParams.get("state") ?? "CA").toUpperCase();
    const r = STATE_ENERGY_RATES[sc] ?? STATE_ENERGY_RATES.CA;
    return parseCalcState(searchParams, {
      ...DEFAULT_STATE,
      stateCode: sc in STATE_ENERGY_RATES ? sc : "CA",
      gasPrice: r.gasPricePerGallon,
      homeKwh: r.electricityCentsPerKwh / 100,
    });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const [stateCode, setStateCode] = useState(initial.stateCode);
  // No car is preselected — the visitor chooses both. URL deep-links
  // (?car=…&ev=…) still hydrate the selection when present.
  const [gasId, setGasId] = useState(searchParams.get("car") ?? "");
  const [evId, setEvId] = useState(searchParams.get("ev") ?? "");
  const [homeCharging, setHomeCharging] = useState(initial.homeCharging);

  // ZIP code drives the state preset (autodetected from IP, or typed). State
  // remains the source of truth for rates/URL; ZIP is the UI affordance.
  const [zip, setZip] = useState("");
  const handleZip = (raw: string) => {
    const z = raw.replace(/\D/g, "").slice(0, 5);
    setZip(z);
    if (z.length === 5) {
      const st = zipToState(z);
      if (st && st in STATE_ENERGY_RATES) setStateCode(st);
    }
  };

  // Advanced assumptions (progressive disclosure)
  const [showAssumptions, setShowAssumptions] = useState(false);
  const [annualMiles, setAnnualMiles] = useState(initial.annualMiles);
  const [ownershipYears, setOwnershipYears] = useState(initial.ownershipYears);
  const [gasPrice, setGasPrice] = useState(initial.gasPrice);
  const [electricityRate, setElectricityRate] = useState(initial.homeKwh);
  const [publicRate, setPublicRate] = useState(initial.publicKwh);
  const [chargingLoss, setChargingLoss] = useState(initial.chargingLoss);
  const [dollarAmount, setDollarAmount] = useState(initial.dollarAmount);
  const [compareClass, setCompareClass] = useState<"Sedan" | "SUV">("SUV");

  const rates = STATE_ENERGY_RATES[stateCode];
  const gasSel = vehicles.find((v) => v.id === gasId);
  const evSel = vehicles.find((v) => v.id === evId);
  // Fallbacks keep the math from crashing before a selection; the results stay
  // hidden until both cars are actually chosen (`bothSelected`).
  const FALLBACK_GAS = vehicles.find((v) => v.id === "toyota-camry") ?? vehicles.find((v) => v.type === "gas")!;
  const FALLBACK_EV = vehicles.find((v) => v.id === "tesla-model-3") ?? vehicles.find((v) => v.type === "ev")!;
  const gas = gasSel ?? FALLBACK_GAS;
  const ev = evSel ?? FALLBACK_EV;
  const bothSelected = !!gasSel && !!evSel;

  // Class-matched EV recommendations for the chosen gas car (§6) — only once a
  // gas car is picked, so nothing is suggested on an empty form.
  const matches = useMemo(() => (gasSel ? recommendEvs(gas, vehicles) : []), [gasSel, gas]);
  const [showResults, setShowResults] = useState(false);

  // Lead-capture gate — first name + email collected once before results reveal.
  const [lead, setLead] = useState<Lead | null>(null);
  const [leadOpen, setLeadOpen] = useState(false);
  const [leadForm, setLeadForm] = useState<Lead>(EMPTY_LEAD);
  const [leadError, setLeadError] = useState("");
  const firstName = (lead?.fullName.trim().split(/\s+/)[0]) ?? "";

  // Click "Calculate" → reveal results if we already know the visitor, else gate.
  const requestResults = () => {
    if (!bothSelected) return;
    if (lead) { setShowResults(true); return; }
    setLeadError("");
    setLeadOpen(true);
  };

  const captureLead = (e: React.FormEvent) => {
    e.preventDefault();
    const fullName = leadForm.fullName.trim();
    const email = leadForm.email.trim();
    if (!fullName) { setLeadError("Please enter your first name."); return; }
    if (!isValidEmail(email)) { setLeadError("Please enter a valid email address."); return; }

    const captured: Lead = { fullName, email };
    setLead(captured);
    setLeadError("");
    setLeadOpen(false);
    setShowResults(true);

    // Best-effort: notify the n8n flow that a new lead was captured.
    if (N8N_WEBHOOK_URL) {
      fetch(N8N_WEBHOOK_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "captureLead", source: "tco-calculator", ...captured }),
      }).catch(() => { /* non-blocking */ });
    }
  };

  // Live per-state gas prices (AAA via n8n proxy, localStorage-cached). Falls
  // back to static state values when unavailable.
  const { data: gasData } = useGasPrices();

  // The state the IP lookup auto-selected (for the "detected" confirmation chip).
  const [detectedState, setDetectedState] = useState<string | null>(null);

  // Picking a *new* state presets the price sliders. Skipped on first render so
  // prices hydrated from the URL aren't clobbered. Prefers the live gas price
  // for the chosen state, falling back to the static representative value.
  const didMountState = useRef(false);
  useEffect(() => {
    if (!didMountState.current) { didMountState.current = true; return; }
    const r = STATE_ENERGY_RATES[stateCode];
    setGasPrice(gasData?.prices?.[stateCode] ?? r.gasPricePerGallon);
    setElectricityRate(r.electricityCentsPerKwh / 100);
  }, [stateCode, gasData]);

  // Auto-select the visitor's U.S. state from their IP on first load. Skipped
  // when the URL already names a state (a shared/deep link) so we don't override
  // an intentional choice. Setting the state cascades into the price presets.
  const hadStateParam = useRef(searchParams.get("state") != null);
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("https://ipapi.co/json/");
        if (!res.ok) return;
        const data = await res.json();
        if (cancelled || data?.country_code !== "US") return;
        const code = String(data?.region_code ?? "").toUpperCase();
        const postal = String(data?.postal ?? "").replace(/\D/g, "").slice(0, 5);
        // ZIP is always auto-detected from the visitor's location.
        if (postal.length === 5) setZip(postal);
        // State preset only auto-applies when the URL didn't pin a state.
        if (!hadStateParam.current) {
          const resolved = code in STATE_ENERGY_RATES ? code : zipToState(postal);
          if (resolved && resolved in STATE_ENERGY_RATES) {
            setStateCode(resolved);
            setDetectedState(resolved);
          }
        }
      } catch {
        /* offline / blocked / rate-limited — keep the default state */
      }
    })();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Mirror the full calculator state into the URL → shareable, deep-linkable
  // permalinks that re-render identically (§4, §12). `embed` is preserved.
  useEffect(() => {
    const params = serializeCalcState(
      {
        gasId, evId, stateCode, homeCharging, annualMiles, ownershipYears,
        gasPrice, homeKwh: electricityRate, publicKwh: publicRate, chargingLoss, dollarAmount,
      },
      DEFAULT_STATE,
    );
    if (embed) params.embed = "1";
    setSearchParams(params, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gasId, evId, stateCode, homeCharging, annualMiles, ownershipYears, gasPrice, electricityRate, publicRate, chargingLoss, dollarAmount, embed]);

  const handleShare = async () => {
    try {
      await navigator.clipboard.writeText(window.location.href);
      toast.success("Link copied", { description: "Your result is saved in the link — it reopens exactly as you see it." });
    } catch {
      toast.error("Couldn't copy automatically", { description: "Copy the URL from your address bar to share this result." });
    }
  };

  // ── The numbers ──────────────────────────────────────────────────────────
  const calc = useMemo(() => {
    const res = calculate({
      annualMiles,
      horizonYears: ownershipYears,
      gasPricePerGallon: gasPrice,
      homeKwhPrice: electricityRate,
      publicKwhPrice: publicRate,
      homeChargingShare: homeShareFor(homeCharging),
      chargingLoss,
      gas: { mpgCombined: gas.mpg },
      ev: { mpgeCombined: ev.mpge, kwhPer100mi: ev.kwhPer100mi },
      federalCredit: 0,
      stateRebate: 0,
      utilityRebate: 0,
      evPricePremium: ev.msrp - gas.msrp,
      dollarAmount,
    });

    // Extend the fuel-only model into a full ownership view for the cards/chart.
    const ownership = (v: typeof ev | typeof gas, fuelAnnual: number, incentive: number) => {
      const maintAnnual = v.maintenanceCostPerMile * annualMiles;
      const insAnnual = v.insuranceAnnual;
      const upfront = v.msrp - incentive;
      const fuel = fuelAnnual * ownershipYears;
      const maintenance = maintAnnual * ownershipYears;
      const insurance = insAnnual * ownershipYears;
      const annualRunning = fuelAnnual + maintAnnual + insAnnual;
      return {
        purchase: v.msrp, incentive, fuel, maintenance, insurance, upfront, annualRunning,
        total: upfront + fuel + maintenance + insurance,
        perMile: fuelAnnual / annualMiles,
      };
    };
    const e = ownership(ev, res.annualEvCost, res.totalIncentives);
    const g = ownership(gas, res.annualGasCost, 0);

    const ownershipSavings = g.total - e.total;
    const evCheaper = ownershipSavings >= 0;
    const runDiff = g.annualRunning - e.annualRunning;
    const upfrontDiff = e.upfront - g.upfront;
    const ownershipBreakEven = runDiff > 0 && upfrontDiff > 0 ? upfrontDiff / runDiff : null;

    const maxRange = Math.max(res.gasRangeOnDollar, res.evRangeOnDollar);
    const chart = Array.from({ length: 11 }, (_, t) => ({
      year: t,
      EV: Math.round(e.upfront + e.annualRunning * t),
      Gas: Math.round(g.upfront + g.annualRunning * t),
    }));

    return { res, e, g, ownershipSavings, evCheaper, ownershipBreakEven, chart, maxRange };
  }, [ev, gas, annualMiles, ownershipYears, gasPrice, electricityRate, publicRate, homeCharging, chargingLoss, dollarAmount]);

  const animatedAnnual = useCountUp(Math.abs(calc.res.annualSavings));
  const animatedTotal = useCountUp(Math.abs(calc.res.horizonTotalSaved));
  const evWinsFuel = calc.res.annualSavings >= 0;

  // Confidence — statewide averages give Medium; curated EPA vehicle data is High.
  // Lowest tier wins (§5).
  const confidence: Confidence = useMemo(
    () => overallConfidence(["medium", "medium", "high"]),
    [],
  );

  // Class comparison (national-average prices) — fuel cost per mile.
  const classComparison = useMemo(() => {
    const pair = {
      Sedan: { ev: "tesla-model-3", gas: "toyota-camry" },
      SUV: { ev: "chevy-equinox-ev", gas: "chevy-equinox" },
    }[compareClass];
    const cEv = vehicles.find((v) => v.id === pair.ev)!;
    const cGas = vehicles.find((v) => v.id === pair.gas)!;
    const evPm = calculate({
      annualMiles: 12000, horizonYears: 5, gasPricePerGallon: NATIONAL_AVG.gasPricePerGallon,
      homeKwhPrice: NATIONAL_AVG.electricityCentsPerKwh / 100, publicKwhPrice: DEFAULTS.publicKwhPrice,
      homeChargingShare: homeShareFor(true), chargingLoss: DEFAULTS.chargingLoss,
      gas: { mpgCombined: cGas.mpg }, ev: { mpgeCombined: cEv.mpge, kwhPer100mi: cEv.kwhPer100mi },
      federalCredit: 0, stateRebate: 0, utilityRebate: 0,
    });
    return {
      cEv, cGas, evPm: evPm.evCostPerMile, gasPm: evPm.gasCostPerMile,
      annualSavings: evPm.annualSavings,
      data: [
        { name: cGas.name, cost: +evPm.gasCostPerMile.toFixed(2), fill: GAS_COLOR },
        { name: cEv.name, cost: +evPm.evCostPerMile.toFixed(2), fill: EV_COLOR },
      ],
    };
  }, [compareClass]);

  const Row = ({ label, value, accent }: { label: string; value: string; accent?: "green" }) => (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium tabular-nums ${accent === "green" ? "text-secondary" : "text-foreground"}`}>{value}</span>
    </div>
  );

  const winnerName = calc.evCheaper ? ev.name : gas.name;

  // ── Social sharing — the URL already encodes the full result state, so a
  // shared link reopens the exact comparison the visitor is looking at. ──
  const buildShare = () => {
    const url = window.location.href;
    const yr = currency(Math.abs(calc.res.annualSavings));
    const text = evWinsFuel
      ? `The ${ev.name} saves about ${yr}/year on fuel vs the ${gas.name}. See how much you could save:`
      : `I compared the ${ev.name} vs the ${gas.name} on real U.S. energy prices — check your own EV savings:`;
    return { url, text };
  };

  const shareTo = (network: "x" | "facebook" | "linkedin" | "whatsapp" | "email") => {
    const { url, text } = buildShare();
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(text);
    const links: Record<typeof network, string> = {
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
      email: `mailto:?subject=${encodeURIComponent("EV vs Gas — my savings")}&body=${encodeURIComponent(`${text}\n\n${url}`)}`,
    };
    window.open(links[network], network === "email" ? "_self" : "_blank", "noopener,noreferrer");
  };

  const canNativeShare = typeof navigator !== "undefined" && typeof navigator.share === "function";
  const nativeShare = async () => {
    const { url, text } = buildShare();
    try {
      await navigator.share({ title: "EV vs Gas Calculator", text, url });
    } catch {
      /* user dismissed the share sheet — no-op */
    }
  };

  const shareRow =
    "w-full flex items-center gap-2.5 rounded-xl px-2.5 py-2 text-sm text-foreground hover:bg-muted transition-colors text-left";

  return (
    <div className="evg evg-grain min-h-screen flex flex-col">
      <div className="evg-atmos" aria-hidden />
      {!embed && <Navbar />}

      {/* ───────────────── HERO — The Charge-Off ───────────────── */}
      <section className={`relative z-10 pb-12 ${embed ? "pt-10" : "pt-32"}`}>
        <div className="container px-4 max-w-5xl">
          <div className="text-center">
            <span className="evg-rise inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.28em] text-muted-foreground mb-5">
              <span className="h-px w-8 bg-current opacity-40" />
              The Charge-Off · State by State
              <span className="h-px w-8 bg-current opacity-40" />
            </span>

            <h1 className="evg-rise font-charge text-5xl md:text-7xl text-foreground mb-1" style={{ animationDelay: "0.06s" }}>
              <span className="evg-ink-ev">Electricity</span>
            </h1>
            <div className="evg-rise flex items-center justify-center gap-4 my-2" style={{ animationDelay: "0.12s" }}>
              <span className="evg-seam w-16 md:w-28" />
              <span className="relative inline-flex items-center justify-center w-12 h-12 rounded-full border border-border bg-card font-charge text-lg text-foreground shadow-sm">
                vs
                <Zap className="evg-pulse absolute -top-1.5 -right-1.5 w-4 h-4" style={{ color: `hsl(var(--ev-2))` }} fill="currentColor" />
              </span>
              <span className="evg-seam w-16 md:w-28" />
            </div>
            <h1 className="evg-rise font-charge text-5xl md:text-7xl mb-6" style={{ animationDelay: "0.18s" }}>
              <span className="evg-ink-gas">Gasoline</span>
            </h1>

            <p className="evg-rise text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto" style={{ animationDelay: "0.24s" }}>
              Powering a car on electrons or on gallons isn't close — but how lopsided the
              fight is depends entirely on where you live. Pick your state to load it into the ring.
            </p>

            {/* Tale of the tape — national averages */}
            <div className="evg-rise mt-8 inline-flex items-stretch rounded-3xl border border-border bg-card overflow-hidden shadow-elevated" style={{ animationDelay: "0.3s" }}>
              <div className="flex items-center gap-4 px-8 py-6">
                <Fuel className="w-8 h-8 md:w-9 md:h-9" style={{ color: GAS_COLOR }} />
                <div className="text-left">
                  <div className="font-charge text-4xl md:text-5xl text-foreground leading-none">{currency(gasData?.national ?? NATIONAL_AVG.gasPricePerGallon, 2)}</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1.5">per gallon · U.S. avg</div>
                </div>
              </div>
              <div className="w-px bg-border" />
              <div className="flex items-center gap-4 px-8 py-6">
                <Zap className="w-8 h-8 md:w-9 md:h-9" style={{ color: EV_COLOR }} />
                <div className="text-left">
                  <div className="font-charge text-4xl md:text-5xl text-foreground leading-none">{NATIONAL_AVG.electricityCentsPerKwh.toFixed(1)}¢</div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mt-1.5">per kWh · U.S. avg</div>
                </div>
              </div>
            </div>

            {/* Reference points — median gas price first, then sticker prices */}
            <div className="evg-rise mt-5 flex flex-wrap items-center justify-center gap-3" style={{ animationDelay: "0.36s" }}>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm">
                <Fuel className="w-4 h-4" style={{ color: GAS_COLOR }} />
                <span className="text-muted-foreground">Median U.S. gas</span>
                <span className="font-charge text-foreground">{currency(gasData?.national ?? NATIONAL_AVG.gasPricePerGallon, 2)}/gal</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm">
                <Car className="w-4 h-4 text-foreground" />
                <span className="text-muted-foreground">Avg new vehicle</span>
                <span className="font-charge text-foreground">$50,000</span>
              </span>
              <span className="inline-flex items-center gap-2 rounded-full border border-border bg-card px-4 py-2 text-sm shadow-sm">
                <Tag className="w-4 h-4 text-foreground" />
                <span className="text-muted-foreground">Avg used vehicle</span>
                <span className="font-charge text-foreground">$26,390</span>
              </span>
            </div>

            {/* Spread context — a high-price state vs a low-price state */}
            <p className="evg-rise mt-3 text-sm text-muted-foreground" style={{ animationDelay: "0.42s" }}>
              Highest: <span className="font-semibold text-foreground">California {currency(gasData?.prices?.CA ?? STATE_ENERGY_RATES.CA.gasPricePerGallon, 2)}/gal</span>
              {"  ·  "}
              Lowest: <span className="font-semibold text-foreground">Texas {currency(gasData?.prices?.TX ?? STATE_ENERGY_RATES.TX.gasPricePerGallon, 2)}/gal</span>
            </p>
          </div>
        </div>
      </section>

      <main className="flex-1 relative z-10">
        {/* ───────────────── CALCULATOR ───────────────── */}
        <section className="py-16 md:py-20">
          <div className="container px-4 max-w-5xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">01 — Run the numbers</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <h2 className="font-charge text-3xl md:text-4xl text-foreground mb-3">
              How much will you save?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Tell us the car you drive today and whether you can charge at home — we'll match it to
              the right EVs and preset everything else from {rates.name} averages.
              Open <em>Adjust assumptions</em> to fine-tune.
            </p>

            {/* Primary inputs — your current car, the EV, your state, home charging */}
            <div className="rounded-3xl border border-border bg-card p-6 md:p-7 mb-6">
              <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-x-6 gap-y-6">
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 block">Your Current Gas Car</label>
                  <Select value={gasId} onValueChange={setGasId}>
                    <SelectTrigger className="evg-field rounded-xl h-12"><SelectValue placeholder="Select your gas car" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {gasVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name} ({currency(v.msrp, 0)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 block">Electric car</label>
                  <Select value={evId} onValueChange={setEvId}>
                    <SelectTrigger className="evg-field rounded-xl h-12"><SelectValue placeholder="Select an electric car" /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {evVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name} ({currency(v.msrp, 0)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 block">ZIP code</label>
                  <Input
                    value={zip}
                    onChange={(e) => handleZip(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") setShowResults(true); }}
                    inputMode="numeric"
                    maxLength={5}
                    placeholder="Auto-detected"
                    aria-label="ZIP code"
                    className="evg-field rounded-xl h-12"
                  />
                </div>
                <div>
                  <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 flex items-center gap-1.5">
                    <House className="w-3.5 h-3.5" /> Charge at home?
                  </label>
                  <ToggleGroup
                    type="single"
                    value={homeCharging ? "yes" : "no"}
                    onValueChange={(v) => { if (v) setHomeCharging(v === "yes"); }}
                    className="evg-field h-12 w-full rounded-xl p-1 grid grid-cols-2 gap-1"
                  >
                    <ToggleGroupItem value="yes" className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">Yes</ToggleGroupItem>
                    <ToggleGroupItem value="no" className="rounded-lg data-[state=on]:bg-primary data-[state=on]:text-primary-foreground">No</ToggleGroupItem>
                  </ToggleGroup>
                </div>
              </div>
              <p className="text-[11px] text-muted-foreground mt-4">
                Vehicle prices shown are the Manufacturer's Suggested Retail Price (MSRP).
              </p>
              <p className="text-xs text-muted-foreground mt-2 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" />
                Prices preset for {rates.name} — {currency(gasPrice, 2)}/gal gas, {currency(electricityRate, 2)}/kWh at home.
                Charging mix: {Math.round(homeShareFor(homeCharging) * 100)}% home / {Math.round((1 - homeShareFor(homeCharging)) * 100)}% public.
              </p>
              <p className="text-[11px] leading-relaxed text-muted-foreground mt-4 pt-4 border-t border-border flex items-start gap-2">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                <span>
                  All figures shown are estimates based on average fuel prices, vehicle efficiency ratings, and
                  driving assumptions for the selected state. Actual savings, costs, and fuel prices will vary based
                  on individual driving habits, local energy rates, vehicle condition, insurance, and other factors.
                  This tool is for informational purposes only and should not be relied upon as a guarantee of
                  savings or financial advice.
                </span>
              </p>
            </div>

            <div className="mb-6 flex flex-col items-center gap-2">
              <Button
                onClick={requestResults}
                disabled={!bothSelected}
                variant="hero"
                size="lg"
                className="rounded-xl px-8 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <Sparkles className="w-5 h-5" /> {showResults ? "Update my savings" : "Calculate my savings"}
              </Button>
              {!bothSelected && (
                <p className="text-xs text-muted-foreground">
                  Select your current gas car and an electric car to calculate.
                </p>
              )}
            </div>

            {/* Lead-capture gate — first name + email before results reveal. */}
            <Dialog open={leadOpen} onOpenChange={setLeadOpen}>
              <DialogContent aria-describedby={undefined} className="sm:max-w-md rounded-3xl bg-white">
                <DialogHeader>
                  <DialogTitle className="font-charge text-2xl flex items-center gap-2">
                    <Sparkles className="w-5 h-5 text-primary" /> Almost there
                  </DialogTitle>
                </DialogHeader>
                <form onSubmit={captureLead} className="space-y-3 pt-1">
                  <Input
                    type="text"
                    value={leadForm.fullName}
                    onChange={(e) => setLeadForm((f) => ({ ...f, fullName: e.target.value }))}
                    placeholder="First name *"
                    autoComplete="given-name"
                    autoFocus
                    className="rounded-xl border-2 border-slate-300 bg-slate-50 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  <Input
                    type="email"
                    value={leadForm.email}
                    onChange={(e) => setLeadForm((f) => ({ ...f, email: e.target.value }))}
                    placeholder="Email address *"
                    autoComplete="email"
                    className="rounded-xl border-2 border-slate-300 bg-slate-50 focus-visible:border-primary focus-visible:ring-primary/20"
                  />
                  {leadError && <p className="text-xs text-red-500">{leadError}</p>}
                  <Button type="submit" variant="hero" size="lg" className="w-full rounded-xl">
                    <Sparkles className="w-5 h-5" /> Show my savings
                  </Button>
                  <p className="text-[11px] text-muted-foreground leading-relaxed">
                    We use this only to send your results and follow up. No spam.
                  </p>
                </form>
              </DialogContent>
            </Dialog>

            {showResults && bothSelected && (
            <>
            {/* Personalized greeting once a lead is captured. */}
            {firstName && (
              <div className="mb-6 rounded-2xl border border-primary/20 bg-primary/5 px-5 py-4 flex items-center gap-3">
                <span className="grid place-items-center w-9 h-9 rounded-full gradient-primary shrink-0">
                  <Sparkles className="w-4 h-4 text-primary-foreground" />
                </span>
                <p className="text-sm md:text-base text-foreground">
                  <span className="font-charge">Thank you, {firstName}.</span>{" "}
                  <span className="text-muted-foreground">Here are your personalized savings below.</span>
                </p>
              </div>
            )}

            {/* Recommended EV matches (§6 — class-matched substitutes) */}
            <div className="mb-6">
              <div className="flex items-center justify-between gap-3 mb-3">
                <h3 className="font-charge text-xl text-foreground flex items-center gap-2">
                  <Sparkles className="w-5 h-5 text-primary" /> Your best EV matches
                </h3>
                <span className="text-xs text-muted-foreground">class-matched to the {gas.name} — tap to load one above</span>
              </div>
              <div className="grid sm:grid-cols-3 gap-4">
                {matches.map((m) => {
                  const active = m.ev.id === evId;
                  const meta = MATCH_META[m.label];
                  return (
                    <button
                      key={m.ev.id}
                      type="button"
                      onClick={() => setEvId(m.ev.id)}
                      aria-pressed={active}
                      className={`text-left rounded-2xl border bg-card p-4 transition-all ${active ? "ring-2 shadow-elevated border-transparent" : "border-border hover:border-primary/40"}`}
                      style={active ? ({ ["--tw-ring-color" as never]: "hsl(214 100% 36% / 0.5)" }) : undefined}
                    >
                      {m.ev.image && (
                        <div className="aspect-[16/10] mb-3 rounded-xl overflow-hidden bg-muted">
                          <img
                            src={m.ev.image}
                            alt={m.ev.name}
                            loading="lazy"
                            className="w-full h-full object-cover"
                            onError={(e) => {
                              const wrap = e.currentTarget.parentElement;
                              if (wrap) wrap.style.display = "none";
                            }}
                          />
                        </div>
                      )}
                      <span className={`inline-flex items-center gap-1.5 text-[10px] font-semibold uppercase tracking-wider px-2 py-1 rounded-full mb-3 ${meta.chip}`}>
                        <meta.icon className="w-3 h-3" /> {m.label}
                      </span>
                      <div className="font-charge text-lg text-foreground leading-tight">{m.ev.name}</div>
                      <div className="text-sm text-muted-foreground mb-2">{priceK(m.ev.msrp)} · {m.ev.rangeMi} mi range</div>
                      <p className="text-xs text-muted-foreground">{m.reason}</p>
                      {m.caveat && (
                        <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" /> {m.caveat}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">5-yr cost</span>
                        <span className="font-charge text-base text-foreground tabular-nums">{currency(m.fiveYearTotal)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Dollar-driving hero — the share-worthy number (§3) */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 mb-6 shadow-card">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
                <div className="flex items-center gap-2">
                  <span className="font-charge text-xl text-foreground">On</span>
                  <ToggleGroup
                    type="single" value={String(dollarAmount)}
                    onValueChange={(v) => v && setDollarAmount(Number(v))}
                    className="rounded-xl border border-border bg-background p-1 gap-1"
                  >
                    {DOLLAR_OPTIONS.map((d) => (
                      <ToggleGroupItem key={d} value={String(d)} className="rounded-lg px-3 font-charge data-[state=on]:bg-foreground data-[state=on]:text-background">
                        ${d}
                      </ToggleGroupItem>
                    ))}
                  </ToggleGroup>
                  <span className="font-charge text-xl text-foreground">of fuel…</span>
                </div>
                <span className="text-xs text-muted-foreground flex items-center gap-1">
                  Energy prices <SourceChip src={SOURCES.gas} />
                </span>
              </div>

              <div className="space-y-5">
                {/* Gas bar */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Fuel className="w-4 h-4" style={{ color: GAS_COLOR }} /> {gas.name}
                    </span>
                    <span className="font-charge text-2xl text-foreground tabular-nums">{miles(calc.res.gasRangeOnDollar)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${(calc.res.gasRangeOnDollar / calc.maxRange) * 100}%`, background: GAS_COLOR }} />
                  </div>
                </div>
                {/* EV bar */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Zap className="w-4 h-4" style={{ color: EV_COLOR }} /> {ev.name}
                    </span>
                    <span className="font-charge text-2xl text-foreground tabular-nums">{miles(calc.res.evRangeOnDollar)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div className="h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${(calc.res.evRangeOnDollar / calc.maxRange) * 100}%`, background: EV_COLOR }} />
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-5">
                The {ev.name} travels{" "}
                <strong className="text-foreground">{(calc.res.evRangeOnDollar / calc.res.gasRangeOnDollar).toFixed(1)}×</strong>{" "}
                farther on the same ${dollarAmount} — {currency(calc.res.evCostPerMile, 2)}/mi vs {currency(calc.res.gasCostPerMile, 2)}/mi.
              </p>
            </div>

            {/* Fuel-savings verdict scoreboard */}
            <div className={`relative overflow-hidden rounded-3xl p-7 md:p-9 text-primary-foreground shadow-elevated mb-6 ${evWinsFuel ? "gradient-green" : "gradient-primary"}`}>
              <Trophy className="absolute -right-6 -top-6 w-40 h-40 opacity-10" />
              <div className="relative">
                <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] opacity-90 mb-2">
                  <Fuel className="w-3.5 h-3.5" /> Fuel savings · {ev.name} vs {gas.name}
                </div>
                <div className="flex flex-wrap items-end gap-x-6 gap-y-3">
                  <div>
                    <div className="font-charge text-6xl md:text-7xl leading-none">
                      {evWinsFuel ? "" : "−"}{currency(animatedTotal)}
                    </div>
                    <div className="text-sm opacity-90 mt-1.5">saved over {ownershipYears} years on fuel</div>
                  </div>
                  <div className="flex gap-6 mb-1">
                    <div>
                      <div className="font-charge text-2xl leading-none">{currency(Math.abs(calc.res.annualSavings))}</div>
                      <div className="text-xs opacity-80 mt-1">per year</div>
                    </div>
                    <div>
                      <div className="font-charge text-2xl leading-none">{currency(Math.abs(calc.res.monthlySavings))}</div>
                      <div className="text-xs opacity-80 mt-1">per month</div>
                    </div>
                  </div>
                </div>

                <div className="mt-6 flex flex-wrap items-center justify-center gap-2.5">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-2 text-sm">
                    <Clock className="w-4 h-4" />
                    {calc.ownershipBreakEven
                      ? <>Total cost break-even · <span className="font-semibold">year {calc.ownershipBreakEven.toFixed(1)}</span></>
                      : <>EV leads on total cost from day one</>}
                  </span>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-4 py-2 text-sm capitalize hover:bg-white/25 transition-colors">
                        <ShieldCheck className="w-4 h-4" /> {confidence} confidence
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-72 text-xs rounded-2xl">
                      <div className="font-semibold text-foreground mb-1 capitalize">{confidence} confidence</div>
                      <p className="text-muted-foreground">{CONFIDENCE_COPY[confidence]}</p>
                    </PopoverContent>
                  </Popover>
                  <Popover>
                    <PopoverTrigger asChild>
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white shadow-sm ring-1 ring-white/25 hover:bg-blue-700 transition-colors"
                      >
                        <Share2 className="w-4 h-4" /> Share this
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="center" className="w-56 p-2 rounded-2xl">
                      <p className="px-2.5 py-1.5 text-xs font-semibold text-muted-foreground">Share your result</p>
                      {canNativeShare && (
                        <button type="button" onClick={nativeShare} className={shareRow}>
                          <Share2 className="w-4 h-4 text-primary" /> Share…
                        </button>
                      )}
                      <button type="button" onClick={() => shareTo("x")} className={shareRow}>
                        <XLogo className="w-4 h-4" /> X
                      </button>
                      <button type="button" onClick={() => shareTo("facebook")} className={shareRow}>
                        <Facebook className="w-4 h-4" style={{ color: "#1877F2" }} /> Facebook
                      </button>
                      <button type="button" onClick={() => shareTo("linkedin")} className={shareRow}>
                        <Linkedin className="w-4 h-4" style={{ color: "#0A66C2" }} /> LinkedIn
                      </button>
                      <button type="button" onClick={() => shareTo("whatsapp")} className={shareRow}>
                        <MessageCircle className="w-4 h-4" style={{ color: "#25D366" }} /> WhatsApp
                      </button>
                      <button type="button" onClick={() => shareTo("email")} className={shareRow}>
                        <Mail className="w-4 h-4 text-muted-foreground" /> Email
                      </button>
                      <div className="my-1 h-px bg-border" />
                      <button type="button" onClick={handleShare} className={shareRow}>
                        <Copy className="w-4 h-4 text-muted-foreground" /> Copy link
                      </button>
                    </PopoverContent>
                  </Popover>
                </div>
              </div>
            </div>

            {/* ── EMBED CTA — put this calculator on your own site ── */}
            {!embed && (
              <div className="mb-8 rounded-3xl border border-border bg-card p-6 md:p-7 shadow-card text-center">
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary mb-3">
                  <Code2 className="w-4 h-4" /> Embed
                </span>
                <h2 className="font-charge text-2xl md:text-3xl text-foreground mb-2">
                  Would you like to include this on your website?
                </h2>
                <p className="text-muted-foreground max-w-xl mx-auto mb-6">
                  Add the live EV&nbsp;vs&nbsp;Gas Calculator and EVan, your E-Mobility Concierge, to
                  your own site — kept in sync with our latest U.S. energy &amp; vehicle data automatically.
                </p>
                <Link to="/contact-us">
                  <Button variant="hero" className="rounded-xl">
                    <Sparkles className="w-4 h-4" /> Add this EV vs Gas Calculator to my site
                  </Button>
                </Link>
              </div>
            )}

            {/* Interactive map — framed as an instrument panel */}
            <div className="rounded-3xl border border-border bg-card shadow-xl overflow-hidden mb-6">
              <div className="flex items-center justify-between gap-4 px-5 md:px-6 py-3.5 border-b border-border">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <MapPin className="w-4 h-4 text-primary" />
                  Electricity &amp; gas prices by state
                </div>
                <div className="hidden sm:flex items-baseline gap-2">
                  <span className="text-xs uppercase tracking-wider text-muted-foreground">In the ring</span>
                  <span className="font-charge text-base text-foreground">{rates.name}</span>
                  <span className="text-sm text-primary font-semibold tabular-nums">{rates.electricityCentsPerKwh.toFixed(1)}¢</span>
                </div>
              </div>
              <div className="p-4 md:p-6">
                <UsElectricityMap
                  selected={stateCode}
                  onSelect={setStateCode}
                  gasPrices={gasData?.prices}
                  gasUpdatedAt={gasData?.updatedAt}
                />
                {detectedState && (
                  <p className="mt-3 text-center text-xs text-muted-foreground">
                    📍 Auto-selected from your location:{" "}
                    <span className="font-semibold text-foreground">{STATE_ENERGY_RATES[detectedState]?.name}</span>
                  </p>
                )}
              </div>
            </div>

            {/* Adjust assumptions — progressive disclosure (§2) */}
            <div className="rounded-3xl border border-border bg-card mb-6 overflow-hidden">
              <button
                type="button"
                onClick={() => setShowAssumptions((s) => !s)}
                className="w-full flex items-center justify-between gap-3 px-6 py-4 text-left"
                aria-expanded={showAssumptions}
              >
                <span className="flex items-center gap-2.5 font-semibold text-foreground">
                  <SlidersHorizontal className="w-4 h-4 text-primary" /> Adjust assumptions
                </span>
                <ChevronDown className={`w-5 h-5 text-muted-foreground transition-transform ${showAssumptions ? "rotate-180" : ""}`} />
              </button>
              {showAssumptions && (
                <div className="px-6 pb-6 pt-1 grid sm:grid-cols-2 gap-x-8 gap-y-6 border-t border-border evg-rise">
                  <SliderField label="Annual miles" display={annualMiles.toLocaleString()} value={annualMiles} onChange={setAnnualMiles} min={5000} max={30000} step={500} />
                  <SliderField label="Years of ownership" display={`${ownershipYears} yrs`} value={ownershipYears} onChange={setOwnershipYears} min={1} max={10} step={1} />
                  <SliderField label="Gas price ($/gal)" display={currency(gasPrice, 2)} value={gasPrice} onChange={setGasPrice} min={2} max={6} step={0.05} source={SOURCES.gas} />
                  <SliderField label="Home electricity ($/kWh)" display={currency(electricityRate, 2)} value={electricityRate} onChange={setElectricityRate} min={0.08} max={0.45} step={0.01} source={SOURCES.electricity} />
                  <SliderField label="Public charging ($/kWh)" display={currency(publicRate, 2)} value={publicRate} onChange={setPublicRate} min={0.2} max={0.7} step={0.01} source={SOURCES.publicCharging} />
                  <SliderField label="Charging loss" display={`${Math.round(chargingLoss * 100)}%`} value={chargingLoss} onChange={setChargingLoss} min={0} max={0.2} step={0.01} />
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 mb-6 mt-12">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">02 — The full ownership picture</span>
              <span className="h-px flex-1 bg-border" />
            </div>

            {/* Contender card */}
            <div className="mb-6">
              {/* EV */}
              <div
                className={`relative overflow-hidden rounded-3xl border bg-card p-6 transition-all ${calc.evCheaper ? "ring-2 shadow-elevated" : "border-border"}`}
                style={calc.evCheaper ? ({ ["--tw-ring-color" as never]: "hsl(145 55% 42% / 0.35)" }) : undefined}
              >
                {calc.evCheaper && <div className="evg-ribbon absolute top-0 left-0 right-0 h-1" style={{ background: `linear-gradient(90deg, transparent, ${EV_COLOR}, hsl(214 100% 50%), transparent)`, backgroundSize: "220% 100%" }} />}
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: EV_COLOR }}>
                      <Zap className="w-5 h-5 text-white" />
                    </span>
                    <div>
                      <h3 className="font-charge text-lg text-foreground leading-tight">{ev.name}</h3>
                      <span className="text-xs text-muted-foreground">Electric</span>
                    </div>
                  </div>
                  {calc.evCheaper && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
                      <Trophy className="w-3.5 h-3.5" /> Winner
                    </span>
                  )}
                </div>
                <div className="flex items-baseline gap-1.5 mb-4 pb-4 border-b border-border">
                  <span className="font-charge text-3xl text-foreground">{currency(calc.e.perMile, 2)}</span>
                  <span className="text-sm text-muted-foreground">/ mile to fuel</span>
                </div>
                <Row label="Purchase" value={currency(calc.e.purchase)} />
                <Row label={`Charging (${ownershipYears}yr)`} value={currency(calc.e.fuel)} />
                <Row label={`Maintenance (${ownershipYears}yr)`} value={currency(calc.e.maintenance)} />
                <Row label={`Insurance (${ownershipYears}yr)`} value={currency(calc.e.insurance)} />
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="font-charge text-2xl text-foreground tabular-nums">{currency(calc.e.total)}</span>
                </div>
              </div>
            </div>

            {/* Cumulative cost chart */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-charge text-lg text-foreground">Cost as the miles pile up</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: EV_COLOR }} /> EV</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: GAS_COLOR }} /> Gas</span>
                </div>
              </div>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={calc.chart} margin={{ top: 16, right: 12, left: -4, bottom: 4 }}>
                    <defs>
                      <linearGradient id="evFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={EV_COLOR} stopOpacity={0.28} />
                        <stop offset="100%" stopColor={EV_COLOR} stopOpacity={0} />
                      </linearGradient>
                      <linearGradient id="gasFill" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={GAS_COLOR} stopOpacity={0.18} />
                        <stop offset="100%" stopColor={GAS_COLOR} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(214 20% 90%)" vertical={false} />
                    <XAxis dataKey="year" type="number" domain={[0, 10]} ticks={[0, 2, 4, 6, 8, 10]} fontSize={11} tickLine={false} axisLine={false}
                      label={{ value: "Years", position: "insideBottom", offset: -2, fontSize: 11 }} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                    <Tooltip
                      formatter={(v: number, n) => [currency(v), n as string]}
                      labelFormatter={(l) => `Year ${l}`}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(214 20% 90%)" }}
                    />
                    {calc.ownershipBreakEven && (
                      <ReferenceLine x={+calc.ownershipBreakEven.toFixed(2)} stroke="hsl(215 16% 47%)" strokeDasharray="4 4"
                        label={{ value: `Break-even · yr ${calc.ownershipBreakEven.toFixed(1)}`, position: "top", fontSize: 10, fill: "hsl(215 16% 47%)" }} />
                    )}
                    <Area type="monotone" dataKey="Gas" stroke="none" fill="url(#gasFill)" />
                    <Area type="monotone" dataKey="EV" stroke="none" fill="url(#evFill)" />
                    <Line type="monotone" dataKey="Gas" stroke={GAS_COLOR} strokeWidth={2.5} strokeDasharray="6 6" dot={false} />
                    <Line type="monotone" dataKey="EV" stroke={EV_COLOR} strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Source + freshness strip (§7) */}
            <div className="mt-6 flex flex-wrap items-center gap-x-5 gap-y-2 text-xs text-muted-foreground">
              <span className="font-semibold uppercase tracking-wider text-foreground/70">Sources</span>
              <span className="inline-flex items-center gap-1">Gas <SourceChip src={SOURCES.gas} /></span>
              <span className="inline-flex items-center gap-1">Electricity <SourceChip src={SOURCES.electricity} /></span>
              <span className="inline-flex items-center gap-1">Public charging <SourceChip src={SOURCES.publicCharging} /></span>
              <span className="inline-flex items-center gap-1">Vehicle data <SourceChip src={SOURCES.vehicle} /></span>
              <span className="ml-auto">Updated {SOURCES.gas.asOf} · not financial advice</span>
            </div>
            </>
            )}
          </div>
        </section>

        {/* ───────────────── STATS BAND ───────────────── */}
        <section className="py-16 border-y border-border bg-muted/40">
          <div className="container px-4 max-w-5xl">
            <h2 className="text-center font-charge text-3xl md:text-4xl text-foreground mb-12">
              The fight isn't close, coast to coast
            </h2>
            <div className="grid sm:grid-cols-3 gap-8 md:gap-10">
              {[
                { icon: TrendingDown, value: "~60%", label: "Cheaper to fuel per mile vs. gas", color: "text-primary" },
                { icon: Gauge, value: "283 mi", label: "Average EV range on a full charge", color: "text-secondary" },
                { icon: MapPin, value: "240K+", label: "Public charging ports nationwide", color: "text-primary" },
              ].map((s) => (
                <div key={s.label} className="text-center sm:text-left sm:border-l sm:border-border sm:pl-6 first:sm:border-l-0 first:sm:pl-0">
                  <s.icon className={`w-7 h-7 mb-3 mx-auto sm:mx-0 ${s.color}`} />
                  <div className={`font-charge text-5xl md:text-6xl ${s.color}`}>{s.value}</div>
                  <p className="text-muted-foreground text-sm mt-2">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ───────────────── CLASS COMPARISON ───────────────── */}
        <section className="py-16 md:py-20">
          <div className="container px-4 max-w-5xl">
            <div className="flex items-center gap-3 mb-3">
              <span className="text-[11px] font-semibold uppercase tracking-[0.2em] text-primary">03 — Same class, fair fight</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2 className="font-charge text-3xl md:text-4xl text-foreground">
                Compare by vehicle class
              </h2>
              <Select value={compareClass} onValueChange={(v) => setCompareClass(v as "Sedan" | "SUV")}>
                <SelectTrigger className="evg-field rounded-xl h-11 w-full sm:w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Mid-size Sedan</SelectItem>
                  <SelectItem value="SUV">Compact SUV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center p-6 md:p-8 rounded-3xl border border-border bg-card">
              <div>
                <p className="text-xl md:text-2xl font-display font-semibold text-foreground mb-2">
                  On average, you'd save{" "}
                  <span className="evg-ink-ev font-charge">{currency(classComparison.annualSavings)}</span> per year
                </p>
                <p className="text-muted-foreground">
                  with the <strong>{classComparison.cEv.name}</strong> instead of the{" "}
                  <strong>{classComparison.cGas.name}</strong> (at national-average energy prices, 12,000 mi/yr).
                </p>
                <div className="mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: GAS_COLOR }} /> {classComparison.cGas.name}: {currency(classComparison.gasPm, 2)}/mi</div>
                  <div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 rounded-sm" style={{ background: EV_COLOR }} /> {classComparison.cEv.name}: {currency(classComparison.evPm, 2)}/mi</div>
                </div>
              </div>
              <div className="h-[260px]">
                <div className="text-sm font-medium text-muted-foreground mb-2 flex items-center gap-2">
                  <BarChart3 className="w-4 h-4" /> Fuel cost per mile
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={classComparison.data} margin={{ top: 8, right: 8, left: -12, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="hsl(214 20% 90%)" />
                    <XAxis dataKey="name" fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => `$${v.toFixed(2)}`} />
                    <Tooltip formatter={(v: number) => `${currency(v, 2)}/mi`} cursor={{ fill: "hsl(210 20% 96%)" }}
                      contentStyle={{ borderRadius: 12, fontSize: 12, border: "1px solid hsl(214 20% 90%)" }} />
                    <Bar dataKey="cost" radius={[8, 8, 0, 0]} maxBarSize={90}>
                      {classComparison.data.map((d, i) => <Cell key={i} fill={d.fill} />)}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* ───────────────── METHODOLOGY ───────────────── */}
        <section className="pb-16">
          <div className="container px-4 max-w-3xl">
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5">
              <AccordionItem value="methodology" className="border-none">
                <AccordionTrigger className="text-foreground font-semibold">How we calculated this</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-3 text-sm">
                  <p>Every formula is public. Displayed numbers are rounded; the math uses unrounded inputs.</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Gas fuel</strong> = (annual miles ÷ MPG) × gas price</li>
                    <li><strong>EV energy</strong> = miles × (33.7 ÷ MPGe) × blended kWh price × (1 + charging loss)</li>
                    <li><strong>Blended kWh</strong> = home share × home rate + public share × public rate
                      ({Math.round(homeShareFor(homeCharging) * 100)}/{Math.round((1 - homeShareFor(homeCharging)) * 100)} with your current home-charging answer)</li>
                    <li><strong>Charging loss</strong> of {Math.round(chargingLoss * 100)}% accounts for wall-to-wheel energy lost while charging</li>
                    <li><strong>Dollar-driving</strong> = ${dollarAmount} ÷ cost per mile, for each car</li>
                  </ul>
                  <p>
                    State electricity and gasoline prices are representative statewide averages used to preset the
                    inputs, not live market prices, which is why this estimate carries <strong>medium confidence</strong>.
                    Figures exclude purchase incentives, financing interest, and resale value — see the{" "}
                    <Link to="/calculator" className="text-primary underline">full TCO Calculator</Link> for those.
                    The federal $7,500 EV tax credit has ended and is not applied here. Not financial advice.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* Embed attribution — required on embeds, cannot be removed (§9). */}
        {embed && (
          <div className="container px-4 max-w-5xl pb-8 text-center">
            <a href="/electricity-vs-gasoline" target="_blank" rel="noopener noreferrer"
              className="text-xs text-muted-foreground hover:text-primary">
              Powered by <span className="font-semibold text-foreground">Electrifying the US</span> · methodology &amp; sources above
            </a>
          </div>
        )}

        {/* Powered-by credit */}
        <div className="container px-4 max-w-5xl pb-10 text-center">
          <p className="text-xs text-muted-foreground">
            Powered by{" "}
            <a href="https://emobilityresearch.com" target="_blank" rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors">
              EmobilityResearch.com
            </a>
          </p>
        </div>
      </main>

      {!embed && <Footer />}
    </div>
  );
};

export default ElectricityVsGasoline;
