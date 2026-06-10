import { Truck } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import heavyDuty from "@/assets/heavy-duty.jpg";
import electricTransitBus from "@/assets/electric-transit-bus.jpg";
import evCharging from "@/assets/ev-charging.jpg";
import reducedEmissions from "@/assets/reduced-emissions.jpg";

const gallery: ContentShot[] = [
  { src: heavyDuty, caption: "Zero-emission freight on interstate corridors" },
  { src: electricTransitBus, caption: "Heavy electric drivetrains scale up" },
  { src: evCharging, caption: "Megawatt charging hubs for trucks" },
  { src: reducedEmissions, caption: "Cleaner air along freight routes" },
];

const stats: ContentStat[] = [
  { value: "10,000+", label: "Trucks a day moving along the busiest targeted freight corridors" },
  { value: "23%", label: "Share of U.S. transportation emissions from medium- and heavy-duty trucks" },
  { value: "Hubs", label: "Federal strategy prioritizing charging along major interstates" },
  { value: "TCO", label: "Falling total cost of ownership as battery and energy costs drop" },
];

const sections: ContentSection[] = [
  {
    heading: "Why heavy-duty matters most for emissions",
    body: [
      "Trucks are a small share of the vehicles on the road but an outsized share of the pollution. Medium- and heavy-duty vehicles burn enormous amounts of diesel and account for roughly a quarter of transportation greenhouse emissions, concentrated along freight corridors and near ports, warehouses, and the communities beside them.",
      "Electrifying these workhorses delivers a disproportionate climate and air-quality return — cleaning up the dirtiest, most diesel-intensive corner of the transportation system.",
    ],
  },
  {
    heading: "A national freight charging strategy",
    body: [
      "Long-haul trucks can't electrify without somewhere to charge. The U.S. DOT's National Zero-Emission Freight Corridor Strategy maps out where to build first — prioritizing high-power charging and hydrogen hubs along the interstates that carry the most truck traffic.",
      "By sequencing infrastructure to follow real freight volumes, the strategy aims to make zero-emission trucking practical corridor by corridor rather than all at once.",
    ],
  },
  {
    heading: "Battery-electric and the role of hydrogen",
    body: [
      "Most regional and drayage routes — the runs between ports, rail yards, and warehouses — are well within reach of today's battery-electric trucks, which return to the same depot each night to charge.",
      "For the longest, heaviest hauls, hydrogen fuel cells are being developed as a complement, offering fast refueling and long range. The two technologies are likely to split the market by duty cycle rather than compete head to head.",
    ],
  },
  {
    heading: "Depots, costs, and total cost of ownership",
    body: [
      "For fleet operators the decision is ultimately financial, and the math is shifting toward electric.",
    ],
    list: [
      "Fuel savings: electricity per mile costs far less than diesel and is far more predictable.",
      "Maintenance: electric drivetrains have fewer parts to service, cutting downtime and repair bills.",
      "Depot charging: predictable back-to-base routes let trucks charge overnight on cheaper power.",
      "Incentives: federal and state grants and tax credits offset the higher up-front purchase price.",
      "Local air quality: removing diesel exhaust benefits port and warehouse communities first.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "U.S. DOT — National Freight Strategic Plan", url: "https://www.transportation.gov/freight/NFSP" },
  { label: "EPA — Greenhouse Gas Emissions from Transportation", url: "https://www.epa.gov/greenvehicles/fast-facts-transportation-greenhouse-gas-emissions" },
  { label: "U.S. Department of Energy — Alternative Fuels Data Center", url: "https://afdc.energy.gov/" },
];

const HeavyDutyElectrification = () => (
  <ContentPageLayout
    badge="Beyond Cars · Freight"
    kicker="Multimodal · Field Brief"
    title="Medium and Heavy-Duty"
    highlight="Electrification"
    intro="A national zero-emission freight strategy is prioritizing charging hubs along the major interstates that handle more than 10,000 trucks a day — targeting the diesel-heavy heavy-duty sector that drives an outsized share of transportation emissions."
    heroImage={heavyDuty}
    icon={Truck}
    pullQuote="Trucks are a sliver of the vehicles but a quarter of the emissions — electrifying freight cleans up the dirtiest corner of the road."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default HeavyDutyElectrification;
