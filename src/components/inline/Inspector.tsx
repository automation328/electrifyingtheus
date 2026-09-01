// Left-docked editor Inspector (edit mode only). Two tabs:
//  • Settings — the SELECTED block's controls. BlockView portals a block's
//    controls into #cms-inspector-body via <InspectorPortal> when that block is
//    active, so options live on the left instead of floating over the page.
//  • Layers — the page's block tree (click a row to select + jump to a block).
//
// The settings body is always mounted (hidden on the Layers tab) so open portals
// never lose their target.

import { useEffect, useState } from "react";
import { createPortal } from "react-dom";
import {
  ListTree, SlidersHorizontal, ChevronRight, ChevronDown, Layers as LayersIcon,
  X, MousePointerClick, Eye, EyeOff, Copy, Trash2, Crown, Plus,
} from "lucide-react";
import type { PageBlock, PageHero } from "@/lib/page-content";
import { useInlineEdit, HERO_ID, type InlineEditContextValue } from "@/components/inline/edit-context";
import { BlockPalette } from "@/components/inline/blocks/AddBlock";

export const INSPECTOR_BODY_ID = "cms-inspector-body";

/** Render `children` into the Inspector's Settings area when `blockId` is the
 *  selected block; render nothing otherwise. */
export const InspectorPortal = ({ blockId, children }: { blockId: string; children: React.ReactNode }) => {
  const ctx = useInlineEdit();
  const [node, setNode] = useState<HTMLElement | null>(null);
  useEffect(() => { setNode(document.getElementById(INSPECTOR_BODY_ID)); }, []);
  if (!ctx?.editing || ctx.activeId !== blockId || !node) return null;
  return createPortal(children, node);
};

const TYPE_LABEL: Record<string, string> = {
  container: "Container", heading: "Heading", text: "Text", image: "Image", video: "Video",
  button: "Button", divider: "Divider", spacer: "Spacer", icon: "Icon", accordion: "Accordion",
  tabs: "Tabs", columns: "Columns", gallery: "Gallery", cta: "CTA", "image-box": "Image box",
  "icon-box": "Icon box", counter: "Counter", countdown: "Countdown", maps: "Map", html: "HTML",
  testimonial: "Testimonial", alert: "Alert", rating: "Rating", social: "Social", progress: "Progress",
  table: "Table", "icon-list": "Icon list", toc: "Contents",
};
const typeLabel = (t: string) => TYPE_LABEL[t] ?? t;

const rowLabel = (b: PageBlock): string => {
  const t = (b.text || b.subtext || b.caption || "").replace(/<[^>]*>/g, "").trim();
  if (t) return t.length > 26 ? `${t.slice(0, 26)}…` : t;
  if (b.type === "container") return `Container · ${b.cols ?? 2} col`;
  return typeLabel(b.type);
};

const slotName = (slot: string): string => {
  if (slot === "hero") return "Inside the hero";
  if (slot === "after-stats") return "Top of page";
  if (slot === "end") return "End of page";
  // An event page's slots read as slugs otherwise ("event-end"), which is how
  // an editor ends up dropping a block below the register band by accident.
  if (slot === "event-top") return "Top of the event";
  if (slot === "event-body") return "Under the description";
  if (slot === "event-end") return "Below Save your spot";
  const m = /^after-section-(\d+)$/.exec(slot);
  if (m) return `After section ${Number(m[1]) + 1}`;
  return slot || "Page";
};

function findBlock(blocks: PageBlock[], id: string): PageBlock | null {
  for (const b of blocks) {
    if (b.id === id) return b;
    if (b.children?.length) { const f = findBlock(b.children, id); if (f) return f; }
  }
  return null;
}

const flash = (el: Element) => {
  const node = el as HTMLElement;
  const prev = node.style.boxShadow;
  node.style.boxShadow = "0 0 0 3px hsl(var(--primary))";
  node.style.transition = "box-shadow .2s";
  window.setTimeout(() => { node.style.boxShadow = prev; }, 900);
};

