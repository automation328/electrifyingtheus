// Image field for the CMS: upload a file to Supabase Storage OR paste a URL.
// The upload path posts to /api/admin/upload (editor-gated, Phase 2). Until that
// endpoint/bucket exists, uploading surfaces a friendly error and pasting a URL
// still works — so every image field is usable throughout the build-out.

import { useRef, useState } from "react";
import { Upload, Link2, X, Loader2, Image as ImageIcon } from "lucide-react";
import { uploadImage } from "@/lib/admin-api";

interface Props {
  value: string;
  onChange: (url: string) => void;
}

const ImageUpload = ({ value, onChange }: Props) => {
  const fileRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  const onPick = async (file: File | undefined) => {
    if (!file) return;
    setError(""); setBusy(true);
    try {
      const url = await uploadImage(file);
      onChange(url);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Upload failed. You can paste an image URL instead.");
    } finally {
      setBusy(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  };

  return (
    <div className="space-y-2">
      {value ? (
        <div className="relative inline-block">
          <img
            src={value}
            alt="preview"
            className="h-28 w-auto max-w-full rounded-xl border border-border object-cover"
            onError={(e) => { (e.currentTarget as HTMLImageElement).style.opacity = "0.3"; }}
          />
          <button
            type="button"
            onClick={() => onChange("")}
            className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-card border border-border grid place-items-center text-muted-foreground hover:text-destructive shadow"
            title="Remove image"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      ) : (
        <div className="h-28 rounded-xl border border-dashed border-border bg-muted/40 grid place-items-center text-muted-foreground">
          <ImageIcon className="w-6 h-6" />
        </div>
      )}

      <div className="flex flex-wrap items-center gap-2">
        <button
          type="button"
          onClick={() => fileRef.current?.click()}
          disabled={busy}
          className="inline-flex items-center gap-1.5 rounded-lg border border-border bg-background px-3 py-2 text-sm font-medium text-foreground hover:bg-muted transition-colors disabled:opacity-60"
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Upload className="w-4 h-4" />}
          Upload
        </button>
        <input
          ref={fileRef}
          type="file"
          accept="image/*"
          className="hidden"
          onChange={(e) => onPick(e.target.files?.[0])}
        />
        <div className="flex items-center gap-1.5 flex-1 min-w-[12rem]">
          <Link2 className="w-4 h-4 text-muted-foreground shrink-0" />
          <input
            type="text"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            placeholder="…or paste an image URL"
            className="w-full rounded-lg border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:ring-2 focus:ring-primary/40"
          />
        </div>
      </div>
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
};

export default ImageUpload;
