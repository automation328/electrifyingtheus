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
    path: "/blog/from-the-pump-to-the-plug-ev-savings-webinar",
    title: "From the Pump to the Plug: How EVs Can Save You Thousands | Electrifying The US",
    description:
      "Experts from Consumer Reports, UC Davis, Cox Automotive, and the Colorado Energy Office break down exactly how much money electric vehicles can save drivers — and why switching to an EV has never made more financial sense.",
    image: "/og/save-with-evs-webinar.jpg",
  },
  {
    path: "/from-pump-to-plug-part-2",
    title: "Watch The Webinar: Part 2 - From The Pump To The Plug, How EVs Can Save Thousands",
    description:
      "Watch Part 2 of our From the Pump to the Plug webinar — CARB, Coltura, Uber, Austin Energy, and GRID Alternatives on where the savings of going electric actually come from.",
    image: "/og/events-from-pump-to-plug-v2.jpg",
  },
  {
    path: "/save-with-evs-webinar",
    title: "Webinar Series Part 1: From The Pump To The Plug — How Electric Vehicles Can Save Thousands",
    description:
      "Watch Part 1 of our From the Pump to the Plug webinar — a plain-English look at how everyday drivers save by going electric: fuel, maintenance, and incentives.",
    image: "/og/save-with-evs-webinar.jpg",
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
      "A free one-hour webinar on how switching from gas to electric saves drivers thousands — on fuel, maintenance, and incentives. Thursday, August 27, 2026 · Online.",
    image: "/og/events-from-pump-to-plug-v2.jpg",
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
    path: "/marketplace",
    title: "EV Marketplace — Find an Affordable EV Near You",
    description:
      "Low-cost electric and plug-in hybrid vehicles for sale near you, from every brand. Search by make, model or price, and see what each one costs to run.",
    image: "/og/marketplace.jpg",
  },
  {
    path: "/rebates-incentives",
    title: "EV Rebates & Incentives — Find What You Qualify For",
    description:
      "Federal, state, and utility programs that lower the cost of going electric. See the incentives available in your area.",
    image: "/og/incentives.jpg",
  },
  // Tool, topic and form pages. Each has its own card, generated from
  // scripts/og-cards.json by scripts/make-og-cards.ps1.
  {
    path: "/assistant",
    title: "Talk to EVan — Your E-Mobility Advisor",
    description:
      "Ask EVan, the E-Mobility Advisor from Electrifying the US, anything about EVs. Website owners can also add EVan and other EV tools to their own site.",
    image: "/og/assistant.jpg",
  },
  {
    path: "/calculator",
    title: "EV vs Gas TCO Calculator — True Cost of Owning an EV",
    description:
      "Compare the true cost of owning an electric vehicle versus a gas vehicle over time. Pick a gas car and an EV, then see which one costs less to own over your ownership period.",
    image: "/og/tco-calculator.jpg",
  },
  {
    path: "/contact-us",
    title: "Contact Us — Electrifying the US",
    description:
      "Have questions about EVs, want EVan on your own site, or want to partner with us? Send a message or email info@electrifyingtheus.com.",
    image: "/og/contact-us.jpg",
  },
  {
    path: "/find-a-charger",
    title: "Find an EV Charger Near You — Public Charging Map",
    description:
      "Search any ZIP code, city, state or address to find public EV charging stations across the U.S. — 250,000+ charging ports, with more coming online every week.",
    image: "/og/find-a-charger.jpg",
  },
  {
    path: "/rebate-eligibility",
    title: "EV Rebate Eligibility Check — Deadlines & Documents",
    description:
      "Check which EV rebates you may qualify for in Oregon, Delaware and PG&E territory, with the purchase windows, application deadlines and document checklist.",
    image: "/og/rebate-eligibility.jpg",
  },
  {
    path: "/list-your-event",
    title: "List Your EV Event — Submit It for Review",
    description:
      "Request to list your e-mobility event: Ride & Drives, webinars, charging demos, AV events, and workshops. Tell us the details and we'll review your submission.",
    image: "/og/list-your-event.jpg",
  },
  {
    path: "/post-a-job",
    title: "Post a Job — Reach EV-Minded Candidates",
    description:
      "Share an open role with EV-minded candidates. Send us the details and we'll review it for the e-mobility job board.",
    image: "/og/post-a-job.jpg",
  },
  {
    path: "/evsafetywebinar",
    title: "EV Safety & First Responders Webinar — Watch the Replay",
    description:
      "Watch the recording of our EV Safety and First Responders webinar on EV myths and misinformation, with speakers from Ford, NFPA, FSRI and the City of Atlanta.",
    image: "/og/evsafetywebinar.jpg",
  },
  {
    path: "/ev-charging-101",
    title: "EV Charging 101 — Levels, Plugs and Home Charging",
    description:
      "How EV charging works: Level 1, Level 2 and DC fast charging, plug types including NACS, home and public charging, and what it costs.",
    image: "/og/ev-charging-101.jpg",
  },
  {
    path: "/evs-in-winter",
    title: "EVs in Winter — Range, Traction and Cold-Weather Tips",
    description:
      "EVs lose some range in deep cold, roughly 10 to 30 percent, but preconditioning, heat pumps and instant traction help. Tips for winter driving and charging.",
    image: "/og/evs-in-winter.jpg",
  },
  {
    path: "/financial-savings",
    title: "EV Financial Savings — Cheaper Fuel and Maintenance",
    description:
      "See how going electric saves money: lower fuel cost per mile, far fewer moving parts to maintain, and savings that grow the more you drive. Includes a savings calculator.",
    image: "/og/financial-savings.jpg",
  },
  {
    path: "/us-ev-policies",
    title: "U.S. EV Policies — NEVI Charging Funding and State Goals",
    description:
      "A plain-language brief on U.S. EV policy: the $5 billion NEVI charging program, the 50% zero-emission sales goal for 2030, state programs, and changes to buyer incentives.",
    image: "/og/us-ev-policies.jpg",
  },
  {
    path: "/reduced-emissions",
    title: "EVs and Reduced Emissions — Zero Tailpipe, Cleaner Over Time",
    description:
      "How electric vehicles cut pollution: zero tailpipe emissions, fewer lifecycle greenhouse gases than gasoline cars, and a cleaner grid that makes every EV greener each year.",
    image: "/og/reduced-emissions.jpg",
  },
  {
    path: "/ev-road-safety",
    title: "EVs and Road Safety — Rollovers, Fire Risk and Crash Tests",
    description:
      "How EVs hold up on the road: a low center of gravity that resists rollovers, battery-reinforced bodies, fire risk compared with gas cars, and driver-assistance features.",
    image: "/og/ev-road-safety.jpg",
  },
  {
    path: "/steam-education",
    title: "STEAM Education — Training the Clean Transportation Workforce",
    description:
      "How STEAM education feeds the EV workforce: EPA Clean School Bus training, high-voltage technician skills, community college and apprenticeship paths, and K-12 programs.",
    image: "/og/steam-education.jpg",
  },
  {
    path: "/workforce-economic-development",
    title: "Workforce & Economic Development — Clean Energy and EV Jobs",
    description:
      "Clean energy employed about 3.56 million Americans in 2024 and grew roughly three times faster than the overall economy. See where EV and clean vehicle jobs are.",
    image: "/og/workforce-economic-development.jpg",
  },
  {
    path: "/self-driving-vehicles",
    title: "Self-Driving Vehicles & Delivery Robots — Why They Run Electric",
    description:
      "Robotaxis and sidewalk delivery robots are already on American streets. Learn how autonomous vehicles work, what safety looks like, and why autonomy and electrification go together.",
    image: "/og/self-driving-vehicles.jpg",
  },
  {
    path: "/evtol-drone-delivery",
    title: "eVTOLs & Drone Delivery — Electric Air Taxis Explained",
    description:
      "What eVTOL air taxis are, how delivery drones move prescriptions and parcels in minutes, and what vertiports, certification and noise mean for electric aviation.",
    image: "/og/evtol-drone-delivery.jpg",
  },
  {
    path: "/sustainable-aviation",
    title: "Sustainable Aviation & eGSE — Cutting Emissions at Airports",
    description:
      "Sustainable aviation fuel can cut lifecycle CO2 by up to 80%. See how airports electrify ground equipment and how electric commuter planes target routes under 250 miles.",
    image: "/og/sustainable-aviation.jpg",
  },
  {
    path: "/sustainable-maritime",
    title: "Sustainable Maritime — Shore Power, Electric Ferries and Tugs",
    description:
      "How shore power lets docked ships shut off diesel engines, and why operators report electric ferries and tugboats cutting operating costs 30 to 40 percent.",
    image: "/og/sustainable-maritime.jpg",
  },
  {
    path: "/electric-school-buses",
    title: "Electric School Buses — Cleaner Rides for Students",
    description:
      "The EPA is investing $5 billion to replace diesel school buses. See why electric buses mean cleaner air for students and how parked fleets can power the grid.",
    image: "/og/electric-school-buses.jpg",
  },
  {
    path: "/heavy-duty-electrification",
    title: "Heavy-Duty Electrification — Cleaner Freight Trucking",
    description:
      "Medium- and heavy-duty trucks produce roughly a quarter of transportation emissions. See the freight charging strategy and the cost case for electric trucks.",
    image: "/og/heavy-duty-electrification.jpg",
  },
  {
    path: "/electric-public-transit",
    title: "Electric Public Transit Buses — Cleaner, Quieter Rides",
    description:
      "With more than $2 billion a year in federal funding, transit agencies in all 50 states are adding electric buses. See the benefits and the challenges.",
    image: "/og/electric-public-transit.jpg",
  },
  {
    path: "/rideshare-rental-fleets",
    title: "Rideshare, Rental & Fleet EVs — Where Electric Saves Most",
    description:
      "Uber and Lyft have committed to 100% electric fleets by 2030, and rental companies offer EVs nationwide. See why high-mileage driving saves the most.",
    image: "/og/rideshare-rental-fleets.jpg",
  },
  {
    path: "/micro-mobility",
    title: "Micromobility — E-Bikes and Scooters for Short Trips",
    description:
      "Shared e-bikes and scooters cover 150M+ trips a year in 400+ cities. See how they replace short car trips, feed transit, and how rebates can help.",
    image: "/og/micro-mobility.jpg",
  },
  {
    path: "/privacy-policy",
    title: "Privacy Policy — Electrifying the US",
    description:
      "How Electrifying the US collects, uses, shares and protects your information, including the AI chatbot, calculators, SMS messages and forms, plus your rights and choices.",
    image: "/og/privacy-policy.jpg",
  },
  {
    path: "/terms",
    title: "Terms of Use — Electrifying the US",
    description:
      "The terms for using ElectrifyingTheUS.com, including the AI chatbot, cost calculators, rebate information and SMS messages, plus the disclaimers that apply to these tools.",
    image: "/og/terms.jpg",
  },
  {
    // /blog redirects to /news inside the app, which a crawler never runs.
    path: "/blog",
    title: "E-Mobility News & Guides — Electrifying the US",
    description:
      "The latest on electric vehicles, charging, and the clean-transport transition — plus guides and explainers on going electric.",
    image: "/og/news.jpg",
  },
];
