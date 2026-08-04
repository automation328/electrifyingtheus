// Media field for the CMS: upload a file, pick one from the media library, or
// paste a URL. Works for images and (with kind="video") short video files stored
// in the site-media bucket. Uploads post to /api/admin (op:upload); the library
// lists the bucket via op:media-list.

import { useEffect, useRef, useState } from "react";
import { Upload, Link2, X, Loader2, Image as ImageIcon, FolderOpen, Film } from "lucide-react";
import { uploadImage, listMedia, type MediaItem } from "@/lib/admin-api";

interface Props {
  value: string;
  onChange: (url: string) => void;
  /** Filters the library + upload picker. Defaults to images. */
  kind?: "image" | "video";
}

const ImageUpload = ({ value, onChange, kind = "image" }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [libOpen, setLibOpen] = useState(false);
  const [items, setItems] = useState<MediaItem[] | null>(null);
  const [libLoading, setLibLoading] = useState(false);

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(""); setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. You can paste a URL instead.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  useEffect(() => {
    if (!libOpen || items) return;
    setLibLoading(true);
    listMedia().then(setItems).catch(() => setItems([])).finally(() => setLibLoading(false));
  }, [libOpen, items]);

  const libItems = (items ?? []).filter((i) => i.kind === kind);

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          {kind === "video"
            ? <video src={value} className="h-28 w-auto max-w-full rounded-xl border border-border" muted />
            : <img src={value} alt="preview" className="h-28 w-auto max-w-full rounded-xl border border-border object-cover" onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }} />}
          <button type="button" onClick={() => onChange("")} className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border border-border grid place-items-center text-muted-foreground hover:text-destructive shadow" title="Remove">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="h-28 rounded-xl border border-dashed border-border bg-muted/40 grid place-items-center text-muted-foreground">
          {kind === "video" ? <Film className="w-6 h-6" /> : <ImageIcon className="w-6 h-6" />}
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button type="button" onClick={() => fileRef.current?.click()} disabled={busy} className="inline-flex items-center gap-1.5 rounded-lg gradient-hero text-white px-3.5 py-2 text-sm font-semibold hover:opacity-90 transition-opacity disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
        </button>
        <button type="button" onClick={() => setLibOpen((o) => !o)} className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-2 text-sm font-semibold transition-opacity ${libOpen ? "gradient-hero text-white hover:opacity-90" : "border border-primary/50 text-primary hover:bg-primary/10"}`}>
          <FolderOpen className="w-4 h-4" /> Library
        </button>
        <input ref={fileRef} type="file" accept={kind === "video" ? "video/*" : "image/*"} className="hidden" onChange={(e) => onPick(e.target.files?.[0])} />
        <div className="flex items-center gap-1.5 flex-1 min-w-[12rem]">
          <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <input type="text" value={value} onChange={(e) => onChange(e.target.value)} placeholder="…or paste a URL" className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40" />
        </div>
      </div>

      {libOpen && (
        <div className="rounded-xl border border-border bg-card p-3 max-h-96 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Media library</span>
            {items && <span className="text-xs text-muted-foreground">{libItems.length} {kind}{libItems.length === 1 ? "" : "s"}</span>}
          </div>
          {libLoading ? (
            <div className="py-10 text-center text-muted-foreground"><Loader2 className="w-5 h-5 animate-spin mx-auto" /></div>
          ) : libItems.length === 0 ? (
            <p className="py-8 text-center text-sm text-muted-foreground">No {kind}s in the library yet — upload one and it'll appear here.</p>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {libItems.map((m) => (
                <button key={m.name} type="button" onClick={() => { onChange(m.url); setLibOpen(false); }} className={`relative aspect-square w-full rounded-xl overflow-hidden border-2 ${value === m.url ? "border-primary ring-2 ring-primary/40" : "border-border hover:border-primary/60"}`} title={m.name}>
                  {m.kind === "video"
                    ? <video src={m.url} className="w-full h-full object-cover" muted />
                    : <img src={m.url} alt={m.name} className="w-full h-full object-cover" loading="lazy" />}
                </button>
              ))}
            </div>
          )}
        </div>
      )}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default ImageUpload;
