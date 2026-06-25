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
    path: "/blog/2026-ev-tipping-point-electric-vehicle-adoption-america",
    title: "2026 could be the tipping point for electric vehicle adoption in America—why most drivers now save by going EV",
    description:
      "2026 is the tipping point for electric vehicle adoption in America—why most drivers now save by going EV.",
    image: "/og/why-2026-is-the-tipping-point.jpg",
  },
  {
    path: "/blog/electric-vehicle-myths-2026",
    title: "Electric Vehicle Myths in 2026: What's Actually True",
    description:
      "Still on the fence about going electric? We debunk the most common EV myths of 2026 so you can make a smarter, more confident vehicle decision.",
    image: "/og/electric-vehicle-myths-2026.jpg",
  },
  {
    path: "/blog/charging-101-levels",
    title: "EV Charging 101: What to Know Before You Buy an EV",
    description:
      "A beginner's guide to EV charging for U.S. drivers: home and public charging, charging levels, costs, rebates, and the right setup for you.",
    image: "/og/charging-101-levels.jpg",
  },
  {
    path: "/blog/real-cost-of-going-electric-ev-savings-breakdown",
    title: "The Real Cost of Going Electric: A Complete EV Savings Breakdown",
    description:
      "How much do you actually save by switching to an EV? Fuel savings, maintenance costs, federal tax credits, and total cost of ownership — with real numbers.",
    image: "/og/real-cost-of-going-electric.jpg",
  },
  {
    path: "/blog/ev-clean-energy-workforce-jobs-opportunities",
    title: "Electrifying Communities: Clean Energy Jobs and EV Workforce Opportunities",
    description:
      "Hundreds of thousands of jobs in EV manufacturing, charging infrastructure, and skilled trades — no four-year degree required. Here's how to get in.",
    image: "/og/clean-energy-workforce-opportunities.jpg",
  },
  {
    path: "/blog/beyond-cars-electric-bikes-buses-multimodal-transportation",
    title: "Beyond Cars: E-Bikes, Electric Buses, and the Multimodal Zero-Emission Future",
    description:
      "The EV revolution isn't just about cars. E-bikes, electric buses, electric trucks, and emerging electric aviation are building a zero-emission transportation system for every community.",
    image: "/og/beyond-cars-multimodal-future.jpg",
  },
  {
    path: "/blog/ev-cold-weather-winter-range-myths-vs-reality",
    title: "Do EVs Work in Cold Weather? Winter Range Myths vs. Reality",
    description:
      "Yes, EVs work in winter — millions do it every day. How cold weather affects range, what preconditioning is, and 5 smart habits that keep you moving all winter.",
    image: "/og/evs-in-winter-myths-vs-reality.jpg",
  },
  {
    path: "/blog/electric-vehicles-air-quality-public-health-benefits",
    title: "Cleaner Air, Healthier Neighborhoods: How Electric Vehicles Improve Public Health",
    description:
      "Every gas car replaced by an EV means less tailpipe pollution. How vehicle emissions affect public health, who is most impacted, and how EVs are improving air quality across America.",
    image: "/og/cleaner-air-healthier-neighborhoods.jpg",
  },
  {
    path: "/events/demo-days-los-angeles",
    title: "Demo Days Los Angeles — Test Drive the Future at the Rose Bowl",
    description:
      "North America's largest outdoor vehicle demo festival. Test drive EVs, e-bikes, e-scooters, autonomous vehicles, and more. June 27–28, 2026 · Rose Bowl, Pasadena, CA.",
    image: "/og/demo-days-los-angeles.jpg",
  },
  {
    path: "/events/from-pump-to-plug",
    title: "Part 2: From The Pump To The Plug - How Electric Vehicles Can Save You Thousands",
    description:
      "A free one-hour webinar on how switching from gas to electric saves drivers thousands — on fuel, maintenance, and incentives. June 25, 2026 · Online.",
    image: "/og/events-from-pump-to-plug.jpg",
  },

  // Section landing pages (shared from cards that link to the section).
  {
    path: "/news",
    title: "E-Mobility News & Guides — Electrifying the US",
    description:
      "The latest on electric vehicles, charging, and the clean-transport transition — plus guides and explainers on going electric.",
    image: "/og/news.jpg",
  },
  {
    path: "/events",
    title: "EV Events — Ride & Drives, Webinars & Expos",
    description:
      "Experience e-mobility in person and online. Find ride & drives, webinars, and expos near you.",
    image: "/og/events.jpg",
  },
  {
    path: "/careers",
    title: "Careers in E-Mobility — Electrifying the US",
    description:
      "Explore clean-energy and EV careers — the transition is creating hundreds of thousands of jobs and pathways into them.",
    image: "/og/careers.jpg",
  },
  {
    path: "/gallery",
    title: "Gallery — Moments in Motion",
    description:
      "Photos and videos from our ride & drives, webinars, expos, and community events across the country.",
    image: "/og/gallery.jpg",
  },
  {
    path: "/rebates-incentives",
    title: "EV Rebates & Incentives — Find What You Qualify For",
    description:
      "Federal, state, and utility programs that lower the cost of going electric. See the incentives available in your area.",
    image: "/og/incentives.jpg",
  },
];
