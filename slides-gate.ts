// The shared half of the /updates password gate.
//
// Imported by BOTH sides, so the cookie the endpoint writes and the cookie the
// edge checks can never drift apart:
//   • api/gate-login.ts    — Node runtime, checks the password, sets the cookie
//   • middleware.ts        — Edge runtime, lets the page through or asks for it
//
// Web Crypto (not node:crypto) because the edge runtime has no Node modules and
// both runtimes have globalThis.crypto.subtle.
//
// The cookie carries a SHA-256 of the password, never the password itself: the
// browser keeps something that proves the holder signed in without being the
// secret, so a stolen cookie cannot be typed into the form on another site, and
// changing SLIDES_PASSWORD invalidates every cookie already issued.

/** Cookie the page is unlocked with. Scoped to /updates — nothing else needs it. */
export const SLIDES_COOKIE = "etu_slides";
// Path-scoped, so renaming the route retires the cookies issued under the old
// one: anyone holding an /slides cookie signs in once more. The env var keeps
// its SLIDES_ name on purpose — it is set in Vercel, and churning it would mean
// re-entering the password for a rename nobody outside this file can see.
export const SLIDES_COOKIE_PATH = "/updates";
/** Thirty days: long enough that a reviewer signs in once, short enough to lapse. */
export const SLIDES_MAX_AGE = 60 * 60 * 24 * 30;

/** SHA-256 of a string, hex. */
export async function sha256Hex(input: string): Promise<string> {
  const bytes = new TextEncoder().encode(input);
  const digest = await crypto.subtle.digest("SHA-256", bytes);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

/** The cookie value that unlocks the page for this password. */
export const slidesToken = (password: string): Promise<string> => sha256Hex(`etu-slides:${password}`);

/**
 * Compare without leaking how much matched.
 *
 * `===` on a secret returns at the first differing byte, so response timing
 * narrows a guess. Both sides are fixed-width hex here, but the habit is the
 * point — api/gate-login.ts and api/admin.ts both compare the same way.
 */
export function timingSafeEqualHex(a: string, b: string): boolean {
  if (a.length !== b.length) return false;
  let diff = 0;
  for (let i = 0; i < a.length; i++) diff |= a.charCodeAt(i) ^ b.charCodeAt(i);
  return diff === 0;
}

/** One cookie's value out of a Cookie header, or "" when it is not there. */
export function readCookie(header: string | null | undefined, name: string): string {
  for (const part of String(header ?? "").split(/; */)) {
    const eq = part.indexOf("=");
    if (eq > 0 && part.slice(0, eq).trim() === name) return part.slice(eq + 1).trim();
  }
  return "";
}

/** Whether this request already carries a valid unlock cookie. */
export async function slidesUnlocked(cookieHeader: string | null | undefined, password: string): Promise<boolean> {
  if (!password) return false;
  const supplied = readCookie(cookieHeader, SLIDES_COOKIE);
  if (!supplied) return false;
  return timingSafeEqualHex(supplied, await slidesToken(password));
}
