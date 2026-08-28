// React Query hooks that surface merged (dynamic + static) Events and Blog
// posts. They return the static content immediately, then merge in any
// Supabase-backed rows once fetched. With Supabase unconfigured they are a
// no-op wrapper over the curated static arrays.

import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchEvents, fetchPosts, fetchGallery, fetchJobs, fetchFeedSuppressions, mergeEvents, mergePosts, eventFromRow } from "@/lib/content";
import { listRows } from "@/lib/admin-api";
import { useEditorAuth } from "@/lib/auth";
import { EVENTS, isActive, shortZone, type EventItem } from "@/data/events";
import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";
import { GALLERY_PHOTOS, GALLERY_VIDEOS, type GalleryPhoto, type GalleryVideo } from "@/data/gallery";
import { type Job } from "@/data/careers";

const FIVE_MIN = 5 * 60 * 1000;

export function useEvents(): { events: EventItem[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["site-events"],
    queryFn: fetchEvents,
    enabled: isSupabaseConfigured,
    staleTime: FIVE_MIN,
  });
  // Auto-remove events once they're done — except our own (isActive keeps
  // upcoming events plus any flagged `ours`). Applies everywhere useEvents feeds:
  // homepage hero/featured, navbar dropdown, the Events list, and EventDetail.
  const base = isSupabaseConfigured ? mergeEvents(q.data ?? []) : EVENTS;
  // Two-letter zones (ET, CT, MT, PT) for display. Done HERE rather than at the
  // fourteen places an event's time is rendered — one of those would inevitably
  // be missed, and a listing showing "MST" beside another showing "MT" for the
  // same hour is the bug this removes. The stored value keeps whatever the
  // organiser typed; only what a reader sees is normalised.
  const events = base.filter(isActive).map((e) => ({ ...e, time: shortZone(e.time) }));
  return { events, loading: isSupabaseConfigured ? q.isLoading : false };
}

/**
 * Registration URLs claimed by event rows the site does not show, so the Events
 * page can drop the feed copies they were suppressing. See fetchFeedSuppressions.
 *
 * Same 5-minute staleness as the events themselves: the two are read together
 * and there is nothing to gain from one being fresher than the other.
 */
const NO_SUPPRESSIONS: string[] = [];

export function useFeedSuppressions(): string[] {
  const q = useQuery({
    queryKey: ["event-feed-suppressions"],
    queryFn: fetchFeedSuppressions,
    enabled: isSupabaseConfigured,
    staleTime: FIVE_MIN,
  });
  // A shared constant, not a fresh `?? []`: the Events page feeds this straight
  // into a useMemo dependency list, and a new empty array every render would
  // rebuild the whole merged list on every render.
  return q.data ?? NO_SUPPRESSIONS;
}

/**
 * The site_events row behind a slug REGARDLESS of status, for a signed-in editor.
 *
 * The public site only ever fetches published events (fetchEvents filters on it),
 * which is correct — but it meant the CMS's "Edit on page" button was a dead
 * end for a draft. It navigates to /events/<slug>, the page could not see the
 * draft, and for an imported event the SAME event usually still exists in the
 * aggregated feed — so the page quietly rendered the feed copy instead. Feed
 * events are deliberately not editable (they are not ours to write), so an editor
 * clicking "Edit on page" on their own draft landed on a page with no editable
 * fields at all, showing someone else's version of the text.
 *
 * Reads through /api/admin rather than the public client: that path is already
 * editor-gated and runs with the service role, so it sees drafts without needing
 * any change to the row-level security that keeps them private.
 *
 * `enabled` is passed by the caller so this costs nothing on the normal path —
 * it only runs when the published lookup already came up empty.
 */
export function useDraftEvent(
  slug: string | undefined,
  enabled: boolean,
): { event: EventItem | undefined; loading: boolean } {
  const auth = useEditorAuth();
  const on = auth.status === "editor" && !!slug && enabled;
  const q = useQuery({
    queryKey: ["admin-events-any-status"],
    queryFn: () => listRows<Parameters<typeof eventFromRow>[0]>("site_events"),
    enabled: on,
    staleTime: FIVE_MIN,
    retry: false,
  });
  if (!on) return { event: undefined, loading: false };
  const found = (q.data ?? []).map(eventFromRow).find((e) => e.slug === slug);
  // shortZone for the same reason useEvents applies it: one event must not read
  // "EDT" on its own page and "ET" in the listing.
  return { event: found ? { ...found, time: shortZone(found.time) } : undefined, loading: q.isLoading };
}

export function usePosts(): { posts: BlogPost[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["site-blog-posts"],
    queryFn: fetchPosts,
    enabled: isSupabaseConfigured,
    staleTime: FIVE_MIN,
  });
  const base = isSupabaseConfigured ? mergePosts(q.data ?? []) : BLOG_POSTS;
  // Drop hidden posts everywhere — listings, related, and direct-URL detail
  // (usePost derives from this), so a hidden slug 404s.
  const posts = base.filter((p) => !p.hidden);
  return { posts, loading: isSupabaseConfigured ? q.isLoading : false };
}

export function usePost(slug: string | undefined): { post: BlogPost | undefined; loading: boolean } {
  const { posts, loading } = usePosts();
  return { post: slug ? posts.find((p) => p.slug === slug) : undefined, loading };
}

export function usePostedJobs(): { jobs: Job[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["site-jobs"],
    queryFn: fetchJobs,
    enabled: isSupabaseConfigured,
    staleTime: FIVE_MIN,
  });
  if (!isSupabaseConfigured) return { jobs: [], loading: false };
  return { jobs: q.data ?? [], loading: q.isLoading };
}

export function useGallery(): { photos: GalleryPhoto[]; videos: GalleryVideo[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["site-gallery"],
    queryFn: fetchGallery,
    enabled: isSupabaseConfigured,
    staleTime: FIVE_MIN,
  });
  if (!isSupabaseConfigured) return { photos: GALLERY_PHOTOS, videos: GALLERY_VIDEOS, loading: false };
  const d = q.data ?? { photos: [], videos: [] };
  // Submitted media first, then the curated seed.
  return {
    photos: [...d.photos, ...GALLERY_PHOTOS],
    videos: [...d.videos, ...GALLERY_VIDEOS],
    loading: q.isLoading,
  };
}
