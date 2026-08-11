// Route-level canonical / og:url / robots for the CLIENT-RENDERED path.
//
// Why this exists: middleware.ts only server-renders a meta block for user
// agents matching its CRAWLER regex (middleware.ts:34) — which lists bingbot and
// applebot but NOT googlebot. Google therefore receives the static index.html on
// every route, and index.html used to hardcode a homepage canonical, telling
// Google that every interior URL was a duplicate of "/". This component fixes
// that for the audience that actually renders JS (Googlebot does).
//
// It manages a tag set DISJOINT from SeoHead.tsx (which owns title, description,
// og:title/description/image and twitter:*), so the two can never fight over the
// same tag. Anything added here must stay out of SeoHead's MANAGED list.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/** Fixed apex origin — never window.location.origin, or preview/vercel.app and
 *  www hosts would emit canonicals pointing at themselves. */
const SITE_ORIGIN = "https://electrifyingtheus.com";

/** Paths that must never be indexed. Mirror of the noindex behaviour in
 *  middleware.ts:191 — keep the two in sync. */
const NOINDEX_PREFIXES = ["/admin", "/thank-you"];

const setLink = (rel: string, href: string) => {
  let el = document.head.querySelector(`link[rel="${rel}"]`) as HTMLLinkElement | null;
  if (!el) { el = document.createElement("link"); el.setAttribute("rel", rel); document.head.appendChild(el); }
  el.setAttribute("href", href);
};

const setMeta = (name: string, content: string) => {
  let el = document.head.querySelector(`meta[name="${name}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute("name", name); document.head.appendChild(el); }
  el.setAttribute("content", content);
};

const setProp = (property: string, content: string) => {
  let el = document.head.querySelector(`meta[property="${property}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute("property", property); document.head.appendChild(el); }
  el.setAttribute("content", content);
};

/** Canonical URL for a path: apex origin, no query, no trailing slash (except root). */
export const canonicalFor = (pathname: string): string => {
  const p = (pathname || "/").split("?")[0].split("#")[0];
  const trimmed = p.length > 1 ? p.replace(/\/+$/, "") : "/";
  return SITE_ORIGIN + trimmed;
};

export const isNoIndexPath = (pathname: string): boolean =>
  NOINDEX_PREFIXES.some((p) => pathname === p || pathname.startsWith(`${p}/`));

const SeoRouteHead = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    const url = canonicalFor(pathname);
    setLink("canonical", url);
    setProp("og:url", url);

    // Only ever ASSERT noindex; never write "index,follow" — an explicit
    // positive robots tag adds nothing and risks overriding a future directive.
    const embed = new URLSearchParams(search).get("embed") === "1";
    const robots = document.head.querySelector('meta[name="robots"]');
    if (isNoIndexPath(pathname) || embed) {
      setMeta("robots", "noindex,nofollow");
    } else if (robots) {
      robots.remove();
    }
  }, [pathname, search]);

  return null;
};

export default SeoRouteHead;
