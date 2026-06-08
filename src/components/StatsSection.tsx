import { DollarSign, Fuel, Globe, TrendingUp, TrendingDown, Activity } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import statsBg from "@/assets/stats-bg.jpg";
import { useGasPrices } from "@/hooks/use-gas-prices";
import { NATIONAL_AVG, STATE_ENERGY_RATES } from "@/data/state-energy-rates";

const stats = [
  {
    icon: DollarSign,
    category: "Sticker Cost",
    value: "$50,000+",
    label: "Average price of a new gas vehicle today",
    trend: { icon: TrendingUp, text: "Rising yearly", tone: "text-red-500" },
    accent: "gradient-primary",
  },
  {
    icon: Fuel,
    category: "Fuel Price",
    value: "$4.44",
    sub: "avg · up to $6.04 / gal",
    label: "What a gallon of gas costs — and the highest in the U.S.",
    trend: { icon: Activity, text: "Volatile", tone: "text-amber-500" },
    accent: "gradient-green",
  },
  {
    icon: Globe,
    category: "Adoption",
    value: "30%+",
    label: "Share of global new vehicles now electric — and climbing",
    trend: { icon: TrendingDown, text: "Costs falling", tone: "text-secondary" },
    accent: "gradient-hero",
  },
];

const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  // Live AAA national gas price — same source as the EV vs Gas page, so the two
  // pages always show the same figure. Falls back to the national average.
  const { data: gasData } = useGasPrices();
  const national = gasData?.national ?? NATIONAL_AVG.gasPricePerGallon;
  const caHigh = gasData?.prices?.CA ?? STATE_ENERGY_RATES.CA.gasPricePerGallon;

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="dashboard" className="py-20 md:py-28 relative overflow-hidden" ref={ref}>
      {/* Backdrop */}
      <div className="absolute inset-0">
        <img src={statsBg} alt="EV highway infrastructure" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-background/85 backdrop-blur-md" />
        <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-secondary/5" />
      </div>

      <div className="container relative z-10">
        <div className="text-center max-w-2xl mx-auto mb-14 md:mb-16">
          <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            <span className="relative flex h-2 w-2">
              <span className="absolute inline-flex h-full w-full rounded-full bg-secondary opacity-75 animate-ping" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-secondary" />
            </span>
            US EV Dashboard
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground">
            The EV Revolution <span className="text-gradient-primary">by the Numbers</span>
          </h2>
          <p className="text-muted-foreground text-base md:text-lg mt-4">
            Why drivers are making the switch — the cost of gas keeps climbing while EVs keep getting cheaper.
          </p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
          {stats.map((stat, i) => {
            // The Fuel Price card pulls the live national + CA-high figures so it
            // stays consistent with the EV vs Gas calculator.
            const isFuel = stat.category === "Fuel Price";
            const value = isFuel ? `$${national.toFixed(2)}` : stat.value;
            const sub = isFuel ? `avg · up to $${caHigh.toFixed(2)} / gal` : stat.sub;
            return (
            <div
              key={i}
              className={`group relative rounded-3xl p-7 md:p-8 bg-card/75 backdrop-blur-xl border border-white/40 shadow-lg overflow-hidden transition-all duration-500 hover:shadow-2xl hover:-translate-y-1.5 ${
                visible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              {/* Top accent bar */}
              <div className={`absolute top-0 left-0 right-0 h-1 ${stat.accent}`} aria-hidden />
              {/* Hover gradient ring */}
              <div className="absolute inset-0 rounded-3xl ring-1 ring-inset ring-transparent group-hover:ring-primary/20 transition" aria-hidden />

              <div className="relative flex items-center justify-between mb-6">
                <span className={`grid place-items-center w-14 h-14 rounded-2xl ${stat.accent} shadow-md group-hover:scale-105 transition-transform`}>
                  <stat.icon className="text-primary-foreground" size={26} />
                </span>
                <span className="text-[11px] font-semibold tracking-wider uppercase text-muted-foreground">
                  {stat.category}
                </span>
              </div>

              <div className="relative">
                <div className="text-4xl md:text-5xl font-bold font-display text-gradient-primary leading-none">
                  {value}
                </div>
                {sub && <div className="text-xs font-medium text-muted-foreground mt-1.5">{sub}</div>}
                <p className="text-sm md:text-[15px] text-muted-foreground mt-3 leading-relaxed">{stat.label}</p>
              </div>

              <div className="relative mt-5 pt-4 border-t border-border/60 flex items-center gap-1.5">
                <stat.trend.icon className={`w-4 h-4 ${stat.trend.tone}`} />
                <span className={`text-xs font-semibold ${stat.trend.tone}`}>{stat.trend.text}</span>
              </div>
            </div>
            );
          })}
        </div>

        <p className="text-center text-xs text-muted-foreground mt-8">
          Sources: AAA Gas Prices · Kelley Blue Book · IEA Global EV Outlook — figures approximate, updated 2026.
        </p>
      </div>
    </section>
  );
};

export default StatsSection;
