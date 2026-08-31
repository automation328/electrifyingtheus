-- Thirteen conferences and shows, added as DRAFTS for review.
--
-- Twelve came from a hand-supplied list; the thirteenth (Cars at The Station)
-- came from a link sent alongside it. Every one was researched against the
-- organiser's own site, and every register_url below was then fetched and
-- checked to confirm the page actually names that event -- a link that failed
-- that check would have been stored as null rather than guessed at, because
-- these sit on a public page behind a button.
--
-- Three things the research changed, all of them deliberate and all flagged to
-- the requester rather than applied quietly:
--
--   * Intersolar Texas is in DALLAS in 2026, not Grapevine. Grapevine was the
--     2025 edition at the Gaylord Texan; the organiser announced the move to the
--     Sheraton Dallas for 2026.
--   * RE+ 2026 runs November 16-19, not the 17th. The 17th is when the exhibit
--     hall opens; conference programming starts on the 16th.
--   * A fourteenth entry, the NERUCA Conference, is NOT here. NERUCA is the
--     North East Regional Urgent Care Association -- a healthcare body, not an
--     energy one. Real conference, right city, right date, wrong subject.
--
-- End dates are included where the event runs more than one day; the source list
-- had none. status = 'draft' throughout, so nothing reaches the site until
-- somebody publishes it, and hero_hidden keeps them off the homepage carousel
-- even after that (0018).

insert into public.site_events
  (event_date, end_date, title, type, location, region, time, description,
   register_url, register_label, image, featured, hero_hidden, hidden, status)
