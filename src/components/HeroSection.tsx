import { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Button } from "@/components/ui/button";
import {
  ChevronDown, ChevronLeft, ChevronRight,
  MapPin, Clock, CalendarDays, ArrowRight, Newspaper, Briefcase, Building2,
} from "lucide-react";
import heroBg from "@/assets/hero-bg.jpg";
import logo from "@/assets/hero-logo.png";
import { EVENTS, type EventItem } from "@/data/events";
import { JOBS, type Job } from "@/data/careers";
import { BLOG_POSTS, type BlogPost } from "@/data/blog-posts";

type Slide =
  | { kind: "brand" }
  | { kind: "event"; data: EventItem }
  | { kind: "career"; data: Job }
  | { kind: "article"; data: BlogPost };

// Build the deck: brand intro first, then a couple of upcoming events,
// featured careers, and featured articles. Each event/career/article slide
// shows its own image. Edit the slice counts to show more/less.
const SLIDES: Slide[] = [
  { kind: "brand" },
  ...EVENTS.slice(0, 2).map((data): Slide => ({ kind: "event", data })),
  ...JOBS.filter((j) => j.featured).slice(0, 2).map((data): Slide => ({ kind: "career", data })),
  ...BLOG_POSTS.slice(0, 2).map((data): Slide => ({ kind: "article", data })),
];

const AUTOPLAY_MS = 6000;

// Each event/career/article slide uses its own exact image; brand uses the
// generic hero backdrop.
const slideBg = (slide: Slide) => (slide.kind === "brand" ? heroBg : slide.data.image);

const HeroSection = () => {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const count = SLIDES.length;

  const go = useCallback((i: number) => setIndex(((i % count) + count) % count), [count]);
  const next = useCallback(() => go(index + 1), [go, index]);
  const prev = useCallback(() => go(index - 1), [go, index]);

  // Autoplay — pauses on hover/focus.
  useEffect(() => {
    if (paused || count <= 1) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % count), AUTOPLAY_MS);
    return () => window.clearInterval(id);
  }, [paused, count]);

  return (
    <section
      className="relative min-h-screen flex items-center justify-center overflow-hidden"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocusCapture={() => setPaused(true)}
      onBlurCapture={() => setPaused(false)}
      aria-roledescription="carousel"
      aria-label="Featured events and articles"
    >
      {/* Slides (cross-fade) */}
      {SLIDES.map((slide, i) => {
        const active = i === index;
        return (
          <div
            key={i}
            className={`absolute inset-0 transition-opacity duration-700 ease-out ${
              active ? "opacity-100 z-[5]" : "opacity-0 z-0 pointer-events-none"
            }`}
            aria-hidden={!active}
          >
            <img
              src={slideBg(slide)}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              width={1920}
              height={1080}
              loading={i === 0 ? "eager" : "lazy"}
            />
            <div className="absolute inset-0 bg-gradient-to-b from-primary/80 via-primary/60 to-primary/90" />

            <div className="relative z-10 h-full container flex items-center justify-center text-center px-4">
              {slide.kind === "brand" && <BrandSlide active={active} />}
              {slide.kind === "event" && <EventSlide event={slide.data} />}
              {slide.kind === "career" && <CareerSlide job={slide.data} />}
              {slide.kind === "article" && <ArticleSlide post={slide.data} />}
            </div>
          </div>
        );
      })}

      {/* Prev / Next */}
      <button
        type="button"
        onClick={prev}
        aria-label="Previous slide"
        className="absolute left-3 md:left-6 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-primary-foreground backdrop-blur border border-white/20 transition-colors"
      >
        <ChevronLeft size={22} />
      </button>
      <button
        type="button"
        onClick={next}
        aria-label="Next slide"
        className="absolute right-3 md:right-6 top-1/2 -translate-y-1/2 z-20 grid place-items-center w-11 h-11 rounded-full bg-white/15 hover:bg-white/30 text-primary-foreground backdrop-blur border border-white/20 transition-colors"
      >
        <ChevronRight size={22} />
      </button>

      {/* Dots */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex items-center gap-2.5">
        {SLIDES.map((_, i) => (
          <button
            key={i}
            type="button"
            onClick={() => go(i)}
            aria-label={`Go to slide ${i + 1}`}
            aria-current={i === index}
            className={`h-2.5 rounded-full transition-all ${
              i === index ? "w-7 bg-primary-foreground" : "w-2.5 bg-primary-foreground/50 hover:bg-primary-foreground/80"
            }`}
          />
        ))}
      </div>

      {/* Scroll indicator */}
      <a href="#dashboard" className="absolute bottom-8 right-6 z-20 animate-float hidden md:block" aria-label="Scroll to content">
        <ChevronDown className="text-primary-foreground/70" size={28} />
      </a>
    </section>
  );
};

