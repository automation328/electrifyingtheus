// Single editor-gated endpoint for the whole CMS write surface. Consolidated into
// one Serverless Function (dispatched by `op`) to stay under the Hobby-plan
// 12-function limit. Every op verifies the caller is an allow-listed editor
// (Authorization: Bearer <supabase access token>) before touching the DB with the
// service role key.
//
//   POST /api/admin
//   { op: "me" }                                            → { email, role }
//   { op: "editors", action: "list" }                       → { rows }        (admin only)
//   { op: "editors", action: "add",    email, role, createLogin?, password? } → { row, tempPassword?, loginExists? }
//   { op: "editors", action: "set-password", email, password? }              → { ok, tempPassword? }
//   { op: "editors", action: "role",   id, role }           → { row }
//   { op: "editors", action: "remove", id }                 → { ok }
//   { op: "editors", action: "invite", email }              → { ok }
//   { op: "activity" }                                       → { rows }        (editor/admin)
//   { op: "analytics", range? | visitorId? }                 → analytics data (editor/admin)
//   { op: "collection", action: "list",   table }          → { rows }
//   { op: "collection", action: "insert", table, row }     → { row }
//   { op: "collection", action: "update", table, id, row } → { row }
//   { op: "collection", action: "delete", table, id }      → { ok }
//   { op: "upload", filename, contentType, dataUrl }        → { url }
//   { op: "kb", action: "reembed", source, title, body }    → { chunkCount }
//   { op: "kb", action: "remove",  source }                 → { ok }
//
// Env (server-only): SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL/ANON, GEMINI_API_KEY.

import { randomBytes } from "node:crypto";
import { getEditor, requireEditor, adminSupabase } from "./_admin-auth.js";
import { appendActivity, readActivity } from "./_activity-log.js";
import { checkRateLimit, tooManyRequests } from "./_rate-limit.js";
import { verifyReview, eventPath } from "./_event-submission.js";
import { sendEventApprovalEmail } from "./_approval-email.js";
import { analyticsSummary, visitorJourney } from "./_analytics-core.js";
// NOTE: mammoth / pdf-parse are imported LAZILY inside handleKbUpload — a top-level
// import of pdf-parse (pdfjs) crashes the whole serverless function at load, which
// would break every /api/admin op (including the auth check). Keep them lazy.

// ── collection ───────────────────────────────────────────────────────────────
const ALLOWED_TABLES = new Set<string>([
  "site_blog_posts", "site_events", "site_gallery", "site_jobs",
  "site_vehicles", "site_incentives", "site_pages", "kb_source_documents", "site_settings",
]);

// Tables whose rows carry a `status` column, so a delete can ARCHIVE the row
// (status = 'archived') instead of destroying it. Everything here already
// documents 'archived' in its migration, and the public site reads only
// status = 'published', so archiving hides the row exactly like deleting did —
// but it can be restored. site_settings is excluded: it is a key/value config
// table with no status column, and dropping a row there just reverts to the
// coded default, which is already recoverable.
const ARCHIVABLE = new Set<string>([...ALLOWED_TABLES].filter((t) => t !== "site_settings"));

// ── roles / capabilities ──────────────────────────────────────────────────────
// admin  — everything, incl. managing users
// editor — all content + publish + settings + KB; no user management
// author — create/edit content as DRAFTS only; no delete/settings/KB
// viewer — read-only (no writes at all)
const ROLES = new Set(["admin", "editor", "author", "viewer"]);
// Unknown/blank/typo roles resolve to the LEAST privilege (viewer), so a
// garbled row degrades access rather than escalating it.
const normalizeRole = (r: unknown) => { const s = String(r ?? "").trim().toLowerCase(); return ROLES.has(s) ? s : "viewer"; };
const canPublish = (r: string) => r === "admin" || r === "editor";   // publish + delete content
const canSettings = (r: string) => r === "admin" || r === "editor";  // site_settings (theme/nav/footer)
const canKb = (r: string) => r === "admin" || r === "editor";        // EVan knowledge base
const validEmail = (e: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
// A strong, url-safe temporary password (admin shares it; user changes it later).
const genPassword = () => randomBytes(12).toString("base64url");
const forbid = (res: { status: (n: number) => { json: (o: unknown) => void } }, detail: string) => res.status(403).json({ error: "forbidden", detail });

// ── upload ───────────────────────────────────────────────────────────────────
const BUCKET = "site-media";
const MAX_BYTES = 50 * 1024 * 1024; // 50 MB (bucket limit raised in 0009_media_bucket.sql)
const ALLOWED_MIME = new Set([
  "image/png", "image/jpeg", "image/webp", "image/gif", "image/svg+xml",
  "video/mp4", "video/webm", "video/quicktime",
  "audio/mpeg", "audio/mp3", "audio/wav", "audio/ogg", "audio/mp4", "audio/aac", "audio/webm",
]);

// ── kb re-embed ──────────────────────────────────────────────────────────────
const EMBED_MODEL = "gemini-embedding-001"; // 3072-dim, matches vector(3072)
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
const KB_TABLE = "etus_kb_documents";
const MAX_CHARS = 1600;
const OVERLAP = 200;

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

// Best-effort audit log → self-provisioning private Storage bucket (see
// _activity-log.ts). Never throws, so a logging failure can't break the actual
// mutation the caller just performed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logActivity(db: any, actor: string, role: string, action: string, target?: string, summary?: string) {
  await appendActivity(db, actor, role, action, target, summary);
}

