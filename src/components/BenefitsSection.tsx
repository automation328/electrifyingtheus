import { Briefcase, HeartPulse, Wind, Fuel, Wrench, Plug } from "lucide-react";

const benefits = [
  {
    icon: Briefcase,
    title: "Jobs & Economic Growth",
    desc: "The American automotive industry supports 10M+ total jobs nationwide. Clean energy is the fastest-growing jobs sector.",
    link: "https://itif.org/publications/2026/03/23/assessing-evolving-global-competitiveness-of-us-auto-industry/",
    gradient: "gradient-primary",
  },
  {
    icon: HeartPulse,
    title: "Improved Public Health",
    desc: "$51.4B in avoided health costs, 4,700 avoided premature deaths, 97,400 avoided asthma attacks, and 466,000 avoided lost work days.",
    link: "https://www.lung.org/getmedia/ca3da495-2229-4535-9c36-69b63f037cea/Zeroing-In-On-Healthy-Air-Report-Michigan.pdf",
    gradient: "gradient-green",
  },
  {
    icon: Wind,
    title: "Reduced Emissions",
    desc: "Zero tailpipe emissions improve air quality. EVs reduce lifetime greenhouse gas emissions by up to 64% vs gas vehicles.",
    link: "https://www.epa.gov/clean-air-act-overview/progress-cleaning-air-and-improving-peoples-health",
    gradient: "gradient-primary",
  },
  {
    icon: Fuel,
    title: "Reduced Fuel Costs",
    desc: "Average cost to charge: $0.14/kWh — about $5.60 for 100 miles. That's up to 60% cheaper than gasoline.",
    link: "https://www.bellfordofadrian.com/blog/2024/october/22/what-does-it-cost-to-own-an-electric-vehicle-in-michigan.htm",
    gradient: "gradient-green",
  },
  {
    icon: Wrench,
    title: "Lower Maintenance",
    desc: "Save $6,000–$10,000 over your vehicle's lifetime. Fewer moving parts mean fewer trips to the mechanic.",
    link: "https://www.consumerreports.org/hybrids-evs/evs-offer-big-savings-over-traditional-gas-powered-cars/",
    gradient: "gradient-primary",
  },
  {
    icon: Plug,
    title: "Expanding Charging Network",
    desc: "240,000+ public charging ports across 78,000+ stations nationwide, with ultra-fast charging adding 200 miles in 15 minutes.",
    link: "https://www.telemetryagency.com/post/january-22-2026-ev-charging-still-expanding-in-us",
    gradient: "gradient-green",
  },
];

const BenefitsSection = () => {
  return (
    <section id="benefits" className="py-20 md:py-28">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4">
            Why Go Electric?
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
            Benefits of <span className="text-gradient-primary">Electric Vehicles</span>
          </h2>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {benefits.map((b, i) => (
            <a
              key={i}
              href={b.link}
              target="_blank"
              rel="noopener noreferrer"
              className="group relative rounded-3xl overflow-hidden transition-all duration-500 hover:-translate-y-1"
            >
              <div className={`${b.gradient} p-6 md:p-8 h-full rounded-3xl`}>
                <b.icon className="text-primary-foreground mb-5" size={32} />
                <h3 className="text-xl font-bold font-display text-primary-foreground mb-3">
                  {b.title}
                </h3>
                <p className="text-primary-foreground/85 text-sm leading-relaxed mb-4">
                  {b.desc}
                </p>
                <span className="text-primary-foreground/90 text-sm font-semibold group-hover:underline">
                  Learn More →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default BenefitsSection;
