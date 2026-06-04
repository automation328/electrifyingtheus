import { Car } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import evFamily from "@/assets/ev-family.jpg";
import evCharging from "@/assets/ev-charging.jpg";
import selfDriving from "@/assets/self-driving.jpg";

const gallery: ContentShot[] = [
  { src: rideshareFleet, caption: "Rideshare fleets going fully electric" },
  { src: evFamily, caption: "Rental EVs available nationwide" },
  { src: evCharging, caption: "High-mileage driving favors electric" },
  { src: selfDriving, caption: "The shared, electric, autonomous future" },
];

const stats: ContentStat[] = [
  { value: "100%", label: "EV fleet commitments pledged by Uber and Lyft for North America" },
  { value: "Nationwide", label: "Rental companies now offering EVs at competitive rates" },
  { value: "High-mileage", label: "The exact use case where EV savings compound fastest" },
  { value: "2030", label: "Target window for major rideshare zero-emission goals" },
];

const sections: ContentSection[] = [
  {
    heading: "Why fleets electrify first",
    body: [
      "Shared vehicles drive far more than private cars — a rideshare car or rental can rack up tens of thousands of miles a year. At that intensity, the EV's lower cost per mile for fuel and maintenance dominates the math, paying back the higher purchase price faster than for any personal vehicle.",
      "That's why fleets, not individual buyers, are often the fastest movers: the more a vehicle is driven, the more an electric drivetrain saves.",
    ],
  },
  {
    heading: "Uber and Lyft go all-electric",
    body: [
      "Both major ride-hailing platforms have committed to 100% electric vehicles across their North American operations by 2030, backed by driver incentives, partnerships with automakers, and in-app tools that help drivers find charging.",
      "Because a single rideshare EV displaces so many high-mileage gas miles, electrifying these platforms delivers emissions cuts far beyond their share of the vehicle fleet.",
    ],
  },
  {
    heading: "Rental EVs go mainstream",
    body: [
      "Rental companies have moved electric vehicles from a novelty to a standard option, offering EVs at competitive rates across the country. For many travelers, a rental is a low-risk first EV experience — a few days to learn charging and feel the drive before ever buying one.",
      "That exposure matters: renters who try an EV are far more likely to consider one for their next purchase.",
    ],
  },
  {
    heading: "Charging access is the linchpin",
    body: [
      "The remaining hurdle for shared electric fleets is reliable, fast charging where and when drivers need it.",
    ],
    list: [
      "Driver economics: rideshare drivers need fast charging that doesn't eat into earning hours.",
      "Home vs. public: drivers without home charging depend on dependable public networks.",
      "Fleet hubs: dedicated depots and hubs are emerging to keep shared fleets topped up.",
      "Incentives: purchase and charging incentives accelerate driver and operator adoption.",
      "Try-before-you-buy: rentals turn curious travelers into future EV owners.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "CNBC — The EV Transition Starts in the Car Rental Industry", url: "https://www.cnbc.com/2022/06/18/how-the-massive-ev-transition-is-starting-in-the-car-rental-industry.html" },
  { label: "U.S. Department of Energy — Electric Vehicle Benefits", url: "https://afdc.energy.gov/vehicles/electric-benefits" },
  { label: "EPA — Green Vehicle Guide", url: "https://www.epa.gov/greenvehicles" },
];

const RideshareRentalFleets = () => (
  <ContentPageLayout
    badge="Beyond Cars · Fleets"
    kicker="Multimodal · Field Brief"
    title="Rideshare, Rental Cars &"
    highlight="Fleets"
    intro="Uber and Lyft have committed to 100% EV fleets, and rental companies now offer electric vehicles nationwide at competitive rates. High-mileage shared vehicles are exactly where electric savings compound fastest — making fleets the quiet accelerator of the EV transition."
    heroImage={rideshareFleet}
    icon={Car}
    pullQuote="The more a car is driven, the more electric saves — which is why shared fleets, not private buyers, are electrifying first."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default RideshareRentalFleets;
