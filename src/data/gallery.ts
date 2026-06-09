// Media gallery data. Photos are real, watermarked event photos bundled under
// src/assets/gallery (auto-imported below — drop more etu-*.jpg files there and
// they appear automatically). Videos embed from YouTube/Vimeo or a self-hosted
// (e.g. Supabase Storage) URL.

import type { VideoProvider } from "@/components/VideoEmbed";

export interface GalleryPhoto {
  src: string;
  alt: string;
  caption?: string;
}

export interface GalleryVideo {
  title: string;
  provider?: VideoProvider;
  /** YouTube/Vimeo id (for provider youtube|vimeo). */
  id?: string;
  /** File URL for self-hosted video (provider "file"), e.g. a Supabase Storage URL. */
  src?: string;
  /** Optional .vtt captions for self-hosted video. */
  captions?: string;
  /** Poster — auto for YouTube; required for Vimeo/self-hosted. */
  poster?: string;
}

// Eager-import every watermarked photo in src/assets/gallery as a URL string.
// Sorted by filename (etu-01, etu-02, …) so order is stable.
const photoModules = import.meta.glob("../assets/gallery/*.jpg", {
  eager: true,
  import: "default",
}) as Record<string, string>;

export const GALLERY_PHOTOS: GalleryPhoto[] = Object.keys(photoModules)
  .sort()
  .map((path) => ({
    src: photoModules[path],
    alt: "Electrifying the US community event",
    caption: "Electrifying the US",
  }));

export const GALLERY_VIDEOS: GalleryVideo[] = [
  // YouTube/Vimeo — replace sample IDs with your real recap videos.
  { id: "aqz-KE-bpKQ", title: "Event recap (sample — replace)", provider: "youtube" },
  { id: "dQw4w9WgXcQ", title: "How EVs save thousands (sample — replace)", provider: "youtube" },

  // Self-hosted example — upload an MP4 to a Supabase Storage public bucket and
  // paste its URL + a poster image. Uncomment to use:
  // {
  //   provider: "file",
  //   title: "Ride & Drive — Atlanta recap",
  //   src: "https://<ref>.supabase.co/storage/v1/object/public/gallery/atlanta-recap.mp4",
  //   poster: GALLERY_PHOTOS[0]?.src,
  // },
];
