// Registers a webinar registrant directly on Zoom via the Webinar Registrant API
// using Server-to-Server OAuth, and returns the unique join_url. Inert (returns
// { configured: false }) until the ZOOM_* env vars are set, so the on-page form
// degrades gracefully to lead-capture-only when Zoom isn't wired yet.
//
// Env (server-only, set in Vercel):
//   ZOOM_ACCOUNT_ID, ZOOM_CLIENT_ID, ZOOM_CLIENT_SECRET   Server-to-Server OAuth app
//   ZOOM_WEBINAR_ID                                        numeric webinar id
//
// Zoom API (verified against developers.zoom.us):
//   token:    POST https://zoom.us/oauth/token?grant_type=account_credentials&account_id=…
//             Authorization: Basic base64(client_id:client_secret)
//   register: POST https://api.zoom.us/v2/webinars/{id}/registrants   (Bearer token)

let tokenCache: { token: string; exp: number } | null = null;

async function zoomToken(): Promise<string | null> {
  const accountId = process.env.ZOOM_ACCOUNT_ID;
  const clientId = process.env.ZOOM_CLIENT_ID;
  const clientSecret = process.env.ZOOM_CLIENT_SECRET;
  if (!accountId || !clientId || !clientSecret) return null;
  if (tokenCache && Date.now() < tokenCache.exp) return tokenCache.token;

  const basic = Buffer.from(`${clientId}:${clientSecret}`).toString("base64");
  const r = await fetch(
    `https://zoom.us/oauth/token?grant_type=account_credentials&account_id=${encodeURIComponent(accountId)}`,
    { method: "POST", headers: { Authorization: `Basic ${basic}` } },
  );
  if (!r.ok) return null;
  const j = await r.json();
  // Refresh 5 min before the 1-hour expiry.
  tokenCache = { token: j.access_token, exp: Date.now() + ((j.expires_in ?? 3600) - 300) * 1000 };
  return tokenCache.token;
}

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}
const clean = (v: unknown, max = 128) => String(v ?? "").trim().slice(0, max);

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ ok: false, error: "method" }); return; }

  const webinarId = process.env.ZOOM_WEBINAR_ID;
  const token = await zoomToken();
  // Not wired up yet — tell the client so it falls back to "we'll email your link".
  if (!token || !webinarId) { res.status(200).json({ ok: false, configured: false }); return; }

  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = body && typeof body === "object" ? body : {};

  const first_name = clean(b.firstName, 64);
  const last_name = clean(b.lastName, 64);
  const email = clean(b.email, 128);
  if (!first_name || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    res.status(400).json({ ok: false, error: "invalid_input" }); return;
  }

  const custom_questions = [
    b.vehicle && { title: "What best describes your current vehicle situation?", value: clean(b.vehicle) },
    b.concern && { title: "What's your biggest concern about switching to an EV?", value: clean(b.concern) },
    b.question && { title: "What is one question you hope we answer during this webinar?", value: clean(b.question, 500) },
  ].filter(Boolean) as Array<{ title: string; value: string }>;

  const drop = (o: Record<string, unknown>) => Object.fromEntries(Object.entries(o).filter(([, v]) => v));
  const payload = drop({
    first_name, last_name, email,
    city: clean(b.city, 64),
    zip: clean(b.zip, 16),
    org: clean(b.company, 128),
    industry: clean(b.industry, 64),
    job_title: clean(b.title, 64),
    phone: clean(b.mobile, 32),
    custom_questions: custom_questions.length ? custom_questions : undefined,
  });

  const register = (payloadObj: Record<string, unknown>) =>
    fetch(`https://api.zoom.us/v2/webinars/${webinarId}/registrants`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify(payloadObj),
    });

  let r = await register(payload);
  // If the custom questions don't match the webinar's config, Zoom returns 400 —
  // retry with standard fields only so the person is still registered.
  if (!r.ok && payload.custom_questions) {
    const { custom_questions: _omit, ...standard } = payload;
    r = await register(standard);
  }

  const data = (await r.json().catch(() => ({}))) as { join_url?: string; message?: string };
  if (!r.ok) { res.status(502).json({ ok: false, configured: true, error: data?.message || "zoom_error" }); return; }
  res.status(200).json({ ok: true, configured: true, joinUrl: data.join_url ?? null });
}
