// Editor-gated image upload for the CMS. Accepts a base64 data URL, stores the
// file in the public `site-media` Supabase Storage bucket with the service role
// key, and returns the public object URL (which gets saved on the content row).
//
// Bucket is defined in supabase/migrations/0002_storage_media.sql (public,
// 10 MB, png/jpeg/webp/gif).

import { requireEditor, adminSupabase } from "../_admin-auth";

const BUCKET = "site-media";
const MAX_BYTES = 10 * 1024 * 1024;
const ALLOWED = new Set(["image/png", "image/jpeg", "image/webp", "image/gif"]);

function safeJson(s: string): unknown {
  try { return JSON.parse(s); } catch { return null; }
}

// "photo.PNG" → "photo.png"; strip anything unsafe for an object key.
function slugName(name: string): string {
  const dot = name.lastIndexOf(".");
  const base = (dot > 0 ? name.slice(0, dot) : name).toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60) || "image";
  const ext = (dot > 0 ? name.slice(dot + 1) : "").toLowerCase().replace(/[^a-z0-9]/g, "") || "png";
  return `${base}.${ext}`;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "POST") { res.status(405).json({ error: "method_not_allowed" }); return; }

  const editor = await requireEditor(req, res);
  if (!editor) return;

  const parsed = (typeof req.body === "string" ? safeJson(req.body) : req.body) as Record<string, unknown> | null;
  const b = parsed && typeof parsed === "object" ? parsed : {};

  const contentType = String(b.contentType ?? "").toLowerCase();
  const filename = String(b.filename ?? "image");
  const dataUrl = String(b.dataUrl ?? "");

  if (!ALLOWED.has(contentType)) { res.status(400).json({ error: "unsupported_type", detail: "Use PNG, JPEG, WebP, or GIF." }); return; }

  const comma = dataUrl.indexOf(",");
  const base64 = comma >= 0 ? dataUrl.slice(comma + 1) : dataUrl;
  let buffer: Buffer;
  try {
    buffer = Buffer.from(base64, "base64");
  } catch {
    res.status(400).json({ error: "bad_data" });
    return;
  }
  if (buffer.length === 0) { res.status(400).json({ error: "empty_file" }); return; }
  if (buffer.length > MAX_BYTES) { res.status(400).json({ error: "too_large", detail: "Max image size is 10 MB." }); return; }

  const db = adminSupabase();
  if (!db) { res.status(500).json({ error: "not_configured" }); return; }

  const path = `cms/${Date.now()}-${slugName(filename)}`;
  const { error } = await db.storage.from(BUCKET).upload(path, buffer, { contentType, upsert: false });
  if (error) { res.status(400).json({ error: "upload_failed", detail: error.message }); return; }

  const { data } = db.storage.from(BUCKET).getPublicUrl(path);
  res.status(200).json({ url: data.publicUrl });
}
