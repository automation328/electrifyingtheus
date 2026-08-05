// Applies CMS brand overrides site-wide: brand colors (via the --primary /
// --secondary / --accent CSS variables) and optional heading/body fonts (loaded
// from Google Fonts and applied to body + headings). Renders nothing extra when
// no override is saved (the site keeps its coded defaults).

import { useEffect, useMemo } from "react";
import { useThemeSettings, hexToHslTriplet } from "@/lib/theme-settings";

const ThemeApplier = () => {
  const t = useThemeSettings();

  // Load selected Google Fonts (if any) via a <link> we manage.
  useEffect(() => {
    const fams = [t?.headingFont, t?.bodyFont].filter(Boolean) as string[];
    if (!fams.length) return;
    const link = document.createElement("link");
    link.rel = "stylesheet";
    link.href = `https://fonts.googleapis.com/css2?${fams.map((f) => `family=${f.replace(/ /g, "+")}:wght@400;500;600;700`).join("&")}&display=swap`;
    document.head.appendChild(link);
    return () => { link.remove(); };
  }, [t?.headingFont, t?.bodyFont]);

  const css = useMemo(() => {
    if (!t) return "";
    const parts: string[] = [];
    const vars: string[] = [];
    const p = t.primary ? hexToHslTriplet(t.primary) : null;
    if (p) { vars.push(`--primary:${p}`); vars.push(`--accent:${p}`); }
    const s = t.secondary ? hexToHslTriplet(t.secondary) : null;
    if (s) vars.push(`--secondary:${s}`);
    if (vars.length) parts.push(`:root{${vars.join(";")};}`);
    if (t.bodyFont) parts.push(`body{font-family:'${t.bodyFont}',Inter,system-ui,sans-serif;}`);
    if (t.headingFont) parts.push(`.font-display,.font-brief,h1,h2,h3,h4{font-family:'${t.headingFont}','Space Grotesk',system-ui,sans-serif !important;}`);
    return parts.join("");
  }, [t]);

  if (!css) return null;
  return <style>{css}</style>;
};

export default ThemeApplier;
