import { Plane, Cpu, Bus, Ship, Bike, Car, GraduationCap, Truck } from "lucide-react";
import evtol from "@/assets/evtol.jpg";
import schoolBus from "@/assets/school-bus.jpg";
import sustainableAviation from "@/assets/sustainable-aviation.jpg";
import heavyDuty from "@/assets/heavy-duty.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import micromobility from "@/assets/micromobility.jpg";
import maritime from "@/assets/maritime.jpg";
import electricTransitBus from "@/assets/electric-transit-bus.jpg";

const modes = [
  {
    icon: Plane,
    title: "Sustainable Aviation",
    desc: "SAF reduces lifecycle CO₂ by up to 80%. Electric commuter planes now connect regional airports for trips under 250 miles.",
    link: "https://www.safii.org/the-future-of-worldwide-sustainable-aviation-fuel-saf-demand-different-transatlantic-government-policies-make-pathways-to-net-zero-aviation-difficult/",
    image: sustainableAviation,
  },
  {
    icon: Cpu,
    title: "eVTOLs & Drones",
    desc: "First commercial eVTOL air taxi services launched in NYC and LA. Delivery drones active in 50+ U.S. cities.",
    link: "https://www.transportation.gov/sites/dot.gov/files/2025-12/AAM%20National%20Strategy%202025.pdf",
    image: evtol,
  },
  {
    icon: GraduationCap,
    title: "Electric School Buses",
    desc: "EPA investing $5B to replace diesel buses. 8,700+ electric buses funded across 1,300 school districts.",
    link: "https://www.epa.gov/cleanschoolbus/clean-school-bus-program-awards",
    image: schoolBus,
  },
  {
    icon: Truck,
    title: "Heavy-Duty Electrification",
    desc: "Zero-emission freight corridor strategy prioritizing charging hubs along major interstates handling 10,000+ trucks daily.",
    link: "https://www.transportation.gov/freight/NFSP",
    image: heavyDuty,
  },
  {
    icon: Bus,
    title: "Electric Public Transit",
    desc: "$2B+ in annual federal funding for low/no-emission vehicles. Transit authorities in all 50 states replacing diesel fleets.",
    link: "https://itdp.org/2026/01/06/better-bus-service-electric-buses-stmagazine-37/",
    image: electricTransitBus,
  },
  {
    icon: Car,
    title: "Rideshare, Rental Cars, and Fleets",
    desc: "Uber and Lyft committing to 100% EV fleets. Rental companies offering EVs nationwide at competitive rates.",
    link: "https://www.cnbc.com/2022/06/18/how-the-massive-ev-transition-is-starting-in-the-car-rental-industry.html",
    image: rideshareFleet,
  },
  {
    icon: Bike,
    title: "Micro-mobility",
    desc: "150M+ shared trips annually in 400+ cities. E-bike rebate programs offering up to $1,500 in savings.",
    link: "https://www.peopleforbikes.org/news/solutions-to-the-e-moto-problem",
    image: micromobility,
  },
  {
    icon: Ship,
    title: "Sustainable Maritime",
    desc: "70%+ of major U.S. ports equipped with Shore Power by end of 2026. Electric ferries and tugboats cut costs 30-40%.",
    link: "https://www.epa.gov/ports-initiative",
    image: maritime,
  },
];

const MultimodalSection = () => {
  return (
    <section id="multimodal" className="py-20 md:py-28 bg-muted/30">
      <div className="container">
        <div className="text-center mb-16">
          <span className="inline-block px-4 py-1.5 rounded-full bg-primary/10 text-primary text-sm font-semibold mb-4">
            Beyond Cars
          </span>
          <h2 className="text-3xl md:text-5xl font-bold font-display text-foreground mb-4">
            Multimodal <span className="text-gradient-primary">E-Mobility</span>
          </h2>
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            The electric revolution extends far beyond passenger vehicles — from the skies to the seas.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
          {modes.map((mode, i) => (
            <a
              key={i}
              href={mode.link}
              target="_blank"
              rel="noopener noreferrer"
              className={`group bg-card rounded-3xl overflow-hidden shadow-sm hover:shadow-xl transition-all duration-500 hover:-translate-y-1 border border-border/50 ${
                mode.image ? "lg:col-span-2 lg:row-span-2" : ""
              }`}
            >
              {mode.image && (
                <div className="h-48 lg:h-64 overflow-hidden">
                  <img
                    src={mode.image}
                    alt={mode.title}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-700"
                    loading="lazy"
                  />
                </div>
              )}
              <div className="p-5 md:p-6">
                <div className="inline-flex items-center justify-center w-10 h-10 rounded-xl gradient-primary mb-3">
                  <mode.icon className="text-primary-foreground" size={18} />
                </div>
                <h3 className="text-base font-bold font-display text-foreground mb-2 group-hover:text-primary transition-colors">
                  {mode.title}
                </h3>
                <p className="text-muted-foreground text-sm leading-relaxed">{mode.desc}</p>
                <span className="inline-block mt-3 text-sm font-semibold text-primary group-hover:underline">
                  Read More →
                </span>
              </div>
            </a>
          ))}
        </div>
      </div>
    </section>
  );
};

export default MultimodalSection;
