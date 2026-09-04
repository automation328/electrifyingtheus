// The CTA button label on a share email, chosen by what is being shared.
//
// Every share surface routes through ShareGate → ShareResultDialog →
// /api/share-email, and the button is the one thing the recipient is meant to
// press. A generic "Read more" on a job posting, a rebate, or a charging map
// tells them nothing about where the button goes, so the label is derived from
// the share's lead tag instead: an article says "Read Article", an event says
// "Events Details", a photo says "View Photo".
//
// The server keeps its own "Read more" fallback for any caller that sends no
// label at all; this map is what makes the on-site shares specific.

import type { LeadFormType } from "@/lib/submitLead";

/** Used when a surface has no entry below (and by the server, as a last resort). */
export const DEFAULT_SHARE_CTA = "Read More";

const CTA_BY_FORM_TYPE: Partial<Record<LeadFormType, string>> = {
  "article-share": "Read Article",
  // Kept as the approved event template renders it.
  "event-share": "Events Details",
  "photo-share": "View Photo",
  "job-share": "View Job",
  "incentive-share": "View Incentive",
  "charger-share": "View Charging Map",
  "calculator-share": "See Full Results",
};

/**
 * The share email's button text for a surface, without the trailing arrow
 * (the email template appends "→").
 *
 * `override` wins when a page needs something more specific than its tag —
 * e.g. an event card that wants the event layout regardless of its form type.
 */
export function shareCtaLabel(formType: LeadFormType, override?: string): string {
  return override?.trim() || CTA_BY_FORM_TYPE[formType] || DEFAULT_SHARE_CTA;
}
