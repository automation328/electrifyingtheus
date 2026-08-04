// CMS editor for EVan's knowledge base. Editors edit human-readable source docs;
// saving a PUBLISHED doc re-chunks + re-embeds it into the live vector store so
// the assistant answers from the new text. Drafts are removed from the store.

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  Plus, Pencil, Trash2, Loader2, X, Save, AlertCircle, Bot, Eye, Sparkles, Upload,
} from "lucide-react";
import { listRows, insertRow, updateRow, deleteRow, kbReembed, kbRemove, kbUpload } from "@/lib/admin-api";

interface KbRow {
  id?: string; source: string; title: string; body: string; status: string;
  last_embedded_at?: string | null; chunk_count?: number | null;
}

const slugify = (s: string) => s.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60);

const KnowledgeBaseManager = () => {
  const qc = useQueryClient();
  const key = ["admin-collection", "kb_source_documents"] as const;

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: key,
    queryFn: () => listRows<KbRow>("kb_source_documents"),
  });

  const [editing, setEditing] = useState<KbRow | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<KbRow>({ source: "", title: "", body: "", status: "draft" });
  const [preview, setPreview] = useState(false);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");

  const fileRef = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);

  const invalidate = () => qc.invalidateQueries({ queryKey: key });

  const onUpload = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    try {
      for (const f of Array.from(files)) {
        const res = await kbUpload(f, "published");
        toast.success(`${res.title}: embedded ${res.chunkCount} chunk${res.chunkCount === 1 ? "" : "s"}`);
      }
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const openNew = () => { setDraft({ source: "", title: "", body: "", status: "draft" }); setEditing(null); setIsNew(true); setPreview(false); setFormError(""); };
  const openEdit = (r: KbRow) => { setDraft({ ...r }); setEditing(r); setIsNew(false); setPreview(false); setFormError(""); };
  const close = () => { setEditing(null); setIsNew(false); setFormError(""); };

  const save = async () => {
    const source = slugify(draft.source);
    if (!source) { setFormError("A source slug is required."); return; }
    if (!draft.body.trim()) { setFormError("The document body is required."); return; }
    setSaving(true); setFormError("");
    try {
      // 1) Persist the editable row.
      const base = { source, title: draft.title, body: draft.body, status: draft.status, updated_at: new Date().toISOString() };
      const saved = editing?.id
        ? await updateRow<KbRow>("kb_source_documents", editing.id, base)
        : await insertRow<KbRow>("kb_source_documents", base);

      // 2) Sync the live vector store: published → re-embed; draft → remove.
      if (draft.status === "published") {
        const chunkCount = await kbReembed(source, draft.title, draft.body);
        if (saved.id) await updateRow("kb_source_documents", saved.id, { last_embedded_at: new Date().toISOString(), chunk_count: chunkCount });
        toast.success(`Published & embedded (${chunkCount} chunk${chunkCount === 1 ? "" : "s"})`);
      } else {
        await kbRemove(source);
        if (saved.id) await updateRow("kb_source_documents", saved.id, { last_embedded_at: null, chunk_count: 0 });
        toast.success("Draft saved (removed from the live assistant)");
      }
      invalidate();
      close();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (r: KbRow) => {
    if (!r.id) return;
    if (!window.confirm(`Delete "${r.title || r.source}" and remove it from the assistant?`)) return;
    try {
      await kbRemove(r.source);
      await deleteRow("kb_source_documents", r.id);
      toast.success("Document deleted");
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  return (
    <div className="max-w-4xl">
      <div className="flex items-center gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">EVan knowledge base</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${rows.length} document${rows.length === 1 ? "" : "s"}`}
          </p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={uploading} className="ml-auto inline-flex items-center gap-2 rounded-xl border border-primary/50 text-primary font-semibold px-4 py-2.5 text-sm hover:bg-primary/10 disabled:opacity-60">
          {uploading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload document
        </button>
        <input ref={fileRef} type="file" accept=".pdf,.docx,.txt,.md,application/pdf,application/vnd.openxmlformats-officedocument.wordprocessingml.document,text/plain,text/markdown" multiple className="hidden" onChange={(e) => onUpload(e.target.files)} />
        <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-4 py-2.5 text-sm hover:opacity-90">
          <Plus className="w-4 h-4" /> New document
        </button>
      </div>
      <p className="text-xs text-muted-foreground mb-6 flex items-start gap-1.5">
        <Sparkles className="w-3.5 h-3.5 mt-0.5 shrink-0 text-primary" />
        Upload a PDF, DOCX, or text file — the text is extracted, chunked, and embedded into EVan's knowledge base automatically. Publishing a document re-embeds it; drafts are held out of the assistant.
      </p>
      {uploading && <p className="text-xs text-muted-foreground mb-4"><Loader2 className="w-3.5 h-3.5 animate-spin inline mr-1" /> Extracting text and embedding… large documents can take a minute.</p>}

      {error && (
        <div className="rounded-xl border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm mb-4 flex items-center gap-2">
          <AlertCircle className="w-4 h-4" /> {error instanceof Error ? error.message : "Failed to load."}
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : rows.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">No documents yet.</div>
      ) : (
        <ul className="space-y-2">
          {rows.map((r) => (
            <li key={r.id} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
              <Bot className="w-4 h-4 text-primary shrink-0" />
              <div className="min-w-0 flex-1">
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-foreground truncate">{r.title || r.source}</span>
                  <span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${r.status === "published" ? "bg-primary/10 text-primary" : "bg-amber-500/15 text-amber-600"}`}>{r.status}</span>
                </div>
                <p className="text-xs text-muted-foreground truncate mt-0.5">
                  {r.source}{r.status === "published" && r.chunk_count ? ` · ${r.chunk_count} chunks embedded` : ""}
                </p>
              </div>
              <button onClick={() => openEdit(r)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted" title="Edit"><Pencil className="w-4 h-4" /></button>
              <button onClick={() => remove(r)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted" title="Delete"><Trash2 className="w-4 h-4" /></button>
            </li>
          ))}
        </ul>
      )}

      {(isNew || editing) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={close}>
          <div className="w-full max-w-2xl h-full bg-background border-l border-border shadow-elevated flex flex-col" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
              <h2 className="font-bold font-display text-foreground truncate">{isNew ? "New document" : "Edit document"}</h2>
              <button onClick={close} className="ml-auto p-2 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-5 h-5" /></button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Source slug <span className="text-destructive">*</span></label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 disabled:opacity-60"
                    value={draft.source}
                    disabled={!isNew}
                    onChange={(e) => setDraft((d) => ({ ...d, source: e.target.value }))}
                    placeholder="washington-seattle-incentives"
                  />
                  <p className="text-xs text-muted-foreground mt-1">Stable identifier (can't change after creation).</p>
                </div>
                <div>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Title</label>
                  <input
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
                    value={draft.title}
                    onChange={(e) => setDraft((d) => ({ ...d, title: e.target.value }))}
                    placeholder="Washington & Seattle City Light Incentives"
                  />
                </div>
              </div>

              <div>
                <div className="flex items-center justify-between mb-1.5">
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground">Body (Markdown)</label>
                  <button type="button" onClick={() => setPreview((p) => !p)} className="flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground">
                    {preview ? <Pencil className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}{preview ? "Edit" : "Preview"}
                  </button>
                </div>
                {preview ? (
                  <div className="prose prose-sm max-w-none rounded-xl border border-border bg-card p-4 min-h-[16rem] dark:prose-invert">
                    <ReactMarkdown remarkPlugins={[remarkGfm]}>{draft.body || "_Nothing to preview_"}</ReactMarkdown>
                  </div>
                ) : (
                  <textarea
                    className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40 font-mono leading-relaxed resize-y"
                    rows={18}
                    value={draft.body}
                    onChange={(e) => setDraft((d) => ({ ...d, body: e.target.value }))}
                    placeholder="Use ## / ### headings — the doc is chunked on them for retrieval."
                  />
                )}
                <p className="text-xs text-muted-foreground mt-1">Chunked on Markdown headings (## / ###) for retrieval.</p>
              </div>
            </div>

            <div className="border-t border-border p-4 shrink-0">
              {formError && <p className="text-sm text-destructive mb-3 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {formError}</p>}
              {saving && <p className="text-xs text-muted-foreground mb-2">Embedding can take a moment for long documents…</p>}
              <div className="flex flex-wrap items-center gap-2">
                <select value={draft.status} onChange={(e) => setDraft((d) => ({ ...d, status: e.target.value }))} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
                  <option value="draft">Draft (held back)</option>
                  <option value="published">Published (embed live)</option>
                </select>
                <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  {draft.status === "published" ? "Save & re-embed" : "Save draft"}
                </button>
                <button onClick={close} className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default KnowledgeBaseManager;
