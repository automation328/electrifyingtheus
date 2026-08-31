// Thin client for the CMS write API (/api/admin/*). Every call attaches the
// editor's Supabase access token; the server verifies it and the editor
// allow-list before touching the database (see api/_admin-auth.ts).

import { getAccessToken } from "@/lib/auth";
import { maxBinaryBytes, describeTooLarge } from "@/lib/upload-limits";
import { compressImageForUpload } from "@/lib/image-compress";

export type AdminTable =
  | "site_blog_posts"
  | "site_events"
  | "site_gallery"
  | "site_jobs"
  | "site_vehicles"
  | "site_incentives"
  | "site_pages"
  | "kb_source_documents"
  | "site_settings";

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

// ── users / editors allow-list (admin only) ──────────────────────────────────
export type EditorRole = "admin" | "editor" | "author" | "viewer";
export interface EditorRow { id: string; email: string; role: EditorRole; created_at: string }

export interface AddEditorResult { row: EditorRow; tempPassword?: string; loginExists?: boolean; loginError?: string }

export async function listEditors(): Promise<EditorRow[]> {
  const { rows } = await call<{ rows: EditorRow[] }>({ op: "editors", action: "list" });
  return rows;
}
export async function addEditor(email: string, role: EditorRole, opts?: { createLogin?: boolean; password?: string }): Promise<AddEditorResult> {
  return call<AddEditorResult>({ op: "editors", action: "add", email, role, createLogin: opts?.createLogin ?? false, password: opts?.password });
}
/** Create/reset the Supabase Auth login for an email. Returns the temp password if one was generated. */
export async function setEditorPassword(email: string, password?: string): Promise<{ tempPassword?: string }> {
  return call<{ tempPassword?: string }>({ op: "editors", action: "set-password", email, password });
}
export async function setEditorRole(id: string, role: EditorRole): Promise<EditorRow> {
  const { row } = await call<{ row: EditorRow }>({ op: "editors", action: "role", id, role });
  return row;
}
export async function removeEditor(id: string): Promise<void> {
  await call<{ ok: true }>({ op: "editors", action: "remove", id });
}
export async function inviteEditor(email: string): Promise<void> {
  await call<{ ok: true }>({ op: "editors", action: "invite", email });
}

// ── activity log (editor/admin) ──────────────────────────────────────────────
export interface ActivityRow { id: string; created_at: string; actor: string; role?: string; action: string; target?: string; summary?: string }
export async function listActivity(): Promise<ActivityRow[]> {
  const { rows } = await call<{ rows: ActivityRow[] }>({ op: "activity" });
  return rows;
}

// ── form submissions (editor/admin) ──────────────────────────────────────────
// Read-only. The website writes these via api/_submissions.ts when a form is
// submitted; the CMS never writes. site_form_submissions is deliberately absent
// from AdminTable above — it must not be reachable through the collection CRUD.
export interface SubmissionRow {
  id: string;
  created_at: string;
  form_type: string;
  form_label?: string | null;
  first_name?: string | null;
  last_name?: string | null;
  email?: string | null;
  phone?: string | null;
  company?: string | null;
  city?: string | null;
  subject?: string | null;
  message?: string | null;
  crm_delivery?: "sent" | "failed" | "unknown";
}

/** The full row, including the per-form `payload` and the request context. */
export interface SubmissionDetail extends SubmissionRow {
  zip?: string | null;
  payload?: Record<string, string>;
  page_path?: string | null;
  referrer?: string | null;
  ip?: string | null;
  geo_city?: string | null;
  geo_region?: string | null;
  geo_country?: string | null;
  user_agent?: string | null;
  ghl_contact_id?: string | null;
}

export interface SubmissionPage {
  rows: SubmissionRow[];
  total: number;
  counts: Record<string, number>;
}

export async function listSubmissions(opts: {
  formType?: string; q?: string; limit?: number; offset?: number;
} = {}): Promise<SubmissionPage> {
  return call<SubmissionPage>({
    op: "submissions", action: "list",
    formType: opts.formType || "", q: opts.q || "",
    limit: opts.limit ?? 50, offset: opts.offset ?? 0,
  });
}

export async function getSubmission(id: string): Promise<SubmissionDetail> {
  const { row } = await call<{ row: SubmissionDetail }>({ op: "submissions", action: "detail", id });
  return row;
}

// ── statistics / analytics (editor/admin) ────────────────────────────────────
// Same data the password-gated /admin dashboard shows, but authorized by the
// editor session so it can render inside the CMS (see AnalyticsView).
export interface AnalyticsTotals {
  pageviews: number; clicks: number; sessions: number; visitors: number;
  knownVisitors: number; leads: number; knownViews: number; anonViews: number;
}
export interface AnalyticsBar { key: string; count: number }
export interface AnalyticsPageRow { key: string; count: number; visitors: number }
export interface AnalyticsVisitorRow {
  visitorId: string; isKnown: boolean; name: string | null; email: string | null;
  views: number; clicks: number; sessions: number; lastSeen: string; firstSeen: string;
  lastPage: string; place: string;
}
export interface AnalyticsData {
  range: string;
  totals: AnalyticsTotals;
  series: { date: string; views: number; sessions: number }[];
  pages: AnalyticsPageRow[];
  visitors: AnalyticsVisitorRow[];
  topReferrers: AnalyticsBar[]; topCountries: AnalyticsBar[]; topCities: AnalyticsBar[]; topClicks: AnalyticsBar[];
  recentKnown: { name: string; email: string; path: string; place: string; when: string }[];
}
export interface AnalyticsJourneyEvent { when: string; type: string; path: string; label: string | null; referrer: string }
export interface AnalyticsJourneySession { sessionId: string; start: string; end: string; events: AnalyticsJourneyEvent[] }
export interface AnalyticsJourney {
  visitor: {
    visitorId: string; isKnown: boolean; name: string | null; email: string | null;
    views: number; clicks: number; sessions: number; place: string; firstSeen: string | null; lastSeen: string | null;
  };
  sessions: AnalyticsJourneySession[];
}

