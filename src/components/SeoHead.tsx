// Applies a page's SEO/social override to the document head client-side (browser
// tab + JS-rendering crawlers like Googlebot); non-JS crawlers get the same
// values from middleware.ts. Crucially it also RESETS the head on unmount, so a
// custom title/card never bleeds onto the next page during SPA navigation.

import { useEffect, useRef } from "react";

// Must mirror middleware.ts SITE_DEFAULT so client + crawler heads agree.
const SITE_TITLE = "Electrifying the US — EV vs Gas Calculator & Zero-Emission Mobility";
const SITE_DESC = "See how much you'd save switching to an EV — real U.S. energy prices, state by state. Plus charging, incentives, events, and multimodal e-mobility.";
const SITE_IMAGE = "/og-image.jpg";

const absolutize = (url: string) => {
  if (!url) return url;
  if (/^https?:\/\//i.test(url)) return url;
  return (typeof window !== "undefined" ? window.location.origin : "") + url;
};

const setMeta = (attr: "name" | "property", key: string, content: string) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
};

// meta tags this component manages, mapped to the value-keys used below.
const MANAGED: { attr: "name" | "property"; key: string; valKey: string }[] = [
  { attr: "name", key: "description", valKey: "description" },
  { attr: "property", key: "og:title", valKey: "title" },
  { attr: "property", key: "og:description", valKey: "description" },
  { attr: "property", key: "og:image", valKey: "image" },
  { attr: "name", key: "twitter:title", valKey: "title" },
  { attr: "name", key: "twitter:description", valKey: "description" },
  { attr: "name", key: "twitter:image", valKey: "image" },
];

const SeoHead = ({ title, description, image }: { title?: string; description?: string; image?: string }) => {
  // Remember exactly what this instance wrote, so the reset only touches tags
  // that haven't since been overwritten by another page's SeoHead.
  const wrote = useRef<Record<string, string>>({});

  useEffect(() => {
    const vals: Record<string, string> = {
      title: title || SITE_TITLE,
      description: description || SITE_DESC,
      image: absolutize(image || SITE_IMAGE),
    };
    document.title = vals.title;
    for (const m of MANAGED) setMeta(m.attr, m.key, vals[m.valKey]);
    wrote.current = { ...vals };

    return () => {
      const mine = wrote.current;
      const def: Record<string, string> = { title: SITE_TITLE, description: SITE_DESC, image: absolutize(SITE_IMAGE) };
      if (document.title === mine.title) document.title = def.title;
      for (const m of MANAGED) {
        const el = document.head.querySelector(`meta[${m.attr}="${m.key}"]`) as HTMLMetaElement | null;
        if (el && el.getAttribute("content") === mine[m.valKey]) el.setAttribute("content", def[m.valKey]);
      }
    };
  }, [title, description, image]);

  return null;
};

export default SeoHead;
