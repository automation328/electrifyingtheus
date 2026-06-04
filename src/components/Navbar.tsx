import { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import { Menu, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import logoColored from "@/assets/logo-colored.png";
import logoWhite from "@/assets/logo-white.png";

const navItems = [
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
  { label: "Contact", href: "/contact-us" },
];

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const location = useLocation();
  const isHome = location.pathname === "/";

  // Use the solid (dark-text) header style whenever scrolled, or on any
  // non-home page (which has a light background behind the navbar).
  const solid = scrolled || !isHome;

  // Absolute routes ("/path") link directly. Anchor links ("#id") live on the
  // home page; from other pages, route home first.
  const linkHref = (href: string) =>
    href.startsWith("/") ? href : isHome ? href : `/${href}`;

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
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

        {/* Desktop nav */}
        <div className="hidden lg:flex items-center gap-1">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={linkHref(item.href)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                solid
                  ? "text-foreground hover:text-primary hover:bg-muted"
                  : "text-primary-foreground/90 hover:text-primary-foreground hover:bg-primary-foreground/10"
              }`}
            >
              {item.label}
            </a>
          ))}
          <a href="/find-a-charger">
            <Button variant={solid ? "default" : "hero"} size="sm" className="ml-2">
              Find a Charger
            </Button>
          </a>
        </div>

        {/* Mobile toggle */}
        <button
          className="lg:hidden p-2 rounded-lg"
          onClick={() => setIsOpen(!isOpen)}
          aria-label="Toggle menu"
        >
          {isOpen ? (
            <X className={solid ? "text-foreground" : "text-primary-foreground"} size={24} />
          ) : (
            <Menu className={solid ? "text-foreground" : "text-primary-foreground"} size={24} />
          )}
        </button>
      </div>

      {/* Mobile menu */}
      {isOpen && (
        <div className="lg:hidden glass mt-2 mx-4 rounded-2xl p-4 animate-fade-up">
          {navItems.map((item) => (
            <a
              key={item.href}
              href={linkHref(item.href)}
              className="block px-4 py-3 rounded-lg text-foreground font-medium hover:bg-muted transition-colors"
              onClick={() => setIsOpen(false)}
            >
              {item.label}
            </a>
          ))}
          <a href="/find-a-charger" className="block mt-2">
            <Button variant="default" className="w-full">Find a Charger</Button>
          </a>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
