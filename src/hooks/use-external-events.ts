// Fetches upcoming US EV events from the /api/events proxy (which aggregates the
// ICS/RSS feeds configured in the EVENT_FEEDS env var) and maps them onto the
// EventItem shape the Events page renders. ETU's own events are merged ahead of
// these by the page. With no feeds configured the proxy returns [], so this is a
// safe no-op until feeds are added.

import { useQuery } from "@tanstack/react-query";
import { slugify, shortZone, type EventItem } from "@/data/events";
import evCharging from "@/assets/ev-charging.jpg";
import evFamily from "@/assets/ev-family.jpg";
import workforce from "@/assets/workforce.jpg";
import rideshareFleet from "@/assets/rideshare-fleet.jpg";
import reducedEmissions from "@/assets/reduced-emissions.jpg";
import micromobility from "@/assets/micromobility.jpg";
// Curated per-event flyer images (override the generic pool for a specific event).
import sowGoodSaturday from "@/assets/events/sow-good-saturday.png";
import everythingEnvironmentalFest from "@/assets/events/everything-environmental-fest.jpg";
import monroeFirstResponder from "@/assets/events/monroe-first-responder-workshop.jpg";

// Image pool — external feed events have no image of their own, so we cycle
// through these generic EV photos by index for visual variety. (Deliberately
// excludes branded event flyers like "From Pump to Plug".)
const IMAGE_POOL = [evFamily, evCharging, reducedEmissions, workforce, rideshareFleet, micromobility];

