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
  | { status: "not-authorized"; editor: null }; // valid login, but not an allow-listed editor

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
