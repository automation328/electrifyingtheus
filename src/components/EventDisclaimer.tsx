// Per-event disclaimers shown on every (third-party) event detail page, as two
// collapsible accordion cards with an icon badge per section:
//  1. Third-Party Event Notice (open by default)
//  2. Event Calendar / Listings — full text + corrections mailto + Terms of Use link

import { Link } from "react-router-dom";
import { ArrowRight, ShieldAlert, CalendarDays } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { EVENT_THIRD_PARTY_NOTICE, EVENT_CALENDAR_DISCLAIMER } from "@/lib/disclaimers";

const cardCls = "rounded-2xl border border-border bg-card shadow-card px-5 md:px-6";
const triggerCls = "py-4 font-semibold text-foreground hover:no-underline";

const TriggerLabel = ({ icon: Icon, badge, title }: { icon: typeof ShieldAlert; badge: string; title: string }) => (
  <span className="flex items-center gap-3 text-left">
    <span className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${badge}`}>
      <Icon className="h-[18px] w-[18px]" />
    </span>
    {title}
  </span>
);

const EventDisclaimer = ({ className = "" }: { className?: string }) => (
  <Accordion type="multiple" defaultValue={["third-party"]} className={`space-y-4 ${className}`}>
    {/* Third-Party Event Notice */}
    <AccordionItem value="third-party" className={cardCls}>
      <AccordionTrigger className={triggerCls}>
        <TriggerLabel icon={ShieldAlert} badge="bg-amber-100 text-amber-600" title="Third-Party Event Notice" />
      </AccordionTrigger>
      <AccordionContent className="text-sm leading-relaxed text-muted-foreground">
        {EVENT_THIRD_PARTY_NOTICE}
      </AccordionContent>
    </AccordionItem>

    {/* Event Calendar / Listings */}
    <AccordionItem value="calendar" className={cardCls}>
      <AccordionTrigger className={triggerCls}>
        <TriggerLabel icon={CalendarDays} badge="bg-primary/10 text-primary" title="Event Calendar / Listings" />
      </AccordionTrigger>
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
