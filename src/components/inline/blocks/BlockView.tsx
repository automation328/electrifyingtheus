// Renders (and, in edit mode, edits) a single builder block. Styling largely
// inherits the site theme; Heading/Text/Button expose size + font controls, and
// each block type has the controls it needs (divider thickness, icon picker, …).

import { useState } from "react";
import {
  ArrowUp, ArrowDown, Trash2, AlignLeft, AlignCenter, AlignRight,
  Image as ImageIcon, Film, X, Search, Plus, ChevronDown, ArrowRight,
} from "lucide-react";
import { Link } from "react-router-dom";
import type { PageBlock } from "@/lib/page-content";
import { useInlineEdit, type InlineEditContextValue } from "@/components/inline/edit-context";
import ImageUpload from "@/components/admin/ImageUpload";
import { BLOCK_ICONS, BLOCK_ICON_KEYS } from "@/components/inline/blocks/icons";

const alignClass = (a?: string) => (a === "left" ? "text-left" : a === "right" ? "text-right" : "text-center");

const fontClass = (block: PageBlock) => {
  const f = block.font ?? (block.type === "heading" ? "display" : "sans");
  return f === "display" ? "font-brief" : f === "mono" ? "brief-mono" : "";
};

const sizeClass = (block: PageBlock) => {
  const s = block.size ?? "md";
  if (block.type === "heading") return { sm: "text-xl md:text-2xl", md: "text-2xl md:text-3xl", lg: "text-3xl md:text-4xl", xl: "text-4xl md:text-5xl" }[s];
  if (block.type === "text") return { sm: "text-sm", md: "text-[15px] md:text-base", lg: "text-lg", xl: "text-xl" }[s];
  if (block.type === "button") return { sm: "px-4 py-2 text-sm", md: "px-6 py-3 text-base", lg: "px-7 py-3.5 text-lg", xl: "px-9 py-4 text-xl" }[s];
  return "";
};

/* Inline contentEditable text that commits on blur. */
const InlineText = ({ value, onCommit, className, block }: { value: string; onCommit: (v: string) => void; className?: string; block?: boolean }) => {
  const ctx = useInlineEdit();
  const Tag = block ? "div" : "span";
  if (!ctx?.editing) return <Tag className={className}>{value}</Tag>;
  return (
    <Tag contentEditable suppressContentEditableWarning spellCheck={false}
      className={`${className ?? ""} outline-none focus:bg-primary/5 rounded px-0.5`}
      onKeyDown={(e) => { if (e.key === "Enter" && !block) { e.preventDefault(); (e.currentTarget as HTMLElement).blur(); } }}
      onBlur={(e) => { const t = (e.currentTarget.textContent ?? "").trim(); if (t !== value) onCommit(t); }}
    >{value}</Tag>
  );
};

/* Size + font controls for Heading / Text / Button. */
const StyleControls = ({ block, up }: { block: PageBlock; up: (p: Partial<PageBlock>) => void }) => {
  const sizes: PageBlock["size"][] = ["sm", "md", "lg", "xl"];
  const active = block.size ?? "md";
  const font = block.font ?? (block.type === "heading" ? "display" : "sans");
  return (
    <div className="mt-2 inline-flex flex-wrap items-center gap-2 rounded-lg border border-border bg-background/80 px-2 py-1.5 text-xs">
      <span className="text-muted-foreground">Size</span>
      {sizes.map((s) => (
        <button key={s} onClick={() => up({ size: s })} className={`px-1.5 py-0.5 rounded ${active === s ? "gradient-hero text-white" : "text-muted-foreground hover:bg-muted"}`}>{s!.toUpperCase()}</button>
      ))}
      <span className="w-px h-4 bg-border mx-0.5" />
      <span className="text-muted-foreground">Font</span>
      <select value={font} onChange={(e) => up({ font: e.target.value as PageBlock["font"] })} className="rounded border border-border bg-background px-1.5 py-0.5">
        <option value="display">Display</option>
        <option value="sans">Sans</option>
        <option value="mono">Mono</option>
      </select>
    </div>
  );
};

