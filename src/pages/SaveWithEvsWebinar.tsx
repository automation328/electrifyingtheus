import { PlayCircle, MessageCircle, Calculator, BadgeCheck, Plug } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentLinkCard } from "@/components/ContentPageLayout";

const video = {
  youtubeId: "WaIWh8wY_tI",
  title: "Webinar Series Part 1: From The Pump To The Plug",
};

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

// Brand blue↔green gradients (same as the Featured event cards), alternating.
const linkCards: ContentLinkCard[] = [
  { icon: MessageCircle, title: "Ask EVan", desc: "Your EV Advisor — instant answers on EVs, charging, and savings, 24/7.", to: "/#agent-chat", bgCls: "gradient-hero" },
  { icon: Calculator, title: "EV vs Gas Calculator", desc: "Compare any EV against the car you drive today on real U.S. costs.", to: "/electricity-vs-gasoline", bgCls: "gradient-hero-rev" },
  { icon: BadgeCheck, title: "Rebates & Incentives", desc: "Find the federal, state, and utility programs you qualify for.", to: "/rebates-incentives", bgCls: "gradient-hero" },
  { icon: Plug, title: "Find a Charger", desc: "Locate charging stations near you and along your route.", to: "/find-a-charger", bgCls: "gradient-hero-rev" },
];

const SaveWithEvsWebinar = () => (
  <ContentPageLayout
    badge="Webinar Replay"
    kicker="Webinar Replay"
    title="Webinar Series Part 1: From The Pump To The Plug:"
    highlight="How Electric Vehicles Can Save Thousands"
    intro="Watch Part 1 of our From the Pump to the Plug webinar series — a clear, no-hype look at how everyday drivers are already saving money by going electric, from fuel and maintenance to the incentives that lower the cost of the switch."
    icon={PlayCircle}
    compactTitle
    hideMeta
    hideCta
    extraCta={{ label: "Register for Part 2", to: "/events/from-pump-to-plug" }}
    video={video}
    sections={sections}
    linkCards={linkCards}
  />
);

export default SaveWithEvsWebinar;
