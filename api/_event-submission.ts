// Turning a /list-your-event submission into a reviewable draft event.
//
// Underscore-prefixed, so Vercel treats this as a module rather than a
// Serverless Function: it costs none of the 12 Hobby slots. That budget is why
// the review endpoint lives inside api/admin.ts instead of getting a file of
// its own — 11 of the 12 are already spoken for.
//
// THE FLOW:
//   1. Someone submits the form. api/lead.ts calls createDraftEvent, which
//      writes a DRAFT site_events row plus a site_event_submissions row holding
//      the organiser's contact details (0025 — deliberately a separate table,
//      because site_events grants public SELECT on every column of a published
//      row).
//   2. Slack gets one message with the event details and two link buttons.
//   3. Approve publishes the draft; Reject archives it. Either way the editor
//      can also do it by hand in /admin/content/events, where a draft shows up
//      like any other.
//   4. Publishing emails the organiser their live link — see _ghl.ts.
//
// WHY LINK BUTTONS AND NOT A SLACK APP. Real in-Slack buttons need an app with
// interactivity enabled, a signing secret and a request URL, all of which is
// workspace setup nobody can do from here. A Block Kit `url` button works with
// the plain incoming webhook that is already configured, so this needs no new
// Slack configuration at all. The trade is that the link IS the credential:
// anyone who can see the channel can click it. That is acceptable for a private
// internal channel and stated plainly in reviewTokenNote below.

import { createHmac, timingSafeEqual } from "node:crypto";
import type { SupabaseClient } from "@supabase/supabase-js";

/** How long an Approve/Reject link stays valid. Long enough to survive a
 *  weekend, short enough that a link scrolled far up a channel is inert. */
const LINK_TTL_DAYS = 14;

export interface EventSubmission {
  eventTitle: string;
  eventLocation: string;
  eventStartDate: string;   // YYYY-MM-DD — the form uses <input type="date">
  eventEndDate: string;     // YYYY-MM-DD or ""
  eventTime: string;
  eventDescription: string;
  eventWebsite: string;
  eventVenue: string;
  eventFormat: string;
  submitterName: string;
  submitterEmail: string;
  submitterPhone: string;
  submitterCompany: string;
  ghlContactId?: string;
}

/** The secret behind the Approve/Reject links. No fallback: without it the
 *  links would be forgeable by anyone who read this file, so we render no
 *  buttons at all rather than fake ones. */
function reviewSecret(): string | null {
  return process.env.EVENT_REVIEW_SECRET || null;
}

/** sha256 HMAC over the exact triple the link acts on. Binding the ACTION into
 *  the signature is the point — otherwise an Approve link could be edited into
 *  a Reject one, or vice versa. */
export function signReview(id: string, action: string, exp: number): string | null {
  const secret = reviewSecret();
  if (!secret) return null;
  return createHmac("sha256", secret).update(`${id}.${action}.${exp}`).digest("hex").slice(0, 40);
}

/** Constant-time verify. Returns a reason rather than a bare false so the
 *  confirmation page can say "this link expired" instead of "invalid", which is
 *  the difference between a colleague retrying and a colleague giving up. */
export function verifyReview(
  id: string,
  action: string,
  exp: number,
  sig: string,
): { ok: true } | { ok: false; reason: "unconfigured" | "expired" | "bad_signature" } {
  if (!reviewSecret()) return { ok: false, reason: "unconfigured" };
  if (!Number.isFinite(exp) || Date.now() > exp) return { ok: false, reason: "expired" };
  const want = signReview(id, action, exp);
  if (!want) return { ok: false, reason: "unconfigured" };
  const a = Buffer.from(want);
  const b = Buffer.from(String(sig || ""));
  // timingSafeEqual throws on a length mismatch, which is itself a leak-free
  // rejection — but it has to be caught rather than allowed to 500.
  if (a.length !== b.length) return { ok: false, reason: "bad_signature" };
  return timingSafeEqual(a, b) ? { ok: true } : { ok: false, reason: "bad_signature" };
}

const MONTH_ABBR = ["jan","feb","mar","apr","may","jun","jul","aug","sep","oct","nov","dec"];

/**
 * The public path of a submitted event — the address the approval email sends
 * the organiser to.
 *
 * This MIRRORS slugify + fallbackSlug in src/data/events.ts and src/lib/
 * content.ts, and the two have to stay in step: get it wrong and the email
 * links a real person to a 404. A submitted event never matches a curated one,
 * so it always takes the fallbackSlug branch of mergeEvents — which is the only
 * reason this can be reproduced here at all.
 */