function slugName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  const ext = (dot > 0 ? name.slice(dot + 1) : "").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  return `${base}.${ext}`;
}

// Split on '## '/'### ' headings, then hard-wrap long sections with overlap.
function chunk(text: string): { title: string; body: string }[] {
  const blocks: { title: string; body: string[] }[] = [];
  let title = "Intro";
  let cur: string[] = [];
  for (const line of text.split("\n")) {
    const m = /^#{2,4}\s+(.*)/.exec(line.trim());
    if (m) { if (cur.length) blocks.push({ title, body: cur }); title = m[1].trim(); cur = [line]; }
    else cur.push(line);
  }
  if (cur.length) blocks.push({ title, body: cur });

  const chunks: { title: string; body: string }[] = [];
  for (const b of blocks) {
    const body = b.body.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!body) continue;
    if (body.length <= MAX_CHARS) chunks.push({ title: b.title, body });
    else { let i = 0; while (i < body.length) { chunks.push({ title: b.title, body: body.slice(i, i + MAX_CHARS) }); i += MAX_CHARS - OVERLAP; } }
  }
  return chunks;
}

async function embed(text: string, key: string): Promise<number[]> {
  for (let attempt = 0; attempt < 4; attempt++) {
    const r = await fetch(EMBED_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", "x-goog-api-key": key },
      body: JSON.stringify({ content: { parts: [{ text }] } }),
    });
    if (r.ok) {
      const data = (await r.json()) as { embedding?: { values?: number[] } };
      const values = data.embedding?.values;
      if (!values || !values.length) throw new Error("Empty embedding");
      return values;
    }
    if ((r.status === 429 || r.status === 500 || r.status === 503) && attempt < 3) {
      await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
      continue;
    }
    throw new Error(`Embedding failed (${r.status})`);
  }
  throw new Error("Embedding failed after retries");
}

/* ── op handlers ─────────────────────────────────────────────────────────── */

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleCollection(b: Record<string, unknown>, res: any, role: string, actor: string) {
  const action = String(b.action ?? "");
  const table = String(b.table ?? "");
  if (!ALLOWED_TABLES.has(table)) { res.status(400).json({ error: "table_not_allowed" }); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

  const isSettings = table === "site_settings";
  const isKbTable = table === "kb_source_documents";

  if (action === "list") {
    // Reading is allowed for any authorized role (incl. viewer).
    const { data, error } = await db.from(table).select("*").order("created_at", { ascending: false });
    if (error) { res.status(500).json({ error: "query_failed", detail: error.message }); return; }
    res.status(200).json({ rows: data ?? [] });
    return;
  }

  // ── writes: gate by role ──
  if (role === "viewer") { forbid(res, "Your account has read-only access."); return; }
  if (isSettings && !canSettings(role)) { forbid(res, "Only editors and admins can change site settings."); return; }
  if (isKbTable && !canKb(role)) { forbid(res, "Only editors and admins can change the knowledge base."); return; }

  if (action === "insert" || action === "update") {
    const row = (b.row && typeof b.row === "object" ? b.row : {}) as Record<string, unknown>;
    // Authors may only ever save drafts. Give a clear error on an explicit
    // publish, and otherwise FORCE draft — never trust the client's status, and
    // don't rely on the DB default (which is 'published' for some tables). By
    // here an author can only be writing a content table (settings/KB rejected).
    if (role === "author") {
      if (String(row.status ?? "").trim().toLowerCase() === "published") { forbid(res, "Authors can save drafts only — an editor can publish it."); return; }
      row.status = "draft";
    }
    if (action === "insert") {
      const { data, error } = await db.from(table).insert(row).select().single();
      if (error) { res.status(400).json({ error: "insert_failed", detail: error.message }); return; }
      const published = String(data?.status ?? "") === "published";
      await logActivity(db, actor, role, published ? "publish" : "insert", table, String(data?.id ?? ""));
      res.status(200).json({ row: data });
      return;
    }
    const id = String(b.id ?? "");
    if (!id) { res.status(400).json({ error: "missing_id" }); return; }
    const { data, error } = await db.from(table).update(row).eq("id", id).select().single();
    if (error) { res.status(400).json({ error: "update_failed", detail: error.message }); return; }
    const nowPublished = String(data?.status ?? "") === "published";
    await logActivity(db, actor, role, nowPublished && "status" in row ? "publish" : "update", table, id);
    res.status(200).json({ row: data });
    return;
  }
  if (action === "delete") {
    // Deleting content requires publish rights; settings/KB deletes gated above.
    if (!isSettings && !isKbTable && !canPublish(role)) { forbid(res, "Only editors and admins can delete content."); return; }
    const id = String(b.id ?? "");
    if (!id) { res.status(400).json({ error: "missing_id" }); return; }

    // Archive instead of destroy, so a mistaken delete is recoverable. Every
    // content table has a `status` column that already documents 'archived',
    // and the public site only ever reads status = 'published', so an archived
    // row disappears from the live site exactly as a deleted one did.
    if (ARCHIVABLE.has(table)) {
      const { error } = await db.from(table).update({ status: "archived" }).eq("id", id);
      if (error) { res.status(400).json({ error: "archive_failed", detail: error.message }); return; }
      await logActivity(db, actor, role, "archive", table, id);
      res.status(200).json({ ok: true, archived: true });
      return;
    }

    // site_settings has no status column (id/key/value/updated_at) — it is
    // config, not content, and removing a row just reverts to the coded default.
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) { res.status(400).json({ error: "delete_failed", detail: error.message }); return; }
    await logActivity(db, actor, role, "delete", table, id);
    res.status(200).json({ ok: true });
    return;
  }
  if (action === "destroy") {
    // Permanent removal — admins only. This is the one that cannot be undone.
    if (role !== "admin") { forbid(res, "Only admins can permanently delete."); return; }
    const id = String(b.id ?? "");
    if (!id) { res.status(400).json({ error: "missing_id" }); return; }
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) { res.status(400).json({ error: "delete_failed", detail: error.message }); return; }
    await logActivity(db, actor, role, "destroy", table, id);
    res.status(200).json({ ok: true });
    return;
  }
  res.status(400).json({ error: "unknown_action" });
}

