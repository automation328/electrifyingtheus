-- Climate Week NYC 2026 — readable description, and three field fixes.
--
-- The copy was already in the row, but pasted as a single 2,272-character run
-- with every newline stripped: "...accelerate global climate action.Core Agenda
-- and Flagship EventsThe 2026 program shifts..." The detail page renders the
-- description with `whitespace-pre-line` (EventDetail.tsx), so real newlines are
-- all that is needed to get paragraphs back — no markdown, no HTML.
--
-- Two things are deliberately NOT carried over from the pasted text:
--   * the "[1, 2, 3]" citation markers, which are source footnotes, not copy;
--   * the closing "If you are planning to participate, let me know if you would
--     like info on..." — that is an assistant offering to answer a follow-up.
--     On a public page it reads as the site promising help nobody can deliver.
--
-- Keyed by id, not title: this row is the only one of its kind and a title match
-- would be one rename away from silently updating nothing.

update public.site_events
set
  description =
'Climate Week NYC 2026 is the world''s largest annual climate event, running from September 20 to September 27, 2026 in New York City. Hosted by the international non-profit Climate Group in coordination with the United Nations General Assembly, it gathers more than 100,000 global leaders, corporate executives, policymakers and grassroots activists to accelerate global climate action.

The 2026 program shifts its focus from setting future climate goals to delivering practical solutions now.

FLAGSHIP EVENTS

Opening Ceremony (September 21) — Heads of state, CEOs and civil society leaders open the week with keynotes and panel debates.

The Hub Live (September 21–22) — The central program: plenary sessions, executive roundtables and structured breakout sessions on clean tech, electrification and economic growth.

The Nest Climate Campus (September 22–24) — A networking and exhibition campus at the Javits Center for more than 10,000 climate and resilience leaders.

Sustainability LIVE (September 22) — An invite-only executive forum at the Javits Center on corporate ESG metrics and decarbonizing supply chains.

TWELVE CORE THEMES

More than 1,000 events run across the city, organized into 12 programmatic tracks:

• Energy & Electrification — clean energy investment and grid modernization
• Finance & Clean Growth — reallocating capital to fund the green transition
• Technology & AI — advanced computing and AI for climate tracking and modeling
• Environmental Justice — equitable benefits and safety for vulnerable communities
• Buildings & Infrastructure
• Climate & Health
• Food & Agriculture
• Industry & Supply Chains
• Nature, Land & Oceans
• Policy, Governance & Leadership
• Sustainable Living
• Transport & Travel',

  -- The Register button renders `register_label`, falling back to "Register"
  -- when it is blank (EventDetail.tsx: `const text = label || fallbackLabel`).
  -- It held the raw URL, so the button read "https://www.climateweeknyc.org/".
  -- Clearing it restores the default. register_url is untouched.
  register_label = '',

  -- Had a trailing space.
  location = 'Various Locations Across New York City',

  -- Was empty. region drives ZIP/area alert matching and map prominence, so an
  -- empty one means nobody subscribed to the New York area is told about it.
  region = 'New York, NY'

where id = '73edd7ef-ed1e-4e81-9080-c0e6cefff937';
