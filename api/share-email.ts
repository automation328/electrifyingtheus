// Sends a branded, site-styled HTML share email (with an inline thumbnail) via
// Resend. Used by the ShareGate "Email" option — the visitor enters their name
// + email at the gate, and we email them the shareable with full details and
// the image rendered inline (not just a link).
//
// Env (server-only):
//   RESEND_API_KEY   Resend API key (re_…). Required to actually send.
//   RESEND_FROM      Verified sender, e.g. "Electrifying the US <share@electrifyingtheus.com>".
//                    Falls back to Resend's onboarding address (test-only delivery).
//   RECAPTCHA_SECRET_KEY  Optional — when set, the share token is verified.

const RESEND_ENDPOINT = "https://api.resend.com/emails";
const DEFAULT_FROM = "Electrifying the US <onboarding@resend.dev>";
const SITE = "https://electrifyingtheus.vercel.app";

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

function buildHtml(opts: {
  title: string; description?: string; meta?: string; imageUrl?: string; url: string; greetName?: string;
}): string {
  const { title, description, meta, imageUrl, url, greetName } = opts;
  const hero = imageUrl
    ? `<tr><td style="padding:0">
         <a href="${esc(url)}" target="_blank" style="text-decoration:none">
           <img src="${esc(imageUrl)}" alt="${esc(title)}" width="600"
                style="display:block;width:100%;max-width:600px;height:auto;border:0;border-top-left-radius:16px;border-top-right-radius:16px" />
         </a>
       </td></tr>`
    : "";
  const greeting = greetName
    ? `<p style="margin:0 0 14px;font:600 15px/1.5 Arial,Helvetica,sans-serif;color:${BRAND.ink}">Hi ${esc(greetName)},</p>`
    : "";
  const metaRow = meta
    ? `<p style="margin:0 0 10px;font:700 12px/1.4 Arial,Helvetica,sans-serif;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.blue}">${esc(meta)}</p>`
    : "";
  const desc = description
    ? `<p style="margin:0 0 24px;font:400 15px/1.65 Arial,Helvetica,sans-serif;color:${BRAND.muted}">${esc(description)}</p>`
    : "";

  return `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="color-scheme" content="light only"><title>${esc(title)}</title></head>
<body style="margin:0;padding:0;background:${BRAND.bg}">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0">${esc(description || title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:${BRAND.bg};padding:28px 12px">
    <tr><td align="center">
      <table role="presentation" width="600" cellpadding="0" cellspacing="0"
             style="width:600px;max-width:600px;background:#ffffff;border-radius:16px;overflow:hidden;box-shadow:0 8px 30px rgba(11,95,212,.10)">
        <!-- Header -->
        <tr><td style="background:${BRAND.blueDeep};background:linear-gradient(135deg,${BRAND.blue},${BRAND.green});padding:18px 28px">
          <span style="font:800 18px/1 Arial,Helvetica,sans-serif;color:#ffffff;letter-spacing:-.01em">⚡ Electrifying the US</span>
        </td></tr>
        ${hero}
        <!-- Body -->
        <tr><td style="padding:28px 28px 8px">
          ${greeting}
          ${metaRow}
          <h1 style="margin:0 0 14px;font:800 24px/1.25 Arial,Helvetica,sans-serif;color:${BRAND.ink}">${esc(title)}</h1>
          ${desc}
          <table role="presentation" cellpadding="0" cellspacing="0"><tr><td
             style="border-radius:12px;background:${BRAND.blue}">
            <a href="${esc(url)}" target="_blank"
               style="display:inline-block;padding:13px 26px;font:700 15px/1 Arial,Helvetica,sans-serif;color:#ffffff;text-decoration:none;border-radius:12px">
               Read more &rarr;</a>
          </td></tr></table>
        </td></tr>
        <!-- Footer -->
        <tr><td style="padding:24px 28px 28px">
          <hr style="border:none;border-top:1px solid ${BRAND.line};margin:0 0 16px" />
          <p style="margin:0 0 6px;font:400 12px/1.6 Arial,Helvetica,sans-serif;color:${BRAND.muted}">
            Shared from <a href="${SITE}" style="color:${BRAND.blue};text-decoration:none">ElectrifyingTheUS.com</a> —
            your guide to electric vehicles, charging, and going electric.
          </p>
          <p style="margin:0;font:400 11px/1.5 Arial,Helvetica,sans-serif;color:#9aa7b4">
            You received this because you chose to share this content. Informational only; not financial, legal, or tax advice.
          </p>
        </td></tr>
      </table>
    </td></tr>
  </table>
</body></html>`;
}

function buildText(opts: { title: string; description?: string; meta?: string; url: string }): string {
  return [opts.title, opts.meta, opts.description, `Read more: ${opts.url}`]
    .filter(Boolean).join("\n\n");
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) { res.status(500).json({ error: "Email sending is not configured" }); return; }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
  const {
    to = "", senderEmail = "", senderName = "",
    title = "", description = "", meta = "", imageUrl = "", url = "",
    recaptchaToken = "",
  } = body as Record<string, string>;

  if (!(await verifyRecaptcha(recaptchaToken))) {
    res.status(400).json({ error: "Verification failed" }); return;
  }

  const isEmail = (v: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test((v || "").trim());
  // Open-relay guard: only ever email the gate's own address back to itself.
  if (!isEmail(to) || to.trim().toLowerCase() !== senderEmail.trim().toLowerCase()) {
    res.status(400).json({ error: "A valid recipient email is required" }); return;
  }
  if (!title || !url) { res.status(400).json({ error: "Missing share content" }); return; }

  const html = buildHtml({ title, description, meta, imageUrl, url, greetName: senderName });
  const text = buildText({ title, description, meta, url });

  try {
    const r = await fetch(RESEND_ENDPOINT, {
      method: "POST",
      headers: { Authorization: `Bearer ${apiKey}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        from: process.env.RESEND_FROM || DEFAULT_FROM,
        to: [to.trim()],
        subject: title,
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
