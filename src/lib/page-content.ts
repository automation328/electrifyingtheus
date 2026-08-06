// CMS override layer for content-page prose. A page renders via EditableContentPage,
// which merges the published DB override (site_pages, keyed by route path) over the
// page's static defaults — field by field, so an unset field falls back to code.
//
// Only the serializable prose fields are overridable; icon/hero image/video/etc.
// stay in code. Reads are reactive (React Query), so an edit shows on next load.

import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";
import type { ContentStat, ContentSection, ContentSource, ContentShot } from "@/components/ContentPageLayout";
import { reducedEmissionsContent } from "@/data/pages/reduced-emissions";

/** A builder block inserted between page sections. */
export type BlockType =
  | "heading" | "text" | "image" | "video" | "button" | "divider" | "spacer" | "icon"  // Tier 1
  | "accordion" | "tabs" | "columns" | "gallery" | "cta"                                // Tier 2
  | "image-box" | "icon-box" | "counter" | "countdown" | "maps" | "html"                // Tier 3
  | "testimonial" | "alert" | "rating" | "social" | "progress"                          // Tier 4
  | "table" | "icon-list" | "toc"                                                       // Tier 5
  | "container";                                                                        // nested layout

export interface PageBlock {
  id: string;
  /** Insertion point: "after-stats" | "after-section-{i}" | "end". */
  slot: string;
  type: BlockType;
  align?: "left" | "center" | "right";
  alignMobile?: "left" | "center" | "right"; // responsive: alignment on mobile (< md)
  size?: "sm" | "md" | "lg" | "xl";        // heading / text / button size
  font?: "display" | "sans" | "mono";      // heading / text / button font
  // Per-type fields (only the relevant ones are set):
  text?: string;                    // heading / text / button label / cta heading
  level?: 1 | 2 | 3 | 4 | 5 | 6;    // heading level (h1–h6)
  gradientText?: boolean;           // heading: gradient-colored text
  src?: string;                     // image URL
  caption?: string;                 // image caption
  alt?: string;                     // image alt text (a11y/SEO; falls back to caption)
  ratio?: "auto" | "square" | "16-9" | "4-3" | "3-2"; // image aspect ratio (crop)
  fit?: "cover" | "contain";        // image object-fit when a ratio is set
  href?: string;                    // button / cta link
  newTab?: boolean;                 // button: open link in a new tab
  wide?: boolean;                   // button: full-width
  iconRight?: boolean;              // button: place the icon after the label
  provider?: "youtube" | "vimeo" | "file"; // video
  videoId?: string;                 // video id (youtube/vimeo) or file URL
  autoplay?: boolean;               // video: start playing automatically (implies muted)
  loop?: boolean;                   // video: loop playback
  muted?: boolean;                  // video: start muted
  height?: number;                  // spacer height (px)
  icon?: string;                    // icon key (see block icon set)
  iconSize?: "sm" | "md" | "lg" | "xl"; // icon block size
  iconColor?: string;               // icon block color (CSS value)
  thickness?: number;               // divider thickness (px)
  // Tier 2:
  items?: { title?: string; body?: string }[];                        // accordion / tabs
  multiOpen?: boolean;              // accordion: allow multiple panels open
  startClosed?: boolean;            // accordion: start with all panels collapsed
  columns?: { heading?: string; body?: string; image?: string }[];    // columns
  images?: { src: string; caption?: string }[];                       // gallery
  subtext?: string;                 // cta subtext
  buttonLabel?: string;             // cta button label
  variant?: string;                 // design variant (countdown: boxes | cards | inline | minimal)
  style?: BlockStyle;               // per-block style (Elementor-like)
  hideMobile?: boolean;             // hidden on small screens
  hideDesktop?: boolean;            // hidden on large screens
  num?: number;                     // rating (0-5) / progress percent (0-100)
  // Table:
  rows?: string[][];                // table cell text, [row][col]
  header?: boolean;                 // treat the first table row as a header
  // Container (nested layout):
  cols?: number;                    // number of columns (1-4)
  colsMobile?: number;              // container: columns on mobile (1-2); defaults to 1
  colRatio?: string;                // column width ratio key (e.g. "1-2", "2-1-1"); equal if unset
  alignItems?: "start" | "center" | "end"; // container: vertical alignment of columns
  gap?: number;                     // container: gap between columns (px)
  colStyles?: BlockStyle[];         // container: per-column background/padding/radius (by column index)
  children?: PageBlock[];           // nested child blocks
  col?: number;                     // which column this block sits in (inside a container)
  fullWidth?: boolean;              // container spans the full viewport width (full-bleed)
  anchor?: string;                  // jump-link id (buttons can link to #anchor on the same page)
}

export interface BlockStyle {
  bg?: string;        // background color (CSS value) or ""
  bgImage?: string;   // background image URL
  color?: string;     // text color (CSS value)
  padY?: number;      // vertical padding (px)
  padX?: number;      // horizontal padding (px)
  maxW?: "sm" | "md" | "lg" | "full";  // content width
  radius?: number;    // corner radius (px)
  shadow?: "none" | "sm" | "md" | "lg" | "xl";  // box-shadow preset
  border?: number;    // border width (px)
  borderColor?: string;  // border color (CSS value)
  gradient?: { from: string; to: string; angle?: number };  // gradient background
  overlay?: "none" | "dark" | "light" | "primary" | "secondary"; // tint over a bg image
  overlayOpacity?: number;  // overlay strength 0-100
  mt?: number;        // margin top (px)
  mb?: number;        // margin bottom (px)
  hover?: "none" | "lift" | "zoom" | "glow";  // hover motion effect (view mode)
  anim?: "none" | "fade" | "up" | "left" | "right" | "zoom";  // entrance animation on scroll-in
  animDelay?: number;  // entrance animation delay (ms) — used for staggering
  sticky?: boolean;    // pin the block while its section scrolls (view mode)
}

