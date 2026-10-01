// Password check for the /slides deck page.
//
// POST { password } → sets the HttpOnly cookie the edge middleware looks for,
// or 401. One shared password, held server-side in SLIDES_PASSWORD; the browser
// never receives it, only a digest of it (see slides-gate.ts).
//
// Shaped after api/gate-login.ts, with the parts that matter kept: a rate limit
// BEFORE any credential is examined, a constant-time comparison, and a cookie
// that carries no secret. Simpler in one respect — there is no reviewer list,
// because the ask was one password for one page.
//
// Env (server-only):
//   SLIDES_PASSWORD   the password people are given. Unset = page stays open.
//
// What this protects, precisely: the PAGE. The deck itself is published on
// FlipHTML5 at a public URL, so anyone who has that URL can still open it there.
// Making the deck itself private is a setting on FlipHTML5, not something this
// endpoint can do.

import { checkRateLimit, tooManyRequests } from "./_rate-limit.js";
import {
  SLIDES_COOKIE, SLIDES_COOKIE_PATH, SLIDES_MAX_AGE, slidesToken, timingSafeEqualHex, sha256Hex,
} from "../slides-gate.js";

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "Method not allowed" }); return; }

  const expected = process.env.SLIDES_PASSWORD || "";
  if (!expected) { res.status(500).json({ error: "Not configured" }); return; }

  // Before the password is looked at, not after: an unmetered check is a free
  // guessing machine. Fails closed, like the site gate — a login endpoint with
  // no limiter is worse than one briefly unavailable.
  const rl = await checkRateLimit(req, {
    bucket: "slides-login", limit: 10, windowMinutes: 15, failClosed: true,
  });
  if (!rl.ok) { tooManyRequests(res, rl); return; }

  const body = typeof req.body === "string" ? safeJson(req.body) : (req.body ?? {});
  const b = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const supplied = String(b.password ?? "");

  // Hash both sides first: timing-safe comparison needs equal lengths, and the
  // length of the real password is itself not something to hand out.
  const ok = timingSafeEqualHex(await sha256Hex(supplied), await sha256Hex(expected));
  if (!ok) { res.status(401).json({ error: "Incorrect password" }); return; }

  res.setHeader(
    "Set-Cookie",
    `${SLIDES_COOKIE}=${await slidesToken(expected)}; Path=${SLIDES_COOKIE_PATH}; `
    + `Max-Age=${SLIDES_MAX_AGE}; HttpOnly; Secure; SameSite=Lax`,
  );
  res.status(200).json({ ok: true });
}
