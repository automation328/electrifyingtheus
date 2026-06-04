import { useState } from "react";
import { Play } from "lucide-react";

// Lazy "facade" video embed — shows a poster + play button and only loads the
// player (iframe or <video> bytes) on click. Keeps the page fast.
//
// Three sources:
//   provider "youtube" / "vimeo"  → embed by id (no third-party JS until play)
//   provider "file"               → self-hosted MP4/WebM via native <video>,
//                                    `src` is the file URL (e.g. Supabase Storage).
// Self-hosted hosts should support HTTP range requests so seeking works
// (Supabase Storage, Cloudflare R2, Bunny, etc. all do).

export type VideoProvider = "youtube" | "vimeo" | "file";

interface VideoEmbedProps {
  title: string;
  provider?: VideoProvider;
  /** YouTube/Vimeo video id (for provider youtube|vimeo). */
  id?: string;
  /** File URL for self-hosted video (provider "file"). */
  src?: string;
  /** Optional captions track (.vtt) for self-hosted video. */
  captions?: string;
  /** Poster image — auto for YouTube; required for Vimeo/file to show a thumbnail. */
  poster?: string;
  className?: string;
}

const embedSrc = (provider: VideoProvider, id: string) =>
  provider === "youtube"
    ? `https://www.youtube-nocookie.com/embed/${id}?autoplay=1&rel=0`
    : `https://player.vimeo.com/video/${id}?autoplay=1`;

const VideoEmbed = ({ title, provider = "youtube", id, src, captions, poster, className = "" }: VideoEmbedProps) => {
  const [playing, setPlaying] = useState(false);
  const isFile = provider === "file";
  const img = poster ?? (provider === "youtube" && id ? `https://i.ytimg.com/vi/${id}/hqdefault.jpg` : "");

  return (
    <div className={`relative aspect-video overflow-hidden rounded-2xl bg-muted ring-1 ring-border ${className}`}>
      {playing ? (
        isFile ? (
          <video
            src={src}
            poster={poster}
            controls
            autoPlay
            playsInline
            preload="metadata"
            className="absolute inset-0 h-full w-full bg-black object-contain"
          >
            {captions && <track kind="captions" src={captions} srcLang="en" label="English" default />}
          </video>
        ) : (
          <iframe
            src={embedSrc(provider, id ?? "")}
            title={title}
            className="absolute inset-0 h-full w-full"
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
            allowFullScreen
            loading="lazy"
          />
        )
      ) : (
        <button
          type="button"
          onClick={() => setPlaying(true)}
          aria-label={`Play video: ${title}`}
          className="group absolute inset-0 h-full w-full"
        >
          {img ? (
            <img src={img} alt={title} loading="lazy" className="absolute inset-0 h-full w-full object-cover" />
          ) : (
            <span aria-hidden className="absolute inset-0 gradient-hero" />
          )}
          <span aria-hidden className="absolute inset-0 bg-foreground/30 transition-colors group-hover:bg-foreground/40" />
          <span className="absolute inset-0 grid place-items-center">
            <span className="grid h-16 w-16 place-items-center rounded-full bg-white/90 text-primary shadow-elevated transition-transform group-hover:scale-110">
              <Play className="ml-0.5 h-7 w-7" fill="currentColor" />
            </span>
          </span>
          <span className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-foreground/70 to-transparent p-4 text-left text-sm font-semibold text-white">
            {title}
          </span>
        </button>
      )}
    </div>
  );
};

export default VideoEmbed;
