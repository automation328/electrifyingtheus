import { Landmark } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import evPolicy from "@/assets/ev-policy.jpg";
import electricTransitBus from "@/assets/electric-transit-bus.jpg";
import heavyDuty from "@/assets/heavy-duty.jpg";
import evCharging from "@/assets/ev-charging.jpg";

const gallery: ContentShot[] = [
  { src: evPolicy, caption: "Federal policy drives EV adoption" },
  { src: electricTransitBus, caption: "Zero-emission transit fleets scale up" },
  { src: heavyDuty, caption: "Corridors serve heavy-duty charging" },
  { src: evCharging, caption: "NEVI fast chargers along highways" },
];

const video = { youtubeId: "7KCnGhM6Fxo", title: "BRIEFS: NEVI and America's EV Charging Future" };

const stats: ContentStat[] = [
  { value: "$5B", label: "NEVI federal investment (FY22-26)" },
  { value: "50%", label: "Zero-emission new vehicle sales goal by 2030" },
  { value: "50 states", label: "Plus D.C. and Puerto Rico building corridors" },
  { value: "150kW", label: "Minimum power per NEVI charging port" },
];

const sections: ContentSection[] = [
  {
    heading: "The national charging goal",
    body: [
      "U.S. EV policy over the past several years has paired vehicle-adoption targets with a once-in-a-generation push to build the public charging network those vehicles depend on. A central federal goal has been for half of all new vehicles sold to be zero-emission by 2030, supported by efforts to stand up a nationwide network of fast chargers.",
      "The reasoning is simple: range anxiety and patchy charging access are among the biggest barriers to EV adoption. Reliable fast charging spaced predictably along highways is meant to make long trips in an EV as routine as stopping for gasoline.",
    ],
  },
  {
    heading: "What the NEVI program is",
    body: [
      "The National Electric Vehicle Infrastructure (NEVI) Formula Program is the flagship federal effort to build out highway fast charging. It was created by the 2021 Bipartisan Infrastructure Law and provides roughly $5 billion in funding allocated across fiscal years 2022 through 2026.",
      "Rather than the federal government building stations directly, NEVI distributes money to states by formula. Each state writes a plan describing where and how it will deploy chargers, and the U.S. Department of Transportation reviews and approves those plans before funds flow. Cumulatively, billions of dollars have been allocated to states, with hundreds of millions awarded for specific projects.",
    ],
  },
  {
    heading: "How states build out corridors",
    body: [
      "NEVI dollars first target designated Alternative Fuel Corridors (AFCs) -- major highways across all 50 states, the District of Columbia, and Puerto Rico. The idea is to fill in charging along these routes first so that a driver can cross the country without ever being stranded.",
      "To qualify for funding, stations must meet consistent minimum standards so the experience is uniform regardless of which state a driver is in. Core NEVI requirements include the following:",
    ],
    list: [
      "Stations spaced no more than about 50 miles apart along designated corridors (2025 guidance later added flexibility on spacing)",
      "At least four charging ports per station so multiple vehicles can charge at once",
      "Minimum 150 kW of power per port for true fast charging",
      "Stations located within roughly one mile of the highway, with reliable access and uptime requirements",
      "Standardized payment, real-time availability data, and network interoperability",
    ],
  },
  {
    heading: "The broader funding landscape",
    body: [
      "NEVI is the largest single program, but it sits inside a wider federal investment. The Bipartisan Infrastructure Law (also called the Infrastructure Investment and Jobs Act, or IIJA) is the umbrella legislation that funded NEVI alongside other clean-transportation programs.",
      "A second major stream is the Charging and Fueling Infrastructure (CFI) discretionary grant program, which awards competitive grants for community charging and corridor gaps that the formula program does not reach -- think downtowns, multifamily housing, and rural areas. Together these programs were designed to seed a network of hundreds of thousands of new public charging ports nationwide.",
    ],
  },
  {
    heading: "The shift in federal purchase incentives",
    body: [
      "For years the centerpiece consumer incentive was the federal clean-vehicle tax credit of up to $7,500 for a qualifying new EV. That credit ended on September 30, 2025, marking a significant change in how Washington supports EV buyers.",
      "In its place, the One Big Beautiful Bill Act (OBBBA) introduced a deduction for interest paid on auto loans. Buyers of qualifying vehicles assembled in the United States can deduct up to $10,000 per year in loan interest. The mechanism is different from the old credit -- it rewards financed purchases of U.S.-assembled vehicles rather than offering a flat point-of-sale discount -- and the net benefit varies by buyer.",
    ],
  },
  {
    heading: "State-level ZEV programs",
    body: [
      "Federal policy is only half the picture. A coalition of states has adopted Zero-Emission Vehicle (ZEV) requirements, many following California's lead under its Clean Air Act authority to set stricter standards. These programs phase up the share of new vehicles that must be zero-emission over time.",
      "States layer their own incentives on top: rebates on EV purchases, reduced registration fees, HOV-lane access, and grants for home and workplace charging. As a result, the real-world cost and convenience of going electric can differ substantially from one state to the next.",
    ],
  },
  {
    heading: "Policy headwinds and uncertainty",
    body: [
      "EV policy in the United States remains in flux. The end of the $7,500 purchase credit, debates over tailpipe and fuel-economy standards, and legal challenges to state ZEV authority all inject uncertainty for buyers and automakers alike.",
      "The infrastructure buildout has also been uneven: by late 2025 most states had opened funding solicitations and the first NEVI-funded ports had come online, but the pace of construction lagged early expectations. The long-term direction depends heavily on federal priorities, court rulings, and how aggressively individual states pursue their own targets.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "ACT News -- The United States of NEVI", url: "https://www.act-news.com/news/the-united-states-of-nevi/" },
  { label: "FHWA -- National Electric Vehicle Infrastructure (NEVI) Program", url: "https://www.fhwa.dot.gov/environment/nevi/" },
  { label: "DriveElectric.gov -- Federal EV resources", url: "https://driveelectric.gov/" },
];

const UsEvPolicies = () => (
  <ContentPageLayout
    badge="EV 101 · Policy"
    kicker="EV 101 · Field Brief"
    title="U.S. EV"
    highlight="Policies"
    intro="From the NEVI program's $5 billion charging buildout to a shifting set of buyer incentives, U.S. EV policy weaves federal infrastructure investment together with state-level adoption goals. Here is how the pieces fit, and where they are headed."
    pullQuote="A $5 billion NEVI buildout is racing to make 50% zero-emission new-car sales by 2030 a reality."
    heroImage={evPolicy}
    icon={Landmark}
    stats={stats}
    sections={sections}
    gallery={gallery}
    video={video}
    sources={sources}
  />
);

export default UsEvPolicies;
