import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X, ArrowRight, Star, Newspaper } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription,
} from "@/components/ui/dialog";
import ContactForm from "@/components/forms/ContactForm";
import { useEvents, usePosts } from "@/hooks/use-content";
import logoColored from "@/assets/logo-colored.png";
import logoWhite from "@/assets/logo-white.png";

// A spotlight card shown in the menu's left column. Featured events fill it
// first; featured news/blog posts backfill when events are insufficient.
type Spotlight = {
  key: string;
  href: string;
  image: string;
  tag: string;
  title: string;
  meta: string;
  date?: { month: string; day: string };
  kind: "event" | "news";
};

// `dialog: true` items open the shared Contact Us popup (same <ContactForm /> as
// the floating ContactWidget) instead of navigating. `href` stays as a fallback.
type NavItem = { label: string; href: string; dialog?: boolean };

const navItems: NavItem[] = [
  { label: "About", href: "#about" },
  { label: "EV Dashboard", href: "#dashboard" },
  { label: "EV 101", href: "#ev101" },
  { label: "Benefits", href: "#benefits" },
  { label: "Multimodal", href: "#multimodal" },
  { label: "EV vs Gas Calculator", href: "/electricity-vs-gasoline" },
  { label: "News", href: "/news" },
  { label: "Events", href: "/events" },
  { label: "Gallery", href: "/gallery" },
  { label: "Careers", href: "/careers" },
  { label: "Contact", href: "/contact-us", dialog: true },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);      // logical open/closed
  const [mounted, setMounted] = useState(false); // keep overlay mounted through the exit animation
  const [scrolled, setScrolled] = useState(false);
  const [contactOpen, setContactOpen] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  const { events } = useEvents();
  const { posts } = usePosts();

  // Up to 3 spotlight cards for the menu: featured events first, then featured
  // news/blog posts to backfill if there aren't enough featured events.
  const featuredEvents = events.filter((e) => e.featured);
  const eventPool = featuredEvents.length ? featuredEvents : events;
  const spotlights: Spotlight[] = eventPool.slice(0, 3).map((e) => ({
    key: `event-${e.slug ?? e.title}`,
    href: e.slug ? `/events/${e.slug}` : "/events",
    image: e.image,
    tag: e.type,
    title: e.title,
    meta: e.location,
    date: { month: e.month, day: e.day },
    kind: "event",
  }));
  if (spotlights.length < 3) {
    const featuredPosts = posts.filter((p) => p.featured);
    const postPool = featuredPosts.length ? featuredPosts : posts;
    for (const p of postPool) {
      if (spotlights.length >= 3) break;
      spotlights.push({
        key: `news-${p.slug}`,
        href: `/blog/${p.slug}`,
        image: p.image,
        tag: p.category,
        title: p.title,
        meta: p.date,
        kind: "news",
      });
    }
  }

  // Use the solid (dark-text) header style whenever scrolled, or on any
  // non-home page (which has a light background behind the navbar).
  const solid = scrolled || !isHome;

  // Absolute routes ("/path") link directly. Anchor links ("#id") live on the
  // home page; from other pages, route home first.
  const linkHref = (href: string) =>
    href.startsWith("/") ? href : isHome ? href : `/${href}`;

  const openMenu = () => { setMounted(true); setOpen(true); };
  const closeMenu = () => setOpen(false);
  const toggleMenu = () => (open ? closeMenu() : openMenu());

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  // After a close, unmount the overlay once its exit animation has played.
  useEffect(() => {
    if (open || !mounted) return;
    const t = setTimeout(() => setMounted(false), 440);
    return () => clearTimeout(t);
  }, [open, mounted]);

  // Lock body scroll + close on Escape while the menu is open.
  useEffect(() => {
    if (!open) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") closeMenu(); };
    window.addEventListener("keydown", onKey);
    return () => {
      document.body.style.overflow = prev;
      window.removeEventListener("keydown", onKey);
    };
  }, [open]);

  return (
    <>
      <nav
        className={`fixed top-0 left-0 right-0 z-50 transition-all duration-500 ${
          solid ? "glass shadow-lg py-2" : "bg-transparent py-4"
        }`}
      >
        <div className="container flex items-center justify-between">
          <a href="/" className="flex items-center gap-2">
            <img
              src={solid ? logoColored : logoWhite}
              alt="Electrifying the US"
              className="h-10 md:h-12 w-auto"
            />
          </a>

          {/* Burger toggle (all sizes) — electric pulse draws the eye while closed */}
          <button
            className={`relative z-[60] p-2 rounded-lg transition-transform active:scale-90 ${open ? "" : "burger-electric"}`}
            onClick={toggleMenu}
            aria-label="Toggle menu"
            aria-expanded={open}
          >
            {open ? (
              <X className={`burger-bolt ${solid ? "text-primary" : "text-primary-foreground"}`} size={24} />
            ) : (
              <Menu className={`burger-bolt ${solid ? "text-primary" : "text-primary-foreground"}`} size={24} />
            )}
          </button>
        </div>
      </nav>

      {/* Full-viewport menu overlay — blurred backdrop + featured event (left) + nav panel (right) */}
      {mounted && (
        <div className="fixed inset-0 z-40 overflow-hidden">
          {/* Blurred backdrop — click to close */}
          <button
            type="button"
            aria-label="Close menu"
            onClick={closeMenu}
            className={`absolute inset-0 w-full h-full nav-backdrop ${open ? "nav-fade-in" : "nav-fade-out"}`}
          />

          {/* Spotlight column — featured events (then news) over the blur (lg+) */}
          {spotlights.length > 0 && (
            <div className="absolute inset-y-0 left-0 right-0 sm:right-[22rem] hidden lg:flex flex-col items-center justify-center gap-5 px-8 xl:px-20 pointer-events-none">
              <div className="w-full max-w-2xl">
                <span className="inline-flex items-center gap-1.5 px-3.5 py-1.5 mb-1 rounded-full bg-white/85 text-foreground text-sm font-bold shadow">
                  <Star className="w-4 h-4 text-secondary" fill="currentColor" /> Featured
                </span>
              </div>
              {spotlights.map((s, i) => (
                <a
                  key={s.key}
                  href={s.href}
                  onClick={closeMenu}
                  style={open ? { animationDelay: `${i * 90}ms` } : undefined}
                  className={`group pointer-events-auto w-full max-w-2xl flex rounded-3xl overflow-hidden glass shadow-elevated hover:-translate-y-1 transition-transform ${open ? "nav-feature-in" : "nav-feature-out"}`}
                >
                  {/* Thumbnail with date badge (events) */}
                  <div className="relative w-40 sm:w-52 shrink-0 overflow-hidden">
                    <img
                      src={s.image}
                      alt={s.title}
                      className="absolute inset-0 w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    {s.date && (
                      <div className="absolute top-3 left-3 w-16 rounded-2xl bg-white text-center shadow-lg overflow-hidden">
                        <div className="bg-secondary text-primary-foreground text-[10px] font-bold tracking-wider py-1">{s.date.month}</div>
                        <div className="text-foreground text-2xl font-bold font-display leading-none py-1.5">{s.date.day}</div>
                      </div>
                    )}
                  </div>
                  {/* Body */}
                  <div className="flex-1 min-w-0 p-6">
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 mb-3 rounded-full bg-primary/10 text-primary text-xs font-semibold">
                      {s.kind === "event" ? <Star className="w-3.5 h-3.5" /> : <Newspaper className="w-3.5 h-3.5" />} {s.tag}
                    </span>
                    <h3 className="text-lg xl:text-xl font-bold font-display leading-snug text-foreground line-clamp-2 mb-2">{s.title}</h3>
                    <p className="text-sm text-muted-foreground line-clamp-1">{s.meta}</p>
                    <span className="mt-3 inline-flex items-center gap-1.5 text-primary text-sm font-semibold group-hover:gap-2.5 transition-all">
                      {s.kind === "event" ? "View event" : "Read article"} <ArrowRight className="w-4 h-4" />
                    </span>
                  </div>
                </a>
              ))}
            </div>
          )}

          {/* Nav panel — right side, full height */}
          <div className="absolute top-16 bottom-4 right-4 left-4 sm:left-auto sm:w-80 flex">
            <div className={`glass shadow-elevated rounded-2xl overflow-hidden flex flex-col w-full ${open ? "nav-panel-in" : "nav-panel-out"}`}>
              <div className="nav-current" />
              <div className="p-3 flex flex-col flex-1 overflow-y-auto">
                {navItems.map((item, i) => {
                  const delay = open ? { animationDelay: `${i * 40}ms` } : undefined;
                  const cls = `block w-full text-left pl-5 pr-4 py-2.5 rounded-lg text-foreground font-medium hover:bg-muted hover:text-primary transition-colors ${open ? "nav-item" : ""}`;
                  return item.dialog ? (
                    <button
                      key={item.href}
                      type="button"
                      style={delay}
                      onClick={() => { closeMenu(); setContactOpen(true); }}
                      className={cls}
                    >
                      {item.label}
                    </button>
                  ) : (
                    <a
                      key={item.href}
                      href={linkHref(item.href)}
                      style={delay}
                      className={cls}
                      onClick={closeMenu}
                    >
                      {item.label}
                    </a>
                  );
                })}
                <a
                  href="/find-a-charger"
                  className={`block mt-auto pt-2 ${open ? "nav-item" : ""}`}
                  style={open ? { animationDelay: `${navItems.length * 40}ms` } : undefined}
                  onClick={closeMenu}
                >
                  <Button variant="default" className="w-full">Find a Charger</Button>
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Shared Contact Us popup — opened by the "Contact" nav item. Same
          <ContactForm /> as the floating ContactWidget, so leads land identically. */}
      <Dialog open={contactOpen} onOpenChange={setContactOpen}>
        <DialogContent className="sm:max-w-xl max-h-[88vh] overflow-y-auto bg-white">
          <DialogHeader className="text-left">
            <DialogTitle className="font-display text-2xl">Contact Us</DialogTitle>
            <DialogDescription>
              Have questions about EVs or want to partner with us? We'd love to hear from you.
            </DialogDescription>
          </DialogHeader>
          <div className="pt-2">
            <ContactForm idPrefix="nav-" onSuccess={() => { /* keep thank-you visible; user closes the dialog */ }} />
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
};

export default Navbar;
