// A collapsible "block tree" for the page editor — lists every block (nesting
// container children) so editors can see the structure of a long page and jump
// straight to a block. Rows scroll to the block's [data-block-id] anchor and
// briefly flash it. Edit-mode only.

import { useState } from "react";
import { ListTree, ChevronRight, ChevronDown, Layers } from "lucide-react";
import type { PageBlock } from "@/lib/page-content";

const slotName = (slot: string): string => {
  if (slot === "after-stats") return "Top of page";
  if (slot === "end") return "End of page";
  const m = /^after-section-(\d+)$/.exec(slot);
  if (m) return `After section ${Number(m[1]) + 1}`;
  return slot || "Page";
};

const rowLabel = (b: PageBlock): string => {
  const t = (b.text || b.subtext || b.caption || "").replace(/<[^>]*>/g, "").trim(); // strip any rich-text HTML
  if (t) return t.length > 30 ? `${t.slice(0, 30)}…` : t;
  if (b.type === "container") return `Container · ${b.cols ?? 2} col`;
  return b.type;
};

const flash = (el: Element) => {
  const node = el as HTMLElement;
  const prev = node.style.boxShadow;
  node.style.boxShadow = "0 0 0 3px hsl(var(--primary))";
  node.style.transition = "box-shadow .2s";
  window.setTimeout(() => { node.style.boxShadow = prev; }, 900);
};

const jump = (id: string) => {
  const el = document.querySelector(`[data-block-id="${id}"]`);
  if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); flash(el); }
};

const Node = ({ block, depth }: { block: PageBlock; depth: number }) => {
  const [open, setOpen] = useState(true);
  const kids = block.children ?? [];
  const hasKids = block.type === "container" && kids.length > 0;
  return (
    <div>
      <div className="flex items-center gap-1 rounded-md hover:bg-neutral-100" style={{ paddingLeft: depth * 12 }}>
        {hasKids ? (
          <button onClick={() => setOpen((o) => !o)} className="p-0.5 text-neutral-400 hover:text-neutral-700">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : <span className="w-4" />}
        <button onClick={() => jump(block.id)} className="flex-1 flex items-center gap-1.5 py-1 pr-2 text-left text-xs text-neutral-700 hover:text-primary truncate">
          {block.type === "container" && <Layers className="w-3 h-3 shrink-0 text-neutral-400" />}
          <span className="truncate">{rowLabel(block)}</span>
        </button>
      </div>
      {hasKids && open && kids.map((c) => <Node key={c.id} block={c} depth={depth + 1} />)}
    </div>
  );
};

const OutlinePanel = ({ blocks }: { blocks: PageBlock[] }) => {
  const [open, setOpen] = useState(false);
  if (!blocks.length) return null;

  // Group top-level blocks by their insertion slot, preserving encounter order.
  const groups: { slot: string; items: PageBlock[] }[] = [];
  for (const b of blocks) {
    const g = groups.find((x) => x.slot === (b.slot || ""));
    if (g) g.items.push(b); else groups.push({ slot: b.slot || "", items: [b] });
  }

  return (
    <div className="fixed bottom-4 left-4 z-[70]">
      {open && (
        <div className="mb-2 w-64 max-h-[60vh] overflow-y-auto rounded-2xl border border-neutral-200 bg-white p-2 shadow-2xl ring-1 ring-black/5">
          <div className="px-1.5 pb-1.5 mb-1 border-b border-neutral-100 text-[11px] font-bold uppercase tracking-wide text-neutral-400">Page outline</div>
          {groups.map((g) => (
            <div key={g.slot} className="mb-1.5">
              <div className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{slotName(g.slot)}</div>
              {g.items.map((b) => <Node key={b.id} block={b} depth={0} />)}
            </div>
          ))}
        </div>
      )}
      <button onClick={() => setOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-full bg-foreground/90 backdrop-blur px-3.5 py-2 text-xs font-semibold text-white shadow-lg hover:bg-foreground">
        <ListTree className="w-4 h-4" /> Outline
      </button>
    </div>
  );
};

export default OutlinePanel;
