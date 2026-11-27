// Client-side auth for the CMS admin area, built on Supabase Auth.
//
// Editing is invite-only: accounts are created by an admin in the Supabase
// dashboard (public signups disabled) and the email must also be an allow-listed
// row in `public.editors`. This module only handles the browser session; the
// editor allow-list is enforced server-side by /api/admin/* (see _admin-auth.ts).

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

export interface EditorInfo {
  email: string;
  role: string;
}

export async function signIn(email: string, password: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Auth is not configured." };
  const { error } = await supabase.auth.signInWithPassword({ email: email.trim(), password });
  return { error: error ? error.message : null };
}

export async function signOut(): Promise<void> {
  if (!supabase) return;
  await supabase.auth.signOut();
}

/** Change the signed-in user's own password (uses the active session — no email). */
export async function changePassword(newPassword: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Auth is not configured." };
  const { error } = await supabase.auth.updateUser({ password: newPassword });
  return { error: error ? error.message : null };
}

// ── Two-factor (TOTP) ─────────────────────────────────────────────────────────
// Every editor must pass an authenticator-app code after the password. The
// server refuses CMS calls from a password-only (aal1) session, so this UI is
// convenience, not the lock. A lost phone: an admin removes the user's factor in
// Supabase (Authentication → Users → the user → MFA), then they enroll again.

export interface TotpEnrollment {
  factorId: string;
  /** SVG data URL of the QR code to scan. */
  qr: string;
  /** The same key as text, for apps that can't scan. */
  secret: string;
}

/** Start authenticator-app setup. Clears any half-finished setup first, since
 *  Supabase keeps unverified factors and a stale one would block a new enroll. */
export async function enrollTotp(): Promise<{ data: TotpEnrollment | null; error: string | null }> {
  if (!supabase) return { data: null, error: "Auth is not configured." };
  const { data: list } = await supabase.auth.mfa.listFactors();
  for (const f of list?.all ?? []) {
    if (f.factor_type === "totp" && f.status !== "verified") await supabase.auth.mfa.unenroll({ factorId: f.id });
  }
  const { data, error } = await supabase.auth.mfa.enroll({
    factorType: "totp",
    friendlyName: `ETU CMS ${new Date().toISOString().slice(0, 16)}`,
  });
  if (error || !data) return { data: null, error: error?.message ?? "Could not start 2FA setup." };
  return { data: { factorId: data.id, qr: data.totp.qr_code, secret: data.totp.secret }, error: null };
}

/** The signed-in user's verified authenticator factor, if any. */
export async function verifiedTotpFactor(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.mfa.listFactors();
  return data?.totp?.[0]?.id ?? null;
}

/** Check a 6-digit code. On success the session is upgraded to aal2 and the
 *  auth hook re-resolves on its own (Supabase fires an auth state change). */
export async function verifyTotp(factorId: string, code: string): Promise<{ error: string | null }> {
  if (!supabase) return { error: "Auth is not configured." };
  const { error } = await supabase.auth.mfa.challengeAndVerify({ factorId, code: code.replace(/\s/g, "") });
  return { error: error ? error.message : null };
}

/** Current Supabase access token (JWT) for authorizing /api/admin/* calls. */
export async function getAccessToken(): Promise<string | null> {
  if (!supabase) return null;
  const { data } = await supabase.auth.getSession();
  return data.session?.access_token ?? null;
}

/**
 * Confirm the signed-in user is an allow-listed editor by asking the server.
 * Returns the editor's identity+role, or null if not signed in / not an editor.
 */
export async function fetchEditor(): Promise<EditorInfo | null> {
  const token = await getAccessToken();
  if (!token) return null;
  try {
    const r = await fetch("/api/admin", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
      body: JSON.stringify({ op: "me" }),
    });
    if (!r.ok) return null;
    return (await r.json()) as EditorInfo;
  } catch {
    return null;
  }
}

type AuthState =
  | { status: "loading"; editor: null }
  | { status: "signed-out"; editor: null }
  | { status: "editor"; editor: EditorInfo }
  | { status: "not-authorized"; editor: null } // valid login, but not an allow-listed editor
  | { status: "mfa-enroll"; editor: null }      // password OK, no authenticator set up yet
  | { status: "mfa-verify"; editor: null };     // password OK, authenticator code still needed

/**
 * React hook exposing the CMS auth state. Re-checks editor authorization whenever
 * the Supabase session changes (sign in / out / token refresh).
 */
export function useEditorAuth(): AuthState & { refresh: () => void } {
  const [state, setState] = useState<AuthState>({ status: "loading", editor: null });
  const [nonce, setNonce] = useState(0);

  useEffect(() => {
    let cancelled = false;

    async function resolve() {
      if (!supabase) { if (!cancelled) setState({ status: "signed-out", editor: null }); return; }
      const { data } = await supabase.auth.getSession();
      if (!data.session) { if (!cancelled) setState({ status: "signed-out", editor: null }); return; }
      // Second factor before anything else: the server rejects aal1 sessions.
      const { data: aal } = await supabase.auth.mfa.getAuthenticatorAssuranceLevel();
      if (aal?.currentLevel !== "aal2") {
        if (!cancelled) setState({ status: aal?.nextLevel === "aal2" ? "mfa-verify" : "mfa-enroll", editor: null });
        return;
      }
      const editor = await fetchEditor();
      if (cancelled) return;
      setState(editor ? { status: "editor", editor } : { status: "not-authorized", editor: null });
    }

    resolve();
    const sub = supabase?.auth.onAuthStateChange(() => { resolve(); });
    return () => { cancelled = true; sub?.data.subscription.unsubscribe(); };
  }, [nonce]);

  return { ...state, refresh: () => setNonce((n) => n + 1) };
}
