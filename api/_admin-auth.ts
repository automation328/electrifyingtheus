// Shared server-side authorization for the CMS write API (/api/admin/*).
//
// A CMS request must carry a Supabase Auth access token:
//   Authorization: Bearer <supabase access_token>
// We (1) verify the token with Supabase GoTrue (auth/v1/user) to get the signed-in
// email, then (2) confirm that email is an allow-listed row in public.editors.
// Only then does the caller (collection.ts, upload.ts, kb-ingest.ts, …) perform
// the write with the SERVICE ROLE key — which never leaves the server.
//
// The leading underscore keeps Vercel from treating this file as an endpoint.
//
// Env (server-only):
//   SUPABASE_URL | VITE_SUPABASE_URL          project URL
//   VITE_SUPABASE_ANON_KEY                     anon key (to call GoTrue)
//   SUPABASE_SERVICE_ROLE_KEY                  service role (bypasses RLS)

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

export interface Editor {
  email: string;
  role: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
type Req = { headers: Record<string, string | string[] | undefined>; method?: string; body?: any };

/** Server-only Supabase client (service role → bypasses RLS). null until configured. */
export function adminSupabase(): SupabaseClient | null {
  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  return url && key ? createClient(url, key, { auth: { persistSession: false } }) : null;
}

function bearer(req: Req): string {
  const h = req.headers["authorization"] || req.headers["Authorization"];
  const raw = Array.isArray(h) ? h[0] : h;
  return raw && raw.startsWith("Bearer ") ? raw.slice(7).trim() : "";
}

/**
 * Resolve the authenticated, allow-listed editor for this request, or null.
 * Never throws — returns null on any failure (missing token, bad token,
 * not an editor, Supabase unconfigured).
 */
export async function getEditor(req: Req): Promise<Editor | null> {
  const token = bearer(req);
  if (!token) return null;

  const url = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!url || !anon) return null;

  // 1) Verify the access token → signed-in email.
  let email = "";
  try {
    const r = await fetch(`${url.replace(/\/$/, "")}/auth/v1/user`, {
      headers: { apikey: anon, Authorization: `Bearer ${token}` },
    });
    if (!r.ok) return null;
    const u = (await r.json()) as { email?: string };
    email = String(u?.email || "").trim().toLowerCase();
  } catch {
    return null;
  }
  if (!email) return null;

  // 2) Confirm the email is an allow-listed editor (service role read).
  //
  // Matching stays case-insensitive on purpose: `editors` is unique on
  // lower(email) but the stored value may carry capitals (0005_editors.sql
  // documents seeding the first admin by hand), and the RLS policy there also
  // compares lower(email). A plain .eq() would lock those accounts out.
  //
  // But the address must NOT be treated as a LIKE pattern: `%` and `_` are
  // wildcards, so an auth account named "admin%@example.com" would otherwise
  // match the allow-list row "admin@example.com" and inherit ITS role. So:
  // escape the wildcards, then re-check exact equality in JS — the JS check is
  // the real guarantee, the escaping is defence in depth.
  const db = adminSupabase();
  if (!db) return null;
  const pattern = email.replace(/[\\%_*]/g, (c) => `\\${c}`);
  const { data, error } = await db
    .from("editors")
    .select("email, role")
    .ilike("email", pattern)
    .maybeSingle();
  if (error || !data) return null;
  if (String(data.email).trim().toLowerCase() !== email) return null;
  // Blank role → least privilege (viewer). admin.ts normalizeRole() canonicalizes.
  return { email: data.email, role: data.role || "viewer" };
}

/**
 * Guard helper for endpoint handlers: returns the editor, or writes a 401 and
 * returns null (caller should `return` immediately when it gets null).
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export async function requireEditor(req: Req, res: any): Promise<Editor | null> {
  const editor = await getEditor(req);
  if (!editor) {
    res.status(401).json({ error: "unauthorized" });
    return null;
  }
  return editor;
}
