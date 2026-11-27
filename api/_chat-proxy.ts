// EVan chat proxy: the browser posts here (/api/chat, rewritten to
// /api/track?op=chat because the Hobby plan caps us at 12 functions), we apply
// the per-IP limit, then forward to the n8n chat webhook with a shared secret.
// Before this, visitors called n8n directly, so anyone could run the AI agent
// (and its model and search bills) as fast as they liked.
//
// Env (server-only):
//   N8N_CHAT_WEBHOOK_URL  the n8n webhook (…/webhook/evan-chat)
//   N8N_CHAT_SECRET       sent as X-ETU-Chat-Secret; n8n's Header Auth checks it
import { checkRateLimit, tooManyRequests } from "./_rate-limit.js";

const MAX_BODY = 8_000;        // a chat turn plus the lead fields, with room to spare
const TIMEOUT_MS = 90_000;     // the agent can search the web before answering

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function handleChat(req: any, res: any): Promise<void> {
  if (req.method !== "POST") { res.status(405).json({ error: "method" }); return; }

  const url = process.env.N8N_CHAT_WEBHOOK_URL;
  if (!url) { res.status(503).json({ error: "chat_not_configured" }); return; }

  // A real conversation is a few messages a minute; this stops scripted use.
  const rl = await checkRateLimit(req, { bucket: "chat", limit: 30, windowMinutes: 10 });
  if (!rl.ok) { tooManyRequests(res, rl); return; }

  const body = typeof req.body === "string" ? req.body : JSON.stringify(req.body ?? {});
  if (body.length > MAX_BODY) { res.status(413).json({ error: "too_large" }); return; }

  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), TIMEOUT_MS);
  try {
    const upstream = await fetch(url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        ...(process.env.N8N_CHAT_SECRET ? { "X-ETU-Chat-Secret": process.env.N8N_CHAT_SECRET } : {}),
      },
      body,
      signal: ctrl.signal,
    });
    const text = await upstream.text();
    res.status(upstream.ok ? 200 : 502);
    res.setHeader("Content-Type", upstream.headers.get("content-type") || "text/plain; charset=utf-8");
    res.setHeader("Cache-Control", "no-store");
    res.end(upstream.ok ? text : JSON.stringify({ error: "chat_upstream" }));
  } catch {
    res.status(504).json({ error: "chat_timeout" });
  } finally {
    clearTimeout(timer);
  }
}
