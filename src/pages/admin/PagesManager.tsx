// CMS editor for content-page prose (site_pages overrides). Lists the pages wired
// to EditableContentPage; each opens a structured editor for its headline copy,
// stats, body sections, and sources. Saving upserts a published/draft override;
// unset fields fall back to the page's static default.

import { useMemo, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  Loader2, Save, Plus, Trash2, ArrowUp, ArrowDown, RotateCcw, AlertCircle, FileText, ChevronRight,
} from "lucide-react";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";
import {
  EDITABLE_PAGES, PAGE_DEFAULTS, type PageOverride,
} from "@/lib/page-content";
import type { ContentStat, ContentSection, ContentSource } from "@/components/ContentPageLayout";

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

const RowTools = ({ onUp, onDown, onDelete }: { onUp: () => void; onDown: () => void; onDelete: () => void }) => (
  <div className="flex items-center gap-1 shrink-0">
    <button type="button" onClick={onUp} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
    <button type="button" onClick={onDown} className="p-1.5 rounded-lg text-muted-foreground hover:bg-muted" title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
    <button type="button" onClick={onDelete} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted" title="Remove"><Trash2 className="w-3.5 h-3.5" /></button>
  </div>
);

/* ── editor ──────────────────────────────────────────────────────────────── */
const PageEditor = ({
  path, initial, existing, onSaved,
}: {
  path: string; initial: PageOverride; existing: PageRow | undefined; onSaved: () => void;
}) => {
  const [form, setForm] = useState<PageOverride>(() => structuredClone(initial));
  const [status, setStatus] = useState(existing?.status ?? "draft");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const set = (patch: Partial<PageOverride>) => setForm((f) => ({ ...f, ...patch }));

  const stats = form.stats ?? [];
  const sections = form.sections ?? [];
  const sources = form.sources ?? [];

  const resetToDefault = () => { setForm(structuredClone(PAGE_DEFAULTS[path] ?? {})); toast.message("Loaded the site's default copy"); };

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
    const payload = { path, title: label, status, content, updated_at: new Date().toISOString() };
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
          <select value={status} onChange={(e) => setStatus(e.target.value)} className="rounded-xl border border-border bg-background px-3 py-2.5 text-sm">
            <option value="draft">Draft (hidden)</option>
            <option value="published">Published (live)</option>
          </select>
          <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
          </button>
          <button onClick={resetToDefault} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted">
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

  if (selected) {
    const existing = byPath.get(selected);
    const initial = existing?.content && Object.keys(existing.content).length ? existing.content : (PAGE_DEFAULTS[selected] ?? {});
    const label = EDITABLE_PAGES.find((p) => p.path === selected)?.label ?? selected;
    return (
      <div>
        <button onClick={() => setSelected(null)} className="text-sm text-muted-foreground hover:text-foreground mb-4">← All pages</button>
        <h1 className="text-2xl font-bold font-display text-foreground mb-1">{label}</h1>
        <p className="text-sm text-muted-foreground mb-6">{selected}</p>
        <PageEditor key={selected} path={selected} initial={initial} existing={existing} onSaved={onSaved} />
      </div>
    );
  }

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold font-display text-foreground mb-1">Pages</h1>
      <p className="text-sm text-muted-foreground mb-6">Edit the copy on content pages. Published edits override the built-in text.</p>
      <ul className="space-y-2">
        {EDITABLE_PAGES.map((p) => {
          const row = byPath.get(p.path);
          const state = !row ? "Default" : row.status === "published" ? "Published" : "Draft";
          const tone = state === "Published" ? "bg-primary/10 text-primary" : state === "Draft" ? "bg-amber-500/15 text-amber-600" : "bg-muted text-muted-foreground";
          return (
            <li key={p.path}>
              <button onClick={() => setSelected(p.path)} className="w-full flex items-center gap-3 rounded-2xl border border-border bg-card px-4 py-3.5 shadow-card hover:border-primary/40 transition-colors text-left">
                <FileText className="w-4 h-4 text-primary shrink-0" />
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-foreground truncate">{p.label}</div>
                  <div className="text-xs text-muted-foreground truncate">{p.path}</div>
                </div>
                <span className={`text-[10px] uppercase font-bold tracking-wide rounded-full px-2 py-0.5 ${tone}`}>{state}</span>
                <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />
              </button>
            </li>
          );
        })}
      </ul>
      {isLoading && <p className="text-sm text-muted-foreground mt-4"><Loader2 className="w-4 h-4 animate-spin inline" /> Loading…</p>}
    </div>
  );
};

export default PagesManager;
