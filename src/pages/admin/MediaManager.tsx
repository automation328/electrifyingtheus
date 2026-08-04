// CMS media library — view, upload, and delete everything in the site-media
// bucket (images + short video files). URLs here are what the pickers throughout
// the CMS pull from.

import { useRef, useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { Upload, Trash2, Link2, Loader2, Film, Image as ImageIcon } from "lucide-react";
import { listMedia, uploadImage, deleteMedia, type MediaItem } from "@/lib/admin-api";

const MediaManager = () => {
  const qc = useQueryClient();
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  const { data: items = [], isLoading, error } = useQuery({
    queryKey: ["admin-media"],
    queryFn: listMedia,
  });

  const refresh = () => qc.invalidateQueries({ queryKey: ["admin-media"] });

  const onFiles = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setBusy(true);
    try {
      for (const f of Array.from(files)) await uploadImage(f);
      toast.success(files.length === 1 ? "Uploaded" : `${files.length} files uploaded`);
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Upload failed.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  const remove = async (m: MediaItem) => {
    if (!window.confirm(`Delete "${m.name}"? Anything using it will lose the image.`)) return;
    try {
      await deleteMedia(m.name);
      toast.success("Deleted");
      refresh();
    } catch (e) {
      toast.error(e instanceof Error ? e.message : "Delete failed.");
    }
  };

  const copy = async (url: string) => {
    try { await navigator.clipboard.writeText(url); toast.success("URL copied"); }
    catch { toast.error("Couldn't copy"); }
  };

  return (
    <div className="max-w-5xl">
      <div className="flex items-center gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold font-display text-foreground">Media</h1>
          <p className="text-sm text-muted-foreground">{isLoading ? "Loading…" : `${items.length} file${items.length === 1 ? "" : "s"} in your library`}</p>
        </div>
        <button onClick={() => fileRef.current?.click()} disabled={busy} className="ml-auto inline-flex items-center gap-2 rounded-xl gradient-hero text-white font-semibold px-4 py-2.5 text-sm hover:opacity-90 disabled:opacity-60">
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />} Upload
        </button>
        <input ref={fileRef} type="file" accept="image/*,video/*" multiple className="hidden" onChange={(e) => onFiles(e.target.files)} />
      </div>

      {error && <div className="rounded-xl border border-destructive/30 bg-destructive/5 text-destructive px-4 py-3 text-sm mb-4">{error instanceof Error ? error.message : "Failed to load."}</div>}

      {isLoading ? (
        <div className="py-20 text-center text-muted-foreground"><Loader2 className="w-6 h-6 animate-spin mx-auto" /></div>
      ) : items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-border bg-card p-12 text-center text-muted-foreground">
          <ImageIcon className="w-8 h-8 mx-auto mb-3" />
          No media yet. Upload images or short videos and they'll be available everywhere in the editor.
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {items.map((m) => (
            <div key={m.name} className="group relative rounded-2xl border border-border bg-card overflow-hidden shadow-card">
              <div className="aspect-square bg-muted">
                {m.kind === "video"
                  ? <video src={m.url} className="w-full h-full object-cover" muted />
                  : <img src={m.url} alt={m.name} className="w-full h-full object-cover" loading="lazy" />}
              </div>
              <div className="absolute top-2 right-2 flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                <button onClick={() => copy(m.url)} className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-black/85" title="Copy URL"><Link2 className="w-3.5 h-3.5" /></button>
                <button onClick={() => remove(m)} className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-500/80" title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <div className="px-2.5 py-2 flex items-center gap-1.5">
                {m.kind === "video" ? <Film className="w-3.5 h-3.5 text-muted-foreground shrink-0" /> : <ImageIcon className="w-3.5 h-3.5 text-muted-foreground shrink-0" />}
                <span className="text-xs text-muted-foreground truncate" title={m.name}>{m.name}</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default MediaManager;
