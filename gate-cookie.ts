// The pre-launch password gate's cookie: one per reviewer, signed, expiring.
//
// Value: <base64url(email)>.<expiry ms>.<HMAC-SHA256(GATE_TOKEN, "email.expiry")>
//
// The old cookie was GATE_TOKEN itself, the same for everyone and valid
// forever, so a leaked cookie could not be traced or revoked. This one names
// its owner, expires, and stops working the moment that reviewer is removed
// from GATE_USERS (the middleware checks the email against the list).
//
// Web Crypto only, so the same file runs in the edge middleware and in the
// Node serverless function (api/gate-login.ts).

const enc = new TextEncoder();

const b64url = (bytes: Uint8Array): string => {
  let s = "";
  for (const b of bytes) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
};
const fromB64url = (s: string): string => {
  const bin = atob(s.replace(/-/g, "+").replace(/_/g, "/"));
  return new TextDecoder().decode(Uint8Array.from(bin, (c) => c.charCodeAt(0)));
};

async function hmac(secret: string, msg: string): Promise<string> {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  return b64url(new Uint8Array(await crypto.subtle.sign("HMAC", key, enc.encode(msg))));
}

/** Constant-time string compare (equal-length signatures from our own HMAC). */
function same(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let d = 0;
  for (let i = 0; i < a.length; i++) d |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return d === 0;
}

export async function signGateCookie(secret: string, email: string, expiresAt: number): Promise<string> {
  const e = email.trim().toLowerCase();
  return `${b64url(enc.encode(e))}.${expiresAt}.${await hmac(secret, `${e}.${expiresAt}`)}`;
}

/**
 * The reviewer's email if the cookie is genuine, unexpired and (when a list is
 * given) still on it; otherwise null. Never throws.
 */
export async function verifyGateCookie(
  secret: string,
  value: string,
  now: number,
  allowed?: Set<string>,
): Promise<string | null> {
  try {
    const [e64, expRaw, sig] = value.split(".");
    if (!e64 || !expRaw || !sig) return null;
    const exp = Number(expRaw);
    if (!Number.isFinite(exp) || now > exp) return null;
    const email = fromB64url(e64);
    if (!same(sig, await hmac(secret, `${email}.${exp}`))) return null;
    if (allowed && allowed.size > 0 && !allowed.has(email)) return null;
    return email;
  } catch {
    return null;
  }
}

/** Reviewer emails from the same env vars api/gate-login.ts reads. */
export function gateEmails(env: Record<string, string | undefined>): Set<string> {
  const out = new Set<string>();
  for (const raw of [env.GATE_USERS, env.GATE_USERS_EXTRA]) {
    try {
      const list = JSON.parse(raw || "[]");
      if (Array.isArray(list)) for (const u of list) if (u && typeof u.email === "string") out.add(u.email.trim().toLowerCase());
    } catch { /* malformed list: login would fail for it too */ }
  }
  if (env.SITE_EMAIL) out.add(env.SITE_EMAIL.trim().toLowerCase());
  return out;
}
