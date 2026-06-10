// Secure server-side GoHighLevel proxy (Vercel Serverless Function).
//
// The browser NEVER sees the GHL key. Every site form POSTs here with a
// `formType`; we upsert the contact into GHL with form-specific tags, then
// (best-effort) attach a note with the extra fields. Internal Slack alerts are
// handled INSIDE GHL via workflows triggered by these tags ("tag added → Slack").
//
// Required env (Vercel → Project → Settings → Environment Variables):
//   GHL_API_KEY       Private Integration Token (pit-…). Server-only secret.
//   GHL_LOCATION_ID   The GHL sub-account (location) id.
// Optional:
//   GHL_USER_ID       A GHL user id — set it to enable note attachment.

const GHL_BASE = "https://services.leadconnectorhq.com";
const GHL_VERSION = "2021-07-28";

// Per-form tags. Each form gets a shared "website-lead" tag plus its own source
// tag, so a GHL workflow can fire the right internal Slack notification.
const FORM_TAGS: Record<string, string[]> = {
  "homepage-contact": ["website-lead", "contact-form", "source:homepage-contact"],
  "contact-us":       ["website-lead", "contact-form", "source:contact-us"],
  "newsletter":       ["website-lead", "newsletter", "source:newsletter"],
  "list-event":       ["website-lead", "event-submission", "source:list-your-event"],
  "post-job":         ["website-lead", "job-submission", "source:post-a-job"],
  "event-alerts":     ["website-lead", "event-alerts", "source:event-alerts"],
  "career-alerts":    ["website-lead", "career-alerts", "source:career-alerts"],
  "job-apply":        ["website-lead", "job-application", "source:job-apply"],
  "evan-chat":        ["website-lead", "evan-chat", "chatbot-lead", "source:evan-concierge"],
  "calculator-share": ["website-lead", "calculator-share", "source:calculator-share"],
  "calculator-unlock": ["website-lead", "calculator-lead", "source:calculator-unlock"],
  "photo-share":     ["website-lead", "content-share", "photo-share", "source:photo-share"],
  "article-share":   ["website-lead", "content-share", "article-share", "source:article-share"],
  "incentive-share": ["website-lead", "content-share", "incentive-share", "source:incentive-share"],
  "event-share":     ["website-lead", "content-share", "event-share", "source:event-share"],
  "job-share":       ["website-lead", "content-share", "job-share", "source:job-share"],
};

const SOURCE_LABEL: Record<string, string> = {
  "homepage-contact": "Homepage Contact form",
  "contact-us": "Contact Us page",
  "newsletter": "Newsletter signup",
  "list-event": "List Your Event form",
  "post-job": "Post a Job form",
  "event-alerts": "Event Alerts signup",
  "career-alerts": "Career Alerts signup",
  "job-apply": "Job application (Apply click)",
  "evan-chat": "EVan concierge",
  "calculator-share": "EV Calculator share",
  "calculator-unlock": "EV Calculator (unlock results)",
  "photo-share": "Gallery photo share",
  "article-share": "Blog / News share",
  "incentive-share": "Incentive share",
  "event-share": "Event share (email)",
  "job-share": "Job share (email)",
};

const safeJson = (s: string) => { try { return JSON.parse(s); } catch { return {}; } };

