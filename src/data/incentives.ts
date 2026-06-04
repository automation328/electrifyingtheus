// EV incentives dataset + lookups — shared by the Rebates & Incentives page and
// the EV-vs-Gas calculator's "typical incentives" panel. Curated set mirroring
// electricforall.org / AFDC; amounts are typical maximums, always verify on the
// official program page.

export type CatKey = "vehicle" | "charging" | "electricity" | "perks";

export interface Incentive {
  name: string;
  jurisdiction: string;
  amount?: string;
  income?: boolean;
  used?: boolean;
  desc: string;
  link: string;
}

// Federal / nationwide programs — merged into every ZIP's results.
export const FEDERAL: Partial<Record<CatKey, Incentive[]>> = {
  vehicle: [{
    name: "OBBBA Auto-Loan Interest Deduction",
    jurisdiction: "Federal Incentive",
    amount: "Up to $10,000/yr",
    income: true,
    desc: "Deduct interest paid on a loan for a U.S.-assembled vehicle (2025–2028). No itemizing required; phases out above $100,000 (single) / $200,000 (joint) modified AGI. Replaces the retired $7,500 purchase credit.",
    link: "https://www.cleanenergycu.org/resources/blog/obbba-ev-tax-deduction-2026-guide/",
  }],
  charging: [{
    name: "Alternative Fuel Vehicle Refueling Property Credit",
    jurisdiction: "Federal Incentive",
    amount: "Up to $1,000",
    income: true,
    desc: "Individuals in low-income communities and non-urban areas who purchase and install qualifying residential charging equipment may receive a tax credit of 30% of the cost, up to $1,000. Sunsets June 30, 2026.",
    link: "https://www.irs.gov/credits-deductions/alternative-fuel-vehicle-refueling-property-credit",
  }],
};

