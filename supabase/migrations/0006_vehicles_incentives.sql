-- CMS overlay tables for the calculator vehicle catalog and the rebates/incentives
-- data. Like the other site_* tables, the website reads PUBLISHED rows with the
-- anon key; the CMS writes with the service role key via /api/admin/*.
--
-- These overlay the curated static seeds in src/data/vehicles.ts and
-- src/data/incentives.ts at app boot (see src/lib/content-hydrate.ts):
--   • published rows are added, or override a static entry with the same key
--     (vehicles: vehicle_id; incentives: name within its bucket)
--   • a published row with hidden=true REMOVES the matching static entry
--     (removal must ride on a published row — RLS never exposes non-published
--     rows to the site, so an "archived" row would simply be invisible)
--
-- Run in Supabase → SQL Editor (or `supabase db push`).

-- ─────────────────────────────────────────────────────────────────────────────
-- VEHICLES — mirrors VehicleData (src/lib/tco-calculator.ts). `vehicle_id` is the
-- slug the calculator matches on (e.g. "tesla-model-3"); `id` is the row PK.
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.site_vehicles (
  id                        uuid primary key default gen_random_uuid(),
  created_at                timestamptz not null default now(),
  status                    text not null default 'draft',   -- draft | published | archived
  hidden                    boolean not null default false,   -- published + hidden ⇒ remove this static vehicle
  sort                      int  not null default 0,
  vehicle_id                text not null,                    -- calculator slug (unique among published)
  name                      text not null,
  type                      text not null default 'ev',       -- ev | gas
  msrp                      numeric not null default 0,
  mpg                       numeric,                          -- gas
  mpge                      numeric,                          -- EV
  kwh_per_100mi             numeric,                          -- EV
  maintenance_cost_per_mile numeric not null default 0.06,
  insurance_annual          numeric not null default 1800,
  depreciation_rate         numeric not null default 0.15,
  category                  text not null default 'Sedan',    -- Sedan | Coupe | SUV | Minivan | Truck
  image                     text,
  body_style                text,                             -- sedan | suv-compact | truck | …
  size_class                int,
  seats                     int,
  drivetrain                text,                             -- FWD | RWD | AWD
  range_mi                  numeric,
  performance               boolean not null default false,
  luxury                    boolean not null default false
);

create index if not exists site_vehicles_sort_idx on public.site_vehicles (sort, created_at desc);

-- ─────────────────────────────────────────────────────────────────────────────
-- INCENTIVES — mirrors Incentive (src/data/incentives.ts). `scope` picks the
-- bucket: federal (→ FEDERAL[category]), state (→ STATE_INCENTIVES[state][category]),
-- utility (→ UTILITY_INCENTIVES[state]).
-- ─────────────────────────────────────────────────────────────────────────────
create table if not exists public.site_incentives (
  id           uuid primary key default gen_random_uuid(),
  created_at   timestamptz not null default now(),
  status       text not null default 'draft',   -- draft | published | archived
  hidden       boolean not null default false,   -- published + hidden ⇒ remove the same-name static incentive
  sort         int  not null default 0,
  scope        text not null default 'state',   -- federal | state | utility
  state        text,                             -- 2-letter (state/utility); null for federal
  category     text,                             -- vehicle | charging | electricity | perks (federal/state)
  name         text not null,
  jurisdiction text not null default '',
  amount       text,
  income       boolean not null default false,
  used         boolean not null default false,
  description  text not null default '',
  link         text not null default ''
);

create index if not exists site_incentives_sort_idx on public.site_incentives (scope, state, sort);

-- ─────────────────────────────────────────────────────────────────────────────
-- RLS — public reads PUBLISHED rows; no anon writes (service role bypasses RLS).
-- ─────────────────────────────────────────────────────────────────────────────
alter table public.site_vehicles   enable row level security;
alter table public.site_incentives enable row level security;

drop policy if exists "public read published vehicles" on public.site_vehicles;
create policy "public read published vehicles"
  on public.site_vehicles for select
  using (status = 'published');

drop policy if exists "public read published incentives" on public.site_incentives;
create policy "public read published incentives"
  on public.site_incentives for select
  using (status = 'published');
