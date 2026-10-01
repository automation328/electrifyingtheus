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

import { useEffect, useRef, useState } from "react";
import { Presentation, Maximize2, ExternalLink, ArrowUpRight } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import SeoHead from "@/components/SeoHead";
import { Button } from "@/components/ui/button";

/** The published deck. Swap this one line when a new edition goes up. */
const DECK_URL = "https://online.fliphtml5.com/msoig/Electrifying-The-US-General-Slides/";
const DECK_TITLE = "Electrifying the US updates";
/** The deck's own first page, which FlipHTML5 publishes beside it. */
const DECK_COVER = `${DECK_URL}files/shot.jpg`;
const DECK_PAGES = 32;

/**
 * Where the embed stops being worth having.
 *
 * Below this the viewer cannot win: give it a landscape frame and its own
 * title bar, paging arrows, scrubber and button row — which it stacks INSIDE
 * the frame on a phone — leave a sliver of slide; give it the height to fit
 * that chrome and the page area turns portrait, whereupon it rotates a
 * landscape slide onto its side. Both were tried on a real phone. So a phone
 * gets the cover and a way in, and the viewer gets the whole screen when it
 * opens, where it works properly and the phone can be turned.
 */
const EMBED_FROM = "(min-width: 640px)";

const Slides = () => {
  const frameWrap = useRef<HTMLDivElement>(null);
  const [canEmbed, setCanEmbed] = useState(
    () => typeof window === "undefined" || window.matchMedia(EMBED_FROM).matches,
  );

  // Tracked rather than read once: a tablet rotating from portrait to landscape
  // crosses this line, and so does a desktop window being dragged narrow.
  useEffect(() => {
    const mq = window.matchMedia(EMBED_FROM);
    const sync = () => setCanEmbed(mq.matches);
    sync();
    mq.addEventListener("change", sync);
    return () => mq.removeEventListener("change", sync);
  }, []);
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
        title="Electrifying the US updates"
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
                Electrifying the US updates
              </h1>
              <p className="text-muted-foreground mt-2 max-w-2xl">
                The current edition of our deck, in full — {DECK_PAGES} pages.
                {canEmbed
                  ? " Turn the pages below, or open it in its own window to read it full screen."
                  : " It opens full screen, where the pages are big enough to read — turn your phone sideways for the best of it."}
              </p>
            </div>

            <div className="flex shrink-0 items-center gap-2">
              {canEmbed && (
                <Button variant="outline" className="rounded-xl" onClick={goFullscreen}>
                  <Maximize2 className="mr-1.5 h-4 w-4" aria-hidden />
                  Full screen
                </Button>
              )}
              <Button asChild variant="outline" className="rounded-xl">
                <a href={DECK_URL} target="_blank" rel="noopener noreferrer">
                  Open in a new tab
                  <ExternalLink className="ml-1.5 h-4 w-4" aria-hidden />
                </a>
              </Button>
            </div>
          </div>

          {canEmbed ? (
            /* The frame stays landscape, which is what stops the viewer rotating
               a landscape slide to fill a taller box. From sm it draws its
               controls over the page rather than stacking them above and below,
               so the ratio is all the sizing it needs. */
            <div
              ref={frameWrap}
              className="relative mt-6 aspect-[4/3] w-full overflow-hidden rounded-2xl border border-border bg-muted lg:aspect-[16/10]"
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
          ) : (
            /* A phone opens the deck instead of containing it: the cover, the
               page count, and one tap into the viewer with the whole screen to
               itself — where it reads properly and the phone can be turned. */
            <a
              href={DECK_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="group mt-6 block overflow-hidden rounded-2xl border border-border bg-card shadow-sm transition-shadow hover:shadow-md"
            >
              <img
                src={DECK_COVER}
                alt={`Cover of ${DECK_TITLE}`}
                className="aspect-[16/9] w-full object-cover"
                loading="lazy"
              />
              <span className="flex items-center justify-between gap-3 px-4 py-3.5">
                <span className="min-w-0">
                  <span className="block font-semibold text-foreground">Open the deck</span>
                  <span className="block text-xs text-muted-foreground">
                    {DECK_PAGES} pages · opens full screen
                  </span>
                </span>
                <ArrowUpRight className="h-5 w-5 shrink-0 text-primary transition-transform group-hover:translate-x-0.5 group-hover:-translate-y-0.5" aria-hidden />
              </span>
            </a>
          )}

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
