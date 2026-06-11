import { useEffect, useState } from "react";
import { Images, Film, ChevronLeft, ChevronRight, Camera } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import VideoEmbed from "@/components/VideoEmbed";
import ShareGate from "@/components/forms/ShareGate";
import { Dialog, DialogContent } from "@/components/ui/dialog";
import { useGallery } from "@/hooks/use-content";

type Tab = "all" | "photos" | "videos";

const TABS: { key: Tab; label: string; icon: typeof Images }[] = [
  { key: "all", label: "All", icon: Camera },
  { key: "photos", label: "Photos", icon: Images },
  { key: "videos", label: "Videos", icon: Film },
];

const Gallery = () => {
  const [tab, setTab] = useState<Tab>("all");
  const [lightbox, setLightbox] = useState<number | null>(null);
  const { photos, videos } = useGallery();
  const n = photos.length;

  // Keyboard navigation while the lightbox is open (Esc handled by the Dialog).
  useEffect(() => {
    if (lightbox === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowLeft") setLightbox((i) => (i === null ? i : (i - 1 + n) % n));
      if (e.key === "ArrowRight") setLightbox((i) => (i === null ? i : (i + 1) % n));
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [lightbox, n]);

  const showPhotos = tab === "all" || tab === "photos";
  const showVideos = tab === "all" || tab === "videos";
  const current = lightbox === null ? null : photos[lightbox];

  return (
    <div className="min-h-screen flex flex-col bg-background">
      <Navbar />
      <main className="flex-1 pt-28 pb-16">
        {/* Header */}
        <section className="relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-secondary/5 to-transparent" aria-hidden />
          <div className="container relative z-10 px-4 max-w-5xl">
            <div className="text-center max-w-2xl mx-auto">
              <span className="inline-flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-secondary/10 text-secondary text-sm font-semibold mb-4 animate-fade-up">
                <Camera className="w-3.5 h-3.5" /> Gallery
              </span>
              <h1 className="text-4xl md:text-6xl font-bold font-display text-foreground mb-4 animate-fade-up" style={{ animationDelay: "0.08s" }}>
                Moments in <span className="text-gradient-primary">Motion</span>
              </h1>
              <p className="text-muted-foreground text-lg animate-fade-up" style={{ animationDelay: "0.16s" }}>
                Photos and videos from our ride &amp; drives, webinars, expos, and community events across the country.
              </p>
            </div>

            {/* Filter tabs */}
            <div className="flex justify-center gap-2 mt-8 animate-fade-up" style={{ animationDelay: "0.24s" }}>
              {TABS.map((t) => (
                <button
                  key={t.key}
                  type="button"
                  onClick={() => setTab(t.key)}
                  className={`inline-flex items-center gap-2 rounded-full px-5 py-2.5 text-sm font-semibold transition-colors ${
                    tab === t.key
                      ? "gradient-primary text-primary-foreground shadow-card"
                      : "bg-card border border-border text-foreground hover:border-primary/40 hover:text-primary"
                  }`}
                >
                  <t.icon className="w-4 h-4" /> {t.label}
                </button>
              ))}
            </div>
          </div>
        </section>

        {/* Videos */}
        {showVideos && videos.length > 0 && (
          <div className="container px-4 max-w-6xl mt-12">
            <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-5 flex items-center gap-2">
              <Film className="w-5 h-5 text-primary" /> Videos
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-5">
              {videos.map((v) => (
                <figure key={v.id ?? v.src ?? v.title} className="space-y-2">
                  <VideoEmbed
                    title={v.title}
                    provider={v.provider}
                    id={v.id}
                    src={v.src}
                    captions={v.captions}
                    poster={v.poster}
                  />
                  <figcaption className="text-sm text-muted-foreground px-1">{v.title}</figcaption>
                </figure>
              ))}
            </div>
          </div>
        )}

        {/* Photos — masonry */}
        {showPhotos && (
          <div className="container px-4 max-w-6xl mt-12">
            <h2 className="text-xl md:text-2xl font-bold font-display text-foreground mb-5 flex items-center gap-2">
              <Images className="w-5 h-5 text-primary" /> Photos
            </h2>
            <div className="gap-4 columns-2 sm:columns-3 lg:columns-4 [&>*]:mb-4">
              {photos.map((p, i) => (
                <div key={p.src} className="group relative break-inside-avoid overflow-hidden rounded-2xl ring-1 ring-border">
                  <button
                    type="button"
                    onClick={() => setLightbox(i)}
                    className="block w-full focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                    aria-label={`Open photo: ${p.alt}`}
                  >
                    <span className="relative block">
                      <img
                        src={p.src}
                        alt={p.alt}
                        loading="lazy"
                        className="w-full h-auto object-cover transition-transform duration-500 group-hover:scale-[1.04]"
                      />
                      {p.caption && (
                        <span className="absolute inset-x-0 bottom-0 translate-y-2 bg-gradient-to-t from-foreground/75 to-transparent p-3 text-left text-xs font-medium text-white opacity-0 transition-all group-hover:translate-y-0 group-hover:opacity-100">
                          {p.caption}
                        </span>
                      )}
                    </span>
                  </button>
                  {/* Per-photo share — gates first name + email, then social / email / SMS */}
                  <div className="absolute right-2 top-2 opacity-0 transition-opacity group-hover:opacity-100 focus-within:opacity-100">
                    <ShareGate
                      url="/gallery"
                      title={p.caption || p.alt || "Photo from Electrifying the US"}
                      summary={p.alt}
                      description={p.caption || p.alt}
                      image={p.src}
                      formType="photo-share"
                      variant="icon"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Lightbox */}
        <Dialog open={lightbox !== null} onOpenChange={(o) => !o && setLightbox(null)}>
          <DialogContent className="max-w-5xl border-0 bg-background/95 p-2 sm:p-3">
            {current && (
              <div className="relative">
                <img
                  src={current.src}
                  alt={current.alt}
                  className="mx-auto max-h-[80vh] w-full rounded-xl object-contain"
                />
                {/* Share button — below the image, gates first name + email then
                    offers social / email / SMS / more. */}
                <div className="mt-3 flex flex-col items-center gap-2">
                  <ShareGate
                    url="/gallery"
                    title={current.caption || current.alt || "Photo from Electrifying the US"}
                    summary={current.alt}
                    description={current.caption || current.alt}
                    image={current.src}
                    formType="photo-share"
                    variant="label"
                    label="Share this photo"
                    className="inline-flex items-center gap-1.5 rounded-full gradient-green text-primary-foreground px-5 py-2.5 text-sm font-semibold shadow-card hover:opacity-90 transition-opacity"
                  />
                  {current.caption && (
                    <p className="text-center text-sm text-muted-foreground">
                      {current.caption} · {lightbox! + 1} / {n}
                    </p>
                  )}
                </div>

                {n > 1 && (
                  <>
                    <button
                      type="button"
                      onClick={() => setLightbox((i) => (i === null ? i : (i - 1 + n) % n))}
                      aria-label="Previous photo"
                      className="absolute left-2 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-foreground shadow-elevated hover:text-primary transition"
                    >
                      <ChevronLeft className="h-5 w-5" />
                    </button>
                    <button
                      type="button"
                      onClick={() => setLightbox((i) => (i === null ? i : (i + 1) % n))}
                      aria-label="Next photo"
                      className="absolute right-2 top-1/2 -translate-y-1/2 grid h-11 w-11 place-items-center rounded-full bg-white/90 text-foreground shadow-elevated hover:text-primary transition"
                    >
                      <ChevronRight className="h-5 w-5" />
                    </button>
                  </>
                )}
              </div>
            )}
          </DialogContent>
        </Dialog>
      </main>
      <Footer />
    </div>
  );
};

export default Gallery;
