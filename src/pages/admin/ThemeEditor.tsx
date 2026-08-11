// CMS editor for global brand colors. Saves hex to site_settings (key='theme');
// ThemeApplier turns them into the site's --primary / --secondary CSS variables.

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Save, Loader2, RotateCcw, AlertCircle, ArrowRight, Palette } from "lucide-react";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";
import { hslTripletToHex, HEADING_FONTS, BODY_FONTS } from "@/lib/theme-settings";
import PageHeader from "@/components/admin/PageHeader";
import { useUnsavedGuard } from "@/hooks/use-unsaved-guard";

interface SettingRow { id: string; key: string; value: { primary?: string; secondary?: string; headingFont?: string; bodyFont?: string } }

// Read the current site colour for a CSS var (fallback if no override saved yet).
const currentHex = (varName: string, fallback: string) => {
  if (typeof window === "undefined") return fallback;
  const triplet = getComputedStyle(document.documentElement).getPropertyValue(varName).trim();
  return hslTripletToHex(triplet) || fallback;
};

/** Module scope on purpose: declared inside ThemeEditor it got a new identity on
 *  every keystroke, so React remounted the inputs and the hex field lost focus. */
const Row = ({ label, value, onChange }: { label: string; value: string; onChange: (v: string) => void }) => (
  <div className="flex items-center gap-4">
    <input type="color" value={value} onChange={(e) => onChange(e.target.value)} className="w-12 h-12 rounded-xl border border-border bg-transparent cursor-pointer" />
    <div>
      <div className="font-semibold text-foreground">{label}</div>
      <input value={value} onChange={(e) => onChange(e.target.value)} className="mt-1 w-32 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-mono" />
    </div>
  </div>
);

const ThemeEditor = () => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin-collection", "site_settings"],
    queryFn: () => listRows<SettingRow>("site_settings"),
    retry: false,
  });
  const row = rows.find((r) => r.key === "theme");

  const [primary, setPrimary] = useState("#0057b7");
  const [secondary, setSecondary] = useState("#359c67");
  const [headingFont, setHeadingFont] = useState("Space Grotesk");
  const [bodyFont, setBodyFont] = useState("Inter");
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);
  useUnsavedGuard(dirty);

  useEffect(() => {
    setPrimary(row?.value?.primary || currentHex("--primary", "#0057b7"));
    setSecondary(row?.value?.secondary || currentHex("--secondary", "#359c67"));
    setHeadingFont(row?.value?.headingFont || "Space Grotesk");
    setBodyFont(row?.value?.bodyFont || "Inter");
    setDirty(false);
  }, [row]);

  const save = async () => {
    setSaving(true);
    try {
      const payload = { key: "theme", value: { primary, secondary, headingFont, bodyFont }, updated_at: new Date().toISOString() };
      if (row) await updateRow("site_settings", row.id, payload); else await insertRow("site_settings", payload);
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_settings"] });
      qc.invalidateQueries({ queryKey: ["site-setting", "theme"] });
      toast.success("Theme saved — colors updated site-wide");
      setDirty(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed."); } finally { setSaving(false); }
  };

  return (
    <div className="max-w-2xl">
      <PageHeader
        icon={Palette}
        title="Theme"
        subtitle="Your brand colors and fonts, applied across the whole site — buttons, links, highlights, and gradients."
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
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">Brand colors</div>
            <Row label="Primary" value={primary} onChange={(v) => { setPrimary(v); setDirty(true); }} />
            <Row label="Secondary" value={secondary} onChange={(v) => { setSecondary(v); setDirty(true); }} />
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm grid sm:grid-cols-2 gap-5">
            <div className="sm:col-span-2 text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70">Fonts</div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Heading font</label>
              <select value={headingFont} onChange={(e) => { setHeadingFont(e.target.value); setDirty(true); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {HEADING_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Body font</label>
              <select value={bodyFont} onChange={(e) => { setBodyFont(e.target.value); setDirty(true); }} className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm">
                {BODY_FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
              </select>
            </div>
            <p className="sm:col-span-2 text-xs text-muted-foreground">Fonts are loaded from Google Fonts and applied site-wide (headings vs body). Defaults keep the current look.</p>
          </div>

          <div className="rounded-2xl border border-border bg-card p-6 shadow-sm">
            <div className="text-[11px] font-bold uppercase tracking-wide text-muted-foreground/70 mb-3">Preview</div>
            <div className="flex flex-wrap items-center gap-3">
              <button className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: primary }}>Primary button <ArrowRight className="w-4 h-4" /></button>
              <button className="inline-flex items-center gap-1.5 rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundColor: secondary }}>Secondary</button>
              <span className="inline-block rounded-xl px-5 py-2.5 text-sm font-semibold text-white" style={{ backgroundImage: `linear-gradient(90deg, ${primary}, ${secondary})` }}>Gradient</span>
              <a className="font-semibold" style={{ color: primary }} href="#">Link color</a>
            </div>
          </div>

          <div className="sticky bottom-0 -mx-4 md:mx-0 border-t border-border bg-background/95 backdrop-blur px-4 md:px-0 py-3 flex items-center gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save colors
            </button>
            <button onClick={() => { setPrimary(currentHex("--primary", "#0057b7")); setSecondary(currentHex("--secondary", "#359c67")); setDirty(true); }} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"><RotateCcw className="w-4 h-4" /> Reset</button>
            {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default ThemeEditor;
