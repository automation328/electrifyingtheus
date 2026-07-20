// "Americans are excited about Electrifying The US" — a static 4-up grid of
// alternating PHOTOS and VIDEOS pulled from the Media / Gallery (Supabase-backed,
// with the curated seed as fallback). Video cards open in a lightbox (YouTube id
// or self-hosted file); photo cards open the image. Below the grid, a
// "View More photos and videos" button links to the gallery.

import { useState, useMemo, useRef } from "react";
import { Link } from "react-router-dom";
import { Play, Image as ImageIcon, ArrowRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useGallery } from "@/hooks/use-content";
import LogoWatermark from "@/components/LogoWatermark";
import { toast } from "sonner";
// Fixed feature images + a poster for the video fallback.
import etu09 from "@/assets/gallery/etu-09.jpg";
import evShowcase from "@/assets/gallery/media-ev-showcase.jpg";
import transitBus from "@/assets/electric-transit-bus.jpg";

interface MediaItem {
  type: "video" | "photo";
  name: string;
  role: string;
  poster: string;
  youtubeId?: string;
  src?: string;
  /** When set, the card links to this route instead of opening the lightbox —
   *  for videos that live on their own page (e.g. the webinar replay). */
  href?: string;
}

// Square media card. Self-hosted videos preview on hover with sound, and pause +
// reset (and re-mute) on leave; click opens the lightbox with sound.
const MediaCard = ({ m, onOpen }: { m: MediaItem; onOpen: (m: MediaItem) => void }) => {
  const vidRef = useRef<HTMLVideoElement>(null);
  const isFileVideo = m.type === "video" && !!m.src;

  const onEnter = () => {
    const v = vidRef.current;
    if (!v) return;
    v.muted = false;
    v.play().catch(() => {
      // Some browsers block audible autoplay until the user interacts with the
      // page — fall back to a muted preview so the clip still plays on hover.
      v.muted = true;
      v.play().catch(() => {});
    });
  };
  const onLeave = () => {
    const v = vidRef.current;
    if (v) { v.pause(); v.currentTime = 0; v.muted = true; }
  };

  const inner = (
    <div className="relative aspect-square bg-muted">
      {isFileVideo ? (
        <video
          ref={vidRef}
          src={m.src}
          poster={m.poster}
          muted
          loop
          playsInline
          preload="none"
          className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
        />
      ) : (
        <img src={m.poster} alt={m.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
      )}
      <span className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-foreground/10 to-transparent" aria-hidden />
      <span className="absolute inset-0 grid place-items-center transition-opacity group-hover:opacity-0">
        <span className="grid place-items-center w-14 h-14 rounded-full bg-white/90 text-primary shadow-lg">
          {m.type === "video"
            ? <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
            : <ImageIcon className="w-6 h-6" />}
        </span>
      </span>
      <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-foreground text-[10px] font-bold shadow">
        {m.type === "video" ? "▶ Video" : "▣ Photo"}
      </span>
      {m.type === "photo" && <LogoWatermark className="bottom-9 right-2 w-[22%] max-w-[84px]" />}
      <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
        <div className="font-bold font-display leading-tight text-sm line-clamp-1">{m.name}</div>
        <div className="text-[11px] text-white/85">{m.role} · ElectrifyingTheUS.com</div>
      </div>
    </div>
  );

  const cardCls =
    "group relative w-full rounded-2xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-0.5 transition-all text-left";

  // Video that has its own page (e.g. the webinar replay) → route there instead
  // of opening the lightbox.
  if (m.href) {
    return (
      <Link
        to={m.href}
        aria-label={`Watch: ${m.name}`}
        className={`block ${cardCls} focus:outline-none focus-visible:ring-2 focus-visible:ring-primary`}
      >
        {inner}
      </Link>
    );
  }

  return (
    <button
      type="button"
      onClick={() => onOpen(m)}
      onMouseEnter={isFileVideo ? onEnter : undefined}
      onMouseLeave={isFileVideo ? onLeave : undefined}
      className={cardCls}
    >
      {inner}
    </button>
  );
};

const VideoTestimonialsSection = () => {
  const { videos } = useGallery();
  const [active, setActive] = useState<MediaItem | null>(null);

  // Fixed 4-item rail, alternating photo / video: etu-09 → video → etu-51 →
  // video. Videos come from the gallery; a missing video still renders a poster
  // card that prompts "coming soon" on click.
  const media = useMemo<MediaItem[]>(() => {
    const toVideo = (i: number): MediaItem => {
      const v = videos[i];
      if (v) {
        return {
          type: "video",
          name: v.title || "Electrifying The US",
          role: "Video",
          poster: v.provider === "youtube" && v.id
            ? `https://img.youtube.com/vi/${v.id}/hqdefault.jpg`
            : (v.poster || transitBus),
          youtubeId: v.provider === "youtube" ? v.id : undefined,
          src: v.provider === "file" ? v.src : undefined,
          href: v.href,
        };
      }
      return { type: "video", name: "Electrifying The US", role: "Video", poster: transitBus };
    };
    const toPhoto = (src: string): MediaItem => ({
      type: "photo", name: "Electrifying the US", role: "Photo", poster: src,
    });
    return [toPhoto(etu09), toVideo(0), toPhoto(evShowcase), toVideo(1)];
  }, [videos]);

  const open = (m: MediaItem) => {
    if (m.type === "photo") { setActive(m); return; }
    if (m.youtubeId || m.src) setActive(m);
    else toast("Video coming soon", { description: "This testimonial will be added shortly." });
  };

  return (
    <section className="pt-14 md:pt-20 pb-10 md:pb-14 bg-background">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
          Americans are excited about{" "}
          <span className="text-gradient-primary">Electrifying The US</span>
        </h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
          Real drivers, advocates, and leaders on why they're going electric — and what the
          switch means for their communities.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {media.map((m, i) => (
            <MediaCard key={`${m.name}-${i}`} m={m} onOpen={open} />
          ))}
        </div>

        {/* View more */}
        <div className="mt-8 flex justify-center">
          <Link
            to="/gallery"
            className="inline-flex items-center gap-2 rounded-full gradient-primary text-primary-foreground font-semibold text-sm px-6 py-3 shadow-card hover:opacity-90 transition"
          >
            View More photos and videos <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </div>

      {/* Lightbox — video (YouTube/mp4) or photo */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-0 rounded-2xl">
          {active?.type === "photo" ? (
            <img src={active.poster} alt={active.name} className="w-full h-auto max-h-[80vh] object-contain" />
          ) : (
            <div className="aspect-video w-full">
              {active?.youtubeId ? (
                <iframe
                  className="w-full h-full"
                  src={`https://www.youtube.com/embed/${active.youtubeId}?autoplay=1&rel=0`}
                  title={active.name}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : active?.src ? (
                <video className="w-full h-full object-contain bg-black" src={active.src} controls autoPlay playsInline />
              ) : null}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default VideoTestimonialsSection;
