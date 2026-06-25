// Per-event disclaimers shown on every (third-party) event detail page, as two
// collapsible accordion cards (collapsed by default):
//  1. Third-Party Event Notice
//  2. Event Calendar / Listings — full text + corrections mailto + Terms of Use link

import { Link } from "react-router-dom";
import { ArrowRight } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { EVENT_THIRD_PARTY_NOTICE, EVENT_CALENDAR_DISCLAIMER } from "@/lib/disclaimers";

const cardCls = "rounded-2xl border border-border bg-card shadow-card px-5 md:px-6";
const triggerCls = "font-semibold text-foreground hover:no-underline";

const EventDisclaimer = ({ className = "" }: { className?: string }) => (
  <Accordion type="multiple" defaultValue={["third-party"]} className={`space-y-4 ${className}`}>
    {/* Third-Party Event Notice */}
    <AccordionItem value="third-party" className={cardCls}>
      <AccordionTrigger className={triggerCls}>Third-Party Event Notice</AccordionTrigger>
      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
        {EVENT_THIRD_PARTY_NOTICE}
      </AccordionContent>
    </AccordionItem>

    {/* Event Calendar / Listings */}
    <AccordionItem value="calendar" className={cardCls}>
      <AccordionTrigger className={triggerCls}>Event Calendar / Listings</AccordionTrigger>
      <AccordionContent>
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
          <Link
            to="/terms"
            className="mt-1 inline-flex items-center gap-1.5 font-semibold text-primary hover:gap-2 transition-all"
          >
            Terms of Use <ArrowRight className="h-4 w-4" />
          </Link>
        </div>
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default EventDisclaimer;
