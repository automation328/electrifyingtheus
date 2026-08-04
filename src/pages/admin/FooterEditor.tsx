// CMS editor for the footer. Saves to site_settings (key='footer'); the Footer
// reads it and falls back to the coded default. The newsletter form stays in code.

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, RotateCcw, AlertCircle } from "lucide-react";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";
import { FOOTER_DEFAULT, type FooterContent, type FooterLink } from "@/data/footer";

interface SettingRow { id: string; key: string; value: Partial<FooterContent> }

const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir; if (j < 0 || j >= arr.length) return arr;
  const c = [...arr]; [c[i], c[j]] = [c[j], c[i]]; return c;
};

const input = "w-full rounded-lg border border-border bg-background px-3 py-2 text-sm";

// A reusable label+href list editor.
const LinkList = ({ links, onChange }: { links: FooterLink[]; onChange: (l: FooterLink[]) => void }) => (
  <div className="space-y-2">
    {links.map((l, i) => (
      <div key={i} className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
        <input value={l.label} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, label: e.target.value } : x)))} placeholder="Label" className={input} />
        <input value={l.href} onChange={(e) => onChange(links.map((x, j) => (j === i ? { ...x, href: e.target.value } : x)))} placeholder="/route, #anchor, https://…" className={`${input} font-mono`} />
        <div className="flex items-center gap-0.5">
          <button onClick={() => onChange(move(links, i, -1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"><ArrowUp className="w-4 h-4" /></button>
          <button onClick={() => onChange(move(links, i, 1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted"><ArrowDown className="w-4 h-4" /></button>
          <button onClick={() => onChange(links.filter((_, j) => j !== i))} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted"><Trash2 className="w-4 h-4" /></button>
        </div>
      </div>
    ))}
    <button onClick={() => onChange([...links, { label: "New link", href: "/" }])} className="inline-flex items-center gap-1.5 text-xs text-primary hover:underline"><Plus className="w-3.5 h-3.5" /> Add link</button>
  </div>
);

const FooterEditor = () => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin-collection", "site_settings"],
    queryFn: () => listRows<SettingRow>("site_settings"),
    retry: false,
  });
  const row = rows.find((r) => r.key === "footer");

  const [c, setC] = useState<FooterContent>(FOOTER_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (row?.value) { setC({ ...FOOTER_DEFAULT, ...row.value, columns: row.value.columns ?? FOOTER_DEFAULT.columns, bottomLinks: row.value.bottomLinks ?? FOOTER_DEFAULT.bottomLinks }); setDirty(false); }
  }, [row]);

  const up = (patch: Partial<FooterContent>) => { setC((prev) => ({ ...prev, ...patch })); setDirty(true); };

  const save = async () => {
    setSaving(true);
    try {
      const payload = { key: "footer", value: c, updated_at: new Date().toISOString() };
      if (row) await updateRow("site_settings", row.id, payload); else await insertRow("site_settings", payload);
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_settings"] });
      qc.invalidateQueries({ queryKey: ["site-setting", "footer"] });
      toast.success("Footer saved");
      setDirty(false);
    } catch (e) { toast.error(e instanceof Error ? e.message : "Save failed."); } finally { setSaving(false); }
  };

  const label = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
  const card = "rounded-2xl border border-border bg-card p-5";

  return (
    <div className="max-w-3xl">
      <h1 className="text-2xl font-bold font-display text-foreground mb-1">Footer</h1>
      <p className="text-sm text-muted-foreground mb-4">Edit the footer's tagline, contact email, link columns, and legal links. The newsletter signup form itself stays as-is.</p>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm mb-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>Couldn't load saved settings — the <span className="font-mono">site_settings</span> table may not exist yet (run migration 0010).</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <div className="space-y-5">
          <section className={card + " space-y-4"}>
            <h3 className="font-bold font-display text-foreground">Brand</h3>
            <div><label className={label}>Tagline</label><textarea rows={2} className={`${input} resize-y`} value={c.tagline} onChange={(e) => up({ tagline: e.target.value })} /></div>
            <div><label className={label}>Contact email</label><input className={input} value={c.email} onChange={(e) => up({ email: e.target.value })} /></div>
          </section>

          <section className={card}>
            <h3 className="font-bold font-display text-foreground mb-3">Link columns</h3>
            <div className="space-y-5">
              {c.columns.map((col, ci) => (
                <div key={ci} className="rounded-xl border border-border p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <input value={col.title} onChange={(e) => up({ columns: c.columns.map((x, j) => (j === ci ? { ...x, title: e.target.value } : x)) })} placeholder="Column heading" className={`${input} font-semibold max-w-xs`} />
                    <button onClick={() => up({ columns: c.columns.filter((_, j) => j !== ci) })} className="ml-auto p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted" title="Remove column"><Trash2 className="w-4 h-4" /></button>
                  </div>
                  <LinkList links={col.links} onChange={(links) => up({ columns: c.columns.map((x, j) => (j === ci ? { ...x, links } : x)) })} />
                </div>
              ))}
              <button onClick={() => up({ columns: [...c.columns, { title: "New column", links: [] }] })} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add column</button>
            </div>
          </section>

          <section className={card + " space-y-4"}>
            <h3 className="font-bold font-display text-foreground">Newsletter heading</h3>
            <div><label className={label}>Title</label><input className={input} value={c.newsletterTitle} onChange={(e) => up({ newsletterTitle: e.target.value })} /></div>
            <div><label className={label}>Subtext</label><textarea rows={2} className={`${input} resize-y`} value={c.newsletterText} onChange={(e) => up({ newsletterText: e.target.value })} /></div>
          </section>

          <section className={card}>
            <h3 className="font-bold font-display text-foreground mb-3">Bottom legal links</h3>
            <LinkList links={c.bottomLinks} onChange={(bottomLinks) => up({ bottomLinks })} />
          </section>

          <div className="sticky bottom-0 -mx-4 md:mx-0 border-t border-border bg-background/95 backdrop-blur px-4 md:px-0 py-3 flex items-center gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save footer
            </button>
            <button onClick={() => { setC(structuredClone(FOOTER_DEFAULT)); setDirty(true); }} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"><RotateCcw className="w-4 h-4" /> Reset to default</button>
            {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          </div>
        </div>
      )}
    </div>
  );
};

export default FooterEditor;
