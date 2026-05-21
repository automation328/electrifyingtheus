import { useState, useMemo, useEffect } from "react";
import { Link } from "react-router-dom";
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
import { Button } from "@/components/ui/button";
import { TrendingDown, Gauge, MapPin, BarChart3, ArrowRight, Zap, Fuel, PiggyBank, Clock, CheckCircle2 } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UsElectricityMap from "@/components/UsElectricityMap";
import { vehicles, getVehiclesByType } from "@/data/vehicles";
import { STATE_ENERGY_RATES, NATIONAL_AVG } from "@/data/state-energy-rates";
import type { VehicleData } from "@/lib/tco-calculator";

const EV_COLOR = "hsl(145, 55%, 42%)"; // green
const GAS_COLOR = "#f97316"; // orange
const FEDERAL_INCENTIVE = 7500;

const currency = (n: number, frac = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: frac, minimumFractionDigits: frac }).format(n);

const priceK = (msrp: number) => `$${Math.round(msrp / 1000)}k`;

const evVehicles = getVehiclesByType("ev");
const gasVehicles = getVehiclesByType("gas");

const evCostPerMile = (kwhPer100mi: number, dollarsPerKwh: number) => (kwhPer100mi / 100) * dollarsPerKwh;
const gasCostPerMile = (mpg: number, pricePerGallon: number) => (1 / mpg) * pricePerGallon;

// A small labelled slider used in the controls card.
const SliderField = ({ label, display, value, onChange, min, max, step }: {
  label: string; display: string; value: number; onChange: (v: number) => void; min: number; max: number; step: number;
}) => (
  <div>
    <div className="flex items-center justify-between mb-2">
      <label className="text-sm font-medium text-muted-foreground">{label}</label>
      <span className="text-sm font-semibold text-foreground">{display}</span>
    </div>
    <Slider value={[value]} onValueChange={([v]) => onChange(v)} min={min} max={max} step={step} />
  </div>
);