const Modal = ({ title, onClose, children }: { title: string; onClose: () => void; children: React.ReactNode }) => (
  <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={onClose}>
    <div className="w-full max-w-md rounded-2xl border border-border bg-background p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
      <div className="flex items-center mb-3"><h3 className="font-bold font-display text-foreground">{title}</h3><button onClick={onClose} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button></div>
      {children}
    </div>
  </div>
);

const videoEmbed = (b: PageBlock) => {
  if (b.provider === "youtube") return <iframe className="absolute inset-0 w-full h-full" src={`https://www.youtube-nocookie.com/embed/${b.videoId}`} title={b.text || "Video"} allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" allowFullScreen />;
  if (b.provider === "vimeo") return <iframe className="absolute inset-0 w-full h-full" src={`https://player.vimeo.com/video/${b.videoId}`} title={b.text || "Video"} allow="autoplay; fullscreen; picture-in-picture" allowFullScreen />;
  return <video className="absolute inset-0 w-full h-full" src={b.videoId} controls />;
};

const IconPicker = ({ block, up }: { block: PageBlock; up: (p: Partial<PageBlock>) => void }) => {
  const [q, setQ] = useState("");
  const keys = q ? BLOCK_ICON_KEYS.filter((k) => k.includes(q.toLowerCase())) : BLOCK_ICON_KEYS;
  return (
    <div className="mt-2 max-w-sm mx-auto">
      <div className="flex items-center gap-1.5 rounded-lg border border-border bg-background px-2 py-1 mb-2">
        <Search className="w-3.5 h-3.5 text-muted-foreground" />
        <input value={q} onChange={(e) => setQ(e.target.value)} placeholder="Search icons…" className="w-full bg-transparent text-xs outline-none" />
      </div>
      <div className="grid grid-cols-8 gap-1 max-h-40 overflow-y-auto">
        {keys.map((k) => { const I = BLOCK_ICONS[k]; return (
          <button key={k} onClick={() => up({ icon: k })} title={k} className={`p-1.5 rounded-lg border ${block.icon === k ? "border-primary bg-primary/10" : "border-transparent hover:bg-muted"}`}><I className="w-4 h-4 text-foreground" /></button>
        ); })}
      </div>
    </div>
  );
};

/* View-mode (published) renderers for Tier 2 blocks that need local state. */
const AccordionView = ({ items }: { items: NonNullable<PageBlock["items"]> }) => {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="text-left divide-y divide-border rounded-2xl border border-border overflow-hidden">
      {items.map((it, i) => (
        <div key={i}>
          <button onClick={() => setOpen(open === i ? null : i)} className="w-full flex items-center gap-3 px-5 py-4 text-left hover:bg-muted/40 transition-colors">
            <span className="font-semibold text-foreground flex-1">{it.title}</span>
            <ChevronDown className={`w-4 h-4 text-muted-foreground transition-transform ${open === i ? "rotate-180" : ""}`} />
          </button>
          {open === i && <div className="px-5 pb-4 text-muted-foreground leading-relaxed whitespace-pre-line">{it.body}</div>}
        </div>
      ))}
    </div>
  );
};

const TabsView = ({ items }: { items: NonNullable<PageBlock["items"]> }) => {
  const [active, setActive] = useState(0);
  const cur = items[active] ?? items[0];
  return (
    <div className="text-left">
      <div className="flex flex-wrap gap-1 border-b border-border mb-4">
        {items.map((it, i) => (
          <button key={i} onClick={() => setActive(i)} className={`px-4 py-2 text-sm font-semibold -mb-px border-b-2 transition-colors ${active === i ? "border-primary text-primary" : "border-transparent text-muted-foreground hover:text-foreground"}`}>{it.title || `Tab ${i + 1}`}</button>
        ))}
      </div>
      <div className="text-muted-foreground leading-relaxed whitespace-pre-line">{cur?.body}</div>
    </div>
  );
};

const colsClass = (n: number) => ({ 1: "", 2: "md:grid-cols-2", 3: "md:grid-cols-3", 4: "md:grid-cols-4" }[Math.min(4, Math.max(1, n))] ?? "md:grid-cols-2");

