// reCAPTCHA v3 check shared by the public form endpoints (lead, share-email,
// register-webinar). The leading underscore keeps Vercel from making it an endpoint.
//
// Env (server-only): RECAPTCHA_SECRET_KEY. The browser needs
// VITE_RECAPTCHA_SITE_KEY to send a token at all (src/lib/recaptcha.ts).
//
// With no secret set the check is skipped, so local dev and a site without
// reCAPTCHA keep working; production logs a warning so the gap is visible.

const MIN_SCORE = 0.5;

/** Hosts a genuine token can come from. Google reports where the challenge ran. */
function allowedHost(host: string): boolean {
  const h = host.toLowerCase();
  const own = (process.env.VERCEL_URL || "").toLowerCase();
  return h === "electrifyingtheus.com" || h === "www.electrifyingtheus.com"
    || h === "localhost" || h === "127.0.0.1" || (!!own && h === own);
}

export interface RecaptchaResult { ok: boolean; reason?: string }

export async function verifyRecaptcha(
  token: string,
  opts: { action?: string; remoteip?: string; failClosed?: boolean } = {},
): Promise<RecaptchaResult> {
  const secret = process.env.RECAPTCHA_SECRET_KEY;
  if (!secret) {
    if (process.env.VERCEL_ENV === "production") console.warn("[recaptcha] RECAPTCHA_SECRET_KEY unset: public forms have no bot check");
    return { ok: true };
  }
  if (!token) return { ok: false, reason: "missing token" };
  try {
    const params = new URLSearchParams({ secret, response: token });
    if (opts.remoteip) params.set("remoteip", opts.remoteip);
    const r = await fetch("https://www.google.com/recaptcha/api/siteverify", {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: params.toString(),
    });
    const data = (await r.json().catch(() => ({}))) as { success?: boolean; score?: number; action?: string; hostname?: string };
    if (!data.success) return { ok: false, reason: "failed" };
    if (typeof data.score === "number" && data.score < MIN_SCORE) return { ok: false, reason: `low score ${data.score}` };
    // A token minted for another form or on another site must not count here.
    if (opts.action && data.action && data.action !== opts.action) return { ok: false, reason: `wrong action ${data.action}` };
    if (data.hostname && !allowedHost(data.hostname)) return { ok: false, reason: `wrong host ${data.hostname}` };
    return { ok: true };
  } catch {
    // Google unreachable. Lead forms stay open so an outage doesn't lose real
    // leads; endpoints that can be abused as a relay pass failClosed.
    return opts.failClosed ? { ok: false, reason: "unreachable" } : { ok: true };
  }
}
