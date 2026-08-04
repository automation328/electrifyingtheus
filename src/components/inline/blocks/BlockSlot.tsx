// An insertion point between page sections. Renders any blocks assigned to this
// slot, and (in edit mode) an "Add block" palette to insert a new one here.

import { useState } from "react";
import {
  Plus, Heading, Type, Image as ImageIcon, Film, MousePointerClick,
  Minus, MoveVertical, Star,
} from "lucide-react";
import type { PageBlock, BlockType } from "@/lib/page-content";
import { useInlineEdit } from "@/components/inline/edit-context";
import BlockView from "@/components/inline/blocks/BlockView";

const TYPES: { type: BlockType; label: string; icon: typeof Type }[] = [
  { type: "heading", label: "Heading", icon: Heading },
  { type: "text", label: "Text", icon: Type },
  { type: "image", label: "Image", icon: ImageIcon },
  { type: "video", label: "Video", icon: Film },
  { type: "button", label: "Button", icon: MousePointerClick },
  { type: "divider", label: "Divider", icon: Minus },
  { type: "spacer", label: "Spacer", icon: MoveVertical },
  { type: "icon", label: "Icon", icon: Star },
];

const AddBlock = ({ slot }: { slot: string }) => {
  const ctx = useInlineEdit();
  const [open, setOpen] = useState(false);
  if (!ctx) return null;
  return (
    <div className="relative my-4 flex justify-center">
      <button
        onClick={() => setOpen((o) => !o)}
        className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
      >
        <Plus className="w-3.5 h-3.5" /> Add block
      </button>
      {open && (
        <>
          <div className="fixed inset-0 z-[70]" onClick={() => setOpen(false)} />
          <div className="absolute top-9 z-[71] grid grid-cols-4 gap-1.5 rounded-2xl border border-border bg-background p-2 shadow-elevated">
            {TYPES.map((t) => (
              <button
                key={t.type}
                onClick={() => { ctx.addBlock(slot, t.type); setOpen(false); }}
                className="flex w-16 flex-col items-center gap-1 rounded-xl px-2 py-2.5 text-[11px] font-medium text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
              >
                <t.icon className="w-4 h-4" />
                {t.label}
              </button>
            ))}
          </div>
        </>
      )}
    </div>
  );
};

const BlockSlot = ({ slot, blocks }: { slot: string; blocks?: PageBlock[] }) => {
  const ctx = useInlineEdit();
  const mine = (blocks ?? []).filter((b) => b.slot === slot);
  if (!ctx?.editing && mine.length === 0) return null;

  return (
    <div className="my-6 space-y-2">
      {mine.map((b) => <BlockView key={b.id} block={b} />)}
      {ctx?.editing && <AddBlock slot={slot} />}
    </div>
  );
};

export default BlockSlot;
