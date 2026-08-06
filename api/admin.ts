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
// NOTE: mammoth / pdf-parse are imported LAZILY inside handleKbUpload — a top-level
// import of pdf-parse (pdfjs) crashes the whole serverless function at load, which
// would break every /api/admin op (including the auth check). Keep them lazy.

// ── collection ───────────────────────────────────────────────────────────────
const ALLOWED_TABLES = new Set<string>([
  "site_blog_posts", "site_events", "site_gallery", "site_jobs",
  "site_vehicles", "site_incentives", "site_pages", "kb_source_documents", "site_settings",
]);

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
  "image/png", "image/jpeg", "image/webp", "image/gif",
  "video/mp4", "video/webm", "video/quicktime",
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

// Best-effort audit log — never throws, so a missing table or write error can't
// break the actual mutation the caller just performed.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function logActivity(db: any, actor: string, role: string, action: string, target?: string, summary?: string) {
  try { await db.from("site_activity").insert({ actor, role, action, target: target ?? null, summary: summary ?? null }); }
  catch { /* table may not exist yet — ignore */ }
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
    const { error } = await db.from(table).delete().eq("id", id);
    if (error) { res.status(400).json({ error: "delete_failed", detail: error.message }); return; }
    await logActivity(db, actor, role, "delete", table, id);
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

// Recent activity log (editors + admins). Read-only view.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function handleActivity(res: any, role: string) {
  if (!canPublish(role)) { forbid(res, "Only editors and admins can view activity."); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }
  const { data, error } = await db.from("site_activity").select("id,created_at,actor,role,action,target,summary").order("created_at", { ascending: false }).limit(200);
  if (error) { res.status(500).json({ error: "query_failed", detail: error.message }); return; }
  res.status(200).json({ rows: data ?? [] });
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
  const items = (data ?? [])
    .filter((f) => f.name && !f.name.startsWith(".")) // skip folder placeholders
    .map((f) => {
      const path = `cms/${f.name}`;
      const url = db.storage.from(BUCKET).getPublicUrl(path).data.publicUrl;
      return { name: f.name, url, kind: VIDEO.test(f.name) ? "video" : "image" };
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
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

  const editor = await requireEditor(req, res);
  if (!editor) return; // 401 already sent
  const role = normalizeRole(editor.role);

  try {
    if (op === "editors") return void (await handleEditors(b, res, role, editor.email));
    if (op === "activity") return void (await handleActivity(res, role));
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
