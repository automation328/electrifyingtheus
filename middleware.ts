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
  matcher: [
    // Every page route (excludes /api, static assets, and any file with an
    // extension) so the home page and all other pages get a working OG card.
    "/((?!api/|assets/|og/|fonts/|.*\\.).*)",
  ],
};

// Site-wide default OG — used for the home page and any route without a more
// specific entry. Image is served origin-relative so it 200s on whatever host
// the link was shared from (subdomain, vercel.app, or the apex later).
const SITE_DEFAULT = {
  title: "Electrifying the US — EV vs Gas Calculator & Zero-Emission Mobility",
  description:
    "See how much you'd save switching to an EV — real U.S. energy prices, state by state. Plus charging, incentives, events, and multimodal e-mobility.",
  image: "/og-image.jpg",
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

function calculatorMeta(url: URL, origin: string): Meta {
  const p = url.searchParams;
  const image = origin + "/og/calculator.jpg";
  const pageUrl = origin + url.pathname + url.search;
  const ev = p.get("ogEv");
  const gas = p.get("ogGas");

  // Bare share (no result params, e.g. a copied page URL) → branded banner card.
  if (!ev || !gas) {
    return {
      title: "EV vs Gas Calculator — See how much you'll save",
      description:
        "Compare any EV against a gas car on real U.S. energy prices, state by state — fuel, maintenance, and incentives.",
      image,
      url: pageUrl,
    };
  }

  const save = Number(p.get("ogSave") || "0") || 0;
  const evWins = (p.get("ogWin") || "ev") !== "gas";
  const state = p.get("ogState") || "U.S.";

  const title = evWins
    ? `The ${ev} saves about ${money(save)}/year vs the ${gas}`
    : `${gas} runs about ${money(save)}/year cheaper than the ${ev}`;
  const description = `Compared on real ${state} energy prices. See how much you could save with an EV.`;

  // The exact result lives in the title/description (shown prominently by FB &
  // LinkedIn); the image is a branded calculator banner.
  return {
    title,
    description,
    image: origin + "/og/calculator.jpg",
    url: origin + url.pathname + url.search,
  };
}

// Self-contained password-gate page (no external assets — static assets are
// public, so the gate must stand alone). Posts to /api/gate-login, which sets
// the cookie this middleware checks, logs the IP, and Slack-notifies.
function gateHtml(): string {
  return `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta name="robots" content="noindex,nofollow">
<title>Electrifying the US — Private preview</title>
<style>
  *{box-sizing:border-box}
  body{margin:0;min-height:100vh;display:grid;place-items:center;font-family:Segoe UI,system-ui,Arial,sans-serif;
       background:linear-gradient(135deg,#0b5fd4,#1f9650);color:#fff;padding:24px}
  .card{width:100%;max-width:380px;background:rgba(255,255,255,.10);backdrop-filter:blur(10px);
        border:1px solid rgba(255,255,255,.22);border-radius:22px;padding:32px 28px;box-shadow:0 18px 50px rgba(0,0,0,.25)}
  .brand{display:flex;align-items:center;gap:10px;font-weight:800;font-size:19px;margin-bottom:18px}
  .bolt{width:38px;height:38px;border-radius:11px;background:#fff;display:grid;place-items:center;color:#0b5fd4;font-size:20px}
  h1{font-size:20px;margin:0 0 6px}
  p{margin:0 0 20px;font-size:13px;color:rgba(255,255,255,.82)}
  input{width:100%;padding:13px 14px;border-radius:12px;border:1px solid rgba(255,255,255,.3);
        background:rgba(255,255,255,.92);color:#16202c;font-size:15px;outline:none}
  input:focus{border-color:#fff;box-shadow:0 0 0 3px rgba(255,255,255,.25)}
  button{width:100%;margin-top:12px;padding:13px;border:0;border-radius:12px;background:#fff;color:#0b5fd4;
         font-weight:800;font-size:15px;cursor:pointer}
  button:disabled{opacity:.6;cursor:default}
  .err{min-height:18px;margin-top:10px;font-size:13px;font-weight:600;color:#ffd7d7}
</style></head>
<body>
  <form class="card" id="f" autocomplete="off">
    <div class="brand"><span class="bolt">&#9889;</span> Electrifying the US</div>
    <h1>Private preview</h1>
    <p>This site is password protected. Enter the password to continue.</p>
    <input id="p" type="password" placeholder="Password" autofocus aria-label="Password" />
    <button id="b" type="submit">Enter</button>
    <div class="err" id="e"></div>
  </form>
  <script>
    var f=document.getElementById('f'),p=document.getElementById('p'),b=document.getElementById('b'),e=document.getElementById('e');
    f.addEventListener('submit',async function(ev){
      ev.preventDefault();e.textContent='';b.disabled=true;b.textContent='Checking…';
      try{
        var r=await fetch('/api/gate-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({password:p.value})});
        if(r.ok){location.reload();return;}
        e.textContent='Incorrect password. Try again.';
      }catch(_){e.textContent='Something went wrong. Try again.';}
      b.disabled=false;b.textContent='Enter';p.value='';p.focus();
    });
  </script>
</body></html>`;
}

export default function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";

  // Password gate — humans (non-crawlers) must carry the gate cookie. Crawlers
  // fall through to the OG logic below so social/link previews still render.
  if (!CRAWLER.test(ua)) {
    const token = process.env.GATE_TOKEN;
    if (token) {
      const cookie = request.headers.get("cookie") || "";
      const ok = cookie.split(/; */).some((c) => c === `etu_gate=${token}`);
      if (!ok) {
        return new Response(gateHtml(), {
          status: 401,
          headers: { "content-type": "text/html; charset=utf-8", "cache-control": "no-store" },
        });
      }
    }
    return next();
  }

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

  // Dynamic (Supabase-posted) blog/event detail pages have no static entry —
  // fall back to the section's banner so the share still shows a branded
  // thumbnail rather than nothing.
  if (!meta && (path.startsWith("/events/") || path.startsWith("/blog/"))) {
    const sectionPath = path.startsWith("/events/") ? "/events" : "/news";
    const section = OG_ENTRIES.find((e) => e.path === sectionPath);
    if (section) {
      const image = section.image.startsWith("http") ? section.image : origin + section.image;
      meta = { title: section.title, description: section.description, image, url: origin + path };
    }
  }

  // Home page + any other page: branded site default (host-correct image).
  if (!meta) {
    meta = {
      title: SITE_DEFAULT.title,
      description: SITE_DEFAULT.description,
      image: origin + SITE_DEFAULT.image,
      url: origin + path,
    };
  }

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
