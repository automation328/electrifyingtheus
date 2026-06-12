import pumpToPlug from "@/assets/event-pump-to-plug.jpg";

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

/** Sort comparator: soonest first. */
export const byDateAsc = (a: EventItem, b: EventItem) => eventDate(a).getTime() - eventDate(b).getTime();

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
    month: "JUN", day: "25", year: 2026,
    title: "From Pump to Plug: How Electric Vehicles Are Saving Thousands",
    type: "Webinar",
    location: "Online · Live Webinar",
    region: "Online",
    time: "2:00 – 3:00 PM ET",
    description:
      "A free one-hour webinar on how switching from gas to electric saves drivers thousands — on fuel, maintenance, and incentives. See real cost comparisons and how to find the rebates available in your area. Powered by Electrifying Michigan, Electrifying the US, and Electrifying Virginia.",
    image: pumpToPlug,
    featured: true,
    slug: "from-pump-to-plug",
    registerUrl: "https://bit.ly/SaveWithEVs",
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
