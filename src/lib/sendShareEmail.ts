// Sends a branded, site-styled HTML share email (with an inline thumbnail) via
// the /api/share-email serverless function (Resend). Used by ShareGate's "Email"
// option so the recipient gets a designed email — image, details, and a button —
// instead of a plain mailto: compose window.
//
// Non-throwing: returns false on any failure so the share UX never breaks.

import { getRecaptchaToken } from "@/lib/recaptcha";

export interface ShareEmailPayload {
  /** Recipient address — a friend's email, or the sender's own for self-sends. */
  to: string;
  /** Recipient's first name (used for the greeting). */
  recipientName?: string;
  /** Sender — required so every send is attributable. */
  senderEmail: string;
  senderName?: string;
  title: string;
  description?: string;
  meta?: string;
  /** Absolute thumbnail URL (rendered inline in the email). */
  imageUrl?: string;
  /** Absolute page URL the CTA button links to. */
  url: string;
  /** "Saturday, SEP 19, 2026 · 11a - 4p". Presence of this switches the email to
   *  the labelled event layout (Event: / Date/Time: / Event details:). */
  eventDateTime?: string;
  /** CTA button text, without the arrow. Defaults to "Read more". */
  ctaLabel?: string;
  /** Optional legal disclaimer rendered in the email footer (replaces the
   *  generic informational line). */
  disclaimer?: string;
}

export async function sendShareEmail(payload: ShareEmailPayload): Promise<boolean> {
  try {
    const recaptchaToken = await getRecaptchaToken("share_email");
    const res = await fetch("/api/share-email", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...payload, recaptchaToken }),
    });
    return res.ok;
  } catch {
    return false;
  }
}
