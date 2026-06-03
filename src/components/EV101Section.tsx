import { DollarSign, Shield, Wrench, GraduationCap, BatteryCharging, Snowflake, Landmark, Leaf } from "lucide-react";
import { Link } from "react-router-dom";
import evCharging from "@/assets/ev-charging.jpg";
import evWinter from "@/assets/ev-winter.jpg";
import workforce from "@/assets/workforce.jpg";
import evSavings from "@/assets/ev-savings.jpg";
import evSafety from "@/assets/ev-safety.jpg";
import steamEducation from "@/assets/steam-education.jpg";
import financialSavings from "@/assets/financial-savings.jpg";
import evPolicy from "@/assets/ev-policy.jpg";
import reducedEmissions from "@/assets/reduced-emissions.jpg";

interface Card {
  icon: typeof DollarSign;
  title: string;
  desc: string;
  link: string;
  image: string;
  color: string;
  internal?: boolean;
}

const cards: Card[] = [
  {
    icon: DollarSign,
    title: "Rebates & Incentives",
    desc: "Under current Federal guidelines, drivers of U.S.-assembled EVs can claim an annual tax deduction of up to $10,000. Some States offer additional Point-of-Sale vouchers for used EVs — Click the link below to access our rebate and incentives tool, to see the rebates that are applicable for you.",
    link: "/rebates-incentives",
    internal: true,
    image: evSavings,
    color: "from-primary to-primary/80",
  },
  {
    icon: Wrench,
    title: "Workforce & Economic Development",
    desc: "3.5M+ clean energy jobs and counting. Clean energy employment grew at 3x the rate of the overall economy, with 400,000+ in the clean vehicle industry.",
    link: "/workforce-economic-development",
    internal: true,
    image: workforce,
    color: "from-secondary to-secondary/80",
  },
  {
    icon: Shield,
    title: "EVs & Road Safety",
    desc: "Lower center of gravity reduces rollover risk. EVs are 60x less likely to catch fire than gasoline vehicles thanks to sealed, armored battery shells.",
    link: "/ev-road-safety",
    internal: true,
    image: evSafety,
    color: "from-primary to-secondary",
  },
  {
    icon: GraduationCap,
    title: "STEAM Education",
    desc: "From the 'Battery Belt' to innovation hubs, community colleges launch national upskilling for high-voltage systems, battery chemistry, and smart-grid integration.",
    link: "/steam-education",
    internal: true,
    image: steamEducation,
    color: "from-secondary to-primary",
  },
  {
    icon: BatteryCharging,
    title: "EV Charging 101",
    desc: "240,000+ public charging ports across 78,000+ stations. Ultra-fast tech allows 200 miles of range in just 15 minutes. Goal: 500,000 chargers by 2030.",
    link: "/ev-charging-101",
    internal: true,
    image: evCharging,
    color: "from-primary to-primary/80",
  },
  {
    icon: Snowflake,
    title: "EVs in Winter",
    desc: "Modern EVs with heat pumps and preconditioning features start instantly in sub-zero temps. Superior weight distribution provides better traction on snow and ice.",
    link: "/evs-in-winter",
    internal: true,
    image: evWinter,
    color: "from-blue-500 to-primary",
  },
  {
    icon: DollarSign,
    title: "Financial Savings",
    desc: "Save $6,000–$10,000 in maintenance over your vehicle's lifetime. Only 20 moving parts vs 2,000+ in gas engines. Brake pads last 3x longer with regenerative braking.",
    link: "/financial-savings",
    internal: true,
    image: financialSavings,
    color: "from-secondary to-secondary/80",
  },
  {
    icon: Landmark,
    title: "U.S. EV Policies",
    desc: "National goal: 50% zero-emission new vehicle sales by 2030. The $5B NEVI program is building coast-to-coast charging infrastructure across all 50 states.",
    link: "/us-ev-policies",
    internal: true,
    image: evPolicy,
    color: "from-primary to-secondary",
  },
  {
    icon: Leaf,
    title: "Reduced Emissions",
    desc: "EVs produce zero tailpipe emissions. Switching to an EV reduces lifetime greenhouse gas emissions by up to 64% — equivalent to planting 77 trees over 10 years.",
    link: "/reduced-emissions",
    internal: true,
    image: reducedEmissions,
    color: "from-secondary to-primary",
  },
];

const EV101Section = () => {
  return (
    <section id="ev101" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            EV 101
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
            Everything You Need to <span className="text-gradient-primary">Know</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            From savings and safety to charging and policy — discover why electric vehicles are the smart choice for America.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {cards.map((card, i) => {
            const cardClass =
              "group relative bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50";
            const inner = (
              <>
                {card.image && (
                  <div className="h-48 overflow-hidden">
                    <img
                      src={card.image}
                      alt={card.title}
                      className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                      loading="lazy"
                    />
                  </div>
                )}
                <div className="p-6">
                  <div className={`inline-flex items-center justify-center w-11 h-11 rounded-xl bg-gradient-to-br ${card.color} mb-4`}>
                    <card.icon className="text-primary-foreground" size={20} />
                  </div>
                  <h3 className="text-lg font-bold font-display text-foreground mb-2 group-hover:text-primary transition-colors">
                    {card.title}
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{card.desc}</p>
                  <span className="inline-block mt-4 text-sm font-semibold text-primary group-hover:underline">
                    Read More →
                  </span>
                </div>
              </>
            );

            return card.internal ? (
              <Link key={i} to={card.link} className={cardClass}>
                {inner}
              </Link>
            ) : (
              <a key={i} href={card.link} target="_blank" rel="noopener noreferrer" className={cardClass}>
                {inner}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default EV101Section;