const ElectricityVsGasoline = () => {
  const [stateCode, setStateCode] = useState("CA");
  const [evId, setEvId] = useState("tesla-model-3");
  const [gasId, setGasId] = useState("toyota-camry");
  const [annualMiles, setAnnualMiles] = useState(12000);
  const [ownershipYears, setOwnershipYears] = useState(5);
  const [gasPrice, setGasPrice] = useState(STATE_ENERGY_RATES.CA.gasPricePerGallon);
  const [electricityRate, setElectricityRate] = useState(STATE_ENERGY_RATES.CA.electricityCentsPerKwh / 100);
  const [compareClass, setCompareClass] = useState<"Sedan" | "SUV">("SUV");

  const rates = STATE_ENERGY_RATES[stateCode];
  const ev = vehicles.find((v) => v.id === evId)!;
  const gas = vehicles.find((v) => v.id === gasId)!;

  // Picking a state on the map presets the price sliders (still manually adjustable).
  useEffect(() => {
    const r = STATE_ENERGY_RATES[stateCode];
    setGasPrice(r.gasPricePerGallon);
    setElectricityRate(r.electricityCentsPerKwh / 100);
  }, [stateCode]);

  const tco = useMemo(() => {
    const calc = (v: VehicleData) => {
      const purchase = v.msrp;
      const incentive = v.type === "ev" ? FEDERAL_INCENTIVE : 0;
      const energyAnnual = v.type === "ev"
        ? evCostPerMile(v.kwhPer100mi ?? 30, electricityRate) * annualMiles
        : gasCostPerMile(v.mpg ?? 28, gasPrice) * annualMiles;
      const maintAnnual = v.maintenanceCostPerMile * annualMiles;
      const insAnnual = v.insuranceAnnual;
      const energy = energyAnnual * ownershipYears;
      const maintenance = maintAnnual * ownershipYears;
      const insurance = insAnnual * ownershipYears;
      const total = purchase - incentive + energy + maintenance + insurance;
      return { purchase, incentive, energy, maintenance, insurance, total, upfront: purchase - incentive, annualRunning: energyAnnual + maintAnnual + insAnnual };
    };
    const e = calc(ev);
    const g = calc(gas);
    const savings = g.total - e.total; // +ve => EV cheaper over the period
    const runDiff = g.annualRunning - e.annualRunning;
    const upfrontDiff = e.upfront - g.upfront;
    const breakEven = runDiff > 0 && upfrontDiff > 0 ? upfrontDiff / runDiff : null;
    const chart = Array.from({ length: 11 }, (_, t) => ({
      year: t,
      EV: Math.round(e.upfront + e.annualRunning * t),
      Gas: Math.round(g.upfront + g.annualRunning * t),
    }));
    return { e, g, savings, evCheaper: savings >= 0, breakEven, chart };
  }, [ev, gas, annualMiles, ownershipYears, gasPrice, electricityRate]);

  // Class comparison (national-average prices) — fuel cost per mile.
  const classComparison = useMemo(() => {
    const pair = {
      Sedan: { ev: "tesla-model-3", gas: "toyota-camry" },
      SUV: { ev: "chevy-equinox-ev", gas: "chevy-equinox" },
    }[compareClass];
    const cEv = vehicles.find((v) => v.id === pair.ev)!;
    const cGas = vehicles.find((v) => v.id === pair.gas)!;
    const evPm = evCostPerMile(cEv.kwhPer100mi!, NATIONAL_AVG.electricityCentsPerKwh / 100);
    const gasPm = gasCostPerMile(cGas.mpg!, NATIONAL_AVG.gasPricePerGallon);
    const annualSavings = (gasPm - evPm) * 12000;
    return {
      cEv, cGas, evPm, gasPm, annualSavings,
      data: [
        { name: cGas.name, cost: +gasPm.toFixed(2), fill: GAS_COLOR },
        { name: cEv.name, cost: +evPm.toFixed(2), fill: EV_COLOR },
      ],
    };
  }, [compareClass]);

  const Row = ({ label, value, accent }: { label: string; value: string; accent?: "green" | "orange" }) => (
    <div className="flex justify-between items-center py-1.5 text-sm">
      <span className="text-muted-foreground">{label}</span>
      <span className={`font-medium ${accent === "green" ? "text-secondary" : "text-foreground"}`}>{value}</span>
    </div>
  );

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />

      {/* Hero — interactive electricity-price map */}
      <section className="pt-28 pb-12 bg-gradient-to-b from-secondary/5 to-background">
        <div className="container px-4 max-w-5xl">
          <div className="text-center mb-8">
            <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4">
              Electricity vs. <span className="text-gradient-primary">Gasoline</span>
            </h1>
            <p className="text-muted-foreground text-lg md:text-xl max-w-2xl mx-auto">
              Electricity prices vary widely across the U.S. Explore the map to see what powering
              an EV costs in each state — then click a state to compare it against gas below.
            </p>
          </div>
          <div className="rounded-3xl border border-border bg-card shadow-xl p-4 md:p-6">
            <UsElectricityMap selected={stateCode} onSelect={setStateCode} />
          </div>
        </div>
      </section>

      <main className="flex-1">
        {/* Calculator */}
        <section className="py-16 md:py-20">
          <div className="container px-4 max-w-5xl">
            <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
              Calculator
            </span>
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              Electricity vs Gasoline Calculator
            </h2>
            <p className="text-muted-foreground mb-8 max-w-2xl">
              Compare the full cost of owning an EV versus a gas car — purchase, incentives, energy,
              maintenance, and insurance. Pick a state on the map above to preset prices, then fine-tune below.
            </p>

            {/* Summary stat cards */}
            <div className="grid sm:grid-cols-2 gap-5 mb-6">
              <div className={`relative overflow-hidden rounded-3xl p-6 text-primary-foreground shadow-lg ${tco.evCheaper ? "gradient-green" : "gradient-primary"}`}>
                <PiggyBank className="absolute -right-4 -top-4 w-28 h-28 opacity-15" />
                <div className="relative">
                  <div className="text-xs uppercase tracking-wider opacity-90 mb-1">{ownershipYears}-year savings with EV</div>
                  <div className="text-5xl font-bold font-display leading-none">
                    {tco.evCheaper ? currency(tco.savings) : `−${currency(Math.abs(tco.savings))}`}
                  </div>
                  <p className="text-sm opacity-90 mt-3">
                    {tco.evCheaper
                      ? `${ev.name} beats ${gas.name} over ${ownershipYears} years`
                      : `${gas.name} costs less over ${ownershipYears} years`}
                  </p>
                </div>
              </div>
              <div className="rounded-3xl border border-border bg-card p-6 flex items-start gap-4 shadow-card">
                <div className="w-12 h-12 rounded-2xl bg-primary/10 flex items-center justify-center shrink-0">
                  <Clock className="w-6 h-6 text-primary" />
                </div>
                <div>
                  <div className="text-xs uppercase tracking-wider text-muted-foreground mb-1">Break-even</div>
                  <div className="text-4xl font-bold font-display text-foreground leading-none">
                    {tco.breakEven ? `Year ${tco.breakEven.toFixed(1)}` : "—"}
                  </div>
                  <p className="text-sm text-muted-foreground mt-3">When EV total cost drops below gas</p>
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="rounded-3xl border border-border bg-card p-6 mb-6">
              <div className="grid sm:grid-cols-2 gap-x-8 gap-y-6">
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Electric vehicle</label>
                  <Select value={evId} onValueChange={setEvId}>
                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {evVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name} ({priceK(v.msrp)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">Gas vehicle</label>
                  <Select value={gasId} onValueChange={setGasId}>
                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {gasVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name} ({priceK(v.msrp)})</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <SliderField label="Annual miles" display={annualMiles.toLocaleString()} value={annualMiles} onChange={setAnnualMiles} min={5000} max={30000} step={1000} />
                <SliderField label="Years of ownership" display={`${ownershipYears} yrs`} value={ownershipYears} onChange={setOwnershipYears} min={1} max={10} step={1} />
                <SliderField label="Gas price ($/gal)" display={currency(gasPrice, 2)} value={gasPrice} onChange={setGasPrice} min={2} max={6} step={0.05} />
                <SliderField label="Electricity ($/kWh)" display={currency(electricityRate, 2)} value={electricityRate} onChange={setElectricityRate} min={0.08} max={0.45} step={0.01} />
              </div>
              <p className="text-xs text-muted-foreground mt-5 flex items-center gap-1.5">
                <MapPin className="w-3.5 h-3.5 text-primary" /> Prices preset for {rates.name} — pick a state on the map above, or adjust the sliders.
              </p>
            </div>

            {/* Cost breakdown cards */}
            <div className="grid md:grid-cols-2 gap-6 mb-6">
              {/* EV */}
              <div className={`rounded-3xl border bg-card p-6 border-l-4 transition-shadow ${tco.evCheaper ? "ring-2 ring-secondary/30 shadow-lg" : "border-border"}`} style={{ borderLeftColor: EV_COLOR }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: EV_COLOR }}>
                      <Zap className="w-5 h-5 text-white" />
                    </span>
                    <h3 className="font-bold font-display text-foreground">{ev.name}</h3>
                  </div>
                  {tco.evCheaper && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold text-secondary bg-secondary/10 px-2.5 py-1 rounded-full">
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lower total
                    </span>
                  )}
                </div>
                <Row label="Purchase" value={currency(tco.e.purchase)} />
                <Row label="Federal incentive" value={`−${currency(tco.e.incentive)}`} accent="green" />
                <Row label={`Charging (${ownershipYears}yr)`} value={currency(tco.e.energy)} />
                <Row label={`Maintenance (${ownershipYears}yr)`} value={currency(tco.e.maintenance)} />
                <Row label={`Insurance (${ownershipYears}yr)`} value={currency(tco.e.insurance)} />
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-xl font-bold font-display text-foreground">{currency(tco.e.total)}</span>
                </div>
              </div>
              {/* Gas */}
              <div className={`rounded-3xl border bg-card p-6 border-l-4 transition-shadow ${!tco.evCheaper ? "ring-2 ring-[#f97316]/30 shadow-lg" : "border-border"}`} style={{ borderLeftColor: GAS_COLOR }}>
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center gap-2.5">
                    <span className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ background: GAS_COLOR }}>
                      <Fuel className="w-5 h-5 text-white" />
                    </span>
                    <h3 className="font-bold font-display text-foreground">{gas.name}</h3>
                  </div>
                  {!tco.evCheaper && (
                    <span className="inline-flex items-center gap-1 text-xs font-semibold px-2.5 py-1 rounded-full" style={{ color: GAS_COLOR, background: "rgba(249,115,22,0.1)" }}>
                      <CheckCircle2 className="w-3.5 h-3.5" /> Lower total
                    </span>
                  )}
                </div>
                <Row label="Purchase" value={currency(tco.g.purchase)} />
                <Row label="Incentive" value={currency(0)} />
                <Row label={`Fuel (${ownershipYears}yr)`} value={currency(tco.g.energy)} />
                <Row label={`Maintenance (${ownershipYears}yr)`} value={currency(tco.g.maintenance)} />
                <Row label={`Insurance (${ownershipYears}yr)`} value={currency(tco.g.insurance)} />
                <div className="flex justify-between items-center mt-3 pt-3 border-t border-border">
                  <span className="font-bold text-foreground">Total</span>
                  <span className="text-xl font-bold font-display text-foreground">{currency(tco.g.total)}</span>
                </div>
              </div>
            </div>

            {/* Cumulative cost chart */}
            <div className="rounded-3xl border border-border bg-card p-6">
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-semibold text-foreground">Cumulative cost over time</h3>
                <div className="flex items-center gap-4 text-sm text-muted-foreground">
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: EV_COLOR }} /> EV</span>
                  <span className="flex items-center gap-1.5"><span className="w-3 h-3 rounded-sm" style={{ background: GAS_COLOR }} /> Gas</span>
                </div>
              </div>
              <div className="h-[340px]">
                <ResponsiveContainer width="100%" height="100%">
                  <ComposedChart data={tco.chart} margin={{ top: 16, right: 12, left: -4, bottom: 4 }}>
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
                    {tco.breakEven && (
                      <ReferenceLine x={+tco.breakEven.toFixed(2)} stroke="hsl(215 16% 47%)" strokeDasharray="4 4"
                        label={{ value: `Break-even · yr ${tco.breakEven.toFixed(1)}`, position: "top", fontSize: 10, fill: "hsl(215 16% 47%)" }} />
                    )}
                    <Area type="monotone" dataKey="Gas" stroke="none" fill="url(#gasFill)" />
                    <Area type="monotone" dataKey="EV" stroke="none" fill="url(#evFill)" />
                    <Line type="monotone" dataKey="Gas" stroke={GAS_COLOR} strokeWidth={2.5} strokeDasharray="6 6" dot={false} />
                    <Line type="monotone" dataKey="EV" stroke={EV_COLOR} strokeWidth={3} dot={false} />
                  </ComposedChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>

        {/* Stats band */}
        <section className="py-14 bg-muted/40 border-y border-border">
          <div className="container px-4 max-w-5xl">
            <h2 className="text-center text-2xl md:text-3xl font-bold font-display text-foreground mb-10">
              EVs make sense across the country
            </h2>
            <div className="grid sm:grid-cols-3 gap-8 text-center">
              {[
                { icon: TrendingDown, value: "~60%", label: "Cheaper to fuel per mile vs. gas", color: "text-primary" },
                { icon: Gauge, value: "283 mi", label: "Average EV range on a full charge", color: "text-secondary" },
                { icon: MapPin, value: "240K+", label: "Public charging ports nationwide", color: "text-primary" },
              ].map((s) => (
                <div key={s.label}>
                  <s.icon className={`w-8 h-8 mx-auto mb-3 ${s.color}`} />
                  <div className={`text-3xl md:text-4xl font-bold font-display ${s.color}`}>{s.value}</div>
                  <p className="text-muted-foreground text-sm mt-1">{s.label}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Class comparison */}
        <section className="py-16 md:py-20">
          <div className="container px-4 max-w-5xl">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 mb-8">
              <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground">
                Compare by vehicle class
              </h2>
              <Select value={compareClass} onValueChange={(v) => setCompareClass(v as "Sedan" | "SUV")}>
                <SelectTrigger className="rounded-xl h-11 w-full sm:w-56"><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="Sedan">Mid-size Sedan</SelectItem>
                  <SelectItem value="SUV">Compact SUV</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="grid md:grid-cols-2 gap-8 items-center p-6 rounded-3xl border border-border bg-card">
              <div>
                <p className="text-xl md:text-2xl font-display font-semibold text-foreground mb-2">
                  On average, you'd save{" "}
                  <span className="text-gradient-primary">{currency(classComparison.annualSavings)}</span> per year
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

        {/* Methodology */}
        <section className="pb-16">
          <div className="container px-4 max-w-3xl">
            <Accordion type="single" collapsible className="rounded-2xl border border-border bg-card px-5">
              <AccordionItem value="methodology" className="border-none">
                <AccordionTrigger className="text-foreground font-semibold">Methodology &amp; assumptions</AccordionTrigger>
                <AccordionContent className="text-muted-foreground space-y-3 text-sm">
                  <p>Each vehicle's total reflects ownership cost over the years you choose:</p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>Total</strong> = purchase price − incentives + energy + maintenance + insurance</li>
                    <li><strong>EV charging</strong> = (kWh/100mi ÷ 100) × electricity price × annual miles × years</li>
                    <li><strong>Gas fuel</strong> = (annual miles ÷ MPG) × gas price × years</li>
                    <li><strong>Break-even</strong> = the year EV's cumulative cost drops below gas</li>
                    <li>EVs assume a <strong>{currency(FEDERAL_INCENTIVE)}</strong> federal incentive (eligibility varies)</li>
                  </ul>
                  <p>
                    State electricity and gasoline prices are representative statewide averages used to preset the
                    sliders, not live market prices. Figures exclude financing interest and resale value — see the{" "}
                    <Link to="/calculator" className="text-primary underline">full TCO Calculator</Link> for those.
                    Actual results vary with your utility rate, local fuel prices, and driving habits.
                  </p>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </div>
        </section>

        {/* CTA */}
        <section className="pb-20">
          <div className="container px-4 max-w-4xl">
            <div className="rounded-3xl gradient-hero p-8 md:p-10 text-center text-primary-foreground">
              <h2 className="text-2xl md:text-3xl font-bold font-display mb-3">Want the full picture?</h2>
              <p className="text-primary-foreground/90 mb-6 max-w-xl mx-auto">
                See total cost of ownership — purchase, financing, incentives, maintenance, and resale —
                with our detailed calculator.
              </p>
              <Link to="/calculator">
                <Button variant="secondary" size="lg" className="rounded-2xl">
                  Open the TCO Calculator <ArrowRight className="w-5 h-5" />
                </Button>
              </Link>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default ElectricityVsGasoline;
