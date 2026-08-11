// Site-wide SEO defaults — the code fallback beneath the CMS.
//
// Precedence, applied FIELD BY FIELD (never whole-object, or a partially filled
// CMS row would blank real values):
//   page override (site_pages.content.seo)  >  site_settings['seo']  >  SEO_DEFAULT
//
// These values are the single source of truth for the site-level head. They are
// currently duplicated in index.html (static bytes served to non-JS crawlers)
// and middleware.ts SITE_DEFAULT (social crawler stub) — keep those in sync when
// changing anything here.

export interface SeoSettings {
  /** Brand name, used in title templates and og:site_name. */
  siteName: string;
  /** Title pattern for interior pages; %s is replaced by the page title. */
  titleTemplate: string;
  /** Title used when a page supplies none (home page / fallback). */
  defaultTitle: string;
  /** Meta description used when a page supplies none. */
  defaultDescription: string;
  /** Social share image; root-relative is fine, it gets absolutized. */
  defaultImage: string;
  /** Twitter/X handle for twitter:site, e.g. "@electrifyingus". */
  twitterSite?: string;
}

export const SEO_DEFAULT: SeoSettings = {
  siteName: "Electrifying the US",
  titleTemplate: "%s — Electrifying the US",
  defaultTitle: "Electrifying the US — EV vs Gas Calculator & Zero-Emission Mobility",
  defaultDescription:
    "See how much you'd save switching to an EV — real U.S. energy prices, state by state. Plus charging, incentives, events, and multimodal e-mobility.",
  defaultImage: "/og-image.jpg",
  twitterSite: "",
};

/** Apply the title template to a page title. An empty template, or one missing
 *  %s, falls back to the raw title — so a mis-typed template can never blank a
 *  page's title. */
export function applyTitleTemplate(pageTitle: string | undefined, s: SeoSettings): string {
  const t = (pageTitle ?? "").trim();
  if (!t) return s.defaultTitle || SEO_DEFAULT.defaultTitle;
  const tpl = s.titleTemplate || "";
  return tpl.includes("%s") ? tpl.replace("%s", t) : t;
}
