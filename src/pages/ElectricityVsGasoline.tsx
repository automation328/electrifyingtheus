import { useState, useMemo, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { toast } from "sonner";
import {
  ComposedChart, Line, Area, ReferenceLine, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  TrendingDown, Gauge, MapPin, BarChart3, Zap, Fuel, Clock, Trophy,
  Info, SlidersHorizontal, ChevronDown, ShieldCheck, House, Sparkles, Award, CircleDollarSign,
  Share2, Code2, Car, CarFront, Caravan, Truck, BusFront, Tag, Facebook, Linkedin, MessageCircle, Mail, Copy, Send,
  Gift, BadgeCheck, ArrowRight, type LucideIcon,
} from "lucide-react";
import Navbar from "@/components/Navbar";
import ShareResultDialog from "@/components/forms/ShareResultDialog";
import ShareGate from "@/components/forms/ShareGate";
import CalculatorGateDialog from "@/components/forms/CalculatorGateDialog";
import { openEmailCompose } from "@/lib/emailCompose";
import { CALCULATOR_DISCLAIMER } from "@/lib/disclaimers";
import Footer from "@/components/Footer";
import UsElectricityMap from "@/components/UsElectricityMap";
import { vehicles, getVehiclesByType } from "@/data/vehicles";
import { useGasPrices } from "@/hooks/use-gas-prices";
import { STATE_ENERGY_RATES, NATIONAL_AVG } from "@/data/state-energy-rates";
import { calculate, homeShareFor, DEFAULTS } from "@/lib/ev-cost";
import { recommendEvs, type MatchLabel } from "@/lib/ev-match";
import { incentiveHeadline } from "@/data/incentives";
import { parseCalcState, serializeCalcState, type CalcState } from "@/lib/evg-url";
import { zipToState } from "@/lib/zip-to-state";
import { getLeadIdentity, hasLeadIdentity } from "@/lib/leadIdentity";
import {
  SOURCES, CONFIDENCE_COPY, overallConfidence, type SourceMeta, type Confidence,
} from "@/data/sources";

const EV_COLOR = "hsl(145, 55%, 42%)"; // green
const GAS_COLOR = "#f97316"; // orange
// The $7,500 federal EV tax credit has ended — no purchase incentive is applied here.

// Vehicle-class comparisons — each picks a real gas car and its class-matched EV
// counterpart. Drives the left-rail class picker in the "Compare by vehicle class"
// section (replaces the old Sedan/SUV dropdown).
type CompareClass =
  | "compact-sedan" | "midsize-sedan" | "small-suv" | "pickup" | "full-suv";

const CLASS_OPTIONS: {
  key: CompareClass; label: string; icon: LucideIcon; gas: string; ev: string;
}[] = [
  { key: "compact-sedan", label: "Compact Sedan",  icon: Car,      gas: "honda-civic",       ev: "hyundai-ioniq-6" },
  { key: "midsize-sedan", label: "Mid-Size Sedan", icon: CarFront, gas: "toyota-camry",      ev: "tesla-model-3" },
  { key: "small-suv",     label: "Small SUV",      icon: Caravan,  gas: "chevy-equinox",     ev: "chevy-equinox-ev" },
  { key: "pickup",        label: "EV Pick-Up",     icon: Truck,    gas: "ford-f150",         ev: "ford-f150-lightning" },
  { key: "full-suv",      label: "Full-Size SUV",  icon: BusFront, gas: "toyota-highlander", ev: "kia-ev9" },
];

const currency = (n: number, frac = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: frac, minimumFractionDigits: frac }).format(n);

const miles = (n: number) => `${Math.round(n).toLocaleString()} mi`;

// X (formerly Twitter) wordmark — lucide ships only the legacy bird.
const XLogo = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
    <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
  </svg>
);

const gasVehicles = getVehiclesByType("gas");
const evVehicles = getVehiclesByType("ev");

