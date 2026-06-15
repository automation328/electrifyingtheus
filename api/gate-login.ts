// Password gate for the site (test.electrifyingtheus.com). Validates the shared
// password, and on success: sets the HttpOnly gate cookie the edge middleware
// checks, records the visitor's IP in Supabase (new vs. returning), and posts a
// Slack notification — flagging brand-new IPs.
//
// Env (server-only):
//   SITE_PASSWORD          The shared password.
//   GATE_TOKEN             Long random string; the cookie value middleware checks.
//   SLACK_WEBHOOK_URL      Incoming webhook for sign-in notifications (optional).
//   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY   For the record_gate_login RPC.

const COOKIE = "etu_gate";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function safeJson(s: string): Record<string, unknown> {
  try { return JSON.parse(s); } catch { return {}; }
}

function clientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const xff = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  if (raw) return raw.split(",")[0].trim();
  const real = req.headers["x-real-ip"];
  return (Array.isArray(real) ? real[0] : real) || "unknown";
}

// Records the IP via the SECURITY DEFINER RPC; returns whether it's a new IP.
// Best-effort — never throws into the request path.
async function recordIp(ip: string, ua: string): Promise<boolean | null> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/record_gate_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ p_ip: ip, p_ua: ua }),
    });
    if (!r.ok) return null;
    const data = await r.json().catch(() => null);
    return typeof data === "boolean" ? data : null;
  } catch {
    return null;
  }
}

async function notifySlack(ip: string, ua: string, isNew: boolean | null): Promise<void> {
  const hook = process.env.SLACK_WEBHOOK_URL;
  if (!hook) return;
  const when = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York",
  }).format(new Date());
  const tag = isNew === true ? "🆕 *NEW IP*" : isNew === false ? "Returning IP" : "IP";
  const lines = [
    `🔐 *Site sign-in* — test.electrifyingtheus.com`,
    `${tag}: \`${ip}\``,
    `🕑 ${when} ET`,
    ua ? `🖥️ ${ua.slice(0, 180)}` : "",
  ].filter(Boolean);
  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
  } catch { /* Slack down — don't block sign-in */ }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const expected = process.env.SITE_PASSWORD;
  const token = process.env.GATE_TOKEN;
  if (!expected || !token) { res.status(500).json({ error: "Gate not configured" }); return; }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
  const password = String((body as Record<string, unknown>).password ?? "");

  // Constant-time-ish compare (length + char) — fine for a single shared secret.
  if (password.length !== expected.length || password !== expected) {
    res.status(401).json({ error: "Incorrect password" });
    return;
  }

  const ip = clientIp(req);
  const ua = String(req.headers["user-agent"] || "");

  // Record + notify in the background-ish (await so it completes on serverless).
  const isNew = await recordIp(ip, ua);
  await notifySlack(ip, ua, isNew);

  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  res.status(200).json({ ok: true });
}
