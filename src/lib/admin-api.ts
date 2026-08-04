// Thin client for the CMS write API (/api/admin/*). Every call attaches the
// editor's Supabase access token; the server verifies it and the editor
// allow-list before touching the database (see api/_admin-auth.ts).

import { getAccessToken } from "@/lib/auth";

export type AdminTable =
  | "site_blog_posts"
  | "site_events"
  | "site_gallery"
  | "site_jobs"
  | "site_vehicles"
  | "site_incentives"
  | "site_pages"
  | "kb_source_documents";

// Single editor-gated endpoint; the `op` selects the handler (see api/admin.ts).
async function call<T>(payload: Record<string, unknown>): Promise<T> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not signed in.");
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify(payload),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail = (data as { detail?: string; error?: string }).detail
      || (data as { error?: string }).error
      || `Request failed (${r.status})`;
    throw new Error(detail);
  }
  return data as T;
}

/** Fetch every row (including drafts) for a collection — admin-only view. */
export async function listRows<T = Record<string, unknown>>(table: AdminTable): Promise<T[]> {
  const { rows } = await call<{ rows: T[] }>({ op: "collection", action: "list", table });
  return rows;
}

export async function insertRow<T = Record<string, unknown>>(table: AdminTable, row: Record<string, unknown>): Promise<T> {
  const { row: created } = await call<{ row: T }>({ op: "collection", action: "insert", table, row });
  return created;
}

export async function updateRow<T = Record<string, unknown>>(table: AdminTable, id: string, row: Record<string, unknown>): Promise<T> {
  const { row: updated } = await call<{ row: T }>({ op: "collection", action: "update", table, id, row });
  return updated;
}

export async function deleteRow(table: AdminTable, id: string): Promise<void> {
  await call<{ ok: true }>({ op: "collection", action: "delete", table, id });
}

/**
 * Upload an image to the CMS media bucket via /api/admin/upload and return its
 * public URL. Sends the file base64-encoded in JSON (small marketing images).
 */
export async function uploadImage(file: File): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not signed in.");
  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(file);
  });
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    body: JSON.stringify({ op: "upload", filename: file.name, contentType: file.type, dataUrl }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) {
    const detail = (data as { detail?: string; error?: string }).detail
      || (data as { error?: string }).error
      || `Upload failed (${r.status})`;
    throw new Error(detail);
  }
  return (data as { url: string }).url;
}

export interface MediaItem { name: string; url: string; kind: "image" | "video" }

/** List everything in the media bucket (images + video files) for the picker. */
export async function listMedia(): Promise<MediaItem[]> {
  const { items } = await call<{ items: MediaItem[] }>({ op: "media-list" });
  return items;
}

/** Delete a media object by name. */
export async function deleteMedia(name: string): Promise<void> {
  await call<{ ok: true }>({ op: "media-delete", name });
}

/** Re-chunk + re-embed a KB source doc into the live vector store. Returns chunk count. */
export async function kbReembed(source: string, title: string, body: string): Promise<number> {
  const { chunkCount } = await call<{ chunkCount: number }>({ op: "kb", action: "reembed", source, title, body });
  return chunkCount;
}

/** Remove a KB source doc's chunks from the live vector store. */
export async function kbRemove(source: string): Promise<void> {
  await call<{ ok: true }>({ op: "kb", action: "remove", source });
}