const BlockBody = ({ block, ctx }: { block: PageBlock; ctx: InlineEditContextValue }) => {
  const [imgOpen, setImgOpen] = useState(false);
  const [vidOpen, setVidOpen] = useState(false);
  const [galIdx, setGalIdx] = useState<number | null>(null);
  const [colIdx, setColIdx] = useState<number | null>(null);
  const up = (patch: Partial<PageBlock>) => ctx.updateBlock(block.id, patch);
  const editing = ctx.editing;

  switch (block.type) {
    case "heading": {
      const Tag = block.level === 3 ? "h3" : "h2";
      return (
        <div>
          <Tag className={`${fontClass(block)} ${sizeClass(block)} text-foreground`}><InlineText value={block.text ?? ""} onCommit={(v) => up({ text: v })} /></Tag>
          {editing && <StyleControls block={block} up={up} />}
        </div>
      );
    }

    case "text":
      return (
        <div>
          <p className={`${fontClass(block)} ${sizeClass(block)} text-muted-foreground leading-[1.75]`}><InlineText block value={block.text ?? ""} onCommit={(v) => up({ text: v })} /></p>
          {editing && <StyleControls block={block} up={up} />}
        </div>
      );

    case "image":
      return (
        <figure>
          <div className="relative inline-block">
            {block.src
              ? <img src={block.src} alt={block.caption || ""} className="max-w-full h-auto rounded-2xl mx-auto" />
              : <div className="grid h-40 w-72 max-w-full place-items-center rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground"><ImageIcon className="w-8 h-8" /></div>}
            {editing && <button onClick={() => setImgOpen(true)} className="absolute top-2 right-2 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black/85"><ImageIcon className="w-3.5 h-3.5" /> Change</button>}
          </div>
          {(block.caption || editing) && <figcaption className="text-xs text-muted-foreground mt-2"><InlineText value={block.caption ?? ""} onCommit={(v) => up({ caption: v })} /></figcaption>}
          {imgOpen && <Modal title="Choose image" onClose={() => setImgOpen(false)}><ImageUpload value={block.src ?? ""} onChange={(url) => up({ src: url })} /><div className="mt-4 flex justify-end"><button onClick={() => setImgOpen(false)} className="rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm">Done</button></div></Modal>}
        </figure>
      );

    case "video":
      return (
        <div>
          <div className="relative aspect-video rounded-2xl overflow-hidden bg-foreground/90">
            {block.videoId ? videoEmbed(block) : <div className="absolute inset-0 grid place-items-center text-white/70 text-sm">No video set</div>}
            {editing && <button onClick={() => setVidOpen(true)} className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black/85"><Film className="w-3.5 h-3.5" /> Change video</button>}
          </div>
          {vidOpen && (
            <Modal title="Video" onClose={() => setVidOpen(false)}>
              <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Source</label>
              <select value={block.provider ?? "youtube"} onChange={(e) => up({ provider: e.target.value as PageBlock["provider"], videoId: "" })} className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm mb-3">
                <option value="youtube">YouTube</option>
                <option value="vimeo">Vimeo</option>
                <option value="file">Video file (upload / library)</option>
              </select>
              {block.provider === "file" ? (
                <ImageUpload kind="video" value={block.videoId ?? ""} onChange={(url) => up({ videoId: url })} />
              ) : (
                <>
                  <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Video ID</label>
                  <input value={block.videoId ?? ""} onChange={(e) => up({ videoId: e.target.value })} placeholder={block.provider === "vimeo" ? "76979871" : "dQw4w9WgXcQ"} className="w-full rounded-xl border border-border bg-background px-3.5 py-2.5 text-sm" />
                  <p className="text-xs text-muted-foreground mt-1">Paste just the video ID from the share URL.</p>
                </>
              )}
              <div className="mt-4 flex justify-end"><button onClick={() => setVidOpen(false)} className="rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm">Done</button></div>
            </Modal>
          )}
        </div>
      );

    case "button":
      return editing ? (
        <div className="inline-flex flex-col items-start gap-1.5">
          <span className={`inline-flex items-center justify-center gradient-hero text-white font-semibold rounded-xl ${sizeClass(block)} ${fontClass(block)}`}>{block.text || "Button"}</span>
          <input value={block.text ?? ""} onChange={(e) => up({ text: e.target.value })} placeholder="Button label" className="w-full min-w-[16rem] rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs" />
          <input value={block.href ?? ""} onChange={(e) => up({ href: e.target.value })} placeholder="Link (/page or https://…)" className="w-full min-w-[16rem] rounded-lg border border-border bg-background px-2.5 py-1.5 text-xs" />
          <StyleControls block={block} up={up} />
        </div>
      ) : (
        <a href={block.href || "#"} className={`inline-flex items-center gap-1.5 gradient-hero text-white font-semibold rounded-xl hover:opacity-90 transition-opacity ${sizeClass(block)} ${fontClass(block)}`}>{block.text}</a>
      );

    case "divider":
      return (
        <div>
          <hr className="border-0 bg-border w-full" style={{ height: block.thickness ?? 1 }} />
          {editing && (
            <div className="mt-2 inline-flex items-center gap-2 rounded-lg border border-border bg-background/80 px-2 py-1.5 text-xs">
              <span className="text-muted-foreground">Thickness</span>
              <input type="range" min={1} max={16} value={block.thickness ?? 1} onChange={(e) => up({ thickness: Number(e.target.value) })} />
              <span className="tabular-nums w-8 text-right">{block.thickness ?? 1}px</span>
            </div>
          )}
        </div>
      );

    case "spacer":
      return (
        <div style={{ height: block.height ?? 40 }} className={editing ? "relative bg-primary/5 rounded" : ""}>
          {editing && <div className="absolute inset-0 grid place-items-center"><input type="range" min={8} max={240} value={block.height ?? 40} onChange={(e) => up({ height: Number(e.target.value) })} className="w-1/2" /></div>}
        </div>
      );

    case "icon": {
      const Icon = BLOCK_ICONS[block.icon ?? "zap"] ?? BLOCK_ICONS.zap;
      return (
        <div>
          <Icon className="w-10 h-10 text-primary inline-block" strokeWidth={2} />
          {editing && <IconPicker block={block} up={up} />}
        </div>
      );
    }

    case "accordion":
    case "tabs": {
      const items = block.items ?? [];
      const setItems = (it: NonNullable<PageBlock["items"]>) => up({ items: it });
      if (!editing) return block.type === "tabs" ? <TabsView items={items} /> : <AccordionView items={items} />;
      return (
        <div className="text-left space-y-2">
          {items.map((it, i) => (
            <div key={i} className="rounded-xl border border-border p-3">
              <div className="flex items-center gap-2 mb-2">
                <input value={it.title ?? ""} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, title: e.target.value } : x)))} placeholder={block.type === "tabs" ? "Tab label" : "Title"} className="flex-1 rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm font-semibold" />
                <button onClick={() => setItems(items.filter((_, j) => j !== i))} className="p-1.5 rounded-lg text-muted-foreground hover:text-destructive hover:bg-muted"><Trash2 className="w-3.5 h-3.5" /></button>
              </div>
              <textarea value={it.body ?? ""} onChange={(e) => setItems(items.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} placeholder="Content" rows={3} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm resize-y" />
            </div>
          ))}
          <button onClick={() => setItems([...items, { title: block.type === "tabs" ? `Tab ${items.length + 1}` : "New item", body: "" }])} className="inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add {block.type === "tabs" ? "tab" : "item"}</button>
        </div>
      );
    }

    case "columns": {
      const columns = block.columns ?? [];
      const setCols = (c: NonNullable<PageBlock["columns"]>) => up({ columns: c });
      const n = Math.min(4, Math.max(1, columns.length || 1));
      return (
        <div>
          <div className={`grid grid-cols-1 ${colsClass(n)} gap-6 text-left`}>
            {columns.map((c, i) => (
              <div key={i} className="space-y-2">
                {(c.image || editing) && (
                  <div className="relative">
                    {c.image ? <img src={c.image} alt={c.heading || ""} className="w-full h-auto rounded-xl" /> : editing ? <div className="grid h-28 place-items-center rounded-xl border border-dashed border-border bg-muted/40 text-muted-foreground"><ImageIcon className="w-6 h-6" /></div> : null}
                    {editing && <button onClick={() => setColIdx(i)} className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-lg bg-black/70 px-2 py-1 text-xs font-semibold text-white"><ImageIcon className="w-3 h-3" /> Image</button>}
                  </div>
                )}
                {c.heading || editing ? <h3 className="font-brief text-lg text-foreground">{editing ? <input value={c.heading ?? ""} onChange={(e) => setCols(columns.map((x, j) => (j === i ? { ...x, heading: e.target.value } : x)))} placeholder="Heading (optional)" className="w-full rounded border border-border bg-background px-2 py-1 text-sm" /> : c.heading}</h3> : null}
                {editing
                  ? <textarea value={c.body ?? ""} onChange={(e) => setCols(columns.map((x, j) => (j === i ? { ...x, body: e.target.value } : x)))} placeholder="Column text" rows={4} className="w-full rounded-lg border border-border bg-background px-2.5 py-1.5 text-sm resize-y" />
                  : <p className="text-muted-foreground leading-relaxed whitespace-pre-line">{c.body}</p>}
                {editing && <button onClick={() => setCols(columns.filter((_, j) => j !== i))} className="inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-destructive"><Trash2 className="w-3 h-3" /> Remove column</button>}
              </div>
            ))}
          </div>
          {editing && columns.length < 4 && <button onClick={() => setCols([...columns, { body: "New column text." }])} className="mt-3 inline-flex items-center gap-1.5 text-sm text-primary hover:underline"><Plus className="w-4 h-4" /> Add column</button>}
          {colIdx !== null && (
            <Modal title="Column image" onClose={() => setColIdx(null)}>
              <ImageUpload value={columns[colIdx]?.image ?? ""} onChange={(url) => setCols(columns.map((x, j) => (j === colIdx ? { ...x, image: url } : x)))} />
              <div className="mt-4 flex justify-end"><button onClick={() => setColIdx(null)} className="rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm">Done</button></div>
            </Modal>
          )}
        </div>
      );
    }

    case "gallery": {
      const images = block.images ?? [];
      const setImages = (im: NonNullable<PageBlock["images"]>) => up({ images: im });
      return (
        <div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {images.map((im, i) => (
              <figure key={i} className="relative group/g">
                <img src={im.src} alt={im.caption || ""} className="w-full aspect-square object-cover rounded-xl" loading="lazy" />
                {editing && (
                  <div className="absolute top-1.5 right-1.5 flex gap-1">
                    <button onClick={() => setGalIdx(i)} className="p-1.5 rounded-lg bg-black/70 text-white text-xs hover:bg-black/85"><ImageIcon className="w-3 h-3" /></button>
                    <button onClick={() => setImages(images.filter((_, j) => j !== i))} className="p-1.5 rounded-lg bg-black/70 text-white hover:bg-red-500/80"><Trash2 className="w-3 h-3" /></button>
                  </div>
                )}
                {(im.caption || editing) && <figcaption className="text-xs text-muted-foreground mt-1 text-center">{editing ? <input value={im.caption ?? ""} onChange={(e) => setImages(images.map((x, j) => (j === i ? { ...x, caption: e.target.value } : x)))} placeholder="Caption" className="w-full rounded border border-border bg-background px-1.5 py-0.5 text-xs text-center" /> : im.caption}</figcaption>}
              </figure>
            ))}
            {editing && <button onClick={() => { setImages([...images, { src: "" }]); setGalIdx(images.length); }} className="aspect-square rounded-xl border-2 border-dashed border-primary/50 bg-primary/5 grid place-items-center text-primary hover:bg-primary/10"><Plus className="w-6 h-6" /></button>}
          </div>
          {galIdx !== null && (
            <Modal title="Gallery image" onClose={() => setGalIdx(null)}>
              <ImageUpload value={images[galIdx]?.src ?? ""} onChange={(url) => setImages(images.map((x, j) => (j === galIdx ? { ...x, src: url } : x)))} />
              <div className="mt-4 flex justify-end"><button onClick={() => setGalIdx(null)} className="rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm">Done</button></div>
            </Modal>
          )}
        </div>
      );
    }

    case "cta":
      return (
        <div className="relative overflow-hidden rounded-3xl gradient-hero p-8 md:p-12 text-center text-primary-foreground">
          <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 45%)" }} aria-hidden />
          <div className="relative z-10">
            <h2 className="font-brief text-3xl md:text-4xl mb-3"><InlineText value={block.text ?? ""} onCommit={(v) => up({ text: v })} /></h2>
            <p className="text-primary-foreground/90 mb-7 max-w-xl mx-auto"><InlineText value={block.subtext ?? ""} onCommit={(v) => up({ subtext: v })} /></p>
            {editing ? (
              <div className="inline-flex flex-col items-center gap-1.5">
                <span className="inline-flex items-center gap-1.5 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-xl">{block.buttonLabel || "Button"} <ArrowRight className="w-5 h-5" /></span>
                <input value={block.buttonLabel ?? ""} onChange={(e) => up({ buttonLabel: e.target.value })} placeholder="Button label" className="rounded-lg border border-white/40 bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/60" />
                <input value={block.href ?? ""} onChange={(e) => up({ href: e.target.value })} placeholder="Link (/page or https://…)" className="rounded-lg border border-white/40 bg-white/10 px-2.5 py-1.5 text-xs text-white placeholder:text-white/60" />
              </div>
            ) : (
              block.href?.startsWith("http")
                ? <a href={block.href} className="inline-flex items-center gap-1.5 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">{block.buttonLabel} <ArrowRight className="w-5 h-5" /></a>
                : <Link to={block.href || "#"} className="inline-flex items-center gap-1.5 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">{block.buttonLabel} <ArrowRight className="w-5 h-5" /></Link>
            )}
          </div>
        </div>
      );

    default:
      return null;
  }
};