values
  -- intersolar-tx
  ('2026-09-01', '2026-09-02', 'Intersolar & Energy Storage North America Texas - Dallas, TX', 'Expo',
   'Sheraton Dallas Hotel, Dallas, TX',
   'Dallas, TX', 'All day',
   'IESNA Texas is the Texas regional edition of the Intersolar & Energy Storage North America tradeshow and conference series, run by the same organiser as the national flagship show in San Diego. The 2026 edition would be the third, scheduled for September 1-2 at the Sheraton Dallas Hotel after moving to Dallas from Austin (2024) and Grapevine (2025). It pairs an exhibit hall of solar, storage and balance-of-system suppliers with a conference program of about eleven sessions plus two NABCEP workshops, covering ERCOT grid dynamics, storage regulation, distributed energy resources, project finance and state policy. The audience is people working the Texas market: installers, EPCs, developers, engineers, manufacturers, utilities, financiers and policy specialists.',
   'https://www.iesna.com/texas/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/2.jpg',
   false, true, false, 'draft'),
  -- rem-us
  ('2026-09-01', '2026-09-03', 'Renewable Energy Markets 2026 - Washington, DC', 'Conference',
   'Omni Shoreham Hotel, 2500 Calvert St NW, Washington, DC 20008',
   'Washington, DC', 'All day',
   'Renewable Energy Markets (REM) is an annual US conference on the clean electricity marketplace, organised by the nonprofit Center for Resource Solutions and running since 1996. The 2026 edition covers renewable electricity policy, procurement practice, market design and certificate and claims issues, and is aimed at corporate energy buyers, utilities and generators, renewable energy marketers, and federal and state government staff. The programme is structured as one day of optional pre-conference workshops on September 1, followed by two days of main conference sessions on September 2 and 3. Registration is open, with full-conference, single-day and workshop-only options, plus reduced rates for government, non-profit and student attendees.',
   'https://www.renewableenergymarkets.com/us/home', 'Event details', 'https://electrifyingtheus.com/media/events/headers/4.jpg',
   false, true, false, 'draft'),
  -- cleantech-showcase
  ('2026-09-03', null, '2026 CleanTech Innovation Showcase - Richland, WA', 'Conference',
   'Pacific Northwest National Laboratory, Discovery Hall, Richland, WA',
   'Richland, WA', '7:45 AM - 4:00 PM PT',
   'The CleanTech Innovation Showcase is CleanTech Alliance''s annual one-day gathering of the Pacific Northwest clean energy community, held for the 13th time in 2026 at Pacific Northwest National Laboratory''s Discovery Hall in Richland. The programme mixes keynote talks on sector trends with 25 short breakout sessions - 15 in the morning and 10 in the afternoon - in which companies and research institutions from across the U.S. and Canada present their current technologies and projects. Attendees can also tour PNNL''s Innovation Pavilion, visit exhibitor booths and demonstrations, and network over breakfast, lunch and a closing happy hour reception. It is aimed at corporate sustainability and environmental leaders, researchers, entrepreneurs, investors, elected officials and policy staff, and STEM students. In 2026 it is co-located with Washington State Fusion Week and runs back-to-back with it.',
   'https://www.cleantechalliance.org/2026-cleantech-innovation-showcase/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/6.jpg',
   false, true, false, 'draft'),
  -- replus-midwest
  ('2026-09-09', '2026-09-10', 'RE+ Midwest 2026 - Schaumburg, IL', 'Expo',
   'Renaissance Schaumburg Convention Center Hotel, 1551 Thoreau Drive North, Schaumburg, IL 60173',
   'Schaumburg, IL', 'All day',
   'RE+ Midwest is a two-day regional clean energy trade show and conference produced by the Solar Energy Industries Association (SEIA) and the Smart Electric Power Alliance (SEPA). It focuses on how solar, energy storage, wind and EV charging infrastructure get built and connected in the Midwest, with education sessions on virtual power plants, load growth, grid reliability and resilience, community solar, agrivoltaics, siting and land use, and state-level policy briefings. An exhibit hall of regional and national suppliers runs alongside the conference programming; the organisers describe an intimate event of roughly 1,200 attendees and more than 90 exhibiting companies. It is aimed at developers, installers, utilities, technology providers, investors and policymakers working in the region, and SEIA and SEPA members get discounted registration.',
   'https://re-plus.events/midwest/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/8.jpg',
   false, true, false, 'draft'),
  -- cars-at-the-station
  ('2026-09-11', '2026-09-12', 'Cars at The Station 2026 - Detroit, MI', 'Auto Show',
   'Michigan Central Station and Roosevelt Park, 2001 15th St, Detroit, MI 48216',
   'Detroit, MI', 'All day',
   'Cars at The Station is a free, family-friendly automotive event on the Michigan Central campus and in Roosevelt Park, in Detroit''s Corktown neighbourhood. Now in its third year, it mixes vehicle showcases with ride-and-drives, mobility technology demonstrations from startups based at Michigan Central and Newlab, live music, food and local artisans. Attendance is free and open to the public; vehicle registration for exhibitors has closed.',
   'https://carsatthestation.com/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/10.jpg',
   false, true, false, 'draft'),
  -- grid-to-growth
  ('2026-09-10', null, 'Energy Innovation Summit: Grid to Growth - Columbus, OH', 'Summit',
   'Vue Columbus, 95 Liberty Street, Columbus, OH 43215',
   'Columbus, OH', '12:00 PM - 6:00 PM ET',
   'A half-day summit hosted by BRITE Energy Innovators, Ohio''s advanced energy incubator, looking at how the growth of AI and data centre infrastructure is changing what the state''s electricity grid has to deliver. Sessions cover grid capacity, affordability and reliability, the workforce needed to build out new energy infrastructure, and the capital required to fund it, running as a keynote fireside chat plus three panels and networking time. It is aimed at utility executives, policymakers, energy and technology companies, manufacturers and investors working on Ohio''s energy and economic future. A startup showcase gives selected founders in areas such as grid resilience, energy storage and advanced cooling free exhibit space in front of that audience.',
   'https://brite.org/summit/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/12.jpg',
   false, true, false, 'draft'),
  -- aee-world
  ('2026-09-16', '2026-09-18', 'AEE World Energy Conference & Expo 2026 - Orlando, FL', 'Conference',
   'Orange County Convention Center, Orlando, FL',
   'Orlando, FL', 'All day',
   'AEE World is the Association of Energy Engineers'' flagship annual conference and trade show for people who work in energy efficiency, energy management and decarbonisation. The programme runs across 11 tracks with more than 140 technical presentations — case studies, technology briefings and sector-by-sector efficiency applications — alongside keynotes, an awards banquet and a Technology Expo floor of energy products and services. It is aimed at energy managers, engineers, facility and utility staff, energy service providers and sustainability leads, including those working toward professional credentials. Attendance counts toward continuing education: the organisers list up to 1.2 CEU, 12 PDH or 2.4 AEE credits.',
   'https://aeeworld.org/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/14.jpg',
   false, true, false, 'draft'),
  -- nuclear-symposium
  ('2026-09-23', '2026-09-24', 'Nuclear Symposium 2026 - New York, NY', 'Conference',
   'NY City Bar Association and Verizon Executive Education Center, New York, NY',
   'New York, NY', 'All day',
   'Nuclear Symposium 2026 is a two-day conference organized by the advocacy group Nuclear New York, split across two New York City venues — a half-day afternoon session on September 23 at the NY City Bar Association and a full day on September 24 at the Verizon Executive Education Center. Its stated theme is "Partnerships for Success," and the program is framed around New York State''s commitment to build 5 GW of new nuclear capacity, covering grid reliability, advanced reactor technology, the nuclear fuel cycle, consent-based siting with host communities, and project financing. It is aimed at reactor developers, large energy buyers, capital providers, government officials and policymakers, labor organizations, academics and community leaders. Each day ends with a networking slot: a VIP reception on the Wednesday evening and a happy hour on the Thursday.',
   'https://nuclearsymposium.com/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/16.jpg',
   false, true, false, 'draft'),
  -- making-energy-work
  ('2026-10-14', '2026-10-15', 'Making Energy Work 2026 - Cary, NC', 'Conference',
   'Embassy Suites Raleigh-Durham Research Triangle, 201 Harrison Oaks Blvd, Cary, NC',
   'Cary, NC', 'All day',
   'Making Energy Work is a two-day clean energy conference run by the North Carolina Sustainable Energy Association at a hotel conference venue in Cary, just outside Raleigh. The program tracks state and federal energy policy and regulatory developments and looks at how the electricity, transportation and building sectors can cut their carbon emissions, using keynote talks and breakout sessions. It is aimed at people working in and around the energy sector: clean energy companies, utilities, regulators and policymakers, attorneys, investors, non-profits, students and press. Between sessions the event is built around networking with peers, customers and policy contacts.',
   'https://www.makingenergywork.com/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/18.jpg',
   false, true, false, 'draft'),
  -- people-and-power
  ('2026-10-15', null, 'People and Power in the Energy Transition - Seattle, WA', 'Conference',
   'University of Washington Husky Union Building, Seattle, WA',
   'Seattle, WA', '9:00 AM - 5:00 PM PT',
   'This is the NW Energy Coalition''s annual fall conference, a one-day gathering at the University of Washington''s Husky Union Building in Seattle. It draws energy experts, advocates, utility staff, business representatives and policymakers from Washington, Oregon, Idaho and Montana to take stock of where the Northwest stands in its energy transition and how to keep moving toward a clean, affordable and equitable energy system. Sessions cover putting frontline community voices at the centre of policymaking on data centres and other large loads, lessons learned from community-led clean energy projects, and the policy and regulatory work needed to integrate clean energy technologies into the grid. The day ends with an evening reception, and the organisers offer scholarships, sponsorships and volunteer slots on request.',
   'https://nwenergy.org/fall-2026-conference/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/20.jpg',
   false, true, false, 'draft'),
  -- yale-clean-energy
  ('2026-11-05', '2026-11-06', 'Yale Clean Energy Conference 2026 - New Haven, CT', 'Conference',
   'Yale School of Management, New Haven, CT',
   'New Haven, CT', 'All day',
   'The Yale Clean Energy Conference is a two-day, in-person gathering at the Yale School of Management covering energy access, finance, technology, policy, innovation, and careers. The 2026 edition, themed "Interconnection, Innovation, Impact," runs a mix of keynotes, workshops and tech talks (emerging-market energy transition, critical mineral supply chains, data centers and renewables, battery storage), a cleantech startup pitch competition, a live podcast recording, and structured networking sessions. It is aimed at energy professionals, entrepreneurs, investors, policymakers, researchers, and students, and typically draws more than 500 attendees; it also serves as the annual reunion for alumni of Yale''s Financing and Deploying Clean Energy and Clean and Equitable Energy Development certificate programs. Tickets are public and deliberately low-cost: $150 general admission, $80 for New Haven County residents or where cost is a barrier, $30 for students at other schools, $120 for Yale alumni, and free for current Yale students, faculty, and staff.',
   'https://cleanenergyconference.yale.edu/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/22.jpg',
   false, true, false, 'draft'),
  -- arizona-energy
  ('2026-11-05', null, 'Arizona Energy Future Conference 2026 - Phoenix, AZ', 'Conference',
   'Thunderbird School of Global Management, 401 N 1st Street, Phoenix, AZ 85004',
   'Phoenix, AZ', '9:00 AM - 6:00 PM MST',
   'A one-day conference run by the Arizona Solar Energy Industries Association (AriSEIA) on the state of solar, storage, and electrification in Arizona. The programme is built around panel discussions and a lunch keynote covering federal energy policy and its effect on solar and storage companies, Arizona''s live state policy debates, utility perspectives including Salt River Project, large-load customers and renewable energy markets, and emerging solar business models. It draws roughly 180 attendees from utility-scale, rooftop, and community solar, plus storage and electrification firms, alongside academics, policy advocates, utility staff, and elected officials. The day closes with an exhibitor hall and an evening reception, and the event doubles as a fundraiser for AriSEIA.',
   'https://www.ariseia.org/2026-conference.html', 'Event details', 'https://electrifyingtheus.com/media/events/headers/24.jpg',
   false, true, false, 'draft'),
  -- replus-2026
  ('2026-11-16', '2026-11-19', 'RE+ 2026 - Las Vegas, NV', 'Expo',
   'Las Vegas Convention Center, 3150 Paradise Rd, Las Vegas, NV 89109',
   'Las Vegas, NV', 'All day',
   'RE+ is the largest clean energy trade show and business summit in North America, produced by RE+ Events, jointly owned by the Solar Energy Industries Association (SEIA) and the Smart Electric Power Alliance (SEPA). It grew out of Solar Power International and now spans the whole modern energy business: solar, energy storage, wind, hydrogen and fuel cells, microgrids, and EV charging and infrastructure. The 2026 edition moves to the Las Vegas Convention Center, with conference education sessions on November 16-18 and the exhibit floor open November 17-19. It is built for people doing business across the clean energy supply chain - developers, installers, manufacturers, utilities, financiers and policy staff - combining an exhibition floor with education programming and networking.',
   'https://www.re-plus.com/', 'Event details', 'https://electrifyingtheus.com/media/events/headers/26.jpg',
   false, true, false, 'draft');
