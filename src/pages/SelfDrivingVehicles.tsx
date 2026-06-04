import { Bot } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import selfDriving from "@/assets/self-driving.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import micromobility from "@/assets/micromobility.jpg";
import evCharging from "@/assets/ev-charging.jpg";

const gallery: ContentShot[] = [
  { src: selfDriving, caption: "Driverless robotaxis on public streets" },
  { src: rideshareFleet, caption: "Shared autonomous fleets run on electrons" },
  { src: micromobility, caption: "Sidewalk bots handle the last mile" },
  { src: evCharging, caption: "High-mileage duty cycles favor EVs" },
];

const stats: ContentStat[] = [
  { value: "24/7", label: "Robotaxi services now operate around the clock in multiple U.S. cities" },
  { value: "94%", label: "Share of serious crashes tied to human choices that automation aims to reduce" },
  { value: "Electric", label: "Nearly every major AV and delivery-robot platform rides on an EV drivetrain" },
  { value: "Millions", label: "Driverless miles logged commercially each month — and climbing fast" },
];

const sections: ContentSection[] = [
  {
    heading: "Why autonomy and electrification arrive together",
    body: [
      "Self-driving systems demand precise, instant, software-controlled power and a large battery to run their sensors, compute, and redundancy. An electric drivetrain delivers exactly that — smooth torque on command and a rolling power supply for the autonomy stack — which is why nearly every serious autonomous-vehicle and delivery-robot program is built on an EV platform rather than a gas engine.",
      "The economics reinforce the engineering. A shared robotaxi can cover hundreds of miles a day, and at that intensity the lower per-mile fuel and maintenance cost of an EV compounds quickly. Autonomy makes vehicles run more; electrification makes running them cheap and clean.",
    ],
  },
  {
    heading: "Robotaxis on real city streets",
    body: [
      "Driverless ride-hailing is no longer a demo. Paid, fully autonomous services now carry passengers with no one behind the wheel across several U.S. metros, expanding their service areas and operating hours as confidence grows. Each trip is logged, analyzed, and used to refine the next one.",
      "Because these fleets are centrally managed and always connected, they can be charged, maintained, and routed for maximum efficiency — squeezing far more useful service out of each electric vehicle than a privately owned car ever delivers.",
    ],
  },
  {
    heading: "Sidewalk and road delivery robots",
    body: [
      "Small electric delivery robots are already rolling across campuses, suburbs, and city sidewalks, carrying groceries, meals, and parcels the final block or two. Each robot trip can replace a short car errand, cutting both congestion and tailpipe emissions from the most inefficient leg of the supply chain.",
      "Larger autonomous road vehicles are tackling middle-mile freight on fixed routes, where predictable highway driving plays to automation's strengths and electric powertrains keep operating costs low.",
    ],
  },
  {
    heading: "The safety case and what regulators watch",
    body: [
      "Automation's promise is removing the human errors behind the overwhelming majority of crashes. Autonomous systems don't get drowsy, distracted, or impaired, and they perceive the road with a 360-degree blend of cameras, radar, and lidar that never blinks.",
    ],
    list: [
      "Federal oversight: NHTSA sets the safety framework and collects mandatory crash and disengagement reporting from operators.",
      "Sensor redundancy: overlapping cameras, radar, and lidar keep perceiving even if one system is degraded.",
      "Continuous improvement: over-the-air updates push fixes and new capabilities across an entire fleet at once.",
      "Open challenges: bad weather, construction zones, and rare 'edge cases' remain the hardest problems to solve.",
      "Clean by default: electric drivetrains mean the autonomous future adds mobility without adding tailpipe pollution.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "NHTSA — Automated Vehicles Safety", url: "https://www.nhtsa.gov/vehicle-safety/automated-vehicles-safety" },
  { label: "U.S. DOT — Automated Vehicles", url: "https://www.transportation.gov/AV" },
  { label: "U.S. Department of Energy — Alternative Fuels Data Center", url: "https://afdc.energy.gov/" },
];

const SelfDrivingVehicles = () => (
  <ContentPageLayout
    badge="Beyond Cars · Autonomy"
    kicker="Multimodal · Field Brief"
    title="Self-Driving Vehicles &"
    highlight="Delivery Robots"
    intro="Autonomous cars, robotaxis, and sidewalk delivery bots are already operating on American streets — and almost all of them are electric. The same sensors and software steering them also unlock cleaner, safer, and more efficient movement of people and goods."
    heroImage={selfDriving}
    icon={Bot}
    pullQuote="The autonomous fleet is electric by design: shared, always-on robotaxis need the low running cost only an EV can deliver."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default SelfDrivingVehicles;