// Internal Slack alert (Incoming Webhook) — posts ONE message per lead to the
// team channel with a deep link to the GHL contact. No-op if SLACK_WEBHOOK_URL
// is unset. The chatbot only notifies once the chat is done (transcript present);
// the transcript itself is NOT sent to Slack — it lives on the GHL contact.
async function notifySlack(opts: {
  formType: string; contactId?: string;
  name?: string; email?: string; phone?: string; company?: string;
  subject?: string; message?: string; transcript?: string;
}): Promise<void> {
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return;                                            // Slack disabled
  // Chatbot: only notify at session end (when the transcript is flushed).
  if (opts.formType === "evan-chat" && !opts.transcript) return;

  const label = SOURCE_LABEL[opts.formType] ?? "Electrifying the US website";
  const isChat = opts.formType === "evan-chat";
  const loc = process.env.GHL_LOCATION_ID;
  const link = opts.contactId && loc
    ? `https://app.gohighlevel.com/v2/location/${loc}/contacts/detail/${opts.contactId}`
    : "";
  const trim = (s: string, n: number) => (s.length > n ? `${s.slice(0, n)}…` : s);

  const lines = [
    isChat ? ":speech_balloon: *New EVan chatbot lead*" : `:inbox_tray: *New lead — ${label}*`,
    opts.name && `*Name:* ${opts.name}`,
    opts.email && `*Email:* ${opts.email}`,
    opts.phone && `*Phone:* ${opts.phone}`,
    opts.company && `*Company:* ${opts.company}`,
    opts.subject && `*Subject:* ${trim(opts.subject, 200)}`,
    opts.message && `*Message:* ${trim(opts.message, 600)}`,
    `*Source:* ${label}`,
    link && `*GHL contact:* <${link}|View in GoHighLevel>`,
    isChat && "_Full transcript saved to the GHL contact note._",
  ].filter(Boolean);

  try {
    await fetch(url, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
  } catch { /* non-blocking */ }
}

// reCAPTCHA v3 — verify the token + score. Returns true when verification is
// disabled (no secret set) so local/dev still works. Reject on low score/fail.
const RECAPTCHA_MIN_SCORE = 0.5;
async function verifyRecaptcha(token: string, remoteip?: string): Promise<{ ok: boolean; reason?: string }> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) return { ok: true };           // verification disabled
  if (!token) return { ok: false, reason: "missing token" };
  try {
    const params = new URLSearchParams({ secret, response: token });
    if (remoteip) params.set("remoteip", remoteip);
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = await r.json().catch(() => ({}));
    if (!data.success) return { ok: false, reason: "failed" };
    if (typeof data.score === "number" && data.score < RECAPTCHA_MIN_SCORE) {
      return { ok: false, reason: `low score ${data.score}` };
    }
    return { ok: true };
  } catch {
    // Network hiccup reaching Google — fail open so a Google outage doesn't
    // block all leads. (Flip to fail-closed here if you prefer stricter spam control.)
    return { ok: true };
  }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const apiKey = process.env.GHL_API_KEY;
  const locationId = process.env.GHL_LOCATION_ID;
  if (!apiKey || !locationId) { res.status(500).json({ error: "GHL not configured" }); return; }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
  const {
    formType = "homepage-contact",
    firstName = "", lastName = "", email = "", phone = "", mobile = "",
    company = "", title = "", department = "", industry = "",
    city = "", zip = "", subject = "", topic = "", message = "",
    // Calculator share — recipient maps to the standard contact fields above;
    // these carry the sender + the shareable result link.
    senderName = "", senderEmail = "", senderPhone = "",
    shareUrl = "", shareChannel = "", vehicleSummary = "", savingsSummary = "",
    // EVan chatbot — full conversation log, saved as a note at session end.
    transcript = "", sessionId = "",
    recaptchaToken = "",
    ...rest
  } = body as Record<string, string>;

  // Spam gate — verify reCAPTCHA before doing any work (no-op if secret unset).
  const ip = (req.headers["x-forwarded-for"] || "").toString().split(",")[0].trim() || undefined;
  const captcha = await verifyRecaptcha(recaptchaToken, ip);
  if (!captcha.ok) { res.status(403).json({ error: "reCAPTCHA verification failed", reason: captcha.reason }); return; }

  if (!email && !phone && !mobile) {
    res.status(400).json({ error: "An email or phone is required." }); return;
  }

  const tags = FORM_TAGS[formType] ?? ["website-lead", `source:${formType}`];
  const name = [firstName, lastName].filter(Boolean).join(" ").trim();

  // Drop empty values so we never overwrite existing GHL data with blanks.
  const contact: Record<string, unknown> = { locationId, tags, source: SOURCE_LABEL[formType] ?? "Electrifying the US website" };
  const put = (k: string, v: string) => { if (v && String(v).trim()) contact[k] = String(v).trim(); };
  put("firstName", firstName); put("lastName", lastName); put("name", name);
  put("email", email); put("phone", phone || mobile);
  put("companyName", company); put("city", city); put("postalCode", zip);
  // Stash the result link on the contact so a GHL email/SMS template can
  // reference {{contact.website}} when the calculator-share workflow fires.
  put("website", shareUrl);

  const ghl = (path: string, init: Record<string, unknown>) =>
    fetch(`${GHL_BASE}${path}`, {
      ...init,
      headers: {
        Authorization: `Bearer ${apiKey}`,
        Version: GHL_VERSION,
        "Content-Type": "application/json",
        Accept: "application/json",
      },
    });

  try {
    const upsertRes = await ghl("/contacts/upsert", { method: "POST", body: JSON.stringify(contact) });
    const upsert = await upsertRes.json().catch(() => ({}));
    if (!upsertRes.ok) {
      console.error("GHL upsert failed", upsertRes.status, upsert);
      res.status(502).json({ error: "GHL upsert failed" }); return;
    }
    const contactId = upsert?.contact?.id ?? upsert?.id;

    // Best-effort note with details GHL standard fields don't capture.
    const userId = process.env.GHL_USER_ID;
    const lines = [
      `Form: ${SOURCE_LABEL[formType] ?? formType}`,
      title && `Title: ${title}`,
      department && `Department: ${department}`,
      industry && `Industry: ${industry}`,
      (subject || topic) && `Subject: ${subject || topic}`,
      message && `Message: ${message}`,
      shareChannel && `Share channel: ${shareChannel}`,
      vehicleSummary && `Comparison: ${vehicleSummary}`,
      savingsSummary && `Savings: ${savingsSummary}`,
      shareUrl && `Result link: ${shareUrl}`,
      (senderName || senderEmail || senderPhone) &&
        `Shared by: ${[senderName, senderEmail, senderPhone].filter(Boolean).join(" · ")}`,
      sessionId && `Session: ${sessionId}`,
      transcript && `\n--- EVan chat transcript ---\n${transcript}`,
      ...Object.entries(rest).map(([k, v]) => (v ? `${k}: ${v}` : "")),
    ].filter(Boolean);
    if (contactId && userId && lines.length) {
      await ghl(`/contacts/${contactId}/notes`, {
        method: "POST",
        body: JSON.stringify({ userId, body: lines.join("\n") }),
      }).catch(() => { /* non-blocking */ });
    }

    // Calculator share: also capture the SENDER as their own contact (best-effort)
    // so both sides land in GHL. The recipient (primary contact above) carries the
    // `calculator-share` tag + result link — a GHL workflow on that tag sends the
    // email/SMS. The sender is tagged separately so they aren't messaged as a lead.
    if (formType === "calculator-share" && (senderEmail || senderPhone)) {
      const senderContact: Record<string, unknown> = {
        locationId,
        tags: ["website-lead", "calculator-share-sender", "source:calculator-share-sender"],
        source: "EV Calculator share (sender)",
      };
      const sput = (k: string, v: string) => { if (v && String(v).trim()) senderContact[k] = String(v).trim(); };
      sput("firstName", senderName); sput("name", senderName);
      sput("email", senderEmail); sput("phone", senderPhone);
      sput("website", shareUrl);
      await ghl("/contacts/upsert", { method: "POST", body: JSON.stringify(senderContact) })
        .catch(() => { /* non-blocking */ });
    }

    // Internal Slack alert with the GHL contact link (once, on a real submission;
    // for the chatbot, only when the chat is done).
    await notifySlack({
      formType, contactId,
      name, email, phone: phone || mobile, company,
      subject: subject || topic, message, transcript,
    });

    res.status(200).json({ ok: true, contactId });
  } catch (err) {
    console.error("GHL proxy error", err);
    res.status(500).json({ error: "proxy error" });
  }
}
