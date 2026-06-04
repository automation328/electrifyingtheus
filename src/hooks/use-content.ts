// React Query hooks that surface merged (dynamic + static) Events and Blog
// posts. They return the static content immediately, then merge in any
// Supabase-backed rows once fetched. With Supabase unconfigured they are a
// no-op wrapper over the curated static arrays.

import { useQuery } from "@tanstack/react-query";
import { isSupabaseConfigured } from "@/lib/supabase";
import { fetchEvents, fetchPosts, fetchGallery, mergeEvents, mergePosts } from "@/lib/content";
import { EVENTS, type EventItem } from "@/data/events";
import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";
import { GALLERY_PHOTOS, GALLERY_VIDEOS, type GalleryPhoto, type GalleryVideo } from "@/data/gallery";

const FIVE_MIN = 5 * 60 * 1000;

export function useEvents(): { events: EventItem[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["site-events"],
    queryFn: fetchEvents,
    enabled: isSupabaseConfigured,
    staleTime: FIVE_MIN,
  });
  if (!isSupabaseConfigured) return { events: EVENTS, loading: false };
  return { events: mergeEvents(q.data ?? []), loading: q.isLoading };
}

export function usePosts(): { posts: BlogPost[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["site-blog-posts"],
    queryFn: fetchPosts,
    enabled: isSupabaseConfigured,
    staleTime: FIVE_MIN,
  });
  if (!isSupabaseConfigured) return { posts: BLOG_POSTS, loading: false };
  return { posts: mergePosts(q.data ?? []), loading: q.isLoading };
}

export function usePost(slug: string | undefined): { post: BlogPost | undefined; loading: boolean } {
  const { posts, loading } = usePosts();
  return { post: slug ? posts.find((p) => p.slug === slug) : undefined, loading };
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
