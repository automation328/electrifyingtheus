import heroBg from "@/assets/reduced-emissions.jpg";
import evCharging from "@/assets/ev-charging.jpg";
import evSavings from "@/assets/ev-savings.jpg";
import workforce from "@/assets/workforce.jpg";
import micromobility from "@/assets/micromobility.jpg";
import evWinter from "@/assets/ev-winter.jpg";
import evFamily from "@/assets/ev-family.jpg";

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  category: string;
  date: string;
  author: string;
  readTime: string;
  image: string;
  featured?: boolean;
  /** Markdown body */
  content: string;
}

export const BLOG_POSTS: BlogPost[] = [
  {
    slug: "why-2026-is-the-tipping-point",
    title: "Why 2026 Is the Tipping Point for EV Adoption in America",
    excerpt:
      "With more than 8 million EVs on U.S. roads, falling battery costs, and a fast-growing charging network, the shift to electric is moving from early adopters to the mainstream.",
    category: "Policy & Trends",
    date: "May 18, 2026",
    author: "Electrifying the US Team",
    readTime: "5 min read",
    image: heroBg,
    featured: true,
    content: `For years, electric vehicles were a curiosity — a choice for early adopters and tech enthusiasts. In 2026, that story is changing fast. The U.S. now has **more than 8 million EVs on the road**, and the momentum is accelerating.

## What changed

Three forces converged to push EVs into the mainstream:

- **Cheaper batteries.** Battery pack costs have fallen dramatically over the last decade, narrowing the price gap with gas cars.
- **More choices.** Nearly every automaker now offers competitive EVs across sedans, SUVs, and trucks.
- **A real charging network.** With **240,000+ public charging ports** nationwide and growing, "where will I charge?" is no longer a dealbreaker.

## The economics finally make sense

Beyond the sticker price, EV owners save on fuel and maintenance. Charging at home can be **~60% cheaper per mile** than gasoline, and with far fewer moving parts, EVs need less upkeep over their lifetime.

## What it means for you

Whether you're a first-time buyer or a fleet manager, the calculus has shifted. The question is no longer *if* you'll drive electric — it's *when*. Explore the savings for your situation with our [TCO Calculator](/calculator) and [Electricity vs. Gasoline tool](/electricity-vs-gasoline).`,
  },
  {
    slug: "charging-101-levels",
    title: "Charging 101: Level 1 vs. Level 2 vs. DC Fast",
    excerpt: "Which charger fits your life? A plain-English guide to speeds, connectors, and costs.",
    category: "EV 101",
    date: "May 12, 2026",
    author: "Maya Chen",
    readTime: "4 min read",
    image: evCharging,
    content: `Charging an EV is simpler than it sounds. There are three main "levels," and most drivers use a mix depending on the situation.

## Level 1 (120V)
A standard wall outlet. It adds about **3–5 miles of range per hour** — slow, but perfectly fine for overnight top-ups if you don't drive far each day.

## Level 2 (240V)
The everyday workhorse, found at homes, workplaces, and public stations. It delivers **~20–40 miles of range per hour**, fully charging most EVs overnight.

## DC Fast Charging
Public fast chargers can take you from **10% to 80% in about 20–40 minutes** — ideal for road trips.

## A note on connectors
The industry is converging on the **NACS** (Tesla-style) standard, while **CCS** remains widely used. Most new EVs and adapters support both, so compatibility is rarely an issue.

The takeaway: charge at home for daily driving, and lean on fast charging for longer trips.`,
  },
  {
    slug: "real-cost-of-going-electric",
    title: "The Real Cost of Going Electric: A Savings Breakdown",
    excerpt: "Fuel, maintenance, and incentives add up. See where EV owners actually save money.",
    category: "Savings",
    date: "May 5, 2026",
    author: "Darnell Price",
    readTime: "6 min read",
    image: evSavings,
    content: `The sticker price is only part of the story. To understand the true cost of a vehicle, you have to look at what you spend over years of ownership.

## Fuel vs. electricity
Charging an EV typically costs **far less per mile** than buying gasoline — often around 60% less when charging at home. Over 12,000 miles a year, that adds up quickly.

## Maintenance
EVs have **no oil changes, fewer moving parts, and less brake wear** thanks to regenerative braking. Routine maintenance costs are meaningfully lower.

## Incentives
Federal credits of up to **$7,500** (new) or **$4,000** (used) — plus state and utility rebates — can take thousands off the purchase price.

## Run your own numbers
Savings depend on your mileage and local energy prices. Use our [TCO Calculator](/calculator) for a full picture, or the [Electricity vs. Gasoline tool](/electricity-vs-gasoline) to compare fuel costs in your state.`,
  },
  {
    slug: "clean-energy-workforce-opportunities",
    title: "Electrifying Communities: Clean-Energy Workforce Opportunities",
    excerpt: "The EV transition is creating hundreds of thousands of jobs — and pathways into them.",
    category: "Workforce",
    date: "Apr 28, 2026",
    author: "Jordan Ellis",
    readTime: "5 min read",
    image: workforce,
    content: `The shift to electric mobility isn't just about cars — it's about people. Building, installing, and maintaining EVs and chargers is creating a wave of new careers.

## Where the jobs are
- **Manufacturing** — assembling vehicles, batteries, and components
- **Charging infrastructure** — electricians and technicians installing and servicing stations
- **Skilled trades** — grid upgrades, fleet maintenance, and facilities

## Pathways in
You don't need a four-year degree to start. Community colleges, union apprenticeships, and employer training programs offer routes into well-paying roles.

## Equity matters
Electrifying the US partners with community organizations and labor unions to make sure these opportunities reach the people and neighborhoods that need them most. Want to get involved? [Reach out](/#contact).`,
  },
  {
    slug: "beyond-cars-multimodal-future",
    title: "Beyond Cars: E-Bikes, Buses & the Multimodal Future",
    excerpt: "Zero-emission mobility is bigger than cars. Explore the full electric ecosystem.",
    category: "Multimodal",
    date: "Apr 20, 2026",
    author: "Sofia Reyes",
    readTime: "4 min read",
    image: micromobility,
    content: `When people picture EVs, they think of cars. But the electric revolution spans every way we move.

## The full spectrum
- **E-bikes & e-scooters** — perfect for short urban trips, easing congestion and parking
- **Electric buses** — quieter, cleaner public transit, including electric school buses
- **Electric trucks** — from delivery vans to heavy-duty freight
- **Maritime & aviation** — electric ferries and emerging eVTOL aircraft

## Why multimodal matters
No single mode solves everything. A truly clean transportation system combines walking, biking, transit, and electric vehicles — giving people options that fit each trip.

Electrifying the US champions this broader vision of **multimodal zero-emission mobility** for every community.`,
  },
  {
    slug: "evs-in-winter-myths-vs-reality",
    title: "EVs in Winter: Myths vs. Reality",
    excerpt: "Cold weather affects range — but preconditioning and planning keep you moving.",
    category: "EV 101",
    date: "Apr 9, 2026",
    author: "Maya Chen",
    readTime: "4 min read",
    image: evWinter,
    content: `Do EVs work in the cold? Absolutely — millions operate in northern climates year-round. But it helps to know what to expect.

## The reality of range
In freezing temperatures, you may see **10–30% less range**, mostly because cabin heating draws power. The battery itself also prefers to be warm.

## Smart winter habits
- **Precondition while plugged in** — warm the cabin and battery using grid power, not range
- **Use seat and steering-wheel heaters** — they're far more efficient than heating the whole cabin
- **Keep the battery above ~20%** in extreme cold

## Bottom line
With a little planning, winter driving is a non-issue. The myth that EVs "don't work in the cold" simply doesn't match the experience of millions of owners.`,
  },
  {
    slug: "cleaner-air-healthier-neighborhoods",
    title: "Cleaner Air, Healthier Neighborhoods",
    excerpt: "How replacing tailpipes with plugs improves public health where we live.",
    category: "Health",
    date: "Mar 30, 2026",
    author: "Dr. Aisha Bello",
    readTime: "5 min read",
    image: evFamily,
    content: `The benefits of electric vehicles go far beyond fuel savings. Every gas car replaced by an EV means cleaner air in our communities.

## Tailpipes and health
Vehicle exhaust contributes to asthma, respiratory illness, and cardiovascular disease — burdens that fall hardest on neighborhoods near busy roads and highways.

## Zero tailpipe emissions
EVs produce **no tailpipe pollution**. As more vehicles go electric, local air quality improves — especially in historically overburdened communities.

## Cleaner over time
Even accounting for electricity generation, EVs produce **far fewer lifetime emissions** than gas cars — and they keep getting cleaner as the grid adds renewables.

This is why public health is at the heart of our mission. Cleaner transportation means healthier families. [Learn more about our work](/#about).`,
  },
];

export const getPostBySlug = (slug: string) => BLOG_POSTS.find((p) => p.slug === slug);
