import { useMemo } from "react";
import { Button } from "@/components/ui/button";
import { Calculator, Zap, DollarSign, BarChart3, ArrowRight, Car, Tag, TrendingDown, TrendingUp } from "lucide-react";
import { Link } from "react-router-dom";
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
  {
    icon: Calculator,
    title: "Side-by-Side Comparison",
    desc: "Compare any EV vs gas vehicle with real cost data",
  },
  {
    icon: DollarSign,
    title: "True Cost of Ownership",
    desc: "Fuel, maintenance, insurance, incentives & depreciation",
  },
  {
    icon: BarChart3,
    title: "Break-Even Analysis",
    desc: "See exactly when your EV pays for itself",
  },
  {
    icon: Zap,
    title: "AI-Powered Insights",
    desc: "Get plain-English recommendations instantly",
  },
];

const TCOCalculatorSection = () => {
  const { low, high } = useGasExtremes();

  const marketStats = [
    { icon: Car, value: usd(50000), label: "Avg. new vehicle price", color: "text-primary" },
    { icon: Tag, value: usd(26390), label: "Avg. used vehicle price", color: "text-secondary" },
    { icon: TrendingDown, value: `${usd(low.price, 2)}/gal`, label: `Lowest U.S. gas · ${low.name}`, color: "text-secondary" },
    { icon: TrendingUp, value: `${usd(high.price, 2)}/gal`, label: `Highest U.S. gas · ${high.name}`, color: "text-primary" },
  ];

  return (
    <section id="tco-calculator" className="py-20 md:py-28 relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-muted/50 via-background to-muted/30" />
      <div className="absolute top-0 right-0 w-96 h-96 bg-primary/5 rounded-full blur-3xl" />
      <div className="absolute bottom-0 left-0 w-80 h-80 bg-secondary/5 rounded-full blur-3xl" />

      <div className="container relative z-10 px-4">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 text-primary text-sm font-medium mb-6">
            <Calculator className="w-4 h-4" />
            TCO Calculator
          </div>
          <h2 className="text-2xl sm:text-3xl md:text-5xl font-bold text-foreground mb-6 leading-tight whitespace-nowrap">
            EV vs Gas: <span className="text-gradient-primary">Which Saves You More?</span>
          </h2>
          <p className="text-lg text-muted-foreground leading-relaxed">
            Compare the total cost of ownership between electric and gas vehicles.
            Factor in incentives, fuel costs, maintenance, and more — all in one place.
          </p>
        </div>

        {/* Market snapshot — today's vehicle prices + U.S. gas-price spread */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 md:gap-6 mb-12">
          {marketStats.map((s) => (
            <div
              key={s.label}
              className="glass-card rounded-3xl p-6 text-center hover:shadow-xl hover:-translate-y-1 transition-all duration-300"
            >
              <s.icon className={`${s.color} mx-auto mb-3`} size={32} />
              <div className={`text-2xl md:text-4xl font-bold font-display ${s.color} mb-1.5 tabular-nums`}>
                {s.value}
              </div>
              <p className="text-muted-foreground text-xs md:text-sm leading-snug">{s.label}</p>
            </div>
          ))}
        </div>

        {/* Feature Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 mb-12">
          {features.map((f) => (
            <div
              key={f.title}
              className="group relative p-6 rounded-2xl bg-card border border-border/50 hover:border-primary/30 hover:shadow-lg transition-all duration-300"
            >
              <div className="w-12 h-12 rounded-xl gradient-primary flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                <f.icon className="w-6 h-6 text-primary-foreground" />
              </div>
              <h3 className="font-semibold text-foreground mb-2">{f.title}</h3>
              <p className="text-sm text-muted-foreground">{f.desc}</p>
            </div>
          ))}
        </div>

        {/* CTA */}
        <div className="text-center">
          <Link to="/electricity-vs-gasoline">
            <Button variant="hero" size="lg" className="text-base px-10 py-6 rounded-2xl gap-3">
              Launch Calculator
              <ArrowRight className="w-5 h-5" />
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
              emobilityresearch.com
            </a>
          </p>
        </div>
      </div>
    </section>
  );
};

export default TCOCalculatorSection;
