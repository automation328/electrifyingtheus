import { useState, useMemo } from "react";
import { Link } from "react-router-dom";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, Legend, ResponsiveContainer, Cell,
} from "recharts";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Slider } from "@/components/ui/slider";
import {
  Accordion, AccordionContent, AccordionItem, AccordionTrigger,
} from "@/components/ui/accordion";
import { Button } from "@/components/ui/button";
import { Zap, Fuel, TrendingDown, Gauge, MapPin, BarChart3, ArrowRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import UsElectricityMap from "@/components/UsElectricityMap";
import { vehicles, getVehiclesByType } from "@/data/vehicles";
import { STATE_ENERGY_RATES, STATE_CODES, NATIONAL_AVG } from "@/data/state-energy-rates";

const EV_BLUE = "hsl(214, 100%, 36%)";
const GAS_GRAY = "hsl(215, 16%, 47%)";

const currency = (n: number, frac = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: frac, minimumFractionDigits: frac }).format(n);

const evVehicles = getVehiclesByType("ev");
const gasVehicles = getVehiclesByType("gas");

/** Fuel/energy cost per mile for a vehicle at the given energy prices. */
const evCostPerMile = (kwhPer100mi: number, centsPerKwh: number) =>
  (kwhPer100mi / 100) * (centsPerKwh / 100);
const gasCostPerMile = (mpg: number, pricePerGallon: number) =>
  (1 / mpg) * pricePerGallon;

