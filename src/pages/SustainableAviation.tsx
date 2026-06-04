import { Plane } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import sustainableAviation from "@/assets/sustainable-aviation.jpg";
import evtol from "@/assets/evtol.jpg";
import reducedEmissions from "@/assets/reduced-emissions.jpg";
import evCharging from "@/assets/ev-charging.jpg";

const gallery: ContentShot[] = [
  { src: sustainableAviation, caption: "Sustainable aviation fuel cuts lifecycle CO₂" },
  { src: evtol, caption: "Electric commuter planes for short hops" },
  { src: reducedEmissions, caption: "Cleaner skies over regional airports" },
  { src: evCharging, caption: "Electrified ground service equipment" },
];

const stats: ContentStat[] = [
  { value: "Up to 80%", label: "Lifecycle CO₂ reduction from sustainable aviation fuel versus conventional jet fuel" },
  { value: "<250 mi", label: "Regional routes targeted by the first electric commuter aircraft" },
  { value: "eGSE", label: "Airports electrifying tugs, belt loaders, and ground power units" },
  { value: "Growing", label: "A fast-expanding sector backed by airlines, airports, and federal policy" },
];

const sections: ContentSection[] = [
  {
    heading: "Sustainable aviation fuel (SAF)",
    body: [
      "Aviation is one of the hardest sectors to electrify outright, so the near-term lever is the fuel itself. Sustainable aviation fuel — made from waste oils, agricultural residues, and other low-carbon feedstocks — can cut lifecycle carbon emissions by up to 80% while dropping into existing engines and pipelines with no aircraft modifications.",
      "That drop-in compatibility is what makes SAF powerful: every gallon blended in starts reducing emissions immediately across the planes already flying.",
    ],
  },
  {
    heading: "Electrifying everything on the ground (eGSE)",
    body: [
      "Long before a plane takes off, a fleet of vehicles services it — tugs that push it back, belt loaders, baggage tractors, and ground power units. Airports are rapidly swapping this ground service equipment from diesel to electric, cutting emissions and noise right where workers and travelers breathe.",
      "Electric ground service equipment is a quiet win: the technology is mature, the duty cycles are predictable, and the air quality benefit around terminals is immediate.",
    ],
  },
  {
    heading: "Electric and hybrid regional aircraft",
    body: [
      "For the shortest routes, batteries are beginning to fly. Electric and hybrid-electric commuter planes are being developed to connect regional airports on trips under roughly 250 miles, where their range is sufficient and their low operating cost shines.",
      "These small aircraft could revive thin regional routes that are uneconomical with conventional planes — quiet, clean, and cheap to run between nearby communities.",
    ],
  },
  {
    heading: "The runway ahead",
    body: [
      "Decarbonizing flight is a layered effort, with different tools for different distances and timelines.",
    ],
    list: [
      "Short term: scale SAF production and blending to cut emissions from today's fleet.",
      "On the ground: electrify ground service equipment and airport vehicles for immediate local air-quality gains.",
      "Short haul: deploy battery-electric and hybrid commuter aircraft on regional routes.",
      "Long haul: continue research into hydrogen and next-generation efficiency for the biggest jets.",
      "Policy: federal incentives and airline commitments are pulling SAF and electrification forward together.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "Sustainable Aviation Fuel Investor Institute — Future of SAF Demand", url: "https://www.safii.org/the-future-of-worldwide-sustainable-aviation-fuel-saf-demand-different-transatlantic-government-policies-make-pathways-to-net-zero-aviation-difficult/" },
  { label: "FAA — Sustainable Aviation Fuels", url: "https://www.faa.gov/sustainability/sustainable-aviation-fuels" },
  { label: "U.S. Department of Energy — Sustainable Aviation Fuel", url: "https://www.energy.gov/eere/bioenergy/sustainable-aviation-fuel" },
];

const SustainableAviation = () => (
  <ContentPageLayout
    badge="Beyond Cars · Aviation"
    kicker="Multimodal · Field Brief"
    title="Sustainable Aviation &"
    highlight="eGSE"
    intro="Airports and airlines are cutting emissions fast — electrifying ground service equipment, blending sustainable aviation fuel that slashes lifecycle CO₂ by up to 80%, and connecting regional airports with the first electric commuter planes. This sector is growing rapidly."
    heroImage={sustainableAviation}
    icon={Plane}
    pullQuote="Different tools for different distances: SAF for today's jets, electric motors for tomorrow's short hops, electrons for everything on the ground."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default SustainableAviation;