// Curated overrides keyed by the source event id (driveelectricmonth.org/event
// ?eventid=NNNN) or, for myeva.org/EventCalendarApp events, the URL path slug
// (evaevents.eventcalendarapp.com/<slug>). The public feeds give these events a
// generic title, a stub description, or just a venue name, so we supply the real
// description + complete street address pulled from each event's own page. Matched
// against the source URL, so they stay attached even if the feed re-sorts.
const EVENT_OVERRIDES: Record<string, { title?: string; description?: string; location?: string; image?: string }> = {
  // "Sow Good Saturday" at Baton Roots Community Farm — use the event's own flyer.
  "5318": { image: sowGoodSaturday },
  // EVA of Ohio "Everything Environmental Fest" (myeva feed gives only the venue
  // name) — show just the city/state on the location line and use the event's flyer.
  "everything-environmental-fest": {
    location: "Huber Heights, OH",
    image: everythingEnvironmentalFest,
  },
  // "Lafayette Cars and Coffee Electric Avenue" (myeva feed gives only the street
  // address) — show just the city/state so the location line reads "Lafayette, CO".
  "lafayette-cars-and-coffee-electric-avenue-1": {
    location: "Lafayette, CO",
  },
  // NY Capital District EVA "National Night Out" (myeva feed gives only the venue
  // name) — show just the city/state so the location line reads "Schenectady, NY".
  "national-night-out": {
    location: "Schenectady, NY",
  },
  // "2026 Wisconsin EVA Road Trip" (myeva feed gives only "Lambeau Field") — show
  // just the city/state so the location line reads "Green Bay, WI".
  "2026-wisconsin-eva-road-trip": {
    location: "Green Bay, WI",
  },
  // Metuchen Green Fair — feed gives a generic title + stub description; supply the
  // organizer's real name, city/state pin, and full event copy.
  "5346": {
    title: "Metuchen Green Fair",
    location: "Metuchen, NJ",
    description:
      "Join us during the Metuchen Street Fair to learn more about:\n" +
      "• Test Drive Electric Vehicles\n" +
      "• Clean Energy Programs\n" +
      "• Native Plants and Invasive Species\n" +
      "• Kids Activities!\n\n" +
      "Thanks to a Grant for test drives from Plug-in-America, we are offering snack or dessert vouchers for the first 50 EV test drives.\n\n" +
      "Metuchen's Environmental Commission Green Fair in Peterson Park in downtown Metuchen, attached to the Street Fair.\n\n" +
      "August 16th, 2026 · 11am to 3pm · Metuchen Town Plaza\n\n" +
      "We are expecting excellent foot traffic and a good cross-section of the public to visit the vehicles we have on display. A number of green organizations are participating with fun activities for the kids. Talk to people who have been driving electric about their experiences and check out some of the newest vehicles available.\n\n" +
      "• 2 display vehicles (max allowed) by township.\n" +
      "• Max 5 vehicles offering test drives with $250 stipend.\n" +
      "(We are clarifying if we can do shifts from 11–1 & 1–3 to swap out vehicles.)",
  },
  // Central Florida EVA Chapter Meeting (myeva feed gives only "Rivian Orlando") —
  // show just the city/state so the location line reads "Orlando, FL".
  "central-florida-eva-chapter-meeting": {
    location: "Orlando, FL",
  },
  // HC3 Electrify Summit Fair, Breckenridge — feed title drifts ("Breckenridge" →
  // "Summit Electrified Fair"); lock it, add the "Breckenridge, CO" pin + real copy.
  "5332": {
    title: "Summit Electrified Fair",
    location: "Breckenridge, CO",
    description:
      "Curious about heat pumps? Ready to try induction cooking? Wondering how electric cars perform in the mountains? Come see, touch, and test the future of home energy at HC3's Electrify Summit Fair. Chat with local vendors, watch a live cooking demo, take an e-bike or EV for a spin, and find out what rebates from HC3, Xcel Energy, and the state of Colorado could mean for your home.",
  },
  // EV First Responder Workshop, Monroe Twp — lock the real title + "Monroe Township, NJ" pin.
  "5327": {
    title: "EV First Responder Workshop at Monroe Twp Fire District #2",
    location: "Monroe Township, NJ",
    image: monroeFirstResponder,
    description:
      "New Jersey EVA is pleased to offer an EV awareness workshop for first responders in New Jersey. This workshop is particularly suitable for firefighters and aims to increase awareness of EV-specific safety procedures for first responders deployed to a scene involving electric vehicle collisions. The program comprises one hour of in-class presentation at 7 PM followed by 1 hr of EV show, which covers hands-on inspections of various plug-in electric vehicles using the First Responder Guide.\n\n" +
      "We call for EV volunteers to bring their vehicles to show them to the first responders:\n" +
      "• let them find the safety disconnect\n" +
      "• answer questions related to EV buying, EV charging and maintenance\n" +
      "• share your joy of driving electric\n\n" +
      "By registering at this portal, you are committed to the EV show portion only and you will arrive between 7:30 and 7:40 PM. If you are interested in attending the entire session, please mention it in the comments and arrive 6:45 PM.\n\n" +
      "Dinner (e.g. pizza and beverages) will be provided to all who bring their EV.\n\n" +
      "For effective planning, we are asking EV volunteers to register by August 12, 2026. By registering early, we can get food for everyone. And as we get closer to the event, communication will be sent to registered people. You don't want to miss on it.",
  },
  "5250": {
    location: "Metra Station Triangle Lot, 24 S. Summit St, Park Ridge, IL 60068",
    description: "Start by learning from some of your Park Ridge neighbors and local businesses about the different makes and models to reduce their dependence on fossil fuels and become energy independent!",
  },
  "5109": {
    location: "Citizens Bank Drive Through, 408 East Main Street, Campbellsville, KY 42718",
    description: "This is a typical community wide Fourth of July Celebration with a parade, downtown community gathering. Evolve Ky had a table/booth with an EV showcase last year and had a great participation and will repeat this event this year.",
  },
  "5274": {
    location: "Downtown Ventura, 1 North Palm Street, Ventura, CA 93001",
    description: "Continuing our multi-year EV Outreach and Education to the community, the EV Advocates of Ventura County will once again participate with an EV Showcase and Education Booth. Our showcase of ten vehicles will be filled with enthusiastic owners.\n\nRegister to participate, show your vehicle, or help educate others about EV's.",
  },
  "5267": {
    location: "Downtown Hopkins, 923 Mainstreet, Hopkins, MN 55343",
    description: "Join Recharge Minnesota and the City of Hopkins as we host an EV petting zoo at the 2026 Raspberry Festival!",
  },
  "5287": {
    location: "Quantum Signal, 200 N Ann Arbor St, Saline, MI 48176",
    description: "The parking lot of Quantum Signal is on the side street of E McKay St where EVs will be showcased.",
  },
  "5298": {
    location: "St. John's North Lot, 525 Central Ave., Highland Park, IL 60035",
    description: "Join us for an EV showcase at the Highland Park Vintage Car Show on August 22. We expect 2,000 visitors to attend the show, and will include electric vehicles to demonstrate how people can be more sustainable with their vehicle choices. Owners of specific EV models will share their experience of owning and driving an EV. More information is at: https://www.enjoyhighlandpark.com/vintage-car-show.",
  },
  "5286": {
    title: "DTE Sterling Heights Ride & Drive",
    location: "Sterling Heights City Hall, 40555 Utica Road, Sterling Heights, MI 48313",
    description: "We're working on finalizing the details for this event. Check back later for more information.",
  },
  "5265": {
    location: "Indian Creek Plaza, Caldwell, ID",
    description: "This year's Drive Electric will be in Caldwell, Idaho. We would be directly adjacent to the Indian Creek Plaza, where they are featuring Live Music (oldies), a food truck, and one other community event (TBD). Notice the car show above we would be granted the same parking area S 7th Avenue and Arthur.",
  },
  "5272": {
    title: "Blue Ridge EV Club Fall EV Car Show",
    location: "Asheville, NC",
    description: "SAVE THE DATE: Blue Ridge EV Club is planning another big fall EVent! Location and details will be announced as soon as they are secured.",
  },
  "5288": {
    title: "Poolesville Day Electric Vehicle Show",
    location: "Anytime Fitness & Bassett's Parking Lots, 19950 Fisher Ave, Poolesville, MD 20837",
    description: "This year's theme will be Camping with EVs.\n\nPoolesville Green's 2026 National Drive Electric Month (NDEW) Poolesville Day Electric Vehicle Show will again be huge! In the past, we had nearly 200 vehicles registered, and 10 to 15,000 people. In the past, we have been the largest NDEW event worldwide (based on registered vehicles). We expect even more visitors, more highlights, more big sponsors, manufacturers, and dealerships, more rides and drives, more giveaways, and more FUN this coming year! Let's make 2026 the biggest and best year ever. Come help us make it happen!",
  },
  "5293": {
    location: "Salem State University / Marblehead Rail Trail, 121 Loring Ave, Salem, MA 01970",
    description: "Food and beverages will be available for purchase onsite.\n\nWant to showcase your ride? Interested in sponsoring? Have helmets to lend out? Got questions? Please contact Stacy at skilb@salem.com or (978) 745-9595 x41013.\n\nWhether attending or exhibiting, we hope to see you there!",
  },
  "5295": {
    location: "New London Historical Village, 179 Little Sunapee Road, New London, NH 03257",
    description: "On September 19th, step into the future of clean energy and electric mobility. Discover electric cars, trucks, vans, bicycles, lawn & garden equipment. Power your household with solar panels and home batteries. Use heat pumps to heat and cool your living space. Save energy with insulation, air-sealing and efficient appliances. Connect with local nonprofits promoting sustainability. 12 Noon to 3 PM. See you there!",
  },
  "5302": {
    title: "EV Showcase at Monarchs on the Mountain Festival",
    location: "Chandler Park Community Center Grounds, 6500 W 21st St, Tulsa, OK 74127",
    description: "Tulsa Area Clean Cities invites you to join us for our annual EV showcase at the 2026 Monarchs on the Mountain festival on September 19th from 9AM-1PM. Located on the grounds of the Chandler Park Community Center, we will have EVs of various makes and models on display for event attendees to visit and test drive at the discretion of their respective owners and participating dealerships. For owners and dealerships interested in featuring their vehicles for this showcase, please register on this page to confirm your spot for the event.",
  },
  "5294": {
    location: "50 Otis Street, Westborough, MA 01581",
    description: "Watch video of previous EV Expo (courtesy of Westborough TV).",
  },
  "5291": {
    title: "Southeast Idaho Electric Car Show",
    location: "Lookout Point Park, 426 W Lewis St, Pocatello, ID 83204",
    description: "Portneuf Resource Council is holding our annual Southeast Idaho Electric Car Show in Pocatello on Saturday September 26th (from 9am to 1:00pm) in conjunction with National Drive Electric Month. The show is at the same time as the Portneuf Valley Farmers Market at Lookout Point in the south parking lot of the Marshall Public Library. Seasoned local electric vehicle owners will be showing their electric and plug-in hybrid vehicles and will be able to answer questions about range, cost, maintenance, charging and more.\n\nWe are arranging for local officials and community speakers at 11:00. They will speak for a few minutes to update us on Idaho's charging station rollout, EV cost advantages, how the grid will handle this new demand and more. A variety of non-profits will be tabling. For more info or to showcase your vehicle, go to: driveelectricweek.org.",
  },
  "5303": {
    location: "Prince Kuhio Plaza, 111 E. Puainako St., Hilo, HI 96720",
    description: "Hawaii EV Association, Hawaiian Electric, and Sustainable Energy Hawaii are hosting the 2026 He Ala Pono Electric Vehicle and Sustainability Fair, celebrating National Drive Electric Month and sustainability on Hawaii Island.\n\nThis annual event will take place at the Prince Kuhio Plaza in Hilo, featuring a wide variety of indoor and outdoor activities that highlight organizations focused on clean transportation, clean energy, food security, environmental protection, community resilience, and green infrastructure.\n\nWe will showcase the latest EVs and offer the opportunity to ride or test drive the vehicles. Details to follow.",
  },
  "5304": {
    location: "StoreLocal Napa, 1111 Soscol Ferry Road, Napa, CA 94558",
    description: "Charging is available at the event site: 30 Autel 10.4 kW AC chargers and 6 Kempower 50 kW DC fast chargers.",
  },
  "5279": {
    title: "Sustainability Action EV Show — Bikes, Buses, Cars, Trucks",
    location: "South Park, 1141 Massachusetts St., Lawrence, KS 66044",
    description: `This will be our eighth annual electric vehicle showcase, on Sunday, 27 September 2026, 11:00am-3:00pm, in South Park, which will be closed to traffic.\n\nWe are emphasizing e-bicycles and ICE-to-EV conversions, but we'll once again have a strong showing of factory EVs, including buses and trucks. There will be displays by local bicycle shops, solar companies featuring bi-directional charging, auto dealers, and a local ICE-to-EV conversion program. The University of Kansas Engineering School will display EV battery technology.\n\nThe U.S. transportation sector now produces more climate-warming emissions than the electric generation sector. ICE automobiles produce the most at about 60%; even when charged by coal-fired electricity, EVs' greater efficiency results in lower emissions. But the prize goes to e-bicycles — the most efficient land transportation, and an order of magnitude better when electrified.\n\nSustainability Action Network welcomes our two co-sponsors this year: the City of Lawrence Sustainability Office and the City of Lawrence Transit System.`,
  },
  "5199": {
    location: "Maple Ave Parking Lot near Borough Hall, 10 Maple Ave., Madison, NJ 07940",
    description: `This will be the fifth annual EV EXPO in Madison, held in conjunction with Bottle Hill Day — a huge fair with hundreds of vendors, family amusements, food and music that draws between 10,000 and 20,000 attendees each year.\n\nLast year at the Expo we featured 13 brands of EVs (Honda, Chevy, Ford, Tesla, Lucid, Polestar, Karma, Rivian, Mercedes, Porsche, Audi, VW, Hyundai) brought by owners and dealers, several offering test drives. This year there will be no restrictions on when you can arrive or leave. We will be adjacent to the Classic Car Show, so we anticipate additional attendees and interesting conversations!`,
  },
  "5289": {
    title: "Thousand Oaks Rotary Club Street Fair and Electric Vehicle Showcase",
    location: "Chick-fil-A Parking Lot, 449 N. Moorpark Road, Thousand Oaks, CA 91360",
    description: `9am – 4pm. Our booth is at the street.\n\nMeet local EV owners and enthusiasts, check out their cars, and find out about ownership. From the early Nissan Leaf, Tesla models, Chevy Equinox EV, Blazer EV & Silverado EV, Hyundai Ioniq 5, 6 & 9, Kia EV6, EV9 and many more — we plan on bringing together a good representation of available EVs.\n\nLearn about available incentives which can reduce the cost of your EV! Make your own fuel with a solar system and drive on sunshine. EVs run virtually maintenance free and have good to excellent safety ratings.\n\nEnhance your knowledge of local environmental programs and energy-saving incentives, and connect with those who can help get your energy-saving project accomplished. EVs are good for you, good for the environment, and good for your wallet. No gas required, but they are a gas to drive…\n\nOrganized and sponsored by The EV Advocates of Ventura County.`,
  },
  "5126": {
    location: "Pellissippi State Community College (PSCC), 10915 Hardin Valley Rd, Knoxville, TN",
    description: `The Knoxville Electric Vehicle Association (KEVA) and Drive Electric Tennessee (DET) are working to bring you the 2026 Knoxville Drive Electric Festival on the campus of Pellissippi State Community College (PSCC) at 10915 Hardin Valley Rd, Knoxville. The Festival has been among the largest National Drive Electric Month events in North America (out of about 300), with over 120 EVs representing 40 different models.`,
  },
  "5254": {
    location: "Ventura Harbor Village, Spinnaker Drive, Ventura, CA",
    description: `This year, we will be returning to the Ventura Harbor Village with another outstanding event. On the main lawn, you will find a fantastic showcase of electric vehicles — Cars, Vans, SUVs, Trucks, Bikes, and other electric equipment, as well as vintage EV conversions. The cars are displayed by their owners, who have years of EV ownership and have driven many petroleum-free miles. They are all enthusiastic and willing to discuss their experiences and answer your questions about owning and living with an EV.\n\nIf you own an EV, register via the RSVP button and bring your vehicle to the showcase to meet and mingle with members of our local EV community. Enjoy the opportunity to visit Ventura Harbor Village for excellent dining and shopping.\n\nThis will be the 14th National Drive Electric Week Showcase in Ventura County. Last year EV owners displayed 46 different EV models, ranging from a first-generation Nissan Leaf to a 2026 Hyundai Ioniq 9, and from electric motorcycles to a brand-new VW ID Buzz microbus. The combined EV mileage exceeded 3 million miles.\n\nThis event is sponsored by the Santa Barbara-Ventura Chapter of the Sierra Club and the Clean Power Alliance. On the ground, the organization is provided by the EV Advocates of Ventura County.`,
  },
  "5248": {
    location: "Liberty Street outside City Hall, Schenectady, NY",
    description: `Join us in downtown Schenectady for the 2026 NY Capital District Drive Electric & Sustainability Fair — a nationally recognized celebration of clean transportation, innovation, and community action. Held during National Drive Electric Month, this free, family-friendly event continues its legacy as one of the largest Drive Electric events in the United States.\n\nHosted along Liberty Street outside City Hall, the event has showcased nearly 100 personally owned electric and plug-in hybrid vehicles. Meet local owners, ask questions, and get behind the wheel with ride-and-drive experiences from leading manufacturers and dealerships.\n\nThe event is held in partnership with the City of Schenectady and the Schenectady Greenmarket — browse fresh local produce and artisan goods. With strong support from EV charging innovator Lynkwell, passionate volunteers, and regional sustainability supporters, the fair continues to accelerate the transition to electric mobility across the Capital Region.\n\nREGISTER TODAY and help us stay #1 in the USA!`,
  },
  "5210": {
    location: "The Boardwalk North Parking Lot of Medical Centre 1, 430 The Boardwalk, Waterloo, ON N2T 0C2",
    description: `National Drive Electric Month (NDEM) 2026! Saturday, October 3, 2026 — 11am to 3pm.\n\nIt's WREVA's 12th-year anniversary of hosting a National Drive Electric Month event in Waterloo Region! Request to be added to our newsletter: WREVAG@gmail.com.`,
  },
  "5299": {
    location: "Beltrami Electric Cooperative, Bemidji, MN",
    description: `We invite you to join us at Beltrami Electric for this year's EV Car Show on Thursday, Oct. 1. The event kicks off at 4 p.m., where guests will have the chance to visit with EV owners and get up close and personal with a variety of EVs.\n\nRepresentatives from Beltrami Electric Cooperative and Otter Tail Power Co. will be on hand to share how you can save with off-peak rates and rebates on EV charging.`,
  },
  "5297": {
    location: "Downtown Salem, MA",
    description: `For the EV curious: come see the parade and check out EVs at this fun annual event! Happy Halloween!\n\nEV owners: NOT your typical EV showcase! This is not a "ride and drive" event and there will be limited time to interact with parade-goers. The intent is to show Salem residents and visitors how quiet and clean EVs are. You are encouraged to decorate your ride, but you are welcome to simply roll with us. Personal Electric Vehicles (PEVs) such as e-bikes, e-trikes, OneWheels, scooters, and skateboards are also welcome.\n\nThe 29th Annual Salem Chamber of Commerce Haunted Happenings Grand Parade takes place on Thursday, October 1, 2026 — a special nighttime tradition that officially kicks off Salem's Halloween season, with color, pageantry, music, and thousands of students and local business owners. Over 15,000 spectators are expected. Parade lineup starts at 5:00, vehicles must arrive by 5:30, and the parade steps off at 6:30, wrapping up around 8:15 at Salem Common.`,
  },
  "5135": {
    title: "DriveTheFutureEV.com NDEM",
    location: "Well Crafted Brewery and Beer Garden, Ambler Yards, Ambler, PA",
    description: `Join us for the 2026 National Drive Electric Month event in Ambler, Pennsylvania — a free, family-friendly celebration of all-electric vehicles and clean energy! Sit inside, ask questions, and enjoy ride-and-drives across an impressive lineup of current-production EVs from Audi, BMW, Cadillac, Chevrolet, Dodge, Ford, GMC, Genesis, Honda, Hyundai, Kia, Lucid, Mercedes-Benz, Nissan, Polestar, Porsche, Rivian, Subaru, Tesla, Toyota, and Volkswagen — plus classic out-of-production EVs you can buy certified pre-owned.\n\nRick Denzien (founder of DriveTheFutureEV.com) and a full team of EV experts and solar specialists will be on site all day to answer your questions about smart EV purchasing, maximizing federal & Pennsylvania tax credits, home & business solar + EV charging, real-world cost savings, and how to ditch gas for good. Special displays include conversion vehicles, electric scooters & bikes from Ambler EV, a sleek electric motorcycle, and hourly Tesla light shows courtesy of the Delaware Valley Tesla Owners Club. Enjoy live music, local vendors, food trucks, and beer & wine from Well Crafted.\n\nSaturday, September 26, 2026 • 12:00 PM – 4:00 PM. Free admission • All ages welcome • Rain or shine. Presented by DriveTheFutureEV.com in partnership with DenLeeMusicSchool.com.`,
  },
  "5275": {
    title: "EV Showcase at the Port of Hueneme Banana Festival",
    location: "Port of Hueneme, CA",
    description: `Join thousands from our community in celebrating the 13th annual Banana Festival at The Port of Hueneme, a truly diverse working port. This festival features many attractions, including Port Tours, a Kids Zone, Live Bands, tasty (banana-themed) eats, and shopping fun.\n\nAn EV Showcase and Educational Booth will be provided by the Electric Vehicle Advocates of Ventura County. Members, some with years of experience owning and driving EVs, will answer your questions about available EVs, rebates and incentives, and charging at home, the workplace, or on the road. We have been allocated space for 10 vehicles — please register if you would like to participate with your vehicle. Otherwise, come without your vehicle to help educate, mingle with other EV drivers, and eat bananas.\n\nThe Port of Hueneme is a recognized leader in sustainable port operations and has been Green Marine Certified since 2018. On the Port Tour you can observe electric cranes, forklifts, and yard tractors, plus shore power that lets cargo ships shut down their engines while in port.`,
  },
  "5082": {
    title: "EV Test Drive & Information Expo",
    location: "Daimler Truck North America, 4555 N Channel Ave, Portland, OR (guest parking: 4085 N Anchor St)",
    description: `2026 National Drive Electric Month — Oregon Electric Vehicle Association Test Drive & Information Expo. Sunday, September 20, 2026, public hours 10 AM to 4 PM.\n\nThe Oregon Electric Vehicle Association (OEVA) is a welcoming, all-volunteer 501(c)(3) nonprofit dedicated to accelerating EV adoption across Oregon. OEVA brings together EV owners of all makes and models, enthusiasts, and curious newcomers — perfect whether you're considering your first purchase or just want unbiased info on charging, range, maintenance, and incentives.\n\nThis is one of our biggest events, with hands-on test drives, owner display vehicles, EV conversions of gas vehicles, presentations by EV experts, and helpful local EV-related companies. Registered guests and volunteers get food coupons for on-site food vendors. Admission and parking are free.\n\nHeld at the Daimler Truck North America headquarters on Swan Island in North Portland — our thanks to DTNA for the use of their facilities.`,
  },
  "5300": {
    title: "LOSN Clean Energy and EV Fair",
    location: "Lake Oswego, OR",
    description: `Join us for Lake Oswego's 9th Annual Clean Energy and Electric Vehicle Fair — a fun, family-friendly event celebrating our community's leadership in clean transportation and sustainable living.\n\nWhy attend? Lake Oswego boasts the highest per capita EV ownership in Oregon. Meet dozens of local EV owners and learn firsthand why they chose their cars and what owning an EV is really like. This free event features the popular Electric Vehicle Ride & Drive — test drive the latest models from top dealers. Beyond the road, explore home electrification solutions including high-efficiency heat pumps, induction stoves, solar panels and battery storage.\n\nWhat to expect:\n• Explore the latest EVs from Ford, GM, Rivian, Volkswagen, Nissan, Genesis, Hyundai, Tesla, Kia, Polestar, and more.\n• Test drive select EVs from local dealerships.\n• Talk with experts and neighbors about EV incentives, charging, and maintenance.\n• Enjoy local food from Spice of Africa — the first 60 test drivers get a free lunch!\n\nFree admission. Open to all. Please register today and join us on September 19th, 2026.`,
  },
  "5296": {
    title: "Electric Ave - Sustainability Fair & EV Car Show",
    location: "Park Avenue, Downtown Winter Park, FL",
    description: `The City of Winter Park's Natural Resources & Sustainability Department invites you to Electric Ave, our 5th Annual Sustainability Fair & EV Car Show! This family-friendly event brings the community together to celebrate clean transportation and sustainable living.\n\nExplore 30+ electric vehicles — cars, buses, e-bikes, and more — displayed along beautiful Park Avenue in downtown Winter Park. Meet EV owners, hear their real-world experiences, and get your questions answered. Visit our Sustainability Fair featuring EV experts, sustainability organizations, local businesses, and interactive exhibits.\n\nEnjoy a morning of activities for all ages: a Kids Zone with games, face painting, a bounce obstacle course and music; Animal Ambassadors from Amazing Animals Inc.; Bubble Bus Orlando; FREE Kona Ice; sustainability booths and vendors; plus raffles & giveaways. Our weekly Winter Park Farmers Market is directly adjacent.\n\nImportant: EVs will be displayed along Park Avenue, while vendors and activities are in Central Park adjacent to the showcase. Space is limited, so register today. Questions: sustainability@cityofwinterpark.org.`,
  },
  "5301": {
    location: "City Hall east parking lot (across from New Pioneer Coop), Iowa City, IA",
    description: `Visit the 6th annual Iowa City Climate Fest EVs at the Market! Running alongside the Iowa City Farmers Market on Saturday, September 26, 2026 from 7:30 a.m. to Noon. Whether you already own an EV or are EV-curious, talk to real local drivers about driving electric.\n\nActivities: check out EVs — cars, trucks, SUVs, and e-bikes; talk to EV owners; learn about benefits and EV resources; and grab some EV goodies from NDEW and Iowa City's Climate Action Division. City staff will provide information on local incentives, initiatives, and charging station locations.\n\nDrivers: please register your vehicle to participate as space is limited; arrive onsite between 7:15-7:25 a.m. The EV show runs alongside the Farmers Market on the east side of City Hall, in the parking lot across from New Pioneer Coop. (The Farmers Market is in the Chauncey Swan Ramp; the EV show is in the City Hall east parking lot — opposite sides of E Washington St.)`,
  },
};