// Find a Supabase Auth user by email, paging through the admin list (not just
// the first page — otherwise set-password silently misses users past page 1).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function findAuthUserByEmail(db: any, email: string) {
  for (let page = 1; page <= 25; page++) {
    const { data } = await db.auth.admin.listUsers({ page, perPage: 200 });
    const users = data?.users ?? [];
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const u = users.find((x: any) => String(x.email || "").toLowerCase() === email);
    if (u) return u;
    if (users.length < 200) break; // last page reached
  }
  return null;
}

// ── Form submissions (editor/admin) ──────────────────────────────────────────
// READ-ONLY. The website writes these through api/_submissions.ts; the CMS only
// reads them. Deliberately NOT routed through handleCollection —
// site_form_submissions is not in ALLOWED_TABLES and must never acquire
// insert/update/delete affordances, because it holds visitors' personal data
// and because ARCHIVABLE would otherwise turn a deletion into a status flip.
const SUBMISSION_LIST_COLS =
  "id,created_at,form_type,form_label,first_name,last_name,email,phone,company,city,subject,message,crm_delivery";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleSubmissions(b: Record<string, unknown>, res: any, role: string) {
  if (!canPublish(role)) { forbid(res, "Only editors and admins can view form submissions."); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured", detail: "SUPABASE_SERVICE_ROLE_KEY is not set." }); return; }

  if (String(b.action ?? "list") === "detail") {
    const id = String(b.id ?? "");
    if (!id) { res.status(400).json({ error: "missing_id" }); return; }
    const { data, error } = await db.from("site_form_submissions").select("*").eq("id", id).maybeSingle();
    if (error) { res.status(400).json({ error: "read_failed", detail: error.message }); return; }
    if (!data) { res.status(404).json({ error: "not_found" }); return; }
    res.status(200).json({ row: data });
    return;
  }

  const limit = Math.min(Math.max(Number(b.limit ?? 50) || 50, 1), 200);
  const offset = Math.max(Number(b.offset ?? 0) || 0, 0);
  const formType = String(b.formType ?? "").trim();
  const q = String(b.q ?? "").trim();

  let query = db.from("site_form_submissions")
    .select(SUBMISSION_LIST_COLS, { count: "exact" })
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);
  if (formType) query = query.eq("form_type", formType);
  if (q) {
    // Strip the characters that mean something to LIKE and to PostgREST's or()
    // grammar before interpolating. Same class of bug as the editor lookup that
    // treated an email as a LIKE pattern — do not reintroduce it here.
    const safe = q.replace(/[%_,()]/g, "").slice(0, 80);
    if (safe) {
      const like = `%${safe}%`;
      query = query.or(
        `email.ilike.${like},first_name.ilike.${like},last_name.ilike.${like},` +
        `company.ilike.${like},subject.ilike.${like},message.ilike.${like}`,
      );
    }
  }
  const { data, error, count } = await query;
  if (error) { res.status(400).json({ error: "read_failed", detail: error.message }); return; }

  // Per-type totals drive the filter chips. Cheap while this table is small; if
  // it grows past a few tens of thousands, move it to a counting view.
  const { data: types } = await db.from("site_form_submissions").select("form_type");
  const counts: Record<string, number> = {};
  for (const r of (types ?? []) as { form_type: string }[]) counts[r.form_type] = (counts[r.form_type] ?? 0) + 1;

  res.status(200).json({ rows: data ?? [], total: count ?? 0, counts });
}

// Recent activity log (editors + admins). Read-only view, backed by the private
// Storage-bucket log in _activity-log.ts.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleActivity(res: any, role: string) {
  if (!canPublish(role)) { forbid(res, "Only editors and admins can view activity."); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }
  const rows = await readActivity(db, 200);
  res.status(200).json({ rows });
}

