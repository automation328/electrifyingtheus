// Field/display config for each CMS collection. The generic CollectionManager
// renders the list + editor from these. Field names map 1:1 to the Supabase
// column names (see supabase/migrations/0001,0003,0004).

import type { CollectionConfig } from "./types";
import { blogStaticRows, eventStaticRows, vehicleStaticRows, incentiveStaticRows, galleryStaticRows } from "@/lib/seed-content";

const STATUS = ["draft", "published", "archived"];
const str = (v: unknown) => String(v ?? "");
const statusField = "status";

const asNum = (v: unknown) => Number(v ?? 0) || 0;
const asStr = (v: unknown) => String(v ?? "");

export const blogConfig: CollectionConfig = {
  table: "site_blog_posts",
  singular: "Post",
  plural: "Blog posts",
  titleField: "title",
  subtitleFields: ["category", "date", "author"],
  imageField: "image",
  statusField,
  statusOptions: STATUS,
  staticRows: blogStaticRows,
  keyOf: (r) => str(r.slug),
  viewUrl: (r) => (r.slug ? `/blog/${str(r.slug)}` : "/news"),
  editOnPage: true,   // BlogPost carries the block builder (InlinePageEditor)
  sortRows: (a, b) => asStr(b.published_at).localeCompare(asStr(a.published_at)),
  fields: [
    { name: "title", label: "Title", type: "text", required: true, width: "full" },
    { name: "slug", label: "Slug", type: "text", required: true, width: "full", help: "URL path segment, e.g. real-cost-of-going-electric. Must be unique." },
    { name: "excerpt", label: "Excerpt", type: "textarea", help: "One or two sentences shown in the news list + link previews." },
    { name: "category", label: "Category", type: "text", defaultValue: "News", width: "half" },
    { name: "author", label: "Author", type: "text", defaultValue: "Electrifying the US Team", width: "half" },
    { name: "date", label: "Display date", type: "text", placeholder: "May 18, 2026", width: "half", help: "Human-readable date shown on the post." },
    { name: "published_at", label: "Publish date", type: "date", width: "half", help: "Machine-sortable date (controls ordering)." },
    { name: "read_time", label: "Read time", type: "text", defaultValue: "3 min read", width: "half" },
    { name: "image", label: "Cover image", type: "image" },
    { name: "featured", label: "Featured", type: "boolean", help: "Highlight on the news page." },
    { name: "content", label: "Body (Markdown)", type: "markdown", required: true, help: "Supports GitHub-flavored Markdown, including tables." },
  ],
};

export const eventsConfig: CollectionConfig = {
  table: "site_events",
  singular: "Event",
  plural: "Events",
  titleField: "title",
  subtitleFields: ["event_date", "location"],
  imageField: "image",
  statusField,
  statusOptions: STATUS,
  staticRows: eventStaticRows,
  keyOf: (r) => `${str(r.title)}|${str(r.event_date)}`,
  viewUrl: () => "/events",
  sortRows: (a, b) => asStr(b.event_date).localeCompare(asStr(a.event_date)),
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "event_date", label: "Date", type: "date", required: true, width: "half" },
    { name: "type", label: "Type", type: "text", defaultValue: "Event", width: "half", help: "Ride & Drive, Webinar, Expo…" },
    { name: "time", label: "Time", type: "text", placeholder: "10:00 AM – 4:00 PM EDT", width: "half" },
    { name: "location", label: "Location", type: "text", width: "half", help: "Full venue line." },
    { name: "region", label: "Region", type: "text", help: "City/region used for local event alerts." },
    { name: "description", label: "Description", type: "textarea" },
    { name: "image", label: "Image", type: "image" },
    { name: "featured", label: "Featured", type: "boolean" },
  ],
};

