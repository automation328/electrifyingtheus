// Single editor-gated endpoint for the whole CMS write surface. Consolidated into
// one Serverless Function (dispatched by `op`) to stay under the Hobby-plan
// 12-function limit. Every op verifies the caller is an allow-listed editor
// (Authorization: Bearer <supabase access token>) before touching the DB with the
// service role key.
//
//   POST /api/admin
//   { op: "me" }                                            → { email, role }
//   { op: "collection", action: "list",   table }          → { rows }
//   { op: "collection", action: "insert", table, row }     → { row }
//   { op: "collection", action: "update", table, id, row } → { row }
//   { op: "collection", action: "delete", table, id }      → { ok }
//   { op: "upload", filename, contentType, dataUrl }        → { url }
//   { op: "kb", action: "reembed", source, title, body }    → { chunkCount }
//   { op: "kb", action: "remove",  source }                 → { ok }
//
// Env (server-only): SUPABASE_SERVICE_ROLE_KEY, VITE_SUPABASE_URL/ANON, GEMINI_API_KEY.

import { getEditor, requireEditor, adminSupabase } from "./_admin-auth.js";
import mammoth from "mammoth";
import { PDFParse } from "pdf-parse";

// ── collection ───────────────────────────────────────────────────────────────
const ALLOWED_TABLES = new Set<string>([
  "site_blog_posts", "site_events", "site_gallery", "site_jobs",
  "site_vehicles", "site_incentives", "site_pages", "kb_source_documents", "site_settings",
]);

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
async function handleCollection(b: Record<string, unknown>, res: any) {
  const action = String(b.action ?? "");
  const table = String(b.table ?? "");
  if (!ALLOWED_TABLES.has(table)) { res.status(400).json({ error: "table_not_allowed" }); return; }
  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

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
async function handleKb(b: Record<string, unknown>, res: any) {
  const action = String(b.action ?? "");
  const source = String(b.source ?? "").trim();
  if (!source) { res.status(400).json({ error: "missing_source" }); return; }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

  const del = await db.from(KB_TABLE).delete().filter("metadata->>source", "eq", source);
  if (del.error) { res.status(500).json({ error: "clear_failed", detail: del.error.message }); return; }

  if (action === "remove") { res.status(200).json({ ok: true }); return; }
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
async function handleKbUpload(b: Record<string, unknown>, res: any) {
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
      const parser = new PDFParse({ data: buffer });
      const r = await parser.getText();
      text = r.text || "";
    } else if (contentType.includes("wordprocessingml") || lower.endsWith(".docx")) {
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

  res.status(200).json({ source, title, chars: text.length, chunkCount });
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }

  const parsed = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = parsed && typeof parsed === "object" ? parsed : {};
  const op = String(b.op ?? "");

  // "me" reports authorization status (used by the admin UI on load).
  if (op === "me") {
    const editor = await getEditor(req);
    if (!editor) { res.status(401).json({ error: "unauthorized" }); return; }
    res.status(200).json({ email: editor.email, role: editor.role });
    return;
  }

  const editor = await requireEditor(req, res);
  if (!editor) return; // 401 already sent

  try {
    if (op === "collection") return void (await handleCollection(b, res));
    if (op === "upload") return void (await handleUpload(b, res));
    if (op === "media-list") return void (await handleMediaList(res));
    if (op === "media-delete") return void (await handleMediaDelete(b, res));
    if (op === "kb") return void (await handleKb(b, res));
    if (op === "kb-upload") return void (await handleKbUpload(b, res));
    res.status(400).json({ error: "unknown_op" });
  } catch (e) {
    res.status(500).json({ error: "server_error", detail: e instanceof Error ? e.message : String(e) });
  }
}
