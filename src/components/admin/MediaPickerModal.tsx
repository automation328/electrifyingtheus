// Multi-select picker over the Media library. Used to build a collection (e.g.
// the Gallery) from files already in the shared media store — so Media is the
// single source of assets and Gallery is just a curated selection of them.

import { useEffect, useState } from "react";
import { Loader2, X, Check, Film, FolderOpen } from "lucide-react";
import { listMedia, type MediaItem } from "@/lib/admin-api";

interface Props {
  kind?: "image" | "video" | "all";
  onClose: () => void;
  onAdd: (items: MediaItem[]) => void;
}

const MediaPickerModal = ({ kind = "all", onClose, onAdd }: Props) => {
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [sel, setSel] = useState<Set<string>>(new Set());

  useEffect(() => {
    listMedia().then(setItems).catch(() => setItems([])).finally(() => setLoading(false));
  }, []);

  const shown = (items ?? []).filter((m) => kind === "all" || m.kind === kind);
  const toggle = (name: string) => setSel((s) => { const n = new Set(s); n.has(name) ? n.delete(name) : n.add(name); return n; });
  const chosen = shown.filter((m) => sel.has(m.name));

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-2xl max-h-[85vh] flex flex-col rounded-2xl border border-border bg-background shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center gap-2 px-5 h-14 border-b border-border shrink-0">
          <FolderOpen className="w-4 h-4 text-primary" />
          <h3 className="font-bold font-display text-foreground">Add from media library</h3>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-4">
          {loading ? (
            <div className="py-16 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
          ) : shown.length === 0 ? (
            <p className="py-12 text-center text-sm text-muted-foreground">Nothing in the library yet — upload files under <strong className="text-foreground">Media</strong> first.</p>
          ) : (
            <div className="grid grid-cols-3 sm:grid-cols-4 gap-3">
              {shown.map((m) => {
                const on = sel.has(m.name);
                return (
                  <button key={m.name} type="button" onClick={() => toggle(m.name)} className={`relative aspect-square rounded-xl overflow-hidden border-2 ${on ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/50"}`} title={m.name}>
                    {m.kind === "video" ? <video src={m.url} className="w-full h-full object-cover" muted /> : <img src={m.url} alt={m.name} className="w-full h-full object-cover" loading="lazy" />}
                    {m.kind === "video" && <span className="absolute bottom-1 left-1 rounded bg-black/60 p-0.5"><Film className="w-3 h-3 text-white" /></span>}
                    {on && <span className="absolute top-1 right-1 w-5 h-5 rounded-full gradient-hero grid place-items-center"><Check className="w-3 h-3 text-white" /></span>}
                  </button>
                );
              })}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 px-5 py-3 border-t border-border shrink-0">
          <span className="text-sm text-muted-foreground">{chosen.length} selected</span>
          <button onClick={() => { onAdd(chosen); onClose(); }} disabled={chosen.length === 0} className="ml-auto rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
            Add {chosen.length || ""} to gallery
          </button>
        </div>
      </div>
    </div>
  );
};

export default MediaPickerModal;
