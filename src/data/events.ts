import evFamily from "@/assets/ev-family.jpg";
import evCharging from "@/assets/ev-charging.jpg";
import workforce from "@/assets/workforce.jpg";
import steamEducation from "@/assets/steam-education.jpg";
import heavyDuty from "@/assets/heavy-duty.jpg";
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
  {
    month: "JUN", day: "14", year: 2026,
    title: "National Drive Electric — Ride & Drive",
    type: "Ride & Drive",
    location: "Atlanta, GA · Piedmont Park",
    region: "Atlanta, GA",
    time: "10:00 AM – 4:00 PM EDT",
    description: "Test-drive the latest EVs from multiple automakers, talk to owners, and learn about incentives — all in one place. Free and open to the public.",
    image: evFamily,
    featured: true,
  },
  {
    month: "JUN", day: "26", year: 2026,
    title: "Charging at Home: Free Webinar",
    type: "Webinar",
    location: "Online · Zoom",
    region: "Online",
    time: "6:00 PM – 7:00 PM EDT",
    description: "Everything you need to know about Level 2 home charging — equipment, installation, costs, and utility rebates. Live Q&A with EV experts.",
    image: evCharging,
  },
  {
    month: "JUL", day: "10", year: 2026,
    title: "Clean Mobility Workforce Summit",
    type: "Conference",
    location: "Detroit, MI · TCF Center",
    region: "Detroit, MI",
    time: "9:00 AM – 5:00 PM EDT",
    description: "Connect with employers, training programs, and labor partners building the clean-energy workforce. Career fair and hands-on demos included.",
    image: workforce,
    featured: true,
  },
  {
    month: "AUG", day: "02", year: 2026,
    title: "Electrifying Virginia Community Expo",
    type: "Expo",
    location: "Richmond, VA · Main Street Station",
    region: "Richmond, VA",
    time: "11:00 AM – 6:00 PM EDT",
    description: "A family-friendly celebration of e-mobility: EVs, e-bikes, electric buses, food trucks, and STEAM activities for kids.",
    image: steamEducation,
  },
  {
    month: "SEP", day: "18", year: 2026,
    title: "Fleet Electrification Workshop",
    type: "Workshop",
    location: "Online · Virtual",
    region: "Online",
    time: "1:00 PM – 3:00 PM EDT",
    description: "For businesses and municipalities: how to plan, fund, and roll out electric fleets. Case studies, TCO modeling, and grant guidance.",
    image: heavyDuty,
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
