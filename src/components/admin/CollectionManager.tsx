// Generic, config-driven CRUD screen for a CMS collection. Renders a list of
// rows (including drafts/archived — admin sees everything) and a side editor for
// create/edit/delete. All writes go through the editor-gated /api/admin/collection.

import { useEffect, useMemo, useState } from "react";
import { useSearchParams } from "react-router-dom";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Plus, Pencil, Trash2, Loader2, X, Save, AlertCircle, Eye, EyeOff, Image as ImageIcon, FolderOpen, ExternalLink, Search, RotateCcw, LayoutTemplate, Copy,
} from "lucide-react";
import { listRows, insertRow, updateRow, deleteRow, destroyRow, type MediaItem, notifyEventPublished } from "@/lib/admin-api";
import AdminField from "@/components/admin/AdminField";
import MediaPickerModal from "@/components/admin/MediaPickerModal";
import { type CollectionConfig, emptyRecord } from "@/pages/admin/collections/types";
import { useEditorAuth } from "@/lib/auth";

type Row = Record<string, unknown> & { id?: string };

const statusStyle = (s: string) =>
  s === "published"
    // Brand green, not an arbitrary Tailwind green — the same token the site
    // uses for its own "live / go" affordances.
    ? "bg-secondary/10 text-secondary"
    : s === "draft"
      ? "bg-amber-500/15 text-amber-600"
      : "bg-muted text-muted-foreground";

/**
 * What the status badge SAYS. "published" is what the row actually stores, and
 * that string is load-bearing — RLS policies, every public fetch, and the
 * removal-marker logic all test for `status = 'published'`. Renaming the value
 * would take the whole site off the air, so only the label changes here.
 */
