import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import {
  Calculator, Zap, DollarSign, BarChart3, ArrowRight,
  TrendingDown, TrendingUp, Car, Tag,
} from "lucide-react";
import { Link } from "react-router-dom";
import evChargerIcon from "@/assets/ev-charger-icon.png";
import gasPumpIcon from "@/assets/gas-pump-icon.png";
import { useGasPrices } from "@/hooks/use-gas-prices";
import { STATE_ENERGY_RATES } from "@/data/state-energy-rates";

const usd = (n: number, frac = 0) =>
  new Intl.NumberFormat("en-US", { style: "currency", currency: "USD", maximumFractionDigits: frac, minimumFractionDigits: frac }).format(n);

// Lowest + highest regular-gas price across U.S. states. Prefers live AAA data
// (via the gas-prices hook), falling back to representative statewide averages.
const useGasExtremes = () => {
  const { data } = useGasPrices();
  return useMemo(() => {
    const live = data?.prices ?? {};
    const entries = Object.keys(STATE_ENERGY_RATES).map((code) => ({
      code,
      name: STATE_ENERGY_RATES[code].name,
      price: live[code] ?? STATE_ENERGY_RATES[code].gasPricePerGallon,
    }));
    let low = entries[0];
    let high = entries[0];
    for (const e of entries) {
      if (e.price < low.price) low = e;
      if (e.price > high.price) high = e;
    }
    return { low, high };
  }, [data]);
};

const features = [
  { icon: Calculator, title: "Side-by-Side", desc: "Compare any EV vs gas vehicle with real cost data" },
  { icon: DollarSign, title: "True Cost of Ownership", desc: "Fuel, maintenance, insurance, incentives & depreciation" },
  { icon: BarChart3, title: "Break-Even Analysis", desc: "See exactly when your EV pays for itself" },
  { icon: Zap, title: "AI-Powered Insights", desc: "Get plain-English recommendations instantly" },
];