export function eventPath(title: string, eventDate: string): string {
  const slug = String(title || "")
    .toLowerCase()
    .normalize("NFKD")
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/[\s_-]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 60)
    .replace(/-+$/g, "");
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(eventDate || "");
  if (!m) return `/events/${slug}`;
  const mon = MONTH_ABBR[Number(m[2]) - 1] ?? m[2];
  return `/events/${slug}-${mon}-${m[3]}-${m[1]}`;
}

/** "2026-09-19" → "SEP 19, 2026", for the Slack summary only. The database
 *  keeps the ISO string. */
function prettyDate(iso: string): string {
  const m = /^(\d{4})-(\d{2})-(\d{2})$/.exec(iso || "");
  if (!m) return iso || "—";
  const MONTHS = ["JAN","FEB","MAR","APR","MAY","JUN","JUL","AUG","SEP","OCT","NOV","DEC"];
  return `${MONTHS[Number(m[2]) - 1] ?? m[2]} ${m[3]}, ${m[1]}`;
}

/**
 * Write the draft event and the contact row behind it.
 *
 * Returns the new event id, or null if anything went wrong. NEVER THROWS: a
 * failure here must not turn into a 500 on the form. The submission has already
 * reached GoHighLevel and site_form_submissions by this point, so the organiser
 * is not lost even when this half fails — they just have to be entered by hand.
 */
export async function createDraftEvent(
  db: SupabaseClient,
  s: EventSubmission,
): Promise<string | null> {
  try {
    // A date is the one field the events table cannot do without — event_date
    // is NOT NULL and drives sorting, the slug and isActive. Without a valid
    // one there is nothing coherent to insert.
    if (!/^\d{4}-\d{2}-\d{2}$/.test(s.eventStartDate)) return null;
    const title = (s.eventTitle || "").trim();
    if (!title) return null;

    const endDate = /^\d{4}-\d{2}-\d{2}$/.test(s.eventEndDate) && s.eventEndDate > s.eventStartDate
      ? s.eventEndDate
      : null;

    // Venue and street address in one line, matching how every other row in the
    // table reads (see 0019) — the CMS shows this under the title.
    const location = [s.eventVenue, s.eventLocation].map((x) => (x || "").trim()).filter(Boolean).join(", ");

    const { data, error } = await db
      .from("site_events")
      .insert({
        event_date: s.eventStartDate,
        end_date: endDate,
        title,
        // Format is the closest thing the form collects to our `type`, and a
        // Virtual event should not be labelled the same as a car show.
        type: s.eventFormat === "Virtual" ? "Webinar" : "Event",
        location,
        region: (s.eventLocation || "").trim(),
        time: (s.eventTime || "").trim(),
        description: (s.eventDescription || "").trim(),
        register_url: (s.eventWebsite || "").trim() || null,
        image: null,
        featured: false,
        // Someone else's event, and unreviewed at that — it has no business on
        // the homepage carousel even after an editor publishes it (0018).
        hero_hidden: true,
        hidden: false,
        // THE POINT OF ALL THIS. A draft is invisible to the site (every public
        // fetch filters status = 'published') and visible in the CMS Drafts tab.
        status: "draft",
      })
      .select("id")
      .single();

    if (error || !data?.id) return null;
    const eventId = String(data.id);

    // Contact details go in the locked-down table, never on site_events.
    await db.from("site_event_submissions").insert({
      event_id: eventId,
      submitter_name: (s.submitterName || "").trim(),
      submitter_email: (s.submitterEmail || "").trim(),
      submitter_phone: (s.submitterPhone || "").trim(),
      submitter_company: (s.submitterCompany || "").trim(),
      ghl_contact_id: s.ghlContactId || null,
    });

    return eventId;
  } catch {
    return null;
  }
}

/**
 * The Slack message: event details, who sent it, and two link buttons.
 *
 * Returns null when SLACK_WEBHOOK_URL is unset, so the caller can skip the post
 * entirely rather than build a payload nobody will read.
 */
