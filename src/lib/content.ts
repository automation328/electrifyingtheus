// Runtime content layer — merges dynamic Events + Blog posts (submitted via the
// n8n form, stored in Supabase) on top of the curated static arrays. When
// Supabase isn't configured the site falls back to the static content unchanged.

import { supabase } from "@/lib/supabase";
import { EVENTS, slugify, type EventItem } from "@/data/events";
import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";
import type { GalleryPhoto, GalleryVideo } from "@/data/gallery";
import type { Job } from "@/data/careers";
import type { VideoProvider } from "@/components/VideoEmbed";
import type { VehicleData } from "@/lib/tco-calculator";
import type { CatKey, Incentive, IncentiveOverride } from "@/data/incentives";
import fallbackImg from "@/assets/ev-charging.jpg";
import jobFallbackImg from "@/assets/workforce.jpg";
import { cmsError } from "@/lib/cms-error";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ── Supabase row shapes ──────────────────────────────────────────────────────
interface EventRow {
  // Needed so an inline edit on the page knows which row to write back to.
  // fetchEvents selects "*", so this was always present — just untyped.
  id: string;
  event_date: string; // YYYY-MM-DD — the START of the event
  end_date: string | null; // YYYY-MM-DD — last day of a multi-day event, else null
  title: string; type: string | null; location: string | null; region: string | null;
  time: string | null; description: string | null; image: string | null; featured: boolean | null;
}
interface PostRow {
  // Needed so an inline edit on the page knows which row to write back to.
  // fetchPosts selects "*", so this was always present — just untyped.
  id: string;
  slug: string; title: string; excerpt: string | null; category: string | null;
  date: string | null; published_at: string | null; author: string | null;
  read_time: string | null; image: string | null; featured: boolean | null; content: string | null;
}

// ── Mappers (Supabase row → the shape the UI already renders) ─────────────────
function rowToEvent(r: EventRow): EventItem {
  const d = new Date(`${r.event_date}T00:00:00`);
  const valid = !Number.isNaN(d.getTime());
  return {
    id: r.id,
    month: valid ? MONTHS[d.getMonth()] : "",
    day: valid ? String(d.getDate()).padStart(2, "0") : "",
    year: valid ? d.getFullYear() : new Date().getFullYear(),
    // Passed through as the raw ISO string; eventEndDate() is what validates it
    // (and ignores a range that ends before it starts).
    endDate: r.end_date || undefined,
    title: r.title,
    type: r.type || "Event",
    location: r.location || "",
    region: r.region || r.location || "",
    time: r.time || "",
    description: r.description || "",
    image: r.image || fallbackImg,
    featured: !!r.featured,
  };
}

function rowToPost(r: PostRow): BlogPost {
  return {
    id: r.id,
    slug: r.slug,
    title: r.title,
    excerpt: r.excerpt || "",
    category: r.category || "News",
    date: r.date || (r.published_at ?? ""),
    author: r.author || "Electrifying the US Team",
    readTime: r.read_time || "3 min read",
    image: r.image || fallbackImg,
    featured: !!r.featured,
    content: r.content || "",
  };
}

// ── Sort keys ────────────────────────────────────────────────────────────────
const eventKey = (e: EventItem) =>
  e.year * 10000 + (MONTHS.indexOf(e.month) + 1) * 100 + (Number(e.day) || 0);
const eventDedupe = (e: EventItem) => `${e.title}|${e.year}-${e.month}-${e.day}`;

// ── Fetchers ─────────────────────────────────────────────────────────────────
export async function fetchEvents(): Promise<EventItem[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_events").select("*").eq("status", "published").order("event_date", { ascending: true });
  if (error) throw cmsError("site_events", error);
  if (!data) return [];
  return (data as EventRow[]).map(rowToEvent);
}

export async function fetchPosts(): Promise<BlogPost[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_blog_posts").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (error) throw cmsError("site_blog_posts", error);
  if (!data) return [];
  return (data as PostRow[]).map(rowToPost);
}

// A stable detail-page slug for a DB event (which carries none from the row), so
// its "More info" link works. Self-consistent — EventDetail looks it up in this
// same merged list.
const fallbackSlug = (e: EventItem) => `${slugify(e.title)}-${e.month.toLowerCase()}-${e.day}-${e.year}`;

/**
 * The site_events row to INSERT when an editor makes the first inline change to
 * a curated event (one that lives in data/events.ts and has no row yet).
 *
 * event_date is rebuilt from the item's month/day/year with the same MONTHS
 * constant rowToEvent used to take it apart, so the round trip is symmetrical —
 * a wrong date here would move the event and change its detail-page slug.
 */