export async function fetchAdminAnalytics(range: string): Promise<AnalyticsData> {
  return call<AnalyticsData>({ op: "analytics", range });
}
export async function fetchAdminJourney(visitorId: string): Promise<AnalyticsJourney> {
  return call<AnalyticsJourney>({ op: "analytics", visitorId });
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

/**
 * Move a row to the archive (status = 'archived'). Recoverable: restore it by
 * setting the status back with updateRow. The public site reads only published
 * rows, so an archived item leaves the live site immediately.
 *
 * site_settings has no status column and is still removed outright — dropping a
 * settings row simply reverts that setting to its coded default.
 */
export async function deleteRow(table: AdminTable, id: string): Promise<void> {
  await call<{ ok: true; archived?: boolean }>({ op: "collection", action: "delete", table, id });
}

/** Permanently remove a row. Admins only, and it cannot be undone. */
export async function destroyRow(table: AdminTable, id: string): Promise<void> {
  await call<{ ok: true }>({ op: "collection", action: "destroy", table, id });
}

/** Largest file the bucket takes — mirrors MAX_BYTES in api/admin.ts. */
const MAX_DIRECT_BYTES = 50 * 1024 * 1024;

/**
 * Send the file straight to Supabase Storage using a one-shot signed URL, so the
 * bytes never pass through the serverless function and its 4.5 MB body cap.
 * Used for anything too big for the JSON path — video, mostly.
 */
async function uploadViaSignedUrl(file: File): Promise<string> {
  const { uploadUrl, url } = await call<{ uploadUrl: string; url: string }>({
    op: "upload-url", filename: file.name, contentType: file.type, size: file.size,
  });
  const put = await fetch(uploadUrl, {
    method: "PUT",
    headers: { "Content-Type": file.type },
    body: file,
  });
  if (!put.ok) {
    // Storage answers with XML/plain text, not our JSON envelope.
    const detail = await put.text().catch(() => "");
    throw new Error(detail.slice(0, 200) || `Upload failed (${put.status})`);
  }
  return url;
}

/**
 * Upload an image or video to the CMS media bucket and return its public URL.
 *
 * Two routes, picked by size. Small files go base64-encoded in JSON through
 * /api/admin, which is the proven path. Base64 costs 4 bytes for every 3 and a
 * Vercel Function's body caps at 4.5 MB, so that route tops out near 2.86 MB —
 * images bigger than that are downscaled to fit first.
 *
 * Video cannot be downscaled here (shouldCompress only re-encodes rasterisable
 * image types), so anything still over the budget takes a signed upload URL
 * straight to Storage, where the bucket's own 50 MB limit is the only ceiling.
 */
export async function uploadImage(file: File): Promise<string> {
  const token = await getAccessToken();
  if (!token) throw new Error("Not signed in.");

  // Envelope = the JSON around the encoded file (keys, filename, mime, prefix).
  const envelope = 200 + file.name.length + (file.type.length || 0);
  const limit = maxBinaryBytes(envelope);
  const sending = await compressImageForUpload(file, limit);
  if (sending.size > limit) {
    if (sending.size > MAX_DIRECT_BYTES) throw new Error(describeTooLarge(sending.size, MAX_DIRECT_BYTES));
    return uploadViaSignedUrl(sending);
  }

  const dataUrl = await new Promise<string>((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(String(reader.result));
    reader.onerror = () => reject(new Error("Could not read file."));
    reader.readAsDataURL(sending);
  });
  const r = await fetch("/api/admin", {
    method: "POST",
    headers: { "Content-Type": "application/json", Authorization: `Bearer ${token}` },
    // `sending`, not `file` — a re-encoded image has a new name and mime type,
    // and storing WebP bytes labelled as JPEG would serve a broken image.
    body: JSON.stringify({ op: "upload", filename: sending.name, contentType: sending.type, dataUrl }),
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

export interface MediaItem { name: string; url: string; kind: "image" | "video" | "audio" }

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

/** Upload a PDF/DOCX/TXT/MD document → extract text → embed into EVan's KB. */
export async function kbUpload(file: File, status: "draft" | "published" = "published"): Promise<{ source: string; title: string; chars: number; chunkCount: number }> {
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
    body: JSON.stringify({ op: "kb-upload", filename: file.name, contentType: file.type, dataUrl, status }),
  });
  const data = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error((data as { detail?: string; error?: string }).detail || (data as { error?: string }).error || `Upload failed (${r.status})`);
  return data as { source: string; title: string; chars: number; chunkCount: number };
}

/**
 * Tell the server an event was just published, so the organiser who submitted
 * it gets their live link by email.
 *
 * It has to come through the server: the CMS publish toggle writes to Supabase
 * straight from the browser, which can neither reach GoHighLevel nor read
 * site_event_submissions (RLS with no policies — migration 0025).
 *
 * Safe to call for ANY event. The server answers "not a form submission" for
 * the imported ones and "already notified" on a re-publish, so the caller does
 * not have to know which is which.
 */
export async function notifyEventPublished(id: string): Promise<{ sent: boolean; detail: string }> {
  return call<{ sent: boolean; detail: string }>({ op: "event-published", id });
}