export const galleryConfig: CollectionConfig = {
  table: "site_gallery",
  singular: "Gallery item",
  plural: "Gallery",
  titleField: "title",
  subtitleFields: ["kind", "album"],
  imageField: "url",
  description: "Your public gallery page — curate it from the Media library, or add items by hand.",
  mediaImport: (m) => ({ kind: m.kind, url: m.url, title: m.name.replace(/\.[^.]+$/, "").replace(/[-_]+/g, " "), album: "", poster: "", provider: m.kind === "video" ? "file" : "", sort: 0, status: "published" }),
  viewUrl: () => "/gallery",
  statusField,
  statusOptions: STATUS,
  staticRows: galleryStaticRows,
  keyOf: (r) => `${str(r.kind)}|${str(r.url)}`,
  sortRows: (a, b) => asNum(a.sort) - asNum(b.sort),
  fields: [
    { name: "kind", label: "Kind", type: "select", options: [{ value: "photo", label: "Photo" }, { value: "video", label: "Video" }], defaultValue: "photo", width: "half" },
    { name: "provider", label: "Video provider", type: "select", options: [{ value: "", label: "—" }, { value: "youtube", label: "YouTube" }, { value: "vimeo", label: "Vimeo" }, { value: "file", label: "File" }], width: "half", help: "Videos only." },
    { name: "title", label: "Title / caption", type: "text" },
    { name: "album", label: "Album", type: "text", help: "Optional grouping." },
    { name: "url", label: "URL / video ID", type: "text", required: true, help: "Photo: image URL. Video: YouTube/Vimeo ID or a video file URL." },
    { name: "poster", label: "Video poster", type: "image", help: "Thumbnail for Vimeo/file videos." },
    { name: "sort", label: "Sort order", type: "number", help: "Lower shows first." },
  ],
};

export const jobsConfig: CollectionConfig = {
  table: "site_jobs",
  singular: "Job",
  plural: "Jobs",
  titleField: "title",
  subtitleFields: ["company", "location", "type"],
  imageField: "image",
  statusField,
  statusOptions: STATUS,
  viewUrl: () => "/careers",
  // A job has no page of its own — /careers is the page — so the button names it.
  editOnPage: true,
  editOnPageLabel: "Edit the Careers page",
  sortRows: (a, b) => asNum(a.sort) - asNum(b.sort),
  fields: [
    { name: "title", label: "Title", type: "text", required: true },
    { name: "company", label: "Company", type: "text", defaultValue: "Electrifying the US", width: "half" },
    { name: "department", label: "Department", type: "text", defaultValue: "EV Industry", width: "half" },
    { name: "location", label: "Location", type: "text", defaultValue: "Remote · U.S.", width: "half" },
    { name: "type", label: "Type", type: "text", defaultValue: "Full-time", width: "half", help: "Full-time, Contract…" },
    { name: "description", label: "Short description", type: "textarea", help: "Preview shown on the card." },
    { name: "description_full", label: "Full description", type: "markdown", help: "Shown when the listing is expanded." },
    { name: "image", label: "Card image", type: "image" },
    { name: "apply_url", label: "Apply URL", type: "text", width: "half" },
    { name: "apply_email", label: "Apply email", type: "text", width: "half" },
    { name: "featured", label: "Featured", type: "boolean" },
    { name: "sort", label: "Sort order", type: "number", help: "Lower shows first." },
  ],
};

