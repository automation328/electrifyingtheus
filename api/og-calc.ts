// Dynamic Open Graph image for a shared EV-vs-Gas calculator result.
// Rendered by @vercel/og from the og* query params middleware.ts forwards.
// 1200x630, branded — shows the two vehicles, the state, and the annual savings
// so the Facebook/LinkedIn card reflects the actual output, not just the page.
//
// Built with React.createElement (no JSX) so it compiles without a jsx flag in
// the Vercel Functions builder.

import * as React from "react";
import { ImageResponse } from "@vercel/og";

const h = React.createElement;

const BLUE = "#0b5fd4";
const BLUE_DEEP = "#0047a8";
const GREEN = "#2f9e57";
const AMBER = "#e8843a";

const money = (n: number) => "$" + Math.max(0, Math.round(n)).toLocaleString("en-US");

type S = React.CSSProperties;
const box = (style: S, ...children: React.ReactNode[]) =>
  h("div", { style: { display: "flex", ...style } }, ...children);

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const ev = (searchParams.get("ev") || "Electric Vehicle").slice(0, 40);
  const gas = (searchParams.get("gas") || "Gas Vehicle").slice(0, 40);
  const save = Number(searchParams.get("save") || "0") || 0;
  const evWins = (searchParams.get("win") || "ev") !== "gas";
  const state = (searchParams.get("state") || "U.S.").slice(0, 28);

  const accent = evWins ? GREEN : AMBER;
  const headline = evWins ? `The ${ev} saves about` : `The ${ev} costs about more than the ${gas} —`;
  const subline = evWins
    ? `per year vs the ${gas} · based on ${state} energy prices`
    : `more per year on fuel · based on ${state} energy prices`;

  const element = box(
    {
      width: "1200px",
      height: "630px",
      flexDirection: "column",
      background: `linear-gradient(135deg, ${BLUE_DEEP} 0%, ${BLUE} 55%, ${GREEN} 130%)`,
      color: "#ffffff",
      fontFamily: "sans-serif",
      padding: "56px 64px",
    },
    // Header
    box(
      { alignItems: "center", justifyContent: "space-between" },
      box({ fontSize: 30, fontWeight: 800 }, "⚡ Electrifying the US"),
      box(
        { fontSize: 20, fontWeight: 700, letterSpacing: 2, textTransform: "uppercase", opacity: 0.85 },
        "EV vs Gas Calculator",
      ),
    ),
    // Vehicles
    box(
      { alignItems: "center", marginTop: 48 },
      box({ fontSize: 40, fontWeight: 800, maxWidth: 480 }, ev),
      box({ fontSize: 28, fontWeight: 700, opacity: 0.8, margin: "0 22px" }, "vs"),
      box({ fontSize: 40, fontWeight: 800, maxWidth: 480, opacity: 0.92 }, gas),
    ),
    // Result
    box(
      { flexDirection: "column", marginTop: "auto" },
      box({ fontSize: 30, fontWeight: 600, opacity: 0.92 }, headline),
      box(
        { alignItems: "flex-end", marginTop: 6 },
        box(
          {
            fontSize: 150,
            fontWeight: 800,
            lineHeight: 1,
            color: "#ffffff",
            background: accent,
            borderRadius: 24,
            padding: "8px 28px",
          },
          money(save),
        ),
        box({ fontSize: 34, fontWeight: 700, marginLeft: 22, marginBottom: 18 }, "/ year"),
      ),
      box({ fontSize: 26, opacity: 0.9, marginTop: 18 }, subline),
    ),
    // Footer
    box({ marginTop: 34, fontSize: 22, fontWeight: 600, opacity: 0.85 }, "See your own savings → ElectrifyingTheUS.com"),
  );

  return new ImageResponse(element, { width: 1200, height: 630 });
}
