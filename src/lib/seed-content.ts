// Maps the curated static content (src/data/*) into the same row shape the CMS
// collections use, so the managers can show "built-in" items alongside DB rows
// (the merged view). Editing a built-in item adopts it into the database.
//
// `keyOf` computes a stable identity for de-duping a built-in item against a DB
// row that already overrides it.

import { BLOG_POSTS } from "@/data/blog-posts";
import { EVENTS } from "@/data/events";
import { vehicles } from "@/data/vehicles";
import { FEDERAL, STATE_INCENTIVES, UTILITY_INCENTIVES, type Incentive } from "@/data/incentives";
import { GALLERY_PHOTOS, GALLERY_VIDEOS } from "@/data/gallery";

export type SeedRow = Record<string, unknown> & { __static?: true };

const MONTHS = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

export const blogStaticRows = (): SeedRow[] =>
  BLOG_POSTS.map((p) => ({
    __static: true,
    slug: p.slug, title: p.title, excerpt: p.excerpt, category: p.category,
    author: p.author, date: p.date, read_time: p.readTime, image: p.image ?? "",
    featured: !!p.featured, content: p.content, status: p.hidden ? "draft" : "published",
  }));

export const eventStaticRows = (): SeedRow[] =>
  EVENTS.map((e) => ({
    __static: true,
    event_date: `${e.year}-${String(MONTHS.indexOf(e.month) + 1).padStart(2, "0")}-${String(e.day).padStart(2, "0")}`,
    end_date: e.endDate ?? null,
    title: e.title, type: e.type, location: e.location, region: e.region, time: e.time,
    description: e.description, image: typeof e.image === "string" ? e.image : "", featured: !!e.featured, status: "published",
  }));

export const vehicleStaticRows = (): SeedRow[] =>
  vehicles.map((v) => ({
    __static: true,
    vehicle_id: v.id, name: v.name, type: v.type, msrp: v.msrp,
    mpg: v.mpg ?? null, mpge: v.mpge ?? null, kwh_per_100mi: v.kwhPer100mi ?? null,
    maintenance_cost_per_mile: v.maintenanceCostPerMile, insurance_annual: v.insuranceAnnual,
    depreciation_rate: v.depreciationRate, category: v.category, image: v.image ?? "",
    body_style: v.bodyStyle ?? "", size_class: v.sizeClass ?? null, seats: v.seats ?? null,
    drivetrain: v.drivetrain ?? "", range_mi: v.rangeMi ?? null,
    performance: !!v.performance, luxury: !!v.luxury, hidden: false, status: "published",
  }));

const incRow = (scope: string, state: string | null, category: string | null, i: Incentive): SeedRow => ({
  __static: true, scope, state, category,
  name: i.name, jurisdiction: i.jurisdiction, amount: i.amount ?? "",
  income: !!i.income, used: !!i.used, description: i.desc, link: i.link, status: "published",
});

export const incentiveStaticRows = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  for (const [cat, list] of Object.entries(FEDERAL)) for (const i of list ?? []) rows.push(incRow("federal", null, cat, i));
  for (const [st, cats] of Object.entries(STATE_INCENTIVES)) for (const [cat, list] of Object.entries(cats)) for (const i of list ?? []) rows.push(incRow("state", st, cat, i));
  for (const [st, list] of Object.entries(UTILITY_INCENTIVES)) for (const i of list ?? []) rows.push(incRow("utility", st, null, i));
  return rows;
};

export const galleryStaticRows = (): SeedRow[] => {
  const rows: SeedRow[] = [];
  GALLERY_PHOTOS.forEach((p, i) => rows.push({ __static: true, kind: "photo", title: p.caption ?? p.alt ?? "", album: "", url: p.src, poster: "", provider: "", sort: i, status: "published" }));
  GALLERY_VIDEOS.forEach((v, i) => rows.push({ __static: true, kind: "video", title: v.title ?? "", album: "", url: v.id ?? v.src ?? "", poster: v.poster ?? "", provider: v.provider ?? "", sort: i, status: "published" }));
  return rows;
};
