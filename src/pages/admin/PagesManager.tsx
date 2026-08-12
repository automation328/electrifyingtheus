// CMS editor for content-page prose (site_pages overrides). Lists the pages wired
// to EditableContentPage; each opens a structured editor for its headline copy,
// stats, body sections, and sources. Saving upserts a published/draft override;
// unset fields fall back to the page's static default.

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, AlertCircle, FileText, ExternalLink, Copy, Eye,
} from "lucide-react";
// RotateCcw is shared by "Load default copy" and the archive Restore action.
import { listRows, insertRow, updateRow, deleteRow, destroyRow } from "@/lib/admin-api";
import {
  EDITABLE_PAGES, PAGE_DEFAULTS, type PageOverride,
} from "@/lib/page-content";
import type { ContentStat, ContentSection, ContentSource } from "@/components/ContentPageLayout";
import { useEditorAuth } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";

interface PageRow { id: string; path: string; title: string; status: string; content: PageOverride }

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

/* ── tiny array helpers ──────────────────────────────────────────────────── */
const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const copy = [...arr];
  [copy[i], copy[j]] = [copy[j], copy[i]];
  return copy;
};

/**
 * What a brand-new page starts with.
 *
 * Every content page already renders a hero band (its title header), and that
 * band is now an editable section in its own right — click it on the page and
 * the Inspector offers background, colour, height and alignment, plus delete.
 * So a new page is given a *styled* hero rather than a second hero built out of
 * blocks, which would have stacked two heroes on top of each other.
 */
function buildStarterContent(title: string): PageOverride {
  return {
    title,
    intro: "",
    hero: {
      align: "center",
      minH: 46,
      style: {
        gradient: { from: "hsl(var(--primary))", to: "hsl(var(--secondary))", angle: 135 },
        color: "#ffffff",
        padY: 112,
      },
    },
  };
}

/** The fields this form actually edits. Everything else in a PageOverride —
 *  blocks, styles, seo, heroImage, gallery, video, cleared — is owned by the
 *  on-page inline editor and must survive a reset, or "Load default copy" would
 *  silently discard work built there. */
const FORM_KEYS: (keyof PageOverride)[] = [
  "badge", "title", "highlight", "intro", "kicker", "pullQuote", "stats", "sections", "sources",
];

