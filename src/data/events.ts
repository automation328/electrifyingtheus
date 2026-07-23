import pumpToPlug from "@/assets/event-pump-to-plug.jpg";
import demoDaysLa from "@/assets/event-demo-days-la.jpg";
import emobilitySummit from "@/assets/events/emobility-summit.webp";
// Real event flyers/photos for the industry-event listings.
import iaaMobility2027 from "@/assets/events/iaa-mobility-2027.png";
import nordicEvSummit2027 from "@/assets/events/nordic-ev-summit-2027.png";
import evChargingSummit2027 from "@/assets/events/ev-charging-summit-2027.png";
import moveAmerica2026 from "@/assets/events/move-america-2026.png";
import laAutoShow2026 from "@/assets/events/la-auto-show-2026.webp";
import batteryShow2026 from "@/assets/events/battery-show-2026.avif";
import actExpo2027 from "@/assets/events/act-expo-2027.png";
import autoShanghai2027 from "@/assets/events/auto-shanghai-2027.png";
// Generic EV photo for the one listing without its own flyer (EVADC Monthly Meeting).
import workforce from "@/assets/workforce.jpg";
// Real flyers/graphics for the Drive Clean Colorado + EVADC events.
import unityFest2026 from "@/assets/events/unity-fest-2026.png";
import julyCoalition2026 from "@/assets/events/july-coalition-2026.jpg";
import stateOfCharge2026 from "@/assets/events/state-of-charge-2026.png";
import evChargingMeetup2026 from "@/assets/events/ev-charging-meetup-2026.jpg";
import augustCoalition2026 from "@/assets/events/august-coalition-2026.jpg";
import fleetCharging2026 from "@/assets/events/fleet-charging-2026.jpg";
import socoMeetup2026 from "@/assets/events/soco-meetup-2026.jpg";
import septemberCoalition2026 from "@/assets/events/september-coalition-2026.jpg";
import driveCleanSummit2026 from "@/assets/events/drive-clean-summit-2026.png";
import octoberCoalition2026 from "@/assets/events/october-coalition-2026.jpg";
import evadcAskAnEvOwner2026 from "@/assets/events/evadc-ask-an-ev-owner-2026.png";
import evadcPicnic2026 from "@/assets/events/evadc-picnic-2026.jpg";
import forthRoadmap2026 from "@/assets/events/forth-roadmap-2026.png";
import { lookupEventTitle } from "./event-titles";

export interface EventItem {
  month: string;
  day: string;
  year: number;
  title: string;
  type: string;
  location: string;
  /** City/region used for ZIP/area alert matching + map prominence. */
  region: string;
  time: string;
  description: string;
  /** Hero/card image for this exact event. */
  image: string;
  featured?: boolean;
  /** When set, the event links to its own detail page at /events/{slug}. */
  slug?: string;
  /** External registration link (e.g. webinar signup). */
  registerUrl?: string;
  /** True for events pulled from an external ICS/RSS feed (sorted below ETU's). */
  external?: boolean;
  /** Feed hostname for external events (shown as a small source label). */
  source?: string;
  /** When true, the event is excluded from the homepage hero carousel (it can
   *  still appear in the Events list / Featured section). */
  heroHidden?: boolean;
  /** True for events Electrifying the US hosts/produces. "Our" events are kept
   *  on the site after their date passes; all other (third-party, submitted, and
   *  external-feed) events are auto-removed once they're done. */
  ours?: boolean;
}

const MONTH_NUM: Record<string, number> = {
  JAN: 0, FEB: 1, MAR: 2, APR: 3, MAY: 4, JUN: 5,
  JUL: 6, AUG: 7, SEP: 8, OCT: 9, NOV: 10, DEC: 11,
};

/** Parse an EventItem's month/day/year into a Date (local midnight). */
export const eventDate = (e: EventItem): Date => {
  const m = MONTH_NUM[e.month.slice(0, 3).toUpperCase()] ?? 0;
  return new Date(e.year, m, parseInt(e.day, 10) || 1);
};

/** True when the event is today or in the future. */
export const isUpcoming = (e: EventItem): boolean => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  return eventDate(e).getTime() >= today.getTime();
};

/** Whether an event should still be shown on the site. Upcoming events always
 *  show; past events show only if they're ours (e.ours). Everything else — past
 *  third-party, submitted, and external-feed events — is auto-removed once done. */
