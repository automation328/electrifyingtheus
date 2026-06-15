// "Americans are excited about the Electrifying The US" — a horizontal row of
// short testimonial / interview videos (styled after the Electrifying Virginia
// reference). Data-driven: drop real videos into VIDEOS below. Each card shows a
// poster + play button; clicking opens the video in a lightbox. A video with a
// `youtubeId` plays inline; one with a `src` (mp4) plays the file; entries with
// neither show a "coming soon" state so the section still renders during setup.

import { useState } from "react";
import { Play, ChevronLeft, ChevronRight } from "lucide-react";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { toast } from "sonner";
// Placeholder posters — swap for real video thumbnails.
import poster1 from "@/assets/workforce.jpg";
import poster2 from "@/assets/ev-family.jpg";
import poster3 from "@/assets/rideshare-fleet.jpg";
import poster4 from "@/assets/ev-charging.jpg";

interface VideoItem {
  name: string;
  role: string;
  poster: string;
  /** YouTube video id (preferred) … */
  youtubeId?: string;
  /** … or a direct mp4/webm URL. */
  src?: string;
}

// TODO: replace these placeholders with the real testimonial videos.
const VIDEOS: VideoItem[] = [
  { name: "Community Leader", role: "Electrifying The US", poster: poster1 },
  { name: "EV Owner", role: "Electrifying The US", poster: poster2 },
  { name: "Fleet Operator", role: "Electrifying The US", poster: poster3 },
  { name: "Charging Advocate", role: "Electrifying The US", poster: poster4 },
];

const VideoTestimonialsSection = () => {
  const [active, setActive] = useState<VideoItem | null>(null);

  const open = (v: VideoItem) => {
    if (v.youtubeId || v.src) setActive(v);
    else toast("Video coming soon", { description: "This testimonial will be added shortly." });
  };

  // Horizontal scroll controls.
  const scroll = (dir: -1 | 1) => {
    const el = document.getElementById("vid-rail");
    if (el) el.scrollBy({ left: dir * Math.min(el.clientWidth * 0.8, 600), behavior: "smooth" });
  };

  return (
    <section className="pt-14 md:pt-20 pb-6 md:pb-8 bg-background">
      <div className="container">
        <h2 className="text-center text-3xl md:text-4xl font-bold font-display text-foreground mb-3">
          Americans are excited about{" "}
          <span className="text-gradient-primary">Electrifying The US</span>
        </h2>
        <p className="text-center text-muted-foreground max-w-2xl mx-auto mb-10">
          Real drivers, advocates, and leaders on why they're going electric — and what the
          switch means for their communities.
        </p>

        <div className="relative">
          {/* Arrows (desktop) */}
          <button
            type="button" onClick={() => scroll(-1)} aria-label="Previous videos"
            className="hidden md:grid absolute -left-4 top-1/2 -translate-y-1/2 z-10 place-items-center w-11 h-11 rounded-full bg-white text-foreground shadow-elevated border border-border hover:text-primary hover:scale-105 transition"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
          <button
            type="button" onClick={() => scroll(1)} aria-label="Next videos"
            className="hidden md:grid absolute -right-4 top-1/2 -translate-y-1/2 z-10 place-items-center w-11 h-11 rounded-full bg-white text-foreground shadow-elevated border border-border hover:text-primary hover:scale-105 transition"
          >
            <ChevronRight className="w-5 h-5" />
          </button>

          <div
            id="vid-rail"
            className="flex gap-5 overflow-x-auto pb-3 snap-x snap-mandatory scroll-smooth [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden"
          >
            {VIDEOS.map((v, i) => (
              <button
                key={`${v.name}-${i}`}
                type="button"
                onClick={() => open(v)}
                className="group relative shrink-0 w-[260px] sm:w-[300px] snap-start rounded-2xl overflow-hidden shadow-card hover:shadow-xl hover:-translate-y-0.5 transition-all text-left"
              >
                <div className="relative aspect-video bg-muted">
                  <img src={v.poster} alt={v.name} loading="lazy" className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105" />
                  <span className="absolute inset-0 bg-gradient-to-t from-foreground/65 via-foreground/10 to-transparent" aria-hidden />
                  {/* Play button */}
                  <span className="absolute inset-0 grid place-items-center">
                    <span className="grid place-items-center w-14 h-14 rounded-full bg-white/90 text-primary shadow-lg group-hover:bg-white group-hover:scale-110 transition">
                      <Play className="w-6 h-6 ml-0.5" fill="currentColor" />
                    </span>
                  </span>
                  {/* Brand chip */}
                  <span className="absolute top-2.5 right-2.5 inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-white/90 text-foreground text-[10px] font-bold shadow">
                    ⚡ Electrifying The US
                  </span>
                  {/* Caption */}
                  <div className="absolute bottom-0 left-0 right-0 p-3 text-white">
                    <div className="font-bold font-display leading-tight text-sm">{v.name}</div>
                    <div className="text-[11px] text-white/85">{v.role} · ElectrifyingTheUS.com</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Lightbox */}
      <Dialog open={!!active} onOpenChange={(o) => !o && setActive(null)}>
        <DialogContent className="sm:max-w-3xl p-0 overflow-hidden bg-black border-0 rounded-2xl">
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
              <video className="w-full h-full" src={active.src} controls autoPlay />
            ) : null}
          </div>
        </DialogContent>
      </Dialog>
    </section>
  );
};

export default VideoTestimonialsSection;
