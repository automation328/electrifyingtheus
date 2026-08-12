// The page's hero band — the title header at the top of every content page —
// turned into a first-class editable section.
//
// It is NOT a builder block (it's the page's own <header>, and its text lives in
// the page's title/highlight/intro fields), but it borrows the block machinery:
// click it to select, its controls portal into the left Inspector, and it can be
// deleted. Everything it stores lives under `hero` in the page override, so a
// page nobody has touched renders exactly as it always did.

import { useState, type CSSProperties, type ReactNode } from "react";
import { SlidersHorizontal, Trash2, ImagePlus, Undo2 } from "lucide-react";
import type { BlockStyle, PageHero } from "@/lib/page-content";
import { useInlineEdit, HERO_ID, type InlineEditContextValue } from "@/components/inline/edit-context";
import { InspectorPortal } from "@/components/inline/Inspector";
import { Swatch, BG_SWATCHES, TEXT_SWATCHES, GRADIENT_PRESETS, gradientCss } from "@/components/inline/blocks/BlockView";
import ImageUpload from "@/components/admin/ImageUpload";

/** The navbar is `fixed top-0`, so the hero can never have less top padding than
 *  this or the title slides underneath it. 128px (pt-32) is the built-in look. */
const PAD_TOP_MIN = 96;
const PAD_TOP_DEFAULT = 128;

const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

/** Tint laid over the hero photo so overlaid text stays readable. Mirrors the
 *  block overlay control, but keyed off `heroImage` instead of style.bgImage. */
const overlayTint = (s: BlockStyle): string | undefined => {
  if (!s.overlay || s.overlay === "none") return undefined;
  const a = clamp(s.overlayOpacity ?? 45, 0, 100) / 100;
  if (s.overlay === "dark") return `rgba(0,0,0,${a})`;
  if (s.overlay === "light") return `rgba(255,255,255,${a})`;
  return `hsl(var(--${s.overlay === "secondary" ? "secondary" : "primary"}) / ${a})`;
};

/** Layout classes + inline CSS for the hero, derived from its settings. Exported
 *  so ContentPageLayout can align the kicker row and copy block to match. */
export function heroLayout(hero: PageHero | undefined, hasImage: boolean) {
  const s = hero?.style ?? {};
  const css: CSSProperties = {};
  if (s.gradient) css.backgroundImage = gradientCss(s.gradient);
  else if (s.bg) css.backgroundColor = s.bg;
  if (s.color) css.color = s.color;
  if (hero?.minH) css.minHeight = `${hero.minH}vh`;
  if (hasImage) {
    // A photo hero is bottom-aligned inside its own min-height; only honour
    // padding the editor actually asked for.
    if (s.padY != null) { css.paddingTop = s.padY; css.paddingBottom = s.padY; }
  } else {
    css.paddingTop = Math.max(s.padY ?? PAD_TOP_DEFAULT, PAD_TOP_MIN);
    if (s.padY != null) css.paddingBottom = s.padY;
  }
  const align = hero?.align ?? "left";
  return {
    css,
    /** Text alignment for the hero copy. */
    textClass: align === "center" ? "text-center" : align === "right" ? "text-right" : "text-left",
    /** Horizontal placement of the copy column. */
    boxClass: align === "center" ? "mx-auto" : align === "right" ? "ml-auto" : "",
    /** The icon + kicker row follows the same alignment. */
    rowClass: align === "center" ? "justify-center" : align === "right" ? "justify-end" : "",
    /** The little animated "current" rule sits under the copy, wherever it is. */
    ruleClass: align === "center" ? "left-1/2 -translate-x-1/2" : align === "right" ? "right-0" : "left-0",
    /** Editor-chosen text colour, for the few spans the [data-ink] rule can't reach. */
    ink: s.color || undefined,
  };
}

/* ── Inspector panel ──────────────────────────────────────────────────────── */

const HEIGHTS: [string, number | undefined][] = [
  ["Auto", undefined], ["Short", 40], ["Medium", 58], ["Tall", 75], ["Full", 100],
];

