// Edit a page's SEO/social-share fields (title, description, share image) while
// in the on-page editor. Writes onto the working override's `seo` object.

import { useState } from "react";
import { X, Search } from "lucide-react";
import type { PageSeo } from "@/lib/page-content";
import ImageUpload from "@/components/admin/ImageUpload";

const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";

const SeoModal = ({ seo, fallbackTitle, fallbackDescription, onChange, onClose }: {
  seo: PageSeo;
  fallbackTitle?: string;
  fallbackDescription?: string;
  onChange: (patch: PageSeo) => void;
  onClose: () => void;
}) => {
  const [imgOpen, setImgOpen] = useState(false);
  const set = (p: Partial<PageSeo>) => onChange({ ...seo, ...p });
  const titlePreview = seo.title || fallbackTitle || "Electrifying the US";
  const descPreview = seo.description || fallbackDescription || "";

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
      <div className="w-full max-w-lg rounded-2xl border border-border surface p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center mb-4">
          <h3 className="font-bold font-display text-foreground flex items-center gap-2"><Search className="w-4 h-4 text-primary" /> Page SEO &amp; sharing</h3>
          <button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
        </div>

        <div className="space-y-4">
          <div>
            <label className={lbl}>Title <span className="normal-case font-normal text-muted-foreground/70">· browser tab &amp; social card</span></label>
            <input value={seo.title ?? ""} onChange={(e) => set({ title: e.target.value })} placeholder={fallbackTitle || "Page title"} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm" />
          </div>
          <div>
            <label className={lbl}>Description <span className="normal-case font-normal text-muted-foreground/70">· ~155 characters</span></label>
            <textarea value={seo.description ?? ""} onChange={(e) => set({ description: e.target.value })} placeholder={fallbackDescription || "A short summary shown in search results and link previews."} rows={3} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm resize-y" />
            <div className="mt-1 text-[11px] text-muted-foreground">{(seo.description ?? "").length}/160</div>
          </div>
          <div>
            <label className={lbl}>Share image <span className="normal-case font-normal text-muted-foreground/70">· 1200×630 recommended</span></label>
            {seo.image ? (
              <div className="flex items-center gap-3">
                <img src={seo.image} alt="" className="w-28 h-16 object-cover rounded-lg border border-border" />
                <div className="flex flex-col gap-1">
                  <button onClick={() => setImgOpen(true)} className="text-xs font-medium text-primary hover:underline text-left">Replace</button>
                  <button onClick={() => set({ image: "" })} className="text-xs text-muted-foreground hover:text-destructive text-left">Remove</button>
                </div>
              </div>
            ) : (
              <button onClick={() => setImgOpen(true)} className="rounded-xl border border-dashed border-border px-4 py-2.5 text-sm text-muted-foreground hover:bg-muted">Choose image…</button>
            )}
            {imgOpen && <div className="mt-2"><ImageUpload value={seo.image ?? ""} onChange={(url) => { set({ image: url }); setImgOpen(false); }} /></div>}
          </div>

          {/* Google-style preview */}
          <div className="rounded-xl border border-border p-3">
            <div className="text-[10px] font-bold uppercase tracking-wide text-muted-foreground mb-1.5">Search preview</div>
            <div className="text-[#1a0dab] text-base leading-tight truncate">{titlePreview}</div>
            <div className="text-[#006621] text-xs">electrifyingtheus.com</div>
            <div className="text-[13px] text-muted-foreground line-clamp-2">{descPreview || "No description set — the page intro will be used."}</div>
          </div>

          <div className="flex justify-end">
            <button onClick={onClose} className="rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm">Done</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SeoModal;