export function buildSlackReview(
  eventId: string,
  s: EventSubmission,
  siteUrl: string,
): Record<string, unknown> | null {
  const exp = Date.now() + LINK_TTL_DAYS * 24 * 60 * 60 * 1000;
  const approveSig = signReview(eventId, "approve", exp);
  const rejectSig = signReview(eventId, "reject", exp);

  const trim = (v: string, n: number) => {
    const t = (v || "").trim();
    return t.length > n ? `${t.slice(0, n)}…` : t;
  };

  const dates = s.eventEndDate && s.eventEndDate !== s.eventStartDate
    ? `${prettyDate(s.eventStartDate)} – ${prettyDate(s.eventEndDate)}`
    : prettyDate(s.eventStartDate);

  const detail = [
    `*Event:* ${trim(s.eventTitle, 200) || "—"}`,
    `*When:* ${dates}${s.eventTime ? ` · ${trim(s.eventTime, 60)}` : ""}`,
    `*Where:* ${trim([s.eventVenue, s.eventLocation].filter(Boolean).join(", "), 200) || "—"}`,
    s.eventFormat && `*Format:* ${s.eventFormat}`,
    s.eventWebsite && `*Link:* ${trim(s.eventWebsite, 200)}`,
    `*Submitted by:* ${trim(s.submitterName, 80) || "—"}${s.submitterCompany ? ` (${trim(s.submitterCompany, 80)})` : ""}`,
    s.submitterEmail && `*Email:* ${trim(s.submitterEmail, 120)}`,
    s.submitterPhone && `*Phone:* ${trim(s.submitterPhone, 40)}`,
  ].filter(Boolean).join("\n");

  // Who to ping. MUST be Slack member IDs in <@Uxxxx> form — a plain "@carlos"
  // is just text and notifies nobody, which is the failure that looks like it
  // worked. Find an ID in Slack: profile → More (⋯) → Copy member ID.
  //   SLACK_REVIEW_MENTIONS="<@U01ABC> <@U02DEF> <@U03GHI>"
  // Unset means no mention line rather than a broken one.
  const mentions = (process.env.SLACK_REVIEW_MENTIONS || "").trim();

  const reviewUrl = `${siteUrl}/admin/content/events?edit=${eventId}`;

  const blocks: Record<string, unknown>[] = [
    { type: "header", text: { type: "plain_text", text: "New event submission", emoji: true } },
  ];
  if (mentions) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `${mentions} — a new event needs review.` },
    });
  }
  blocks.push(
    { type: "section", text: { type: "mrkdwn", text: detail } },
    // The draft itself, as a link as well as a button: a URL can be copied,
    // forwarded and opened on a phone, and it survives being quoted in a reply.
    { type: "section", text: { type: "mrkdwn", text: `*Draft event:* <${reviewUrl}|Open it in the CMS>` } },
  );

  if (s.eventDescription) {
    blocks.push({
      type: "section",
      text: { type: "mrkdwn", text: `*Description:*\n${trim(s.eventDescription, 900)}` },
    });
  }

  // Reviewing in the CMS is always offered. The Approve/Reject buttons only
  // appear when EVENT_REVIEW_SECRET is set — an unsigned link would be a link
  // anyone could forge, so the honest thing is to show no button at all and
  // leave the CMS as the way in.
  const elements: Record<string, unknown>[] = [];
  if (approveSig && rejectSig) {
    elements.push(
      {
        type: "button",
        style: "primary",
        text: { type: "plain_text", text: "Approve & publish", emoji: true },
        url: `${siteUrl}/api/admin?op=event-review&action=approve&id=${eventId}&exp=${exp}&sig=${approveSig}`,
      },
      {
        type: "button",
        style: "danger",
        text: { type: "plain_text", text: "Reject", emoji: true },
        url: `${siteUrl}/api/admin?op=event-review&action=reject&id=${eventId}&exp=${exp}&sig=${rejectSig}`,
      },
    );
  }
  elements.push({
    type: "button",
    text: { type: "plain_text", text: "Review in CMS", emoji: true },
    url: reviewUrl,
  });
  blocks.push({ type: "actions", elements });

  blocks.push({
    type: "context",
    elements: [{
      type: "mrkdwn",
      text: approveSig
        ? `Saved as a draft — it is not on the site yet. Approve links expire in ${LINK_TTL_DAYS} days.`
        : "Saved as a draft — it is not on the site yet. Set EVENT_REVIEW_SECRET to get Approve/Reject buttons here.",
    }],
  });

  return {
    // Fallback text — this is what a push/desktop notification actually shows,
    // and what a screen reader gets, because neither renders blocks. The
    // mentions belong here too or the ping has no text behind it.
    text: `${mentions ? `${mentions} ` : ""}New event submission: ${trim(s.eventTitle, 120)} — ${dates}`,
    blocks,
  };
}
