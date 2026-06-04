import { Ship } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import maritime from "@/assets/maritime.jpg";
import heavyDuty from "@/assets/heavy-duty.jpg";
import reducedEmissions from "@/assets/reduced-emissions.jpg";
import sustainableAviation from "@/assets/sustainable-aviation.jpg";

const gallery: ContentShot[] = [
  { src: maritime, caption: "Electric ferries and tugs cut costs and fumes" },
  { src: heavyDuty, caption: "Shore power replaces idling diesel engines" },
  { src: reducedEmissions, caption: "Cleaner air for port communities" },
  { src: sustainableAviation, caption: "Decarbonizing the hardest sectors" },
];

const stats: ContentStat[] = [
  { value: "70%+", label: "Of major U.S. ports targeted for shore power capability by end of 2026" },
  { value: "30–40%", label: "Operating cost cut from electric ferries and tugboats" },
  { value: "At berth", label: "Shore power lets docked ships shut off their diesel engines" },
  { value: "Zero", label: "Tailpipe emissions from battery-electric harbor craft" },
];

const sections: ContentSection[] = [
  {
    heading: "Ports as pollution hotspots — and shore power",
    body: [
      "Ports concentrate an enormous amount of diesel exhaust in a small area: ships idling at berth, trucks queuing, and cargo equipment running, all next to dense waterfront communities that bear the health burden. Shore power — also called cold ironing — lets a docked ship plug into the grid and shut its engines off entirely.",
      "The U.S. is racing to outfit the majority of its major ports with shore power, cutting the at-berth emissions that hang over harbor neighborhoods the longest.",
    ],
  },
  {
    heading: "Electric ferries and tugboats",
    body: [
      "Harbor craft are ideal early targets for electrification. Ferries run fixed routes and return to the same dock; tugboats work short, intense shifts in a contained area. Both can charge between runs and skip diesel altogether.",
      "Operators report electric ferries and tugs cutting operating costs by 30 to 40 percent through cheaper energy and lower maintenance — while eliminating the fumes and noise along the waterfront.",
    ],
  },
  {
    heading: "The challenge of the biggest ships",
    body: [
      "Ocean-going cargo ships are the hard problem. They're too large and travel too far for batteries alone, so decarbonizing them relies on a mix of shore power in port and cleaner fuels at sea — green methanol, ammonia, and hydrogen-derived fuels now entering service.",
      "The strategy mirrors aviation: electrify what can be electrified, and switch the long-haul giants to low-carbon fuels for the distances batteries can't yet reach.",
    ],
  },
  {
    heading: "Funding and the road ahead",
    body: [
      "Federal programs are accelerating the transition across the whole maritime sector.",
    ],
    list: [
      "Shore power: grants to electrify berths so ships can switch off engines at dock.",
      "Harbor craft: funding to replace diesel ferries, tugs, and workboats with electric models.",
      "Port equipment: electrifying cranes, yard tractors, and cargo handlers.",
      "Clean fuels: developing methanol, ammonia, and hydrogen pathways for ocean-going ships.",
      "Community health: prioritizing the port-adjacent neighborhoods most exposed to diesel exhaust.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "EPA — Ports Initiative", url: "https://www.epa.gov/ports-initiative" },
  { label: "U.S. Maritime Administration (MARAD) — Environment & Sustainability", url: "https://www.maritime.dot.gov/environment-and-sustainability" },
  { label: "U.S. Department of Energy — Sustainable Transportation", url: "https://www.energy.gov/eere/sustainable-transportation" },
];

const SustainableMaritime = () => (
  <ContentPageLayout
    badge="Beyond Cars · Maritime"
    kicker="Multimodal · Field Brief"
    title="Sustainable"
    highlight="Maritime"
    intro="More than 70% of major U.S. ports are set to offer shore power by the end of 2026, letting docked ships switch off their diesel engines — while electric ferries and tugboats cut operating costs 30 to 40 percent and clear the air for waterfront communities."
    heroImage={maritime}
    icon={Ship}
    pullQuote="Electrify what can be electrified — ferries, tugs, and berths — and switch the ocean-going giants to clean fuels for the rest."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default SustainableMaritime;
