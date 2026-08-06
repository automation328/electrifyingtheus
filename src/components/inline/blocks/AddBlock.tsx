// The "Add block" palette — a popover of block types plus saved templates.
// Used both at page-level insertion slots (BlockSlot) and inside container
// columns (BlockView), so it lives on its own to avoid a circular import.

import { useEffect, useState } from "react";
import {
  Plus, Heading, Type, Image as ImageIcon, Film, MousePointerClick,
  Minus, MoveVertical, Star, Rows3, LayoutPanelTop, Columns3, Images, Megaphone,
  Shapes, Hash, Timer, Map, Code, GalleryVerticalEnd,
  Quote, AlertCircle, Share2, Gauge, Bookmark, Trash2, LayoutGrid, ClipboardPaste, LayoutTemplate, Table,
} from "lucide-react";
import type { BlockType } from "@/lib/page-content";
import { useInlineEdit } from "@/components/inline/edit-context";
import { useBlockTemplates } from "@/lib/block-templates";
import { readClipboardBlock } from "@/lib/block-clipboard";
import { SECTION_PRESETS } from "@/components/inline/blocks/section-presets";

const TYPES: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "container", label: "Container", icon: LayoutGrid },
  { type: "heading", label: "Heading", icon: Heading },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "video", label: "Video", icon: Film },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: MoveVertical },
  { type: "icon", label: "Icon", icon: Star },
  { type: "accordion", label: "Accordion", icon: Rows3 },
  { type: "tabs", label: "Tabs", icon: LayoutPanelTop },
  { type: "columns", label: "Columns", icon: Columns3 },
  { type: "gallery", label: "Gallery", icon: Images },
  { type: "cta", label: "CTA", icon: Megaphone },
  { type: "image-box", label: "Image Box", icon: GalleryVerticalEnd },
  { type: "icon-box", label: "Icon Box", icon: Shapes },
  { type: "counter", label: "Counter", icon: Hash },
  { type: "countdown", label: "Countdown", icon: Timer },
  { type: "maps", label: "Maps", icon: Map },
  { type: "html", label: "HTML", icon: Code },
  { type: "testimonial", label: "Testimonial", icon: Quote },
  { type: "alert", label: "Alert", icon: AlertCircle },
  { type: "rating", label: "Rating", icon: Star },
  { type: "social", label: "Social", icon: Share2 },
  { type: "progress", label: "Progress", icon: Gauge },
  { type: "table", label: "Table", icon: Table },
];

const AddBlock = ({ slot, label = "Add block" }: { slot: string; label?: string }) => {
  const ctx = useInlineEdit();
  const templates = useBlockTemplates();
  const [open, setOpen] = useState(false);
  const [clip, setClip] = useState(() => readClipboardBlock());
  useEffect(() => {
    const refresh = () => setClip(readClipboardBlock());
    window.addEventListener("cms-clipboard", refresh);
    return () => window.removeEventListener("cms-clipboard", refresh);
  }, []);
  if (!ctx) return null;
  return (
    <div className="relative my-4 flex justify-center">
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors">
        <Plus className="w-3.5 h-3.5" /> {label}
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[80]" onClick={() => setOpen(false)} />
          <div className="absolute top-9 z-[81] grid grid-cols-4 gap-1 rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl ring-1 ring-black/5 max-h-[60vh] w-[19rem] overflow-y-auto">
            {clip && (
              <button onClick={() => { ctx.insertTemplate(slot, clip); setOpen(false); }} className="col-span-4 mb-1 flex items-center gap-2 rounded-xl px-2.5 py-2 text-xs font-semibold text-primary bg-primary/5 border border-dashed border-primary/40 hover:bg-primary/10">
                <ClipboardPaste className="w-4 h-4" /> Paste copied {clip.type} block
              </button>
            )}
            <div className="col-span-4 px-1 mb-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400">Blocks</div>
            {TYPES.map((t) => (
              <button key={t.type} onClick={() => { ctx.addBlock(slot, t.type); setOpen(false); }} className="flex flex-col items-center gap-1 rounded-xl px-1.5 py-2.5 text-[11px] font-medium text-neutral-700 hover:bg-neutral-100 hover:text-neutral-900 transition-colors">
                <t.icon className="w-4 h-4 text-primary" />
                {t.label}
              </button>
            ))}
            <div className="col-span-4 mt-1 pt-2 border-t border-neutral-200">
              <div className="px-1 mb-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400 flex items-center gap-1"><LayoutTemplate className="w-3 h-3" /> Sections</div>
              <div className="grid grid-cols-2 gap-1">
                {SECTION_PRESETS.map((p) => (
                  <button key={p.id} onClick={() => { ctx.insertTemplate(slot, p.build()); setOpen(false); }} className="text-left rounded-lg px-2.5 py-2 text-xs font-medium text-neutral-700 bg-neutral-50 border border-neutral-200 hover:bg-primary/5 hover:border-primary/40 hover:text-primary transition-colors truncate">{p.name}</button>
                ))}
              </div>
            </div>
            {templates.length > 0 && (
              <div className="col-span-4 mt-1 pt-2 border-t border-neutral-200">
                <div className="px-1 mb-1 text-[10px] font-bold uppercase tracking-wide text-neutral-400 flex items-center gap-1"><Bookmark className="w-3 h-3" /> Saved templates</div>
                <div className="space-y-0.5">
                  {templates.map((tpl) => (
                    <div key={tpl.id} className="flex items-center gap-1">
                      <button onClick={() => { ctx.insertTemplate(slot, tpl.block); setOpen(false); }} className="flex-1 text-left rounded-lg px-2 py-1.5 text-xs font-medium text-neutral-700 hover:bg-neutral-100 truncate">{tpl.name}</button>
                      <button onClick={() => ctx.deleteTemplate(tpl.id)} className="p-1 rounded text-neutral-400 hover:text-red-500" title="Delete template"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  );
};

export default AddBlock;
