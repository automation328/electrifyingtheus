// Vercel Edge Middleware — gives social crawlers per-page Open Graph tags so a
// shared link shows the right preview (Facebook, LinkedIn, X, WhatsApp, Slack,
// iMessage, …). Humans are passed straight through to the SPA.
//
//  • /blog/* and /events/*  → that post's thumbnail + title (from og-data.ts)
//  • /electricity-vs-gasoline → a RESULT card: a dynamic /api/og-calc image
//    rendered from the og* params the share URL carries (vehicles, state, savings)
//
// The SPA is client-rendered, so crawlers (no JS) would otherwise only ever see
// the generic site card.

import { next } from "@vercel/edge";
import { OG_ENTRIES } from "./og-data";

export const config = {
  matcher: ["/blog/:path*", "/events/:path*", "/electricity-vs-gasoline"],
};

const CRAWLER =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|slack-imgproxy|whatsapp|telegrambot|discordbot|pinterest|redditbot|bingbot|embedly|vkshare|skypeuripreview|applebot|flipboard|nuzzel|iframely|google-inspectiontool|googleother/i;

const esc = (v: string) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (n: number) => "$" + Math.max(0, Math.round(n)).toLocaleString("en-US");

interface Meta { title: string; description: string; image: string; url: string; }

function calculatorMeta(url: URL, origin: string): Meta | null {
  const p = url.searchParams;
  const ev = p.get("ogEv");
  const gas = p.get("ogGas");
  if (!ev || !gas) return null; // bare page share → fall back to generic site card
  const save = Number(p.get("ogSave") || "0") || 0;
  const evWins = (p.get("ogWin") || "ev") !== "gas";
  const state = p.get("ogState") || "U.S.";

  const title = evWins
    ? `The ${ev} saves about ${money(save)}/year vs the ${gas}`
    : `${gas} runs about ${money(save)}/year cheaper than the ${ev}`;
  const description = `Compared on real ${state} energy prices. See how much you could save with an EV.`;

  const img = new URL(origin + "/api/og-calc");
  img.searchParams.set("ev", ev);
  img.searchParams.set("gas", gas);
  img.searchParams.set("save", String(Math.round(save)));
  img.searchParams.set("win", evWins ? "ev" : "gas");
  img.searchParams.set("state", state);

  // og:url keeps the full result params so a click reopens the exact comparison.
  return {
    title,
    description,
    image: img.toString(),
    url: origin + url.pathname + url.search,
  };
}

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  if (!CRAWLER.test(ua)) return next();

  const url = new URL(request.url);
  const origin = url.origin;
  const path = url.pathname.replace(/\/+$/, "") || "/";

  let meta: Meta | null = null;

  if (path === "/electricity-vs-gasoline") {
    meta = calculatorMeta(url, origin);
  } else {
    const entry = OG_ENTRIES.find((e) => e.path === path);
    if (entry) {
      const image = entry.image.startsWith("http") ? entry.image : origin + entry.image;
      meta = { title: entry.title, description: entry.description, image, url: origin + entry.path };
    }
  }

  if (!meta) return next();

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${esc(meta.url)}">
<meta property="og:site_name" content="Electrifying the US">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${esc(meta.url)}">
<meta property="og:image" content="${esc(meta.image)}">
<meta property="og:image:secure_url" content="${esc(meta.image)}">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(meta.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(meta.title)}">
<meta name="twitter:description" content="${esc(meta.description)}">
<meta name="twitter:image" content="${esc(meta.image)}">
</head><body>
<h1>${esc(meta.title)}</h1>
<p>${esc(meta.description)}</p>
<p><a href="${esc(meta.url)}">View on Electrifying the US</a></p>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=600, max-age=600",
    },
  });
}