export const vehiclesConfig: CollectionConfig = {
  table: "site_vehicles",
  singular: "Vehicle",
  plural: "Vehicles",
  titleField: "name",
  subtitleFields: ["type", "category", "vehicle_id"],
  imageField: "image",
  groupField: "type",
  groupLabels: { ev: "Electric", hybrid: "Hybrid", gas: "Gas" },
  splitBy: { field: "type", left: "ev", leftLabel: "Electric cars", right: ["gas", "hybrid"], rightLabel: "Gas cars" },
  staticRows: vehicleStaticRows,
  keyOf: (r) => str(r.vehicle_id),
  viewUrl: () => "/electricity-vs-gasoline",
  statusField,
  statusOptions: STATUS,
  sortRows: (a, b) => asNum(a.sort) - asNum(b.sort),
  fields: [
    { name: "name", label: "Name", type: "text", required: true },
    { name: "vehicle_id", label: "Vehicle ID (slug)", type: "text", required: true, width: "half", help: "Calculator key, e.g. tesla-model-3. Reuse an existing ID to override that vehicle." },
    { name: "type", label: "Type", type: "select", options: [{ value: "ev", label: "Electric" }, { value: "hybrid", label: "Hybrid" }, { value: "gas", label: "Gas" }], defaultValue: "ev", width: "half" },
    { name: "category", label: "Category", type: "select", options: ["Sedan", "Coupe", "SUV", "Minivan", "Truck"].map((c) => ({ value: c, label: c })), defaultValue: "Sedan", width: "half" },
    { name: "msrp", label: "MSRP ($)", type: "number", width: "half" },
    { name: "mpg", label: "MPG (gas)", type: "number", width: "half", help: "Gas vehicles only." },
    { name: "mpge", label: "MPGe (EV)", type: "number", width: "half", help: "EVs only." },
    { name: "kwh_per_100mi", label: "kWh / 100mi (EV)", type: "number", width: "half", help: "EVs only." },
    { name: "range_mi", label: "Range (mi)", type: "number", width: "half" },
    { name: "maintenance_cost_per_mile", label: "Maintenance $/mi", type: "number", width: "half", defaultValue: 0.06 },
    { name: "insurance_annual", label: "Insurance $/yr", type: "number", width: "half", defaultValue: 1800 },
    { name: "depreciation_rate", label: "Depreciation rate", type: "number", width: "half", defaultValue: 0.15, help: "Annual, as a fraction (0.15 = 15%)." },
    { name: "drivetrain", label: "Drivetrain", type: "select", options: [{ value: "", label: "—" }, { value: "FWD", label: "FWD" }, { value: "RWD", label: "RWD" }, { value: "AWD", label: "AWD" }], width: "half" },
    { name: "body_style", label: "Body style", type: "text", width: "half", help: "e.g. sedan, suv-compact, truck." },
    { name: "size_class", label: "Size class", type: "number", width: "half" },
    { name: "seats", label: "Seats", type: "number", width: "half" },
    { name: "image", label: "Image", type: "image" },
    { name: "performance", label: "Performance", type: "boolean" },
    { name: "luxury", label: "Luxury", type: "boolean" },
    { name: "hidden", label: "Hide this vehicle", type: "boolean", help: "Publish with this on to remove the static vehicle that shares its ID." },
    { name: "sort", label: "Sort order", type: "number", help: "Lower shows first." },
  ],
};

export const incentivesConfig: CollectionConfig = {
  table: "site_incentives",
  singular: "Incentive",
  plural: "Incentives",
  titleField: "name",
  subtitleFields: ["scope", "state", "jurisdiction"],
  statusField,
  statusOptions: STATUS,
  staticRows: incentiveStaticRows,
  keyOf: (r) => `${str(r.scope)}|${str(r.state) || ""}|${str(r.name)}`,
  viewUrl: () => "/rebates-incentives",
  // Same: incentives are rows on one shared page, not pages of their own.
  editOnPage: true,
  editOnPageLabel: "Edit the Incentives page",
  sortRows: (a, b) => asNum(a.sort) - asNum(b.sort),
  fields: [
    { name: "name", label: "Program name", type: "text", required: true },
    { name: "scope", label: "Scope", type: "select", options: [{ value: "federal", label: "Federal" }, { value: "state", label: "State / local" }, { value: "utility", label: "Utility" }], defaultValue: "state", width: "half" },
    { name: "state", label: "State code", type: "text", width: "half", help: "2-letter, e.g. CA. Required for state & utility scopes." },
    { name: "category", label: "Category", type: "select", options: [{ value: "", label: "—" }, { value: "vehicle", label: "Vehicle" }, { value: "charging", label: "Charging" }, { value: "electricity", label: "Electricity" }, { value: "perks", label: "Perks" }], width: "half", help: "Federal & state scopes. (Utility programs ignore this.)" },
    { name: "jurisdiction", label: "Jurisdiction label", type: "text", width: "half", help: "e.g. 'California Incentive', 'PG&E Incentive'." },
    { name: "amount", label: "Amount", type: "text", width: "half", placeholder: "Up to $4,000" },
    { name: "income", label: "Income-qualified", type: "boolean" },
    { name: "used", label: "Applies to used EVs", type: "boolean" },
    { name: "description", label: "Description", type: "textarea", required: true },
    { name: "link", label: "Program link", type: "text", help: "Official program URL." },
    { name: "hidden", label: "Hide matching static incentive", type: "boolean", help: "Publish with this on to remove the static incentive with the same name in this bucket." },
    { name: "sort", label: "Sort order", type: "number", help: "Lower shows first." },
  ],
};

export const COLLECTION_CONFIGS = {
  blog: blogConfig,
  events: eventsConfig,
  gallery: galleryConfig,
  jobs: jobsConfig,
  vehicles: vehiclesConfig,
  incentives: incentivesConfig,
};
