import { Bike } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import micromobility from "@/assets/micromobility.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import evFamily from "@/assets/ev-family.jpg";
import electricTransitBus from "@/assets/electric-transit-bus.jpg";

const gallery: ContentShot[] = [
  { src: micromobility, caption: "Shared e-bikes and scooters in the city" },
  { src: rideshareFleet, caption: "Solving the first and last mile" },
  { src: evFamily, caption: "E-bike rebates put riders on the road" },
  { src: electricTransitBus, caption: "Micromobility feeds public transit" },
];

const stats: ContentStat[] = [
  { value: "150M+", label: "Shared micromobility trips taken across the U.S. each year" },
  { value: "400+", label: "Cities with shared e-bike and e-scooter systems" },
  { value: "$1,500", label: "Savings available through some e-bike rebate and incentive programs" },
  { value: "<3 mi", label: "Short trips micromobility replaces — the least efficient car miles" },
];

const sections: ContentSection[] = [
  {
    heading: "The first- and last-mile problem",
    body: [
      "A huge share of car trips are short — a couple of miles to a transit stop, a store, or a friend's place. Those are the least efficient miles a car ever drives: a two-ton vehicle cold-started to move one person a short distance. Electric bikes and scooters are purpose-built for exactly these trips.",
      "By covering the gap between home and transit, micromobility also makes buses and trains more useful, stretching the reach of every transit line without a single new mile of track.",
    ],
  },
  {
    heading: "Incentives and access",
    body: [
      "E-bikes have gone mainstream, and a growing wave of state and local rebate programs — some worth up to $1,500 — is putting them within reach of more riders. An e-bike erases the hills and distance that keep people off a regular bicycle, opening cycling to commuters of every age and fitness level.",
      "Shared systems extend access further still, letting anyone grab an electric bike or scooter for a single trip without owning one.",
    ],
  },
  {
    heading: "Safety and infrastructure",
    body: [
      "Micromobility scales safely only with the right streets. Cities expanding protected bike lanes, calmed traffic, and dedicated parking see ridership climb and injuries fall.",
      "Clear rules on where devices can ride and park, plus better-designed vehicles, are turning early growing pains into reliable everyday transportation.",
    ],
  },
  {
    heading: "Climate and congestion impact",
    body: [
      "Small electric vehicles punch far above their weight on the problems cities care about most.",
    ],
    list: [
      "Efficiency: an e-bike uses a tiny fraction of the energy of a car for the same trip.",
      "Congestion: replacing short car trips frees up road space and parking.",
      "Access: low-cost mobility for people without a car or a driver's license.",
      "Health: active travel with an electric assist that keeps it accessible.",
      "Transit synergy: micromobility feeds riders to buses and trains, boosting the whole network.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "PeopleForBikes — Solutions to the E-Moto Problem", url: "https://www.peopleforbikes.org/news/solutions-to-the-e-moto-problem" },
  { label: "U.S. Department of Energy — Alternative Fuels Data Center", url: "https://afdc.energy.gov/" },
  { label: "U.S. DOT — Bicycle and Pedestrian Program", url: "https://www.transportation.gov/mission/health/bicycle-and-pedestrian-investments" },
];

const MicroMobility = () => (
  <ContentPageLayout
    badge="Beyond Cars · Micromobility"
    kicker="Multimodal · Field Brief"
    title="Micro-"
    highlight="mobility"
    intro="With over 150 million shared trips a year across 400+ cities and e-bike rebate programs offering up to $1,500 in savings, electric bikes and scooters are tackling the short, inefficient trips cars do worst — and feeding riders into transit along the way."
    heroImage={micromobility}
    icon={Bike}
    pullQuote="The least efficient miles a car drives are the short ones — exactly the trips an e-bike was built to replace."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default MicroMobility;