/* ---------------------------------------------------------------- slides */

const BrandSlide = ({ active }: { active: boolean }) => (
  <div className="max-w-4xl mx-auto">
    <img
      src={logo}
      alt="Electrifying the US logo"
      className={`mx-auto w-full max-w-2xl h-auto mb-[50px] drop-shadow-2xl ${active ? "animate-fade-up" : ""}`}
    />
    <p
      className={`text-lg md:text-xl text-primary-foreground/90 max-w-2xl mx-auto mb-10 font-light leading-relaxed ${active ? "animate-fade-up" : ""}`}
      style={{ animationDelay: "0.2s" }}
    >
      Charging the nation toward a sustainable future through clean energy and
      multimodal transportation electrification.
    </p>

    <div className={`flex flex-col sm:flex-row gap-4 justify-center ${active ? "animate-fade-up" : ""}`} style={{ animationDelay: "0.4s" }}>
      <a href="#ev101">
        <Button variant="hero" size="lg" className="text-base px-8 py-6 rounded-2xl">
          Explore EV 101
        </Button>
      </a>
      <Link to="/electricity-vs-gasoline">
        <Button variant="heroOutline" size="lg" className="text-base px-8 py-6 rounded-2xl">
          EV vs Gas Calculator
        </Button>
      </Link>
      <Link to="/rebates-incentives">
        <Button variant="green" size="lg" className="text-base px-8 py-6 rounded-2xl">
          EV Incentives
        </Button>
      </Link>
    </div>
  </div>
);

const EventSlide = ({ event }: { event: EventItem }) => (
  <div className="max-w-3xl mx-auto">
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-sm font-semibold mb-6 backdrop-blur">
      <CalendarDays className="w-4 h-4" /> Upcoming Event · {event.type}
    </span>

    <div className="flex items-center justify-center gap-5 mb-5">
      <div className="shrink-0 w-24 h-24 rounded-3xl bg-primary-foreground/15 backdrop-blur flex flex-col items-center justify-center text-primary-foreground">
        <span className="text-xs font-semibold tracking-wider opacity-90">{event.month}</span>
        <span className="text-4xl font-bold font-display leading-none">{event.day}</span>
      </div>
    </div>

    <h2 className="text-3xl md:text-5xl font-bold font-display text-primary-foreground leading-tight mb-4">
      {event.title}
    </h2>

    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-primary-foreground/90 text-sm md:text-base mb-7">
      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {event.location}</span>
      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {event.time}</span>
    </div>

    <Link to="/events">
      <Button variant="green" size="lg" className="text-base px-8 py-6 rounded-2xl">
        View Events <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </Link>
  </div>
);

const CareerSlide = ({ job }: { job: Job }) => (
  <div className="max-w-3xl mx-auto">
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-sm font-semibold mb-6 backdrop-blur">
      <Briefcase className="w-4 h-4" /> We're Hiring · {job.department}
    </span>

    <h2 className="text-3xl md:text-5xl font-bold font-display text-primary-foreground leading-tight mb-4">
      {job.title}
    </h2>

    <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-primary-foreground/90 text-sm md:text-base mb-7">
      <span className="flex items-center gap-1.5"><Building2 className="w-4 h-4" /> {job.company}</span>
      <span className="flex items-center gap-1.5"><MapPin className="w-4 h-4" /> {job.location}</span>
      <span className="flex items-center gap-1.5"><Clock className="w-4 h-4" /> {job.type}</span>
    </div>

    <Link to="/careers">
      <Button variant="green" size="lg" className="text-base px-8 py-6 rounded-2xl">
        View Careers <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </Link>
  </div>
);

const ArticleSlide = ({ post }: { post: BlogPost }) => (
  <div className="max-w-3xl mx-auto">
    <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary-foreground/15 text-primary-foreground text-sm font-semibold mb-6 backdrop-blur">
      <Newspaper className="w-4 h-4" /> Featured Article · {post.category}
    </span>

    <h2 className="text-3xl md:text-5xl font-bold font-display text-primary-foreground leading-tight mb-5">
      {post.title}
    </h2>

    <p className="text-primary-foreground/90 text-base md:text-lg max-w-2xl mx-auto mb-7 font-light leading-relaxed line-clamp-3">
      {post.excerpt}
    </p>

    <Link to={`/blog/${post.slug}`}>
      <Button variant="hero" size="lg" className="text-base px-8 py-6 rounded-2xl">
        Read Article <ArrowRight className="w-4 h-4 ml-1" />
      </Button>
    </Link>
  </div>
);

export default HeroSection;