// Editor-gated analytics for the CMS-embedded Statistics view. Same aggregation
// the /admin dashboard uses (api/_analytics-core.ts), but authorized by the
// editor session instead of the separate analytics password.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleAnalytics(b: Record<string, unknown>, res: any, role: string) {
  if (!canPublish(role)) { forbid(res, "Only editors and admins can view statistics."); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }
  if (b.visitorId) {
    const out = await visitorJourney(db, String(b.visitorId));
    if ("error" in out) { res.status(500).json({ error: "query_failed", detail: out.error }); return; }
    res.status(200).json(out.data);
    return;
  }
  const out = await analyticsSummary(db, b.range);
  if ("error" in out) { res.status(500).json({ error: "query_failed", detail: out.error }); return; }
  res.status(200).json(out.data);
}

// ── users / editors allow-list (admin only) ───────────────────────────────────
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEditors(b: Record<string, unknown>, res: any, role: string, selfEmail: string) {
  if (role !== "admin") { forbid(res, "Only admins can manage users."); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }
  const action = String(b.action ?? "");

  if (action === "list") {
    const { data, error } = await db.from("editors").select("id,email,role,created_at").order("created_at", { ascending: true });
    if (error) { res.status(500).json({ error: "query_failed", detail: error.message }); return; }
    res.status(200).json({ rows: data ?? [] });
    return;
  }
  if (action === "add") {
    const email = String(b.email ?? "").trim().toLowerCase();
    if (!validEmail(email)) { res.status(400).json({ error: "bad_email", detail: "Enter a valid email address." }); return; }
    const { data, error } = await db.from("editors").insert({ email, role: normalizeRole(b.role) }).select("id,email,role,created_at").single();
    if (error) {
      const dup = /duplicate|unique/i.test(error.message);
      res.status(dup ? 409 : 400).json({ error: dup ? "already_exists" : "insert_failed", detail: dup ? "That email is already a user." : error.message });
      return;
    }
    // Optionally provision the Supabase Auth login so no dashboard trip is needed.
    let tempPassword: string | undefined;
    let loginExists = false;
    let loginError: string | undefined;
    if (b.createLogin === true) {
      const provided = typeof b.password === "string" && b.password.length >= 8 ? b.password : "";
      const pwd = provided || genPassword();
      try {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error: cErr } = await (db as any).auth.admin.createUser({ email, password: pwd, email_confirm: true });
        if (cErr) {
          if (/registered|already|exists/i.test(cErr.message)) loginExists = true;
          else loginError = cErr.message;
        } else if (!provided) {
          tempPassword = pwd; // reveal only the generated one
        }
      } catch (e) { loginError = e instanceof Error ? e.message : String(e); }
    }
    await logActivity(db, selfEmail, role, "user.add", email, `role ${normalizeRole(b.role)}`);
    res.status(200).json({ row: data, tempPassword, loginExists, loginError });
    return;
  }
  if (action === "set-password") {
    const email = String(b.email ?? "").trim().toLowerCase();
    if (!validEmail(email)) { res.status(400).json({ error: "bad_email" }); return; }
    // Defense-in-depth: only manage passwords for users in the allow-list, so an
    // admin can't reset arbitrary (possibly shared-pool) accounts from here.
    const { data: ed } = await db.from("editors").select("id").eq("email", email).maybeSingle();
    if (!ed) { res.status(400).json({ error: "not_an_editor", detail: "That email isn't in the users list — add them first." }); return; }
    const provided = typeof b.password === "string" && b.password.length >= 8 ? b.password : "";
    const pwd = provided || genPassword();
    try {
      const user = await findAuthUserByEmail(db, email);
      if (user) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (db as any).auth.admin.updateUserById(user.id, { password: pwd });
        if (error) { res.status(400).json({ error: "set_password_failed", detail: error.message }); return; }
      } else {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const { error } = await (db as any).auth.admin.createUser({ email, password: pwd, email_confirm: true });
        if (error) { res.status(400).json({ error: "set_password_failed", detail: error.message }); return; }
      }
      await logActivity(db, selfEmail, role, "user.password", email);
      res.status(200).json({ ok: true, tempPassword: provided ? undefined : pwd });
    } catch (e) {
      res.status(400).json({ error: "set_password_failed", detail: e instanceof Error ? e.message : String(e) });
    }
    return;
  }
  if (action === "role") {
    const id = String(b.id ?? "");
    if (!id) { res.status(400).json({ error: "missing_id" }); return; }
    const roleVal = normalizeRole(b.role);
    const { data: target } = await db.from("editors").select("email,role").eq("id", id).maybeSingle();
    if (target && target.role === "admin" && roleVal !== "admin") {
      const { count } = await db.from("editors").select("id", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) { res.status(400).json({ error: "last_admin", detail: "There must be at least one admin." }); return; }
    }
    const { data, error } = await db.from("editors").update({ role: roleVal }).eq("id", id).select("id,email,role,created_at").single();
    if (error) { res.status(400).json({ error: "update_failed", detail: error.message }); return; }
    await logActivity(db, selfEmail, role, "user.role", String(data?.email ?? ""), `→ ${roleVal}`);
    res.status(200).json({ row: data });
    return;
  }
  if (action === "remove") {
    const id = String(b.id ?? "");
    if (!id) { res.status(400).json({ error: "missing_id" }); return; }
    const { data: target } = await db.from("editors").select("email,role").eq("id", id).maybeSingle();
    if (!target) { res.status(404).json({ error: "not_found" }); return; }
    if (String(target.email).toLowerCase() === selfEmail.toLowerCase()) { res.status(400).json({ error: "cant_remove_self", detail: "You can't remove your own access." }); return; }
    if (target.role === "admin") {
      const { count } = await db.from("editors").select("id", { count: "exact", head: true }).eq("role", "admin");
      if ((count ?? 0) <= 1) { res.status(400).json({ error: "last_admin", detail: "There must be at least one admin." }); return; }
    }
    const { error } = await db.from("editors").delete().eq("id", id);
    if (error) { res.status(400).json({ error: "delete_failed", detail: error.message }); return; }
    await logActivity(db, selfEmail, role, "user.remove", String(target.email ?? ""));
    res.status(200).json({ ok: true });
    return;
  }
  if (action === "invite") {
    const email = String(b.email ?? "").trim().toLowerCase();
    if (!validEmail(email)) { res.status(400).json({ error: "bad_email" }); return; }
    try {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { error } = await (db as any).auth.admin.inviteUserByEmail(email);
      if (error) { res.status(400).json({ error: "invite_failed", detail: error.message }); return; }
      res.status(200).json({ ok: true });
    } catch (e) {
      res.status(400).json({ error: "invite_failed", detail: e instanceof Error ? e.message : String(e) });
    }
    return;
  }
  res.status(400).json({ error: "unknown_action" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleUpload(b: Record<string, unknown>, res: any) {
  const contentType = String(b.contentType ?? "").toLowerCase();
  const filename = String(b.filename ?? "image");
  const dataUrl = String(b.dataUrl ?? "");
  if (!ALLOWED_MIME.has(contentType)) { res.status(400).json({ error: "unsupported_type", detail: "Use PNG, JPEG, WebP, GIF, MP4, WebM, or MOV." }); return; }

  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  let buffer: Buffer;
  try { buffer = Buffer.from(base64, "base64"); } catch { res.status(400).json({ error: "bad_data" }); return; }
  if (buffer.length === 0) { res.status(400).json({ error: "empty_file" }); return; }
  if (buffer.length > MAX_BYTES) { res.status(400).json({ error: "too_large", detail: "Max file size is 50 MB." }); return; }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }
  const path = `cms/${Date.now()}-${slugName(filename)}`;
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
  if (error) { res.status(400).json({ error: "upload_failed", detail: error.message }); return; }
  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  res.status(200).json({ url: data.publicUrl });
}

// List everything in the media bucket (images + any video files) so the CMS can
// offer a "pick from library" experience instead of re-uploading.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMediaList(res: any) {
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }
  const { data, error } = await db.storage.from(BUCKET).list("cms", {
    limit: 200,
    sortBy: { column: "created_at", order: "desc" },
  });
  if (error) { res.status(500).json({ error: "list_failed", detail: error.message }); return; }
  const VIDEO = /\.(mp4|webm|mov|m4v)$/i;
  const AUDIO = /\.(mp3|wav|ogg|m4a|aac)$/i;
  const items = (data ?? [])
    .filter((f) => f.name && !f.name.startsWith(".")) // skip folder placeholders
    .map((f) => {
      const path = `cms/${f.name}`;
      const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      const kind = AUDIO.test(f.name) ? "audio" : VIDEO.test(f.name) ? "video" : "image";
      return { name: f.name, url, kind };
    });
  res.status(200).json({ items });
}

