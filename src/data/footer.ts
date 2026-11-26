// Editable footer content. This is the DEFAULT — the CMS can override it (see
// src/lib/site-settings.ts / the Footer editor); the Footer falls back to this.
// The newsletter signup form itself is functional and stays in code.

export interface FooterLink { label: string; href: string }
export interface FooterColumn { title: string; links: FooterLink[] }

export interface FooterContent {
  tagline: string;
  email: string;
  columns: FooterColumn[];
  newsletterTitle: string;
  newsletterText: string;
  bottomLinks: FooterLink[];
}

export const FOOTER_DEFAULT: FooterContent = {
  tagline: "2026 is the tipping point for electric vehicle adoption in America—why most drivers now save by going EV.",
  email: "info@electrifyingtheus.com",
  columns: [
    {
      title: "Quick Links",
      links: [
        { label: "About", href: "#about" },
        { label: "EV Dashboard", href: "#dashboard" },
        { label: "EV 101", href: "#ev101" },
        { label: "Benefits", href: "#benefits" },
        { label: "Multimodal", href: "#multimodal" },
        { label: "Contact", href: "/contact-us" },
      ],
    },
    {
      title: "Resources",
      links: [
        { label: "News", href: "/news" },
        { label: "Events", href: "/events" },
        { label: "Careers", href: "/careers" },
        { label: "EV vs Gas", href: "/electricity-vs-gasoline" },
        { label: "Talk to EVan", href: "/assistant" },
      ],
    },
    // Tools and Learn link pages that nothing else on the site linked to (the
    // TCO calculator, the safety webinar) or only one page did. Search engines
    // find and weigh pages by the links pointing at them.
    {
      title: "Tools",
      links: [
        { label: "Cost of Ownership Calculator", href: "/calculator" },
        { label: "GM EV vs Gas", href: "/gm-ev-vs-gas" },
        { label: "EV Range Map", href: "/range-map" },
        { label: "Rebate Eligibility", href: "/rebate-eligibility" },
        { label: "EV Marketplace", href: "/marketplace" },
      ],
    },
    {
      title: "Learn",
      links: [
        { label: "EV Charging 101", href: "/ev-charging-101" },
        { label: "EVs in Winter", href: "/evs-in-winter" },
        { label: "Financial Savings", href: "/financial-savings" },
        { label: "U.S. EV Policies", href: "/us-ev-policies" },
        { label: "EV Road Safety", href: "/ev-road-safety" },
        { label: "EV Safety Webinar", href: "/evsafetywebinar" },
      ],
    },
    {
      title: "Partner Sites",
      links: [
        { label: "Electrifying Virginia", href: "https://www.electrifyingva.com/" },
        { label: "Electrifying Michigan", href: "https://www.electrifyingmi.com/" },
        { label: "Find Charging Stations", href: "/find-a-charger" },
      ],
    },
  ],
  newsletterTitle: "Stay Charged",
  newsletterText: "Join the movement — EV news, incentives, and program updates, straight to your inbox.",
  bottomLinks: [
    { label: "Privacy Policy", href: "/privacy-policy" },
    { label: "Terms & Conditions", href: "/terms" },
  ],
};
