// Per-event disclaimer shown on every (third-party) event detail page: a single
// collapsible accordion card with an icon badge — the Third-Party Event Notice,
// open by default.

import { ShieldAlert } from "lucide-react";
import { Accordion, AccordionItem, AccordionTrigger, AccordionContent } from "@/components/ui/accordion";
import { EVENT_THIRD_PARTY_NOTICE } from "@/lib/disclaimers";

const cardCls = "rounded-2xl border border-border bg-card shadow-card px-5 md:px-6";
const triggerCls = "py-4 font-semibold text-foreground hover:no-underline";

const EventDisclaimer = ({ className = "" }: { className?: string }) => (
  <Accordion type="multiple" defaultValue={["third-party"]} className={`space-y-4 ${className}`}>
    <AccordionItem value="third-party" className={cardCls}>
      <AccordionTrigger className={triggerCls}>
        <span className="flex items-center gap-3 text-left">
          <span className="grid h-9 w-9 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600">
            <ShieldAlert className="h-[18px] w-[18px]" />
          </span>
          Third-Party Event Notice
        </span>
      </AccordionTrigger>
      <AccordionContent className="text-[11px] leading-relaxed text-muted-foreground">
        {EVENT_THIRD_PARTY_NOTICE}
      </AccordionContent>
    </AccordionItem>
  </Accordion>
);

export default EventDisclaimer;
