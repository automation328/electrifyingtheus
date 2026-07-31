// Field/display config for each CMS collection. The generic CollectionManager
// renders the list + editor from these. Field names map 1:1 to the Supabase
// column names (see supabase/migrations/0001,0003,0004).

import type { CollectionConfig } from "./types";

const STATUS = ["draft", "published", "archived"];
const statusField = "status";

const asNum = (v: unknown) => Number(v ?? 0) || 0;
const asStr = (v: unknown) => String(v ?? "");

export const blogConfig: CollectionConfig = {
  table: "site_blog_posts",
  singular: "Post",
  plural: "Blog posts",
  titleField: "title",
  subtitleFields: ["category", "date", "author"],
  statusField,
  statusOptions: STATUS,
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
  statusField,
  statusOptions: STATUS,
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
  statusField,
  statusOptions: STATUS,
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
  statusField,
  statusOptions: STATUS,
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

export const COLLECTION_CONFIGS = {
  blog: blogConfig,
  events: eventsConfig,
  gallery: galleryConfig,
  jobs: jobsConfig,
};
