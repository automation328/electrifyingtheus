// Per-individual password gate for the pre-launch site. Each reviewer has their
// own email + password. On success: sets the HttpOnly gate cookie the edge
// middleware checks, records WHICH person signed in from WHICH IP in Supabase,
// and posts a Slack notification — flagging a new IP for that account and a
// possible shared login (the same account used from many distinct IPs).
//
// Env (server-only):
//   GATE_USERS   JSON array of reviewers, e.g.
//                [{"email":"a@x.com","password":"...","name":"Alice"}, ...]
//                (If unset, falls back to single SITE_EMAIL + SITE_PASSWORD.)
//   SITE_EMAIL / SITE_PASSWORD   Fallback single login.
//   GATE_TOKEN              Cookie value the middleware checks.
//   GATE_SHARE_THRESHOLD    Distinct-IP count that triggers a ⚠️ (default 4).
//   SLACK_WEBHOOK_URL       Incoming webhook for sign-in alerts (optional).
//   VITE_SUPABASE_URL / VITE_SUPABASE_ANON_KEY   For the record_gate_login RPC.

const COOKIE = "etu_gate";
const MAX_AGE = 60 * 60 * 24 * 30; // 30 days

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

interface GateUser { email: string; password: string; name?: string; }

// Reviewer list: GATE_USERS JSON, else the single SITE_EMAIL/SITE_PASSWORD pair.
function gateUsers(): GateUser[] {
  const raw = process.env.GATE_USERS;
  if (raw) {
    const parsed = safeJson(raw);
    if (Array.isArray(parsed)) {
      return parsed
        .filter((u): u is GateUser => !!u && typeof u.email === "string" && typeof u.password === "string")
        .map((u) => ({ email: u.email, password: u.password, name: u.name }));
    }
  }
  const e = process.env.SITE_EMAIL, p = process.env.SITE_PASSWORD;
  return e && p ? [{ email: e, password: p }] : [];
}

function clientIp(req: { headers: Record<string, string | string[] | undefined> }): string {
  const xff = req.headers["x-forwarded-for"];
  const raw = Array.isArray(xff) ? xff[0] : xff;
  if (raw) return raw.split(",")[0].trim();
  const real = req.headers["x-real-ip"];
  return (Array.isArray(real) ? real[0] : real) || "unknown";
}

// Records (email, ip) via the SECURITY DEFINER RPC. Returns { isNewIp, distinctIps }.
// Best-effort — never throws into the request path.
async function recordLogin(email: string, ip: string, ua: string):
  Promise<{ isNewIp: boolean | null; distinctIps: number | null }> {
  const url = process.env.VITE_SUPABASE_URL;
  const key = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !key) return { isNewIp: null, distinctIps: null };
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/rest/v1/rpc/record_gate_login`, {
      method: "POST",
      headers: { "Content-Type": "application/json", apikey: key, Authorization: `Bearer ${key}` },
      body: JSON.stringify({ p_email: email, p_ip: ip, p_ua: ua }),
    });
    if (!r.ok) return { isNewIp: null, distinctIps: null };
    const data = await r.json().catch(() => null);
    const row = Array.isArray(data) ? data[0] : data;
    return {
      isNewIp: typeof row?.is_new_ip === "boolean" ? row.is_new_ip : null,
      distinctIps: typeof row?.distinct_ips === "number" ? row.distinct_ips : null,
    };
  } catch {
    return { isNewIp: null, distinctIps: null };
  }
}

async function notifySlack(opts: {
  who: string; ip: string; ua: string; isNewIp: boolean | null; distinctIps: number | null;
}): Promise<void> {
  const hook = process.env.SLACK_WEBHOOK_URL;
  if (!hook) return;
  const threshold = Number(process.env.GATE_SHARE_THRESHOLD || "4") || 4;
  const when = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York",
  }).format(new Date());
  const ipTag = opts.isNewIp === true ? "🆕 *new IP for this account*"
    : opts.isNewIp === false ? "returning IP" : "IP";
  const shared = opts.distinctIps != null && opts.distinctIps >= threshold;
  const lines = [
    `🔐 *Pre-launch sign-in* — test.electrifyingtheus.com`,
    `👤 ${opts.who}`,
    `${ipTag}: \`${opts.ip}\``,
    opts.distinctIps != null
      ? `${shared ? "⚠️ " : "📍 "}this login has been used from *${opts.distinctIps}* IP${opts.distinctIps === 1 ? "" : "s"}${shared ? " — possible shared login" : ""}`
      : "",
    `🕑 ${when} ET`,
    opts.ua ? `🖥️ ${opts.ua.slice(0, 180)}` : "",
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

  const token = process.env.GATE_TOKEN;
  const users = gateUsers();
  if (!token || users.length === 0) { res.status(500).json({ error: "Gate not configured" }); return; }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const email = String(b.email ?? "").trim();
  const password = String(b.password ?? "");

  // Match a reviewer by email (case-insensitive) + exact password.
  const user = users.find(
    (u) => u.email.trim().toLowerCase() === email.toLowerCase()
      && u.password.length === password.length && u.password === password,
  );
  if (!user) {
    res.status(401).json({ error: "Incorrect email or password" });
    return;
  }

  const ip = clientIp(req);
  const ua = String(req.headers["user-agent"] || "");
  const who = user.name ? `${user.name} (${user.email})` : user.email;

  // Record + notify (await so it completes before the serverless invocation ends).
  const { isNewIp, distinctIps } = await recordLogin(user.email, ip, ua);
  await notifySlack({ who, ip, ua, isNewIp, distinctIps });

  res.setHeader(
    "Set-Cookie",
    `${COOKIE}=${token}; Path=/; Max-Age=${MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  res.status(200).json({ ok: true });
}
