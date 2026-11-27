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
    title: "2026: The Tipping Point for EV Adoption in America",
    description:
      "Why 2026 is the tipping point for electric vehicle adoption in America, and why most drivers now save money by going electric.",
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
    title: "The Real Cost of Going Electric: EV Savings Breakdown",
    description:
      "How much do you actually save by switching to an EV? Fuel savings, maintenance costs, federal tax credits, and total cost of ownership — with real numbers.",
    image: "/og/real-cost-of-going-electric.jpg",
  },
  {
    path: "/blog/ev-clean-energy-workforce-jobs-opportunities",
    title: "Clean Energy Jobs and EV Workforce Opportunities",
    description:
      "Hundreds of thousands of jobs in EV manufacturing, charging infrastructure, and skilled trades — no four-year degree required. Here's how to get in.",
    image: "/og/clean-energy-workforce-opportunities.jpg",
  },
  {
    path: "/blog/beyond-cars-electric-bikes-buses-multimodal-transportation",
    title: "Beyond Cars: E-Bikes, Electric Buses and Multimodal Travel",
    description:
      "The EV shift isn't just cars. E-bikes, electric buses and trucks, and electric aviation are building zero-emission transportation for every community.",
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
    title: "How Electric Vehicles Improve Air Quality and Public Health",
    description:
      "Every gas car replaced by an EV means less tailpipe pollution. How vehicle emissions affect health, who is most affected, and how EVs clean the air.",
    image: "/og/cleaner-air-healthier-neighborhoods.jpg",
  },
  {
    path: "/blog/pre-owned-ev-buying-guide-pump-to-plug-part-3",
    title: "Buying a Used EV: Dealer and Driver Advice (Webinar Recap)",
    description:
      "Pre-owned EV dealers and an EV driver on battery health, charging and affordability, plus a checklist for buying a used EV.",
    image: "/og/blog-pre-owned-ev-buying-guide-pump-to-plug-part-3.jpg",
  },
  {
    path: "/blog/how-to-choose-your-first-ev-checklist",
    title: "How to Choose Your First EV: A Step-by-Step Checklist",
    description:
      "Choose your first EV in 7 steps: daily miles, home charging, budget, size, features and a proper test drive. A practical US checklist.",
    image: "/og/blog-how-to-choose-your-first-ev-checklist.jpg",
  },
  {
    path: "/blog/lease-vs-buy-an-ev-2026",
    title: "Leasing vs. Buying an EV in 2026: Which Is Right for You?",
    description:
      "Lease or buy an EV in 2026? Compare pros, cons, mileage limits and resale risk, plus who each option suits now the federal credits have ended.",
    image: "/og/blog-lease-vs-buy-an-ev-2026.jpg",
  },
  {
    path: "/blog/ev-insurance-why-it-differs-and-how-to-save",
    title: "EV Insurance: Why It Costs More or Less and How to Save",
    description:
      "Why EV insurance can cost more or less than a gas car, and how to compare quotes, ask about battery coverage and find discounts.",
    image: "/og/blog-ev-insurance-why-it-differs-and-how-to-save.jpg",
  },
  {
    path: "/blog/ev-battery-life-degradation-warranty-explained",
    title: "EV Battery Life, Degradation and Warranties Explained",
    description:
      "What wears down an EV battery, how to check its health and what the warranty covers. Most automakers offer 8 years or 100,000 miles or more.",
    image: "/og/blog-ev-battery-life-degradation-warranty-explained.jpg",
  },
  {
    path: "/blog/how-to-shop-for-an-affordable-ev",
    title: "How to Shop for an Affordable EV: New vs. Used",
    description:
      "Shop for an affordable EV: compare new and used, work out total cost of ownership, know where to look and spot the red flags.",
    image: "/og/blog-how-to-shop-for-an-affordable-ev.jpg",
  },
  {
    path: "/blog/install-level-2-home-charger-steps-permits-costs",
    title: "How to Install a Level 2 Home EV Charger: Steps & Permits",
    description:
      "Install a Level 2 home EV charger: panel check, choosing a unit, hiring an electrician, permits and finding utility rebates.",
    image: "/og/blog-install-level-2-home-charger-steps-permits-costs.jpg",
  },
  {
    path: "/blog/charging-an-ev-when-you-rent-or-live-in-an-apartment",
    title: "Charging an EV When You Rent or Live in an Apartment",
    description:
      "No garage? How renters charge an EV with workplace, public and Level 1 options, how to ask your landlord, and right-to-charge laws.",
    image: "/og/blog-charging-an-ev-when-you-rent-or-live-in-an-apartment.jpg",
  },
  {
    path: "/blog/plan-your-first-ev-road-trip",
    title: "Planning Your First EV Road Trip: A Simple Checklist",
    description:
      "Plan your first EV road trip with route planners, charging stops, a range buffer, cold-weather tips and charging etiquette.",
    image: "/og/blog-plan-your-first-ev-road-trip.jpg",
  },
  {
    path: "/blog/time-of-use-rates-ev-charging-off-peak-savings",
    title: "Time-of-Use Rates: Save by Charging Your EV Off-Peak",
    description:
      "How time-of-use electricity rates work, how to schedule EV charging off-peak, and how to check your utility's EV rate plan.",
    image: "/og/blog-time-of-use-rates-ev-charging-off-peak-savings.jpg",
  },
  {
    path: "/blog/public-ev-charging-explained-networks-apps-plugs",
    title: "Public EV Charging Explained: Networks, Apps and Plugs",
    description:
      "Public EV charging explained: networks, apps, payment, plug types, the NACS (J3400) shift and charging etiquette.",
    image: "/og/blog-public-ev-charging-explained-networks-apps-plugs.jpg",
  },
  {
    path: "/blog/driving-electric-for-rideshare-and-gig-work",
    title: "Driving an EV for Rideshare and Gig Work: A Practical Guide",
    description:
      "Driving electric for rideshare or gig work? Compare cost per mile, plan charging between trips, pick a car and check platform rules.",
    image: "/og/blog-driving-electric-for-rideshare-and-gig-work.jpg",
  },
  {
    path: "/blog/electric-school-buses-what-parents-and-school-boards-should-know",
    title: "Electric School Buses: A Guide for Parents and Schools",
    description:
      "How electric school buses work, how depots charge them, and how parents and school boards can start the conversation and find funding.",
    image: "/og/blog-electric-school-buses-what-parents-and-school-boards-should-know.jpg",
  },
  {
    path: "/blog/how-cities-and-towns-can-electrify-their-fleets",
    title: "How Cities and Towns Can Electrify Their Fleets",
    description:
      "A step-by-step guide for local governments: inventory vehicles, pick easy wins, plan charging with your utility, and research funding.",
    image: "/og/blog-how-cities-and-towns-can-electrify-their-fleets.jpg",
  },
  {
    path: "/blog/ev-incentives-after-federal-tax-credits-ended",
    title: "EV Incentives After the Federal Tax Credits Ended",
    description:
      "Federal EV credits ended for vehicles acquired after Sept. 30, 2025. Find state, utility, local and dealer savings that may still apply.",
    image: "/og/blog-ev-incentives-after-federal-tax-credits-ended.jpg",
  },
  {
    path: "/blog/making-evs-work-for-every-community",
    title: "Making EVs Affordable and Accessible for Every Community",
    description:
      "Used EVs, charging deserts, apartment charging and car-sharing: practical ways to make EVs work for every community.",
    image: "/og/blog-making-evs-work-for-every-community.jpg",
  },
  {
    path: "/blog/regenerative-braking-one-pedal-driving-explained",
    title: "Regenerative Braking and One-Pedal Driving, Explained",
    description:
      "How regenerative braking works, what it does for EV range and brake wear, and tips for getting comfortable with one-pedal driving.",
    image: "/og/blog-regenerative-braking-one-pedal-driving-explained.jpg",
  },
  {
    path: "/blog/vehicle-to-home-vehicle-to-load-ev-backup-power",
    title: "Vehicle-to-Home and V2L: Using Your EV as Backup Power",
    description:
      "Can your EV power tools or your home in an outage? What V2L and V2H mean, what you need, and the limits.",
    image: "/og/blog-vehicle-to-home-vehicle-to-load-ev-backup-power.jpg",
  },
  {
    path: "/blog/ev-maintenance-guide-what-needs-service-what-doesnt",
    title: "EV Maintenance Guide: What Needs Service and What Doesn't",
    description:
      "EVs skip oil changes but still need care. What to service: tires, brakes, cabin filter, coolant, 12V battery and software updates.",
    image: "/og/blog-ev-maintenance-guide-what-needs-service-what-doesnt.jpg",
  },
  {
    path: "/blog/ev-safety-facts-crashes-fires-flooding-charging-in-rain",
    title: "EV Safety Facts: Crashes, Battery Fires and Flooding",
    description:
      "A plain guide to EV crash ratings, battery fires, flood damage and charging in the rain, and what owners should actually know.",
    image: "/og/blog-ev-safety-facts-crashes-fires-flooding-charging-in-rain.jpg",
  },
  {
    path: "/blog/electric-pickup-trucks-towing-range-charging-guide",
    title: "Electric Pickup Trucks and Towing: Range and Charging",
    description:
      "How towing cuts an electric truck's range, how to plan charging stops with a trailer, and which drivers an electric pickup suits.",
    image: "/og/blog-electric-pickup-trucks-towing-range-charging-guide.jpg",
  },
  {
    path: "/blog/from-the-pump-to-the-plug-ev-savings-webinar",
    title: "From the Pump to the Plug: How EVs Can Save You Thousands",
    description:
      "Experts from Consumer Reports, UC Davis, Cox Automotive and the Colorado Energy Office on how much money EVs save drivers, and why now.",
    image: "/og/save-with-evs-webinar.jpg",
  },
  {
    path: "/from-pump-to-plug-part-2",
    title: "Webinar Part 2: From the Pump to the Plug (Replay)",
    description:
      "Watch Part 2 of From the Pump to the Plug: CARB, Coltura, Uber, Austin Energy and GRID Alternatives on where the savings of going electric come from.",
    image: "/og/events-from-pump-to-plug-v2.jpg",
  },
  {
    path: "/from-pump-to-plug-part-3",
    title: "Webinar Part 3: How Pre-Owned EVs Save You Thousands",
    description:
      "Watch Part 3 of From the Pump to the Plug: pre-owned EV dealers and an everyday EV driver on making an EV affordable and what to know before you buy.",
    image: "/og/events/from-pump-to-plug-part-3.jpg",
  },
  {
    path: "/save-with-evs-webinar",
    title: "Webinar Part 1: From the Pump to the Plug (Replay)",
    description:
      "Watch Part 1 of our From the Pump to the Plug webinar — a plain-English look at how everyday drivers save by going electric: fuel, maintenance, and incentives.",
    image: "/og/save-with-evs-webinar.jpg",
  },
  {
    path: "/events/demo-days-los-angeles",
    title: "Demo Days Los Angeles: Test Drive EVs at the Rose Bowl",
    description:
      "North America's largest outdoor vehicle demo festival: test drive EVs, e-bikes, e-scooters and more. June 27–28, 2026, Rose Bowl, Pasadena, CA.",
    image: "/og/demo-days-los-angeles.jpg",
  },
  {
    path: "/events/from-pump-to-plug",
    title: "Part 2: From the Pump to the Plug — How EVs Save Thousands",
    description:
      "A free one-hour webinar on how switching from gas to electric saves drivers thousands on fuel, maintenance and incentives. Aug 27, 2026, online.",
    image: "/og/events-from-pump-to-plug-v2.jpg",
  },

  // Section landing pages (shared from cards that link to the section).
  {
    path: "/news",
    title: "E-Mobility News & Guides — Electrifying the US",
    description:
      "The latest on electric vehicles, charging, and the clean-transport transition — plus guides and explainers on going electric.",
    image: "/og/news-hub.jpg",
  },
  {
    path: "/events",
    title: "EV Events — Ride & Drives, Webinars & Expos",
    description:
      "Experience e-mobility in person and online. Find EV ride & drives, webinars, expos and community meet-ups near you, and get alerts for new ones.",
    image: "/og/events-hub.jpg",
  },
  {
    path: "/careers",
    title: "Careers in E-Mobility — Electrifying the US",
    description:
      "Explore clean-energy and EV careers — the transition is creating hundreds of thousands of jobs and pathways into them.",
    image: "/og/careers-hub.jpg",
  },
  {
    path: "/gallery",
    title: "Gallery — Moments in Motion | Electrifying the US",
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
    image: "/og/rebates-incentives.jpg",
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
      "Compare the true cost of owning an EV versus a gas car. Pick a gas car and an EV, then see which costs less over the years you own it.",
    image: "/og/tco-calculator.jpg",
  },
  // middleware.ts builds these two pages' share cards itself (calculatorMeta),
  // from the result in the URL. These entries give the bare page the same words
  // in the browser and for Google; keep them in step with calculatorMeta.
  {
    path: "/electricity-vs-gasoline",
    title: "EV vs Gas Calculator — See how much you'll save",
    description:
      "Compare any EV against a gas car on real U.S. energy prices, state by state — fuel, maintenance, and incentives.",
    image: "/og/calculator.jpg",
  },
  {
    path: "/gm-ev-vs-gas",
    title: "GM EV vs Gas Cost Calculator — See how much you'll save",
    description:
      "Compare a GM EV — Equinox EV, Silverado EV, Cadillac LYRIQ and more — against your gas car on real U.S. energy prices, state by state.",
    image: "/og/gm-ev-vs-gas.jpg",
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
    path: "/range-map",
    title: "EV Range Map — How Far Can Your EV Go?",
    description:
      "Pick your EV by make, model and year, enter a ZIP code, and see your driving range as a radius on the map, in normal weather and in deep cold.",
    image: "/og/range-map.jpg",
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
      "How going electric saves money: lower fuel cost per mile, far less maintenance, and savings that grow the more you drive. Includes a savings calculator.",
    image: "/og/financial-savings.jpg",
  },
  {
    path: "/us-ev-policies",
    title: "U.S. EV Policies — NEVI Charging Funding and State Goals",
    description:
      "A plain-language brief on U.S. EV policy: the $5 billion NEVI program, the 50% zero-emission sales goal for 2030, state programs and buyer incentives.",
    image: "/og/us-ev-policies.jpg",
  },
  {
    path: "/reduced-emissions",
    title: "EVs and Reduced Emissions — Zero Tailpipe, Cleaner Over Time",
    description:
      "How EVs cut pollution: zero tailpipe emissions, fewer lifecycle greenhouse gases than gas cars, and a cleaner grid that makes every EV greener each year.",
    image: "/og/reduced-emissions.jpg",
  },
  {
    path: "/ev-road-safety",
    title: "EVs and Road Safety — Rollovers, Fire Risk and Crash Tests",
    description:
      "How EVs hold up on the road: a low center of gravity that resists rollovers, battery-reinforced bodies, fire risk versus gas cars, and driver assistance.",
    image: "/og/ev-road-safety.jpg",
  },
  {
    path: "/steam-education",
    title: "STEAM Education for the Clean Transportation Workforce",
    description:
      "How STEAM education feeds the EV workforce: EPA Clean School Bus training, high-voltage technician skills, college and apprenticeship paths, and K-12.",
    image: "/og/steam-education.jpg",
  },
  {
    path: "/workforce-economic-development",
    title: "Workforce & Economic Development — Clean Energy and EV Jobs",
    description:
      "Clean energy employed about 3.56 million Americans in 2024 and grew about three times faster than the overall economy. See where the EV jobs are.",
    image: "/og/workforce-economic-development.jpg",
  },
  {
    path: "/self-driving-vehicles",
    title: "Self-Driving Cars & Delivery Robots — Why They Run Electric",
    description:
      "Robotaxis and delivery robots are already on American streets. How autonomous vehicles work, what safety looks like, and why they run on electricity.",
    image: "/og/self-driving-vehicles.jpg",
  },
  {
    path: "/evtol-drone-delivery",
    title: "eVTOLs & Drone Delivery — Electric Air Taxis Explained",
    description:
      "What eVTOL air taxis are, how delivery drones move parcels in minutes, and what vertiports, certification and noise mean for electric aviation.",
    image: "/og/evtol-drone-delivery.jpg",
  },
  {
    path: "/sustainable-aviation",
    title: "Sustainable Aviation & eGSE — Cutting Emissions at Airports",
    description:
      "Sustainable aviation fuel can cut lifecycle CO2 by up to 80%. How airports electrify ground equipment and where electric commuter planes fit.",
    image: "/og/sustainable-aviation.jpg",
  },
  {
    path: "/sustainable-maritime",
    title: "Sustainable Maritime — Shore Power and Electric Ferries",
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
      "How Electrifying the US collects, uses, shares and protects your information across the chatbot, calculators, SMS and forms, and your choices.",
    image: "/og/privacy-policy.jpg",
  },
  {
    path: "/terms",
    title: "Terms of Use — Electrifying the US",
    description:
      "The terms for using ElectrifyingTheUS.com, including the AI chatbot, cost calculators, rebate information and SMS, and the disclaimers that apply.",
    image: "/og/terms.jpg",
  },
  {
    // /blog redirects to /news inside the app, which a crawler never runs.
    path: "/blog",
    title: "E-Mobility News & Guides — Electrifying the US",
    description:
      "The latest on electric vehicles, charging, and the clean-transport transition — plus guides and explainers on going electric.",
    image: "/og/news-hub.jpg",
  },
];
