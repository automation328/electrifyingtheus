import pumpToPlug from "@/assets/event-pump-to-plug.jpg";
import demoDaysLa from "@/assets/event-demo-days-la.jpg";
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

/** "Thursday, AUG 6, 2026" — long weekday + the stored MON/day/year (matches the
 *  event detail page). */
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

/** Card title with any trailing location suffix removed — the address lives in
 *  the location pin, not the title. Strips " - City, ST" / " - City" / ", City,
 *  ST" / ", City" (and en-dash variants) only when it exactly matches the event's
 *  own city/state, so real " - subtitle" titles are left untouched. */
export const eventTitleClean = (e: EventItem): string => {
  const title = eventDisplayTitle(e);
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
    month: "AUG", day: "6", year: 2026,
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