const ElectricityVsGasoline = () => {
  const [stateCode, setStateCode] = useState("CA");
  const [evId, setEvId] = useState("chevy-equinox-ev");
  const [gasId, setGasId] = useState("chevy-equinox");
  const [annualMiles, setAnnualMiles] = useState(12000);
  const [compareClass, setCompareClass] = useState<"Sedan" | "SUV">("SUV");

  const rates = STATE_ENERGY_RATES[stateCode];
  const ev = vehicles.find((v) => v.id === evId)!;
  const gas = vehicles.find((v) => v.id === gasId)!;

  const result = useMemo(() => {
    const evPerMile = evCostPerMile(ev.kwhPer100mi ?? 30, rates.electricityCentsPerKwh);
    const gasPerMile = gasCostPerMile(gas.mpg ?? 28, rates.gasPricePerGallon);
    const perMileSavings = gasPerMile - evPerMile;
    const annualSavings = perMileSavings * annualMiles;
    const evCheaper = perMileSavings >= 0;

    // Cumulative fueling vs charging cost by year (operating cost only).
    const chart = Array.from({ length: 11 }, (_, year) => ({
      year,
      [`${ev.name}`]: Math.round(evPerMile * annualMiles * year),
      [`${gas.name}`]: Math.round(gasPerMile * annualMiles * year),
    }));

    return { evPerMile, gasPerMile, perMileSavings, annualSavings, evCheaper, chart };
  }, [ev, gas, rates, annualMiles]);

  // Class comparison (national-average prices) — cost per mile.
  const classComparison = useMemo(() => {
    const pair = {
      Sedan: { ev: "tesla-model-3", gas: "toyota-camry" },
      SUV: { ev: "chevy-equinox-ev", gas: "chevy-equinox" },
    }[compareClass];
    const cEv = vehicles.find((v) => v.id === pair.ev)!;
    const cGas = vehicles.find((v) => v.id === pair.gas)!;
    const evPm = evCostPerMile(cEv.kwhPer100mi!, NATIONAL_AVG.electricityCentsPerKwh);
    const gasPm = gasCostPerMile(cGas.mpg!, NATIONAL_AVG.gasPricePerGallon);
    const annualSavings = (gasPm - evPm) * 12000;
    return {
      cEv, cGas, evPm, gasPm, annualSavings,
      data: [
        { name: cGas.name, cost: +gasPm.toFixed(2), fill: GAS_GRAY },
        { name: cEv.name, cost: +evPm.toFixed(2), fill: EV_BLUE },
      ],
    };
  }, [compareClass]);

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
          <div className="container px-4 max-w-6xl">
            <h2 className="text-2xl md:text-3xl font-bold font-display text-foreground mb-2">
              Electricity vs Gasoline Calculator
            </h2>
            <p className="text-muted-foreground mb-10 max-w-2xl">
              Compare the per-mile cost of driving an electric vehicle to a gas-powered equivalent.
              Pick a state, two vehicles, and your annual mileage to see your savings.
            </p>

            <div className="grid lg:grid-cols-2 gap-8">
              {/* Inputs */}
              <div className="space-y-6 p-6 rounded-3xl border border-border bg-card">
                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <MapPin className="w-4 h-4 text-primary" /> Select a state
                  </label>
                  <Select value={stateCode} onValueChange={setStateCode}>
                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                    <SelectContent className="max-h-72">
                      {STATE_CODES.map((c) => (
                        <SelectItem key={c} value={c}>{STATE_ENERGY_RATES[c].name}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <p className="text-xs text-muted-foreground mt-2">
                    {rates.electricityCentsPerKwh}¢/kWh electricity · {currency(rates.gasPricePerGallon, 2)}/gal gas
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <Zap className="w-4 h-4 text-primary" /> Select an electric vehicle
                  </label>
                  <Select value={evId} onValueChange={setEvId}>
                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {evVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name} · {v.kwhPer100mi} kWh/100mi</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground flex items-center gap-2 mb-2">
                    <Fuel className="w-4 h-4 text-secondary" /> Select a gas vehicle
                  </label>
                  <Select value={gasId} onValueChange={setGasId}>
                    <SelectTrigger className="rounded-xl h-12"><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {gasVehicles.map((v) => (
                        <SelectItem key={v.id} value={v.id}>{v.name} · {v.mpg} MPG</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <label className="text-sm font-medium text-muted-foreground mb-2 block">
                    Annual miles: <span className="text-foreground font-semibold">{annualMiles.toLocaleString()} mi</span>
                  </label>
                  <Slider
                    value={[annualMiles]}
                    onValueChange={([v]) => setAnnualMiles(v)}
                    min={5000} max={30000} step={1000}
                    className="mt-3"
                  />
                </div>
              </div>

              {/* Results */}
              <div className="rounded-3xl gradient-primary p-6 md:p-8 text-primary-foreground flex flex-col">
                <div className="text-xs uppercase tracking-wider text-primary-foreground/70 mb-3">Results</div>
                <p className="text-xl md:text-2xl font-display font-semibold leading-snug mb-6">
                  {result.evCheaper ? (
                    <>On average, you would save{" "}
                      <span className="text-3xl md:text-4xl font-bold">{currency(result.perMileSavings, 2)}</span> per mile
                      {" "}or <span className="text-3xl md:text-4xl font-bold">{currency(result.annualSavings)}</span> per year
                      {" "}with the {ev.name}.</>
                  ) : (
                    <>In {rates.name}, the {gas.name} is currently about{" "}
                      <span className="font-bold">{currency(Math.abs(result.annualSavings))}</span>/yr cheaper to fuel —
                      try a more efficient EV or a higher-mileage scenario.</>
                  )}
                </p>

                <div className="text-sm font-medium text-primary-foreground/80 mb-2">
                  Charging vs. fueling costs by year
                </div>
                <div className="bg-primary-foreground/10 rounded-2xl p-3 h-[280px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={result.chart} margin={{ top: 8, right: 8, left: -8, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.15)" />
                      <XAxis dataKey="year" stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false}
                        label={{ value: "Years", position: "insideBottom", offset: -2, fill: "rgba(255,255,255,0.7)", fontSize: 11 }} />
                      <YAxis stroke="rgba(255,255,255,0.7)" fontSize={11} tickLine={false}
                        tickFormatter={(v) => `$${(v / 1000).toFixed(0)}k`} />
                      <Tooltip
                        formatter={(v: number) => currency(v)}
                        contentStyle={{ background: "#0b2a5b", border: "none", borderRadius: 12, color: "#fff", fontSize: 12 }}
                      />
                      <Legend wrapperStyle={{ fontSize: 11 }} />
                      <Line type="monotone" dataKey={gas.name} stroke="#ffd166" strokeWidth={2.5} dot={false} />
                      <Line type="monotone" dataKey={ev.name} stroke="#7ee0c0" strokeWidth={2.5} dot={false} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
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
                  <strong>{classComparison.cGas.name}</strong> (at national-average energy prices,
                  12,000 mi/yr).
                </p>
                <div className="mt-4 text-sm text-muted-foreground">
                  <div className="flex items-center gap-2"><span className="w-3 h-3 rounded-sm" style={{ background: GAS_GRAY }} /> {classComparison.cGas.name}: {currency(classComparison.gasPm, 2)}/mi</div>
                  <div className="flex items-center gap-2 mt-1"><span className="w-3 h-3 rounded-sm" style={{ background: EV_BLUE }} /> {classComparison.cEv.name}: {currency(classComparison.evPm, 2)}/mi</div>
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
                  <p>
                    This tool compares <strong>operating energy cost only</strong> — the cost to charge an EV versus
                    fuel a gas car. It does not include purchase price, financing, insurance, or maintenance (use the{" "}
                    <Link to="/calculator" className="text-primary underline">full TCO Calculator</Link> for that).
                  </p>
                  <ul className="list-disc pl-5 space-y-1">
                    <li><strong>EV cost/mile</strong> = (kWh per 100 mi ÷ 100) × electricity price ($/kWh)</li>
                    <li><strong>Gas cost/mile</strong> = (1 ÷ MPG) × gasoline price ($/gal)</li>
                    <li>Annual savings = (gas cost/mile − EV cost/mile) × annual miles</li>
                  </ul>
                  <p>
                    State electricity and gasoline prices are representative statewide averages for illustration,
                    not live market prices. Vehicle efficiency figures come from EPA-style ratings. Actual results
                    vary with your utility rate, local fuel prices, charging mix, and driving habits.
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
