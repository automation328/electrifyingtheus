// Vercel Edge Middleware — gives social crawlers per-page Open Graph tags so a
// shared blog/event link shows ITS thumbnail + title (Facebook, LinkedIn, X,
// WhatsApp, Slack, iMessage, …). Humans are passed straight through to the SPA.
//
// The SPA is client-rendered, so crawlers (which don't run JS) would otherwise
// only ever see the generic site card. This returns a tiny HTML document with
// the right OG/Twitter meta for known routes; the image is served origin-
// relative, so it always 200s on whatever host was crawled.

import { next } from "@vercel/edge";
import { OG_ENTRIES } from "./og-data";

export const config = {
  matcher: ["/blog/:path*", "/events/:path*"],
};

const CRAWLER =
  /facebookexternalhit|facebot|twitterbot|linkedinbot|slackbot|slack-imgproxy|whatsapp|telegrambot|discordbot|pinterest|redditbot|bingbot|embedly|vkshare|skypeuripreview|applebot|flipboard|nuzzel|iframely|google-inspectiontool|googleother/i;

const esc = (v: string) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";
  if (!CRAWLER.test(ua)) return next();

  const url = new URL(request.url);
  const path = url.pathname.replace(/\/+$/, "") || "/";
  const entry = OG_ENTRIES.find((e) => e.path === path);
  if (!entry) return next();

  const origin = url.origin;
  const img = entry.image.startsWith("http") ? entry.image : origin + entry.image;
  const pageUrl = origin + entry.path;

  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(entry.title)}</title>
<meta name="description" content="${esc(entry.description)}">
<link rel="canonical" href="${pageUrl}">
<meta property="og:site_name" content="Electrifying the US">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(entry.title)}">
<meta property="og:description" content="${esc(entry.description)}">
<meta property="og:url" content="${pageUrl}">
<meta property="og:image" content="${img}">
<meta property="og:image:secure_url" content="${img}">
<meta property="og:image:type" content="image/jpeg">
<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">
<meta property="og:image:alt" content="${esc(entry.title)}">
<meta name="twitter:card" content="summary_large_image">
<meta name="twitter:title" content="${esc(entry.title)}">
<meta name="twitter:description" content="${esc(entry.description)}">
<meta name="twitter:image" content="${img}">
</head><body>
<h1>${esc(entry.title)}</h1>
<p>${esc(entry.description)}</p>
<p><a href="${pageUrl}">View on Electrifying the US</a></p>
</body></html>`;

  return new Response(html, {
    status: 200,
    headers: {
      "content-type": "text/html; charset=utf-8",
      "cache-control": "public, s-maxage=600, max-age=600",
    },
  });
}
