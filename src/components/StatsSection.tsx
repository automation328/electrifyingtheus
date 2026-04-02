import { Zap, Battery, TrendingUp, MapPin } from "lucide-react";
import { useEffect, useRef, useState } from "react";

const stats = [
  { icon: Zap, value: "8M+", label: "Electric Vehicles Sold in the U.S.", color: "text-primary" },
  { icon: Battery, value: "60%", label: "Cheaper to Charge vs Gas", color: "text-secondary" },
  { icon: TrendingUp, value: "40%", label: "Of Consumers Plan to Go Electric", color: "text-primary" },
  { icon: MapPin, value: "240K+", label: "EV Charging Ports Nationwide", color: "text-secondary" },
];

const StatsSection = () => {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const obs = new IntersectionObserver(
      ([e]) => { if (e.isIntersecting) setVisible(true); },
      { threshold: 0.2 }
    );
    if (ref.current) obs.observe(ref.current);
    return () => obs.disconnect();
  }, []);

  return (
    <section id="dashboard" className="py-20 md:py-28 bg-muted/50" ref={ref}>
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            US EV Dashboard
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground">
            The EV Revolution <span className="text-gradient-primary">by the Numbers</span>
          </h2>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-6">
          {stats.map((stat, i) => (
            <div
              key={i}
              className={`glass-card rounded-3xl p-6 md:p-8 text-center transition-all duration-700 hover:shadow-xl hover:-translate-y-1 ${
                visible ? "animate-fade-up" : "opacity-0"
              }`}
              style={{ animationDelay: `${i * 0.15}s` }}
            >
              <stat.icon className={`${stat.color} mx-auto mb-4`} size={36} />
              <div className={`text-3xl md:text-5xl font-bold font-display ${stat.color} mb-2`}>
                {stat.value}
              </div>
              <p className="text-muted-foreground text-sm md:text-base">{stat.label}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default StatsSection;
