// Sends a branded, site-styled HTML share email (with an inline thumbnail) via
// Resend. Used by the share dialogs — the visitor (sender) enters their name +
// email, picks a recipient, and we email the shareable with full details and
// the image rendered inline (not just a link). Self-sends are also fine.
//
// Env (server-only):
//   RESEND_API_KEY   Resend API key (re_…). Required to actually send.
//   RESEND_FROM      Verified sender, e.g. "Electrifying the US <share@electrifyingtheus.com>".
//                    Falls back to Resend's onboarding address (test-only delivery).
//   RECAPTCHA_SECRET_KEY  Optional — when set, the share token is verified.

// Blank-line paragraph split for multi-paragraph disclaimers.
const SPLIT_PARAS = /\n{2,}/;
const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Electrifying the US <onboarding@resend.dev>";
const SITE = "https://electrifyingtheus.vercel.app";
// Site logo served from /public (static → reachable without the password gate).
const LOGO_URL = `${SITE}/email-logo.png`;

const BRAND = {
  blue: "#0b5fd4",
  blueDeep: "#0047a8",
  green: "#2f9e57",
  ink: "#16202c",
  muted: "#5b6b7c",
  line: "#e3e9f0",
  bg: "#eef2f7",
};

function safeJson(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}

// Trim a description down to a preview and mark that it IS one.
//
// The email is a teaser -- the button carries the reader to the full page -- but
// the old build just let the 600-char payload cap fall where it landed, so a
// share ended "...While you're here, visit our tent to" with no ellipsis and no
// full stop. That reads as a truncated send, not a preview. Cut on a word
// boundary, prefer a sentence end when one is close to the limit, and always say
// it continues.
const PREVIEW_CHARS = 300;
function preview(text: string, limit = PREVIEW_CHARS): string {
  const t = text.trim();
  if (t.length <= limit) return t;
  const window = t.slice(0, limit);
  const sentence = Math.max(window.lastIndexOf(". "), window.lastIndexOf("! "), window.lastIndexOf("? "));
  // Only honour a sentence break in the last third, else the preview loses too much.
  if (sentence > limit * 0.6) return `${window.slice(0, sentence + 1)}..`;
  const word = window.lastIndexOf(" ");
  return `${(word > 0 ? window.slice(0, word) : window).replace(/[,;:\-–—]$/, "")}...`;
}

// Minimal HTML-escape for text we drop into the template.
function esc(v: unknown): string {
  return String(v ?? "")
    .replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

// reCAPTCHA v3 — mirrors api/lead.ts. Fails OPEN when no secret is configured
// so local/dev still works.
const RECAPTCHA_MIN_SCORE = 0.5;
async function verifyRecaptcha(token: string): Promise<boolean> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return true;
  if (!token) return false;
  try {
    const params = new URLSearchParams({ secret, response: token });
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await r.json().catch(() => ({} as Record<string, unknown>));
    if (!data.success) return false;
    if (typeof data.score === "number" && data.score < RECAPTCHA_MIN_SCORE) return false;
    return true;
  } catch {
    return true; // Google outage → don't block.
  }
}

