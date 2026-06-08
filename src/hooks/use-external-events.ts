// Fetches upcoming US EV events from the /api/events proxy (which aggregates the
// ICS/RSS feeds configured in the EVENT_FEEDS env var) and maps them onto the
// EventItem shape the Events page renders. ETU's own events are merged ahead of
// these by the page. With no feeds configured the proxy returns [], so this is a
// safe no-op until feeds are added.

import { useQuery } from "@tanstack/react-query";
import { type EventItem } from "@/data/events";
import eventFallback from "@/assets/ev-charging.jpg";

interface FeedEvent {
  title: string;
  startISO: string;
  endISO?: string;
  location?: string;
  description?: string;
  url?: string;
  source?: string;
}

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const mapToEventItem = (e: FeedEvent): EventItem => {
  const d = new Date(e.startISO);
  const hasTime = !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0);
  const time = hasTime
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short",
      }).format(d)
    : "All day";
  const location = e.location?.trim() || "See event details";
  return {
    month: MONTH_ABBR[d.getUTCMonth()],
    day: String(d.getUTCDate()),
    year: d.getUTCFullYear(),
    title: e.title,
    type: "EV Event",
    location,
    region: location,
    time,
    description: (e.description ?? "").slice(0, 320) || "EV event in the U.S. — see the organizer's page for full details.",
    image: eventFallback,
    registerUrl: e.url,
    external: true,
    source: e.source,
  };
};

async function fetchExternalEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch("/api/events");
    if (!res.ok) return [];
    const data = await res.json();
    const list: FeedEvent[] = Array.isArray(data?.events) ? data.events : [];
    return list.map(mapToEventItem);
  } catch {
    return [];
  }
}

export function useExternalEvents(): { events: EventItem[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["external-events"],
    queryFn: fetchExternalEvents,
    staleTime: 60 * 60 * 1000, // 1h — matches the CDN cache on /api/events
  });
  return { events: q.data ?? [], loading: q.isLoading };
}
