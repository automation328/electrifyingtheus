import { DollarSign, Fuel, Globe } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import statsBg from "@/assets/stats-bg.jpg";

const stats = [
  { icon: DollarSign, value: "$50,000+", label: "Avg. Price of New Gas Vehicle", color: "text-primary" },
  { icon: Fuel, value: "$4.44 / $6.04", label: "Avg. Price of Gallon of Gas and Highest Price", color: "text-secondary" },
  { icon: Globe, value: "30+%", label: "Nearly 30% of Global Vehicles are Electric and growing", color: "text-primary" },
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
    <section id="dashboard" className="py-20 md:py-28 relative overflow-hidden" ref={ref}>
      <div className="absolute inset-0">
        <img src={statsBg} alt="EV highway infrastructure" className="w-full h-full object-cover" loading="lazy" />
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" />
      </div>
      <div className="container relative z-10">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            US EV Dashboard
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground">
            The EV Revolution <span className="text-gradient-primary">by the Numbers</span>
          </h2>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-5xl mx-auto">
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
