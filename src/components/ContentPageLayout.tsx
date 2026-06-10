import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ExternalLink, Play, Calculator, type LucideIcon } from "lucide-react";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";

export interface ContentStat {
  value: string;
  label: string;
}

export interface ContentSection {
  heading: string;
  body: string[];
  list?: string[];
}

export interface ContentSource {
  label: string;
  url: string;
}

export interface ContentShot {
  src: string;
  caption: string;
}

export interface ContentVideo {
  youtubeId: string;
  title: string;
}

interface ContentPageLayoutProps {
  badge: string;
  title: string;
  highlight: string;
  intro: string;
  heroImage: string;
  icon: LucideIcon;
  stats?: ContentStat[];
  sections: ContentSection[];
  sources: ContentSource[];
  kicker?: string;
  pullQuote?: string;
  gallery?: ContentShot[];
  video?: ContentVideo;
  /** Optional CTA button shown directly under the stats row. */
  statsCta?: { label: string; to: string };
}

const ContentPageLayout = ({
  badge, title, highlight, intro, heroImage, icon: Icon,
  stats, sections, sources, kicker, pullQuote, gallery, video, statsCta,
}: ContentPageLayoutProps) => {
  const [playing, setPlaying] = useState(false);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, []);

  // Scroll-reveal: rise elements into view as they enter the viewport.
  useEffect(() => {
    const els = Array.from(document.querySelectorAll<HTMLElement>(".brief-reveal"));
    if (!("IntersectionObserver" in window) || els.length === 0) {
      els.forEach((el) => el.classList.add("is-in"));
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((e) => {
          if (e.isIntersecting) {
            e.target.classList.add("is-in");
            io.unobserve(e.target);
          }
        });
      },
      { threshold: 0.16, rootMargin: "0px 0px -8% 0px" },
    );
    els.forEach((el) => io.observe(el));
    return () => io.disconnect();
  }, [sections, gallery, video, stats]);

  const readMinutes = Math.max(
    2,
    Math.round(sections.reduce((n, s) => n + s.body.join(" ").split(/\s+/).length, 0) / 200),
  );

  return (
    <div className="brief min-h-screen flex flex-col bg-background">
      <div className="brief-atmos" aria-hidden />
      <Navbar />

      <main className="brief-grain flex-1 relative z-10">
        {/* ── Cinematic hero ─────────────────────────────────────────── */}
        <header className="relative min-h-[78vh] flex items-end overflow-hidden">
          <img
            src={heroImage}
            alt={title}
            className="brief-hero-img absolute inset-0 w-full h-full object-cover"
          />
          <div className="brief-hero-grade absolute inset-0" aria-hidden />

          <div className="container relative z-10 px-4 pb-14 md:pb-20">
            <div className="max-w-3xl">
              <div className="flex items-center gap-3 mb-5 animate-fade-up">
                <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 shadow-lg">
                  <Icon className="w-4.5 h-4.5 text-primary" strokeWidth={2.2} />
                </span>
                <span className="brief-mono text-[11px] font-semibold text-foreground/70">
                  {kicker ?? badge}
                </span>
              </div>

              <h1
                className="font-brief text-5xl sm:text-6xl md:text-7xl lg:text-8xl text-foreground mb-5 animate-fade-up"
                style={{ animationDelay: "0.08s" }}
              >
                {title}{" "}
                <span className="text-gradient-primary">{highlight}</span>
              </h1>

              <div className="relative mb-6 max-w-2xl animate-fade-up" style={{ animationDelay: "0.14s" }}>
                <div className="brief-current absolute -top-1 left-0 w-24" />
              </div>

              <p
                className="text-base md:text-lg text-foreground/80 max-w-2xl leading-relaxed animate-fade-up"
                style={{ animationDelay: "0.2s" }}
              >
                {intro}
              </p>

              <div
                className="flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 brief-mono text-[11px] text-foreground/60 animate-fade-up"
                style={{ animationDelay: "0.28s" }}
              >
                <span>{badge}</span>
                <span aria-hidden>·</span>
                <span>{readMinutes} min read</span>
                <span aria-hidden>·</span>
                <span>{sources.length} sources</span>
              </div>
            </div>
          </div>
        </header>

        {/* ── Instrument-readout stats ───────────────────────────────── */}
        {stats && stats.length > 0 && (
          <div className="container px-4 max-w-6xl -mt-10 relative z-20">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
              {stats.map((s, i) => (
                <div
                  key={i}
                  className="brief-stat brief-reveal rounded-2xl p-5"
                  style={{ transitionDelay: `${i * 70}ms` }}
                >
                  <div className="font-brief text-3xl md:text-4xl text-gradient-primary">{s.value}</div>
                  <div className="text-xs text-muted-foreground mt-2 leading-snug">{s.label}</div>
                </div>
              ))}
            </div>
            {statsCta && (
              <div className="mt-5 flex justify-center brief-reveal">
                <Link to={statsCta.to}>
                  <button className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-6 py-3 rounded-xl shadow-card hover:opacity-90 transition-opacity">
                    <Calculator className="w-5 h-5" /> {statsCta.label} <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            )}
          </div>
        )}

        {/* ── Featured video ─────────────────────────────────────────── */}
        {video && (
          <section className="container px-4 max-w-5xl mt-16 md:mt-20">
            <div className="flex items-center gap-3 mb-4 brief-reveal">
              <span className="brief-mono text-[11px] text-primary font-semibold">Watch</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="brief-video brief-reveal aspect-video bg-foreground">
              {playing ? (
                <iframe
                  className="absolute inset-0 w-full h-full"
                  src={`https://www.youtube-nocookie.com/embed/${video.youtubeId}?autoplay=1&rel=0&modestbranding=1`}
                  title={video.title}
                  allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  allowFullScreen
                />
              ) : (
                <button
                  type="button"
                  onClick={() => setPlaying(true)}
                  className="group absolute inset-0 w-full h-full"
                  aria-label={`Play video: ${video.title}`}
                >
                  <img
                    src={`https://i.ytimg.com/vi/${video.youtubeId}/maxresdefault.jpg`}
                    alt={video.title}
                    className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105"
                    onError={(e) => {
                      (e.currentTarget as HTMLImageElement).src = `https://i.ytimg.com/vi/${video.youtubeId}/hqdefault.jpg`;
                    }}
                  />
                  <span className="absolute inset-0 bg-gradient-to-t from-foreground/70 via-foreground/10 to-foreground/30" aria-hidden />
                  <span className="absolute inset-0 flex items-center justify-center">
                    <span className="brief-play relative flex items-center justify-center">
                      <Play className="w-7 h-7 text-primary fill-primary translate-x-0.5" />
                    </span>
                  </span>
                  <span className="absolute bottom-5 left-5 right-5 text-left">
                    <span className="brief-mono text-[10px] text-white/70">Now playing</span>
                    <span className="block font-brief text-lg md:text-2xl text-white mt-1 leading-tight">
                      {video.title}
                    </span>
                  </span>
                </button>
              )}
            </div>
          </section>
        )}

        {/* ── Editorial body ─────────────────────────────────────────── */}
        <article className="container px-4 max-w-3xl mt-16 md:mt-24 space-y-14">
          {sections.map((s, i) => (
            <section key={i} className="brief-reveal">
              <div className="flex items-baseline gap-4 mb-4">
                <span className="brief-index brief-mono text-sm font-bold shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-brief text-2xl md:text-3xl text-foreground">{s.heading}</h2>
              </div>
              <div className="md:pl-10">
                {s.body.map((p, j) => (
                  <p key={j} className="text-muted-foreground leading-[1.75] mb-4 text-[15px] md:text-base">
                    {p}
                  </p>
                ))}
                {s.list && (
                  <ul className="mt-3 space-y-2.5">
                    {s.list.map((li, k) => (
                      <li key={k} className="flex gap-3 text-muted-foreground leading-relaxed text-[15px] md:text-base">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary" aria-hidden />
                        <span>{li}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
          ))}
        </article>

        {/* ── Pull-quote ─────────────────────────────────────────────── */}
        {pullQuote && (
          <section className="container px-4 max-w-4xl mt-20">
            <blockquote className="brief-quote brief-reveal text-center">
              <p className="font-brief text-2xl md:text-4xl text-foreground leading-[1.15]">{pullQuote}</p>
            </blockquote>
          </section>
        )}

        {/* ── Image gallery (asymmetric) ─────────────────────────────── */}
        {gallery && gallery.length > 0 && (
          <section className="container px-4 max-w-6xl mt-20 md:mt-28">
            <div className="flex items-center gap-3 mb-6 brief-reveal">
              <span className="brief-mono text-[11px] text-primary font-semibold">In focus</span>
              <span className="h-px flex-1 bg-border" />
            </div>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4">
              {gallery.map((shot, i) => (
                <figure
                  key={i}
                  className={`brief-shot brief-reveal group relative overflow-hidden rounded-2xl bg-muted ${
                    i === 0 ? "col-span-2 row-span-2 aspect-square lg:aspect-auto" : "aspect-[4/3]"
                  }`}
                  style={{ transitionDelay: `${i * 80}ms` }}
                >
                  <img src={shot.src} alt={shot.caption} className="w-full h-full object-cover" loading="lazy" />
                  <span className="absolute inset-0 bg-gradient-to-t from-foreground/75 via-transparent to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-500" aria-hidden />
                  <figcaption className="absolute bottom-0 left-0 right-0 p-3 md:p-4 translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
                    <span className="brief-mono text-[10px] text-white/70 block mb-0.5">
                      {String(i + 1).padStart(2, "0")} /{String(gallery.length).padStart(2, "0")}
                    </span>
                    <span className="text-sm text-white font-medium leading-snug">{shot.caption}</span>
                  </figcaption>
                </figure>
              ))}
            </div>
          </section>
        )}

        {/* ── Sources ────────────────────────────────────────────────── */}
        <section className="container px-4 max-w-3xl mt-20">
          <div className="brief-reveal rounded-2xl border border-border bg-card/80 backdrop-blur-sm p-6 md:p-7">
            <h3 className="brief-mono text-[11px] text-muted-foreground mb-4">Sources &amp; further reading</h3>
            <ul className="divide-y divide-border/70">
              {sources.map((src, i) => (
                <li key={i}>
                  <a
                    href={src.url}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="group flex items-center justify-between gap-4 py-3 text-sm font-medium text-foreground hover:text-primary transition-colors"
                  >
                    <span className="flex items-center gap-3">
                      <ExternalLink className="w-3.5 h-3.5 text-primary shrink-0" />
                      {src.label}
                    </span>
                    <ArrowUpRight className="w-4 h-4 text-muted-foreground group-hover:text-primary group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-all shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </div>
        </section>

        {/* ── CTA ────────────────────────────────────────────────────── */}
        <div className="container px-4 max-w-5xl mt-16 mb-24">
          <div className="brief-reveal relative overflow-hidden rounded-3xl gradient-hero p-8 md:p-12 text-center text-primary-foreground">
            <div className="absolute inset-0 opacity-30" style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.4), transparent 45%)" }} aria-hidden />
            <div className="relative z-10">
              <span className="brief-mono text-[11px] text-primary-foreground/80">Your move</span>
              <h2 className="font-brief text-3xl md:text-4xl mt-3 mb-3">Ready to make the switch?</h2>
              <p className="text-primary-foreground/90 mb-7 max-w-xl mx-auto">
                See what you'd save with an EV, or explore the incentives available in your area.
              </p>
              <div className="flex flex-col sm:flex-row gap-3 justify-center">
                <Link to="/electricity-vs-gasoline">
                  <button className="inline-flex items-center gap-1.5 bg-primary-foreground text-primary font-semibold px-6 py-3 rounded-xl hover:opacity-90 transition-opacity">
                    Open the cost calculator <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
                <Link to="/rebates-incentives">
                  <button className="inline-flex items-center gap-1.5 border border-primary-foreground/40 text-primary-foreground font-semibold px-6 py-3 rounded-xl hover:bg-primary-foreground/10 transition-colors">
                    Find incentives near you <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
};

export default ContentPageLayout;
