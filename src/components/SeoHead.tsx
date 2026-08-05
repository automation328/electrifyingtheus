// Applies a page's SEO/social override to the document head client-side. This
// covers the browser tab title, the meta description, and og/twitter tags for
// JS-rendering crawlers (e.g. Googlebot). Non-JS social crawlers are served the
// same values by middleware.ts. Renders nothing.

import { useEffect } from "react";

const setMeta = (attr: "name" | "property", key: string, content?: string) => {
  if (!content) return;
  let el = document.head.querySelector(`meta[${attr}="${key}"]`) as HTMLMetaElement | null;
  if (!el) { el = document.createElement("meta"); el.setAttribute(attr, key); document.head.appendChild(el); }
  el.setAttribute("content", content);
};

const SeoHead = ({ title, description, image }: { title?: string; description?: string; image?: string }) => {
  useEffect(() => {
    if (title) document.title = title;
    setMeta("name", "description", description);
    setMeta("property", "og:title", title);
    setMeta("property", "og:description", description);
    setMeta("property", "og:image", image);
    setMeta("name", "twitter:title", title);
    setMeta("name", "twitter:description", description);
    setMeta("name", "twitter:image", image);
  }, [title, description, image]);
  return null;
};

export default SeoHead;