export function buildHtml(opts: {
  title: string; description?: string; meta?: string; imageUrl?: string; url: string;
  greetName?: string; sharedBy?: string; disclaimer?: string;
  eventDateTime?: string; ctaLabel?: string;
}): string {
  const { title, description, meta, imageUrl, url, greetName, sharedBy, disclaimer,
          eventDateTime, ctaLabel } = opts;
  const hero = imageUrl
    ? `<tr><td style="padding:0">
         <a href="${esc(url)}" target="_blank" style="text-decoration:none">
           <img src="${esc(imageUrl)}" alt="${esc(title)}" width="600"
                style="display:block;width:100%;max-width:600px;height:auto;border:0;border-top-left-radius:16px;border-top-right-radius:16px" />
         </a>
       </td></tr>`
    : "";
  // An event share is READ, not skimmed for a headline: the recipient wants what
  // it is, when it is, and what happens there. So events get a labelled layout --
  // "Event:", "Date/Time:", "Event details:" -- instead of the eyebrow + headline
  // treatment the other shares use.
  //
  // It also replaces the old green eyebrow, which concatenated type, venue, street
  // address, date and time into one line. Mail clients auto-linked the address
  // out of the middle of it, so the eyebrow rendered as a green sentence with a
  // blue underlined postal address embedded in it, and the date after that.
  const isEvent = !!eventDateTime;
  const greeting = greetName
    ? `<p style="margin:0 0 ${isEvent ? 2 : 14}px;font:600 15px/1.5 Arial,Helvetica,sans-serif;color:${BRAND.ink}">Hi ${esc(greetName)},</p>`
    : "";
  // Who sent it leads the message for an event -- it is the reason the recipient
  // opens a mail about a stranger's ride & drive -- rather than sitting in the
  // footer under the fine print.
  const sharedByTop = (isEvent && sharedBy)
    ? `<p style="margin:0 0 18px;font:400 15px/1.5 Arial,Helvetica,sans-serif;color:${BRAND.ink}">${esc(sharedBy)} shared this with you:</p>`
    : "";
  // When the headline contains "about " (the calculator's "saves about …" line),
  // inline the savings figure (meta) in GREEN right after "about", leaving the rest
  // — e.g. the "$1,135/year" — in the headline's normal black. Other shares keep
  // meta as a separate green eyebrow above the title.
  const aboutIdx = meta ? title.indexOf("about ") : -1;
  const inlineMeta = aboutIdx !== -1;
  const metaRow = (meta && !inlineMeta)
    ? `<p style="margin:0 0 10px;font:800 22px/1.2 Arial,Helvetica,sans-serif;letter-spacing:-.01em;color:${BRAND.green}">${esc(meta)}</p>`
    : "";
  const headlineHtml = inlineMeta
    ? `${esc(title.slice(0, aboutIdx + 6))}<span style="color:${BRAND.green}">${esc(meta)}</span> — ${esc(title.slice(aboutIdx + 6))}`
    : esc(title);
  const desc = description
    ? `<p style="margin:0 0 24px;font:400 15px/1.65 Arial,Helvetica,sans-serif;color:${BRAND.muted}">${esc(description)}</p>`
    : "";

  // Labelled event rows. The description is trimmed to a clean sentence-ish stop
  // and given an ellipsis: the button is what carries the reader to the rest, and
  // the old layout cut mid-sentence ("visit our tent to") with no ellipsis, which
  // read as a broken send rather than a preview.
  const eventBody = isEvent ? `
          <p style="margin:0 0 6px;font:800 20px/1.3 Arial,Helvetica,sans-serif;color:${BRAND.ink}">Event: ${esc(title)}</p>
          <p style="margin:0 0 18px;font:800 17px/1.4 Arial,Helvetica,sans-serif;color:${BRAND.green}">Date/Time: ${esc(eventDateTime)}</p>
          ${description ? `<p style="margin:0 0 24px;font:400 15px/1.65 Arial,Helvetica,sans-serif;color:${BRAND.ink}"><span style="font-weight:700">Event details:</span> ${esc(preview(description))}</p>` : ""}` : "";

  const headlineBlock = isEvent ? eventBody : `
          ${metaRow}
          <h1 style="margin:0 0 14px;font:800 24px/1.25 Arial,Helvetica,sans-serif;color:${BRAND.ink}">${headlineHtml}</h1>
          ${desc}`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(description || title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(11,95,212,.10)">
        <!-- Header — gradient accent strip + the real site logo and wordmark -->
        <tr><td style="background:${BRAND.blueDeep};background:linear-gradient(135deg,${BRAND.blue},${BRAND.green});height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>
        <tr><td style="background:#ffffff;padding:16px 28px;text-align:center;border-bottom:1px solid ${BRAND.line}">
          <a href="${SITE}" target="_blank" style="text-decoration:none;display:inline-block">
            <img src="${LOGO_URL}" width="56" height="56" alt="ElectrifyingTheUS.com"
                 style="display:inline-block;width:56px;height:56px;border:0;vertical-align:middle" />
            <span style="font:800 20px/1 Arial,Helvetica,sans-serif;color:${BRAND.blue};letter-spacing:-.01em;vertical-align:middle;margin-left:10px">ElectrifyingTheUS.com</span>
          </a>
        </td></tr>
        ${hero}
        <!-- Body -->
        <tr><td style="padding:28px 28px 8px">
          ${greeting}
          ${sharedByTop}
          ${headlineBlock}
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td
             style="border-radius:12px;background:${BRAND.blue}">
            <a href="${esc(url)}" target="_blank"
               style="display:inline-block;padding:13px 26px;font:700 15px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;border-radius:12px">
               ${esc(ctaLabel || "Read more")} &rarr;</a>
          </td></tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 28px 28px">
          ${!isEvent && sharedBy ? `<p style="margin:0 0 8px;font:600 13px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.ink}">${esc(sharedBy)} shared this with you.</p>` : ""}
          <!-- The "shared from" line is no longer EITHER/OR with the disclaimer. It
               says who the mail is from, which a recipient needs most on the sends
               that also carry legal fine print -- and those were exactly the ones
               that used to drop it. -->
          <p style="margin:0 0 14px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.muted}">
            Shared from <a href="${SITE}" style="color:${BRAND.blue};text-decoration:none">ElectrifyingTheUS.com</a> &mdash;
            your guide to clean transportation and clean energy, EV info, rebates &amp; Incentives, news, events, and more
          </p>
          ${disclaimer
            ? disclaimer.split(SPLIT_PARAS).map((para, i) =>
                `<p style="margin:0 0 8px;font:400 11px/1.55 Arial,Helvetica,sans-serif;color:#9aa7b4">${
                  i === 0 && isEvent
                    ? `<span style="font-weight:700;color:${BRAND.muted}">Disclaimer/Third Party Event:</span> `
                    : ""
                }${esc(para.trim())}</p>`,
              ).join("")
            : `<p style="margin:0;font:400 11px/1.5 Arial,Helvetica,sans-serif;color:#9aa7b4">
            You received this because you chose to share this content. Informational only; not financial, legal, or tax advice.
          </p>`}
          <p style="margin:8px 0 0;font:400 11px/1.55 Arial,Helvetica,sans-serif;color:#9aa7b4">
            <a href="${SITE}/privacy-policy" style="color:#9aa7b4;text-decoration:underline">Privacy Policy</a>
            &amp; <a href="${SITE}/terms" style="color:#9aa7b4;text-decoration:underline">Terms &amp; Conditions</a>
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

export function buildText(opts: {
  title: string; description?: string; meta?: string; url: string;
  eventDateTime?: string; ctaLabel?: string; sharedBy?: string;
}): string {
  // The text/plain part is what a plain-text client and many screen readers
  // actually render, so it carries the same labels as the HTML rather than a
  // bare title followed by an undifferentiated blob.
  const cta = `${opts.ctaLabel || "Read more"}: ${opts.url}`;
  if (opts.eventDateTime) {
    return [
      opts.sharedBy ? `${opts.sharedBy} shared this with you:` : "",
      `Event: ${opts.title}`,
      `Date/Time: ${opts.eventDateTime}`,
      opts.description ? `Event details: ${preview(opts.description)}` : "",
      cta,
    ].filter(Boolean).join("\n\n");
  }
  return [opts.title, opts.meta, opts.description, cta].filter(Boolean).join("\n\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Email sending is not configured" }); return; }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
  const {
    to = "", recipientName = "", senderEmail = "", senderName = "",
    title = "", description = "", meta = "", imageUrl = "", url = "",
    disclaimer = "", recaptchaToken = "", eventDateTime = "", ctaLabel = "",
  } = body as Record<string, string>;

  if (!(await verifyRecaptcha(recaptchaToken))) {
    res.status(400).json({ error: "Verification failed" }); return;
  }

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
  // Send-to-friend is allowed; the sender's address is still required so every
  // send is attributable (that + reCAPTCHA is the anti-abuse stance).
  if (!isEmail(to) || !isEmail(senderEmail)) {
    res.status(400).json({ error: "A valid recipient and sender email are required" }); return;
  }
  if (!title || !url) { res.status(400).json({ error: "Missing share content" }); return; }

  // Length caps + scheme checks keep the payload sane.
  const cap = (s: string, n: number) => String(s ?? "").slice(0, n);
  const safeTitle = cap(title, 200);
  const safeDescription = cap(description, 600);
  const safeMeta = cap(meta, 200);
  const safeDisclaimer = cap(disclaimer, 1200);
  const safeDateTime = cap(eventDateTime, 120);
  const safeCta = cap(ctaLabel, 40);
  const safeUrl = cap(url, 2048);
  const safeImage = cap(imageUrl, 2048);
  if (!/^https?:\/\//i.test(safeUrl)) { res.status(400).json({ error: "Invalid link" }); return; }
  const img = /^https?:\/\//i.test(safeImage) ? safeImage : "";

  const isSelfSend = to.trim().toLowerCase() === senderEmail.trim().toLowerCase();
  const sharedBy = !isSelfSend && senderName ? `${cap(senderName, 80)} (${senderEmail.trim()})` : "";
  const greetName = cap(recipientName, 80) || (isSelfSend ? cap(senderName, 80) : "");

  const html = buildHtml({
    title: safeTitle, description: safeDescription, meta: safeMeta,
    imageUrl: img, url: safeUrl, greetName, sharedBy, disclaimer: safeDisclaimer,
    eventDateTime: safeDateTime, ctaLabel: safeCta,
  });
  const text = buildText({
    title: safeTitle, description: safeDescription, meta: safeMeta, url: safeUrl,
    eventDateTime: safeDateTime, ctaLabel: safeCta, sharedBy,
  });

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [to.trim()],
        subject: safeTitle,
        html,
        text,
      }),
    });
    if (!r.ok) {
      const detail = await r.text().catch(() => "");
      res.status(502).json({ error: "Send failed", detail: detail.slice(0, 300) });
      return;
    }
    res.status(200).json({ ok: true });
  } catch {
    res.status(502).json({ error: "Send failed" });
  }
}
