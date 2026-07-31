// Editor-gated re-embedding for EVan's knowledge base. Chunks a source document,
// embeds each chunk with Gemini `gemini-embedding-001` (3072-dim, matching the
// live vector store), and replaces that source's rows in `etus_kb_documents` —
// the table the n8n agent retrieves from (see n8n/etus_kb_documents.sql).
//
//   POST /api/admin/kb-ingest
//   { action: "reembed", source, title, body } → { chunkCount }
//   { action: "remove",  source }              → { ok: true }   (drops its chunks)
//
// Env (server-only): GEMINI_API_KEY, SUPABASE_SERVICE_ROLE_KEY (+ Supabase URL).

import { requireEditor, adminSupabase } from "../_admin-auth";

const EMBED_MODEL = "gemini-embedding-001"; // 3072-dim, matches vector(3072)
const EMBED_URL = `https://generativelanguage.googleapis.com/v1beta/models/${EMBED_MODEL}:embedContent`;
const KB_TABLE = "etus_kb_documents";
const MAX_CHARS = 1600; // ~400 tokens/chunk
const OVERLAP = 200;

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

// Split on '## '/'### ' headings, then hard-wrap long sections with overlap.
// (Ported from scripts/ingest_kb.py so the CMS is self-contained.)
function chunk(text: string): { title: string; body: string }[] {
  const blocks: { title: string; body: string[] }[] = [];
  let title = "Intro";
  let cur: string[] = [];
  for (const line of text.split("\n")) {
    const m = /^#{2,4}\s+(.*)/.exec(line.trim());
    if (m) {
      if (cur.length) blocks.push({ title, body: cur });
      title = m[1].trim();
      cur = [line];
    } else {
      cur.push(line);
    }
  }
  if (cur.length) blocks.push({ title, body: cur });

  const chunks: { title: string; body: string }[] = [];
  for (const b of blocks) {
    const body = b.body.join("\n").replace(/\n{3,}/g, "\n\n").trim();
    if (!body) continue;
    if (body.length <= MAX_CHARS) {
      chunks.push({ title: b.title, body });
    } else {
      let i = 0;
      while (i < body.length) {
        chunks.push({ title: b.title, body: body.slice(i, i + MAX_CHARS) });
        i += MAX_CHARS - OVERLAP;
      }
    }
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

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }

  const editor = await requireEditor(req, res);
  if (!editor) return;

  const parsed = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = parsed && typeof parsed === "object" ? parsed : {};
  const action = String(b.action ?? "");
  const source = String(b.source ?? "").trim();
  if (!source) { res.status(400).json({ error: "missing_source" }); return; }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

  // Drop this source's existing chunks (both actions start by clearing).
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