// State / local programs stacked on top of federal. Region-specific, mirroring electricforall.org.
export const STATE_INCENTIVES: Record<string, Partial<Record<CatKey, Incentive[]>>> = {
  CA: {
    vehicle: [
      {
        name: "Vehicle Retirement Consumer Assistance Program",
        jurisdiction: "California Incentive",
        amount: "$1,350 - $2,000",
        used: true,
        desc: "The Consumer Assistance Program provides $1,350 to $2,000 to support the retirement of old, polluting vehicles. Dealer registration is not required to be eligible for the incentive.",
        link: "https://bar.ca.gov/cap/retirement",
      },
      {
        name: "Clean Cars for All",
        jurisdiction: "Bay Area Air District Incentive",
        amount: "Up to $12,000",
        income: true,
        used: true,
        desc: "Clean Cars For All (CCFA) provides incentives to lower-income California drivers to scrap their older, high-polluting car and replace it with a zero- or near-zero emission replacement. Cannot be stacked with the Clean Vehicle Assistance Program. Dealer registration is required.",
        link: "https://www.baaqmd.gov/funding-and-incentives/residents/clean-cars-for-all/program-overview",
      },
      {
        name: "Driving Clean Assistance Program / Clean Cars 4 All",
        jurisdiction: "California Incentive",
        amount: "Up to $12,000",
        income: true,
        used: true,
        desc: "DCAP provides incentives for eligible low-income consumers to purchase or lease new or used clean vehicles — up to $12K to those in disadvantaged communities who scrap an older vehicle ($10K outside DACs). Also provides low-interest loans up to $45K capped at 8%. Dealer registration is required.",
        link: "https://drivingcleanca.org/",
      },
      {
        name: "Ride and Drive Clean",
        jurisdiction: "Bay Area Air District Incentive",
        desc: "Ride and Drive Clean is here to help you save time, money, and the planet. With Exclusive EV Discounts, take advantage of savings on EVs and a no-hassle car buying experience. All vehicles must be purchased before May 31st, 2026.",
        link: "https://rideanddriveclean.org/ev-discounts-spring-2026/",
      },
      {
        name: "Pre-Owned Electric Vehicle Rebate Program",
        jurisdiction: "PG&E Incentive",
        amount: "$1,000 - $4,000",
        used: true,
        desc: "PG&E offers a $1,000 rebate for the purchase or lease of a pre-owned (used) EV. Income-qualified customers can receive up to $4,000. Dealer registration is not required to be eligible for the incentive.",
        link: "https://evrebates.pge.com/",
      },
    ],
    charging: [
      {
        name: "PACE Loss Reserve Program",
        jurisdiction: "California Incentive",
        desc: "Administered by CAEATFA, the PACE Loss Reserve Program supports PACE financing for energy/water efficiency and clean-energy home improvements. Property owners in a PACE-designated area can finance improvements without a down payment, repaid through their property tax bills.",
        link: "https://www.treasurer.ca.gov/caeatfa/pace/index.asp",
      },
      {
        name: "CCFA Charger Rebate",
        jurisdiction: "Bay Area Air District Incentive",
        amount: "Up to $2,000",
        desc: "CCFA offers up to $2,000 for a Level 2 home charger installation and up to $1,000 for a Level 2 portable charger for your new, used, or leased PHEV or BEV. Funding is first come, first served. Approval required before installation.",
        link: "https://www.baaqmd.gov/funding-and-incentives/residents/clean-cars-for-all/resources/charging-your-ev",
      },
      {
        name: "V2X Residential",
        jurisdiction: "PG&E Incentive",
        amount: "$2,500 - $8,000",
        desc: "Residential PG&E customers with standard split-phase 240v service and a qualifying vehicle/charger. Enrollment in customer group A.5 Vehicle-Grid Integrations of the Emergency Load Reduction Program (ELRP) is required and offers additional incentives.",
        link: "https://www.pge.com/en/clean-energy/electric-vehicles/getting-started-with-electric-vehicles/vehicle-to-everything-v2x-pilot-programs.html",
      },
      {
        name: "Residential Charging Solutions Rebate",
        jurisdiction: "PG&E Incentive",
        amount: "Up to $1,999",
        desc: "The Residential Charging Solutions program offers eligible customers a rebate on PG&E-approved electric vehicle (EV) charging equipment.",
        link: "https://www.pge.com/en/clean-energy/electric-vehicles/getting-started-with-electric-vehicles/residential-charging-solutions-rebate.html",
      },
      {
        name: "Residential Vehicle-to-Everything (V2X) Pilot",
        jurisdiction: "PG&E Incentive",
        amount: "Up to $4,500",
        desc: "The V2X Pilot helps PG&E and customers leverage bidirectional charging. In exchange for allowing PG&E to observe the technology during a grid outage, enrollees are compensated with up to $4,500 in incentives.",
        link: "https://www.pge.com/en/clean-energy/electric-vehicles/getting-started-with-electric-vehicles/vehicle-to-everything-v2x-pilot-programs.html",
      },
    ],
    perks: [
      {
        name: "Old Car Buy Back Program",
        jurisdiction: "Bay Area Air District Incentive",
        amount: "$1,500",
        desc: "The Bay Area Air Quality Management District Old Car Buy Back and Scrap Program will pay up to $1,500 for a qualified operating and registered 1998-and-older vehicle. A voluntary program that takes older vehicles off the road and dismantles them.",
        link: "https://www.baaqmd.gov/funding-and-incentives/residents/vehicle-buy-back-program",
      },
      {
        name: "Zero-Emission Assurance Project",
        jurisdiction: "California Incentive",
        amount: "Up to $7,500",
        income: true,
        desc: "The Zero-Emission Assurance Project (ZAP) assists Californians who purchased a used ZEV/NZEV through a CARB incentive program and suspect critical battery or fuel-cell components need major repair. Open to South Coast, San Joaquin Valley, Bay Area, and Sacramento Metro Districts.",
        link: "https://drivingcleanca.org/zap/",
      },
      {
        name: "Go Electric Incentive",
        jurisdiction: "National Uber Incentive",
        amount: "Up to $4,000",
        desc: "Uber offers a $4,000 incentive for existing Platinum and Diamond drivers who switch to an owned or personally leased battery electric vehicle. Applicants must apply before switching and must not have previously owned/leased an EV on the Uber platform.",
        link: "https://www.uber.com/us/en/drive/services/electric/zero-emissions-incentive/",
      },
    ],
  },
  CO: {
    vehicle: [{
      name: "Colorado EV Tax Credit",
      jurisdiction: "Colorado Incentive",
      amount: "Up to $3,500",
      desc: "State income-tax credit for new EV purchases and leases. The credit amount steps down over time, so verify the current value before you buy.",
      link: "https://energyoffice.colorado.gov/zero-emission-vehicles/zero-emission-vehicle-tax-credits",
    }],
  },
  NY: {
    vehicle: [{
      name: "Drive Clean Rebate",
      jurisdiction: "New York Incentive",
      amount: "Up to $2,000",
      desc: "Point-of-sale rebate at participating New York dealers on eligible new EVs.",
      link: "https://www.nyserda.ny.gov/All-Programs/Drive-Clean-Rebate",
    }],
  },
  NJ: {
    vehicle: [{
      name: "Charge Up New Jersey",
      jurisdiction: "New Jersey Incentive",
      amount: "Up to $4,000",
      desc: "Point-of-sale incentive on new EVs. New Jersey also exempts EV sales and leases from state sales tax.",
      link: "https://chargeup.njcleanenergy.com/",
    }],
  },
  MA: {
    vehicle: [{
      name: "MOR-EV Rebate",
      jurisdiction: "Massachusetts Incentive",
      amount: "Up to $3,500 (+$1,500 LMI)",
      income: true,
      desc: "Massachusetts rebate for new EVs, with an added bonus for income-eligible buyers.",
      link: "https://mor-ev.org/",
    }],
  },
  OR: {
    vehicle: [{
      name: "Oregon Clean Vehicle / Charge Ahead",
      jurisdiction: "Oregon Incentive",
      amount: "Up to $7,500",
      income: true,
      used: true,
      desc: "Standard rebate plus a Charge Ahead bonus for low- and moderate-income Oregonians buying new or used EVs.",
      link: "https://evrebate.oregon.gov/",
    }],
  },
  IL: {
    vehicle: [{
      name: "Illinois EV Rebate",
      jurisdiction: "Illinois Incentive",
      amount: "Up to $4,000",
      used: true,
      desc: "State rebate for new and used EV purchases by Illinois residents, subject to annual program funding.",
      link: "https://epa.illinois.gov/topics/ceja/electric-vehicle-rebates.html",
    }],
  },
};

