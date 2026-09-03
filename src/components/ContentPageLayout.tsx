import { Fragment, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { ArrowRight, ArrowUpRight, ExternalLink, Play, Calculator, Film, X, ArrowUp, ArrowDown, Copy, Trash2, type LucideIcon } from "lucide-react";
import { useInlineEdit } from "@/components/inline/edit-context";
import Navbar from "@/components/Navbar";
import Footer from "@/components/Footer";
import Editable from "@/components/inline/Editable";
import EditableText, { PageStylesContext } from "@/components/inline/EditableText";
import EditableImage from "@/components/inline/EditableImage";
import BlockSlot from "@/components/inline/blocks/BlockSlot";
import HeroSection, { heroLayout } from "@/components/inline/HeroSection";
import VideoGateDialog from "@/components/forms/VideoGateDialog";
import { hasLeadIdentity } from "@/lib/leadIdentity";
import type { PageBlock, ElemStyle, PageHero } from "@/lib/page-content";

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

export interface ContentLinkCard {
  icon: LucideIcon;
  title: string;
  desc: string;
  to: string;
  /** Optional card background classes (e.g. "bg-blue-50"). */
  bgCls?: string;
  /** Optional icon-badge classes (e.g. "bg-blue-500 text-white"). */
  iconCls?: string;
}

interface ContentPageLayoutProps {
  badge: string;
  title: string;
  highlight: string;
  intro: string;
  /** Hero background image. Omit for a plain (image-less) hero. */
  heroImage?: string;
  icon: LucideIcon;
  stats?: ContentStat[];
  sections: ContentSection[];
  sources?: ContentSource[];
  kicker?: string;
  pullQuote?: string;
  gallery?: ContentShot[];
  video?: ContentVideo;
  /** Ask for a first name and email before this page's video plays, unless the
   *  visitor has already given them at any other gate on the site. Opt-in per
   *  page: the webinar replays are the recordings worth trading for, and a gate
   *  on every content page would tax pages whose video is a 40-second explainer. */
  gateVideo?: boolean;
  /** Optional CTA button shown directly under the stats row. */
  statsCta?: { label: string; to: string };
  /** Render the hero title at a smaller size (for long, multi-line titles). */
  compactTitle?: boolean;
  /** Optional primary CTA shown in the bottom CTA band (e.g. a related page). */
  extraCta?: { label: string; to: string };
  /** Optional flyer image shown directly under the extraCta button — e.g. an
   *  event flyer that links to its registration page. */
  extraCtaImage?: { src: string; alt: string; to?: string };
  /** Hide the "badge · N min read · N sources" meta line in the hero. */
  hideMeta?: boolean;
  /** Hide the bottom "Ready to make the switch?" CTA band. */
  hideCta?: boolean;
  /** Optional grid of clickable navigation cards (icon + title + description). */
  linkCards?: ContentLinkCard[];
  /** Look of the hero band — background, text colour, height, or removed
   *  entirely. Set from the on-page editor; unset = the built-in hero. */
  hero?: PageHero;
  /** Builder blocks inserted between sections (on-page editor). */
  blocks?: PageBlock[];
  /** Per-element typography overrides (font/size/color/bold/italic), keyed by path. */
  styles?: Record<string, ElemStyle>;
}

const ContentPageLayout = ({
  badge, title, highlight, intro, heroImage, icon: Icon,
  stats, sections, sources = [], kicker, pullQuote, gallery, video, gateVideo, statsCta, compactTitle, extraCta,
  extraCtaImage, hideMeta, hideCta, linkCards, blocks, styles, hero,
}: ContentPageLayoutProps) => {
  const [playing, setPlaying] = useState(false);
  const [gateOpen, setGateOpen] = useState(false);
  const ctx = useInlineEdit();
  const editing = !!ctx?.editing;
  const [vidEdit, setVidEdit] = useState(false);
  const [vidUrl, setVidUrl] = useState("");
  const [vidTitle, setVidTitle] = useState("");
  const openVidEdit = () => { setVidUrl(video?.youtubeId ?? ""); setVidTitle(video?.title ?? ""); setVidEdit(true); };
  const parseYouTubeId = (input: string) => {
    const s = input.trim();
    const m = s.match(/(?:youtu\.be\/|[?&]v=|embed\/|shorts\/)([A-Za-z0-9_-]{6,})/);
    if (m) return m[1];
    return /^[A-Za-z0-9_-]{6,}$/.test(s) ? s : "";
  };
  const saveVideo = () => {
    const id = parseYouTubeId(vidUrl);
    if (!id) return;
    ctx?.set("video", { youtubeId: id, title: vidTitle.trim() || "Watch" });
    setVidEdit(false); setPlaying(false);
  };

  // Reorder / duplicate / delete a native section — and keep the per-element
  // typography (styles keyed by "sections.i.*") and between-section blocks
  // (slot "after-section-i") aligned to the sections' new positions.
  const sectionOp = (i: number, op: "up" | "down" | "dup" | "del") => {
    if (!ctx) return;
    const secs = [...((ctx.get("sections") as ContentSection[] | undefined) ?? sections ?? [])];
    const st = (ctx.get("styles") as Record<string, ElemStyle> | undefined) ?? {};
    const blk = [...((ctx.get("blocks") as PageBlock[] | undefined) ?? [])];
    let order = secs.map((_, idx) => idx);
    if (op === "up") { if (i <= 0) return; [order[i - 1], order[i]] = [order[i], order[i - 1]]; }
    else if (op === "down") { if (i >= secs.length - 1) return; [order[i], order[i + 1]] = [order[i + 1], order[i]]; }
    else if (op === "dup") { order = [...order.slice(0, i + 1), i, ...order.slice(i + 1)]; }
    else if (op === "del") { order = order.filter((_, p) => p !== i); }
    const newSecs = order.map((oldI) => secs[oldI]);
    const newStyles: Record<string, ElemStyle> = {};
    for (const [k, v] of Object.entries(st)) if (!/^sections\.\d+\./.test(k)) newStyles[k] = v;
    order.forEach((oldI, p) => {
      for (const [k, v] of Object.entries(st)) {
        const m = /^sections\.(\d+)\.(.+)$/.exec(k);
        if (m && Number(m[1]) === oldI) newStyles[`sections.${p}.${m[2]}`] = v;
      }
    });
    const firstPos = new Map<number, number>();
    order.forEach((oldI, p) => { if (!firstPos.has(oldI)) firstPos.set(oldI, p); });
    const newBlocks = blk
      .map((b) => {
        const m = /^after-section-(\d+)$/.exec(b.slot);
        if (!m) return b;
        const np = firstPos.get(Number(m[1]));
        return np === undefined ? null : { ...b, slot: `after-section-${np}` };
      })
      .filter(Boolean) as PageBlock[];
    ctx.setMany?.({ sections: newSecs, styles: newStyles, blocks: newBlocks });
  };

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

  // Hero alignment + colour, from the page's `hero` settings (defaults match the
  // built-in look, so a page nobody has styled is unchanged).
  const heroL = heroLayout(hero, !!heroImage);

  return (
    <PageStylesContext.Provider value={styles}>
    <div className="brief min-h-screen flex flex-col bg-background">
      <div className="brief-atmos" aria-hidden />
      <Navbar />

      <main className="brief-grain flex-1 relative z-10">
        {/* ── Cinematic hero ─────────────────────────────────────────── */}
        {/* Wrapped in HeroSection: in edit mode that makes the hero a selectable
            section with its own Inspector panel (background, colour, height,
            alignment) and a delete/restore path. Unstyled, it renders exactly as
            the plain <header> always did. */}
        <HeroSection
          hero={hero}
          heroImage={heroImage}
          image={heroImage ? (
            <>
              <EditableImage
                path="heroImage"
                src={heroImage}
                alt={title}
                className="brief-hero-img absolute inset-0 w-full h-full object-cover"
              />
              <div className="brief-hero-grade absolute inset-0" aria-hidden />
            </>
          ) : null}
        >
          <div className="container relative z-10 px-4 pb-14 md:pb-20">
            <div className={`max-w-3xl ${heroL.boxClass} ${heroL.textClass}`}>
              {!hero?.hideKicker && (
                <div className={`flex items-center gap-3 mb-5 animate-fade-up ${heroL.rowClass}`}>
                  <span className="inline-flex items-center justify-center w-9 h-9 rounded-xl bg-white/90 shadow-lg">
                    <Icon className="w-4.5 h-4.5 text-primary" strokeWidth={2.2} />
                  </span>
                  <span className="brief-mono text-[11px] font-semibold text-foreground/70" style={heroL.ink ? { color: heroL.ink } : undefined}>
                    <Editable path="kicker">{kicker ?? badge}</Editable>
                  </span>
                </div>
              )}

              <h1
                className={`font-brief text-foreground mb-5 animate-fade-up ${
                  compactTitle
                    ? "text-3xl sm:text-4xl md:text-5xl lg:text-6xl"
                    : "text-5xl sm:text-6xl md:text-7xl lg:text-8xl"
                }`}
                style={{ animationDelay: "0.08s" }}
              >
                <EditableText path="title">{title}</EditableText>{" "}
                <span className="text-gradient-primary"><EditableText path="highlight">{highlight}</EditableText></span>
              </h1>

              <div className={`relative mb-6 max-w-2xl animate-fade-up ${heroL.boxClass}`} style={{ animationDelay: "0.14s" }}>
                <div className={`brief-current absolute -top-1 w-24 ${heroL.ruleClass}`} />
              </div>

              <p
                className={`text-base md:text-lg text-foreground/80 max-w-2xl leading-relaxed animate-fade-up ${heroL.boxClass}`}
                style={{ animationDelay: "0.2s" }}
              >
                <EditableText path="intro">{intro}</EditableText>
              </p>

              {!hideMeta && !hero?.hideMeta && (
                <div
                  className={`flex flex-wrap items-center gap-x-6 gap-y-2 mt-7 brief-mono text-[11px] text-foreground/60 animate-fade-up ${heroL.rowClass}`}
                  style={{ animationDelay: "0.28s", ...(heroL.ink ? { color: heroL.ink } : {}) }}
                >
                  <span>{badge}</span>
                  <span aria-hidden>·</span>
                  <span>{readMinutes} min read</span>
                  {sources.length > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{sources.length} sources</span>
                    </>
                  )}
                </div>
              )}

              {/* Blocks that live INSIDE the hero — images, video, extra headings,
                  buttons, anything. Ordinary blocks in an ordinary slot, so they
                  add / delete / duplicate / reorder like every other block, and
                  the "Add block" control sits right here rather than far below.
                  Clicks stop here so picking a block doesn't also grab the hero. */}
              <div onClick={(e) => e.stopPropagation()}>
                <BlockSlot slot="hero" blocks={blocks} />
              </div>
            </div>
          </div>
        </HeroSection>

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
                  <div className="font-brief text-3xl md:text-4xl text-gradient-primary"><EditableText path={`stats.${i}.value`}>{s.value}</EditableText></div>
                  <div className="text-xs text-muted-foreground mt-2 leading-snug"><EditableText path={`stats.${i}.label`}>{s.label}</EditableText></div>
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
        {/* With no video set, edit mode used to reserve the full 16:9 frame —
            measured at 671px of empty box between the hero and the first block.
            An editor with no video now gets a small "Add a video" pill instead;
            the frame appears once there is something to put in it. */}
        {/* extraCta and extraCtaImage live in this section too, so gating it on
            the video alone made them vanish on a page that has a CTA but no
            video yet — silently, since nothing errors. A webinar RECAP page,
            published before its recording is, is exactly that case. */}
        {(video || editing || extraCta || extraCtaImage) && (
          <section className={`container px-4 max-w-5xl ${video || extraCta || extraCtaImage ? "mt-16 md:mt-20" : "mt-6"}`}>
            {!video && editing && (
              <div className="flex justify-center">
                <button
                  type="button"
                  onClick={openVidEdit}
                  className="inline-flex items-center gap-1.5 rounded-full border border-dashed border-primary/50 bg-primary/5 px-4 py-1.5 text-xs font-semibold text-primary hover:bg-primary/10 transition-colors"
                >
                  <Film className="w-3.5 h-3.5" /> Add a video
                </button>
              </div>
            )}
            {video && (
            <>
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
                  onClick={() => (gateVideo && !hasLeadIdentity() ? setGateOpen(true) : setPlaying(true))}
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
              {editing && (
                <button type="button" onClick={openVidEdit} className="absolute top-2 right-2 z-10 inline-flex items-center gap-1.5 rounded-lg bg-black/70 px-2.5 py-1.5 text-xs font-semibold text-white hover:bg-black/85">
                  <Film className="w-3.5 h-3.5" /> Change video
                </button>
              )}
            </div>
            {gateVideo && (
              <VideoGateDialog
                open={gateOpen}
                onOpenChange={setGateOpen}
                onUnlock={() => setPlaying(true)}
                videoTitle={video.title}
              />
            )}
            </>
            )}

            {/* Optional CTA directly under the video (e.g. a related event). */}
            {extraCta && (
              <div className="mt-6 flex justify-center brief-reveal">
                <Link to={extraCta.to}>
                  <button className="inline-flex items-center gap-2 gradient-primary text-primary-foreground font-semibold px-7 py-3.5 rounded-xl shadow-card hover:opacity-90 transition-opacity">
                    {extraCta.label} <ArrowRight className="w-5 h-5" />
                  </button>
                </Link>
              </div>
            )}

            {/* Optional flyer directly under the CTA button (e.g. the event flyer,
                linking to its registration page). */}
            {extraCtaImage && (
              <div className="mt-6 flex justify-center brief-reveal">
                {extraCtaImage.to ? (
                  <Link
                    to={extraCtaImage.to}
                    aria-label={extraCtaImage.alt}
                    className="block w-full max-w-2xl overflow-hidden rounded-2xl shadow-elevated ring-1 ring-border transition-transform hover:-translate-y-0.5 focus:outline-none focus-visible:ring-2 focus-visible:ring-primary"
                  >
                    <img src={extraCtaImage.src} alt={extraCtaImage.alt} className="w-full h-auto" loading="lazy" />
                  </Link>
                ) : (
                  <img
                    src={extraCtaImage.src}
                    alt={extraCtaImage.alt}
                    className="w-full max-w-2xl h-auto rounded-2xl shadow-elevated ring-1 ring-border"
                    loading="lazy"
                  />
                )}
              </div>
            )}
          </section>
        )}

        {/* ── Editorial body ─────────────────────────────────────────── */}
        {/* The generous top margin is for pages with written sections. A page
            built only from blocks (a new CMS page) has nothing to separate, and
            the gap just pushed the first block miles below the hero. */}
        <article className={`container px-4 max-w-3xl space-y-14 ${sections.length ? "mt-16 md:mt-24" : "mt-6"}`}>
          <BlockSlot slot="after-stats" blocks={blocks} />
          {sections.map((s, i) => (
            <Fragment key={i}>
            <section className={`brief-reveal ${editing ? "group relative rounded-xl ring-1 ring-transparent hover:ring-primary/30 transition p-2 -m-2" : ""}`}>
              {editing && (
                <div className="absolute -top-3 right-2 z-20 hidden group-hover:flex items-center gap-0.5 rounded-lg bg-foreground/90 backdrop-blur px-1 py-0.5 shadow" contentEditable={false}>
                  <button onClick={() => sectionOp(i, "up")} disabled={i === 0} className="p-1.5 rounded-md text-white/90 hover:bg-white/15 disabled:opacity-30" title="Move section up"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => sectionOp(i, "down")} disabled={i === sections.length - 1} className="p-1.5 rounded-md text-white/90 hover:bg-white/15 disabled:opacity-30" title="Move section down"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => sectionOp(i, "dup")} className="p-1.5 rounded-md text-white/90 hover:bg-white/15" title="Duplicate section"><Copy className="w-3.5 h-3.5" /></button>
                  <button onClick={() => sectionOp(i, "del")} className="p-1.5 rounded-md text-white/90 hover:bg-red-500/60" title="Delete section"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
              )}
              <div className="flex items-baseline gap-4 mb-4">
                <span className="brief-index brief-mono text-sm font-bold shrink-0">
                  {String(i + 1).padStart(2, "0")}
                </span>
                <h2 className="font-brief text-2xl md:text-3xl text-foreground"><EditableText path={`sections.${i}.heading`}>{s.heading}</EditableText></h2>
              </div>
              <div className="md:pl-10">
                {s.body.map((p, j) => (
                  <p key={j} className="text-muted-foreground leading-[1.75] mb-4 text-[15px] md:text-base">
                    <EditableText path={`sections.${i}.body.${j}`}>{p}</EditableText>
                  </p>
                ))}
                {s.list && (
                  <ul className="mt-3 space-y-2.5">
                    {s.list.map((li, k) => (
                      <li key={k} className="flex gap-3 text-muted-foreground leading-relaxed text-[15px] md:text-base">
                        <span className="mt-2 h-1.5 w-1.5 shrink-0 rounded-full bg-gradient-to-br from-primary to-secondary" aria-hidden />
                        <span><EditableText path={`sections.${i}.list.${k}`}>{li}</EditableText></span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            </section>
            <BlockSlot slot={`after-section-${i}`} blocks={blocks} />
            </Fragment>
          ))}
          <BlockSlot slot="end" blocks={blocks} />
        </article>

        {/* ── Pull-quote ─────────────────────────────────────────────── */}
        {pullQuote && (
          <section className="container px-4 max-w-4xl mt-20">
            <blockquote className="brief-quote brief-reveal text-center">
              <p className="font-brief text-2xl md:text-4xl text-foreground leading-[1.15]"><Editable path="pullQuote">{pullQuote}</Editable></p>
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
                  <EditableImage path={`gallery.${i}.src`} src={shot.src} alt={shot.caption} className="w-full h-full object-cover" loading="lazy" />
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

        {/* ── Link cards (navigation to key pages) ───────────────────── */}
        {linkCards && linkCards.length > 0 && (
          <section className="container px-4 max-w-6xl mt-16 md:mt-20 mb-20 md:mb-28">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 md:gap-5">
              {linkCards.map((c, i) => {
                // Bold gradient card (matches the Featured event cards): coloured
                // body, white text, white CTA button. `bgCls` carries the gradient.
                const cls = `brief-reveal group flex flex-col rounded-3xl p-6 text-white shadow-elevated transition-all hover:-translate-y-1 hover:shadow-xl ${c.bgCls ?? "gradient-hero"}`;
                const style = { transitionDelay: `${i * 70}ms` };
                const inner = (
                  <>
                    <span className="mb-4 inline-grid h-11 w-11 place-items-center rounded-xl bg-white/20">
                      <c.icon className="h-5 w-5 text-white" />
                    </span>
                    <h3 className="mb-1.5 font-display text-lg font-bold leading-snug">{c.title}</h3>
                    <p className="mb-5 flex-1 text-sm leading-snug text-white/85">{c.desc}</p>
                    <span className="inline-flex items-center gap-1.5 self-start rounded-xl bg-white px-4 py-2 text-sm font-semibold text-foreground transition-all group-hover:gap-2.5">
                      Open <ArrowRight className="h-4 w-4" />
                    </span>
                  </>
                );
                // Hash / external targets use a real <a> (full nav) so a cross-page
                // anchor like /#agent-chat reliably scrolls to the section.
                return c.to.startsWith("/#") || c.to.startsWith("http") ? (
                  <a key={i} href={c.to} className={cls} style={style}>{inner}</a>
                ) : (
                  <Link key={i} to={c.to} className={cls} style={style}>{inner}</Link>
                );
              })}
            </div>
          </section>
        )}

        {/* ── Sources ────────────────────────────────────────────────── */}
        {sources.length > 0 && (
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
        )}

        {/* ── CTA ────────────────────────────────────────────────────── */}
        {!hideCta && (
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
        )}
      </main>

      {vidEdit && (
        <div className="fixed inset-0 z-[100] grid place-items-center bg-black/50 backdrop-blur-sm p-4" onClick={() => setVidEdit(false)}>
          <div className="w-full max-w-md rounded-2xl border border-border surface p-5 shadow-elevated" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center mb-3">
              <h3 className="font-bold font-display text-foreground">Watch video</h3>
              <button onClick={() => setVidEdit(false)} className="ml-auto p-1.5 rounded-lg text-muted-foreground hover:bg-muted"><X className="w-4 h-4" /></button>
            </div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">YouTube link or ID</label>
            <input value={vidUrl} onChange={(e) => setVidUrl(e.target.value)} placeholder="https://youtu.be/…  or  dQw4w9WgXcQ" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm mb-3" />
            <label className="block text-xs font-semibold uppercase tracking-wide text-muted-foreground mb-1.5">Title</label>
            <input value={vidTitle} onChange={(e) => setVidTitle(e.target.value)} placeholder="Video title" className="w-full rounded-xl border border-border bg-background px-3 py-2.5 text-sm mb-4" />
            <button onClick={saveVideo} disabled={!parseYouTubeId(vidUrl)} className="rounded-xl gradient-hero text-white font-semibold px-5 py-2.5 text-sm disabled:opacity-60">Save video</button>
          </div>
        </div>
      )}
      <Footer />
    </div>
    </PageStylesContext.Provider>
  );
};

export default ContentPageLayout;
