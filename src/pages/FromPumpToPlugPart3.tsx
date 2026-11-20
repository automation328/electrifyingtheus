// Part 3 of the "From the Pump to the Plug" webinar series (19 Nov 2026):
// pre-owned EVs and EV affordability. Copy follows the thank-you email sent
// to attendees on 20 Nov 2026.
//
// A REPLAY page like Part 2: the recording is the hero video.
//
// /events/from-pump-to-plug-part-3 (the registration page) redirects here
// (App.tsx), the same way Part 2's old event URL does.

import { PlayCircle, Car, Map as MapIcon, BadgeCheck, Calculator } from "lucide-react";
import { type ContentSection, type ContentLinkCard } from "@/components/ContentPageLayout";
import EditableContentPage from "@/components/EditableContentPage";

const video = {
  youtubeId: "tU5cQuVvmrA",
  title: "Webinar Series Part 3: From The Pump To The Plug",
};

const sections: ContentSection[] = [
  {
    heading: "Thank you for joining us",
    body: [
      "Thank you for spending an hour with us for Part 3 of our webinar series. We heard from pre-owned EV dealers and an everyday EV driver about what it really takes to make an EV affordable, and what to know before you buy.",
      "Missed a moment, or want to share it with someone? The full recording is here.",
    ],
  },
  {
    heading: "Voices from the conversation",
    body: [
      "Moderated by Terry Travis, EVNoire.",
    ],
    list: [
      "Adam Borison, CEO of eMotion Autos (a California pre-owned EV dealer), shared what buyers are asking about, how California incentives are being used, and how dealers test battery health before a car goes on the lot.",
      "Jesse Lore, Founder & CEO of Green Wave Electric Vehicles (a Massachusetts pre-owned EV dealer), brought the cold-weather perspective on range and charging, and why an EV can cost less to own over the long run.",
      "Monique Jones, an EV driver from California, gave the driver's view on buying pre-owned, setting up home charging, and what everyday ownership is really like.",
    ],
  },
  {
    heading: "Catch up on the series",
    body: [
      "Missed an earlier session of From the Pump to the Plug? Part 1 featured UC Davis, Cox Automotive, the City of Huron, the Colorado Energy Office, Consumer Reports and an EV rideshare driver. Part 2 featured the California Air Resources Board, Coltura, Uber, Austin Energy and GRID Alternatives.",
      "Powered by Electrifying Michigan, Electrifying the US, and Electrifying Virginia.",
    ],
  },
];

// The free tools the email points to. Brand blue↔green gradients, alternating.
const linkCards: ContentLinkCard[] = [
  { icon: Car, title: "EV Marketplace", desc: "Browse pre-owned EV listings in one place.", to: "/marketplace", bgCls: "gradient-hero" },
  { icon: MapIcon, title: "EV Range Map", desc: "See how far a vehicle can go, including in cold weather.", to: "/range-map", bgCls: "gradient-hero-rev" },
  { icon: BadgeCheck, title: "Rebates & Incentives", desc: "Enter your ZIP code to see the rebates and incentives you may qualify for.", to: "/rebates-incentives", bgCls: "gradient-hero" },
  { icon: Calculator, title: "EV vs Gas Calculator", desc: "Compare any EV against the car you drive today on real U.S. costs.", to: "/electricity-vs-gasoline", bgCls: "gradient-hero-rev" },
];

const FromPumpToPlugPart3 = () => (
  <EditableContentPage
    path="/from-pump-to-plug-part-3"
    badge="Webinar Replay"
    kicker="Webinar Replay"
    title="Watch The Webinar: Part 3 - From The Pump To The Plug,"
    highlight="How Pre-Owned EVs Can Save You Thousands"
    intro="Watch Part 3 of our From the Pump to the Plug series, and thank you to everyone who joined us live. Pre-owned EV dealers and an everyday EV driver talked about what it really takes to make an EV affordable, and what to know before you buy."
    icon={PlayCircle}
    compactTitle
    hideMeta
    hideCta
    video={video}
    gateVideo
    extraCta={{ label: "Watch Part 2", to: "/from-pump-to-plug-part-2" }}
    sections={sections}
    linkCards={linkCards}
  />
);

export default FromPumpToPlugPart3;