// Delete a media object by name (from the cms/ folder).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleMediaDelete(b: Record<string, unknown>, res: any) {
  const name = String(b.name ?? "").replace(/^cms\//, "");
  if (!name || name.includes("/")) { res.status(400).json({ error: "bad_name" }); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }
  const { error } = await db.storage.from(BUCKET).remove([`cms/${name}`]);
  if (error) { res.status(400).json({ error: "delete_failed", detail: error.message }); return; }
  res.status(200).json({ ok: true });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleKb(b: Record<string, unknown>, res: any, role: string, actor: string) {
  const action = String(b.action ?? "");
  const source = String(b.source ?? "").trim();
  if (!source) { res.status(400).json({ error: "missing_source" }); return; }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

  const del = await db.from(KB_TABLE).delete().filter("metadata->>source", "eq", source);
  if (del.error) { res.status(500).json({ error: "clear_failed", detail: del.error.message }); return; }

  if (action === "remove") { await logActivity(db, actor, role, "kb", source, "removed"); res.status(200).json({ ok: true }); return; }
  if (action !== "reembed") { res.status(400).json({ error: "unknown_action" }); return; }

  const key = process.env.GEMINI_API_KEY;
  if (!key) { res.status(500).json({ error: "no_gemini_key", detail: "Set GEMINI_API_KEY." }); return; }

  const title = String(b.title ?? "");
  const body = String(b.body ?? "");
  const chunks = chunk(body);
  if (!chunks.length) { res.status(200).json({ chunkCount: 0 }); return; }

  let ok = 0;
  try {
    for (let i = 0; i < chunks.length; i++) {
      const c = chunks[i];
      const vec = await embed(c.body, key);
      const row = {
        content: c.body,
        metadata: { source, title: c.title || title, chunk: i },
        embedding: `[${vec.map((x) => x.toFixed(6)).join(",")}]`,
      };
      const ins = await db.from(KB_TABLE).insert(row);
      if (ins.error) throw new Error(ins.error.message);
      ok++;
    }
  } catch (e) {
    res.status(500).json({ error: "embed_failed", detail: e instanceof Error ? e.message : String(e), inserted: ok });
    return;
  }
  await logActivity(db, actor, role, "kb", source, `re-embedded (${ok} chunks)`);
  res.status(200).json({ chunkCount: ok });
}

const plainSlug = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

// Chunk + embed a source's body into the live vector store (replacing its rows).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function reembedSource(db: any, source: string, title: string, body: string, key: string): Promise<number> {
  await db.from(KB_TABLE).delete().filter("metadata->>source", "eq", source);
  const chunks = chunk(body);
  let ok = 0;
  for (let i = 0; i < chunks.length; i++) {
    const c = chunks[i];
    const vec = await embed(c.body, key);
    const ins = await db.from(KB_TABLE).insert({ content: c.body, metadata: { source, title: c.title || title, chunk: i }, embedding: `[${vec.map((x) => x.toFixed(6)).join(",")}]` });
    if (ins.error) throw new Error(ins.error.message);
    ok++;
  }
  return ok;
}