export function eventAdoptRow(e: EventItem): Record<string, unknown> {
  const mi = MONTHS.indexOf(e.month);
  const mm = String(mi >= 0 ? mi + 1 : 1).padStart(2, "0");
  const dd = String(Number(e.day) || 1).padStart(2, "0");
  return {
    event_date: `${e.year}-${mm}-${dd}`,
    // Carried across so adopting a multi-day event does not silently flatten it
    // back to a single day. null, not "", because the column is a date.
    end_date: e.endDate ?? null,
    title: e.title,
    type: e.type,
    location: e.location,
    region: e.region,
    time: e.time,
    description: e.description,
    image: e.image,
    featured: !!e.featured,
    status: "published",
  };
}

/**
 * The live detail path for a raw site_events row — using the SAME rule the site
 * uses, by calling the same functions rather than restating them.
 *
 * This matters: a DB event whose title + date match a curated one ADOPTS the
 * curated slug (see mergeEvents below). Re-deriving the slug anywhere else
 * would link to /events/<generated> for exactly those events, and 404.
 */
export function eventDetailPath(row: Parameters<typeof rowToEvent>[0]): string {
  const e = rowToEvent(row);
  const curated = EVENTS.find((x) => eventDedupe(x) === eventDedupe(e));
  return `/events/${e.slug || curated?.slug || fallbackSlug(e)}`;
}

// ── Merge dynamic + curated static (dynamic wins on conflicts) ────────────────
export function mergeEvents(dynamic: EventItem[]): EventItem[] {
  const staticByKey = new Map(EVENTS.map((e) => [eventDedupe(e), e]));
  // Ensure every dynamic event has a working detail link. When a DB event
  // overrides a curated one (same title + date), it ADOPTS the curated slug +
  // register link so its dedicated /events/<slug> page keeps working after an
  // edit; a brand-new DB event gets a generated slug.
  const dyn = dynamic.map((e) => {
    const s = staticByKey.get(eventDedupe(e));
    return {
      ...e,
      slug: e.slug || s?.slug || fallbackSlug(e),
      registerUrl: e.registerUrl || s?.registerUrl,
      // Inherit the curated flags too — site_events has no column for them, and
      // the curated row is dropped by the dedupe below, so anything not carried
      // here is lost. `ours` is what keeps one of our own events on the site
      // after its date (isActive, data/events.ts:83); without it an adopted
      // event silently disappears the day after it runs. `heroHidden` keeps
      // events out of the homepage carousel — 23 of ~25 curated events set it,
      // so losing it promotes them into the hero instead.
      ours: e.ours ?? s?.ours,
      heroHidden: e.heroHidden ?? s?.heroHidden,
      external: e.external ?? s?.external,
    };
  });
  const seen = new Set(dyn.map(eventDedupe));
  const merged = [...dyn, ...EVENTS.filter((e) => !seen.has(eventDedupe(e)))];
  return merged.sort((a, b) => eventKey(a) - eventKey(b));
}

export function mergePosts(dynamic: BlogPost[]): BlogPost[] {
  const seen = new Set(dynamic.map((p) => p.slug));
  // Dynamic (newest submissions) first, then the curated catalog in its set order.
  return [...dynamic, ...BLOG_POSTS.filter((p) => !seen.has(p.slug))];
}

// ── Gallery (site_gallery) ───────────────────────────────────────────────────
interface GalleryRow {
  kind: string; title: string | null; album: string | null;
  url: string; poster: string | null; provider: string | null;
}

export async function fetchGallery(): Promise<{ photos: GalleryPhoto[]; videos: GalleryVideo[] }> {
  if (!supabase) return { photos: [], videos: [] };
  const { data, error } = await supabase
    .from("site_gallery").select("*").eq("status", "published")
    .order("sort", { ascending: true }).order("created_at", { ascending: false });
  if (error) throw cmsError("site_gallery", error);
  if (!data) return { photos: [], videos: [] };
  const rows = data as GalleryRow[];
  const photos: GalleryPhoto[] = rows
    .filter((r) => r.kind !== "video")
    .map((r) => ({ src: r.url, alt: r.title || r.album || "Gallery photo", caption: r.title || r.album || undefined }));
  const videos: GalleryVideo[] = rows
    .filter((r) => r.kind === "video")
    .map((r) => {
      const provider = (r.provider || "file") as VideoProvider;
      const isEmbed = provider === "youtube" || provider === "vimeo" || provider === "drive";
      return {
        provider,
        title: r.title || r.album || "Video",
        id: isEmbed ? r.url : undefined,
        src: isEmbed ? undefined : r.url,
        poster: r.poster || undefined,
      };
    });
  return { photos, videos };
}

// ── Jobs (site_jobs) ─────────────────────────────────────────────────────────
interface JobRow {
  title: string; company: string | null; department: string | null;
  location: string | null; type: string | null; description: string | null;
  description_full: string | null; image: string | null;
  apply_url: string | null; apply_email: string | null; featured: boolean | null;
}

