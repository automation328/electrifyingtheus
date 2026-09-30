// The marketplace's third-party notice: a short paragraph that is always on
// screen, plus the full terms behind a disclosure.
//
// Shaped after EventDisclaimer, for the same reason it exists — the cars, like
// the events, belong to somebody else. The short notice stays open because a
// visitor deciding whether to drive across town should not have to expand
// anything to learn that we have not seen the car.

import { ShieldAlert } from "lucide-react";
import {
  Accordion, AccordionItem, AccordionTrigger, AccordionContent,
} from "@/components/ui/accordion";
import {
  MARKETPLACE_THIRD_PARTY_NOTICE, MARKETPLACE_LISTING_DISCLAIMER,
} from "@/lib/disclaimers";

const MarketplaceDisclaimer = ({ className = "" }: { className?: string }) => (
  <section className={`rounded-2xl border border-border bg-card px-5 py-4 md:px-6 ${className}`}>
    <div className="flex items-start gap-3">
      <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
        <ShieldAlert className="h-[18px] w-[18px]" aria-hidden />
      </span>
      <div className="min-w-0">
        <h2 className="font-semibold text-foreground">Third-party listings — please verify</h2>
        <p className="mt-1 text-xs leading-relaxed text-muted-foreground">
          {MARKETPLACE_THIRD_PARTY_NOTICE}
        </p>

        <Accordion type="single" collapsible className="mt-1">
          <AccordionItem value="full" className="border-b-0">
            <AccordionTrigger className="py-2 text-xs font-semibold text-foreground hover:no-underline">
              Read the full listing disclaimer
            </AccordionTrigger>
            <AccordionContent className="space-y-3 pb-2 text-[11px] leading-relaxed text-muted-foreground">
              {MARKETPLACE_LISTING_DISCLAIMER.map((paragraph) => (
                <p key={paragraph.slice(0, 40)}>{paragraph}</p>
              ))}
            </AccordionContent>
          </AccordionItem>
        </Accordion>
      </div>
    </div>
  </section>
);

export default MarketplaceDisclaimer;
