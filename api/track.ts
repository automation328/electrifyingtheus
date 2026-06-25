// Visitor tracking → Slack. The SPA pings this once per browser session on first
// load; we read the visitor's IP + Vercel geo headers and post a notification to
// Slack. Best-effort and bot-filtered, so it never blocks or errors the page.
//
// PRIVACY: this logs IP addresses (which are personal data under GDPR/CCPA).
// Make sure the site's privacy policy discloses visitor IP/analytics logging.
//
// Env (server-only):
//   SLACK_VISITORS_WEBHOOK_URL  Incoming webhook for visitor alerts (optional —
//                               use this to route visits to a dedicated channel).
//   SLACK_WEBHOOK_URL           Fallback webhook if the above is unset.

// Common bot / monitor / headless user-agents we don't want to alert on.
const CRAWLER =
  /bot\b|crawl|spider|slurp|bingpreview|facebookexternalhit|embedly|preview|monitor|pingdom|uptimerobot|statuscake|headless|lighthouse|gtmetrix|vercel-screenshot|prerender|curl\/|wget\/|python-requests|node-fetch|axios\/|go-http|httpclient|java\//i;

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function header(req: any, name: string): string {
  const v = req.headers[name];
  return (Array.isArray(v) ? v[0] : v) || "";
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function clientIp(req: any): string {
  const xff = header(req, "x-forwarded-for");
  if (xff) return xff.split(",")[0].trim();
  return header(req, "x-real-ip") || "unknown";
}

function safeDecode(v: string): string {
  try { return decodeURIComponent(v); } catch { return v; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // Always answer 204 so the client beacon never sees an error.
  const done = () => res.status(204).end();
  if (req.method !== "POST") { res.status(405).end(); return; }

  const hook = process.env.SLACK_VISITORS_WEBHOOK_URL || process.env.SLACK_WEBHOOK_URL;
  if (!hook) return done();

  const ua = String(req.headers["user-agent"] || "");
  if (!ua || CRAWLER.test(ua)) return done(); // skip bots / monitors

  const body = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = body && typeof body === "object" ? body : {};
  const path = String(b.path ?? "").slice(0, 200);
  const referrer = String(b.referrer ?? "").slice(0, 300);
  // Identity the visitor gave at an earlier gate (calculator, chat, share,
  // event) — sent by the client from localStorage; blank for anonymous visitors.
  const firstName = String(b.firstName ?? "").slice(0, 80).trim();
  const email = String(b.email ?? "").slice(0, 160).trim();
  const known = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const ip = clientIp(req);
  const city = safeDecode(header(req, "x-vercel-ip-city"));
  const region = header(req, "x-vercel-ip-country-region");
  const country = header(req, "x-vercel-ip-country");
  const loc = [city, region, country].filter(Boolean).join(", ") || "unknown location";

  const when = new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium", timeStyle: "short", timeZone: "America/New_York",
  }).format(new Date());

  const lines = [
    known ? "🙋 *Known visitor* — electrifyingtheus.com" : "👀 *New visitor* — electrifyingtheus.com",
    known ? `👤 ${firstName || "(no name given)"} · ${email}` : "",
    `📍 IP: \`${ip}\``,
    `🌎 ${loc}`,
    path ? `📄 Page: ${path}` : "",
    referrer ? `↩️ Referrer: ${referrer}` : "↩️ Referrer: direct / unknown",
    `🕑 ${when} ET`,
    ua ? `🖥️ ${ua.slice(0, 180)}` : "",
  ].filter(Boolean);

  try {
    await fetch(hook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text: lines.join("\n") }),
    });
  } catch { /* Slack down — never block the visitor */ }

  return done();
}
