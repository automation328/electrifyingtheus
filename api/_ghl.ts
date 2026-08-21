// The one GoHighLevel call that does not belong in api/lead.ts: telling an
// organiser their submitted event is live.
//
// Underscore-prefixed, so it costs none of the 12 Hobby function slots.
//
// WHY NOT THE USUAL TAG-AND-LET-A-WORKFLOW-DO-IT PATTERN. Everything else here
// tags the contact and lets a GHL workflow send the message (api/lead.ts:6).
// That works because those emails are the same for everybody. This one is not:
// it has to carry THIS event's URL. A workflow template cannot interpolate a
// value that arrives with the trigger, so the link would have to be stashed on
// a contact custom field first — which means custom-field setup inside GHL, and
// a field that gets overwritten the moment the same organiser submits a second
// event. Sending the message directly avoids both.
//
// It still tags the contact on the way through, so an existing "event-approved"
// workflow can fire alongside if one is ever built.

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

export interface ApprovalEmailResult {
  ok: boolean;
  /** Why it failed, short enough to store in a column and read in the CMS. */
  error?: string;
}

function ghlFetch(path: string, init: Record<string, unknown>, apiKey: string) {
  return fetch(`${GHL_BASE}${path}`, {
    ...init,
    headers: {
      Authorization: `Bearer ${apiKey}`,
      Version: GHL_VERSION,
      "Content-Type": "application/json",
      Accept: "application/json",
    },
  });
}

const esc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/**
 * Email the organiser that their event is published, with the link.
 *
 * NEVER THROWS. Publishing an event must not fail because an email did not
 * send — the event is live either way, and the caller records the reason so an
 * editor can follow up by hand.
 *
 * Returns ok:false with a reason when GHL is unconfigured, so the caller can
 * tell "we tried and it broke" from "this was never switched on".
 */
export async function sendEventApprovalEmail(opts: {
  contactId?: string | null;
  toName: string;
  eventTitle: string;
  eventUrl: string;
}): Promise<ApprovalEmailResult> {
  const apiKey = process.env.GHL_API_KEY;
  if (!apiKey) return { ok: false, error: "GHL_API_KEY not set" };
  if (!opts.contactId) return { ok: false, error: "no GHL contact id on the submission" };

  const first = (opts.toName || "").trim().split(/\s+/)[0] || "there";
  const title = opts.eventTitle || "your event";

  const html = `
<p>Hi ${esc(first)},</p>
<p>Good news — <strong>${esc(title)}</strong> has been approved and is now live on
Electrifying the US.</p>
<p><a href="${esc(opts.eventUrl)}">View your event page</a></p>
<p>Anyone can now find it on our events calendar. If you spot anything that needs
correcting, just reply to this email and we'll sort it out.</p>
<p>Thanks for helping more people go electric.</p>
<p>— The Electrifying the US team</p>`.trim();

  try {
    // Tag first. It is cheap, it is the pattern the rest of the CRM integration
    // uses, and it means an "event-approved" workflow can exist later without
    // this code changing.
    await ghlFetch(`/contacts/${opts.contactId}/tags`, {
      method: "POST",
      body: JSON.stringify({ tags: ["event-approved"] }),
    }, apiKey).catch(() => { /* non-blocking — the email is what matters */ });

    const res = await ghlFetch("/conversations/messages", {
      method: "POST",
      body: JSON.stringify({
        type: "Email",
        contactId: opts.contactId,
        subject: `Your event is live: ${title}`,
        html,
      }),
    }, apiKey);

    if (!res.ok) {
      const body = await res.text().catch(() => "");
      // 401/403 here almost always means the API key lacks the conversations
      // scope rather than that the key is wrong — worth saying so, because the
      // fix is a scope change in GHL, not a new key.
      const hint = res.status === 401 || res.status === 403
        ? " (the GHL API key may lack the conversations/message scope)"
        : "";
      return { ok: false, error: `GHL ${res.status}${hint}: ${body.slice(0, 300)}` };
    }
    return { ok: true };
  } catch (e) {
    return { ok: false, error: `send failed: ${e instanceof Error ? e.message : String(e)}` };
  }
}
