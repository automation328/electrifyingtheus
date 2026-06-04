// Runtime content layer — merges dynamic Events + Blog posts (submitted via the
// n8n form, stored in Supabase) on top of the curated static arrays. When
// Supabase isn't configured the site falls back to the static content unchanged.

import { supabase } from "@/lib/supabase";
import { EVENTS, type EventItem } from "@/data/events";
import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";
import type { GalleryPhoto, GalleryVideo } from "@/data/gallery";
import type { VideoProvider } from "@/components/VideoEmbed";
import fallbackImg from "@/assets/ev-charging.jpg";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

// ── Supabase row shapes ──────────────────────────────────────────────────────
interface EventRow {
  event_date: string; // YYYY-MM-DD
  title: string; type: string | null; location: string | null; region: string | null;
  time: string | null; description: string | null; image: string | null; featured: boolean | null;
}
interface PostRow {
  slug: string; title: string; excerpt: string | null; category: string | null;
  date: string | null; published_at: string | null; author: string | null;
  read_time: string | null; image: string | null; featured: boolean | null; content: string | null;
}

// ── Mappers (Supabase row → the shape the UI already renders) ─────────────────
function rowToEvent(r: EventRow): EventItem {
  const d = new Date(`${r.event_date}T00:00:00`);
  const valid = !Number.isNaN(d.getTime());
  return {
    month: valid ? MONTHS[d.getMonth()] : "",
    day: valid ? String(d.getDate()).padStart(2, "0") : "",
    year: valid ? d.getFullYear() : new Date().getFullYear(),
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
  if (error || !data) return [];
  return (data as EventRow[]).map(rowToEvent);
}

export async function fetchPosts(): Promise<BlogPost[]> {
  if (!supabase) return [];
  const { data, error } = await supabase
    .from("site_blog_posts").select("*").eq("status", "published").order("published_at", { ascending: false });
  if (error || !data) return [];
  return (data as PostRow[]).map(rowToPost);
}

// ── Merge dynamic + curated static (dynamic wins on conflicts) ────────────────
export function mergeEvents(dynamic: EventItem[]): EventItem[] {
  const seen = new Set(dynamic.map(eventDedupe));
  const merged = [...dynamic, ...EVENTS.filter((e) => !seen.has(eventDedupe(e)))];
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
  if (error || !data) return { photos: [], videos: [] };
  const rows = data as GalleryRow[];
  const photos: GalleryPhoto[] = rows
    .filter((r) => r.kind !== "video")
    .map((r) => ({ src: r.url, alt: r.title || r.album || "Gallery photo", caption: r.title || r.album || undefined }));
  const videos: GalleryVideo[] = rows
    .filter((r) => r.kind === "video")
    .map((r) => {
      const provider = (r.provider || "file") as VideoProvider;
      const isEmbed = provider === "youtube" || provider === "vimeo";
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
