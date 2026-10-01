// The general slide deck, embedded from FlipHTML5 and routed at /slides.
//
// The deck is published on FlipHTML5 and stays there: they host the page-turn
// viewer, the search, the thumbnails and the mobile layout, and the link in
// this file is the only thing that has to change when a new edition is
// published. Nothing is copied into this repo, so the deck can never be a
// stale duplicate of itself.
//
// Framing it needs online.fliphtml5.com in the CSP's frame-src (vercel.json —
// see docs/security-headers.md, which is explicit that adding an embed provider
// means adding its host). The viewer sets no X-Frame-Options and no
// frame-ancestors of its own, so it frames cleanly.

import { useRef, useState } from "react";
import { Presentation, Maximize2, ExternalLink } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { Button } from "@/components/ui/button";

/** The published deck. Swap this one line when a new edition goes up. */
const DECK_URL = "https://online.fliphtml5.com/msoig/Electrifying-The-US-General-Slides/";
const DECK_TITLE = "Electrifying the US — general slides";

const Slides = () => {
  const frameWrap = useRef<HTMLDivElement>(null);
  // A deck that never arrives looks identical to a deck that is slow. The
  // placeholder says which, and leaves the "open it directly" escape visible.
  const [loaded, setLoaded] = useState(false);

  const goFullscreen = () => {
    const el = frameWrap.current;
    if (!el) return;
    // Safari still ships the webkit-prefixed name only.
    const request = el.requestFullscreen
      ?? (el as unknown as { webkitRequestFullscreen?: () => Promise<void> }).webkitRequestFullscreen;
    void request?.call(el);
  };

  return (
    <div className="min-h-screen flex flex-col">
      <SeoHead
        title="Slides | Electrifying the US"
        description="Our general presentation on electric vehicles and e-mobility in the United States — the case for electrifying, what it costs, and where the charging is."
      />
      <Navbar />

      <main className="flex-1 pt-24 pb-16">
        <div className="container px-4 max-w-6xl">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
            <div>
              <span className="inline-flex items-center gap-2 rounded-full bg-primary/10 px-4 py-1.5 text-sm font-semibold text-primary">
                <Presentation className="h-4 w-4" aria-hidden />
                Presentation
              </span>
              <h1 className="font-charge text-3xl md:text-4xl text-foreground mt-4">
                Electrifying the US — the slides
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                Our general deck, in full. Turn the pages below, or open it in its own
                window if you would rather read it full screen.
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              <Button variant="outline" className="rounded-xl" onClick={goFullscreen}>
                <Maximize2 className="mr-1.5 h-4 w-4" aria-hidden />
                Full screen
              </Button>
              <Button asChild variant="outline" className="rounded-xl">
                <a href={DECK_URL} target="_blank" rel="noopener noreferrer">
                  Open in a new tab
                  <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden />
                </a>
              </Button>
            </div>
          </div>

          {/* Taller than wide on a phone, because the viewer shows one page at a
              time there; widescreen from the breakpoint where it shows a spread. */}
          <div
            ref={frameWrap}
            className="relative mt-6 aspect-[3/4] w-full overflow-hidden rounded-2xl border border-border bg-muted sm:aspect-[4/3] lg:aspect-[16/10]"
          >
            {!loaded && (
              <div className="absolute inset-0 grid place-items-center px-6 text-center">
                <div>
                  <Presentation className="mx-auto mb-3 h-8 w-8 text-muted-foreground" aria-hidden />
                  <p className="text-sm text-muted-foreground">Loading the deck…</p>
                </div>
              </div>
            )}
            <iframe
              src={DECK_URL}
              title={DECK_TITLE}
              className="absolute inset-0 h-full w-full"
              allowFullScreen
              loading="lazy"
              referrerPolicy="no-referrer-when-downgrade"
              onLoad={() => setLoaded(true)}
            />
          </div>

          <p className="mt-3 text-xs text-muted-foreground">
            The deck is hosted on FlipHTML5. If your network blocks embedded content,
            {" "}
            <a
              href={DECK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary hover:underline"
            >
              open it directly
            </a>
            .
          </p>
        </div>
      </main>

      <Footer />
    </div>
  );
};

export default Slides;
