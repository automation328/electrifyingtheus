// Generic, config-driven CRUD screen for a CMS collection. Renders a list of
// rows (including drafts/archived — admin sees everything) and a side editor for
// create/edit/delete. All writes go through the editor-gated /api/admin/collection.

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, X, Save, AlertCircle, Eye, EyeOff, Image as ImageIcon, FolderOpen,
} from "lucide-react";
import { listRows, insertRow, updateRow, deleteRow, type MediaItem } from "@/lib/admin-api";
import AdminField from "@/components/admin/AdminField";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { type CollectionConfig, emptyRecord } from "@/pages/admin/collections/types";

type Row = Record<string, unknown> & { id?: string };

const statusStyle = (s: string) =>
  s === "published"
    ? "bg-primary/10 text-primary"
    : s === "draft"
      ? "bg-amber-500/15 text-amber-600"
      : "bg-muted text-muted-foreground";

// React Query key that the PUBLIC hooks also read (see src/hooks/use-content.ts),
// so publishing/editing here refreshes the live pages too.
const publicKeyFor: Record<string, string> = {
  site_blog_posts: "site-blog-posts",
  site_events: "site-events",
  site_gallery: "site-gallery",
  site_jobs: "site-jobs",
};

const CollectionManager = ({ config }: { config: CollectionConfig }) => {
  const qc = useQueryClient();
  const adminKey = ["admin-collection", config.table];

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: adminKey,
    queryFn: () => listRows<Row>(config.table),
    retry: false, // surface a "table missing / not migrated" error fast instead of a long spinner
  });

  const [editing, setEditing] = useState<Row | null>(null);
  const [isNew, setIsNew] = useState(false);
  const [draft, setDraft] = useState<Row>({});
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState("");
  const [mediaOpen, setMediaOpen] = useState(false);

  const addFromMedia = async (items: MediaItem[]) => {
    if (!config.mediaImport || items.length === 0) return;
    try {
      for (const m of items) await insertRow(config.table, config.mediaImport(m));
      toast.success(`Added ${items.length} item${items.length === 1 ? "" : "s"}`);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't add items.");
    }
  };

  // Merged view: DB rows + built-in (curated) rows that aren't already overridden.
  const merged = useMemo(() => {
    const statics = config.staticRows ? config.staticRows() : [];
    if (!statics.length || !config.keyOf) return rows as Row[];
    const dbKeys = new Set(rows.map((r) => config.keyOf!(r)));
    const extra = statics.filter((s) => !dbKeys.has(config.keyOf!(s))) as Row[];
    return [...rows, ...extra];
  }, [rows, config]);

  const sorted = useMemo(() => {
    const copy = [...merged];
    if (config.sortRows) copy.sort(config.sortRows);
    return copy;
  }, [merged, config]);

  const groups = useMemo(() => {
    if (!config.groupField) return null;
    const map = new Map<string, Row[]>();
    for (const r of sorted) {
      const g = String(r[config.groupField] ?? "");
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(r);
    }
    return [...map.entries()];
  }, [sorted, config]);

  const invalidate = () => {
    qc.invalidateQueries({ queryKey: adminKey });
    qc.invalidateQueries({ queryKey: ["admin-counts"] });
    const pub = publicKeyFor[config.table];
    if (pub) qc.invalidateQueries({ queryKey: [pub] });
  };

  const openNew = () => {
    setDraft(emptyRecord(config));
    setEditing(null);
    setIsNew(true);
    setFormError("");
  };

  const openEdit = (row: Row) => {
    if (row.__static) {
      // Adopt a built-in item: open as NEW so Save inserts it into the DB.
      const { __static, id, ...rest } = row as Row & { __static?: boolean };
      void __static; void id;
      setDraft(rest as Row);
      setEditing(null);
      setIsNew(true);
    } else {
      setDraft({ ...row });
      setEditing(row);
      setIsNew(false);
    }
    setFormError("");
  };

  const close = () => { setEditing(null); setIsNew(false); setDraft({}); setFormError(""); };

  const setField = (name: string, value: unknown) => setDraft((d) => ({ ...d, [name]: value }));

  const validate = (): string => {
    for (const f of config.fields) {
      if (f.required) {
        const v = draft[f.name];
        if (v === undefined || v === null || String(v).trim() === "") return `${f.label} is required.`;
      }
    }
    return "";
  };

  const save = async () => {
    const v = validate();
    if (v) { setFormError(v); return; }
    setSaving(true); setFormError("");
    // Only persist configured fields + status (drop client-only keys like id on insert).
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) payload[f.name] = draft[f.name];
    payload[config.statusField] = draft[config.statusField] ?? config.statusOptions[0];
    try {
      if (isNew) {
        await insertRow(config.table, payload);
        toast.success(`${config.singular} created`);
      } else if (editing?.id) {
        await updateRow(config.table, editing.id, payload);
        toast.success(`${config.singular} saved`);
      }
      invalidate();
      close();
    } catch (e) {
      setFormError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const remove = async (row: Row) => {
    if (!row.id) return;
    if (!window.confirm(`Delete this ${config.singular.toLowerCase()}? This can't be undone.`)) return;
    try {
      await deleteRow(config.table, row.id);
      toast.success(`${config.singular} deleted`);
      invalidate();
      if (editing?.id === row.id) close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  // Quick publish / unpublish toggle from the list.
  const toggleStatus = async (row: Row) => {
    if (!row.id) return;
    const current = String(row[config.statusField] ?? "");
    const next = current === "published" ? (config.statusOptions.find((s) => s !== "published") ?? "draft") : "published";
    try {
      await updateRow(config.table, row.id, { [config.statusField]: next });
      toast.success(next === "published" ? `${config.singular} published` : `${config.singular} unpublished`);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Update failed.");
    }
  };

  const titleOf = (row: Row) => String(row[config.titleField] ?? "") || `Untitled ${config.singular.toLowerCase()}`;
  const subtitleOf = (row: Row) =>
    (config.subtitleFields ?? [])
      .map((f) => (config.groupLabels && f === config.groupField ? config.groupLabels[String(row[f])] ?? row[f] : row[f]))
      .filter((v) => v !== undefined && v !== null && String(v).trim() !== "")
      .map(String)
      .join(" · ");

  const renderRow = (row: Row) => {
    const isStatic = !!row.__static;
    const status = String(row[config.statusField] ?? "");
    const published = status === "published";
    return (
      <li key={isStatic ? `s:${config.keyOf?.(row)}` : String(row.id)} className="flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3 shadow-card">
        {config.imageField && (
          String(row[config.imageField] ?? "")
            ? <img src={String(row[config.imageField])} alt="" className="w-12 h-12 rounded-lg object-cover border border-border shrink-0" loading="lazy" />
            : <div className="w-12 h-12 rounded-lg bg-muted grid place-items-center text-muted-foreground shrink-0"><ImageIcon className="w-4 h-4" /></div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{titleOf(row)}</span>
            {isStatic
              ? <span className="text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 bg-blue-500/10 text-blue-600">built-in</span>
              : <span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${statusStyle(status)}`}>{status}</span>}
          </div>
          {subtitleOf(row) && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitleOf(row)}</p>}
        </div>
        {isStatic ? (
          <button onClick={() => openEdit(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 text-primary text-xs font-semibold px-3 py-2 hover:bg-primary/10" title="Edit — adds an editable copy to your library">
            <Pencil className="w-3.5 h-3.5" /> Edit
          </button>
        ) : (
          <>
            <button onClick={() => toggleStatus(row)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={published ? "Unpublish" : "Publish"}>
              {published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
            </button>
            <button onClick={() => openEdit(row)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>
            <button onClick={() => remove(row)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" title="Delete"><Trash2 className="w-4 h-4" /></button>
          </>
        )}
      </li>
    );
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">{config.plural}</h1>
          <p className="text-sm text-muted-foreground">
            {isLoading ? "Loading…" : `${sorted.length} item${sorted.length === 1 ? "" : "s"}`}
          </p>
          {config.description && <p className="text-xs text-muted-foreground mt-1 max-w-lg">{config.description}</p>}
        </div>
        {config.mediaImport && (
          <button
            onClick={() => setMediaOpen(true)}
            className="ml-auto inline-flex items-center gap-2 rounded-xl border border-primary/50 text-primary font-semibold px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors"
          >
            <FolderOpen className="w-4 h-4" /> Add from library
          </button>
        )}
        <button
          onClick={openNew}
          className={`${config.mediaImport ? "" : "ml-auto"} inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-4 py-2.5 text-sm hover:opacity-90 transition-opacity`}
        >
          <Plus className="w-4 h-4" /> New {config.singular.toLowerCase()}
        </button>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" />
          <span>Couldn't load this section: {error instanceof Error ? error.message : "unknown error"}. If this is Vehicles, Incentives, or EVan knowledge, the database table may not be created yet — run the matching migration in Supabase (0006 / 0008).</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : sorted.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-10 text-center text-muted-foreground">
          No {config.plural.toLowerCase()} yet. Create the first one.
        </div>
      ) : groups ? (
        <div className="space-y-6">
          {groups.map(([g, gr]) => (
            <div key={g || "—"}>
              <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">{config.groupLabels?.[g] ?? g ?? "Other"} <span className="text-muted-foreground/60">· {gr.length}</span></h2>
              <ul className="space-y-2">{gr.map(renderRow)}</ul>
            </div>
          ))}
        </div>
      ) : (
        <ul className="space-y-2">{sorted.map(renderRow)}</ul>
      )}

      {/* Editor drawer */}
      {(isNew || editing) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={close}>
          <div
            className="w-full max-w-xl h-full bg-background border-l border-border shadow-elevated flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
              <h2 className="font-bold font-display text-foreground truncate">
                {isNew ? `New ${config.singular.toLowerCase()}` : `Edit ${config.singular.toLowerCase()}`}
              </h2>
              <button onClick={close} className="ml-auto p-2 rounded-lg text-muted-foreground hover:bg-muted" title="Close">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-4">
              {config.fields.map((f) => (
                <AdminField
                  key={f.name}
                  field={f}
                  value={draft[f.name]}
                  onChange={(val) => setField(f.name, val)}
                />
              ))}
            </div>

            <div className="border-t border-border p-4 shrink-0">
              {formError && (
                <p className="text-sm text-destructive mb-3 flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4" /> {formError}
                </p>
              )}
              <div className="flex items-center gap-2">
                <button
                  onClick={save}
                  disabled={saving}
                  className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 transition-opacity disabled:opacity-60"
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save
                </button>
                <button
                  onClick={close}
                  className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {mediaOpen && config.mediaImport && (
        <MediaPickerModal onClose={() => setMediaOpen(false)} onAdd={addFromMedia} />
      )}
    </div>
  );
};

export default CollectionManager;