// Upload a document (PDF / DOCX / TXT / MD): extract text, upsert a KB source doc,
// and (if published) re-embed it into the live vector store.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleKbUpload(b: Record<string, unknown>, res: any, role: string, actor: string) {
  const filename = String(b.filename ?? "document");
  const contentType = String(b.contentType ?? "").toLowerCase();
  const dataUrl = String(b.dataUrl ?? "");
  const status = String(b.status ?? "published") === "draft" ? "draft" : "published";

  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  let buffer: Buffer;
  try { buffer = Buffer.from(base64, "base64"); } catch { res.status(400).json({ error: "bad_data" }); return; }
  if (!buffer.length) { res.status(400).json({ error: "empty_file" }); return; }
  if (buffer.length > 25 * 1024 * 1024) { res.status(400).json({ error: "too_large", detail: "Max document size is 25 MB." }); return; }

  const lower = filename.toLowerCase();
  let text = "";
  try {
    if (contentType.includes("pdf") || lower.endsWith(".pdf")) {
      // Lazy import — isolate any pdfjs load failure to PDF uploads only.
      const { PDFParse } = await import("pdf-parse");
      const parser = new PDFParse({ data: buffer });
      const r = await parser.getText();
      text = r.text || "";
    } else if (contentType.includes("wordprocessingml") || lower.endsWith(".docx")) {
      const mod = await import("mammoth");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const mammoth: any = (mod as any).default ?? mod;
      const r = await mammoth.extractRawText({ buffer });
      text = r.value || "";
    } else if (contentType.startsWith("text/") || lower.endsWith(".txt") || lower.endsWith(".md")) {
      text = buffer.toString("utf8");
    } else {
      res.status(400).json({ error: "unsupported_type", detail: "Upload a PDF, DOCX, TXT, or MD file." });
      return;
    }
  } catch (e) {
    res.status(400).json({ error: "extract_failed", detail: e instanceof Error ? e.message : String(e) });
    return;
  }

  text = text.replace(/\r\n/g, "\n").replace(/\n{3,}/g, "\n\n").trim();
  if (!text) { res.status(400).json({ error: "no_text", detail: "No text could be extracted — the file may be scanned images." }); return; }

  const baseName = filename.replace(/\.[^.]+$/, "");
  const source = plainSlug(baseName) || `doc-${Date.now()}`;
  const title = String(b.title ?? "").trim() || baseName;

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

  // Upsert the editable source document.
  const { data: existing } = await db.from("kb_source_documents").select("id").eq("source", source).maybeSingle();
  const rowFields = { source, title, body: text, status, updated_at: new Date().toISOString() };
  let rowId = existing?.id as string | undefined;
  if (rowId) {
    const { error } = await db.from("kb_source_documents").update(rowFields).eq("id", rowId);
    if (error) { res.status(400).json({ error: "save_failed", detail: error.message }); return; }
  } else {
    const { data, error } = await db.from("kb_source_documents").insert(rowFields).select("id").single();
    if (error) { res.status(400).json({ error: "save_failed", detail: error.message }); return; }
    rowId = data?.id;
  }

  // Sync the vector store.
  let chunkCount = 0;
  if (status === "published") {
    const key = process.env.GEMINI_API_KEY;
    if (!key) { res.status(500).json({ error: "no_gemini_key", detail: "Set GEMINI_API_KEY to embed documents." }); return; }
    try {
      chunkCount = await reembedSource(db, source, title, text, key);
    } catch (e) {
      res.status(500).json({ error: "embed_failed", detail: e instanceof Error ? e.message : String(e) });
      return;
    }
    if (rowId) await db.from("kb_source_documents").update({ last_embedded_at: new Date().toISOString(), chunk_count: chunkCount }).eq("id", rowId);
  } else {
    await db.from(KB_TABLE).delete().filter("metadata->>source", "eq", source);
  }

  await logActivity(db, actor, role, "kb", source, `uploaded ${title} (${chunkCount} chunks)`);
  res.status(200).json({ source, title, chars: text.length, chunkCount });
}

// ── Event submission review (the Slack Approve / Reject links) ───────────────

const htmlEsc = (s: string) =>
  String(s ?? "").replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");

