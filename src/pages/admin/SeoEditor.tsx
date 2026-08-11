// Site-wide SEO settings (site_settings key = 'seo'). Mirrors ThemeEditor.tsx.
//
// These are the DEFAULTS beneath every page: a page's own SEO override always
// wins, and anything left blank here falls back to src/data/seo.ts.

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Loader2, Save, AlertCircle, Search, RotateCcw } from "lucide-react";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";
import { SEO_DEFAULT, applyTitleTemplate, type SeoSettings } from "@/data/seo";
import { mergeSeo } from "@/lib/seo-settings";
import { useEditorAuth } from "@/lib/auth";
import PageHeader from "@/components/admin/PageHeader";

interface SettingRow { id: string; key: string; value: Partial<SeoSettings> }

const inputClass =
  "w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40";
const labelClass = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

/** Module scope on purpose — an inline component would remount and steal focus
 *  on every keystroke (the bug fixed in ThemeEditor). */
const Field = ({
  label, hint, value, onChange, placeholder, max, textarea,
}: {
  label: string; hint?: string; value: string; onChange: (v: string) => void;
  placeholder?: string; max?: number; textarea?: boolean;
}) => {
  const len = value.trim().length;
  const over = max !== undefined && len > max;
  return (
    <div>
      <label className={labelClass}>{label}</label>
      {textarea
        ? <textarea rows={3} value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={`${inputClass} resize-y`} />
        : <input value={value} onChange={(e) => onChange(e.target.value)} placeholder={placeholder} className={inputClass} />}
      <div className="mt-1 flex items-start gap-2 text-[11px]">
        {hint && <span className="text-muted-foreground flex-1">{hint}</span>}
        {max !== undefined && (
          <span className={`ml-auto tabular-nums shrink-0 ${over ? "text-destructive font-semibold" : "text-muted-foreground"}`}>
            {len}/{max}{over ? " — search engines will truncate" : ""}
          </span>
        )}
      </div>
    </div>
  );
};

const SeoEditor = () => {
  const qc = useQueryClient();
  const auth = useEditorAuth();
  const role = auth.status === "editor" ? auth.editor.role : "viewer";
  const canWrite = role === "admin" || role === "editor";

  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin-collection", "site_settings"],
    queryFn: () => listRows<SettingRow>("site_settings"),
    retry: false,
  });
  const row = rows.find((r) => r.key === "seo");

  const [form, setForm] = useState<SeoSettings>(SEO_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => { setForm(mergeSeo(row?.value)); setDirty(false); }, [row]);

  const set = (patch: Partial<SeoSettings>) => { setForm((f) => ({ ...f, ...patch })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      // 0010_site_settings.sql has no updated_at trigger, so stamp it here.
      const payload = { key: "seo", value: form, updated_at: new Date().toISOString() };
      if (row) await updateRow("site_settings", row.id, payload);
      else await insertRow("site_settings", payload);
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_settings"] });
      qc.invalidateQueries({ queryKey: ["site-setting", "seo"] });
      toast.success("SEO defaults saved — they apply to every page without its own override");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  const previewTitle = applyTitleTemplate("EV Charging 101", form);

  return (
    <div className="max-w-2xl">
      <PageHeader
        icon={Search}
        title="SEO"
        subtitle="Defaults for search results and link previews across the whole site. Any page with its own SEO settings overrides these."
      />

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>Couldn't load saved settings — the <span className="font-mono">site_settings</span> table may not exist yet (run migration 0010).</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-6">
          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">Identity</div>
            <Field label="Site name" value={form.siteName} onChange={(v) => set({ siteName: v })} hint="Your brand, shown in link previews." />
            <Field
              label="Title template" value={form.titleTemplate} onChange={(v) => set({ titleTemplate: v })}
              placeholder="%s — Electrifying the US"
              hint="%s is replaced by each page's own title. Keep the %s, or every page shares one title."
            />
            <div className="rounded-xl bg-background border border-border px-3.5 py-2.5">
              <div className="text-[11px] font-semibold uppercase tracking-wide text-muted-foreground mb-1">Preview</div>
              <div className="text-sm text-foreground truncate" title={previewTitle}>{previewTitle}</div>
              <div className="text-[11px] text-muted-foreground mt-0.5">how a page titled “EV Charging 101” appears</div>
            </div>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm space-y-5">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">Fallbacks</div>
            <Field
              label="Default title" value={form.defaultTitle} onChange={(v) => set({ defaultTitle: v })} max={60}
              hint="Used for the home page and any page with no title of its own."
            />
            <Field
              label="Default description" textarea max={160}
              value={form.defaultDescription} onChange={(v) => set({ defaultDescription: v })}
              hint="The grey text under your link in search results."
            />
            <Field
              label="Default share image" value={form.defaultImage} onChange={(v) => set({ defaultImage: v })}
              placeholder="/og-image.jpg" hint="Shown when a page is shared. 1200×630 works best."
            />
            <Field
              label="X / Twitter handle" value={form.twitterSite ?? ""} onChange={(v) => set({ twitterSite: v })}
              placeholder="@yourhandle" hint="Optional — credited on shared cards."
            />
          </div>

          <div className="sticky bottom-0 -mx-4 md:mx-0 border-t border-border bg-background/95 backdrop-blur px-4 md:px-0 py-3 flex flex-wrap items-center gap-2">
            <button onClick={save} disabled={saving || !canWrite || !dirty} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save
            </button>
            <button
              onClick={() => { setForm(SEO_DEFAULT); setDirty(true); }}
              disabled={!canWrite}
              className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted disabled:opacity-60"
            >
              <RotateCcw className="w-4 h-4" /> Reset to defaults
            </button>
            {dirty && <span className="text-xs text-amber-600 font-medium">Unsaved changes</span>}
            {!canWrite && <span className="text-xs text-muted-foreground">Read-only — ask an admin to change these.</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default SeoEditor;
