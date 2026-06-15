// Posts a form submission to the secure /api/lead proxy, which upserts the
// contact into GoHighLevel with form-specific tags. The GHL key lives only on
// the server — never in the browser bundle.
//
// Non-blocking by design: callers still confirm success to the user even if the
// network call fails, so a backend hiccup never blocks the form UX.

import { getRecaptchaToken } from "@/lib/recaptcha";

export type LeadFormType =
  | "homepage-contact"
  | "contact-us"
  | "newsletter"
  | "list-event"
  | "post-job"
  | "event-alerts"
  | "career-alerts"
  | "job-apply"
  | "evan-chat"
  | "calculator-share"
  | "calculator-unlock"
  | "photo-share"
  | "article-share"
  | "incentive-share"
  | "event-share"
  | "event-register"
  | "event-calendar"
  | "job-share";

export async function submitLead(
  formType: LeadFormType,
  data: Record<string, unknown>,
): Promise<boolean> {
  try {
    // Invisible reCAPTCHA v3 — attached to every lead so the server can score it.
    const recaptchaToken = await getRecaptchaToken(formType.replace(/-/g, "_"));
    const res = await fetch("/api/lead", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ formType, recaptchaToken, ...data }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
