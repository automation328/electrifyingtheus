// Part 2 of the "From the Pump to the Plug" webinar series.
//
// The recording is up, so this is a REPLAY: the player sits at the top and the
// panel recap runs underneath it.
//
// Part 1 lives at /save-with-evs-webinar and links forward to the event page;
// this page links back to Part 1, so the series reads in both directions.

import { PlayCircle, MessageCircle, Calculator, BadgeCheck, Plug } from "lucide-react";
import { type ContentSection, type ContentLinkCard } from "@/components/ContentPageLayout";
import EditableContentPage from "@/components/EditableContentPage";

const video = {
  youtubeId: "_HRXa3hjlec",
  title: "Webinar Series Part 2: From The Pump To The Plug",
};

const sections: ContentSection[] = [
  {
    heading: "A special thank you",
    body: [
      "A huge thank you to our incredible lineup of guest speakers for sharing their time and invaluable expertise — and to you, our audience, for bringing such fantastic energy and thoughtful engagement to the live session.",
      "With fuel prices continuing to rise, transportation has become one of the most volatile expenses a household carries. Part 2 broke down the actual economics of switching to electric: not the technology, the bottom line.",
    ],
  },
  {
    heading: "What the panel covered",
    body: [
      "A brief recap of the insights shared during the discussion:",
    ],
    list: [
      "Lisa Macumber (California Air Resources Board) highlighted state-level strategies following federal incentive shifts, detailing how programs like Clean Cars 4 All, the DRIVE Clean Assistance Program, and the MyFirstEV initiative expand access to lower-cost EVs for drivers across California.",
      "Rob Sargent (Coltura) broke down data on high-mileage “superuser” drivers, illustrating how high fuel costs hit lower- and moderate-income households hardest, and why targeted incentive programs deliver the most financial relief.",
      "Dr. Alexis Jackson (Uber) shared details on Uber’s Go Electric program, explaining how high-mileage rideshare drivers maximise daily take-home earnings by making the switch, and how the programme addresses hurdles like charging access and financing.",
      "Bobby Godsey (Austin Energy) outlined utility-led affordable charging initiatives, showing how expanding public and community charging solves a key barrier for renters and multi-unit dwellers who have no dedicated home charging.",
      "Zach Franklin (GRID Alternatives) showcased the impact of community charging programs, and how these cost-effective charging models can be expanded to serve drivers nationwide.",
    ],
  },
  {
    heading: "The panel",
    body: [
      "Powered by Electrifying Michigan, Electrifying the US, and Electrifying Virginia.",
    ],
    list: [
      "Terry Travis — EVNoire (Moderator)",
      "Lisa Macumber — California Air Resources Board",
      "Bobby Godsey — Austin Energy",
      "Dr. Alexis Jackson — Uber",
      "Rob Sargent — Coltura",
      "Zach Franklin — GRID Alternatives",
    ],
  },
  {
    heading: "See the savings for yourself",
    body: [
      "Every driver's numbers are different — they depend on how far you drive, your local electricity and gas prices, and the vehicle you're comparing. The best way to know what you'd save is to run your own comparison.",
      "Use the EV vs Gas Cost Calculator to compare any electric vehicle against the car you drive today, then check the Rebates & Incentives page to see which federal, state, and utility programs you may qualify for in your area.",
    ],
  },
];

// Brand blue↔green gradients, alternating — same set as Part 1.
const linkCards: ContentLinkCard[] = [
  { icon: MessageCircle, title: "Ask EVan", desc: "Your EV Advisor — instant answers on EVs, charging, and savings, 24/7.", to: "/#agent-chat", bgCls: "gradient-hero" },
  { icon: Calculator, title: "EV vs Gas Calculator", desc: "Compare any EV against the car you drive today on real U.S. costs.", to: "/electricity-vs-gasoline", bgCls: "gradient-hero-rev" },
  { icon: BadgeCheck, title: "Rebates & Incentives", desc: "Find the federal, state, and utility programs you qualify for.", to: "/rebates-incentives", bgCls: "gradient-hero" },
  { icon: Plug, title: "Find a Charger", desc: "Locate charging stations near you and along your route.", to: "/find-a-charger", bgCls: "gradient-hero-rev" },
];

const FromPumpToPlugPart2 = () => (
  <EditableContentPage
    path="/from-pump-to-plug-part-2"
    badge="Webinar Replay"
    kicker="Webinar Replay"
    title="Watch The Webinar: Part 2 - From The Pump To The Plug,"
    highlight="How EVs Can Save Thousands"
    intro="Watch Part 2 of our From the Pump to the Plug series in full, and thank you to everyone who joined us live. Our panel from CARB, Coltura, Uber, Austin Energy, and GRID Alternatives took on the real economics of going electric — where the savings actually come from, and who they reach."
    icon={PlayCircle}
    compactTitle
    hideMeta
    hideCta
    video={video}
    // The recording is the thing people came for, so it is the one video on the
    // site worth asking for a profile before playing.
    gateVideo
    extraCta={{ label: "Watch Part 1", to: "/save-with-evs-webinar" }}
    // Part 1 shows the Part 2 flyer beneath this button. Deliberately not repeated
    // here: it reads "Register now" over a date that has passed, which was
    // forward-looking on Part 1's page and would be misleading on this one. The
    // player above is what belongs in that space.
    sections={sections}
    linkCards={linkCards}
  />
);

export default FromPumpToPlugPart2;