/** Per-page SEO / social-share overrides. */
export interface PageSeo {
  title?: string;        // browser + social-card title (falls back to the page title)
  description?: string;  // meta description / social summary (falls back to the intro)
  image?: string;        // social-share image URL (falls back to the site default)
}

/** The overridable fields of a ContentPageLayout page (prose + images + blocks). */
export interface PageOverride {
  badge?: string;
  title?: string;
  highlight?: string;
  intro?: string;
  kicker?: string;
  pullQuote?: string;
  stats?: ContentStat[];
  sections?: ContentSection[];
  sources?: ContentSource[];
  heroImage?: string;
  gallery?: ContentShot[];
  blocks?: PageBlock[];
  seo?: PageSeo;
  /** Fields the editor intentionally blanked. Only these override the static
   * default with an empty value; an empty value NOT listed here (e.g. in a
   * legacy row) still falls back to the default. */
  cleared?: string[];
}

export const PAGE_OVERRIDE_KEYS: (keyof PageOverride)[] = [
  "badge", "title", "highlight", "intro", "kicker", "pullQuote",
  "stats", "sections", "sources", "heroImage", "gallery", "blocks", "seo", "cleared",
];

/** Pages wired to EditableContentPage — shown in the CMS Pages editor. */
export interface EditablePageInfo { path: string; label: string }
export const EDITABLE_PAGES: EditablePageInfo[] = [
  { path: "/reduced-emissions", label: "Reduced Emissions" },
  { path: "/electric-public-transit", label: "Electric Public Transit" },
  { path: "/electric-school-buses", label: "Electric School Buses" },
  { path: "/ev-charging-101", label: "EV Charging 101" },
  { path: "/ev-road-safety", label: "EV Road Safety" },
  { path: "/evs-in-winter", label: "EVs in Winter" },
  { path: "/evtol-drone-delivery", label: "eVTOL & Drone Delivery" },
  { path: "/financial-savings", label: "Financial Savings" },
  { path: "/heavy-duty-electrification", label: "Heavy-Duty Electrification" },
  { path: "/micro-mobility", label: "Micro-Mobility" },
  { path: "/rideshare-rental-fleets", label: "Rideshare & Rental Fleets" },
  { path: "/save-with-evs-webinar", label: "Save with EVs Webinar" },
  { path: "/self-driving-vehicles", label: "Self-Driving Vehicles" },
  { path: "/steam-education", label: "STEAM Education" },
  { path: "/sustainable-aviation", label: "Sustainable Aviation" },
  { path: "/sustainable-maritime", label: "Sustainable Maritime" },
  { path: "/us-ev-policies", label: "US EV Policies" },
  { path: "/workforce-economic-development", label: "Workforce & Economic Development" },
];

// Static default prose per editable page — the CMS editor pre-fills from these so
// an editor edits the current copy (rather than a blank form). Imported from the
// page's data module (type-only import above avoids a runtime cycle).
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const PAGE_DEFAULTS: Record<string, PageOverride> = {
  "/reduced-emissions": reducedEmissionsContent,
};

/** Copy just the overridable fields out of a props/content object (deep-cloned). */
export function pickPageOverride(source: Record<string, unknown>): PageOverride {
  const out: PageOverride = {};
  for (const k of PAGE_OVERRIDE_KEYS) {
    const v = source[k];
    if (v !== undefined) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[k] = typeof v === "object" && v !== null ? structuredClone(v) : v;
    }
  }
  return out;
}

function isEmpty(v: unknown): boolean {
  if (v === undefined || v === null) return true;
  if (typeof v === "string") return v.trim() === "";
  if (Array.isArray(v)) return v.length === 0;
  return false;
}

/** Merge an override onto static props. A non-empty override field wins; an
 * EMPTY field wins only if the editor intentionally cleared it (listed in
 * `override.cleared`), so a legacy row with a stray empty value still falls back
 * to the static default. */
export function mergePageOverride<T extends PageOverride>(base: T, override: PageOverride | null | undefined): T {
  if (!override) return base;
  const out = { ...base };
  const cleared = new Set(override.cleared ?? []);
  for (const key of PAGE_OVERRIDE_KEYS) {
    const v = override[key];
    if (v === undefined || v === null) continue;
    if (key === "cleared" || !isEmpty(v) || cleared.has(key)) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (out as any)[key] = v;
    }
  }
  return out;
}

/** Fetch the published override payload for a route path (or null). */
export async function fetchPageOverride(path: string): Promise<PageOverride | null> {
  if (!supabase) return null;
  const { data, error } = await supabase
    .from("site_pages").select("content").eq("path", path).eq("status", "published").maybeSingle();
  if (error || !data) return null;
  return (data.content ?? null) as PageOverride | null;
}

/** Reactive override for a page (empty until/unless one is published). */
export function usePageOverride(path: string): PageOverride | null {
  const q = useQuery({
    queryKey: ["site-page", path],
    queryFn: () => fetchPageOverride(path),
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });
  return q.data ?? null;
}