// 3-digit ZIP prefix ranges → USPS state. Covers the 50 states + DC.
const ZIP_RANGES: [number, number, string][] = [
  [5, 5, "NY"], [10, 27, "MA"], [28, 29, "RI"], [30, 38, "NH"], [39, 49, "ME"],
  [50, 59, "VT"], [60, 69, "CT"], [70, 89, "NJ"], [100, 149, "NY"], [150, 196, "PA"],
  [197, 199, "DE"], [200, 205, "DC"], [206, 219, "MD"], [220, 246, "VA"], [247, 269, "WV"],
  [270, 289, "NC"], [290, 299, "SC"], [300, 319, "GA"], [320, 349, "FL"], [350, 369, "AL"],
  [370, 385, "TN"], [386, 397, "MS"], [398, 399, "GA"], [400, 427, "KY"], [430, 459, "OH"],
  [460, 479, "IN"], [480, 499, "MI"], [500, 528, "IA"], [530, 549, "WI"], [550, 567, "MN"],
  [570, 577, "SD"], [580, 588, "ND"], [590, 599, "MT"], [600, 629, "IL"], [630, 658, "MO"],
  [660, 679, "KS"], [680, 693, "NE"], [700, 714, "LA"], [716, 729, "AR"], [730, 749, "OK"],
  [750, 799, "TX"], [800, 816, "CO"], [820, 831, "WY"], [832, 838, "ID"], [840, 847, "UT"],
  [850, 865, "AZ"], [870, 884, "NM"], [889, 898, "NV"], [900, 961, "CA"], [967, 968, "HI"],
  [970, 979, "OR"], [980, 994, "WA"], [995, 999, "AK"],
];

