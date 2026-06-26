import { PlayCircle } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentStat, type ContentSource } from "@/components/ContentPageLayout";
import webinarHero from "@/assets/multimodal-collage.jpg";

const video = {
  youtubeId: "WaIWh8wY_tI",
  title: "Webinar Series Part 1: From The Pump To The Plug",
};

const stats: ContentStat[] = [
  { value: "~60%", label: "Cheaper per mile to charge than to buy gasoline, at U.S. average prices" },
  { value: "$0", label: "Oil changes — EVs skip them, with fewer moving parts to service" },
  { value: "200K+", label: "Public charging ports across the U.S. and growing every quarter" },
];

const sections: ContentSection[] = [
  {
    heading: "What this webinar covers",
    body: [
      "In Part 1 of From the Pump to the Plug, we break down — in plain language — how switching from a gas car to an electric vehicle actually saves everyday drivers money. No hype and no jargon: just where the savings come from and how to check the math for your own situation.",
    ],
    list: [
      "Fuel: why charging at home typically costs far less per mile than buying gasoline.",
      "Maintenance: no oil changes, fewer moving parts, and less brake wear over time.",
      "Incentives: the federal, state, and utility programs that can lower your cost.",
      "Charging basics: how home and public charging fit into a normal week.",
      "Who it's for: commuters, families, and anyone comparing their next vehicle.",
    ],
  },
  {
    heading: "See the savings for yourself",
    body: [
      "Every driver's numbers are different — they depend on how far you drive, your local electricity and gas prices, and the vehicle you're comparing. The best way to know what you'd save is to run your own comparison.",
      "Use the EV vs Gas Cost Calculator to compare any electric vehicle against the car you drive today, then check the Rebates & Incentives page to see what you may qualify for in your area. When you're ready for more, Part 2 of the series goes even deeper on the savings.",
    ],
  },
];

const sources: ContentSource[] = [
  { label: "U.S. DOE Alternative Fuels Data Center — Vehicle Cost Calculator", url: "https://afdc.energy.gov/calc/" },
  { label: "AFDC — Electricity as a Vehicle Fuel (costs & basics)", url: "https://afdc.energy.gov/fuels/electricity" },
  { label: "AFDC — Electric Vehicle Laws & Incentives", url: "https://afdc.energy.gov/laws" },
];

const SaveWithEvsWebinar = () => (
  <ContentPageLayout
    badge="Webinar Replay"
    kicker="Webinar Replay"
    title="Webinar Series Part 1: From The Pump To The Plug:"
    highlight="How Electric Vehicles Are Saving"
    intro="Watch Part 1 of our From the Pump to the Plug webinar series — a clear, no-hype look at how everyday drivers are already saving money by going electric, from fuel and maintenance to the incentives that lower the cost of the switch."
    pullQuote="For most drivers, the switch to electric pays for itself in everyday savings."
    heroImage={webinarHero}
    icon={PlayCircle}
    stats={stats}
    statsCta={{ label: "Run your own numbers", to: "/electricity-vs-gasoline" }}
    video={video}
    sections={sections}
    sources={sources}
  />
);

export default SaveWithEvsWebinar;