export const isActive = (e: EventItem): boolean => isUpcoming(e) || !!e.ours;

/** Sort comparator: soonest first. */
export const byDateAsc = (a: EventItem, b: EventItem) => eventDate(a).getTime() - eventDate(b).getTime();

/** "Thursday, AUG 27, 2026" — long weekday + the stored MON/day/year (matches
 *  the event detail page). */
export const eventFullDate = (e: EventItem): string => {
  let weekday = "";
  try { weekday = eventDate(e).toLocaleDateString("en-US", { weekday: "long" }); } catch { /* keep blank */ }
  return `${weekday ? `${weekday}, ` : ""}${e.month} ${e.day}, ${e.year}`;
};

/** Short city/area parsed from an event's location, for appending to card titles.
 *  "…, Park Ridge, IL 60068" → "Park Ridge" (the second-to-last comma segment is
 *  reliably the city in US/CA addresses). Returns "" for online/virtual events,
 *  "See event details", or single-segment locations. */
export const eventCity = (e: EventItem): string => {
  const loc = (e.location || "").trim();
  if (!loc || /see event details/i.test(loc) || /online|webinar|virtual/i.test(loc)) return "";
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  // Drop a trailing bare-ZIP segment ("…, San Marcos, CA, 92178") so the city
  // lands on the right part instead of the state code.
  if (parts.length && /^\d{5}(?:-\d{4})?$/.test(parts[parts.length - 1])) parts.pop();
  if (parts.length < 2) return "";
  return parts[parts.length - 2] || "";
};

/** Title shown on event cards. A curated entry in EVENT_TITLE_OVERRIDES wins;
 *  otherwise the event's city is appended ("EV Expo" → "EV Expo - Park Ridge").
 *  No-ops when there's no parseable city or the title already names it. */
export const eventDisplayTitle = (e: EventItem): string => {
  const override = lookupEventTitle(e.registerUrl, e.title);
  if (override) return override;
  const city = eventCity(e);
  if (!city) return e.title;
  if (e.title.toLowerCase().includes(city.toLowerCase())) return e.title;
  return `${e.title} - ${city}`;
};

/** Two-letter state code parsed from an event's location (last comma segment,
 *  e.g. "…, Pasadena, CA 91103" → "CA"). "" for online/see-details locations. */
export const eventStateCode = (e: EventItem): string => {
  const loc = (e.location || "").trim();
  if (!loc || /see event details/i.test(loc) || /online|webinar|virtual/i.test(loc)) return "";
  const parts = loc.split(",").map((s) => s.trim()).filter(Boolean);
  // Drop a trailing bare-ZIP segment so the state lands on the "…, CA, 92178" part.
  if (parts.length && /^\d{5}(?:-\d{4})?$/.test(parts[parts.length - 1])) parts.pop();
  const last = parts[parts.length - 1] || "";
  const m = last.match(/\b([A-Z]{2})\b/);
  return m ? m[1] : "";
};

/** "City, ST" for the card's location pin — city + state only, no street address.
 *  "" for online / see-details events. */
export const eventCityState = (e: EventItem): string => {
  const city = eventCity(e);
  if (!city) return "";
  const st = eventStateCode(e);
  return st ? `${city}, ${st}` : city;
};

// US state / DC / PR + Canadian province codes — used to validate a "City, ST"
// pulled from free text so we don't treat any two-capital token as a state.
const US_STATE_CODES = new Set([
  "AL","AK","AZ","AR","CA","CO","CT","DE","FL","GA","HI","ID","IL","IN","IA","KS",
  "KY","LA","ME","MD","MA","MI","MN","MS","MO","MT","NE","NV","NH","NJ","NM","NY",
  "NC","ND","OH","OK","OR","PA","RI","SC","SD","TN","TX","UT","VT","VA","WA","WV",
  "WI","WY","DC","PR",
  "ON","BC","AB","QC","MB","SK","NS","NB","NL","PE", // a few feed events are cross-border
]);

/** First "City, ST" found in free text (e.g. an event's description body), with
 *  ST validated against the state/province list. City = 1–4 capitalized words.
 *  Returns "" when nothing matches. */
