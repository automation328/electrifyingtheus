import { Shield } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import evSafety from "@/assets/ev-safety.jpg";
import evFamily from "@/assets/ev-family.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import evCharging from "@/assets/ev-charging.jpg";

const gallery: ContentShot[] = [
  { src: evSafety, caption: "Battery-reinforced body shells the cabin" },
  { src: evFamily, caption: "Lower center of gravity protects families" },
  { src: rideshareFleet, caption: "Five-star ratings across modern fleets" },
  { src: evCharging, caption: "Sealed packs cut fire risk sharply" },
];

const video = { youtubeId: "8xkBoc9bKc4", title: "Here's Why Electric Cars Are Proving Safer in a Crash" };

const stats: ContentStat[] = [
  { value: "5-Star", label: "Crash ratings earned by leading EVs from Euro NCAP, NHTSA and IIHS" },
  { value: "Lower", label: "Center of gravity from a floor-mounted battery cuts rollover risk" },
  { value: "60x", label: "Lower fire rate per sale than gas cars in insurance-industry data" },
  { value: "40-50%", label: "Lower lifetime maintenance, reducing failure-related breakdowns" },
];

const sections: ContentSection[] = [
  {
    heading: "A lower center of gravity that resists rollovers",
    body: [
      "An EV carries its heaviest component, the battery pack, flat across the floor between the axles. That places the bulk of the vehicle's mass close to the road instead of high in an engine bay, which dramatically lowers the center of gravity.",
      "A low center of gravity makes a car far harder to tip. Rollovers are among the deadliest crash types, and the physics of a floor-mounted battery work against them while also improving cornering stability and giving the car a planted, balanced feel in fast maneuvers.",
    ],
  },
  {
    heading: "The fire-risk reality: EVs ignite far less often than gas cars",
    body: [
      "The headlines suggest EVs are rolling fire hazards, but the data tells the opposite story. Gasoline is a highly flammable liquid sitting inches from a hot engine, and vehicle fires in conventional cars are common enough that fire departments respond to them routinely.",
      "Analyses of insurance and safety data consistently find that electric vehicles catch fire at a small fraction of the rate of gasoline cars per vehicle sold. Modern EV battery packs are sealed in armored enclosures with thermal management, multiple isolation layers and battery-management software that shuts cells down at the first sign of trouble. When an EV fire does occur it can behave differently and draw attention, but the likelihood of ignition is markedly lower than for an internal-combustion car.",
    ],
  },
  {
    heading: "Crash-test performance and a rigid battery structure",
    body: [
      "Removing the engine block changes crash mechanics in the driver's favor. There is no heavy motor to be shoved into the passenger compartment during a frontal impact, which frees up a long, empty crumple zone to absorb energy before it reaches the people inside.",
      "The battery pack itself doubles as structural reinforcement, stiffening the floor and acting as a load-bearing member that helps the cabin hold its shape. Top EVs have translated this into elite results: the Tesla Model Y earned a 5-star Euro NCAP rating in 2022, and models like the Rivian R1T and Lucid Air have posted top scores in NHTSA and IIHS testing.",
    ],
  },
  {
    heading: "Instant torque, traction control and advanced driver assistance",
    body: [
      "Electric motors deliver full torque from a standstill with no gear hunting or turbo lag, so the car responds the instant you ask it to, whether accelerating out of danger or modulating power on a slippery surface. Electronic traction control reacts in milliseconds to keep grip in wet or icy conditions.",
      "EVs are typically built on modern platforms loaded with advanced driver-assistance systems, and over-the-air software updates let manufacturers refine braking, stability and collision-avoidance behavior long after the car leaves the lot. The result is a vehicle whose safety systems can keep improving over its lifetime.",
    ],
  },
  {
    heading: "Fewer moving parts means fewer failure-related crashes",
    body: [
      "An electric drivetrain has a tiny fraction of the moving parts of a gasoline engine. There are no oil changes, spark plugs, timing belts or multi-speed transmissions to wear out and fail, and regenerative braking drastically reduces brake-pad wear.",
      "Argonne National Laboratory estimates EVs cost 40 to 50 percent less to maintain over their lifetime. Beyond the savings, fewer components that can break translates into fewer mechanical failures on the road, and a stalled engine, a slipped belt or worn brakes are exactly the kinds of failures that cause accidents.",
    ],
  },
  {
    heading: "More reasons EVs beat gas cars",
    body: [
      "Safety is only one chapter of the case. The same source lays out a long list of everyday advantages that come with going electric:",
    ],
    list: [
      "Efficiency: EV drivetrains convert 80 to 90 percent of their energy into motion, against roughly 25 to 30 percent for gasoline engines, making them about three times more efficient per the U.S. Department of Energy.",
      "Lower running costs: a full charge often costs just a few dollars, and many EVs already beat comparable gas cars on total lifetime cost.",
      "Zero tailpipe emissions: no CO2, NOx or particulate pollution, helping address air pollution the WHO links to over 4 million premature deaths a year.",
      "Cleaner lifecycle: EVs typically offset their manufacturing emissions within one to two years of driving, and recycling can recover up to 95 percent of key battery materials.",
      "A better drive: quiet, vibration-free cabins and smooth one-pedal driving thanks to regenerative braking.",
      "Smarter and more connected: over-the-air updates keep improving the car, and vehicle-to-home and vehicle-to-grid features let an EV serve as a mobile battery.",
      "Fast, growing infrastructure: ultra-fast chargers can add 300 to 400 km of range in 15 to 20 minutes, and public charging continues to expand rapidly.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "EV Curve Futurist — 25 Reasons EVs Are Better Than ICE Cars", url: "https://evcurvefuturist.com/2025/10/25-reasons-evs-are-better-than-ice-cars/" },
  { label: "NHTSA — Electric Vehicle Safety", url: "https://www.nhtsa.gov/equipment/electric-vehicle-safety" },
  { label: "U.S. Department of Energy — Electric Vehicle Benefits", url: "https://afdc.energy.gov/vehicles/electric-benefits" },
];

const EvRoadSafety = () => (
  <ContentPageLayout
    badge="EV 101 · Safety"
    kicker="EV 101 · Field Brief"
    title="EVs & Road"
    highlight="Safety"
    intro="Far from being fragile gadgets, electric vehicles are some of the safest cars on the road, with a low center of gravity that resists rollovers, rigid battery-reinforced bodies, and a fire risk well below that of gasoline cars."
    heroImage={evSafety}
    icon={Shield}
    pullQuote="No engine block to crush the cabin, a floor battery that fights rollovers, and ignition odds a fraction of gasoline's."
    stats={stats}
    sections={sections}
    gallery={gallery}
    video={video}
    sources={sources}
  />
);

export default EvRoadSafety;