const HeroPanel = ({ hero, heroImage, ctx }: { hero?: PageHero; heroImage?: string; ctx: InlineEditContextValue }) => {
  const s = hero?.style ?? {};
  const [imgOpen, setImgOpen] = useState(false);
  const set = (patch: Partial<PageHero>) => ctx.set("hero", { ...(hero ?? {}), ...patch });
  const setStyle = (patch: Partial<BlockStyle>) => set({ style: { ...s, ...patch } });
  const lbl = "block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5";
  const chip = (on: boolean) =>
    `px-2.5 py-1 rounded-lg text-xs ${on ? "gradient-hero text-white" : "border border-border text-muted-foreground hover:bg-muted"}`;

  return (
    <div className="space-y-4 text-left">
      <p className="text-[11px] leading-snug text-muted-foreground border-b border-neutral-100 pb-2 -mt-1">
        The hero's words are edited on the page itself — click the title or the
        paragraph. These controls set how it looks.
      </p>

      <div>
        <label className={lbl}>Background</label>
        <div className="flex flex-wrap items-center gap-1.5">
          {BG_SWATCHES.map(([name, v]) => (
            <Swatch key={name} value={v} active={(s.bg ?? "") === v && !s.gradient} onClick={() => setStyle({ bg: v, gradient: undefined })} />
          ))}
          <input
            type="color"
            value={/^#/.test(s.bg ?? "") ? s.bg : "#ffffff"}
            onChange={(e) => setStyle({ bg: e.target.value, gradient: undefined })}
            className="w-7 h-7 rounded-lg border border-border bg-transparent cursor-pointer"
            title="Custom colour"
          />
        </div>

        <div className="mt-2 flex flex-wrap items-center gap-1.5">
          <span className="text-[11px] text-muted-foreground mr-0.5">Gradient</span>
          {GRADIENT_PRESETS.map((g, i) => (
            <button
              key={i}
              type="button"
              title="Gradient background"
              onClick={() => setStyle({ gradient: g, bg: "" })}
              className={`w-7 h-7 rounded-lg border ${s.gradient?.from === g.from && s.gradient?.to === g.to ? "ring-2 ring-primary border-primary" : "border-border"}`}
              style={{ backgroundImage: gradientCss(g) }}
            />
          ))}
        </div>
        {s.gradient && (
          <div className="mt-2 flex flex-wrap items-center gap-2 text-xs">
            <input type="color" value={/^#/.test(s.gradient.from) ? s.gradient.from : "#0b5fd4"} onChange={(e) => setStyle({ gradient: { ...s.gradient!, from: e.target.value } })} className="w-7 h-7 rounded-lg border border-border bg-transparent cursor-pointer" title="From" />
            <input type="color" value={/^#/.test(s.gradient.to) ? s.gradient.to : "#1f9650"} onChange={(e) => setStyle({ gradient: { ...s.gradient!, to: e.target.value } })} className="w-7 h-7 rounded-lg border border-border bg-transparent cursor-pointer" title="To" />
            <span className="text-muted-foreground">Angle</span>
            <input type="range" min={0} max={360} value={s.gradient.angle ?? 135} onChange={(e) => setStyle({ gradient: { ...s.gradient!, angle: Number(e.target.value) } })} className="flex-1 min-w-[5rem]" />
            <span className="tabular-nums w-9 text-right text-muted-foreground">{s.gradient.angle ?? 135}°</span>
            <button onClick={() => setStyle({ gradient: undefined })} className="text-destructive hover:underline">remove</button>
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Background photo</label>
        {heroImage ? (
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <img src={heroImage} alt="" className="w-12 h-9 object-cover rounded" />
            <button onClick={() => setImgOpen((o) => !o)} className="text-primary hover:underline">replace</button>
            <button onClick={() => { ctx.set("heroImage", ""); setImgOpen(false); }} className="text-destructive hover:underline">remove</button>
          </div>
        ) : (
          <button type="button" onClick={() => setImgOpen((o) => !o)} className="inline-flex items-center gap-1.5 rounded-lg border border-border px-2.5 py-1.5 text-xs hover:bg-muted">
            <ImagePlus className="w-3.5 h-3.5" /> Add a photo
          </button>
        )}
        {imgOpen && <div className="mt-2"><ImageUpload value={heroImage ?? ""} onChange={(url) => ctx.set("heroImage", url)} /></div>}
        {heroImage && (
          <div className="mt-2">
            <div className="flex flex-wrap items-center gap-1.5 text-xs">
              <span className="text-muted-foreground mr-0.5">Tint</span>
              {(["none", "dark", "light", "primary", "secondary"] as const).map((o) => (
                <button key={o} onClick={() => setStyle({ overlay: o })} className={`${chip((s.overlay ?? "none") === o)} capitalize`}>{o}</button>
              ))}
            </div>
            {s.overlay && s.overlay !== "none" && (
              <div className="mt-1.5 flex items-center gap-2 text-xs">
                <span className="text-muted-foreground whitespace-nowrap">Strength {s.overlayOpacity ?? 45}%</span>
                <input type="range" min={0} max={100} value={s.overlayOpacity ?? 45} onChange={(e) => setStyle({ overlayOpacity: Number(e.target.value) })} className="flex-1" />
              </div>
            )}
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Text colour</label>
        <div className="flex flex-wrap items-center gap-1.5">
          {TEXT_SWATCHES.filter(([, v]) => v).map(([name, v]) => (
            <Swatch key={name} value={v} active={s.color === v} onClick={() => setStyle({ color: v })} />
          ))}
          <input
            type="color"
            value={/^#/.test(s.color ?? "") ? s.color : "#0f172a"}
            onChange={(e) => setStyle({ color: e.target.value })}
            className="w-7 h-7 rounded-lg border border-border bg-transparent cursor-pointer"
            title="Custom colour"
          />
          {s.color && <button onClick={() => setStyle({ color: "" })} className="text-xs text-primary hover:underline">Reset</button>}
        </div>
      </div>

      <div>
        <label className={lbl}>Height</label>
        <div className="flex flex-wrap gap-1">
          {HEIGHTS.map(([name, v]) => (
            <button key={name} onClick={() => set({ minH: v })} className={chip((hero?.minH ?? undefined) === v)}>{name}</button>
          ))}
        </div>
        {hero?.minH != null && (
          <div className="mt-2 flex items-center gap-2 text-xs">
            <span className="text-muted-foreground whitespace-nowrap tabular-nums">{hero.minH}% of screen</span>
            <input type="range" min={20} max={100} value={hero.minH} onChange={(e) => set({ minH: Number(e.target.value) })} className="flex-1" />
          </div>
        )}
      </div>

      <div>
        <label className={lbl}>Padding: {s.padY ?? (heroImage ? 0 : PAD_TOP_DEFAULT)}px</label>
        <input
          type="range"
          min={0}
          max={200}
          step={4}
          value={s.padY ?? (heroImage ? 0 : PAD_TOP_DEFAULT)}
          onChange={(e) => setStyle({ padY: Number(e.target.value) })}
          className="w-full"
        />
        <p className="text-[11px] text-muted-foreground mt-1">The top always keeps at least {PAD_TOP_MIN}px so the menu bar never covers the title.</p>
      </div>

      <div>
        <label className={lbl}>Alignment</label>
        <div className="inline-flex gap-1">
          {(["left", "center", "right"] as const).map((a) => (
            <button key={a} onClick={() => set({ align: a })} className={`${chip((hero?.align ?? "left") === a)} capitalize`}>{a}</button>
          ))}
        </div>
      </div>

      <div>
        <label className={lbl}>Show</label>
        <div className="flex flex-wrap gap-2">
          <button onClick={() => set({ hideKicker: !hero?.hideKicker })} className={chip(!hero?.hideKicker)}>Icon + label</button>
          <button onClick={() => set({ hideMeta: !hero?.hideMeta })} className={chip(!hero?.hideMeta)}>Read time line</button>
        </div>
      </div>

      <div className="pt-1 border-t border-neutral-100 space-y-2">
        <button
          onClick={() => { set({ hidden: true }); ctx.setActive(null); }}
          className="inline-flex items-center gap-1.5 rounded-lg border border-destructive/40 px-2.5 py-1.5 text-xs font-semibold text-destructive hover:bg-destructive/10"
        >
          <Trash2 className="w-3.5 h-3.5" /> Delete hero section
        </button>
        <button onClick={() => ctx.set("hero", { ...(hero ?? {}), style: {}, minH: undefined, align: undefined })} className="block text-xs text-muted-foreground hover:text-destructive">
          Reset the hero's look
        </button>
      </div>
    </div>
  );
};

/* ── The section itself ───────────────────────────────────────────────────── */

const HeroSection = ({
  hero, heroImage, image, children,
}: {
  hero?: PageHero;
  heroImage?: string;
  /** The hero photo layer (rendered by ContentPageLayout, which owns the <img>). */
  image?: ReactNode;
  /** The hero copy (kicker, title, intro, meta). */
  children: ReactNode;
}) => {
  const ctx = useInlineEdit();
  const editing = !!ctx?.editing;
  const s = hero?.style ?? {};
  const { css } = heroLayout(hero, !!heroImage);

  // Deleted hero: gone from the live page. In edit mode it leaves a strip to
  // bring it back, so deleting is never a one-way door.
  if (hero?.hidden) {
    if (!editing || !ctx) return <div className="pt-28" aria-hidden />;
    return (
      <div className="pt-28 pb-2">
        <div className="container px-4">
          <button
            type="button"
            onClick={() => { ctx.set("hero", { ...hero, hidden: false }); ctx.setActive(HERO_ID); }}
            className="flex w-full items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border py-6 text-sm font-semibold text-muted-foreground hover:border-primary hover:text-primary transition-colors"
          >
            <Undo2 className="w-4 h-4" /> Hero section deleted — click to bring it back
          </button>
        </div>
      </div>
    );
  }

  const tint = heroImage ? overlayTint(s) : undefined;
  const active = ctx?.activeId === HERO_ID;
  // Let the chosen text colour cascade into the title/paragraph (see the
  // [data-ink] rule in index.css); without it the theme classes win.
  const inkProps = s.color ? { "data-ink": "" } : {};

  return (
    <header
      {...inkProps}
      onClick={editing && ctx ? (e) => { e.stopPropagation(); ctx.setActive(HERO_ID); } : undefined}
      className={`group relative flex items-end overflow-hidden ${heroImage ? "min-h-[78vh]" : "min-h-0"} ${
        editing ? `transition ring-inset ${active ? "ring-2 ring-primary" : "ring-1 ring-transparent hover:ring-primary/40"}` : ""
      }`}
      style={css}
    >
      {image}
      {tint && <div className="absolute inset-0 z-[1]" style={{ background: tint }} aria-hidden />}
      {children}

      {editing && ctx && (
        <>
          <div className="absolute top-20 right-4 z-30 hidden group-hover:flex items-center gap-0.5 rounded-lg bg-foreground/90 backdrop-blur px-1 py-0.5 shadow" contentEditable={false}>
            <span className="px-2 text-[10px] font-semibold uppercase tracking-wide text-white/60">Hero</span>
            <button type="button" className="p-1.5 rounded-md text-white/90 hover:bg-white/15" title="Hero settings" onClick={(e) => { e.stopPropagation(); ctx.setActive(HERO_ID); }}>
              <SlidersHorizontal className="w-3.5 h-3.5" />
            </button>
            <button
              type="button"
              className="p-1.5 rounded-md text-white/90 hover:bg-red-500/60"
              title="Delete hero section"
              onClick={(e) => { e.stopPropagation(); ctx.set("hero", { ...(hero ?? {}), hidden: true }); ctx.setActive(null); }}
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
          <InspectorPortal blockId={HERO_ID}>
            <HeroPanel hero={hero} heroImage={heroImage} ctx={ctx} />
          </InspectorPortal>
        </>
      )}
    </header>
  );
};

export default HeroSection;
