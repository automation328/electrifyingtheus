// CMS editor for the top navigation menu. Saves to site_settings (key='nav');
// the Navbar reads it and falls back to the coded default.

import { useEffect, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Plus, Trash2, ArrowUp, ArrowDown, Save, Loader2, RotateCcw, AlertCircle, ExternalLink } from "lucide-react";
import { listRows, insertRow, updateRow } from "@/lib/admin-api";
import { NAV_DEFAULT, type NavItem } from "@/data/nav";

interface SettingRow { id: string; key: string; value: { items?: NavItem[] } }

const move = <T,>(arr: T[], i: number, dir: -1 | 1): T[] => {
  const j = i + dir;
  if (j < 0 || j >= arr.length) return arr;
  const c = [...arr];
  [c[i], c[j]] = [c[j], c[i]];
  return c;
};

const NavEditor = () => {
  const qc = useQueryClient();
  const { data: rows = [], isLoading, error } = useQuery({
    queryKey: ["admin-collection", "site_settings"],
    queryFn: () => listRows<SettingRow>("site_settings"),
    retry: false,
  });
  const row = rows.find((r) => r.key === "nav");

  const [items, setItems] = useState<NavItem[]>(NAV_DEFAULT);
  const [saving, setSaving] = useState(false);
  const [dirty, setDirty] = useState(false);

  useEffect(() => {
    if (row?.value?.items && Array.isArray(row.value.items)) { setItems(row.value.items); setDirty(false); }
  }, [row]);

  const update = (next: NavItem[]) => { setItems(next); setDirty(true); };
  const setField = (i: number, patch: Partial<NavItem>) => update(items.map((it, j) => (j === i ? { ...it, ...patch } : it)));

  const save = async () => {
    setSaving(true);
    try {
      const payload = { key: "nav", value: { items }, updated_at: new Date().toISOString() };
      if (row) await updateRow("site_settings", row.id, payload);
      else await insertRow("site_settings", payload);
      qc.invalidateQueries({ queryKey: ["admin-collection", "site_settings"] });
      qc.invalidateQueries({ queryKey: ["site-setting", "nav"] });
      toast.success("Navigation saved");
      setDirty(false);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Save failed.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex items-start gap-3 mb-2">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Navigation</h1>
          <p className="text-sm text-muted-foreground max-w-lg">The top menu. Reorder, rename, add or remove links. Links can be a route (<span className="font-mono">/events</span>), an on-page anchor (<span className="font-mono">#about</span>), or an external URL.</p>
        </div>
        <a href="/" target="_blank" rel="noreferrer" className="ml-auto shrink-0 text-sm text-muted-foreground hover:text-foreground inline-flex items-center gap-1.5">Preview <ExternalLink className="w-3.5 h-3.5" /></a>
      </div>

      {error && (
        <div className="rounded-xl border border-amber-300 bg-amber-50 text-amber-900 px-4 py-3 text-sm my-4 flex items-start gap-2">
          <AlertCircle className="w-4 h-4 mt-0.5 shrink-0" /><span>Couldn't load saved settings — the <span className="font-mono">site_settings</span> table may not exist yet (run migration 0010). You can still edit and save once it's created.</span>
        </div>
      )}

      {isLoading ? (
        <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : (
        <>
          <div className="grid grid-cols-[1fr_1fr_auto] gap-2 px-3 mt-4 mb-1 text-[11px] font-semibold uppercase tracking-wide text-muted-foreground">
            <span>Label</span><span>Link</span><span></span>
          </div>
          <ul className="space-y-2">
            {items.map((it, i) => (
              <li key={i} className="rounded-2xl border border-border bg-card p-3 shadow-card">
                <div className="grid grid-cols-[1fr_1fr_auto] gap-2 items-center">
                  <input value={it.label} onChange={(e) => setField(i, { label: e.target.value })} placeholder="Menu label" className="rounded-lg border border-border bg-background px-3 py-2 text-sm" />
                  <input value={it.href} onChange={(e) => setField(i, { href: e.target.value })} placeholder="/route, #anchor, or https://…" className="rounded-lg border border-border bg-background px-3 py-2 text-sm font-mono" />
                  <div className="flex items-center gap-0.5">
                    <button onClick={() => update(move(items, i, -1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted" title="Move up"><ArrowUp className="w-4 h-4" /></button>
                    <button onClick={() => update(move(items, i, 1))} className="p-1.5 rounded-md text-muted-foreground hover:bg-muted" title="Move down"><ArrowDown className="w-4 h-4" /></button>
                    <button onClick={() => update(items.filter((_, j) => j !== i))} className="p-1.5 rounded-md text-muted-foreground hover:text-destructive hover:bg-muted" title="Remove"><Trash2 className="w-4 h-4" /></button>
                  </div>
                </div>
                <div className="flex flex-wrap gap-4 mt-2 pl-1 text-xs text-muted-foreground">
                  <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={!!it.primary} onChange={(e) => setField(i, { primary: e.target.checked })} /> Show in desktop bar</label>
                  <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={!!it.barOnly} onChange={(e) => setField(i, { barOnly: e.target.checked })} /> Desktop only</label>
                  <label className="inline-flex items-center gap-1.5"><input type="checkbox" checked={!!it.dialog} onChange={(e) => setField(i, { dialog: e.target.checked })} /> Opens contact popup</label>
                </div>
              </li>
            ))}
          </ul>

          <button onClick={() => update([...items, { label: "New link", href: "/" }])} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add link</button>

          <div className="sticky bottom-0 mt-6 -mx-4 md:mx-0 border-t border-border bg-background/95 backdrop-blur px-4 md:px-0 py-3 flex items-center gap-2">
            <button onClick={save} disabled={saving} className="inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />} Save navigation
            </button>
            <button onClick={() => update([...NAV_DEFAULT])} className="inline-flex items-center gap-2 rounded-xl border border-border bg-background px-4 py-2.5 text-sm font-medium text-foreground hover:bg-muted"><RotateCcw className="w-4 h-4" /> Reset to default</button>
            {dirty && <span className="text-xs text-amber-600">Unsaved changes</span>}
          </div>
        </>
      )}
    </div>
  );
};

export default NavEditor;
