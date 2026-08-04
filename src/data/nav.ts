// Top navigation menu items. This is the DEFAULT — the CMS can override it (see
// src/lib/site-settings.ts / the Navigation editor); the Navbar falls back to
// this when no override is saved.
//
//  • dialog:  opens the Contact popup instead of navigating (href is a fallback)
//  • primary: also shown inline in the desktop bar (hidden from the burger on lg+)
//  • barOnly: shown ONLY in the desktop bar (never in the burger/mobile menu)

export type NavItem = { label: string; href: string; dialog?: boolean; primary?: boolean; barOnly?: boolean };

export const NAV_DEFAULT: NavItem[] = [
  { label: "About", href: "#about", primary: true },
  { label: "EV Dashboard", href: "#dashboard", primary: true },
  { label: "EV 101", href: "#ev101", primary: true },
  { label: "Benefits", href: "#benefits", primary: true },
  { label: "Events", href: "/events", primary: true },
  { label: "EV vs Gas Calculator", href: "/electricity-vs-gasoline", primary: true },
  { label: "Incentives", href: "/rebates-incentives" },
  { label: "News", href: "/news" },
  { label: "Multimodal", href: "#multimodal" },
  { label: "Photos and Videos", href: "/gallery" },
  { label: "Contact", href: "/contact-us", dialog: true },
];
