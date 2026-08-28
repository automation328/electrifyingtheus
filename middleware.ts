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
import { OG_ENTRIES } from "./og-data.js";
import { SITEMAP_STATIC, isSitemapExcluded } from "./sitemap-urls.js";

export const config = {
  matcher: [
    // Every page route (excludes /api, static assets, and any file with an
    // extension) so the home page and all other pages get a working OG card.
    "/((?!api/|assets/|og/|fonts/|.*\\.).*)",
    // Dotted paths are excluded by the pattern above, so /sitemap.xml must be
    // listed explicitly or it falls through to the SPA rewrite and returns HTML.
    "/sitemap.xml",
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

// Tool pages that may be embedded chrome-free (`?embed=1`) on third-party sites.
// These requests carry no gate cookie, so they bypass the password gate below —
// scoped to these exact paths so the rest of the site stays private.
const EMBED_TOOL_PATHS = new Set([
  "/calculator",
  "/electricity-vs-gasoline",
  "/gm-ev-vs-gas",
  "/find-a-charger",
  "/rebates-incentives",
  "/assistant",
]);

const esc = (v: string) =>
  String(v ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const money = (n: number) => "$" + Math.max(0, Math.round(n)).toLocaleString("en-US");

interface Meta { title: string; description: string; image: string; url: string; knownSize?: boolean; }

// ── Main-image resolution ──────────────────────────────────────────────────
// So a shared blog/event link previews with the POST'S OWN cover / the EVENT'S
// OWN flyer (from the DB) rather than a generic section banner.
const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
// Mirrors src/data/events.ts slugify (keep in sync).
const slugify = (s: string): string =>
  String(s ?? "").toLowerCase().normalize("NFKD").replace(/[^a-z0-9\s-]/g, "").trim()
    .replace(/[\s_-]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 60).replace(/-+$/g, "");
// Mirrors src/lib/content.ts fallbackSlug for a DB event (no slug column).
const eventSlugFor = (title: string, eventDate: string): string => {
  const [y, m, d] = String(eventDate ?? "").split("-");
  const month = (MONTHS[Number(m) - 1] ?? "").toLowerCase();
  const day = String(Number(d) || 0).padStart(2, "0");
  return `${slugify(title)}-${month}-${day}-${y}`;
};

const SITEMAP_ORIGIN = "https://electrifyingtheus.com";

/** Published CMS URLs. Best-effort: returns [] on any error or timeout, so the
 *  sitemap degrades to the build-time list rather than failing. */
async function fetchCmsSitemapPaths(): Promise<string[]> {
  const base = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !anon) return [];
  const headers = { apikey: anon, authorization: `Bearer ${anon}` };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 1500);
  const out: string[] = [];
  try {
    const [pages, posts, events] = await Promise.all([
      fetch(`${base}/rest/v1/site_pages?status=eq.published&select=path`, { headers, signal: ctrl.signal }),
      fetch(`${base}/rest/v1/site_blog_posts?status=eq.published&select=slug`, { headers, signal: ctrl.signal }),
      fetch(`${base}/rest/v1/site_events?status=eq.published&select=title,event_date`, { headers, signal: ctrl.signal }),
    ]);
    if (pages.ok) {
      for (const r of (await pages.json()) as Array<{ path?: string }>) {
        if (r?.path?.startsWith("/")) out.push(r.path);
      }
    }
    if (posts.ok) {
      for (const r of (await posts.json()) as Array<{ slug?: string }>) {
        if (r?.slug) out.push(`/blog/${r.slug}`);
      }
    }
    if (events.ok) {
      // site_events has no slug column — the URL is derived from title + date,
      // the same way the OG lookup resolves an event (see eventSlugFor above).
      for (const r of (await events.json()) as Array<{ title?: string; event_date?: string }>) {
        if (r?.title) out.push(`/events/${eventSlugFor(r.title, r.event_date ?? "")}`);
      }
    }
  } catch {
    return [];
  } finally {
    clearTimeout(timer);
  }
  return out;
}

/** <urlset> for /sitemap.xml: build-time URLs ∪ published CMS URLs. */
async function buildSitemapXml(): Promise<string> {
  const cms = await fetchCmsSitemapPaths();
  const paths = [...new Set([...SITEMAP_STATIC, ...cms])]
    .filter((p) => p.startsWith("/") && !isSitemapExcluded(p))
    .sort();
  const urls = paths
    .map((p) => `  <url><loc>${esc(SITEMAP_ORIGIN + (p === "/" ? "/" : p.replace(/\/+$/, "")))}</loc></url>`)
    .join("\n");
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${urls}\n</urlset>\n`;
}

// Best-effort: the page's main image + title/description from the DB. Guarded
// (timeout + try/catch) so any failure leaves the static fallback untouched.
async function fetchContentMain(path: string): Promise<Partial<Meta> | null> {
  const base = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !anon) return null;
  const headers = { apikey: anon, authorization: `Bearer ${anon}` };
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 900);
  try {
    if (path.startsWith("/blog/")) {
      const slug = path.slice("/blog/".length);
      const res = await fetch(`${base}/rest/v1/site_blog_posts?slug=eq.${encodeURIComponent(slug)}&status=eq.published&select=image,title,excerpt&limit=1`, { headers, signal: ctrl.signal });
      if (res.ok) {
        const rows = (await res.json()) as Array<{ image?: string; title?: string; excerpt?: string }>;
        const r = Array.isArray(rows) ? rows[0] : null;
        if (r) return { image: r.image, title: r.title, description: r.excerpt };
      }
    } else if (path.startsWith("/events/")) {
      const slug = path.slice("/events/".length);
      const res = await fetch(`${base}/rest/v1/site_events?status=eq.published&select=image,title,event_date,description`, { headers, signal: ctrl.signal });
      if (res.ok) {
        const rows = await res.json();
        // Match the fallback slug (new CMS events) OR the clean title slug (a
        // curated event overridden via the CMS adopts slugify(title)).
        const r = Array.isArray(rows)
          ? rows.find((e: { title: string; event_date: string }) => eventSlugFor(e.title, e.event_date) === slug || slugify(e.title) === slug)
          : null;
        if (r) return { image: r.image, title: r.title, description: r.description };
      }
    }
    return null;
  } catch { return null; } finally { clearTimeout(timer); }
}

// Best-effort: pull a published page's editor-set SEO (site_pages.content.seo)
// so social crawlers get the same title/description/share-image an editor set in
// the CMS. Fully guarded (timeout + try/catch) — any failure leaves the static
// OG fallback untouched.
async function fetchPageSeo(path: string): Promise<Partial<Meta> | null> {
  const base = process.env.VITE_SUPABASE_URL;
  const anon = process.env.VITE_SUPABASE_ANON_KEY;
  if (!base || !anon) return null;
  try {
    const ctrl = new AbortController();
    const timer = setTimeout(() => ctrl.abort(), 800);
    const res = await fetch(
      `${base}/rest/v1/site_pages?path=eq.${encodeURIComponent(path)}&status=eq.published&select=content,title`,
      { headers: { apikey: anon, authorization: `Bearer ${anon}` }, signal: ctrl.signal },
    );
    clearTimeout(timer);
    if (!res.ok) return null;
    const rows = await res.json();
    const row = Array.isArray(rows) ? rows[0] : null;
    if (!row) return null;
    const seo = row.content?.seo ?? {};
    const out: Partial<Meta> = {};
    if (seo.title) out.title = seo.title;
    else if (row.content?.title) out.title = `${row.content.title} — Electrifying the US`;
    else if (row.title) out.title = row.title;
    if (seo.description) out.description = seo.description;
    else if (typeof row.content?.intro === "string") out.description = row.content.intro.slice(0, 200);
    if (seo.image) out.image = seo.image;
    // Else use the page's own hero image (if the editor set one) as the share image.
    else if (typeof row.content?.heroImage === "string" && /^https?:\/\//.test(row.content.heroImage)) out.image = row.content.heroImage;
    return Object.keys(out).length ? out : null;
  } catch { return null; }
}

function calculatorMeta(url: URL, origin: string): Meta {
  const p = url.searchParams;
  const image = origin + "/og/calculator.jpg";
  const pageUrl = origin + url.pathname + url.search;
  const ev = p.get("ogEv");
  const gas = p.get("ogGas");
  const isGm = url.pathname.replace(/\/+$/, "") === "/gm-ev-vs-gas";

  // Bare share (no result params, e.g. a copied page URL) → branded banner card.
  if (!ev || !gas) {
    return {
      title: isGm
        ? "GM EV vs Gas Cost Calculator — See how much you'll save"
        : "EV vs Gas Calculator — See how much you'll save",
      description: isGm
        ? "Compare a GM EV — Equinox EV, Silverado EV, Cadillac LYRIQ and more — against your gas car on real U.S. energy prices, state by state."
        : "Compare any EV against a gas car on real U.S. energy prices, state by state — fuel, maintenance, and incentives.",
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
    <p>This site is private. Sign in with your email and password to continue.</p>
    <input id="m" type="email" placeholder="Email" autofocus autocomplete="username" aria-label="Email" style="margin-bottom:10px" />
    <input id="p" type="password" placeholder="Password" autocomplete="current-password" aria-label="Password" />
    <button id="b" type="submit">Sign in</button>
    <div class="err" id="e"></div>
    <p style="margin:16px 0 0;font-size:11px;line-height:1.55;color:rgba(255,255,255,.72)">
      Confidential pre-launch preview. Your login is personal to you — do not share it,
      and do not share any information from this site before launch. Sign-ins are logged.
    </p>
  </form>
  <script>
    var f=document.getElementById('f'),m=document.getElementById('m'),p=document.getElementById('p'),b=document.getElementById('b'),e=document.getElementById('e');
    f.addEventListener('submit',async function(ev){
      ev.preventDefault();e.textContent='';b.disabled=true;b.textContent='Checking…';
      try{
        var r=await fetch('/api/gate-login',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({email:m.value,password:p.value})});
        if(r.ok){location.reload();return;}
        e.textContent='Incorrect email or password. Try again.';
      }catch(_){e.textContent='Something went wrong. Try again.';}
      b.disabled=false;b.textContent='Sign in';p.value='';p.focus();
    });
  </script>
</body></html>`;
}

export default async function middleware(request: Request) {
  const ua = request.headers.get("user-agent") || "";

  // /sitemap.xml is served here rather than as a serverless function (11 of the
  // 12 Hobby function slots are already used — see api/admin.ts). It must be
  // handled BEFORE the password gate below, or the gate would 401 it.
  if (new URL(request.url).pathname === "/sitemap.xml") {
    return new Response(await buildSitemapXml(), {
      headers: {
        "content-type": "application/xml; charset=utf-8",
        "cache-control": "public, s-maxage=3600, stale-while-revalidate=86400",
      },
    });
  }

  // Embedded tool requests (`?embed=1` on an EMBED_TOOL_PATHS route) skip the
  // gate so third-party iframes render instead of the 401 sign-in page.
  const reqUrl = new URL(request.url);
  const reqPath = reqUrl.pathname.replace(/\/+$/, "") || "/";
  const isEmbed =
    reqUrl.searchParams.get("embed") === "1" && EMBED_TOOL_PATHS.has(reqPath);

  // Password gate — humans (non-crawlers) must carry the gate cookie. Crawlers
  // fall through to the OG logic below so social/link previews still render.
  if (!CRAWLER.test(ua)) {
    const token = process.env.GATE_TOKEN;
    if (token && !isEmbed) {
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

  if (path === "/electricity-vs-gasoline" || path === "/gm-ev-vs-gas") {
    meta = calculatorMeta(url, origin);
  } else {
    const entry = OG_ENTRIES.find((e) => e.path === path);
    if (entry) {
      const image = entry.image.startsWith("http") ? entry.image : origin + entry.image;
      meta = { title: entry.title, description: entry.description, image, url: origin + entry.path };
    }
  }

  // Dynamic (CMS) blog/event detail pages have no curated entry — use the post's
  // OWN cover / the event's OWN flyer from the DB. Fall back to the section
  // banner only if the item has no usable image.
  if (!meta && (path.startsWith("/events/") || path.startsWith("/blog/"))) {
    const main = await fetchContentMain(path);
    const section = OG_ENTRIES.find((e) => e.path === (path.startsWith("/events/") ? "/events" : "/news"));
    if (main && typeof main.image === "string" && /^https?:\/\//.test(main.image)) {
      meta = {
        title: main.title || section?.title || SITE_DEFAULT.title,
        description: (main.description || section?.description || SITE_DEFAULT.description).slice(0, 200),
        image: main.image,
        url: origin + path,
        knownSize: false, // a raw cover/flyer isn't guaranteed 1200×630
      };
    } else if (section) {
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

  // Editor-set SEO wins over the static fallback (skip the calculator, whose
  // cards are computed from the share URL's result params).
  if (path !== "/electricity-vs-gasoline" && path !== "/gm-ev-vs-gas") {
    const override = await fetchPageSeo(path);
    if (override) {
      if (override.title) meta.title = override.title;
      if (override.description) meta.description = override.description;
      if (override.image) { meta.image = override.image.startsWith("http") ? override.image : origin + override.image; meta.knownSize = false; }
    }
  }

  // The icon links matter here, not just in index.html. Crawlers matched by
  // CRAWLER never see the SPA shell — they get THIS head and nothing else, and
  // it declared no icon at all, leaving them to fall back to whatever sits at
  // the root /favicon.ico. That fallback was the scaffold logo for months.
  // (Plain Googlebot is not in CRAWLER and gets the real index.html, so Google
  // was reaching the same wrong file by the other route.)
  const html = `<!doctype html><html lang="en"><head><meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<title>${esc(meta.title)}</title>
<meta name="description" content="${esc(meta.description)}">
<link rel="canonical" href="${esc(meta.url)}">
<link rel="icon" href="/favicon.ico" sizes="any">
<link rel="icon" type="image/png" href="/favicon.png">
<link rel="apple-touch-icon" href="/apple-touch-icon.png">
<meta property="og:site_name" content="Electrifying the US">
<meta property="og:type" content="article">
<meta property="og:title" content="${esc(meta.title)}">
<meta property="og:description" content="${esc(meta.description)}">
<meta property="og:url" content="${esc(meta.url)}">
<meta property="og:image" content="${esc(meta.image)}">
<meta property="og:image:secure_url" content="${esc(meta.image)}">
${meta.knownSize === false ? "" : `<meta property="og:image:width" content="1200">
<meta property="og:image:height" content="630">`}
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
