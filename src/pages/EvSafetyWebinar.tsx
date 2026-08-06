// Recap page for the EV Safety & First Responders webinar, routed at
// /evsafetywebinar. This is an explicit route (above the catch-all), so it
// replaces the earlier CMS placeholder page that lived at this path. It renders
// ContentPageLayout directly — no CMS overlay — so this content is authoritative.

import { ShieldCheck, MessageCircle, CalendarDays, ClipboardCheck } from "lucide-react";
import ContentPageLayout, { type ContentSection, type ContentLinkCard } from "@/components/ContentPageLayout";
import SeoHead from "@/components/SeoHead";

// The webinar recording (YouTube video id — same one the page showed before).
const video = {
  youtubeId: "j2Ekl1vltkw",
  title: "EV Safety and First Responders: Demystifying the Myths and Misinformation about Electric Vehicles",
};

// Post-event survey link. A full https:// URL renders as an external button
// automatically (see ContentPageLayout link cards). Until the real survey link is
// provided it points to Contact, which is a valid feedback channel.
const SURVEY_URL = "/contact-us";

const sections: ContentSection[] = [
  {
    heading: "Thank you for joining us",
    body: [
      "Thank you for being part of the EV Safety and First Responders Webinar: Demystifying the Myths and Misinformation about Electric Vehicles. We sincerely appreciate you taking the time to join this important conversation.",
      "As electric and alternative-fuel vehicles become more common on our roads, making sure first responders are equipped with the right knowledge, tools, and resources has never mattered more. Your engagement helped make this session a success, and we're grateful for your commitment to advancing safe, multimodal electrification in a fast-evolving transportation landscape.",
    ],
  },
  {
    heading: "Watch the recording",
    body: [
      "Couldn't attend the full session, or want to revisit the discussion? Press play on the recording above to watch the complete webinar — the myths our panel took on, the research behind the answers, and the practical takeaways for first responders on the ground.",
    ],
  },
  {
    heading: "Meet the speakers",
    body: [
      "We heard from an outstanding panel who brought a range of expertise and real-world insight to the conversation:",
    ],
    list: [
      "Craig Blake — Ford Motor Company: practical perspectives on EV systems and field-service considerations, helping responders better understand today's vehicle technologies.",
      "Robin Zevotek — NFPA: guidance on fire-protection standards, safety protocols, and national best practices for EV and AFV emergency response.",
      "Christian Vogt — FSRI: research-backed insight into EV safety, offering critical data to inform on-the-ground decision-making.",
      "John R. Seydel — City of Atlanta: policy, planning, and interagency coordination, and how cities can proactively prepare for rising EV adoption.",
    ],
  },
  {
    heading: "We'd like to hear from you",
    body: [
      "Your feedback shapes what we do next. If you have a moment, we'd be grateful if you'd share your thoughts in our short post-event survey — it helps us improve future events and tailor them to the topics that matter most to you.",
      "Thank you again for taking part. We look forward to seeing you at future events — explore what's coming up and stay connected using the links below.",
    ],
  },
];

const linkCards: ContentLinkCard[] = [
  { icon: ClipboardCheck, title: "Post-event survey", desc: "Two minutes of feedback helps us make the next event even better.", to: SURVEY_URL, bgCls: "gradient-hero" },
  { icon: CalendarDays, title: "Upcoming events", desc: "Ride & Drives, webinars, and expos happening across the country.", to: "/events", bgCls: "gradient-hero-rev" },
  { icon: ShieldCheck, title: "EV Road Safety", desc: "Resources on EV and AFV safety for first responders and the public.", to: "/ev-road-safety", bgCls: "gradient-hero" },
  { icon: MessageCircle, title: "Ask EVan", desc: "Your EV Advisor — instant answers on EVs, charging, and safety, 24/7.", to: "/#agent-chat", bgCls: "gradient-hero-rev" },
];

const EvSafetyWebinar = () => (
  <>
    <SeoHead
      title="EV Safety & First Responders Webinar — Electrifying the US"
      description="Watch the recording of our EV Safety and First Responders webinar — demystifying the myths and misinformation about electric vehicles, with Ford, NFPA, FSRI, and the City of Atlanta."
    />
    <ContentPageLayout
      badge="Webinar Replay"
      kicker="First Responders · Webinar Replay"
      title="EV Safety and First Responders Webinar:"
      highlight="Demystifying the Myths and Misinformation about Electric Vehicles"
      intro="Thank you to everyone who joined us. Here's the full recording, the expert panel who made it happen, and a quick way to share your feedback — as we work to equip first responders for a rapidly electrifying road."
      icon={ShieldCheck}
      compactTitle
      hideMeta
      hideCta
      video={video}
      extraCta={{ label: "See upcoming events", to: "/events" }}
      sections={sections}
      linkCards={linkCards}
    />
  </>
);

export default EvSafetyWebinar;