const RowTools = ({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) => (
  <div className="flex items-center gap-1 shrink-0">
    <button type="button" onClick={onUp} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
    <button type="button" onClick={onDown} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
    <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
  </div>
);

/* ── editor ──────────────────────────────────────────────────────────────── */
const PageEditor = ({
  path, initial, existing, onSaved, canWrite, canPublish,
}: {
  path: string; initial: PageOverride; existing: PageRow | undefined; onSaved: () => void; canWrite: boolean; canPublish: boolean;
}) => {
  const [form, setForm] = useState<PageOverride>(() => structuredClone(initial));
  const [status, setStatus] = useState(existing?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<PageOverride>) => setForm((f) => ({ ...f, ...patch }));

  const stats = form.stats ?? [];
  const sections = form.sections ?? [];
  const sources = form.sources ?? [];

  // Reset only the prose fields this form owns, and only when a stored default
  // actually exists. Blanking the whole object here used to wipe the blocks,
  // styles and SEO built in the on-page editor — with a success toast.
  const hasDefaults = Boolean(PAGE_DEFAULTS[path]);
  const resetToDefault = () => {
    const defaults = PAGE_DEFAULTS[path];
    if (!defaults) {
      toast.error("This page has no stored default copy — its text lives in the page itself. Use “Edit on page” to change it.");
      return;
    }
    setForm((f) => {
      const next = structuredClone(f);
      for (const k of FORM_KEYS) {
        const v = defaults[k];
        if (v === undefined) delete next[k];
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        else (next as any)[k] = typeof v === "object" && v !== null ? structuredClone(v) : v;
      }
      return next;
    });
    toast.message("Loaded the site's default copy");
  };

  const save = async () => {
    setSaving(true); setError("");
    // Drop empty top-level fields so they fall back to the static default.
    const content: PageOverride = {};
    for (const [k, v] of Object.entries(form)) {
      if (v === undefined || v === null) continue;
      if (typeof v === "string" && v.trim() === "") continue;
      if (Array.isArray(v) && v.length === 0) continue;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (content as any)[k] = v;
    }
    const label = EDITABLE_PAGES.find((p) => p.path === path)?.label ?? path;
    // Authors can only save drafts.
    const payload = { path, title: label, status: canPublish ? status : "draft", content, updated_at: new Date().toISOString() };
    try {
      if (existing) await updateRow("site_pages", existing.id, payload);
      else await insertRow("site_pages", payload);
      toast.success(status === "published" ? "Page published" : "Draft saved");
      onSaved();
    } catch (e) {
      setError(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-3xl">
      {/* Headline copy */}
      <section className="rounded-2xl border border-border bg-card p-5 space-y-4">
        <h3 className="font-bold font-display text-foreground">Headline</h3>
        <div className="grid sm:grid-cols-2 gap-4">
          <div><label className={labelClass}>Badge</label><input className={inputClass} value={form.badge ?? ""} onChange={(e) => set({ badge: e.target.value })} /></div>
          <div><label className={labelClass}>Kicker</label><input className={inputClass} value={form.kicker ?? ""} onChange={(e) => set({ kicker: e.target.value })} /></div>
          <div><label className={labelClass}>Title</label><input className={inputClass} value={form.title ?? ""} onChange={(e) => set({ title: e.target.value })} /></div>
          <div><label className={labelClass}>Highlight</label><input className={inputClass} value={form.highlight ?? ""} onChange={(e) => set({ highlight: e.target.value })} /></div>
        </div>
        <div><label className={labelClass}>Intro</label><textarea rows={3} className={`${inputClass} resize-y`} value={form.intro ?? ""} onChange={(e) => set({ intro: e.target.value })} /></div>
        <div><label className={labelClass}>Pull quote</label><textarea rows={2} className={`${inputClass} resize-y`} value={form.pullQuote ?? ""} onChange={(e) => set({ pullQuote: e.target.value })} /></div>
      </section>

      {/* Stats */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center mb-3">
          <h3 className="font-bold font-display text-foreground">Stats</h3>
          <button type="button" onClick={() => set({ stats: [...stats, { value: "", label: "" }] })} className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="space-y-2">
          {stats.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <input className={`${inputClass} max-w-[9rem]`} placeholder="Value" value={s.value} onChange={(e) => { const n = [...stats]; n[i] = { ...s, value: e.target.value }; set({ stats: n }); }} />
              <input className={inputClass} placeholder="Label" value={s.label} onChange={(e) => { const n = [...stats]; n[i] = { ...s, label: e.target.value }; set({ stats: n }); }} />
              <RowTools onUp={() => set({ stats: move(stats, i, -1) })} onDown={() => set({ stats: move(stats, i, 1) })} onDelete={() => set({ stats: stats.filter((_, k) => k !== i) })} />
            </div>
          ))}
          {stats.length === 0 && <p className="text-sm text-muted-foreground">No stats.</p>}
        </div>
      </section>

      {/* Sections */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center mb-3">
          <h3 className="font-bold font-display text-foreground">Body sections</h3>
          <button type="button" onClick={() => set({ sections: [...sections, { heading: "", body: [""] }] })} className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add section</button>
        </div>
        <div className="space-y-4">
          {sections.map((sec, i) => (
            <div key={i} className="rounded-xl border border-border p-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs font-bold text-muted-foreground">{String(i + 1).padStart(2, "0")}</span>
                <input className={inputClass} placeholder="Heading" value={sec.heading} onChange={(e) => { const n = [...sections]; n[i] = { ...sec, heading: e.target.value }; set({ sections: n }); }} />
                <RowTools onUp={() => set({ sections: move(sections, i, -1) })} onDown={() => set({ sections: move(sections, i, 1) })} onDelete={() => set({ sections: sections.filter((_, k) => k !== i) })} />
              </div>
              <label className={labelClass}>Body — one paragraph per blank line</label>
              <textarea rows={5} className={`${inputClass} resize-y mb-2`} value={(sec.body ?? []).join("\n\n")} onChange={(e) => { const n = [...sections]; n[i] = { ...sec, body: e.target.value.split(/\n\s*\n/).map((p) => p.trim()).filter(Boolean) }; set({ sections: n }); }} />
              <label className={labelClass}>Bullet list — one per line (optional)</label>
              <textarea rows={3} className={`${inputClass} resize-y`} value={(sec.list ?? []).join("\n")} onChange={(e) => { const n = [...sections]; const items = e.target.value.split("\n").map((p) => p.trim()).filter(Boolean); n[i] = { ...sec, list: items.length ? items : undefined }; set({ sections: n }); }} />
            </div>
          ))}
          {sections.length === 0 && <p className="text-sm text-muted-foreground">No sections.</p>}
        </div>
      </section>

      {/* Sources */}
      <section className="rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center mb-3">
          <h3 className="font-bold font-display text-foreground">Sources</h3>
          <button type="button" onClick={() => set({ sources: [...sources, { label: "", url: "" }] })} className="ml-auto inline-flex items-center gap-1 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add</button>
        </div>
        <div className="space-y-2">
          {sources.map((s, i) => (
            <div key={i} className="flex items-start gap-2">
              <input className={inputClass} placeholder="Label" value={s.label} onChange={(e) => { const n = [...sources]; n[i] = { ...s, label: e.target.value }; set({ sources: n }); }} />
              <input className={inputClass} placeholder="https://…" value={s.url} onChange={(e) => { const n = [...sources]; n[i] = { ...s, url: e.target.value }; set({ sources: n }); }} />
              <RowTools onUp={() => set({ sources: move(sources, i, -1) })} onDown={() => set({ sources: move(sources, i, 1) })} onDelete={() => set({ sources: sources.filter((_, k) => k !== i) })} />
            </div>
          ))}
          {sources.length === 0 && <p className="text-sm text-muted-foreground">No sources.</p>}
        </div>
      </section>

      {/* Actions */}
      <div className="sticky bottom-0 -mx-4 md:mx-0 border-t border-border bg-background/95 backdrop-blur px-4 md:px-0 py-3">
        {error && <p className="text-sm text-destructive mb-2 flex items-center gap-1.5"><AlertCircle className="w-4 h-4" /> {error}</p>}
        <div className="flex flex-wrap items-center gap-2">
          <select value={canPublish ? status : "draft"} onChange={(e) => setStatus(e.target.value)} disabled={!canPublish} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm disabled:opacity-60">
            <option value="draft">Draft (hidden)</option>
            {canPublish && <option value="published">Published (live)</option>}
          </select>
          <button onClick={save} disabled={saving || !canWrite} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
          {!canPublish && canWrite && <span className="text-xs text-muted-foreground">Saved as a draft — an editor can publish.</span>}
          <button
            onClick={resetToDefault}
            disabled={!hasDefaults}
            title={hasDefaults ? "Replace the text fields with the site's default copy" : "This page has no stored default copy — edit it on the page instead"}
            className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:bg-background"
          >
            <RotateCcw className="w-4 h-4" /> Load default copy
          </button>
          <a href={path} target="_blank" rel="noreferrer" className="text-sm text-muted-foreground hover:text-foreground ml-auto">View page ↗</a>
        </div>
      </div>
    </div>
  );
};

/* ── manager (page picker → editor) ──────────────────────────────────────── */
const PagesManager = () => {
  const qc = useQueryClient();
  const auth = useEditorAuth();
  const role = auth.status === "editor" ? auth.editor.role : "viewer";
  const canWrite = role !== "viewer";
  const canPublish = role === "admin" || role === "editor";
  const isAdmin = role === "admin";   // permanent delete of an archived page
  const [selected, setSelected] = useState<string | null>(null);

  const { data: rows = [], isLoading } = useQuery({
    queryKey: ["admin-collection", "site_pages"],
    queryFn: () => listRows<PageRow>("site_pages"),
  });
  const byPath = useMemo(() => {
    const m = new Map<string, PageRow>();
    for (const r of rows) m.set(r.path, r);
    return m;
  }, [rows]);

  const onSaved = () => {
    qc.invalidateQueries({ queryKey: ["admin-collection", "site_pages"] });
    if (selected) qc.invalidateQueries({ queryKey: ["site-page", selected] });
  };

  // Custom (CMS-created) pages = DB rows whose path isn't a built-in coded route.
  const customPages = useMemo(
    () => rows.filter((r) => !EDITABLE_PAGES.some((p) => p.path === r.path)),
    [rows],
  );

  const [newOpen, setNewOpen] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [creating, setCreating] = useState(false);
  const slug = newTitle.toLowerCase().trim().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

  const createPage = async () => {
    if (!slug) return;
    const path = `/${slug}`;
    if (rows.some((r) => r.path === path) || EDITABLE_PAGES.some((p) => p.path === path)) {
      toast.error("A page with that address already exists."); return;
    }
    setCreating(true);
    try {
      await insertRow("site_pages", {
        path,
        title: newTitle.trim(),
        status: "draft",
        content: buildStarterContent(newTitle.trim()),
        updated_at: new Date().toISOString(),
      });
      toast.success("Page created with a hero section — opening it to edit");
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_pages"] });
      setNewOpen(false); setNewTitle("");
      window.open(path, "_blank");
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't create the page.");
    } finally {
      setCreating(false);
    }
  };

  const duplicatePage = async (row: PageRow) => {
    const title = window.prompt("Duplicate page — title for the copy:", `${row.title || "Page"} (copy)`);
    if (title === null) return;
    const t = title.trim();
    const s = t.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    if (!s) { toast.error("Enter a valid title."); return; }
    const path = `/${s}`;
    if (rows.some((r) => r.path === path) || EDITABLE_PAGES.some((p) => p.path === path)) {
      toast.error("A page with that address already exists."); return;
    }
    try {
      const content: PageOverride = { ...structuredClone(row.content ?? {}), title: t };
      await insertRow("site_pages", { path, title: t, status: "draft", content, updated_at: new Date().toISOString() });
      toast.success("Page duplicated as a draft");
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_pages"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Duplicate failed.");
    }
  };

  // Deleting a page ARCHIVES it (see api/admin.ts): it comes off the live site
  // but stays listed here as "Archived" so it can be restored.
  const deletePage = async (row: PageRow) => {
    if (!window.confirm(`Move "${row.title || row.path}" to the archive? It comes off the live site, and you can restore it here.`)) return;
    try {
      await deleteRow("site_pages", row.id);
      toast.success("Page archived — you can restore it any time");
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_pages"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Couldn't archive it.");
    }
  };

  /** Bring an archived page back as a draft — never straight back onto the site. */
  const restorePage = async (row: PageRow) => {
    try {
      await updateRow("site_pages", row.id, { status: "draft", updated_at: new Date().toISOString() });
      toast.success("Page restored as a draft");
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_pages"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Restore failed.");
    }
  };

  const destroyPage = async (row: PageRow) => {
    if (!window.confirm(`Permanently delete "${row.title || row.path}"? This cannot be undone and it will NOT go to the archive.`)) return;
    try {
      await destroyRow("site_pages", row.id);
      toast.success("Page permanently deleted");
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_pages"] });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  if (selected) {
    const existing = byPath.get(selected);
    const initial = existing?.content && Object.keys(existing.content).length ? existing.content : (PAGE_DEFAULTS[selected] ?? {});
    const label = EDITABLE_PAGES.find((p) => p.path === selected)?.label ?? selected;
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4">← All pages</button>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">{label}</h1>
        <p className="text-sm text-muted-foreground mb-6">{selected}</p>
        <PageEditor key={selected} path={selected} initial={initial} existing={existing} onSaved={onSaved} canWrite={canWrite} canPublish={canPublish} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <PageHeader
        icon={FileText}
        title="Pages"
        subtitle={<><strong className="text-foreground">Edit on page</strong> opens the live page to edit text and add blocks in place. Or create a brand-new page built entirely from blocks.</>}
        actions={canWrite && (
          <button onClick={() => setNewOpen(true)} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-4 py-2.5 text-sm hover:opacity-90 transition-opacity">
            <Plus className="w-4 h-4" /> New page
          </button>
        )}
      />

      {customPages.length > 0 && (
        <>
          <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Your pages</h2>
          <ul className="space-y-2 mb-8">
            {customPages.map((row) => {
              const archived = row.status === "archived";
              const state = archived ? "Archived" : row.status === "published" ? "Published" : "Draft";
              const tone = state === "Published"
                ? "bg-primary/10 text-primary"
                : archived ? "bg-muted text-muted-foreground" : "bg-amber-500/15 text-amber-600";
              return (
                <li key={row.id} className={`flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-card ${archived ? "opacity-70" : ""}`}>
                  <FileText className="w-4 h-4 text-primary shrink-0" />
                  <div className="min-w-0 flex-1">
                    <div className="font-semibold text-foreground truncate">{row.title || row.path}</div>
                    <div className="text-xs text-muted-foreground truncate">{row.path}</div>
                  </div>
                  <span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${tone}`}>{state}</span>
                  {archived ? (
                    <>
                      {canPublish && (
                        <button onClick={() => restorePage(row)} className="inline-flex items-center gap-1.5 rounded-lg border border-primary/50 text-primary text-xs font-semibold px-3 py-2 hover:bg-primary/10" title="Restore — brings it back as a draft">
                          <RotateCcw className="w-3.5 h-3.5" /> Restore
                        </button>
                      )}
                      {isAdmin && (
                        <button onClick={() => destroyPage(row)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted" title="Delete permanently — cannot be undone">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      )}
                    </>
                  ) : (
                    <>
                      <a href={row.path} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors" title="View / preview the live page"><Eye className="w-4 h-4" /></a>
                      <a href={row.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg gradient-hero text-white text-xs font-semibold px-3 py-2 hover:opacity-90" title="Edit on the live page">Edit on page <ExternalLink className="w-3.5 h-3.5" /></a>
                      {canWrite && <button onClick={() => duplicatePage(row)} className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted" title="Duplicate page"><Copy className="w-4 h-4" /></button>}
                      {canPublish && <button onClick={() => deletePage(row)} className="p-2 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted" title="Move to archive"><Trash2 className="w-4 h-4" /></button>}
                    </>
                  )}
                </li>
              );
            })}
          </ul>
        </>
      )}

      <h2 className="text-xs font-bold uppercase tracking-wide text-muted-foreground mb-2">Built-in pages</h2>
      <ul className="space-y-2">
        {EDITABLE_PAGES.map((p) => {
          const row = byPath.get(p.path);
          const state = !row ? "Default" : row.status === "published" ? "Published" : "Draft";
          const tone = state === "Published" ? "bg-primary/10 text-primary" : state === "Draft" ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground";
          return (
            <li key={p.path} className="flex items-center gap-2 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-card">
              <FileText className="w-4 h-4 text-primary shrink-0" />
              <button onClick={() => setSelected(p.path)} className="min-w-0 flex-1 text-left" title="Open the form editor">
                <div className="font-semibold text-foreground truncate">{p.label}</div>
                <div className="text-xs text-muted-foreground truncate">{p.path}</div>
              </button>
              <span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${tone}`}>{state}</span>
              <a href={p.path} target="_blank" rel="noreferrer" className="p-2 rounded-lg text-muted-foreground hover:text-primary hover:bg-muted transition-colors" title="View / preview the live page"><Eye className="w-4 h-4" /></a>
              <a href={p.path} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1.5 rounded-lg gradient-hero text-white text-xs font-semibold px-3 py-2 hover:opacity-90 transition-opacity" title="Edit on the live page">
                Edit on page <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </li>
          );
        })}
      </ul>
      {isLoading && <p className="text-sm text-muted-foreground mt-4"><Loader2 className="w-4 h-4 animate-spin inline" /> Loading…</p>}

      {newOpen && (
        <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 backdrop-blur-sm p-4" onClick={() => setNewOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border surface p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold font-display text-foreground mb-3">New page</h3>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Page title</label>
            <input autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} onKeyDown={(e) => { if (e.key === "Enter") createPage(); }} placeholder="e.g. Fleet Solutions" className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm" />
            {slug && <p className="text-xs text-muted-foreground mt-2">Address: <span className="font-mono text-foreground">/{slug}</span></p>}
            <div className="mt-4 flex items-center gap-2">
              <button onClick={createPage} disabled={!slug || creating} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
                {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />} Create & edit
              </button>
              <button onClick={() => setNewOpen(false)} className="rounded-xl border border-border bg-background px-5 py-2.5 text-sm font-medium text-foreground hover:bg-muted">Cancel</button>
            </div>
            <p className="text-xs text-muted-foreground mt-3">Creates a draft page you build with blocks. It won't be public until you Publish it on the page.</p>
          </div>
        </div>
      )}
    </div>
  );
};

export default PagesManager;