// Plugstar-style Make → Model pickers. Make is the leading token of the name
// ("Tesla Model 3" → make "Tesla", model "Model 3"), except for the handful of
// brands whose name is two words ("Land Rover Defender" → make "Land Rover").
const MULTIWORD_MAKES = ["Land Rover", "Alfa Romeo", "Aston Martin"];
const makeOf = (name: string) => {
  const m = MULTIWORD_MAKES.find((mk) => name === mk || name.startsWith(mk + " "));
  return m ?? name.split(" ")[0];
};
const modelOf = (name: string) => name.slice(makeOf(name).length).trim();
const gasMakes = [...new Set(gasVehicles.map((v) => makeOf(v.name)))].sort();
const evMakes = [...new Set(evVehicles.map((v) => makeOf(v.name)))].sort();

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
  // Make selection drives the Model dropdown. Kept in sync with the chosen id
  // (deep links, EV-match cards) via the effects below.
  const [gasMake, setGasMake] = useState(() => { const v = vehicles.find((x) => x.id === (searchParams.get("car") ?? "")); return v ? makeOf(v.name) : ""; });
  const [evMake, setEvMake] = useState(() => { const v = vehicles.find((x) => x.id === (searchParams.get("ev") ?? "")); return v ? makeOf(v.name) : ""; });
  const [homeCharging, setHomeCharging] = useState(initial.homeCharging);

  // Keep Make in sync whenever the selected vehicle id changes elsewhere.
  useEffect(() => { const v = vehicles.find((x) => x.id === gasId); if (v) setGasMake(makeOf(v.name)); }, [gasId]);
  useEffect(() => { const v = vehicles.find((x) => x.id === evId); if (v) setEvMake(makeOf(v.name)); }, [evId]);

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
  const [compareClass, setCompareClass] = useState<CompareClass>("midsize-sedan");

  const rates = STATE_ENERGY_RATES[stateCode];
  const incentives = useMemo(() => incentiveHeadline(stateCode), [stateCode]);
  const gasSel = vehicles.find((v) => v.id === gasId);
  const evSel = vehicles.find((v) => v.id === evId);
  // Fallbacks keep the math from crashing before a selection; the results stay
  // hidden until both cars are actually chosen (`bothSelected`).
  const FALLBACK_GAS = vehicles.find((v) => v.id === "toyota-camry") ?? vehicles.find((v) => v.type === "gas")!;
  const FALLBACK_EV = vehicles.find((v) => v.id === "tesla-model-3") ?? vehicles.find((v) => v.type === "ev")!;
  const gas = gasSel ?? FALLBACK_GAS;
  const ev = evSel ?? FALLBACK_EV;
  const bothSelected = !!gasSel && !!evSel;

  // Models available for the chosen make (drives the second dropdown).
  const gasModels = gasMake ? gasVehicles.filter((v) => makeOf(v.name) === gasMake) : [];
  const evModels = evMake ? evVehicles.filter((v) => makeOf(v.name) === evMake) : [];
  const pickMake = (mk: string, id: string, setMake: (s: string) => void, setId: (s: string) => void) => {
    setMake(mk);
    const cur = vehicles.find((v) => v.id === id);
    if (!cur || makeOf(cur.name) !== mk) setId("");
  };

  // Class-matched EV recommendations for the chosen gas car (§6) — only once a
  // gas car is picked, so nothing is suggested on an empty form.
  const matches = useMemo(() => (gasSel ? recommendEvs(gas, vehicles) : []), [gasSel, gas]);
  const [showResults, setShowResults] = useState(false);

  // After the lead form is submitted (or the numbers re-run), smoothly bring the
  // results into view. `scrollTick` lets a re-run re-trigger the scroll even when
  // `showResults` is already true. The 88px offset clears the fixed navbar.
  const resultsRef = useRef<HTMLDivElement>(null);
  const [scrollTick, setScrollTick] = useState(0);
  useEffect(() => {
    if (!showResults || !bothSelected) return;
    let raf2 = 0;
    const raf1 = requestAnimationFrame(() => {
      raf2 = requestAnimationFrame(() => {
        const el = resultsRef.current;
        if (!el) return;
        const top = el.getBoundingClientRect().top + window.scrollY - 88;
        window.scrollTo({ top, behavior: "smooth" });
      });
    });
    return () => { cancelAnimationFrame(raf1); cancelAnimationFrame(raf2); };
  }, [showResults, bothSelected, scrollTick]);

  // Lead gate — first visit asks for a name + email before revealing results.
  // Once captured we remember it (localStorage) so re-running the numbers later
  // doesn't re-prompt the same visitor.
  const [gateOpen, setGateOpen] = useState(false);
  // Gate is remembered for the browser session only — closing the browser
  // re-asks on the next visit (sessionStorage, not localStorage).
  const [unlocked, setUnlocked] = useState(() => {
    try { if (sessionStorage.getItem("evg_unlocked") === "1") return true; } catch { /* ignore */ }
    // Already identified at any earlier gate (a share / event action) → don't re-ask.
    return hasLeadIdentity();
  });
  const [leadName, setLeadName] = useState(() => {
    try { const n = sessionStorage.getItem("evg_name"); if (n) return n; } catch { /* ignore */ }
    return getLeadIdentity()?.firstName ?? "";
  });

  // Calculate → reveal results, gating behind the lead form on first use.
  const requestResults = () => {
    if (!bothSelected) return;
    if (unlocked) { setShowResults(true); setScrollTick((n) => n + 1); return; }
    setGateOpen(true);
  };

  const handleUnlock = (firstName: string) => {
    try {
      sessionStorage.setItem("evg_unlocked", "1");
      if (firstName) sessionStorage.setItem("evg_name", firstName);
    } catch { /* private mode — fine */ }
    if (firstName) setLeadName(firstName);
    setUnlocked(true);
    setShowResults(true);
    setScrollTick((n) => n + 1);
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
  // Range bars count their miles up as the inputs change ($25/$50/$100, car, state).
  const animatedGasRange = useCountUp(calc.res.gasRangeOnDollar, 700);
  const animatedEvRange = useCountUp(calc.res.evRangeOnDollar, 700);
  const evWinsFuel = calc.res.annualSavings >= 0;

  // Confidence — statewide averages give Medium; curated EPA vehicle data is High.
  // Lowest tier wins (§5).
  const confidence: Confidence = useMemo(
    () => overallConfidence(["medium", "medium", "high"]),
    [],
  );

  // Class comparison (national-average prices) — fuel cost per mile.
  const classComparison = useMemo(() => {
    const pair = CLASS_OPTIONS.find((o) => o.key === compareClass) ?? CLASS_OPTIONS[1];
    const cEv = vehicles.find((v) => v.id === pair.ev)!;
    const cGas = vehicles.find((v) => v.id === pair.gas)!;
    const evPm = calculate({
      annualMiles: 12000, horizonYears: 5, gasPricePerGallon: NATIONAL_AVG.gasPricePerGallon,
      homeKwhPrice: NATIONAL_AVG.electricityCentsPerKwh / 100, publicKwhPrice: DEFAULTS.publicKwhPrice,
      homeChargingShare: homeShareFor(true), chargingLoss: DEFAULTS.chargingLoss,
      gas: { mpgCombined: cGas.mpg }, ev: { mpgeCombined: cEv.mpge, kwhPer100mi: cEv.kwhPer100mi },
      federalCredit: 0, stateRebate: 0, utilityRebate: 0,
    });
    const gasPm = evPm.gasCostPerMile;
    const cEvPm = evPm.evCostPerMile;
    const pctSaved = gasPm > 0 ? Math.round(((gasPm - cEvPm) / gasPm) * 100) : 0;
    return {
      cEv, cGas, evPm: cEvPm, gasPm,
      annualSavings: evPm.annualSavings,
      pctSaved,
      evBarPct: gasPm > 0 ? Math.max(8, Math.round((cEvPm / gasPm) * 100)) : 100,
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

  // Share URL with compact result params (og*) appended, so the social/OG
  // crawler (handled in middleware.ts) can render a result-specific preview
  // card — vehicles, state, and annual savings. The extra params are ignored
  // by the page itself, which reads its own state from the canonical params.
  const ogShareUrl = () => {
    if (typeof window === "undefined") return "/electricity-vs-gasoline";
    const u = new URL(window.location.href);
    u.searchParams.set("ogEv", ev.name);
    u.searchParams.set("ogGas", gas.name);
    u.searchParams.set("ogSave", String(Math.round(Math.abs(calc.res.annualSavings))));
    u.searchParams.set("ogWin", evWinsFuel ? "ev" : "gas");
    u.searchParams.set("ogState", rates.name);
    return u.toString();
  };

  const shareTo = (network: "x" | "facebook" | "linkedin" | "whatsapp" | "email") => {
    const { url, text } = buildShare();
    if (network === "email") {
      // Open the visitor's webmail (or mail client) prefilled — the calculator
      // gate already captured their address, so this routes to the right inbox.
      openEmailCompose({ subject: "EV vs Gas — my savings", body: `${text}\n\n${url}` });
      return;
    }
    const u = encodeURIComponent(url);
    const t = encodeURIComponent(text);
    const links: Record<"x" | "facebook" | "linkedin" | "whatsapp", string> = {
      x: `https://twitter.com/intent/tweet?text=${t}&url=${u}`,
      facebook: `https://www.facebook.com/sharer/sharer.php?u=${u}`,
      linkedin: `https://www.linkedin.com/sharing/share-offsite/?url=${u}`,
      whatsapp: `https://wa.me/?text=${encodeURIComponent(`${text} ${url}`)}`,
    };
    window.open(links[network], "_blank", "noopener,noreferrer");
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
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card shadow-card mb-6">
              <div className="h-1.5 w-full gradient-hero" aria-hidden />
              <div className="p-6 md:p-8">
                <div className="flex items-center gap-3 mb-6">
                  <span className="grid place-items-center w-10 h-10 rounded-xl gradient-hero shadow-md shrink-0">
                    <Car className="w-5 h-5 text-primary-foreground" />
                  </span>
                  <div>
                    <div className="font-charge text-lg text-foreground leading-tight">Build your matchup</div>
                    <div className="text-xs text-muted-foreground">Pick the car you drive today vs the EV you're eyeing</div>
                  </div>
                </div>

                {/* Vehicle pickers — gas vs EV */}
                <div className="grid md:grid-cols-[1fr_auto_1fr] md:items-end gap-5 md:gap-4">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2 flex items-center gap-1.5" style={{ color: GAS_COLOR }}>
                      <Fuel className="w-3.5 h-3.5" /> Your current gas car
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={gasMake} onValueChange={(mk) => pickMake(mk, gasId, setGasMake, setGasId)}>
                        <SelectTrigger className="evg-field rounded-xl h-12"><SelectValue placeholder="Make" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {gasMakes.map((mk) => <SelectItem key={mk} value={mk}>{mk}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={gasId} onValueChange={setGasId} disabled={!gasMake}>
                        <SelectTrigger className="evg-field rounded-xl h-12"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {gasModels.map((v) => <SelectItem key={v.id} value={v.id}>{modelOf(v.name)} ({currency(v.msrp, 0)})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>

                  <div className="hidden md:flex items-center justify-center pb-2">
                    <span className="grid place-items-center w-10 h-10 rounded-full border border-border bg-background font-charge text-sm text-foreground shadow-sm">vs</span>
                  </div>

                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] mb-2 flex items-center gap-1.5" style={{ color: EV_COLOR }}>
                      <Zap className="w-3.5 h-3.5" /> Electric car
                    </label>
                    <div className="grid grid-cols-2 gap-2">
                      <Select value={evMake} onValueChange={(mk) => pickMake(mk, evId, setEvMake, setEvId)}>
                        <SelectTrigger className="evg-field rounded-xl h-12"><SelectValue placeholder="Make" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {evMakes.map((mk) => <SelectItem key={mk} value={mk}>{mk}</SelectItem>)}
                        </SelectContent>
                      </Select>
                      <Select value={evId} onValueChange={setEvId} disabled={!evMake}>
                        <SelectTrigger className="evg-field rounded-xl h-12"><SelectValue placeholder="Model" /></SelectTrigger>
                        <SelectContent className="max-h-72">
                          {evModels.map((v) => <SelectItem key={v.id} value={v.id}>{modelOf(v.name)} ({currency(v.msrp, 0)})</SelectItem>)}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                </div>

                {/* Location + charging */}
                <div className="grid sm:grid-cols-2 gap-5 mt-6 pt-6 border-t border-border">
                  <div>
                    <label className="text-[11px] font-semibold uppercase tracking-[0.14em] text-muted-foreground mb-2 flex items-center gap-1.5">
                      <MapPin className="w-3.5 h-3.5" /> ZIP code
                    </label>
                    <Input
                      value={zip}
                      onChange={(e) => handleZip(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter") requestResults(); }}
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

                {/* Preset summary */}
                <div className="mt-6 flex flex-wrap items-center gap-x-3 gap-y-2">
                  <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 text-primary text-xs font-semibold px-3 py-1.5">
                    <MapPin className="w-3.5 h-3.5" /> {rates.name} · {currency(gasPrice, 2)}/gal · {currency(electricityRate, 2)}/kWh · {Math.round(homeShareFor(homeCharging) * 100)}% home charging
                  </span>
                  <span className="text-[11px] text-muted-foreground">Prices are MSRP, preset from state averages.</span>
                </div>

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

                <p className="text-[11px] leading-relaxed text-muted-foreground mt-3 pt-3 border-t border-border flex items-start gap-2">
                  <Tag className="w-3.5 h-3.5 shrink-0 mt-0.5 text-muted-foreground" />
                  <span>
                    <strong className="text-foreground">A note on pricing:</strong> All new vehicle prices are starting MSRPs
                    before taxes, fees, dealer markups, or incentives.
                  </span>
                </p>
              </div>
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

            <CalculatorGateDialog
              open={gateOpen}
              onOpenChange={setGateOpen}
              onUnlock={handleUnlock}
              vehicleSummary={bothSelected ? `${ev.name} vs ${gas.name}` : undefined}
              stateName={rates.name}
            />

            {showResults && bothSelected && (
            <>
            {/* Thank-you intro — personalized with the captured first name. */}
            <div ref={resultsRef} className="mb-6 rounded-3xl border border-secondary/30 bg-secondary/5 p-5 md:p-6 flex items-start gap-3 scroll-mt-24">
              <span className="grid place-items-center w-10 h-10 rounded-2xl bg-secondary/10 text-secondary shrink-0">
                <Sparkles className="w-5 h-5" />
              </span>
              <div>
                <h3 className="font-charge text-xl text-foreground leading-tight">
                  Thank you{leadName ? `, ${leadName}` : ""}!
                </h3>
                <p className="text-sm text-muted-foreground mt-0.5">
                  Below is your personalized {ev.name} vs {gas.name} savings breakdown for {rates.name}.
                </p>
              </div>
            </div>

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
                      <div className="text-sm text-muted-foreground mb-2">{currency(m.ev.msrp, 0)} · {m.ev.rangeMi} mi range</div>
                      <p className="text-xs text-muted-foreground">{m.reason}</p>
                      {m.caveat && (
                        <p className="text-[11px] text-amber-600 mt-1.5 flex items-center gap-1">
                          <Info className="w-3 h-3 shrink-0" /> {m.caveat}
                        </p>
                      )}
                      <div className="mt-3 pt-3 border-t border-border flex items-center justify-between text-xs">
                        <span className="text-muted-foreground">MSRP</span>
                        <span className="font-charge text-base text-foreground tabular-nums">{currency(m.ev.msrp, 0)}</span>
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Fuel-savings verdict scoreboard — moved above the range bars */}
            <div className={`relative overflow-hidden rounded-3xl p-7 md:p-9 text-primary-foreground shadow-elevated mb-4 ${evWinsFuel ? "gradient-green" : "gradient-primary"}`}>
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
                  <ShareGate
                    url={ogShareUrl()}
                    title={buildShare().text}
                    summary={`${ev.name} vs ${gas.name}`}
                    meta={evWinsFuel
                      ? `${currency(Math.abs(calc.res.horizonTotalSaved))} saved over ${ownershipYears} years on fuel`
                      : undefined}
                    description={`${ev.name} vs ${gas.name} — compared on real U.S. energy prices.`}
                    formType="calculator-share"
                    variant="label"
                    label="Share this result"
                    stopNav={false}
                    disclaimer={CALCULATOR_DISCLAIMER}
                    className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-white/90 transition-colors"
                  />
                  <ShareResultDialog
                    shareUrl={typeof window !== "undefined" ? window.location.href : ""}
                    contentTitle={`${ev.name} vs ${gas.name}`}
                    summary={evWinsFuel
                      ? `${currency(Math.abs(calc.res.horizonTotalSaved))} saved over ${ownershipYears} years on fuel`
                      : undefined}
                    dialogTitle="Send this result"
                    dialogDescription={`Email or text the ${ev.name} vs ${gas.name} comparison — it reopens exactly as you see it.`}
                    disclaimer={CALCULATOR_DISCLAIMER}
                    trigger={
                      <button
                        type="button"
                        className="inline-flex items-center gap-2 rounded-full bg-white px-5 py-2 text-sm font-semibold text-primary shadow-sm hover:bg-white/90 transition-colors"
                      >
                        <Send className="w-4 h-4" /> Email / Text result
                      </button>
                    }
                  />
                </div>
              </div>
            </div>

            {/* Typical incentives — listed below the scoreboard, auto-populated from state/ZIP */}
            <div className="rounded-3xl border border-border bg-card p-6 md:p-7 shadow-card mb-6">
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex items-center gap-3">
                  <span className="grid place-items-center w-11 h-11 rounded-2xl bg-secondary/10 text-secondary shrink-0">
                    <Gift className="w-5 h-5" />
                  </span>
                  <div>
                    <h3 className="font-charge text-xl text-foreground leading-tight">
                      Typical incentives in {incentives.stateName}
                    </h3>
                    <p className="text-xs text-muted-foreground">
                      {incentives.topAmount && (
                        <>Up to <span className="font-semibold text-foreground">{currency(incentives.topAmount)}</span> · </>
                      )}
                      {incentives.count} program{incentives.count === 1 ? "" : "s"} for your area
                    </p>
                  </div>
                </div>
                <Link
                  to="/rebates-incentives"
                  className="group inline-flex items-center gap-1.5 rounded-xl gradient-primary text-primary-foreground text-sm font-semibold px-5 py-2.5 hover:opacity-90 transition-opacity shrink-0"
                >
                  See your incentives <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
                </Link>
              </div>

              <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                {incentives.items.map((it) => (
                  <div key={it.name} className="flex items-start gap-2.5 rounded-2xl border border-border bg-background p-3.5">
                    <BadgeCheck className="w-4 h-4 mt-0.5 shrink-0 text-secondary" />
                    <div className="min-w-0">
                      <div className="text-sm font-medium text-foreground leading-snug">{it.name}</div>
                      {it.amount && <div className="text-xs font-semibold text-gradient-primary mt-0.5">{it.amount}</div>}
                    </div>
                  </div>
                ))}
              </div>

              <p className="text-[11px] text-muted-foreground mt-3 flex items-start gap-1.5">
                <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                Federal + state/utility programs for {incentives.stateName}. Typical maximums — verify eligibility on each program page.
              </p>
            </div>

            {/* Dollar-driving hero — the share-worthy number (§3) */}
            <div className="relative overflow-hidden rounded-3xl border border-border bg-card p-6 md:p-8 mb-6 shadow-card">
              <div className="mb-6">
                <div className="flex items-center justify-between gap-3 mb-3">
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.18em] text-primary">
                    <CircleDollarSign className="w-3.5 h-3.5" /> Same money · more miles
                  </span>
                  <span className="text-xs text-muted-foreground flex items-center gap-1">
                    Energy prices <SourceChip src={SOURCES.gas} />
                  </span>
                </div>

                <p className="font-charge text-xl md:text-2xl text-foreground mb-4">
                  How far does each car go on…
                </p>

                {/* Dollar selector — the emphasis. Big segmented pills; the chosen
                    amount fills with the brand gradient and lifts slightly. */}
                <ToggleGroup
                  type="single" value={String(dollarAmount)}
                  onValueChange={(v) => v && setDollarAmount(Number(v))}
                  className="grid grid-cols-3 gap-2.5 sm:flex sm:gap-3"
                >
                  {DOLLAR_OPTIONS.map((d) => (
                    <ToggleGroupItem
                      key={d}
                      value={String(d)}
                      aria-label={`$${d} of fuel`}
                      className="group relative h-16 sm:h-20 sm:min-w-[120px] rounded-2xl border-2 border-border bg-background font-charge leading-none text-foreground transition-all duration-200 hover:border-primary/40
                        data-[state=on]:border-transparent data-[state=on]:gradient-hero data-[state=on]:text-primary-foreground data-[state=on]:shadow-elevated data-[state=on]:scale-[1.04]"
                    >
                      <span className="flex flex-col items-center justify-center">
                        <span className="text-3xl sm:text-4xl tabular-nums">${d}</span>
                        <span className="mt-1 text-[10px] font-semibold uppercase tracking-[0.14em] opacity-70 group-data-[state=on]:opacity-90">of fuel</span>
                      </span>
                    </ToggleGroupItem>
                  ))}
                </ToggleGroup>
              </div>

              <div className="space-y-5">
                {/* Gas bar */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Fuel className="evg-bar-icon w-4 h-4" style={{ color: GAS_COLOR }} /> {gas.name}
                    </span>
                    <span className="font-charge text-2xl text-foreground tabular-nums">{miles(animatedGasRange)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div className="evg-bar-fill h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${(calc.res.gasRangeOnDollar / calc.maxRange) * 100}%`, background: GAS_COLOR }} />
                  </div>
                </div>
                {/* EV bar */}
                <div>
                  <div className="flex items-baseline justify-between mb-1.5">
                    <span className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Zap className="evg-bar-icon w-4 h-4" style={{ color: EV_COLOR }} /> {ev.name}
                    </span>
                    <span className="font-charge text-2xl text-foreground tabular-nums">{miles(animatedEvRange)}</span>
                  </div>
                  <div className="h-4 rounded-full bg-muted overflow-hidden">
                    <div className="evg-bar-fill h-full rounded-full transition-[width] duration-700 ease-out" style={{ width: `${(calc.res.evRangeOnDollar / calc.maxRange) * 100}%`, background: EV_COLOR }} />
                  </div>
                </div>
              </div>

              <p className="text-sm text-muted-foreground mt-5">
                The {ev.name} travels{" "}
                <strong className="text-foreground">{(calc.res.evRangeOnDollar / calc.res.gasRangeOnDollar).toFixed(1)}×</strong>{" "}
                farther on the same ${dollarAmount} — {currency(calc.res.evCostPerMile, 2)}/mi vs {currency(calc.res.gasCostPerMile, 2)}/mi.
              </p>
            </div>

            {/* ── EMBED CTA — put this calculator on your own site ── */}
            {!embed && (
              <div className="relative overflow-hidden mb-8 rounded-3xl gradient-hero text-primary-foreground p-7 md:p-9 shadow-elevated text-center">
                <Code2 className="absolute -right-6 -bottom-6 w-40 h-40 opacity-10" />
                <div className="relative">
                  <span className="inline-flex items-center gap-2 rounded-full bg-white/15 backdrop-blur px-3 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] text-primary-foreground mb-3">
                    <Code2 className="w-4 h-4" /> Embed
                  </span>
                  <h2 className="font-charge text-2xl md:text-3xl text-primary-foreground mb-2">
                    Would you like to include this on your website?
                  </h2>
                  <p className="text-primary-foreground/90 max-w-xl mx-auto mb-6">
                    Add the live EV&nbsp;vs&nbsp;Gas Calculator and EVan, your E-Mobility Concierge, to
                    your own site — kept in sync with our latest U.S. energy &amp; vehicle data automatically.
                  </p>
                  <Link to="/contact-us">
                    <Button className="rounded-xl bg-white text-primary font-semibold hover:bg-white/90">
                      <Sparkles className="w-4 h-4" /> Add this EV vs Gas Calculator to my site
                    </Button>
                  </Link>
                </div>
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
            <div className="text-center max-w-2xl mx-auto mb-12">
              <h2 className="font-charge text-3xl md:text-4xl text-foreground">
                The fight isn't close, coast to coast
              </h2>
              <p className="text-muted-foreground mt-3">
                Wherever you plug in, the numbers line up the same way — electricity beats gasoline on cost, range, and access.
              </p>
            </div>
            <div className="grid sm:grid-cols-3 gap-5 md:gap-6">
              {[
                { icon: TrendingDown, value: "~60%", label: "Cheaper to fuel per mile vs. gas", accent: "gradient-primary" },
                { icon: Gauge, value: "283 mi", label: "Average EV range on a full charge", accent: "gradient-green" },
                { icon: MapPin, value: "250K+", label: "Public charging ports nationwide", accent: "gradient-hero" },
              ].map((s) => (
                <div key={s.label} className="group relative overflow-hidden rounded-3xl bg-card border border-border p-7 shadow-card transition-all hover:shadow-xl hover:-translate-y-1">
                  <div className={`absolute top-0 left-0 right-0 h-1 ${s.accent}`} aria-hidden />
                  <span className={`grid place-items-center w-14 h-14 rounded-2xl ${s.accent} shadow-md mb-5 group-hover:scale-105 transition-transform`}>
                    <s.icon className="w-6 h-6 text-primary-foreground" />
                  </span>
                  <div className="font-charge text-5xl md:text-6xl text-gradient-primary leading-none">{s.value}</div>
                  <p className="text-muted-foreground text-sm mt-3 leading-relaxed">{s.label}</p>
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
            <div className="mb-8">
              <h2 className="font-charge text-3xl md:text-4xl text-foreground">
                Compare by vehicle class
              </h2>
              <p className="text-muted-foreground mt-2">
                Pick a class to see the gas car and its electric counterpart, head to head.
              </p>
            </div>

            <div className="grid lg:grid-cols-[15rem_1fr] gap-5 lg:gap-7">
              {/* Left rail — weight-class selector */}
              <div
                className="flex gap-2 overflow-x-auto pb-1 lg:h-full lg:flex-col lg:gap-3 lg:overflow-visible lg:pb-0"
                role="tablist"
                aria-label="Vehicle class"
              >
                {CLASS_OPTIONS.map((opt) => {
                  const active = opt.key === compareClass;
                  return (
                    <button
                      key={opt.key}
                      type="button"
                      role="tab"
                      aria-selected={active}
                      onClick={() => setCompareClass(opt.key)}
                      className={`relative group flex shrink-0 items-center gap-3 rounded-2xl border px-3.5 py-2.5 text-left transition-colors lg:w-full lg:flex-1 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        active
                          ? "border-primary/30 bg-primary/[0.06] shadow-sm"
                          : "border-border bg-card hover:border-primary/40 hover:bg-muted/40"
                      }`}
                    >
                      {/* energy rail on the selected class */}
                      <span
                        aria-hidden
                        className={`absolute left-0 top-2.5 bottom-2.5 w-1 rounded-full bg-primary transition-opacity ${active ? "opacity-100" : "opacity-0"}`}
                      />
                      <span
                        className={`grid place-items-center w-10 h-10 rounded-xl transition ${
                          active
                            ? "gradient-primary text-primary-foreground shadow-md"
                            : "bg-muted text-muted-foreground group-hover:text-primary"
                        }`}
                      >
                        <opt.icon className="w-5 h-5" />
                      </span>
                      <span
                        className={`font-display font-semibold text-sm whitespace-nowrap ${
                          active ? "text-foreground" : "text-muted-foreground group-hover:text-foreground"
                        }`}
                      >
                        {opt.label}
                      </span>
                      <ArrowRight
                        className={`ml-auto hidden lg:block w-4 h-4 text-primary transition-all ${active ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-1"}`}
                        aria-hidden
                      />
                    </button>
                  );
                })}
              </div>

              {/* Right — head-to-head matchup */}
              <div className="relative overflow-hidden p-6 md:p-8 rounded-3xl border border-border bg-card">
                {/* gas → electric: the fight, encoded in the trim */}
                <div
                  aria-hidden
                  className="absolute inset-x-0 top-0 h-1"
                  style={{ background: `linear-gradient(90deg, ${GAS_COLOR} 0%, ${GAS_COLOR} 38%, ${EV_COLOR} 62%, ${EV_COLOR} 100%)` }}
                />

                {/* Contenders */}
                <div className="flex items-start justify-between gap-3 pt-1">
                  <div className="min-w-0">
                    <div className="flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: GAS_COLOR }} />
                      <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground">Gas</span>
                    </div>
                    <p className="font-display font-semibold text-foreground mt-1 truncate">{classComparison.cGas.name}</p>
                  </div>

                  <span className="shrink-0 grid place-items-center w-9 h-9 mt-1 rounded-full border border-border bg-muted/50 text-[10px] font-bold tracking-wide text-muted-foreground">
                    VS
                  </span>

                  <div className="min-w-0 text-right">
                    <div className="flex items-center justify-end gap-1.5">
                      <span className="text-[11px] font-semibold uppercase tracking-wider" style={{ color: EV_COLOR }}>Electric</span>
                      <span className="w-2.5 h-2.5 rounded-full" style={{ background: EV_COLOR }} />
                    </div>
                    <p className="font-display font-semibold text-foreground mt-1 truncate">{classComparison.cEv.name}</p>
                  </div>
                </div>

                {/* The verdict */}
                <div className="mt-7">
                  <p className="text-sm text-muted-foreground">Going electric saves you</p>
                  <p className="flex items-baseline gap-2 mt-0.5">
                    <span className="font-charge text-5xl md:text-6xl leading-none" style={{ color: EV_COLOR }}>
                      {currency(classComparison.annualSavings)}
                    </span>
                    <span className="text-muted-foreground font-medium">/ year on fuel</span>
                  </p>
                  <p className="text-muted-foreground mt-2 text-sm max-w-prose">
                    Driving the <strong className="font-semibold text-foreground">{classComparison.cEv.name}</strong> instead of the{" "}
                    <strong className="font-semibold text-foreground">{classComparison.cGas.name}</strong> — national-average energy prices, 12,000 mi/yr.
                  </p>
                </div>

                {/* Cost-per-mile duel */}
                <div className="mt-7">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-[11px] font-semibold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
                      <BarChart3 className="w-3.5 h-3.5" /> Fuel cost per mile
                    </span>
                    <span
                      className="inline-flex items-center rounded-full px-2.5 py-1 text-xs font-bold"
                      style={{ color: EV_COLOR, background: "hsl(145 55% 42% / 0.10)" }}
                    >
                      {classComparison.pctSaved}% cheaper
                    </span>
                  </div>

                  <div className="flex items-center gap-3">
                    <span className="w-8 shrink-0 text-[11px] font-semibold uppercase text-muted-foreground">Gas</span>
                    <div className="flex-1 h-8 rounded-lg bg-muted/40 overflow-hidden">
                      <div className="h-full rounded-lg" style={{ width: "100%", background: GAS_COLOR }} />
                    </div>
                    <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums text-foreground">{currency(classComparison.gasPm, 2)}</span>
                  </div>

                  <div className="flex items-center gap-3 mt-2.5">
                    <span className="w-8 shrink-0 text-[11px] font-semibold uppercase text-muted-foreground">EV</span>
                    <div className="flex-1 h-8 rounded-lg bg-muted/40 overflow-hidden">
                      <div
                        className="h-full rounded-lg transition-[width] duration-500 ease-out motion-reduce:transition-none"
                        style={{ width: `${classComparison.evBarPct}%`, background: EV_COLOR }}
                      />
                    </div>
                    <span className="w-14 shrink-0 text-right text-sm font-bold tabular-nums" style={{ color: EV_COLOR }}>{currency(classComparison.evPm, 2)}</span>
                  </div>
                </div>
              </div>
            </div>
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
