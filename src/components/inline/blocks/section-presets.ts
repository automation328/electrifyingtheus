// Pre-designed sections (Elementor-style template library). Each preset builds a
// container block (with children) that editors insert in one click; ids are
// regenerated on insert, so these are just blueprints.

import { newBlock } from "@/components/inline/blocks/factory";
import type { PageBlock, BlockType } from "@/lib/page-content";

const WHITE = "#ffffff";
const SOFT_WHITE = "rgba(255,255,255,0.85)";
const child = (type: BlockType, over: Partial<PageBlock>, col = 0): PageBlock => ({ ...newBlock(type), col, ...over });

export interface SectionPreset { id: string; name: string; build: () => PageBlock }

export const SECTION_PRESETS: SectionPreset[] = [
  {
    id: "hero", name: "Hero band",
    build: () => ({
      ...newBlock("container"), cols: 1, fullWidth: true, style: { bg: "hsl(var(--primary))", padY: 88 },
      children: [
        child("heading", { text: "A bold headline that sells the idea", level: 2, size: "xl", align: "center", style: { color: WHITE } }),
        child("text", { text: "One or two supporting sentences that explain the value clearly.", align: "center", style: { color: SOFT_WHITE } }),
        child("button", { text: "Get started", href: "/", align: "center" }),
      ],
    }),
  },
  {
    id: "features3", name: "3 features",
    build: () => ({
      ...newBlock("container"), cols: 3, style: { padY: 40 },
      children: [
        child("icon-box", { icon: "zap", text: "Fast", subtext: "A short description of this benefit." }, 0),
        child("icon-box", { icon: "shield", text: "Reliable", subtext: "A short description of this benefit." }, 1),
        child("icon-box", { icon: "leaf", text: "Clean", subtext: "A short description of this benefit." }, 2),
      ],
    }),
  },
  {
    id: "stats", name: "Stats row",
    build: () => ({
      ...newBlock("container"), cols: 4, style: { padY: 32 },
      children: [
        child("counter", { text: "60%", subtext: "Lower emissions" }, 0),
        child("counter", { text: "$1,200", subtext: "Avg. yearly savings" }, 1),
        child("counter", { text: "All 50", subtext: "States covered" }, 2),
        child("counter", { text: "24/7", subtext: "EVan support" }, 3),
      ],
    }),
  },
  {
    id: "cta", name: "CTA band",
    build: () => ({
      ...newBlock("container"), cols: 1, fullWidth: true, style: { bg: "hsl(var(--secondary))", padY: 64 },
      children: [
        child("heading", { text: "Ready to make the switch?", level: 2, align: "center", style: { color: WHITE } }),
        child("text", { text: "See what you'd save with an EV.", align: "center", style: { color: SOFT_WHITE } }),
        child("button", { text: "Open the calculator", href: "/electricity-vs-gasoline", align: "center" }),
      ],
    }),
  },
  {
    id: "twocol", name: "Image + text",
    build: () => ({
      ...newBlock("container"), cols: 2, style: { padY: 40 },
      children: [
        child("image", { src: "", caption: "" }, 0),
        child("heading", { text: "Section heading", level: 2, align: "left" }, 1),
        child("text", { text: "Explain this section in a couple of sentences. Add whatever detail helps the reader understand the value.", align: "left" }, 1),
        child("button", { text: "Learn more", href: "/", align: "left" }, 1),
      ],
    }),
  },
  {
    id: "testimonials", name: "Testimonials",
    build: () => ({
      ...newBlock("container"), cols: 2, style: { padY: 40 },
      children: [
        child("testimonial", { text: "This made switching effortless.", subtext: "Alex P.", caption: "EV Owner" }, 0),
        child("testimonial", { text: "The savings calculator sold me.", subtext: "Jordan M.", caption: "New EV Driver" }, 1),
      ],
    }),
  },
  {
    id: "faq", name: "FAQ",
    build: () => ({
      ...newBlock("container"), cols: 1, style: { padY: 32, maxW: "lg" },
      children: [
        child("heading", { text: "Frequently asked questions", level: 2, align: "center" }),
        child("accordion", {}),
      ],
    }),
  },
  {
    id: "pricing", name: "Pricing (3 tiers)",
    build: () => ({
      ...newBlock("container"), cols: 3, style: { padY: 40 },
      children: [
        child("heading", { text: "Starter", level: 3, align: "center" }, 0),
        child("counter", { text: "$0", subtext: "per month" }, 0),
        child("text", { text: "Everything to get started.\nFeature one\nFeature two", align: "center" }, 0),
        child("button", { text: "Choose Starter", href: "/", align: "center" }, 0),
        child("heading", { text: "Pro", level: 3, align: "center" }, 1),
        child("counter", { text: "$29", subtext: "per month" }, 1),
        child("text", { text: "For growing needs.\nEverything in Starter\nFeature three", align: "center" }, 1),
        child("button", { text: "Choose Pro", href: "/", align: "center" }, 1),
        child("heading", { text: "Enterprise", level: 3, align: "center" }, 2),
        child("counter", { text: "Custom", subtext: "contact us" }, 2),
        child("text", { text: "For large teams.\nEverything in Pro\nPriority support", align: "center" }, 2),
        child("button", { text: "Contact sales", href: "/contact-us", align: "center" }, 2),
      ],
    }),
  },
  {
    id: "logos", name: "Logo strip",
    build: () => ({
      ...newBlock("container"), cols: 1, style: { padY: 32, bg: "hsl(var(--muted))" },
      children: [
        child("heading", { text: "Trusted by teams across the country", level: 3, size: "sm", align: "center" }, 0),
        { ...newBlock("container"), col: 0, cols: 4, children: [
          child("image", { src: "", caption: "" }, 0),
          child("image", { src: "", caption: "" }, 1),
          child("image", { src: "", caption: "" }, 2),
          child("image", { src: "", caption: "" }, 3),
        ] },
      ],
    }),
  },
  {
    id: "team", name: "Team grid",
    build: () => ({
      ...newBlock("container"), cols: 3, style: { padY: 40 },
      children: [
        child("image-box", { src: "", text: "Full Name", subtext: "Role / Title" }, 0),
        child("image-box", { src: "", text: "Full Name", subtext: "Role / Title" }, 1),
        child("image-box", { src: "", text: "Full Name", subtext: "Role / Title" }, 2),
      ],
    }),
  },
  {
    id: "newsletter", name: "Newsletter",
    build: () => ({
      ...newBlock("container"), cols: 1, fullWidth: true, style: { bg: "hsl(var(--primary))", padY: 64 },
      children: [
        child("heading", { text: "Stay in the loop", level: 2, align: "center", style: { color: WHITE } }),
        child("text", { text: "Get EV news, incentives, and events straight to your inbox.", align: "center", style: { color: SOFT_WHITE } }),
        child("button", { text: "Subscribe", href: "/contact-us", align: "center" }),
      ],
    }),
  },
];