/**
 * An event's identity on the site it came from: the driveelectricmonth eventid
 * when present, else the EventCalendarApp URL path slug
 * (evaevents.eventcalendarapp.com/<slug>). Null when the link is neither.
 *
 * Exported because the Events page needs the SAME rule to recognise a feed
 * event that is also in site_events. The 0019 import scraped
 * driveelectricmonth.org, which this feed already aggregates, so 57 events
 * arrive from both directions — see the dedupe in Events.tsx.
 *
 * It has to key on the URL rather than title + date: the import rewrote several
 * titles that were unusable as-is ("NDEM" → "National Drive Electric Month
 * Showcase", "Poolesville, MD" → "Poolesville Day EV Show"), so the two copies
 * of one event no longer agree on what it is called. The source URL is the only
 * field both sides carry verbatim.
 */
export function sourceEventKey(registerUrl?: string): string | null {
  return (
    registerUrl?.match(/eventid=(\d+)/)?.[1] ||
    registerUrl?.match(/eventcalendarapp\.com\/([^/?#]+)/i)?.[1] ||
    null
  );
}

function applyOverride(item: EventItem): EventItem {
  const id = sourceEventKey(item.registerUrl);
  const o = id ? EVENT_OVERRIDES[id] : undefined;
  if (!o) return item;
  const title = o.title ?? item.title;
  // A renamed event gets a fresh slug from its real title so its detail page is
  // unique (several feed events share the generic "National Drive Electric Month").
  const slug = o.title
    ? `${slugify(title)}-${item.month.toLowerCase()}-${item.day}-${item.year}`
    : item.slug;
  return {
    ...item,
    title,
    slug,
    description: o.description ?? item.description,
    location: o.location ?? item.location,
    region: o.location ?? item.region,
    image: o.image ?? item.image,
  };
}

interface FeedEvent {
  title: string;
  startISO: string;
  endISO?: string;
  location?: string;
  description?: string;
  url?: string;
  source?: string;
  /** Featured image scraped from the source event page (og:image), when available. */
  image?: string;
}

const MONTH_ABBR = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];

const mapToEventItem = (e: FeedEvent, index: number): EventItem => {
  const d = new Date(e.startISO);
  const hasTime = !(d.getUTCHours() === 0 && d.getUTCMinutes() === 0);
  const time = hasTime
    ? new Intl.DateTimeFormat("en-US", {
        hour: "numeric", minute: "2-digit", timeZone: "America/New_York", timeZoneName: "short",
      }).format(d)
    : "All day";
  const location = e.location?.trim() || "See event details";
  const month = MONTH_ABBR[d.getUTCMonth()];
  // Many feed events share the generic "National Drive Electric Month" title — make
  // each box's title exact by appending its city (a curated override replaces it
  // with the real event name where we have one).
  const title = /^national drive electric (month|week)$/i.test(e.title.trim()) && location !== "See event details"
    ? `${e.title.trim()} — ${location}`
    : e.title;
  // Stable slug (title + date) so each feed event gets its own /events/{slug}
  // page that resolves the same event on reload.
  const slug = `${slugify(title)}-${month.toLowerCase()}-${d.getUTCDate()}-${d.getUTCFullYear()}`;
  return {
    month,
    day: String(d.getUTCDate()),
    year: d.getUTCFullYear(),
    title,
    type: "EV Event",
    location,
    region: location,
    time,
    description: (e.description ?? "").slice(0, 1200) || "EV event in the U.S. — see the organizer's page for full details.",
    // Featured image from the source event page when we have one; otherwise cycle
    // the generic EV photo pool for visual variety.
    image: e.image || IMAGE_POOL[index % IMAGE_POOL.length],
    slug,
    registerUrl: e.url,
    external: true,
    source: e.source,
  };
};

async function fetchExternalEvents(): Promise<EventItem[]> {
  try {
    const res = await fetch("/api/events");
    if (!res.ok) return [];
    const data = await res.json();
    const list: FeedEvent[] = Array.isArray(data?.events) ? data.events : [];
    return list.map(mapToEventItem).map(applyOverride);
  } catch {
    return [];
  }
}

export function useExternalEvents(): { events: EventItem[]; loading: boolean } {
  const q = useQuery({
    queryKey: ["external-events"],
    queryFn: fetchExternalEvents,
    staleTime: 60 * 60 * 1000, // 1h — matches the CDN cache on /api/events
  });
  // Same two-letter zone treatment the CMS/curated events get in useEvents —
  // feed events sit in the SAME list, so normalising one source and not the
  // other would leave "MST" and "MT" adjacent on the page.
  const events = (q.data ?? []).map((e) => ({ ...e, time: shortZone(e.time) }));
  return { events, loading: q.isLoading };
}
