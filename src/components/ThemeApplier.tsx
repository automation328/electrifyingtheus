// Applies the CMS brand-color override site-wide by overriding the --primary /
// --secondary / --accent CSS variables at :root. Renders nothing when no theme
// override is saved (the site keeps its coded defaults).

import { useMemo } from "react";
import { useThemeSettings, hexToHslTriplet } from "@/lib/theme-settings";

const ThemeApplier = () => {
  const t = useThemeSettings();
  const css = useMemo(() => {
    if (!t) return "";
    const lines: string[] = [];
    const p = t.primary ? hexToHslTriplet(t.primary) : null;
    if (p) { lines.push(`--primary:${p}`); lines.push(`--accent:${p}`); }
    const s = t.secondary ? hexToHslTriplet(t.secondary) : null;
    if (s) { lines.push(`--secondary:${s}`); }
    return lines.length ? `:root{${lines.join(";")};}` : "";
  }, [t]);
  if (!css) return null;
  return <style>{css}</style>;
};

export default ThemeApplier;
