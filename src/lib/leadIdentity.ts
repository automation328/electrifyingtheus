// Shared visitor identity (first name + email) captured by ANY lead gate on the
// site — the calculator unlock, every Share dialog, and the event action gates.
//
// The first time a visitor enters their first name + email anywhere, we persist
// it here. Every later gate reads it back and skips re-asking, so a returning
// visitor is never made to retype what they already gave. Persisted to
// localStorage so it survives across sessions (not just the current tab).

export interface LeadIdentity {
  firstName: string;
  email: string;
}

const KEY = "etu_lead_identity";

/** Persist the visitor's identity. No-op when the email is missing/blank. */
export function saveLeadIdentity(id: LeadIdentity): void {
  try {
    const firstName = (id.firstName ?? "").trim();
    const email = (id.email ?? "").trim();
    if (!email) return;
    localStorage.setItem(KEY, JSON.stringify({ firstName, email }));
  } catch {
    /* private mode / storage disabled — non-fatal */
  }
}

/** Return the stored identity, or null when none has been captured yet. */
export function getLeadIdentity(): LeadIdentity | null {
  try {
    const raw = localStorage.getItem(KEY);
    if (!raw) return null;
    const o = JSON.parse(raw) as Partial<LeadIdentity>;
    if (o && typeof o.email === "string" && o.email.trim()) {
      return {
        firstName: typeof o.firstName === "string" ? o.firstName : "",
        email: o.email,
      };
    }
  } catch {
    /* malformed / blocked — treat as absent */
  }
  return null;
}

/** True once the visitor has identified themselves at any gate. */
export function hasLeadIdentity(): boolean {
  return getLeadIdentity() !== null;
}
