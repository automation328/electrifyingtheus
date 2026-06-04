import { GraduationCap } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import schoolBus from "@/assets/school-bus.jpg";
import steamEducation from "@/assets/steam-education.jpg";
import evFamily from "@/assets/ev-family.jpg";
import reducedEmissions from "@/assets/reduced-emissions.jpg";

const gallery: ContentShot[] = [
  { src: schoolBus, caption: "Electric buses replacing diesel fleets" },
  { src: steamEducation, caption: "Cleaner rides for millions of students" },
  { src: evFamily, caption: "Healthier air for kids and drivers" },
  { src: reducedEmissions, caption: "Quiet, zero-tailpipe school routes" },
];

const stats: ContentStat[] = [
  { value: "$5B", label: "EPA Clean School Bus Program investment to replace diesel buses" },
  { value: "8,700+", label: "Electric and low-emission buses funded to date" },
  { value: "1,300+", label: "School districts awarded across all 50 states and territories" },
  { value: "25M", label: "Students who ride the bus daily — the riders this protects" },
];

const sections: ContentSection[] = [
  {
    heading: "Why diesel buses are a health problem",
    body: [
      "The classic yellow school bus has long run on diesel, and children are uniquely vulnerable to its exhaust. Their lungs are still developing, they breathe faster than adults, and they sit just feet from the tailpipe — sometimes idling in line for long stretches outside their own schools.",
      "Diesel exhaust is linked to asthma, missed school days, and long-term respiratory harm. Replacing those engines with electric drivetrains removes the tailpipe entirely, cleaning the air both inside the cabin and across the neighborhoods the buses travel.",
    ],
  },
  {
    heading: "The EPA Clean School Bus Program",
    body: [
      "Funded at $5 billion, the EPA's Clean School Bus Program is the largest push to electrify student transportation in U.S. history. It awards money directly to school districts — with priority for rural, low-income, and Tribal communities — to swap aging diesel buses for clean electric models.",
      "The program has already funded thousands of buses across more than a thousand districts in every state, turning electric school transportation from a pilot into a nationwide rollout.",
    ],
  },
  {
    heading: "Buses as batteries: vehicle-to-grid",
    body: [
      "A school bus is an unusually good fit for electrification: it runs fixed routes, parks for hours midday, and sits idle all summer. Those long dwell times are perfect for charging — and for giving energy back.",
      "With vehicle-to-grid technology, a parked fleet of electric buses becomes a giant battery that can feed power to the school or the grid during peak demand, turning a transportation cost into an energy asset.",
    ],
  },
  {
    heading: "Rollout, savings, and what comes next",
    body: [
      "Beyond cleaner air, districts are finding electric buses cheaper to own over their lifetime, even where the sticker price is higher.",
    ],
    list: [
      "Lower fuel cost: electricity is far cheaper per mile than diesel, and prices are far more stable.",
      "Less maintenance: no oil changes, fewer moving parts, and regenerative braking that spares the brakes.",
      "Health savings: fewer asthma attacks and missed school days for the children who ride.",
      "Quiet cabins: drivers and students ride without the roar and rattle of a diesel engine.",
      "Grid value: V2G-capable fleets can earn revenue or cut a school's energy bill while parked.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "EPA — Clean School Bus Program Awards", url: "https://www.epa.gov/cleanschoolbus/clean-school-bus-program-awards" },
  { label: "EPA — Clean School Bus Program", url: "https://www.epa.gov/cleanschoolbus" },
  { label: "U.S. Department of Energy — Alternative Fuels Data Center", url: "https://afdc.energy.gov/" },
];

const ElectricSchoolBuses = () => (
  <ContentPageLayout
    badge="Beyond Cars · Schools"
    kicker="Multimodal · Field Brief"
    title="Electric"
    highlight="School Buses"
    intro="The EPA is investing $5 billion to replace diesel school buses, with more than 8,700 electric and low-emission buses funded across over 1,300 school districts — protecting the lungs of the millions of children who ride to school every day."
    heroImage={schoolBus}
    icon={GraduationCap}
    pullQuote="Fixed routes, long midday parking, idle summers — a school bus is the ideal vehicle to electrify, and the ideal battery to plug into the grid."
    stats={stats}
    sections={sections}
    gallery={gallery}
    sources={sources}
  />
);

export default ElectricSchoolBuses;
