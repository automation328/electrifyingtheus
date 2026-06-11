// Per-page Open Graph metadata served to social crawlers by middleware.ts.
// Plain data only (no asset imports) so it runs in the Edge runtime. Images
// live in /public/og/* (1200×630). Keep titles/excerpts in sync with the
// matching entries in src/data/blog-posts.ts and src/data/events.ts.

export interface OgEntry {
  /** Exact pathname, no trailing slash. */
  path: string;
  title: string;
  description: string;
  /** Root-relative image path under /public; served from the crawled host. */
  image: string;
}

export const OG_ENTRIES: OgEntry[] = [
  {
    path: "/blog/why-2026-is-the-tipping-point",
    title: "Why 2026 Is the Tipping Point for EV Adoption in America",
    description:
      "With more than 8 million EVs on U.S. roads, falling battery costs, and a fast-growing charging network, the shift to electric is moving from early adopters to the mainstream.",
    image: "/og/why-2026-is-the-tipping-point.jpg",
  },
  {
    path: "/blog/charging-101-levels",
    title: "Charging 101: Level 1 vs. Level 2 vs. DC Fast",
    description: "Which charger fits your life? A plain-English guide to speeds, connectors, and costs.",
    image: "/og/charging-101-levels.jpg",
  },
  {
    path: "/blog/real-cost-of-going-electric",
    title: "The Real Cost of Going Electric: A Savings Breakdown",
    description: "Fuel, maintenance, and incentives add up. See where EV owners actually save money.",
    image: "/og/real-cost-of-going-electric.jpg",
  },
  {
    path: "/blog/clean-energy-workforce-opportunities",
    title: "Electrifying Communities: Clean-Energy Workforce Opportunities",
    description: "The EV transition is creating hundreds of thousands of jobs — and pathways into them.",
    image: "/og/clean-energy-workforce-opportunities.jpg",
  },
  {
    path: "/blog/beyond-cars-multimodal-future",
    title: "Beyond Cars: E-Bikes, Buses & the Multimodal Future",
    description: "Zero-emission mobility is bigger than cars. Explore the full electric ecosystem.",
    image: "/og/beyond-cars-multimodal-future.jpg",
  },
  {
    path: "/blog/evs-in-winter-myths-vs-reality",
    title: "EVs in Winter: Myths vs. Reality",
    description: "Cold weather affects range — but preconditioning and planning keep you moving.",
    image: "/og/evs-in-winter-myths-vs-reality.jpg",
  },
  {
    path: "/blog/cleaner-air-healthier-neighborhoods",
    title: "Cleaner Air, Healthier Neighborhoods",
    description: "How replacing tailpipes with plugs improves public health where we live.",
    image: "/og/cleaner-air-healthier-neighborhoods.jpg",
  },
  {
    path: "/events/from-pump-to-plug",
    title: "From Pump to Plug: How Electric Vehicles Are Saving Thousands",
    description:
      "A free one-hour webinar on how switching from gas to electric saves drivers thousands — on fuel, maintenance, and incentives. June 25, 2026 · Online.",
    image: "/og/events-from-pump-to-plug.jpg",
  },
];
