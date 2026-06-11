// Dynamic Open Graph image for a shared EV-vs-Gas calculator result.
// Rendered at the edge by @vercel/og from the og* query params that
// middleware.ts forwards. 1200x630, branded — shows the two vehicles, the
// state, and the annual savings so the Facebook/LinkedIn card reflects the
// actual output, not just the page.

import { ImageResponse } from "@vercel/og";

export const config = { runtime: "edge" };

const BLUE = "#0b5fd4";
const BLUE_DEEP = "#0047a8";
const GREEN = "#2f9e57";
const AMBER = "#e8843a";

const money = (n: number) =>
  "$" + Math.max(0, Math.round(n)).toLocaleString("en-US");

export default function handler(req: Request) {
  const { searchParams } = new URL(req.url);
  const ev = (searchParams.get("ev") || "Electric Vehicle").slice(0, 40);
  const gas = (searchParams.get("gas") || "Gas Vehicle").slice(0, 40);
  const save = Number(searchParams.get("save") || "0") || 0;
  const evWins = (searchParams.get("win") || "ev") !== "gas";
  const state = (searchParams.get("state") || "U.S.").slice(0, 28);

  const accent = evWins ? GREEN : AMBER;
  const headline = evWins ? "saves about" : "costs about more than";
  const subline = evWins
    ? `per year vs the ${gas}`
    : `more per year than the ${ev} on gas`;

  return new ImageResponse(
    (
      <div
        style={{
          width: "1200px",
          height: "630px",
          display: "flex",
          flexDirection: "column",
          background: `linear-gradient(135deg, ${BLUE_DEEP} 0%, ${BLUE} 55%, ${GREEN} 130%)`,
          color: "#ffffff",
          fontFamily: "sans-serif",
          padding: "56px 64px",
        }}
      >
        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <div style={{ display: "flex", alignItems: "center", fontSize: 30, fontWeight: 800 }}>
            ⚡ Electrifying the US
          </div>
          <div
            style={{
              display: "flex",
              fontSize: 20,
              fontWeight: 700,
              letterSpacing: 2,
              textTransform: "uppercase",
              opacity: 0.85,
            }}
          >
            EV vs Gas Calculator
          </div>
        </div>

        {/* Vehicles */}
        <div style={{ display: "flex", alignItems: "center", marginTop: 48 }}>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, maxWidth: 480 }}>{ev}</div>
          <div style={{ display: "flex", fontSize: 28, fontWeight: 700, opacity: 0.8, margin: "0 22px" }}>vs</div>
          <div style={{ display: "flex", fontSize: 40, fontWeight: 800, maxWidth: 480, opacity: 0.92 }}>{gas}</div>
        </div>

        {/* Result */}
        <div style={{ display: "flex", flexDirection: "column", marginTop: "auto" }}>
          <div style={{ display: "flex", fontSize: 30, fontWeight: 600, opacity: 0.92 }}>
            The {ev} {headline}
          </div>
          <div style={{ display: "flex", alignItems: "flex-end", marginTop: 6 }}>
            <div
              style={{
                display: "flex",
                fontSize: 150,
                fontWeight: 800,
                lineHeight: 1,
                color: "#ffffff",
                background: accent,
                borderRadius: 24,
                padding: "8px 28px",
              }}
            >
              {money(save)}
            </div>
            <div style={{ display: "flex", fontSize: 34, fontWeight: 700, marginLeft: 22, marginBottom: 18 }}>
              / year
            </div>
          </div>
          <div style={{ display: "flex", fontSize: 26, opacity: 0.9, marginTop: 18 }}>
            {subline} · based on {state} energy prices
          </div>
        </div>

        {/* Footer */}
        <div style={{ display: "flex", marginTop: 34, fontSize: 22, fontWeight: 600, opacity: 0.85 }}>
          See your own savings → ElectrifyingTheUS.com
        </div>
      </div>
    ),
    { width: 1200, height: 630 },
  );
}
