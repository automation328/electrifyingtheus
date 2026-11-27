// schema.org JSON-LD for search engines: Organization and WebSite on the home
// page, BlogPosting on posts, Event on event pages. Rendered by <JsonLd>.
import type { BlogPost } from "@/data/blog-posts";
import type { EventItem } from "@/data/events";

export const SITE_ORIGIN = "https://electrifyingtheus.com";
const SITE_NAME = "Electrifying the US";

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
const pad = (n: number) => String(n).padStart(2, "0");

/** Root-relative paths become absolute; data: URLs and blanks are dropped. */
export const absoluteUrl = (src?: string): string | undefined => {
  if (!src || src.startsWith("data:")) return undefined;
  if (/^https?:\/\//i.test(src)) return src;
  return src.startsWith("/") ? SITE_ORIGIN + src : undefined;
};

/** "June 25, 2026" → "2026-06-25"; undefined when it doesn't parse. */
export const isoDate = (text: string): string | undefined => {
  const d = new Date(text);
  return Number.isNaN(d.getTime()) ? undefined : `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
};

const ORGANIZATION = {
  "@type": "Organization",
  name: SITE_NAME,
  url: SITE_ORIGIN,
  logo: `${SITE_ORIGIN}/apple-touch-icon.png`,
};

export const homeLd = () => ({
  "@context": "https://schema.org",
  "@graph": [
    { ...ORGANIZATION, "@id": `${SITE_ORIGIN}/#organization` },
    { "@type": "WebSite", "@id": `${SITE_ORIGIN}/#website`, name: SITE_NAME, url: SITE_ORIGIN, publisher: { "@id": `${SITE_ORIGIN}/#organization` } },
  ],
});

export const blogPostingLd = (
  post: Pick<BlogPost, "slug" | "title" | "excerpt" | "date" | "author" | "image"> & Partial<Pick<BlogPost, "category" | "content">>,
) => {
  const url = `${SITE_ORIGIN}/blog/${post.slug}`;
  const image = absoluteUrl(post.image);
  const published = isoDate(post.date);
  const words = post.content ? plainText(post.content).split(/\s+/).filter(Boolean).length : 0;
  return {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title.slice(0, 110),
    description: post.excerpt,
    url,
    mainEntityOfPage: url,
    inLanguage: "en-US",
    ...(post.category ? { articleSection: post.category } : {}),
    ...(words ? { wordCount: words } : {}),
    ...(image ? { image } : {}),
    // No separate edit history is kept, so modified = published.
    ...(published ? { datePublished: published, dateModified: published } : {}),
    author: /electrifying/i.test(post.author || "")
      ? ORGANIZATION
      : { "@type": "Person", name: post.author || SITE_NAME },
    publisher: ORGANIZATION,
  };
};

/** Event start as ISO date from the curated month/day/year fields. */
export const eventStartDate = (e: Pick<EventItem, "month" | "day" | "year">): string | undefined => {
  const m = MONTHS.indexOf(String(e.month).toUpperCase().slice(0, 3));
  const d = Number(e.day);
  return m < 0 || !d || !e.year ? undefined : `${e.year}-${pad(m + 1)}-${pad(d)}`;
};

const ONLINE = /online|webinar|virtual|zoom/i;

/** Event descriptions are written with list markers; schema wants plain text. */
export const plainText = (text: string): string =>
  (text || "")
    .replace(/^\s*(?:[-*•]|\d+[.)])\s+/gm, "")
    .replace(/[*_`#>]+/g, "")
    .replace(/\s+/g, " ")
    .trim();

export const eventLd = (e: Pick<EventItem, "slug" | "title" | "description" | "image" | "location" | "month" | "day" | "year" | "endDate" | "registerUrl" | "external">) => {
  const startDate = eventStartDate(e);
  if (!startDate) return null; // Google rejects an Event without a start date.
  const url = `${SITE_ORIGIN}/events/${e.slug}`;
  const image = absoluteUrl(e.image);
  const online = ONLINE.test(e.location || "");
  return {
    "@context": "https://schema.org",
    "@type": "Event",
    name: e.title,
    description: plainText(e.description).slice(0, 500),
    url,
    startDate,
    endDate: e.endDate || startDate,
    eventStatus: "https://schema.org/EventScheduled",
    eventAttendanceMode: online
      ? "https://schema.org/OnlineEventAttendanceMode"
      : "https://schema.org/OfflineEventAttendanceMode",
    location: online
      ? { "@type": "VirtualLocation", url: e.registerUrl || url }
      : { "@type": "Place", name: e.location, address: e.location },
    ...(image ? { image: [image] } : {}),
    // Feed events belong to someone else; only claim the ones we run.
    ...(e.external ? {} : { organizer: ORGANIZATION }),
  };
};

/** Home › … › page. `items` are the crumbs after Home, last one = this page. */
export const breadcrumbLd = (items: { name: string; path: string }[]) => ({
  "@context": "https://schema.org",
  "@type": "BreadcrumbList",
  itemListElement: [{ name: "Home", path: "/" }, ...items].map((c, i) => ({
    "@type": "ListItem",
    position: i + 1,
    name: c.name,
    item: SITE_ORIGIN + c.path,
  })),
});

/** The interactive tools, described as free web apps. */
export const TOOL_PATHS = [
  "/calculator", "/electricity-vs-gasoline", "/gm-ev-vs-gas", "/range-map",
  "/find-a-charger", "/rebate-eligibility", "/rebates-incentives", "/assistant",
];

export const webApplicationLd = (path: string, name: string, description: string) => ({
  "@context": "https://schema.org",
  "@type": "WebApplication",
  name,
  description,
  url: SITE_ORIGIN + path,
  applicationCategory: "UtilitiesApplication",
  operatingSystem: "Any",
  isAccessibleForFree: true,
  offers: { "@type": "Offer", price: "0", priceCurrency: "USD" },
  publisher: ORGANIZATION,
});

/**
 * FAQPage from a post's "## Frequently Asked Questions" section: each "### "
 * heading is a question and the text under it, up to the next heading, is the
 * answer. Returns null when the post has no such section.
 */
export const faqLd = (markdown: string) => {
  const md = markdown.replace(/\r\n/g, "\n");
  const start = md.search(/^##\s+(Frequently Asked Questions|FAQs?)\s*$/im);
  if (start < 0) return null;
  const rest = md.slice(start).split("\n").slice(1).join("\n");
  const section = rest.split(/^##\s/m)[0];
  const qa = section.split(/^###\s+/m).slice(1).map((block) => {
    const [q, ...body] = block.split("\n");
    const answer = plainText(
      body.join("\n")
        // A trailing bold call-to-action line belongs to the page, not the answer.
        .replace(/^\*\*.*\*\*\s*$/gm, "")
        // Markdown links → their text; schema answers are plain text.
        .replace(/\[([^\]]+)\]\([^)]*\)/g, "$1"),
    );
    return { q: q.trim(), answer };
  }).filter((x) => x.q && x.answer);
  if (qa.length === 0) return null;
  return {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: qa.map(({ q, answer }) => ({
      "@type": "Question",
      name: q,
      acceptedAnswer: { "@type": "Answer", text: answer },
    })),
  };
};
