import { Wrench } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource, type ContentShot } from "@/components/ContentPageLayout";
import workforce from "@/assets/workforce.jpg";
import schoolBus from "@/assets/school-bus.jpg";
import electricTransitBus from "@/assets/electric-transit-bus.jpg";
import heavyDuty from "@/assets/heavy-duty.jpg";

const gallery: ContentShot[] = [
  { src: workforce, caption: "Skilled clean energy manufacturing jobs" },
  { src: schoolBus, caption: "Electric school bus assembly work" },
  { src: electricTransitBus, caption: "Building America's electric transit fleet" },
  { src: heavyDuty, caption: "Heavy-duty EV and battery production" },
];

const video = {
  youtubeId: "AtReW7aCIvQ",
  title: "Clean energy jobs grew at more than double the rate of overall US employment",
};

const stats: ContentStat[] = [
  { value: "3.56M", label: "Americans working in clean energy in 2024" },
  { value: "3x", label: "Faster job growth than the overall U.S. economy" },
  { value: "398K", label: "Clean vehicle and EV jobs nationwide" },
  { value: "520K", label: "Clean energy jobs added since 2020" },
];

const sections: ContentSection[] = [
  {
    heading: "Clean energy is now a major American employer",
    body: [
      "Clean energy has quietly become one of the largest employment sectors in the country. According to E2's Clean Jobs America 2024 report, about 3.56 million Americans worked in clean energy in 2024 across 47 subsectors, from manufacturing and construction to engineering and installation. That is roughly 2.3 percent of the entire U.S. workforce.",
      "To put it in perspective, more people now work in clean energy than work as nurses, cashiers, waiters and waitresses, or teachers. These are real jobs in real communities, building the technologies that power electric vehicles, homes, and the grid.",
    ],
  },
  {
    heading: "Growing 3x faster than the rest of the economy",
    body: [
      "In 2024, clean energy employment grew about 2.8 percent, roughly three times faster than the overall U.S. economy, which grew just 0.8 percent. The sector added approximately 95,697 jobs in a single year.",
      "Those new positions accounted for 7 percent of all new jobs created in the United States and a striking 82 percent of all new jobs added across the entire energy sector. Over the five years from 2020 to 2024, clean energy companies added workers about 60 percent faster than the rest of the economy.",
    ],
  },
  {
    heading: "The clean vehicle and EV workforce",
    body: [
      "Electric vehicles sit at the heart of this growth story. The clean vehicle segment, which includes EV manufacturing, hybrids, and related components, employed 398,033 people in 2024.",
      "The sector did hit a speed bump last year, shedding about 12,387 jobs as automakers adjusted production and policy signals shifted. But the longer trend is unmistakable: clean vehicle employment has grown 52 percent since 2020, adding roughly 137,000 jobs as the U.S. built out domestic EV and battery manufacturing capacity.",
    ],
  },
  {
    heading: "Where the jobs are",
    body: [
      "Clean energy work spans the whole country, but a handful of sectors and states carry the largest share of the workforce. Energy efficiency remains by far the biggest employer, while storage and grid jobs are growing the fastest.",
    ],
    list: [
      "Energy efficiency: about 2.38 million jobs, the largest single segment",
      "Renewable generation: about 569,000 jobs, up 3.9 percent in 2024",
      "Storage and grid: about 168,000 jobs, the fastest-growing segment at 4.2 percent",
      "Clean vehicles: about 398,000 jobs in EV and related manufacturing",
      "Top states by total jobs: California, Texas, Florida, New York, and Illinois",
    ],
  },
  {
    heading: "Economic opportunity in every region",
    body: [
      "Clean energy growth is not confined to the coasts. In 2024 the South led the nation by adding roughly 41,000 clean energy jobs and now hosts more than one million clean energy workers. The West and Northeast each added more than 20,000 jobs, and the Midwest added about 13,000.",
      "The fastest-growing states over the 2020 to 2024 period reflect that geographic spread, with red, blue, and purple states all posting double-digit gains.",
    ],
    list: [
      "Oklahoma: up 27.5 percent",
      "New Mexico: up 27.1 percent",
      "Texas: up 26.5 percent",
      "New Jersey: up 25.0 percent",
      "Idaho: up 24.8 percent",
    ],
  },
  {
    heading: "Why future growth is now at risk",
    body: [
      "For all this momentum, E2 warns that future growth is now in jeopardy. The 2024 growth rate was the slowest since 2020, and federal policy uncertainty has begun to chill investment in solar, wind, electric vehicles, and battery manufacturing.",
      "Since the start of 2025, companies have canceled or scaled back about 22 billion dollars in planned clean energy projects that were expected to create roughly 16,500 jobs. Analysts estimate that rolling back the clean energy and EV incentives that helped drive this hiring boom could ultimately put more than 830,000 jobs at risk nationwide.",
    ],
    list: [
      "Canceled or delayed projects driven by shifting federal policy",
      "Uncertainty over clean energy and EV tax credits and incentives",
      "Slowing growth in the clean vehicle segment after years of expansion",
      "Risk that domestic battery and EV manufacturing investment moves overseas",
    ],
  },
  {
    heading: "What it means for the EV transition",
    body: [
      "The takeaway is that the electric vehicle transition is also an economic development story. Every EV built, every charger installed, and every battery plant opened creates skilled, well-paying jobs in American communities.",
      "Stable, long-term policy support keeps that engine running. When the incentives and certainty that fueled five years of record growth stay in place, clean energy and EVs deliver not just cleaner air but durable economic opportunity for workers across the country.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "E2 — Clean Jobs America 2024 report", url: "https://e2.org/releases/report-clean-energy-jobs-grew-3x-faster-than-rest-of-u-s-workforce-in-2024-but-future-growth-now-at-risk/" },
  { label: "E2 — Reports and research library", url: "https://e2.org/reports/" },
  { label: "U.S. DOE — United States Energy & Employment Report (USEER)", url: "https://www.energy.gov/policy/us-energy-employment-jobs-report-useer" },
];

const WorkforceEconomicDevelopment = () => (
  <ContentPageLayout
    badge="EV 101 · Workforce"
    kicker="EV 101 · Field Brief"
    title="Workforce & Economic"
    highlight="Development"
    intro="Clean energy now employs 3.56 million Americans and grew three times faster than the rest of the economy in 2024. Electric vehicles are a core driver of that boom, but uncertain policy now puts future growth and jobs at risk."
    pullQuote="Clean energy jobs are growing three times faster than the rest of the economy, building durable opportunity in communities nationwide."
    heroImage={workforce}
    icon={Wrench}
    stats={stats}
    sections={sections}
    gallery={gallery}
    video={video}
    sources={sources}
  />
);

export default WorkforceEconomicDevelopment;