function rowToJob(r: JobRow): Job {
  return {
    title: r.title,
    company: r.company || "Electrifying the US",
    department: r.department || "EV Industry",
    location: r.location || "Remote · U.S.",
    type: r.type || "Full-time",
    description: r.description || "",
    descriptionFull: r.description_full || r.description || "",
    image: r.image || jobFallbackImg,
    featured: !!r.featured,
    applyUrl: r.apply_url || undefined,
    applyEmail: r.apply_email || undefined,
  };
}

export async function fetchJobs(): Promise<Job[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_jobs").select("*").eq("status", "published")
    .order("sort", { ascending: true }).order("created_at", { ascending: false });
  if (error) throw cmsError("site_jobs", error);
  if (!data) return [];
  return (data as JobRow[]).map(rowToJob);
}

// ── Vehicles (site_vehicles) — boot-time overlay onto the static catalog ──────
interface VehicleDbRow {
  status: string; hidden: boolean | null; vehicle_id: string; name: string; type: string;
  msrp: number | null; mpg: number | null; mpge: number | null; kwh_per_100mi: number | null;
  maintenance_cost_per_mile: number | null; insurance_annual: number | null; depreciation_rate: number | null;
  category: string | null; image: string | null; body_style: string | null; size_class: number | null;
  seats: number | null; drivetrain: string | null; range_mi: number | null;
  performance: boolean | null; luxury: boolean | null;
}

function rowToVehicle(r: VehicleDbRow): VehicleData {
  const v: VehicleData = {
    id: r.vehicle_id,
    name: r.name,
    type: r.type === "gas" ? "gas" : "ev",
    msrp: Number(r.msrp) || 0,
    maintenanceCostPerMile: Number(r.maintenance_cost_per_mile) || 0,
    insuranceAnnual: Number(r.insurance_annual) || 0,
    depreciationRate: Number(r.depreciation_rate) || 0,
    category: r.category || "Sedan",
  };
  if (r.mpg != null) v.mpg = Number(r.mpg);
  if (r.mpge != null) v.mpge = Number(r.mpge);
  if (r.kwh_per_100mi != null) v.kwhPer100mi = Number(r.kwh_per_100mi);
  if (r.image) v.image = r.image;
  if (r.body_style) v.bodyStyle = r.body_style as VehicleData["bodyStyle"];
  if (r.size_class != null) v.sizeClass = Number(r.size_class);
  if (r.seats != null) v.seats = Number(r.seats);
  if (r.drivetrain) v.drivetrain = r.drivetrain as VehicleData["drivetrain"];
  if (r.range_mi != null) v.rangeMi = Number(r.range_mi);
  if (r.performance) v.performance = true;
  if (r.luxury) v.luxury = true;
  return v;
}

/** Published vehicle overrides + the ids of static vehicles to remove. */
export async function fetchVehicleOverrides(): Promise<{ published: VehicleData[]; hiddenIds: string[] }> {
  if (!supabase) return { published: [], hiddenIds: [] };
  const { data, error } = await supabase
    .from("site_vehicles").select("*").eq("status", "published")
    .order("sort", { ascending: true });
  if (error) throw cmsError("site_vehicles", error);
  if (!data) return { published: [], hiddenIds: [] };
  const rows = data as VehicleDbRow[];
  return {
    published: rows.filter((r) => !r.hidden).map(rowToVehicle),
    hiddenIds: rows.filter((r) => r.hidden).map((r) => r.vehicle_id),
  };
}

// ── Incentives (site_incentives) — boot-time overlay onto the curated sets ─────
interface IncentiveDbRow {
  status: string; hidden: boolean | null; scope: string; state: string | null; category: string | null;
  name: string; jurisdiction: string | null; amount: string | null;
  income: boolean | null; used: boolean | null; description: string | null; link: string | null;
}

const CATS = new Set(["vehicle", "charging", "electricity", "perks"]);

function rowToIncentiveOverride(r: IncentiveDbRow): IncentiveOverride {
  const incentive: Incentive = {
    name: r.name,
    jurisdiction: r.jurisdiction || "",
    desc: r.description || "",
    link: r.link || "",
  };
  if (r.amount) incentive.amount = r.amount;
  if (r.income) incentive.income = true;
  if (r.used) incentive.used = true;
  const scope = r.scope === "federal" || r.scope === "utility" ? r.scope : "state";
  const category = r.category && CATS.has(r.category) ? (r.category as CatKey) : null;
  return { scope, state: r.state, category, hidden: !!r.hidden, incentive };
}

export async function fetchIncentiveOverrides(): Promise<IncentiveOverride[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_incentives").select("*").eq("status", "published")
    .order("sort", { ascending: true });
  if (error) throw cmsError("site_incentives", error);
  if (!data) return [];
  return (data as IncentiveDbRow[]).map(rowToIncentiveOverride);
}