/** A plain confirmation page. Whoever clicked is a colleague in Slack, not an
 *  API client, so this answers in something readable rather than JSON. */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
function reviewPage(res: any, code: number, heading: string, body: string, link?: { href: string; label: string }) {
  const page = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>${htmlEsc(heading)}</title>
<style>
 body{margin:0;min-height:100vh;display:grid;place-items:center;background:#f6f8fb;
      font:16px/1.6 ui-sans-serif,system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;color:#1b2430}
 .card{max-width:34rem;margin:1.5rem;padding:2rem 2.25rem;background:#fff;border:1px solid #dfe6ef;
       border-radius:1rem;box-shadow:0 1px 3px rgba(16,32,55,.06)}
 h1{margin:0 0 .5rem;font-size:1.4rem}
 p{margin:0 0 1rem;color:#4a5769}
 a{display:inline-block;margin-top:.25rem;padding:.6rem 1.1rem;border-radius:.7rem;
   background:#0057b8;color:#fff;text-decoration:none;font-weight:600}
</style></head><body><div class="card">
<h1>${htmlEsc(heading)}</h1><p>${body}</p>
${link ? `<a href="${htmlEsc(link.href)}">${htmlEsc(link.label)}</a>` : ""}
</div></body></html>`;
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  res.setHeader("Cache-Control", "no-store");
  res.status(code).send(page);
}

/**
 * Email the organiser that their event is live, and record the outcome.
 *
 * Shared by BOTH ways an event gets approved — the Slack link below and the
 * publish toggle in /admin/content — so the two cannot drift apart.
 *
 * approval_emailed_at is what makes this idempotent. An editor who unpublishes
 * and republishes an event must not email the organiser twice, and re-clicking
 * a Slack link must not either.
 */
export async function notifyOrganiser(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  db: any,
  eventId: string,
): Promise<{ sent: boolean; detail: string }> {
  const { data: ev } = await db
    .from("site_events").select("id,title,event_date,status").eq("id", eventId).maybeSingle();
  if (!ev) return { sent: false, detail: "event not found" };
  if (ev.status !== "published") return { sent: false, detail: "event is not published" };

  const { data: sub } = await db
    .from("site_event_submissions")
    .select("id,submitter_name,submitter_email,ghl_contact_id,approval_emailed_at")
    .eq("event_id", eventId).maybeSingle();
  // Not every event came from the form. Most did not — 120 arrived by import.
  if (!sub) return { sent: false, detail: "not a form submission" };
  if (sub.approval_emailed_at) return { sent: false, detail: "organiser already notified" };

  const site = process.env.PUBLIC_SITE_URL || "https://electrifyingtheus.com";
  const result = await sendEventApprovalEmail({
    toEmail: sub.submitter_email || "",
    toName: sub.submitter_name || "",
    ghlContactId: sub.ghl_contact_id,
    eventTitle: ev.title || "",
    eventUrl: `${site}${eventPath(ev.title || "", ev.event_date || "")}`,
  });

  // Stamp on success only, so a failure can be retried by publishing again.
  // The error is stored either way — an editor should be able to see WHY the
  // organiser never heard back without reading server logs.
  await db.from("site_event_submissions").update(
    result.ok
      ? { approval_emailed_at: new Date().toISOString(), approval_email_error: null }
      : { approval_email_error: result.error?.slice(0, 500) ?? "unknown" },
  ).eq("id", sub.id);

  return result.ok
    ? { sent: true, detail: "organiser emailed" }
    : { sent: false, detail: result.error ?? "email failed" };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleEventReview(req: any, res: any) {
  // Rate limited like every other unauthenticated path here. A signature guess
  // is cheap for an attacker and a database round trip for us.
  const rl = await checkRateLimit(req, { bucket: "event-review", limit: 60, windowMinutes: 60 });
  if (!rl.ok) { reviewPage(res, 429, "Too many attempts", "Try again in a little while."); return; }

  const id = String(req.query?.id ?? "");
  const action = String(req.query?.action ?? "");
  const exp = Number(req.query?.exp ?? 0);
  const sig = String(req.query?.sig ?? "");

  if (action !== "approve" && action !== "reject") {
    reviewPage(res, 400, "Unknown action", "That link does not do anything we recognise."); return;
  }

  const v = verifyReview(id, action, exp, sig);
  if (!v.ok) {
    const msg = v.reason === "expired"
      ? "This approval link has expired. Open the event in the CMS and publish it there instead."
      : v.reason === "unconfigured"
        ? "Event review links are not configured on this deployment (EVENT_REVIEW_SECRET is unset)."
        : "This link is not valid.";
    reviewPage(res, 400, "Link not accepted", htmlEsc(msg),
      { href: "/admin/content", label: "Open the CMS" });
    return;
  }

  const db = adminSupabase();
  if (!db) { reviewPage(res, 500, "Not configured", "The database connection is not set up."); return; }

  const { data: ev } = await db
    .from("site_events").select("id,title,status,event_date").eq("id", id).maybeSingle();
  if (!ev) {
    reviewPage(res, 404, "Event not found", "It may have been deleted since this message was posted.",
      { href: "/admin/content", label: "Open the CMS" });
    return;
  }

  // Only a draft is reviewable. Anything else means somebody already dealt with
  // it — say so plainly rather than silently flipping a live event.
  if (ev.status !== "draft") {
    reviewPage(res, 200, "Already handled",
      `<strong>${htmlEsc(ev.title || "This event")}</strong> is already marked <em>${htmlEsc(ev.status)}</em>, so this link did nothing.`,
      { href: "/admin/content", label: "Open the CMS" });
    return;
  }

  if (action === "reject") {
    await db.from("site_events").update({ status: "archived" }).eq("id", id);
    reviewPage(res, 200, "Rejected",
      `<strong>${htmlEsc(ev.title || "The event")}</strong> has been archived. It is not on the site, and no email was sent to the organiser.`,
      { href: "/admin/content", label: "Open the CMS" });
    return;
  }

  await db.from("site_events").update({ status: "published" }).eq("id", id);
  const notify = await notifyOrganiser(db, id);
  const site = process.env.PUBLIC_SITE_URL || "https://electrifyingtheus.com";
  const path = eventPath(ev.title || "", ev.event_date || "");
  reviewPage(res, 200, "Published",
    `<strong>${htmlEsc(ev.title || "The event")}</strong> is now live. ${
      notify.sent
        ? "The organiser has been emailed their event link."
        : `The organiser was <em>not</em> emailed — ${htmlEsc(notify.detail)}.`
    }`,
    { href: `${site}${path}`, label: "View the event" });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  // The ONE unauthenticated entry point on this endpoint: the Approve / Reject
  // links in the Slack event-submission message. A browser follows them, so it
  // arrives as a GET and answers in HTML rather than JSON.
  //
  // It is not protected by a session — it is protected by an expiring HMAC over
  // (id, action, expiry). Clicking is the authorization, which is why the link
  // only ever goes to a private internal channel and why it can do exactly two
  // things to exactly one row. See api/_event-submission.ts.
  if (req.method === "GET" && String(req.query?.op ?? "") === "event-review") {
    await handleEventReview(req, res);
    return;
  }
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }

  const parsed = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = parsed && typeof parsed === "object" ? parsed : {};
  const op = String(b.op ?? "");

  // "me" reports authorization status (used by the admin UI on load). Return the
  // NORMALIZED role so the client sees the same canonical value the server
  // authorizes with (avoids case-mismatch lockouts / hidden over-grants).
  if (op === "me") {
    const editor = await getEditor(req);
    if (!editor) { res.status(401).json({ error: "unauthorized" }); return; }
    res.status(200).json({ email: editor.email, role: normalizeRole(editor.role) });
    return;
  }

  // Bound the UNAUTHENTICATED surface. requireEditor below verifies the token
  // with GoTrue and checks the editors allow-list — both of which cost a network
  // round trip on every call, including every failed one. Without a limit, an
  // attacker can drive that loop for free while guessing tokens. The budget is
  // high (300/hour) because a real editor working through a media library or a
  // long list makes a lot of legitimate calls.
  const rl = await checkRateLimit(req, { bucket: "admin", limit: 300, windowMinutes: 60 });
  if (!rl.ok) { tooManyRequests(res, rl); return; }

  const editor = await requireEditor(req, res);
  if (!editor) return; // 401 already sent
  const role = normalizeRole(editor.role);

  try {
    if (op === "editors") return void (await handleEditors(b, res, role, editor.email));
    if (op === "activity") return void (await handleActivity(res, role));
    if (op === "submissions") return void (await handleSubmissions(b, res, role));
    // Fired by the CMS right after it publishes an event, so approving in
    // /admin/content emails the organiser exactly as the Slack link does. It has
    // to come through the server: the publish toggle writes to Supabase straight
    // from the browser, which can neither reach GoHighLevel nor read
    // site_event_submissions (RLS, no policies — 0025).
    //
    // Safe to call for ANY event. notifyOrganiser returns "not a form
    // submission" for the 120 imported ones and "already notified" on a
    // re-publish, so the CMS can call it blindly without knowing which is which.
    if (op === "event-published") {
      if (role === "viewer") return void forbid(res, "Your account has read-only access.");
      const db = adminSupabase();
      if (!db) { res.status(500).json({ error: "not_configured" }); return; }
      const r = await notifyOrganiser(db, String(b.id ?? ""));
      res.status(200).json({ ok: true, ...r });
      return;
    }
    if (op === "analytics") return void (await handleAnalytics(b, res, role));
    if (op === "collection") return void (await handleCollection(b, res, role, editor.email));
    if (op === "upload") { if (role === "viewer") return void forbid(res, "Your account has read-only access."); return void (await handleUpload(b, res)); }
    if (op === "media-list") return void (await handleMediaList(res));
    if (op === "media-delete") { if (!canPublish(role)) return void forbid(res, "Only editors and admins can delete media."); return void (await handleMediaDelete(b, res)); }
    if (op === "kb") { if (!canKb(role)) return void forbid(res, "Only editors and admins can change the knowledge base."); return void (await handleKb(b, res, role, editor.email)); }
    if (op === "kb-upload") { if (!canKb(role)) return void forbid(res, "Only editors and admins can change the knowledge base."); return void (await handleKbUpload(b, res, role, editor.email)); }
    res.status(400).json({ error: "unknown_op" });
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: e instanceof Error ? e.message : String(e) });
  }
}