export const STATE_NAMES: Record<string, string> = {
  AL: "Alabama", AK: "Alaska", AZ: "Arizona", AR: "Arkansas", CA: "California",
  CO: "Colorado", CT: "Connecticut", DE: "Delaware", DC: "District of Columbia",
  FL: "Florida", GA: "Georgia", HI: "Hawaii", ID: "Idaho", IL: "Illinois",
  IN: "Indiana", IA: "Iowa", KS: "Kansas", KY: "Kentucky", LA: "Louisiana",
  ME: "Maine", MD: "Maryland", MA: "Massachusetts", MI: "Michigan", MN: "Minnesota",
  MS: "Mississippi", MO: "Missouri", MT: "Montana", NE: "Nebraska", NV: "Nevada",
  NH: "New Hampshire", NJ: "New Jersey", NM: "New Mexico", NY: "New York",
  NC: "North Carolina", ND: "North Dakota", OH: "Ohio", OK: "Oklahoma", OR: "Oregon",
  PA: "Pennsylvania", RI: "Rhode Island", SC: "South Carolina", SD: "South Dakota",
  TN: "Tennessee", TX: "Texas", UT: "Utah", VT: "Vermont", VA: "Virginia",
  WA: "Washington", WV: "West Virginia", WI: "Wisconsin", WY: "Wyoming",
};

export const stateFromZip = (zip: string): string | null => {
  const prefix = parseInt(zip.slice(0, 3), 10);
  if (Number.isNaN(prefix)) return null;
  for (const [lo, hi, st] of ZIP_RANGES) if (prefix >= lo && prefix <= hi) return st;
  return null;
};

// State programs first, then federal — matching electricforall ordering within a category.
export const incentivesFor = (state: string, key: CatKey): Incentive[] => [
  ...(STATE_INCENTIVES[state]?.[key] ?? []),
  ...(FEDERAL[key] ?? []),
];

const ALL_CATS: CatKey[] = ["vehicle", "charging", "electricity", "perks"];

/** Largest dollar figure referenced in an amount string (e.g. "$1,350 - $2,000" → 2000). */
const maxDollars = (s?: string): number => {
  if (!s) return 0;
  const matches = [...s.matchAll(/\$\s?([\d,]+)/g)].map((m) => parseInt(m[1].replace(/,/g, ""), 10));
  return matches.length ? Math.max(...matches) : 0;
};

export interface IncentiveHeadline {
  state: string;
  stateName: string;
  count: number;
  topAmount: number | null;
  items: { name: string; amount?: string }[];
}

/**
 * Compact summary of the incentives available in a state (state + federal),
 * for the calculator's "typical incentives" panel. Dedupes by name, ranks by
 * dollar amount, and returns the headline figure + top few programs.
 */
export function incentiveHeadline(state: string): IncentiveHeadline {
  const all = ALL_CATS.flatMap((k) => incentivesFor(state, k));
  const seen = new Set<string>();
  const unique = all.filter((i) => (seen.has(i.name) ? false : (seen.add(i.name), true)));
  const ranked = [...unique].sort((a, b) => maxDollars(b.amount) - maxDollars(a.amount));
  const top = maxDollars(ranked[0]?.amount);
  return {
    state,
    stateName: STATE_NAMES[state] ?? state,
    count: unique.length,
    topAmount: top || null,
    items: ranked.slice(0, 6).map((i) => ({ name: i.name, amount: i.amount })),
  };
}