const statusLabel = (s: string) => (s === "published" ? "online" : s);

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
  const auth = useEditorAuth();
  const role = auth.status === "editor" ? auth.editor.role : "viewer";
  const canWrite = role !== "viewer";                       // authors/editors/admins
  const canPublish = role === "admin" || role === "editor"; // authors save drafts only
  const isAdmin = role === "admin";                         // permanent delete only
  const adminKey = ["admin-collection", config.table];

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: adminKey,
    queryFn: () => listRows<Row>(config.table),
    retry: false, // surface a "table missing / not migrated" error fast instead of a long spinner
  });

  const [editing, setEditing] = useState<Row | null>(null);
  // A built-in (curated) item opens as "new", but it already has a live page.
  const [fromStatic, setFromStatic] = useState(false);
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

  const [query, setQuery] = useState("");

  // ── Tabs: what's on the site, what isn't ───────────────────────────────────
  // The list used to mix five states in one column — built-in, published, draft,
  // archived and removal markers — so "is this actually on the site?" could only
  // be answered badge by badge. These three buckets answer it up front.
  //
  // Drafts get their own tab rather than being folded into either side: a draft
  // is not live, but calling it archived would be wrong too.
  type Tab = "live" | "draft" | "archive";
  const [tab, setTab] = useState<Tab>("live");

  const tabOf = (r: Row): Tab => {
    // A built-in is always on the site — it lives in the code, not the database.
    if (r.__static) return "live";
    const s = String(r[config.statusField] ?? "");
    if (s === "archived") return "archive";
    // A published row carrying the hidden flag is a DELETION, not a live item —
    // it exists to take the matching built-in off the site.
    if (config.hiddenField && r[config.hiddenField] === true) return "archive";
    return s === "published" ? "live" : "draft";
  };

  const counts = useMemo(() => {
    const c = { live: 0, draft: 0, archive: 0 };
    for (const r of sorted) c[tabOf(r)]++;
    return c;
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sorted, config]);

  const TABS: { id: Tab; label: string; hint: string }[] = [
    { id: "live", label: "Live", hint: `On the site right now` },
    { id: "draft", label: "Drafts", hint: `Not on the site yet` },
    { id: "archive", label: "Archive", hint: `Removed from the site — restorable` },
  ];

  const inTab = useMemo(() => sorted.filter((r) => tabOf(r) === tab),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sorted, tab, config]);

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
      // It opens as "new" so Save adopts it into the DB — but it is a built-in
      // item that already HAS a live page, so "Edit on page" still applies.
      setFromStatic(true);
    } else {
      setDraft({ ...row });
      setEditing(row);
      setIsNew(false);
      setFromStatic(false);
    }
    setFormError("");
  };

  const close = () => { setEditing(null); setIsNew(false); setFromStatic(false); setDraft({}); setFormError(""); };

  // ── Deep link: /admin/content/events?edit=<id> ─────────────────────────────
  // Lets a link land on ONE item rather than on the list. The Slack event-
  // submission message uses it, so "Review in CMS" opens the actual draft
  // instead of leaving somebody to find it among 140-odd events.
  //
  // It switches tab first: a draft is not in the Live tab, so opening the
  // editor without that would leave the wrong list behind the panel.
  const [searchParams, setSearchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  useEffect(() => {
    if (!editId || isLoading) return;
    const row = (rows as Row[]).find((r) => String(r.id ?? "") === editId);
    if (!row) return;
    setTab(tabOf(row));
    openEdit(row);
    // Drop the param once it has been acted on, so closing the editor does not
    // immediately reopen it and a refresh does not fight the user.
    const next = new URLSearchParams(searchParams);
    next.delete("edit");
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [editId, isLoading, rows]);

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
    for (const f of config.fields) {
      const v = draft[f.name];
      // A blank optional date has to reach Postgres as NULL. emptyRecord() seeds
      // every non-boolean/number field with "", and the write path hands the row
      // straight to .insert()/.update() (api/admin.ts) with no coercion — so ""
      // would land on a `date` column and fail with "invalid input syntax for
      // type date". Required dates never get here: validate() rejects "" first.
      payload[f.name] = f.type === "date" && (v === "" || v === undefined) ? null : v;
    }
    // Authors can only save drafts — force it (a published default would 403).
    payload[config.statusField] = canPublish ? (draft[config.statusField] ?? config.statusOptions[0]) : "draft";
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

  // Delete now ARCHIVES: the row leaves the live site but stays here, marked
  // "archived", and can be restored. Only an admin can remove it for good.
  const remove = async (row: Row) => {
    if (!row.id) return;
    const label = config.singular.toLowerCase();
    if (!window.confirm(`Move this ${label} to the archive? It comes off the live site, and you can restore it here.`)) return;
    try {
      await deleteRow(config.table, row.id);
      toast.success(`${config.singular} archived — you can restore it any time`);
      invalidate();
      if (editing?.id === row.id) close();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't archive it.");
    }
  };

  /** Copy any item — built-in or database — into a new DRAFT you can rework.
   *  Drafts, so duplicating never quietly publishes a near-identical item beside
   *  the original. Only the configured fields are copied: id, status and the
   *  __static marker are all rebuilt rather than carried over. */
  const duplicate = async (row: Row) => {
    const label = config.singular.toLowerCase();
    const current = String(row[config.titleField] ?? "") || `Untitled ${label}`;
    const title = window.prompt(`Copy this ${label} — name for the copy:`, `${current} (copy)`);
    if (title === null) return;
    const t = title.trim();
    if (!t) { toast.error("Give the copy a name."); return; }
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      const v = row[f.name];
      payload[f.name] = f.type === "date" && (v === "" || v === undefined) ? null : v;
    }
    payload[config.titleField] = t;
    // A copy must never inherit "remove the built-in" — that flag belongs to the
    // marker row it came from, and carrying it would delete the original.
    if (config.hiddenField) payload[config.hiddenField] = false;
    payload[config.statusField] = canPublish
      ? (config.statusOptions.find((s) => s !== "archived" && s !== "published") ?? "draft")
      : "draft";
    try {
      await insertRow(config.table, payload);
      toast.success(`Copied as a draft — publish it when you're ready`);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't copy it.");
    }
  };

  /** Remove a BUILT-IN item from the live site.
   *
   *  Built-ins live in the code, not the database, so there is no row to delete.
   *  The merge re-appends every curated item that no published row matched, which
   *  is why adopting one and archiving it does NOT remove it — the archived row
   *  drops out of the published set and the built-in comes straight back.
   *  Instead we insert a PUBLISHED row carrying the hidden flag: the merge reads
   *  it as "drop the built-in with this identity", and does not display it. */
  const removeBuiltIn = async (row: Row) => {
    const field = config.hiddenField;
    if (!field) return;
    const label = config.singular.toLowerCase();
    const name = String(row[config.titleField] ?? "") || `this ${label}`;
    if (!window.confirm(
      `Remove "${name}" from the live site?\n\n`
      + `It's a built-in ${label}, so this adds a hidden entry that takes it off the site. `
      + `It stays in this list marked Removed, and you can put it back.`,
    )) return;
    const payload: Record<string, unknown> = {};
    for (const f of config.fields) {
      const v = row[f.name];
      payload[f.name] = f.type === "date" && (v === "" || v === undefined) ? null : v;
    }
    payload[field] = true;
    // Must be PUBLISHED — the site never sees drafts, so a draft marker would
    // silently do nothing at all.
    payload[config.statusField] = "published";
    try {
      await insertRow(config.table, payload);
      toast.success(`${config.singular} removed from the live site`);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't remove it.");
    }
  };

  /** Bring an archived row back — as a draft where the collection has one, so
   *  restoring never silently republishes something to the live site. */
  const restore = async (row: Row) => {
    if (!row.id) return;
    const back = config.statusOptions.find((s) => s !== "archived" && s !== "published")
      ?? config.statusOptions.find((s) => s !== "archived")
      ?? "draft";
    try {
      await updateRow(config.table, row.id, { [config.statusField]: back });
      toast.success(`${config.singular} restored as ${back}`);
      invalidate();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed.");
    }
  };

  const destroyPermanently = async (row: Row) => {
    if (!row.id) return;
    const label = config.singular.toLowerCase();
    if (!window.confirm(`Permanently delete this ${label}? This cannot be undone and it will NOT go to the archive.`)) return;
    try {
      await destroyRow(config.table, row.id);
      toast.success(`${config.singular} permanently deleted`);
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
      // Publishing an event that arrived through /list-your-event emails the
      // organiser their live link. The server decides whether this event is one
      // of those — it answers "not a form submission" for the imported ones and
      // "already notified" on a re-publish — so this fires blindly and only
      // surfaces the outcome when an email actually went out or actually broke.
      //
      // Deliberately AFTER invalidate() and deliberately not awaited into the
      // success path: a mail failure must not make a successful publish look
      // like it failed.
      if (config.table === "site_events" && next === "published") {
        notifyEventPublished(String(row.id))
          .then((r) => { if (r.sent) toast.success("Organiser emailed their event link."); })
          .catch((e) => toast.error(
            `Published, but the organiser was not emailed: ${e instanceof Error ? e.message : "unknown error"}`,
          ));
      }
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

  // Client-side search over title + subtitle. `groups` (when a collection groups
  // by a field) recomputes from the filtered set.
  const q = query.trim().toLowerCase();
  const filtered = q ? inTab.filter((r) => `${titleOf(r)} ${subtitleOf(r)}`.toLowerCase().includes(q)) : inTab;
  const groups = (() => {
    if (!config.groupField) return null;
    const map = new Map<string, Row[]>();
    for (const r of filtered) {
      const g = String(r[config.groupField] ?? "");
      if (!map.has(g)) map.set(g, []);
      map.get(g)!.push(r);
    }
    return [...map.entries()];
  })();

  const renderRow = (row: Row) => {
    const isStatic = !!row.__static;
    const status = String(row[config.statusField] ?? "");
    const published = status === "published";
    const archived = status === "archived";
    const viewUrl = config.viewUrl?.(row);
    // Built-in rows have no DB columns to judge, and nothing to fix if flagged.
    const badge = isStatic ? null : config.rowBadge?.(row) ?? null;
    // A published row carrying the hidden flag is a REMOVAL marker for the
    // built-in of the same identity, not an item in its own right.
    const isRemovalMarker = !isStatic && !!config.hiddenField && row[config.hiddenField] === true;
    return (
      <li key={isStatic ? `s:${config.keyOf?.(row)}` : String(row.id)} className="group flex items-center gap-3.5 rounded-2xl border border-border/70 bg-card px-4 py-3 shadow-sm transition-all hover:shadow-md hover:border-primary/30">
        {config.imageField && (
          String(row[config.imageField] ?? "")
            ? <img src={String(row[config.imageField])} alt="" className="w-14 h-14 rounded-xl object-cover border border-border shrink-0" loading="lazy" />
            : <div className="w-14 h-14 rounded-xl bg-muted grid place-items-center text-muted-foreground shrink-0"><ImageIcon className="w-5 h-5" /></div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="font-semibold text-foreground truncate">{titleOf(row)}</span>
            {isStatic
              ? <span className="text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 bg-blue-500/10 text-blue-600">built-in</span>
              : isRemovalMarker
                // Not an item — a marker that takes the matching built-in off the
                // site. Showing it as "published" would read as the opposite.
                ? <span className="text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 bg-destructive/10 text-destructive">removed</span>
                : <span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${statusStyle(status)}`}>{statusLabel(status)}</span>}
            {badge && (
              <span
                className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 shrink-0 ${
                  badge.tone === "red" ? "bg-destructive/10 text-destructive" : "bg-amber-500/10 text-amber-600"
                }`}
              >
                {badge.label}
              </span>
            )}
          </div>
          {subtitleOf(row) && <p className="text-xs text-muted-foreground truncate mt-0.5">{subtitleOf(row)}</p>}
        </div>
        {viewUrl && (
          <a href={viewUrl} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors" title={`View live ${config.singular.toLowerCase()} page`}>
            <ExternalLink className="w-4 h-4" />
          </a>
        )}
        {canWrite && (
          <button onClick={() => duplicate(row)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={`Make a copy — saved as a draft`}>
            <Copy className="w-4 h-4" />
          </button>
        )}
        {isStatic ? (
          <>
            {/* Built-ins deliberately have no publish toggle: they live in the
                code and are always live, so there is no draft state to flip.
                Everything else matches a database row icon for icon, so the two
                kinds of row read as one list rather than two. */}
            {canWrite && (
              <button onClick={() => openEdit(row)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit — saves your changes as an editable copy of this built-in">
                <Pencil className="w-4 h-4" />
              </button>
            )}
            {canPublish && config.hiddenField && (
              <button onClick={() => removeBuiltIn(row)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" title="Remove from the live site — reversible">
                <Trash2 className="w-4 h-4" />
              </button>
            )}
          </>
        ) : (
          archived ? (
            // Archived rows offer recovery first; permanent removal is admin-only.
            <>
              {canPublish && (
                <button onClick={() => restore(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 text-primary text-xs font-semibold px-3 py-2 hover:bg-primary/10" title="Restore — brings it back as a draft">
                  <RotateCcw className="w-3.5 h-3.5" /> Restore
                </button>
              )}
              {isAdmin && (
                <button onClick={() => destroyPermanently(row)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" title="Delete permanently — cannot be undone">
                  <Trash2 className="w-4 h-4" />
                </button>
              )}
            </>
          ) : (
            <>
              {canPublish && (
                <button onClick={() => toggleStatus(row)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title={published ? "Unpublish" : "Publish"}>
                  {published ? <Eye className="w-4 h-4" /> : <EyeOff className="w-4 h-4" />}
                </button>
              )}
              {canWrite && <button onClick={() => openEdit(row)} className="p-2 rounded-lg text-muted-foreground hover:text-foreground hover:bg-muted transition-colors" title="Edit"><Pencil className="w-4 h-4" /></button>}
              {canPublish && <button onClick={() => remove(row)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted transition-colors" title="Move to archive"><Trash2 className="w-4 h-4" /></button>}
            </>
          )
        )}
      </li>
    );
  };

  return (
    <div className={config.splitBy ? "max-w-6xl" : "max-w-5xl"}>
      <div className="mb-6">
        <div className="flex flex-wrap items-center gap-2.5">
          <h1 className="text-[1.7rem] font-bold font-display tracking-tight text-foreground">{config.plural}</h1>
          {!isLoading && <span className="rounded-full bg-primary/10 text-primary text-xs font-bold px-2.5 py-1">{sorted.length}</span>}
          {!canWrite && <span className="text-[11px] font-semibold rounded-full bg-muted px-2.5 py-1 text-muted-foreground">Read-only</span>}
          <div className="ml-auto flex items-center gap-2">
            {canWrite && config.mediaImport && (
              <button onClick={() => setMediaOpen(true)} className="inline-flex items-center gap-2 rounded-xl border border-primary/40 text-primary font-semibold px-4 py-2.5 text-sm hover:bg-primary/10 transition-colors">
                <FolderOpen className="w-4 h-4" /> Add from library
              </button>
            )}
            {canWrite && (
              <button onClick={openNew} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-4 py-2.5 text-sm shadow-sm hover:opacity-90 transition-opacity">
                <Plus className="w-4 h-4" /> New {config.singular.toLowerCase()}
              </button>
            )}
          </div>
        </div>
        {config.description && <p className="text-sm text-muted-foreground mt-2 max-w-2xl leading-relaxed">{config.description}</p>}

        {/* Live / Drafts / Archive. A tab with nothing in it is hidden, except
            Live — which stays put so the control never moves under the cursor
            as the last draft is published. */}
        {!isLoading && (
          <div className="mt-4 flex items-center gap-1 border-b border-border" role="tablist" aria-label={`Filter ${config.plural.toLowerCase()}`}>
            {TABS.filter((t) => t.id === "live" || counts[t.id] > 0).map((t) => {
              const on = tab === t.id;
              return (
                <button
                  key={t.id}
                  role="tab"
                  aria-selected={on}
                  title={t.hint}
                  onClick={() => setTab(t.id)}
                  className={`relative -mb-px px-3.5 py-2 text-sm font-semibold border-b-2 transition-colors ${
                    on ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}
                >
                  {t.label}
                  <span className={`ml-1.5 text-[11px] font-bold tabular-nums rounded-full px-1.5 py-0.5 ${
                    on ? "bg-primary/10 text-primary" : "bg-muted text-muted-foreground"}`}>{counts[t.id]}</span>
                </button>
              );
            })}
          </div>
        )}

        {!isLoading && inTab.length > 4 && (
          <div className="mt-3 flex items-center gap-1.5 rounded-lg border border-border bg-background px-2.5 py-1.5 max-w-xs focus-within:ring-2 focus-within:ring-primary/40">
            <Search className="w-4 h-4 text-muted-foreground shrink-0" />
            <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder={`Search ${config.plural.toLowerCase()}…`} className="w-full bg-transparent text-sm text-foreground outline-none" />
            {query && <button onClick={() => setQuery("")} className="text-muted-foreground hover:text-foreground" title="Clear search"><X className="w-3.5 h-3.5" /></button>}
          </div>
        )}
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
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-14 text-center">
          <div className="w-12 h-12 rounded-2xl bg-primary/10 grid place-items-center mx-auto mb-3"><Plus className="w-6 h-6 text-primary" /></div>
          <p className="font-semibold text-foreground">No {config.plural.toLowerCase()} yet</p>
          <p className="text-sm text-muted-foreground mt-1">{canWrite ? `Create your first ${config.singular.toLowerCase()} to get started.` : "Nothing here yet."}</p>
          {canWrite && <button onClick={openNew} className="mt-4 inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-4 py-2.5 text-sm hover:opacity-90"><Plus className="w-4 h-4" /> New {config.singular.toLowerCase()}</button>}
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card/60 p-12 text-center text-muted-foreground">
          {q ? (
            <>No {config.plural.toLowerCase()} match “{query}”{tab !== "live" && <> in {TABS.find((t) => t.id === tab)?.label}</>}. <button onClick={() => setQuery("")} className="text-primary hover:underline ml-1">Clear</button></>
          ) : tab === "draft" ? (
            <>Nothing in drafts — every {config.singular.toLowerCase()} is either live or archived.</>
          ) : tab === "archive" ? (
            <>Nothing archived. Removed and archived {config.plural.toLowerCase()} collect here, and can be restored.</>
          ) : (
            <>Nothing is live yet. Publish something from Drafts to put it on the site.</>
          )}
        </div>
      ) : config.splitBy ? (
        <div className="grid md:grid-cols-2 gap-5 items-start">
          {([
            { label: config.splitBy.leftLabel, tone: "bg-primary", rows: filtered.filter((r) => String(r[config.splitBy!.field]) === config.splitBy!.left) },
            { label: config.splitBy.rightLabel, tone: "bg-amber-500", rows: filtered.filter((r) => config.splitBy!.right.includes(String(r[config.splitBy!.field]))) },
          ]).map((col) => (
            <div key={col.label} className="rounded-2xl border border-border/60 bg-card/40 p-3 sm:p-4">
              <h2 className="flex items-center gap-2 text-sm font-bold text-foreground mb-3 px-1">
                <span className={`w-2.5 h-2.5 rounded-full ${col.tone}`} />{col.label}
                <span className="ml-auto text-xs font-semibold text-muted-foreground rounded-full bg-muted px-2 py-0.5">{col.rows.length}</span>
              </h2>
              {col.rows.length === 0 ? <p className="text-sm text-muted-foreground px-1 py-6 text-center">None yet.</p> : <ul className="space-y-2">{col.rows.map(renderRow)}</ul>}
            </div>
          ))}
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
        <ul className="space-y-2">{filtered.map(renderRow)}</ul>
      )}

      {/* Editor drawer */}
      {(isNew || editing) && (
        <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm" onClick={close}>
          <div
            className="w-full max-w-xl h-full surface border-l border-border shadow-elevated flex flex-col"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center gap-3 px-5 h-16 border-b border-border shrink-0">
              <div className="w-9 h-9 rounded-xl gradient-hero grid place-items-center text-white shrink-0">
                {isNew ? <Plus className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
              </div>
              <div className="min-w-0">
                <h2 className="font-bold font-display text-foreground truncate leading-tight">
                  {isNew ? `New ${config.singular.toLowerCase()}` : `Edit ${config.singular.toLowerCase()}`}
                </h2>
                <p className="text-[11px] text-muted-foreground">{config.plural}</p>
              </div>
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
                {/* The fields above are the post's data; its LAYOUT is built on
                    the page itself, the same way pages work. Only offered once
                    the row exists — a brand-new post has no page to open yet. */}
                {config.editOnPage && config.viewUrl && (editing || fromStatic) && (
                  <a
                    href={config.viewUrl(editing ?? draft)}
                    target="_blank"
                    rel="noreferrer"
                    title="Open the live post and build it with blocks"
                    className="inline-flex items-center gap-1.5 rounded-xl border border-primary/40 bg-primary/5 px-4 py-2.5 text-sm font-semibold text-primary hover:bg-primary/10 transition-colors"
                  >
                    <LayoutTemplate className="w-4 h-4" /> {config.editOnPageLabel ?? "Edit on page"}
                  </a>
                )}
                {!canPublish && <span className="text-xs text-muted-foreground ml-auto">Saved as a draft — an editor can publish it.</span>}
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
