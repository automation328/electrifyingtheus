// Inline-editable image. Renders the <img> as given; in edit mode it overlays a
// "Change photo" button that opens an upload/URL panel and writes the new URL
// into the working override. The nearest positioned ancestor (hero header,
// gallery figure) anchors the button.

import { useState } from "react";
import { ImagePlus } from "lucide-react";
import { useInlineEdit } from "@/components/inline/edit-context";
import ImageUpload from "@/components/admin/ImageUpload";

interface Props {
  path: string;
  src: string;
  alt: string;
  className?: string;
  onError?: React.ReactEventHandler<HTMLImageElement>;
  loading?: "lazy" | "eager";
}

const EditableImage = ({ path, src, alt, className, onError, loading }: Props) => {
  const ctx = useInlineEdit();
  const [open, setOpen] = useState(false);

  const img = <img src={src} alt={alt} className={className} onError={onError} loading={loading} />;

  if (!ctx?.editing) return img;

  return (
    <>
      {img}
      <button
        type="button"
        onClick={(e) => { e.preventDefault(); e.stopPropagation(); setOpen(true); }}
        className="absolute top-2 right-2 z-30 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white backdrop-blur hover:bg-black/85"
      >
        <ImagePlus className="w-3.5 h-3.5" /> Change photo
      </button>

      {open && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setOpen(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border surface p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <h3 className="font-bold font-display text-foreground mb-3">Change photo</h3>
            <ImageUpload value={src} onChange={(url) => ctx.set(path, url)} />
            <div className="mt-4 flex justify-end">
              <button onClick={() => setOpen(false)} className="rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm hover:opacity-90">Done</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default EditableImage;
