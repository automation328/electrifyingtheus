// Per-event "Third-Party Event Notice" — rendered on every event detail page so
// visitors know ETUS lists third-party events but doesn't host or endorse them.

import { Info } from "lucide-react";
import { EVENT_THIRD_PARTY_NOTICE } from "@/lib/disclaimers";

const EventDisclaimer = ({ className = "" }: { className?: string }) => (
  <div className={`rounded-2xl border border-border bg-muted/40 p-4 md:p-5 ${className}`}>
    <p className="flex gap-2.5 text-xs leading-relaxed text-muted-foreground">
      <Info className="w-4 h-4 mt-0.5 shrink-0" aria-hidden />
      <span>
        <span className="font-semibold text-foreground">Third-Party Event Notice:</span>{" "}
        {EVENT_THIRD_PARTY_NOTICE}
      </span>
    </p>
  </div>
);

export default EventDisclaimer;