const Node = ({ block, depth, activeId, onSelect, ctx }: { block: PageBlock; depth: number; activeId: string | null; onSelect: (id: string) => void; ctx: InlineEditContextValue }) => {
  const [open, setOpen] = useState(true);
  const kids = block.children ?? [];
  const hasKids = block.type === "container" && kids.length > 0;
  const isActive = activeId === block.id;
  const hidden = !!(block.hideMobile && block.hideDesktop);
  const abtn = "p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/70";
  return (
    <div>
      <div className={`group/row flex items-center gap-1 rounded-md ${isActive ? "bg-primary/10" : "hover:bg-neutral-100"}`} style={{ paddingLeft: depth * 12 }}>
        {hasKids ? (
          <button onClick={() => setOpen((o) => !o)} className="p-0.5 text-neutral-400 hover:text-neutral-700">
            {open ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
          </button>
        ) : <span className="w-4" />}
        <button onClick={() => onSelect(block.id)} className={`flex-1 flex items-center gap-1.5 py-1 pr-1 text-left text-xs truncate ${isActive ? "text-primary font-semibold" : hidden ? "text-neutral-400 line-through" : "text-neutral-700 hover:text-primary"}`}>
          {block.type === "container" && <LayersIcon className="w-3 h-3 shrink-0 text-neutral-400" />}
          <span className="truncate">{rowLabel(block)}</span>
        </button>
        <div className="flex items-center pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
          <button className={abtn} title={hidden ? "Show block" : "Hide block"} onClick={() => ctx.updateBlock(block.id, { hideMobile: !hidden, hideDesktop: !hidden })}>
            {hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
          </button>
          <button className={abtn} title="Duplicate" onClick={() => ctx.duplicateBlock(block.id)}><Copy className="w-3.5 h-3.5" /></button>
          <button className="p-1 rounded text-neutral-400 hover:text-red-600 hover:bg-red-50" title="Delete" onClick={() => { ctx.removeBlock(block.id); if (activeId === block.id) ctx.setActive(null); }}><Trash2 className="w-3.5 h-3.5" /></button>
        </div>
      </div>
      {hasKids && open && kids.map((c) => <Node key={c.id} block={c} depth={depth + 1} activeId={activeId} onSelect={onSelect} ctx={ctx} />)}
    </div>
  );
};

const Inspector = ({ blocks, slots = ["end"] }: { blocks: PageBlock[]; slots?: string[] }) => {
  const ctx = useInlineEdit();
  // "Add" is the resting state: with nothing selected the panel used to be an
  // empty prompt, so the editor's tools were never on screen unless you had
  // already clicked something.
  const [tab, setTab] = useState<"add" | "settings" | "layers">("add");
  const [addSlot, setAddSlot] = useState(() => slots[slots.length - 1] ?? "end");
  // Jump to Settings whenever a block gets selected.
  useEffect(() => { if (ctx?.activeId) setTab("settings"); }, [ctx?.activeId]);
  if (!ctx?.editing) return null;

  // The page hero isn't a block, but it selects and portals like one.
  const heroSelected = ctx.activeId === HERO_ID;
  const hero = (ctx.get("hero") as PageHero | undefined) ?? undefined;
  const active = ctx.activeId && !heroSelected ? findBlock(blocks, ctx.activeId) : null;

  // Top-level blocks grouped by insertion slot (for the Layers tree).
  const groups: { slot: string; items: PageBlock[] }[] = [];
  for (const b of blocks) {
    const g = groups.find((x) => x.slot === (b.slot || ""));
    if (g) g.items.push(b); else groups.push({ slot: b.slot || "", items: [b] });
  }

  const selectAndJump = (id: string) => {
    ctx.setActive(id);
    const el = document.querySelector(`[data-block-id="${id}"]`);
    if (el) { el.scrollIntoView({ behavior: "smooth", block: "center" }); flash(el); }
  };

  const tabBtn = (key: "add" | "settings" | "layers") =>
    `flex items-center gap-1.5 rounded-lg px-2 py-1.5 text-xs font-semibold transition-colors ${tab === key ? "bg-primary/10 text-primary" : "text-neutral-500 hover:bg-neutral-100 hover:text-neutral-800"}`;

  return (
    <aside className="fixed left-0 top-0 z-[75] hidden md:flex h-screen w-72 flex-col border-r border-neutral-200 bg-white shadow-xl">
      <div className="flex items-center gap-0.5 px-2 h-11 shrink-0 border-b border-neutral-200">
        <button onClick={() => setTab("add")} className={tabBtn("add")}><Plus className="w-3.5 h-3.5" /> Add</button>
        <button onClick={() => setTab("settings")} className={tabBtn("settings")}><SlidersHorizontal className="w-3.5 h-3.5" /> Settings</button>
        <button onClick={() => setTab("layers")} className={tabBtn("layers")}><ListTree className="w-3.5 h-3.5" /> Layers</button>
        {(active || heroSelected) && (
          <button onClick={() => ctx.setActive(null)} className="ml-auto p-1.5 rounded-md text-neutral-400 hover:bg-neutral-100 hover:text-neutral-700" title="Deselect block">
            <X className="w-4 h-4" />
          </button>
        )}
      </div>

      {/* Add — always available, so the tools are on screen with nothing selected. */}
      <div data-panel="add" className={`flex-1 min-h-0 flex-col ${tab === "add" ? "flex" : "hidden"}`}>
        <div className="px-3 pt-3 shrink-0">
          <label className="block text-[10px] font-bold uppercase tracking-wide text-neutral-400 mb-1">Add to</label>
          <select
            value={addSlot}
            onChange={(e) => setAddSlot(e.target.value)}
            className="w-full rounded-lg border border-neutral-200 bg-white px-2 py-1.5 text-xs text-neutral-700"
          >
            {slots.map((s) => <option key={s} value={s}>{slotName(s)}</option>)}
          </select>
        </div>
        <BlockPalette slot={addSlot} />
      </div>

      {/* Settings — body is always mounted (hidden on other tabs) so portals stay valid. */}
      <div data-panel="settings" className={`flex-1 overflow-y-auto ${tab === "settings" ? "" : "hidden"}`}>
        {active || heroSelected ? (
          <div className="flex items-center gap-2 px-3 h-11 border-b border-neutral-100 sticky top-0 bg-white z-10">
            <span className="text-[11px] font-bold uppercase tracking-wide text-neutral-400 truncate">{active ? `${typeLabel(active.type)} settings` : "Hero settings"}</span>
          </div>
        ) : (
          <div className="flex flex-col items-center gap-3 px-6 py-10 text-center text-xs text-neutral-400">
            <MousePointerClick className="w-6 h-6" />
            Click anything on the page to edit its settings here.
            <button onClick={() => setTab("add")} className="inline-flex items-center gap-1.5 rounded-lg bg-primary/10 px-2.5 py-1.5 text-xs font-semibold text-primary hover:bg-primary/20">
              <Plus className="w-3.5 h-3.5" /> Add a block instead
            </button>
          </div>
        )}
        <div id={INSPECTOR_BODY_ID} className="p-3 space-y-4 text-left" />
      </div>

      {/* Layers */}
      <div data-panel="layers" className={`flex-1 overflow-y-auto p-2 ${tab === "layers" ? "" : "hidden"}`}>
        {/* The page's own hero, listed first — it sits above every block. */}
        <div className="mb-2">
          <div className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">Page header</div>
          <div className={`group/row flex items-center gap-1 rounded-md ${heroSelected ? "bg-primary/10" : "hover:bg-neutral-100"}`}>
            <span className="w-4" />
            <button
              onClick={() => { ctx.setActive(HERO_ID); window.scrollTo({ top: 0, behavior: "smooth" }); }}
              className={`flex-1 flex items-center gap-1.5 py-1 pr-1 text-left text-xs truncate ${heroSelected ? "text-primary font-semibold" : hero?.hidden ? "text-neutral-400 line-through" : "text-neutral-700 hover:text-primary"}`}
            >
              <Crown className="w-3 h-3 shrink-0 text-neutral-400" />
              <span className="truncate">Hero</span>
            </button>
            <div className="flex items-center pr-1 opacity-0 group-hover/row:opacity-100 transition-opacity">
              <button
                className="p-1 rounded text-neutral-400 hover:text-neutral-700 hover:bg-neutral-200/70"
                title={hero?.hidden ? "Bring the hero back" : "Delete the hero section"}
                onClick={() => ctx.set("hero", { ...(hero ?? {}), hidden: !hero?.hidden })}
              >
                {hero?.hidden ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
        {blocks.length === 0 ? (
          <div className="px-3 py-10 text-center text-xs text-neutral-400">No blocks yet. Use “Add block” to start building.</div>
        ) : (
          groups.map((g) => (
            <div key={g.slot} className="mb-2">
              <div className="px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-neutral-400">{slotName(g.slot)}</div>
              {g.items.map((b) => <Node key={b.id} block={b} depth={0} activeId={ctx.activeId} onSelect={selectAndJump} ctx={ctx} />)}
            </div>
          ))
        )}
      </div>
    </aside>
  );
};

export default Inspector;