const TCOCalculatorSection = () => {
  const { low, high } = useGasExtremes();

  // Market snapshot — cool (vehicle) + warm (gas) tones.
  const marketStats = [
    { icon: Car, value: usd(50000), label: "Avg. new vehicle price", tone: "ev" as const },
    { icon: Tag, value: usd(26390), label: "Avg. used vehicle price", tone: "ev" as const },
    { icon: TrendingDown, value: `${usd(low.price, 2)}`, label: `Lowest U.S. gas · ${low.name}`, tone: "gas" as const },
    { icon: TrendingUp, value: `${usd(high.price, 2)}`, label: `Highest U.S. gas · ${high.name}`, tone: "gas" as const },
  ];

  return (
    <section id="tco-calculator" className="evg relative overflow-hidden py-20 md:py-28">
      {/* Atmosphere — split cool/warm glow + faint engineering grid */}
      <div className="evg-duel absolute inset-0" aria-hidden />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-12 md:mb-14">
          <div className="brief-mono inline-flex items-center gap-2 text-[11px] text-muted-foreground mb-5">
            <Calculator className="w-3.5 h-3.5" />
            TCO Calculator
          </div>

          <h2 className="font-charge text-3xl sm:text-4xl md:text-6xl text-foreground leading-[0.95]">
            <span className="flex items-center justify-center gap-3 md:gap-4 flex-wrap">
              <span className="grid place-items-center w-11 h-11 md:w-14 md:h-14 rounded-2xl shrink-0"
                style={{ background: "hsl(var(--ev-2) / 0.12)", color: "hsl(var(--ev-2))" }}>
                <img src={evChargerIcon} alt="" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
              </span>
              <span>EV vs Gas</span>
              <span className="grid place-items-center w-11 h-11 md:w-14 md:h-14 rounded-2xl shrink-0"
                style={{ background: "hsl(var(--gas) / 0.12)", color: "hsl(var(--gas))" }}>
                <img src={gasPumpIcon} alt="" className="w-7 h-7 md:w-9 md:h-9 object-contain" />
              </span>
            </span>
            <span className="block text-gradient-primary mt-3">Which Saves You More?</span>
          </h2>

          <p className="text-base md:text-lg text-muted-foreground leading-relaxed mt-5 max-w-2xl mx-auto">
            Compare the total cost of ownership between electric and gas vehicles —
            incentives, fuel, maintenance, and more, all in one place.
          </p>
        </div>

        {/* The duel — two contenders divided by a charged seam */}
        <div className="relative glass-card rounded-[28px] overflow-hidden shadow-elevated max-w-5xl mx-auto mb-12">
          <div className="grid grid-cols-1 md:grid-cols-2">
            {/* EV */}
            <div className="evg-panel-ev relative p-7 md:p-10">
              <div className="brief-mono text-[11px] mb-5" style={{ color: "hsl(var(--ev-2))" }}>
                01 — Electric
              </div>
              <div className="flex items-center gap-3 mb-6">
                <span className="grid place-items-center w-12 h-12 rounded-2xl shrink-0"
                  style={{ background: "hsl(var(--ev-2) / 0.14)", color: "hsl(var(--ev-2))" }}>
                  <img src={evChargerIcon} alt="" className="w-7 h-7 object-contain" />
                </span>
                <span className="evg-ink-ev font-charge text-2xl md:text-3xl">Electric</span>
              </div>
              <div className="evg-ink-ev font-charge text-5xl md:text-6xl leading-none tabular-nums">−60%</div>
              <p className="text-sm md:text-base text-muted-foreground mt-3 max-w-[22rem]">
                Lower cost to “fuel” vs gasoline — charge at home overnight and skip the pump.
              </p>
            </div>

            {/* Gas */}
            <div className="evg-panel-gas relative p-7 md:p-10 border-t md:border-t-0 border-border/40">
              <div className="brief-mono text-[11px] mb-5 md:text-right" style={{ color: "hsl(var(--gas))" }}>
                02 — Gasoline
              </div>
              <div className="flex items-center gap-3 mb-6 md:flex-row-reverse md:text-right">
                <span className="grid place-items-center w-12 h-12 rounded-2xl shrink-0"
                  style={{ background: "hsl(var(--gas) / 0.14)", color: "hsl(var(--gas))" }}>
                  <img src={gasPumpIcon} alt="" className="w-7 h-7 object-contain" />
                </span>
                <span className="evg-ink-gas font-charge text-2xl md:text-3xl">Gasoline</span>
              </div>
              <div className="md:text-right">
                <div className="evg-ink-gas font-charge text-5xl md:text-6xl leading-none tabular-nums">
                  {usd(high.price, 2)}
                </div>
                <p className="text-sm md:text-base text-muted-foreground mt-3 md:ml-auto max-w-[22rem]">
                  Highest U.S. gas per gallon ({high.name}) — and prices keep swinging.
                </p>
              </div>
            </div>
          </div>

          {/* Vertical charged seam (desktop) */}
          <div className="evg-seam-v hidden md:block absolute top-8 bottom-8 left-1/2 -translate-x-1/2" aria-hidden />

          {/* VS badge on the seam */}
          <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10">
            <span className="grid place-items-center w-14 h-14 rounded-full font-charge text-sm tracking-wider text-white shadow-elevated"
              style={{ background: "linear-gradient(135deg, hsl(var(--ev-2)), hsl(var(--gas)))" }}>
              VS
            </span>
          </div>
        </div>

        {/* Market snapshot */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5 max-w-5xl mx-auto mb-12">
          {marketStats.map((s) => {
            const c = s.tone === "ev" ? "hsl(var(--ev-2))" : "hsl(var(--gas))";
            return (
              <div
                key={s.label}
                className="relative rounded-2xl p-5 bg-white/70 backdrop-blur-md border border-border/50 hover:-translate-y-1 hover:shadow-lg transition-all duration-300"
              >
                <span className="absolute left-0 top-5 bottom-5 w-1 rounded-full" style={{ background: c }} />
                <s.icon className="mb-3 ml-1" size={26} style={{ color: c }} />
                <div className="font-charge text-2xl md:text-3xl tabular-nums ml-1" style={{ color: c }}>
                  {s.value}
                </div>
                <p className="text-muted-foreground text-xs md:text-sm leading-snug mt-1 ml-1">{s.label}</p>
              </div>
            );
          })}
        </div>

        {/* Feature chips */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 max-w-5xl mx-auto mb-12">
          {features.map((f) => (
            <div
              key={f.title}
              className="group flex items-start gap-3 p-4 rounded-2xl bg-card/80 backdrop-blur border border-border/50 hover:border-primary/30 hover:shadow-md transition-all duration-300"
            >
              <span className="grid place-items-center w-10 h-10 rounded-xl gradient-primary shrink-0 group-hover:scale-110 transition-transform">
                <f.icon className="w-5 h-5 text-primary-foreground" />
              </span>
              <div>
                <h3 className="font-semibold text-foreground text-sm leading-tight">{f.title}</h3>
                <p className="text-xs text-muted-foreground mt-1 leading-snug">{f.desc}</p>
              </div>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/electricity-vs-gasoline">
            <Button
              variant="hero"
              size="lg"
              className="text-lg md:text-xl font-bold px-12 py-7 md:py-8 rounded-2xl gap-3 shadow-elevated ring-2 ring-primary/20 hover:scale-[1.03] transition-transform"
            >
              <Calculator className="w-6 h-6" />
              Calculate Your Savings
              <ArrowRight className="w-6 h-6" />
            </Button>
          </Link>
          <p className="text-sm text-muted-foreground mt-4">Free • No signup required • U.S. data</p>
          <p className="text-xs text-muted-foreground mt-2">
            Powered by{" "}
            <a
              href="https://emobilityresearch.com"
              target="_blank"
              rel="noopener noreferrer"
              className="font-semibold text-foreground hover:text-primary transition-colors"
            >
              EmobilityResearch.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default TCOCalculatorSection;
