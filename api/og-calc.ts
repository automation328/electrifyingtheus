// Dynamic Open Graph image for a shared EV-vs-Gas calculator result.
// Renders the actual numbers INTO a 1200x630 branded card (Facebook/LinkedIn).
//
// Runs on the Node runtime (no edge config) so it stays out of the Edge
// Middleware bundle. Fonts are fetched from the deployment's own /public so
// @vercel/og has glyphs (the default font is unavailable on Node → would 500).
// Built with React.createElement (no JSX) to avoid a jsx build flag.

import * as React from "react";
import { ImageResponse } from "@vercel/og";

const h = React.createElement;

const BLUE = "#0b5fd4";
const BLUE_DEEP = "#04317f";
const GREEN = "#2fa564";
const AMBER = "#e8843a";
const INK = "#0c1622";

const money = (n: number) => "$" + Math.max(0, Math.round(n)).toLocaleString("en-US");

type S = React.CSSProperties;
const box = (style: S, ...children: React.ReactNode[]) =>
  h("div", { style: { display: "flex", ...style } }, ...children);

let fontCache: { name: string; data: ArrayBuffer; weight: 400 | 700 | 800; style: "normal" }[] | null = null;
async function loadFonts(origin: string) {
  if (fontCache) return fontCache;
  const weights: (400 | 700 | 800)[] = [400, 700, 800];
  const datas = await Promise.all(
    weights.map((w) => fetch(`${origin}/fonts/inter-${w}.woff`).then((r) => r.arrayBuffer())),
  );
  fontCache = weights.map((w, i) => ({ name: "Inter", data: datas[i], weight: w, style: "normal" as const }));
  return fontCache;
}

export default async function handler(req: Request) {
  const url = new URL(req.url);
  const p = url.searchParams;
  const ev = (p.get("ev") || "Electric Vehicle").slice(0, 38);
  const gas = (p.get("gas") || "Gas Vehicle").slice(0, 38);
  const save = Number(p.get("save") || "0") || 0;
  const evWins = (p.get("win") || "ev") !== "gas";
  const state = (p.get("state") || "U.S.").slice(0, 28);

  const accent = evWins ? GREEN : AMBER;
  const lead = evWins ? `The ${ev} saves` : `The ${ev} costs more than the ${gas}:`;
  const sub = evWins
    ? `per year vs the ${gas}`
    : `extra per year on fuel`;

  const chip = (label: string, name: string, color: string) =>
    box(
      {
        flexDirection: "column",
        background: "rgba(255,255,255,0.12)",
        border: "1px solid rgba(255,255,255,0.22)",
        borderRadius: 18,
        padding: "16px 22px",
        minWidth: 300,
      },
      box({ fontSize: 18, fontWeight: 700, letterSpacing: 1, textTransform: "uppercase", color }, label),
      box({ fontSize: 34, fontWeight: 800, color: "#ffffff", marginTop: 4 }, name),
    );

  const element = box(
    {
      width: "1200px",
      height: "630px",
      flexDirection: "column",
      justifyContent: "space-between",
      background: `linear-gradient(135deg, ${BLUE_DEEP} 0%, ${BLUE} 52%, ${GREEN} 128%)`,
      color: "#ffffff",
      fontFamily: "Inter",
      padding: "54px 64px",
    },
    // Header
    box(
      { alignItems: "center", justifyContent: "space-between" },
      box(
        { alignItems: "center" },
        box(
          {
            width: 44, height: 44, borderRadius: 12, background: "#ffffff",
            color: BLUE, fontSize: 26, fontWeight: 800,
            alignItems: "center", justifyContent: "center", marginRight: 14,
          },
          "⚡",
        ),
        box({ fontSize: 28, fontWeight: 800 }, "Electrifying the US"),
      ),
      box(
        { fontSize: 18, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", color: "rgba(255,255,255,0.82)" },
        "EV vs Gas Calculator",
      ),
    ),
    // Vehicle chips
    box(
      { alignItems: "center" },
      chip("Electric", ev, "#bfe9cf"),
      box({ fontSize: 26, fontWeight: 800, opacity: 0.85, margin: "0 20px" }, "vs"),
      chip("Gasoline", gas, "#ffd9b8"),
    ),
    // Result
    box(
      { flexDirection: "column" },
      box({ fontSize: 30, fontWeight: 700, color: "rgba(255,255,255,0.92)" }, lead),
      box(
        { alignItems: "flex-end", marginTop: 8 },
        box(
          {
            fontSize: 132, fontWeight: 800, lineHeight: 1, color: "#ffffff",
            background: accent, borderRadius: 22, padding: "6px 30px",
            boxShadow: "0 14px 40px rgba(0,0,0,0.25)",
          },
          money(save),
        ),
        box({ fontSize: 32, fontWeight: 700, marginLeft: 20, marginBottom: 16 }, "/ year"),
      ),
      box({ fontSize: 25, fontWeight: 400, color: "rgba(255,255,255,0.9)", marginTop: 16 },
        `${sub} · based on real ${state} energy prices`),
    ),
    // Footer
    box(
      { alignItems: "center", justifyContent: "space-between", borderTop: "1px solid rgba(255,255,255,0.2)", paddingTop: 22 },
      box({ fontSize: 22, fontWeight: 700, color: "rgba(255,255,255,0.92)" }, "See your own savings"),
      box({ fontSize: 22, fontWeight: 800 }, "ElectrifyingTheUS.com"),
    ),
  );

  const fonts = await loadFonts(url.origin);
  return new ImageResponse(element, { width: 1200, height: 630, fonts });
}
