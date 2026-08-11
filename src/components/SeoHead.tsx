// Applies a page's SEO/social override to the document head client-side (browser
// tab + JS-rendering crawlers like Googlebot); non-JS crawlers get the same
// values from middleware.ts. Crucially it also RESETS the head on unmount, so a
// custom title/card never bleeds onto the next page during SPA navigation.

import { useEffect, useRef } from "react";
import { useSeoSettings } from "@/lib/seo-settings";

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
  // Site-wide defaults from the CMS (site_settings key 'seo'), falling back to
  // src/data/seo.ts. A page's own props still win, field by field.
  const seo = useSeoSettings();
  const SITE_TITLE = seo.defaultTitle;
  const SITE_DESC = seo.defaultDescription;
  const SITE_IMAGE = seo.defaultImage;

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
    // Site defaults are included: they arrive asynchronously from the CMS, and
    // without them here the head would keep the pre-fetch fallback values.
  }, [title, description, image, SITE_TITLE, SITE_DESC, SITE_IMAGE]);

  return null;
};

export default SeoHead;