export const cityStateFromText = (text: string): string => {
  if (!text) return "";
  const re = /([A-Z][A-Za-z.'-]+(?:[ ][A-Z][A-Za-z.'-]+){0,3}),\s*([A-Z]{2})\b(?:\s+\d{5}(?:-\d{4})?)?/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(text))) {
    if (US_STATE_CODES.has(m[2])) return `${m[1].trim()}, ${m[2]}`;
  }
  return "";
};

// Meetup.com group → home metro. Meetup ICS feed events carry no LOCATION and
// often no address in the blurb, but each group is fixed to one city — keyed by
// the stable URL slug (…/meetup.com/<slug>/events/…).
const MEETUP_GROUP_CITY: Record<string, string> = {
  "austinevs": "Austin, TX",
  "houston-light-electric-vehicles-meetup-group": "Houston, TX",
  "knoxville-electric-vehicle-association": "Knoxville, TN",
};

const meetupCity = (e: EventItem): string => {
  const slug = e.registerUrl?.match(/meetup\.com\/([^/?#]+)/i)?.[1]?.toLowerCase();
  return (slug && MEETUP_GROUP_CITY[slug]) || "";
};

// Per-event pin overrides — for feed events whose actual venue city differs from
// the group metro / the label the feed baked into the title. Keyed by the stable
// event id in the URL (…/events/<id>/).
const PIN_OVERRIDES: Record<string, string> = {
  "315538690": "League City, TX", // JSC EV Club Lunch — meets on JSC's south side
};

const eventPinOverride = (e: EventItem): string => {
  const id = e.registerUrl?.match(/\/events\/(\d+)/i)?.[1];
  return (id && PIN_OVERRIDES[id]) || "";
};

/** "City, ST" for the card / detail location pin. Prefers a per-event override,
 *  then the location field, then a known Meetup group's home metro, then a
 *  "City, ST" parsed from the blurb. Returns "" for online/virtual events (no map
 *  pin) and when nothing resolves — so feed events with an empty LOCATION still
 *  get a pin. */
export const eventLocationPin = (e: EventItem): string => {
  const override = eventPinOverride(e);
  if (override) return override;
  const loc = (e.location || "").trim();
  if (/online|webinar|virtual/i.test(loc)) return ""; // online events: no map pin
  const fromLoc = eventCityState(e);
  if (fromLoc) return fromLoc;
  return meetupCity(e) || cityStateFromText(e.description || "");
};

/** Location string for the detail page: the full venue/address when the feed
 *  gives one, otherwise the derived "City, ST" pin. Falls back to the raw
 *  location (e.g. "Online · Live Webinar") so the line is never blank. */
export const eventLocationText = (e: EventItem): string => {
  const loc = (e.location || "").trim();
  if (loc && !/see event details/i.test(loc)) return loc;
  return eventLocationPin(e) || loc || "See event details";
};

/** Card title with any trailing location suffix removed — the address lives in
 *  the location pin, not the title. Strips " - City, ST" / " - City" / ", City,
 *  ST" / ", City" (and en-dash variants) only when it exactly matches the event's
 *  own city/state, so real " - subtitle" titles are left untouched. */
export const eventTitleClean = (e: EventItem): string => {
  let title = eventDisplayTitle(e);
  // Strip a trailing " - City, ST" the feed baked into the title (e.g. a Meetup /
  // NDEM og:title venue label) so the address shows only in the location pin.
  // Only fires when the trailing token is a real state code, so real subtitles
  // like "Part 2 - How EVs Save You Thousands" are left intact.
  const tr = title.match(/\s[-–—]\s+([A-Z][A-Za-z.'-]+(?:[ ][A-Z][A-Za-z.'-]+){0,3}),\s*([A-Z]{2})\s*$/);
  if (tr && US_STATE_CODES.has(tr[2])) title = title.slice(0, tr.index).trim();
  const city = eventCity(e);
  if (!city) return title;
  const cands = [eventCityState(e), city].filter(Boolean);
  for (const c of cands) {
    for (const sep of [" - ", " – ", " — ", ", "]) {
      const suffix = sep + c;
      if (title.toLowerCase().endsWith(suffix.toLowerCase())) {
        return title.slice(0, title.length - suffix.length).trim();
      }
    }
  }
  return title;
};

/** URL-safe slug from arbitrary text (≤60 chars). */
export const slugify = (s: string): string =>
  s.toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");

export const EVENTS: EventItem[] = [
  {
    month: "JUL", day: "29", year: 2026,
    title: "Multi-Modal eMobility Summit",
    type: "Summit",
    location: "Grosse Ile, MI",
    region: "Grosse Ile, MI",
    time: "9:00 AM – 7:00 PM ET",
    description:
      "This inaugural Multi-Modal eMobility Summit transforms an operational airport into a live demonstration space for the future of electric transportation — across land, air, and water. Explore static displays and vendor booths, join round-table discussions, catch live demos and speaker presentations, grab a bite from the food trucks, and take a DTE ride-and-drive. Hosted by Clean Fuels Michigan for OEMs, utilities, public agencies, technology providers, startups, and mobility-sector leaders.",
    image: emobilitySummit,
    featured: true,
    slug: "multi-modal-emobility-summit",
    registerUrl: "https://dsl9y.share.hsforms.com/2OnvJ8eYuToOIglqBjydEDQ",
  },
  {
    month: "JUN", day: "27", year: 2026,
    title: "Demo Days Los Angeles",
    type: "Festival",
    location: "Rose Bowl Stadium, 1001 Rose Bowl Dr, Pasadena, CA 91103",
    region: "Pasadena, CA",
    time: "Sat–Sun, 10:00 AM – 5:00 PM PT",
    description:
      "North America's largest outdoor vehicle demonstration festival — over one million square feet at the Rose Bowl. Test drive and ride a huge range of vehicles: cars, trucks, motorcycles, e-bikes, ATVs, UTVs, e-scooters, e-skateboards, and autonomous vehicles, across dedicated demo courses. Plus live Freestyle Motocross, a Kids Zone with go-karts and electric rides, custom vehicle showcases, robotics and aerial-mobility exhibits, solar and energy displays, food trucks, and live music. June 27–28, 2026 · 10:00 AM – 5:00 PM.",
    image: demoDaysLa,
    featured: true,
    heroHidden: true,
    slug: "demo-days-los-angeles",
    registerUrl: "https://demodaysfestival.com/products/los-angeles",
  },
  {
    month: "AUG", day: "27", year: 2026,
    title: "Part 2: From The Pump To The Plug - How Electric Vehicles Can Save You Thousands",
    type: "Webinar",
    location: "Online · Live Webinar",
    region: "Online",
    time: "2:00 – 3:00 PM ET / 11:00 AM – 12:00 PM PT",
    description:
      "A free one-hour webinar on how switching from gas to electric saves drivers thousands — on fuel, maintenance, and incentives. See real cost comparisons and how to find the rebates available in your area. Powered by Electrifying Michigan, Electrifying the US, and Electrifying Virginia.",
    image: pumpToPlug,
    featured: true,
    ours: true,
    slug: "from-pump-to-plug",
    registerUrl: "https://us06web.zoom.us/webinar/register/WN_PtzGLoOyQqmDMg8lXpKRlw#/registration",
  },

  // ── Major EV / mobility industry events (from EV Magazine's Top 10) ─────────
  // Only their next upcoming edition (on/after Jul 2026); past editions excluded.
  // Listed in the Events directory only — not featured, kept out of the hero.
  {
    month: "SEP", day: "23", year: 2026,
    title: "MOVE America 2026",
    type: "Conference",
    location: "Detroit, MI",
    region: "Detroit, MI",
    time: "Sep 23–24, 2026",
    description:
      "The leading converged mobility conference in the Americas — 5,000+ professionals across EVs, fleets, micromobility, charging, and smart cities, with live demos on wireless charging, V2X, and electrified fleets.",
    image: moveAmerica2026,
    heroHidden: true,
    slug: "move-america-2026",
    registerUrl: "https://www.terrapinn.com/exhibition/move-america/index.stm",
  },
  {
    month: "OCT", day: "12", year: 2026,
    title: "The Battery Show North America 2026",
    type: "Expo",
    location: "Detroit, MI",
    region: "Detroit, MI",
    time: "Oct 12–15, 2026",
    description:
      "North America's largest battery and EV-tech event — 21,000+ professionals and 1,300+ exhibitors across electrification, energy storage, thermal management, and battery systems. Co-located with EV Tech Expo.",
    image: batteryShow2026,
    heroHidden: true,
    slug: "the-battery-show-north-america-2026",
    registerUrl: "https://www.thebatteryshow.com/",
  },
  {
    month: "NOV", day: "20", year: 2026,
    title: "LA Auto Show / AutoMobility LA 2026",
    type: "Auto Show",
    location: "Los Angeles, CA",
    region: "Los Angeles, CA",
    time: "Nov 20–29, 2026",
    description:
      "North America's premier EV launchpad — featuring Electric Avenue, a nearly mile-long indoor EV test track, and debuts from every major automaker, alongside the AutoMobility LA industry days.",
    image: laAutoShow2026,
    heroHidden: true,
    slug: "la-auto-show-automobility-la-2026",
    registerUrl: "https://laautoshow.com/",
  },
  {
    month: "MAR", day: "1", year: 2027,
    title: "EV Charging Summit & Expo 2027",
    type: "Summit",
    location: "Las Vegas, NV",
    region: "Las Vegas, NV",
    time: "Mar 1–3, 2027",
    description:
      "North America's most influential event focused exclusively on EV charging infrastructure — 240+ exhibitors and 180+ speakers covering charging technology, financing models, and policy.",
    image: evChargingSummit2027,
    heroHidden: true,
    slug: "ev-charging-summit-expo-2027",
    registerUrl: "https://evchargingsummit.com/",
  },
  {
    month: "MAY", day: "12", year: 2027,
    title: "Nordic EV Summit 2027",
    type: "Summit",
    location: "Oslo, Norway",
    region: "Oslo, Norway",
    time: "May 12–13, 2027",
    description:
      "Europe's policy-leading EV gathering — 1,300+ delegates across government, industry, and academia, with sessions on charging profitability, battery production, and zero-emission transport.",
    image: nordicEvSummit2027,
    heroHidden: true,
    slug: "nordic-ev-summit-2027",
    registerUrl: "https://nordicevs.no/",
  },
  {
    month: "MAY", day: "17", year: 2027,
    title: "Advanced Clean Transportation (ACT) Expo 2027",
    type: "Expo",
    location: "Las Vegas, NV",
    region: "Las Vegas, NV",
    time: "May 17–20, 2027",
    description:
      "North America's largest clean-fleet and commercial-EV event — 12,000+ attendees, 500+ exhibitors, and 200+ zero-emission vehicles spanning EVs, hydrogen, and AI-driven fleet tech.",
    image: actExpo2027,
    heroHidden: true,
    slug: "act-expo-2027",
    registerUrl: "https://www.actexpo.com/",
  },
  {
    month: "SEP", day: "7", year: 2027,
    title: "IAA Mobility 2027",
    type: "Auto Show",
    location: "Messe München, Munich, Germany",
    region: "Munich, Germany",
    time: "Sep 7–12, 2027",
    description:
      "One of the world's largest mobility shows — 500,000+ visitors and 750 exhibitors, with global EV launches and a public Open Space in Munich's city center.",
    image: iaaMobility2027,
    heroHidden: true,
    slug: "iaa-mobility-2027",
    registerUrl: "https://www.iaa-mobility.com/en",
  },
  {
    month: "APR", day: "23", year: 2027,
    title: "Auto Shanghai 2027",
    type: "Auto Show",
    location: "Shanghai, China",
    region: "Shanghai, China",
    time: "Apr 23 – May 2, 2027",
    description:
      "One of the world's largest auto shows — the 22nd edition at NECC Shanghai, a major global debut stage for electric vehicles.",
    image: autoShanghai2027,
    heroHidden: true,
    slug: "auto-shanghai-2027",
    registerUrl: "https://autoshanghai.auto-fairs.com/en/",
  },

  // ── Drive Clean Colorado events (drivecleancolorado.org/events) ────────────
  // Upcoming only; venue dropped so the pin is city + state (or "Online").
  {
    month: "JUL", day: "26", year: 2026,
    title: "5th Annual Unity Fest 2026",
    type: "Festival",
    location: "Aurora, CO",
    region: "Aurora, CO",
    time: "3:00 – 7:00 PM MT",
    description:
      "Drive Clean Colorado joins the 5th annual Unity Fest — a free, family-friendly celebration presented by the Black Parents United Foundation — sharing state and federal programs that support healthier, cleaner communities.",
    image: unityFest2026,
    heroHidden: true,
    slug: "unity-fest-2026",
    registerUrl: "https://drivecleancolorado.org/event/5th-annual-unity-fest-2026/",
  },
  {
    month: "JUL", day: "30", year: 2026,
    title: "July Coalition Conversation",
    type: "Virtual Meetup",
    location: "Online",
    region: "Online",
    time: "9:30 – 10:30 AM MT",
    description:
      "Drive Clean Colorado's monthly Coalition Conversation — a chance to stay plugged into Colorado's clean-transportation landscape, hear what others are working on, and share updates.",
    image: julyCoalition2026,
    heroHidden: true,
    slug: "july-coalition-conversation-2026",
    registerUrl: "https://drivecleancolorado.org/event/july-coalition-conversation/",
  },
  {
    month: "JUL", day: "31", year: 2026,
    title: "State of Charge 2026: Education, Innovation, and EV Conversions",
    type: "Conference",
    location: "Golden, CO",
    region: "Golden, CO",
    time: "Jul 31 – Aug 1, 2026",
    description:
      "An educational conference hosted by Ohm On The Range, bringing together EV enthusiasts, industry professionals, builders, and innovators for two days of education, innovation, and EV conversions.",
    image: stateOfCharge2026,
    heroHidden: true,
    slug: "state-of-charge-2026",
    registerUrl: "https://drivecleancolorado.org/event/state-of-charge-2026-education-innovation-and-ev-conversions/",
  },
  {
    month: "AUG", day: "6", year: 2026,
    title: "EV Charging Meet-Up",
    type: "Meetup",
    location: "Brighton, CO",
    region: "Brighton, CO",
    time: "8:45 – 10:30 AM MT",
    description:
      "An interactive session at the Adams County Conference Center bringing together charging experts, local leaders, and industry partners to share best practices for EV charging deployment.",
    image: evChargingMeetup2026,
    heroHidden: true,
    slug: "ev-charging-meet-up-2026",
    registerUrl: "https://drivecleancolorado.org/event/ev-charging-meet-up-3/",
  },
  {
    month: "AUG", day: "27", year: 2026,
    title: "August Coalition Conversation",
    type: "Virtual Meetup",
    location: "Online",
    region: "Online",
    time: "9:30 – 10:30 AM MT",
    description:
      "Drive Clean Colorado's monthly Coalition Conversation — a steady touchpoint for collaboration, idea-sharing, and community-building around clean transportation.",
    image: augustCoalition2026,
    heroHidden: true,
    slug: "august-coalition-conversation-2026",
    registerUrl: "https://drivecleancolorado.org/event/august-coalition-conversation-2/",
  },
  {
    month: "SEP", day: "9", year: 2026,
    title: "Fleet Charging and Meet-Up",
    type: "Meetup",
    location: "Colorado",
    region: "Colorado",
    time: "10:00 – 11:30 AM MT",
    description:
      "A fleet convening hosted with Xcel Energy, bringing together fleet managers, public agencies, utilities, and industry leaders to discuss fleet electrification, infrastructure planning, and utility coordination.",
    image: fleetCharging2026,
    heroHidden: true,
    slug: "fleet-charging-meet-up-2026",
    registerUrl: "https://drivecleancolorado.org/event/fleet-charging-and-meet-up/",
  },
  {
    month: "SEP", day: "13", year: 2026,
    title: "Forth Roadmap Conference",
    type: "Conference",
    location: "Seattle, WA",
    region: "Seattle, WA",
    time: "Sep 13–15, 2026",
    description:
      "The nation's leading electric-transportation conference — policymakers, utilities, automakers, and charging providers at the Seattle Convention Center. Drive Clean Colorado is proud to support Roadmap 2026.",
    image: forthRoadmap2026,
    heroHidden: true,
    slug: "forth-roadmap-conference-2026",
    registerUrl: "https://drivecleancolorado.org/event/forth-roadmap-conference/",
  },
  {
    month: "SEP", day: "17", year: 2026,
    title: "SoCo Charging Meet-Up",
    type: "Meetup",
    location: "Pueblo West, CO",
    region: "Pueblo West, CO",
    time: "3:00 – 6:00 PM MT",
    description:
      "A fun, interactive event at Steel City Solar to connect with industry experts, explore EVs, and experience live charging demonstrations — whether you're EV-curious or already driving electric.",
    image: socoMeetup2026,
    heroHidden: true,
    slug: "soco-charging-meet-up-2026",
    registerUrl: "https://drivecleancolorado.org/event/soco-charging-meet-up/",
  },
  {
    month: "SEP", day: "24", year: 2026,
    title: "September Coalition Conversation",
    type: "Virtual Meetup",
    location: "Online",
    region: "Online",
    time: "9:30 – 10:30 AM MT",
    description:
      "Drive Clean Colorado's monthly Coalition Conversation — a place to exchange insights, celebrate progress, and learn what's next across the state.",
    image: septemberCoalition2026,
    heroHidden: true,
    slug: "september-coalition-conversation-2026",
    registerUrl: "https://drivecleancolorado.org/event/september-coalition-conversation-2/",
  },
  {
    month: "OCT", day: "22", year: 2026,
    title: "Drive Clean Summit + Expo 2026",
    type: "Expo",
    location: "Denver, CO",
    region: "Denver, CO",
    time: "10:00 AM – 5:00 PM MT",
    description:
      "Drive Clean Colorado's flagship Summit + Expo at Empower Field at Mile High — a full day of clean-transportation education, exhibits, and networking. Registration opens August 1, 2026.",
    image: driveCleanSummit2026,
    heroHidden: true,
    slug: "drive-clean-summit-expo-2026",
    registerUrl: "https://drivecleancolorado.org/event/drive-clean-summit-expo-2026/",
  },
  {
    month: "OCT", day: "29", year: 2026,
    title: "October Coalition Conversation",
    type: "Virtual Meetup",
    location: "Online",
    region: "Online",
    time: "9:30 – 10:30 AM MT",
    description:
      "The final Coalition Conversation of the year — a chance to reflect on progress and look ahead. (No calls in November or December.)",
    image: octoberCoalition2026,
    heroHidden: true,
    slug: "october-coalition-conversation-2026",
    registerUrl: "https://drivecleancolorado.org/event/october-coalition-conversation-2/",
  },

  // ── EVADC — Electric Vehicle Association of Greater Washington DC ───────────
  // (evadc.wildapricot.org) upcoming events; venue dropped to city + state.
  {
    month: "AUG", day: "5", year: 2026,
    title: "Ask an EV Owner (EVADC)",
    type: "Virtual Meetup",
    location: "Online",
    region: "Online",
    time: "7:30 PM ET",
    description:
      "A recurring virtual Q&A where prospective buyers can ask real EV owners anything — range, charging, cost, and living with an electric vehicle. Hosted by the Electric Vehicle Association of Greater Washington DC.",
    image: evadcAskAnEvOwner2026,
    heroHidden: true,
    slug: "evadc-ask-an-ev-owner-2026",
    registerUrl: "https://evadc.wildapricot.org/event-4423364",
  },
  {
    month: "AUG", day: "8", year: 2026,
    title: "EVADC Picnic",
    type: "Meetup",
    location: "Great Falls, VA",
    region: "Great Falls, VA",
    time: "12:00 PM ET",
    description:
      "The Electric Vehicle Association of Greater Washington DC's member picnic at Riverbend Park — food, community, and EVs.",
    image: evadcPicnic2026,
    heroHidden: true,
    slug: "evadc-picnic-2026",
    registerUrl: "https://evadc.wildapricot.org/event-6750995",
  },
  {
    month: "AUG", day: "19", year: 2026,
    title: "EVADC Monthly Meeting",
    type: "Meetup",
    location: "Bethesda, MD",
    region: "Bethesda, MD",
    time: "7:00 PM ET",
    description:
      "The Electric Vehicle Association of Greater Washington DC's monthly meeting — updates, guest speakers, and community discussion on all things EV.",
    image: workforce,
    heroHidden: true,
    slug: "evadc-monthly-meeting-2026",
    registerUrl: "https://evadc.wildapricot.org/event-5761950",
  },
];

const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];

/** All-day Google Calendar "add reminder" link for an event. */
export const gcalLink = (e: EventItem): string => {
  const m = String(MONTHS.indexOf(e.month) + 1).padStart(2, "0");
  const d = e.day.padStart(2, "0");
  const start = `${e.year}${m}${d}`;
  const endDay = String(Number(e.day) + 1).padStart(2, "0");
  const end = `${e.year}${m}${endDay}`;
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: `${e.title} — Electrifying the US`,
    dates: `${start}/${end}`,
    details: `${e.description}\n\nTime: ${e.time}`,
    location: e.location,
  });
  return `https://calendar.google.com/calendar/render?${params.toString()}`;
};
