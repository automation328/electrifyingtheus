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
// Test-only. onboarding@resend.dev is a domain shared with every other Resend
// account, so mail from it is filtered hard — if a real send lands here, the
// environment is misconfigured and the recipient will likely never see it.
const DEFAULT_FROM = "Electrifying the US <onboarding@resend.dev>";
// The apex domain, NOT the vercel.app host. Every link in a share email — logo,
// CTA, privacy policy, terms — resolves against this, and a mail whose From is
// @electrifyingtheus.com while its links point at a different domain is a
// textbook spam signal. The apex serves all of these paths.
const SITE = "https://electrifyingtheus.com";
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

// Last-resort disclaimer, for a caller that sends none. Every on-site surface
// forwards one (its own, or the standing SHARE_DISCLAIMER from lib/disclaimers),
// so the template's disclaimer slot is never empty — an empty slot is how a
// share used to reach an inbox with no informational notice at all.
const FALLBACK_DISCLAIMER =
  "This content is provided for general informational purposes only and is subject to change without notice. "
  + "ElectrifyingTheUS.com makes no representations or warranties as to its accuracy, completeness, or timeliness, "
  + "and it does not constitute financial, legal, or tax advice.";

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

// Who the email says shared it: the sender's NAME, never their address.
//
// The address is still required and validated on every send — that plus
// reCAPTCHA is what keeps a send attributable — but attribution is a server-side
// property. Printing "Name (name@example.com)" in the body put a raw mailbox in
// front of the recipient without giving them anything to act on.
//
// A self-send has no "shared by" line at all: the recipient is the sender.
export function senderLabel(senderName: string, to: string, senderEmail: string): string {
  const isSelfSend = to.trim().toLowerCase() === senderEmail.trim().toLowerCase();
  if (isSelfSend || !senderName.trim()) return "";
  return senderName.trim().slice(0, 80);
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
  const { title, description, meta, imageUrl, url, greetName, sharedBy,
          disclaimer, eventDateTime, ctaLabel } = opts;
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
  // Who sent it leads the message on EVERY share, not just events -- it is the
  // reason the recipient opens a mail about a stranger's ride & drive, a rebate
  // or an article, rather than something to find in the footer under the fine
  // print. A self-send has no attribution line (the recipient IS the sender).
  const sharedByTop = sharedBy
    ? `<p style="margin:0 0 18px;font:400 15px/1.5 Arial,Helvetica,sans-serif;color:${BRAND.ink}">${esc(sharedBy)} shared this with you:</p>`
    : "";
  // The greeting always opens the mail. Without a recipient name it is still a
  // greeting -- an email that starts cold on a headline reads like a broadcast.
  const greeting =
    `<p style="margin:0 0 ${sharedByTop ? 2 : 14}px;font:600 15px/1.5 Arial,Helvetica,sans-serif;color:${BRAND.ink}">Hi ${esc(greetName || "there")},</p>`;
  // When the headline already states the savings figure ("…saves about $1,135/year
  // on fuel…"), colour that figure GREEN where it stands. Other shares keep meta as
  // a separate green eyebrow above the title.
  //
  // The inline path used to fire on the word "about" alone and splice whatever meta
  // carried in after it, so a calculator share whose meta was the multi-year total
  // rendered "saves about $9,000 saved over 5 years on fuel — $1,135/year on fuel
  // vs the Toyota RAV4" — the figure stated twice and the sentence broken by an
  // em dash. A meta that is not literally the next words of the title now falls
  // back to the eyebrow.
  const aboutIdx = meta ? title.indexOf("about ") : -1;
  const inlineMeta = aboutIdx !== -1 && title.startsWith(meta as string, aboutIdx + 6);
  const metaRow = (meta && !inlineMeta)
    ? `<p style="margin:0 0 10px;font:800 22px/1.2 Arial,Helvetica,sans-serif;letter-spacing:-.01em;color:${BRAND.green}">${esc(meta)}</p>`
    : "";
  const headlineHtml = inlineMeta
    ? `${esc(title.slice(0, aboutIdx + 6))}<span style="color:${BRAND.green}">${esc(meta)}</span>${
        esc(title.slice(aboutIdx + 6 + (meta as string).length))}`
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

  // Every send carries a labelled disclaimer block, as the approved template
  // shows: the surface's own legal copy when it sent one, otherwise the standing
  // notice. One paragraph per blank-line-separated block.
  const disclaimerParas = ((disclaimer || "").trim() || FALLBACK_DISCLAIMER).split(SPLIT_PARAS);
  const disclaimerLabel = isEvent ? "Disclaimer/Third Party Event:" : "Disclaimer:";
  const disclaimerBlock = disclaimerParas.map((para, i) =>
    `<p style="margin:0 0 ${i === disclaimerParas.length - 1 ? "0" : "8px"};font:400 11px/1.55 Arial,Helvetica,sans-serif;color:#9aa7b4">${
      i === 0 ? `<span style="font-weight:700;color:${BRAND.muted}">${disclaimerLabel}</span> ` : ""
    }${esc(para.trim())}</p>`,
  ).join("");

  const headlineBlock = isEvent ? eventBody : `
          ${metaRow}
          <h1 style="margin:0 0 14px;font:800 24px/1.25 Arial,Helvetica,sans-serif;color:${BRAND.ink}">${headlineHtml}</h1>
          ${desc}`;

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(title)}</title></head>
<body bgcolor="${BRAND.bg}" style="margin:0;padding:0;background-color:${BRAND.bg}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(description || title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" bgcolor="${BRAND.bg}" style="background-color:${BRAND.bg};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             bgcolor="#ffffff" style="width:600px;max-width:600px;background-color:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(11,95,212,.10)">
        <!-- Header — gradient accent strip + the real site logo and wordmark.
             The wordmark is TEXT, not part of the logo image, so a blocked or
             stripped image still leaves the sender identifiable.

             Every coloured block carries both a bgcolor attribute and an inline
             background-color. Some clients drop one or the other; the CTA in
             particular was white text on a background-less cell — an invisible
             button — wherever the cell background did not survive, so the colour
             sits on the link as well, with a border under it. -->
        <tr><td bgcolor="${BRAND.blueDeep}" style="background-color:${BRAND.blueDeep};background:linear-gradient(135deg,${BRAND.blue},${BRAND.green});height:6px;line-height:6px;font-size:0">&nbsp;</td></tr>
        <tr><td bgcolor="#ffffff" style="background-color:#ffffff;padding:16px 28px;text-align:center;border-bottom:1px solid ${BRAND.line}">
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
             bgcolor="${BRAND.blue}" style="border-radius:12px;background-color:${BRAND.blue}">
            <a href="${esc(url)}" target="_blank"
               style="display:inline-block;padding:13px 26px;font:700 15px/1 Arial,Helvetica,sans-serif;color:#ffffff;background-color:${BRAND.blue};border:1px solid ${BRAND.blueDeep};text-decoration:none;border-radius:12px">
               ${esc(ctaLabel || "Read more")} &rarr;</a>
          </td></tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 28px 28px">
          <!-- The "shared from" line is no longer EITHER/OR with the disclaimer. It
               says who the mail is from, which a recipient needs most on the sends
               that also carry legal fine print -- and those were exactly the ones
               that used to drop it. -->
          <p style="margin:0 0 14px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.muted}">
            Shared from <a href="${SITE}" style="color:${BRAND.blue};text-decoration:none">ElectrifyingTheUS.com</a> &mdash;
            your guide to clean transportation and clean energy, EV info, rebates &amp; Incentives, news, events, and more
          </p>
          ${disclaimerBlock}
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
  greetName?: string; eventDateTime?: string; ctaLabel?: string;
  sharedBy?: string; disclaimer?: string;
}): string {
  // The text/plain part is what a plain-text client and many screen readers
  // actually render, so it carries every element the HTML does: the greeting,
  // the attribution, the labelled body, the CTA, the disclaimer and both legal
  // links.
  const cta = `${opts.ctaLabel || "Read more"}: ${opts.url}`;
  const sender = opts.sharedBy ? `${opts.sharedBy} shared this with you:` : "";
  const opening = [`Hi ${opts.greetName || "there"},`, sender];
  const body = opts.eventDateTime
    ? [
        `Event: ${opts.title}`,
        `Date/Time: ${opts.eventDateTime}`,
        opts.description ? `Event details: ${preview(opts.description)}` : "",
      ]
    : [opts.title, opts.meta, opts.description];
  const label = opts.eventDateTime ? "Disclaimer/Third Party Event:" : "Disclaimer:";
  const footer = [
    "Shared from ElectrifyingTheUS.com \u2014 your guide to clean transportation and clean energy, "
      + "EV info, rebates & Incentives, news, events, and more",
    `${label} ${((opts.disclaimer || "").trim() || FALLBACK_DISCLAIMER).split(SPLIT_PARAS).map(p => p.trim()).join("\n\n")}`,
    `Privacy Policy: ${SITE}/privacy-policy`,
    `Terms & Conditions: ${SITE}/terms`,
  ];
  return [...opening, ...body, cta, ...footer].filter(Boolean).join("\n\n");
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
  const sharedBy = senderLabel(senderName, to, senderEmail);
  const greetName = cap(recipientName, 80) || (isSelfSend ? cap(senderName, 80) : "");

  const html = buildHtml({
    title: safeTitle, description: safeDescription, meta: safeMeta,
    imageUrl: img, url: safeUrl, greetName, sharedBy,
    disclaimer: safeDisclaimer, eventDateTime: safeDateTime, ctaLabel: safeCta,
  });
  const text = buildText({
    title: safeTitle, description: safeDescription, meta: safeMeta, url: safeUrl,
    greetName, eventDateTime: safeDateTime, ctaLabel: safeCta, sharedBy,
    disclaimer: safeDisclaimer,
  });

  const from = process.env.RESEND_FROM || DEFAULT_FROM;
  if (!process.env.RESEND_FROM) {
    // Not fatal — a dev environment without the variable should still work — but
    // this is worth seeing in the logs, because in production it means every
    // share is going out from a shared domain and landing in spam.
    console.warn("share-email: RESEND_FROM is unset; sending from the shared Resend domain");
  }
  // Gmail and Yahoo weigh an unsubscribe path even on one-to-one mail. Only
  // emitted when there is a real mailbox to point at — an invented address that
  // bounces is worse than no header at all.
  const contact = (process.env.SITE_EMAIL || "").trim();
  const unsubscribe = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(contact)
    ? `<mailto:${contact}?subject=Unsubscribe>`
    : "";

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from,
        to: [to.trim()],
        // The recipient's natural reply is to the person who shared it, not to the
        // site. This is also where the sender's address belongs — in a header the
        // mail client can act on, rather than printed in the body.
        reply_to: senderEmail.trim(),
        subject: safeTitle,
        html,
        text,
        ...(unsubscribe ? { headers: { "List-Unsubscribe": unsubscribe } } : {}),
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
