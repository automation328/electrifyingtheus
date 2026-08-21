// Local record of every form submission (see supabase/migrations/0015).
//
// api/lead.ts is the single funnel for every form on the site (~20 formTypes),
// but it has always been a pure proxy to GoHighLevel — nothing was kept here,
// so the CMS had nothing to show. This helper is the missing write.
//
// Underscore-prefixed, so Vercel treats it as a shared module rather than a
// Serverless Function: it costs none of the 12 Hobby slots (11 are in use).
//
// TWO RULES THIS FILE EXISTS TO ENFORCE:
//
//  1. NEVER BLOCK THE VISITOR. The insert is best-effort and cannot throw. If
//     Supabase is unset, slow or down, the form still succeeds and the lead
//     still reaches the CRM — exactly the posture api/track.ts takes for
//     analytics. A submission we failed to log is a gap in a report; a form
//     that returned an error is a lost customer.
//
//  2. NEVER STORE WHAT WE WERE NOT EXPECTING. api/lead.ts destructures
//     `...rest` and writes every unknown client-supplied key straight into the
//     GoHighLevel note. Copying that into a database would turn one bad habit
//     into a permanent store of whatever anyone chose to POST. So the payload
//     here is built from an explicit allow-list: unknown keys are dropped, and
//     every value is coerced to a trimmed, length-capped string.

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

function db(): SupabaseClient | null {
  const url = process.env.VITE_SUPABASE_URL || process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) return null; // no-op until the service role key is set
  return createClient(url, key, { auth: { persistSession: false } });
}

/** Extras worth keeping, beyond the core columns. Anything not listed is
 *  dropped — that is the point of the list. Add a key here when a form starts
 *  sending a field the CMS should show. */
const EXTRA_KEYS = new Set([
  // The person's own details, beyond the core columns. ContactForm, PostAJob,
  // the Footer newsletter and ListYourEvent all collect these, and api/lead.ts
  // already forwards them to the GHL note — so dropping them here would lose
  // information the CRM keeps.
  "title", "department", "industry",
  // share flows
  "senderName", "senderEmail", "senderPhone", "shareUrl", "shareChannel",
  // calculator
  "vehicleSummary", "savingsSummary",
  // EVan chat
  "transcript", "sessionId",
  // jobs — PostAJob posts jobTitle/jobLink/jobType; Careers adds location on apply
  "jobTitle", "jobLink", "jobType", "location", "resumeUrl", "marketingConsent",
  // events — the full /list-your-event set, so the Form Submissions viewer
  // shows the whole thing rather than a title with no date, time or venue.
  "eventTitle", "eventDate", "eventLocation",
  "eventStartDate", "eventEndDate", "eventTime", "eventVenue", "eventFormat",
  "eventWebsite", "eventDescription",
  // attribution
  "utm_source", "utm_medium", "utm_campaign", "pageUrl",
]);

/** Longer caps for the few fields that are legitimately long. */
const CAP: Record<string, number> = { transcript: 20000, message: 8000 };

const str = (v: unknown, max = 400) =>
  typeof v === "string" || typeof v === "number" ? String(v).trim().slice(0, max) : "";

const orNull = (s: string) => (s ? s : null);

const header = (req: { headers?: Record<string, unknown> }, k: string) => {
  const v = req.headers?.[k];
  return typeof v === "string" ? v : Array.isArray(v) ? String(v[0] ?? "") : "";
};

export interface RecordSubmissionArgs {
  req: { headers?: Record<string, unknown> };
  body: Record<string, unknown>;
  formType: string;
  formLabel: string;
  /** Whether the GoHighLevel upsert succeeded for this submission. */
  crmDelivery: "sent" | "failed" | "unknown";
  ghlContactId?: string;
}

/**
 * Write one submission. Resolves to true when a row was stored, false in every
 * other case — including when Supabase is not configured. NEVER throws, and
 * never rejects: callers can fire it inside Promise.allSettled and ignore it.
 */
export async function recordSubmission(a: RecordSubmissionArgs): Promise<boolean> {
  try {
    const client = db();
    if (!client) return false;
    const b = a.body || {};

    // Per-form extras, allow-listed. Unknown keys never reach the database.
    const payload: Record<string, string> = {};
    for (const k of EXTRA_KEYS) {
      const v = str(b[k], CAP[k] ?? 400);
      if (v) payload[k] = v;
    }

    const email = str(b.email, 160).toLowerCase();

    const row = {
      form_type: str(a.formType, 60) || "unknown",
      form_label: orNull(str(a.formLabel, 120)),
      first_name: orNull(str(b.firstName, 80)),
      last_name: orNull(str(b.lastName, 80)),
      email: orNull(email),
      // Forms send either `phone` or `mobile`; keep whichever arrived.
      phone: orNull(str(b.phone, 40) || str(b.mobile, 40)),
      company: orNull(str(b.company, 160)),
      city: orNull(str(b.city, 120)),
      zip: orNull(str(b.zip, 20)),
      // Some forms label the same box `topic` rather than `subject`.
      subject: orNull(str(b.subject, 300) || str(b.topic, 300)),
      message: orNull(str(b.message, CAP.message)),
      payload,
      page_path: orNull(str(b.pageUrl, 500) || header(a.req, "referer").slice(0, 500)),
      referrer: orNull(str(b.referrer, 500)),
      ip: orNull(header(a.req, "x-forwarded-for").split(",")[0].trim().slice(0, 60)),
      geo_city: orNull(safeDecode(header(a.req, "x-vercel-ip-city")).slice(0, 120)),
      geo_region: orNull(header(a.req, "x-vercel-ip-country-region").slice(0, 60)),
      geo_country: orNull(header(a.req, "x-vercel-ip-country").slice(0, 60)),
      user_agent: orNull(header(a.req, "user-agent").slice(0, 400)),
      ghl_contact_id: orNull(str(a.ghlContactId, 80)),
      crm_delivery: a.crmDelivery,
    };

    const { error } = await client.from("site_form_submissions").insert(row);
    return !error;
  } catch {
    // Logging a submission must never be able to fail the submission.
    return false;
  }
}

function safeDecode(s: string): string {
  try { return decodeURIComponent(s); } catch { return s; }
}
