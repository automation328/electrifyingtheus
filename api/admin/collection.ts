// CMS write API for the content collections. Editor-gated (see _admin-auth.ts);
// performs the actual read/write with the service role key so RLS can stay
// read-only-for-the-public. One endpoint, several actions:
//
//   POST /api/admin/collection
//   { action: "list",   table }                       → all rows (incl. drafts)
//   { action: "insert", table, row }                  → created row
//   { action: "update", table, id, row }              → updated row
//   { action: "delete", table, id }                   → { ok: true }
//
// Only whitelisted tables are writable. The browser sends the editor's Supabase
// access token as `Authorization: Bearer <token>`.

import { requireEditor, adminSupabase } from "../_admin-auth";

// Tables the CMS may read/write. Extend as later phases add collections
// (site_vehicles, site_incentives, site_pages, kb_source_documents…).
const ALLOWED = new Set<string>([
  "site_blog_posts",
  "site_events",
  "site_gallery",
  "site_jobs",
  "site_vehicles",
  "site_incentives",
  "site_pages",
]);

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }

  const editor = await requireEditor(req, res);
  if (!editor) return; // 401 already sent

  const parsed = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = parsed && typeof parsed === "object" ? parsed : {};

  const action = String(b.action ?? "");
  const table = String(b.table ?? "");
  if (!ALLOWED.has(table)) { res.status(400).json({ error: "table_not_allowed" }); return; }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

  try {
    if (action === "list") {
      const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
      if (error) { res.status(500).json({ error: "query_failed", detail: error.message }); return; }
      res.status(200).json({ rows: data ?? [] });
      return;
    }

    if (action === "insert") {
      const row = (b.row && typeof b.row === "object" ? b.row : {}) as Record<string, unknown>;
      const { data, error } = await db.from(table).insert(row).select().single();
      if (error) { res.status(400).json({ error: "insert_failed", detail: error.message }); return; }
      res.status(200).json({ row: data });
      return;
    }

    if (action === "update") {
      const id = String(b.id ?? "");
      const row = (b.row && typeof b.row === "object" ? b.row : {}) as Record<string, unknown>;
      if (!id) { res.status(400).json({ error: "missing_id" }); return; }
      const { data, error } = await db.from(table).update(row).eq("id", id).select().single();
      if (error) { res.status(400).json({ error: "update_failed", detail: error.message }); return; }
      res.status(200).json({ row: data });
      return;
    }

    if (action === "delete") {
      const id = String(b.id ?? "");
      if (!id) { res.status(400).json({ error: "missing_id" }); return; }
      const { error } = await db.from(table).delete().eq("id", id);
      if (error) { res.status(400).json({ error: "delete_failed", detail: error.message }); return; }
      res.status(200).json({ ok: true });
      return;
    }

    res.status(400).json({ error: "unknown_action" });
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: e instanceof Error ? e.message : String(e) });
  }
}
