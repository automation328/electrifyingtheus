import { Bus } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import electricTransitBus from "@/assets/electric-transit-bus.jpg";
import heavyDuty from "@/assets/heavy-duty.jpg";
import schoolBus from "@/assets/school-bus.jpg";
import micromobility from "@/assets/micromobility.jpg";

const gallery: ContentShot[] = [
  { src: electricTransitBus, caption: "Zero-emission buses on city routes" },
  { src: heavyDuty, caption: "Heavy electric drivetrains, proven daily" },
  { src: schoolBus, caption: "Public fleets going electric nationwide" },
  { src: micromobility, caption: "Transit plus last-mile, all electric" },
];

const stats: ContentStat[] = [
  { value: "$2B+", label: "Annual federal funding for low- and no-emission transit vehicles" },
  { value: "50", label: "States with transit authorities replacing diesel buses" },
  { value: "Zero", label: "Tailpipe emissions along the busiest urban corridors" },
  { value: "Quiet", label: "Smoother, near-silent rides for millions of daily passengers" },
];

const sections: ContentSection[] = [
  {
    heading: "Federal funding drives the transition",
    body: [
      "Public transit is electrifying with serious federal backing. Programs like the FTA's Low- and No-Emission Vehicle grants channel more than $2 billion a year to help transit agencies buy electric buses and build the depots and chargers to run them.",
      "That funding has put electric buses into service in transit systems across all 50 states — moving the technology from a handful of demonstration routes to a mainstream procurement choice.",
    ],
  },
  {
    heading: "Cleaner air where the most people breathe",
    body: [
      "Transit buses run their routes through the densest parts of cities, where the most people live, walk, and breathe. Swapping a diesel bus for an electric one removes tailpipe pollution exactly where exposure is highest.",
      "The benefit compounds: one full electric bus can take dozens of car trips off the road while producing none of its own tailpipe emissions, multiplying the air-quality gain.",
    ],
  },
  {
    heading: "Reliability and a better ride",
    body: [
      "Electric buses are quieter and smoother, with instant, even torque that makes for a gentler ride and a calmer street. For riders and drivers alike, the difference from a rattling diesel is immediate.",
      "Operators benefit too: fewer moving parts mean less maintenance and downtime, and electricity's stable price shields budgets from volatile diesel costs.",
    ],
  },
  {
    heading: "The transition challenges",
    body: [
      "Going electric at fleet scale takes planning, and agencies are working through real constraints.",
    ],
    list: [
      "Range and routes: matching bus range to the longest daily routes, especially in extreme weather.",
      "Charging: installing depot and on-route charging without disrupting service schedules.",
      "Grid capacity: upgrading electrical service at depots to charge many buses at once.",
      "Up-front cost: higher purchase prices offset over time by fuel and maintenance savings plus grants.",
      "Workforce: training technicians to maintain high-voltage electric drivetrains.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "ITDP — Better Bus Service with Electric Buses", url: "https://itdp.org/2026/01/06/better-bus-service-electric-buses-stmagazine-37/" },
  { label: "FTA — Low- and No-Emission Vehicle Program", url: "https://www.transit.dot.gov/lowno" },
  { label: "U.S. Department of Energy — Alternative Fuels Data Center", url: "https://afdc.energy.gov/" },
];

const ElectricPublicTransit = () => (
  <ContentPageLayout
    badge="Beyond Cars · Transit"
    kicker="Multimodal · Field Brief"
    title="Electric"
    highlight="Public Transit"
    intro="With more than $2 billion in annual federal funding for low- and no-emission vehicles, transit authorities in all 50 states are replacing diesel fleets with quiet, zero-tailpipe electric buses — cleaning the air along the busiest corridors where the most people breathe."
    heroImage={electricTransitBus}
    icon={Bus}
    pullQuote="One electric bus removes dozens of car trips and emits nothing of its own — clean air multiplied along the densest streets in the city."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default ElectricPublicTransit;