const Toolbar = ({ block, ctx }: { block: PageBlock; ctx: InlineEditContextValue }) => {
  const btn = "p-1.5 rounded-md text-white/90 hover:bg-white/15";
  const setAlign = (a: PageBlock["align"]) => ctx.updateBlock(block.id, { align: a });
  const hasAlign = ["heading", "text", "button", "image", "icon"].includes(block.type);
  return (
    <div className="absolute -top-3 right-2 z-20 hidden group-hover:flex items-center gap-0.5 rounded-lg bg-foreground/90 backdrop-blur px-1 py-0.5 shadow">
      {hasAlign && (
        <>
          <button className={btn} onClick={() => setAlign("left")} title="Left"><AlignLeft className="w-3.5 h-3.5" /></button>
          <button className={btn} onClick={() => setAlign("center")} title="Center"><AlignCenter className="w-3.5 h-3.5" /></button>
          <button className={btn} onClick={() => setAlign("right")} title="Right"><AlignRight className="w-3.5 h-3.5" /></button>
          <span className="w-px h-4 bg-white/20 mx-0.5" />
        </>
      )}
      <button className={btn} onClick={() => ctx.moveBlock(block.id, -1)} title="Move up"><ArrowUp className="w-3.5 h-3.5" /></button>
      <button className={btn} onClick={() => ctx.moveBlock(block.id, 1)} title="Move down"><ArrowDown className="w-3.5 h-3.5" /></button>
      <button className={`${btn} hover:bg-red-500/60`} onClick={() => ctx.removeBlock(block.id)} title="Delete"><Trash2 className="w-3.5 h-3.5" /></button>
    </div>
  );
};

const BlockView = ({ block }: { block: PageBlock }) => {
  const ctx = useInlineEdit();
  if (!ctx) return null;
  const align = alignClass(block.align);
  if (!ctx.editing) return <div className={align}><BlockBody block={block} ctx={ctx} /></div>;
  return (
    <div className={`group relative rounded-xl ring-1 ring-transparent hover:ring-primary/40 transition p-3 ${align}`}>
      <Toolbar block={block} ctx={ctx} />
      <BlockBody block={block} ctx={ctx} />
    </div>
  );
};

export default BlockView;
