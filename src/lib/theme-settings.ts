// CMS-editable brand colors. Stored as hex in site_settings (key='theme');
// applied site-wide by ThemeApplier, which overrides the --primary / --secondary
// CSS variables (HSL-triplet format) at :root.

import { useQuery } from "@tanstack/react-query";
import { supabase, isSupabaseConfigured } from "@/lib/supabase";

export interface ThemeSettings { primary?: string; secondary?: string; headingFont?: string; bodyFont?: string }

export const HEADING_FONTS = ["Space Grotesk", "Poppins", "Montserrat", "Playfair Display", "Oswald", "Sora", "Archivo"];
export const BODY_FONTS = ["Inter", "Roboto", "Open Sans", "Lato", "Nunito Sans", "Work Sans", "Source Sans 3"];

/** "#0057b7" → "214 100% 36%" (the HSL-triplet format the CSS vars use). */
export function hexToHslTriplet(hex: string): string | null {
  const m = /^#?([a-f\d]{2})([a-f\d]{2})([a-f\d]{2})$/i.exec(hex.trim());
  if (!m) return null;
  const r = parseInt(m[1], 16) / 255, g = parseInt(m[2], 16) / 255, b = parseInt(m[3], 16) / 255;
  const max = Math.max(r, g, b), min = Math.min(r, g, b);
  let h = 0, s = 0; const l = (max + min) / 2;
  if (max !== min) {
    const d = max - min;
    s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
    h = max === r ? (g - b) / d + (g < b ? 6 : 0) : max === g ? (b - r) / d + 2 : (r - g) / d + 4;
    h /= 6;
  }
  return `${Math.round(h * 360)} ${Math.round(s * 100)}% ${Math.round(l * 100)}%`;
}

/** "214 100% 36%" → "#0057b7" (to seed a color input from a CSS var). */
export function hslTripletToHex(triplet: string): string | null {
  const m = /([\d.]+)\s+([\d.]+)%\s+([\d.]+)%/.exec(triplet);
  if (!m) return null;
  const h = +m[1], s = +m[2] / 100, l = +m[3] / 100;
  const f = (n: number) => {
    const k = (n + h / 30) % 12;
    const a = s * Math.min(l, 1 - l);
    return Math.round(255 * (l - a * Math.max(-1, Math.min(k - 3, 9 - k, 1))));
  };
  const hex = (v: number) => v.toString(16).padStart(2, "0");
  return `#${hex(f(0))}${hex(f(8))}${hex(f(4))}`;
}

export async function fetchTheme(): Promise<ThemeSettings | null> {
  if (!supabase) return null;
  const { data, error } = await supabase.from("site_settings").select("value").eq("key", "theme").maybeSingle();
  if (error || !data) return null;
  return (data.value ?? null) as ThemeSettings | null;
}

export function useThemeSettings(): ThemeSettings | null {
  const q = useQuery({
    queryKey: ["site-setting", "theme"],
    queryFn: fetchTheme,
    enabled: isSupabaseConfigured,
    staleTime: 5 * 60 * 1000,
  });
  return q.data ?? null;
}
