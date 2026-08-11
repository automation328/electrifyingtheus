import { Users } from "lucide-react";
import type { EventSpeaker } from "@/lib/event-description";

/** Surfaces the list renders on: the detail page, a light card, or a gradient card. */
type Tone = "detail" | "card" | "gradient";

const TONES: Record<Tone, { heading: string; icon: string; name: string; org: string; dot: string; pill: string }> = {
  detail: {
    heading: "text-lg text-foreground",
    icon: "text-secondary",
    name: "text-foreground",
    org: "block text-sm text-muted-foreground",
    dot: "bg-primary",
    pill: "bg-secondary/10 text-secondary",
  },
  card: {
    heading: "text-sm text-foreground",
    icon: "text-secondary",
    name: "text-sm text-foreground",
    org: "block text-xs text-muted-foreground",
    dot: "bg-primary",
    pill: "bg-secondary/10 text-secondary",
  },
  gradient: {
    heading: "text-sm text-primary-foreground",
    icon: "text-primary-foreground",
    name: "text-sm text-primary-foreground",
    org: "block text-xs text-primary-foreground/80",
    dot: "bg-white/70",
    pill: "bg-white/20 text-primary-foreground",
  },
};

interface EventSpeakersProps {
  speakers: EventSpeaker[];
  tone?: Tone;
  className?: string;
}

/** Bulleted speaker panel — name, optional role pill, and organisation. */
const EventSpeakers = ({ speakers, tone = "card", className = "" }: EventSpeakersProps) => {
  if (speakers.length === 0) return null;
  const t = TONES[tone];
  const gap = tone === "detail" ? "space-y-2.5" : "space-y-2";

  return (
    <div className={className}>
      <h3 className={`font-display font-bold mb-3 flex items-center gap-2 ${t.heading}`}>
        <Users className={`w-5 h-5 shrink-0 ${t.icon}`} /> Speakers include
      </h3>
      <ul className={gap}>
        {speakers.map((s) => (
          <li key={`${s.name}-${s.org}`} className="flex items-start gap-3">
            <span className={`mt-[7px] w-1.5 h-1.5 rounded-full shrink-0 ${t.dot}`} aria-hidden />
            <span className="leading-snug">
              <span className={`font-semibold ${t.name}`}>{s.name}</span>
              {s.role && (
                <span className={`ml-2 inline-flex items-center rounded-full text-[11px] font-semibold px-2 py-0.5 align-middle ${t.pill}`}>
                  {s.role}
                </span>
              )}
              {s.org && <span className={t.org}>{s.org}</span>}
            </span>
          </li>
        ))}
      </ul>
    </div>
  );
};

export default EventSpeakers;
