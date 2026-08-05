// Shared block factory — used by the page editor AND by containers (for their
// child blocks). Kept separate so both can create blocks without a circular
// import.

import type { PageBlock, BlockType } from "@/lib/page-content";

export const newId = () =>
  (typeof crypto !== "undefined" && crypto.randomUUID) ? crypto.randomUUID() : `blk_${Date.now()}_${Math.round(Math.random() * 1e6)}`;

// A fresh block seeded with sensible defaults so it's immediately visible/editable.
export function newBlock(type: BlockType): PageBlock {
  const base: PageBlock = { id: newId(), slot: "", type };
  switch (type) {
    case "heading": return { ...base, text: "New heading", level: 2, align: "center" };
    case "text": return { ...base, text: "New paragraph. Click to edit this text.", align: "left" };
    case "image": return { ...base, src: "", caption: "", align: "center" };
    case "video": return { ...base, provider: "youtube", videoId: "", align: "center" };
    case "button": return { ...base, text: "Learn more", href: "", align: "center" };
    case "spacer": return { ...base, height: 40 };
    case "icon": return { ...base, icon: "zap", align: "center" };
    case "accordion": return { ...base, items: [{ title: "Question one?", body: "Answer to the first question." }, { title: "Question two?", body: "Answer to the second question." }] };
    case "tabs": return { ...base, items: [{ title: "Tab one", body: "Content for the first tab." }, { title: "Tab two", body: "Content for the second tab." }] };
    case "columns": return { ...base, columns: [{ body: "First column text." }, { body: "Second column text." }] };
    case "gallery": return { ...base, images: [] };
    case "cta": return { ...base, text: "Ready to make the switch?", subtext: "See what you'd save with an EV, or explore the incentives available in your area.", buttonLabel: "Open the calculator", href: "/electricity-vs-gasoline" };
    case "image-box": return { ...base, src: "", text: "Title", subtext: "A short supporting description.", align: "center" };
    case "icon-box": return { ...base, icon: "zap", text: "Title", subtext: "A short supporting description.", align: "center" };
    case "counter": return { ...base, text: "60%", subtext: "Lower lifecycle emissions", align: "center" };
    case "countdown": return { ...base, text: "", subtext: "Event starts in", align: "center" };
    case "maps": return { ...base, text: "" };
    case "html": return { ...base, text: "" };
    case "testimonial": return { ...base, text: "This service made switching to an EV effortless — highly recommended!", subtext: "Jane Doe", caption: "EV Owner", src: "", align: "center" };
    case "alert": return { ...base, text: "Heads up — this is an important note.", variant: "info" };
    case "rating": return { ...base, num: 5, subtext: "", align: "center" };
    case "social": return { ...base, items: [{ title: "facebook", body: "" }, { title: "instagram", body: "" }], align: "center" };
    case "progress": return { ...base, text: "EV adoption", num: 60 };
    case "container": return { ...base, cols: 2, children: [] };
    default: return base; // divider
  }
}
