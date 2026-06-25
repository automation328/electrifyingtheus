// Per-event "Event Calendar Disclaimer" — a collapsible legal notice shown on
// every (third-party) event detail page. Expands to the full calendar/listings
// disclaimer, a contact line for corrections, and a link to the Terms of Use.

import { useState } from "react";
import { Link } from "react-router-dom";
import { Info, ChevronDown, ArrowRight } from "lucide-react";
import { EVENT_CALENDAR_DISCLAIMER } from "@/lib/disclaimers";

const EventDisclaimer = ({ className = "" }: { className?: string }) => {
  const [open, setOpen] = useState(false);

  return (
    <div className={`rounded-2xl border border-border bg-muted/40 ${className}`}>
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        aria-expanded={open}
        className="flex w-full items-center gap-2.5 p-4 md:p-5 text-left"
      >
        <Info className="w-4 h-4 shrink-0 text-muted-foreground" aria-hidden />
        <span className="flex-1 text-xs font-semibold text-foreground">Event Calendar Disclaimer</span>
        <ChevronDown className={`w-4 h-4 shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} aria-hidden />
      </button>

      {open && (
        <div className="space-y-2.5 px-4 pb-4 md:px-5 md:pb-5 text-xs leading-relaxed text-muted-foreground">
          <p className="font-semibold text-foreground">Event Calendar / Listings</p>
          {EVENT_CALENDAR_DISCLAIMER.map((para, i) => (
            <p key={i}>{para}</p>
          ))}
          <p>
            To report an inaccurate listing, request a removal, or submit an event for consideration, contact us at{" "}
            <a href="mailto:info@electrifyingtheus.com" className="font-medium text-primary hover:underline">
              info@electrifyingtheus.com
            </a>
            .
          </p>
          <Link
            to="/terms"
            className="inline-flex items-center gap-1.5 pt-1 font-semibold text-primary hover:gap-2 transition-all"
          >
            Terms of Use <ArrowRight className="w-3.5 h-3.5" />
          </Link>
        </div>
      )}
    </div>
  );
};

export default EventDisclaimer;
