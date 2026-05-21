import { useEffect, useState } from "react";
import { Sparkles } from "lucide-react";

type Theme = "classic" | "glass";

const getInitial = (): Theme =>
  (typeof document !== "undefined" && document.documentElement.getAttribute("data-theme") === "glass")
    ? "glass"
    : "classic";

/**
 * Flips the entire site between the Classic look and the modern frosted-glass
 * "v2" theme by toggling data-theme="glass" on <html>. Choice is persisted.
 */
const ThemeToggle = ({ compact = false }: { compact?: boolean }) => {
  const [theme, setTheme] = useState<Theme>(getInitial);

  useEffect(() => {
    const root = document.documentElement;
    if (theme === "glass") root.setAttribute("data-theme", "glass");
    else root.removeAttribute("data-theme");
    try { localStorage.setItem("site-theme", theme); } catch { /* ignore */ }
  }, [theme]);

  const isGlass = theme === "glass";

  return (
    <button
      onClick={() => setTheme(isGlass ? "classic" : "glass")}
      aria-pressed={isGlass}
      title={isGlass ? "Switch to Classic theme" : "Switch to Glass (v2) theme"}
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition-all ${
        isGlass
          ? "bg-primary text-primary-foreground border-primary shadow-md"
          : "bg-card/70 text-foreground border-border hover:border-primary/40"
      } ${compact ? "w-full justify-center" : ""}`}
    >
      <Sparkles className="w-3.5 h-3.5" />
      {isGlass ? "Glass · v2" : "Classic"}
    </button>
  );
};

export default ThemeToggle;
