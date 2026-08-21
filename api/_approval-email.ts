// "Your event is live" — the email an organiser gets when their submitted
// event is published.
//
// Underscore-prefixed, so it costs none of the 12 Hobby function slots.
//
// SENT WITH RESEND, NOT GOHIGHLEVEL. The first version used the GHL
// Conversations API, on the reasoning that every other outbound message in this
// codebase goes through GHL. That was the wrong call for two reasons: the
// Conversations endpoint needs a scope the project's API key may not carry, and
// a failure there is invisible until somebody notices an organiser was never
// told. Resend is already configured (RESEND_API_KEY / RESEND_FROM, see
// api/share-email.ts), needs no extra scope, and returns a straight yes or no.
//
// The GHL contact is still TAGGED on the way through, best-effort, so an
// "event-approved" workflow can exist later without this code changing. The tag
// failing never blocks the email — the email is the thing the organiser needs.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Electrifying the US <onboarding@resend.dev>";
const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

// Matches api/share-email.ts, so the two emails look like they come from the
// same organisation.
const BRAND = {
  blue: "#0b5fd4",
  ink: "#16202c",
  muted: "#5b6b7c",
  line: "#e3e9f0",
  bg: "#eef2f7",
};

export interface ApprovalEmailResult {
  ok: boolean;
  /** Short enough to store in a column and read in the CMS. */
  error?: string;
}

const esc = (v: unknown) =>
  String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");

function buildHtml(first: string, title: string, url: string): string {
  return `<!doctype html><html><body style="margin:0;padding:24px;background:${BRAND.bg};
 font:16px/1.6 -apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink}">
 <table role="presentation" cellpadding="0" cellspacing="0" width="100%" style="max-width:560px;margin:0 auto;
  background:#fff;border:1px solid ${BRAND.line};border-radius:14px">
  <tr><td style="padding:32px">
   <p style="margin:0 0 16px">Hi ${esc(first)},</p>
   <p style="margin:0 0 16px">Good news — <strong>${esc(title)}</strong> has been approved and is now live
    on the Electrifying the US events calendar.</p>
   <p style="margin:0 0 28px">
    <a href="${esc(url)}" style="display:inline-block;background:${BRAND.blue};color:#fff;text-decoration:none;
     font-weight:600;padding:12px 22px;border-radius:10px">View your event page</a></p>
   <p style="margin:0 0 16px;color:${BRAND.muted}">Anyone can find it on our calendar now, and the link above is
    yours to share. If anything needs correcting, just reply to this email and we'll sort it out.</p>
   <p style="margin:0;color:${BRAND.muted}">Thanks for helping more people go electric.<br>
    — The Electrifying the US team</p>
  </td></tr>
 </table>
</body></html>`;
}

/**
 * Email the organiser their live event link.
 *
 * NEVER THROWS. Publishing an event must not fail because an email did not
 * send — the event is live either way, and the caller records the reason so an
 * editor can follow up by hand.
 *
 * Distinguishes "not configured" from "tried and failed", because the fixes are
 * different and the second one is the only urgent one.
 */
export async function sendEventApprovalEmail(opts: {
  toEmail: string;
  toName: string;
  eventTitle: string;
  eventUrl: string;
  /** Only used to tag the CRM contact. The email does not depend on it. */
  ghlContactId?: string | null;
}): Promise<ApprovalEmailResult> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) return { ok: false, error: "RESEND_API_KEY not set" };

  const to = (opts.toEmail || "").trim();
  // A submission with no email is not a failure to chase — there is simply
  // nobody to write to.
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(to)) {
    return { ok: false, error: "no usable email on the submission" };
  }

  const first = (opts.toName || "").trim().split(/\s+/)[0] || "there";
  const title = opts.eventTitle || "your event";

  // Best-effort CRM tag. Deliberately not awaited into the result: an
  // "event-approved" workflow is a nice-to-have, the email is the point.
  const ghlKey = process.env.GHL_API_KEY;
  if (ghlKey && opts.ghlContactId) {
    fetch(`${GHL_BASE}/contacts/${opts.ghlContactId}/tags`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${ghlKey}`,
        Version: GHL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
      body: JSON.stringify({ tags: ["event-approved"] }),
    }).catch(() => { /* non-blocking */ });
  }

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [to],
        subject: `Your event is live: ${title}`,
        html: buildHtml(first, title, opts.eventUrl),
        // Plain-text alternative. Some clients show it, and spam filters like
        // seeing one.
        text: `Hi ${first},\n\n${title} has been approved and is now live on the `
            + `Electrifying the US events calendar.\n\n${opts.eventUrl}\n\n`
            + `If anything needs correcting, just reply to this email.\n\n`
            + `— The Electrifying the US team`,
      }),
    });
    if (!r.ok) {
      const body = await r.text().catch(() => "");
      return { ok: false, error: `Resend ${r.status}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `send failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}
