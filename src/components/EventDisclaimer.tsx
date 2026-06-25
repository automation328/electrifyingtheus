// Per-event disclaimers shown on every (third-party) event detail page, styled as
// clean white cards (matching the site's CTA cards):
//  1. Third-Party Event Notice
//  2. Event Calendar / Listings — full text + corrections mailto + Terms of Use link

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { EVENT_THIRD_PARTY_NOTICE, EVENT_CALENDAR_DISCLAIMER } from "@/lib/disclaimers";

const cardCls = "rounded-2xl border border-border bg-card p-5 md:p-6 shadow-card";

const EventDisclaimer = ({ className = "" }: { className?: string }) => (
  <div className={`space-y-4 ${className}`}>
    {/* Third-Party Event Notice */}
    <div className={cardCls}>
      <h3 className="font-semibold text-foreground mb-1.5">Third-Party Event Notice</h3>
      <p className="text-sm leading-relaxed text-muted-foreground">{EVENT_THIRD_PARTY_NOTICE}</p>
    </div>

    {/* Event Calendar / Listings */}
    <div className={cardCls}>
      <h3 className="font-semibold text-foreground mb-2">Event Calendar / Listings</h3>
      <div className="space-y-2.5 text-sm leading-relaxed text-muted-foreground">
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
      </div>
      <Link
        to="/terms"
        className="mt-3 inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:gap-2 transition-all"
      >
        Terms of Use <ArrowRight className="h-4 w-4" />
      </Link>
    </div>
  </div>
);

export default EventDisclaimer;
