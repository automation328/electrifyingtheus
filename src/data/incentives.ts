// EV incentives dataset + lookups — shared by the Rebates & Incentives page and
// the EV-vs-Gas calculator's "typical incentives" panel. Curated set mirroring
// electricforall.org and public program data; amounts are typical maximums,
// always verify on the official program page.

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
// (The Alternative Fuel Vehicle Refueling Property Credit / Section 30C was
// removed after it sunset on June 30, 2026.)
export const FEDERAL: Partial<Record<CatKey, Incentive[]>> = {};

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
  GA: {
    charging: [
      {
        name: "Home Charger Rebate",
        jurisdiction: "Georgia Power Incentive",
        amount: "Up to $300",
        desc: "Residential customers can receive a rebate up to $300 for the purchase and installation of a qualifying Level 2 charger on a dedicated 208/240-volt circuit. Submit your rebate through the Georgia Power EV Rebates Portal within six months of installation.",
        link: "https://www.georgiapower.com/residential/save-money-and-energy/products-programs/electric-vehicles.html",
      },
      {
        name: "Instant Savings — Georgia Power Marketplace",
        jurisdiction: "Georgia Power Incentive",
        desc: "Find instant rebates on select Level 2 EV chargers when you buy through the Georgia Power Marketplace — the discount is applied at checkout, with no separate application needed.",
        link: "https://www.georgiapowermarketplace.com/",
      },
      {
        name: "Business EV Charger Rebate",
        jurisdiction: "Georgia Power Incentive",
        amount: "Up to $500",
        desc: "Commercial and multifamily-property accounts can claim a rebate of up to $500 per Level 2 charger installed for workplace or multifamily use.",
        link: "https://www.georgiapower.com/business/products-programs.html",
      },
      {
        name: "EV Charger Plus Rebate Program",
        jurisdiction: "Georgia Power Incentive",
        amount: "Up to $30,000",
        desc: "For larger commercial projects, Georgia Power covers up to 50% of total installation and equipment costs — capped at $30,000 per project or $60,000 per calendar year per customer.",
        link: "https://www.georgiapower.com/business/products-programs.html",
      },
    ],
    electricity: [
      {
        name: "Overnight Advantage Rate Plan",
        jurisdiction: "Georgia Power Incentive",
        desc: "A special rate plan with exceptionally low Super Off-Peak rates from 11 p.m. to 7 a.m. — designed to minimize the cost of charging your EV at home. Rates are subject to Georgia Public Service Commission approval and may change.",
        link: "https://www.georgiapower.com/residential/save-money-and-energy/products-programs/electric-vehicles.html",
      },
    ],
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

// ── Utility / Private incentives ─────────────────────────────────────────────
// The "Utility/Private Incentives" sector (implementing_sector=U) is no longer
// served by a reachable API — the canonical developer.nrel.gov host is
// decommissioned, and the live api.data.gov mirror carries no sector field.
// So these flagship utility EV programs are curated by state, and we deep-link to
// the live, sector-categorized state incentives page for the complete list.
export const UTILITY_INCENTIVES: Record<string, Incentive[]> = {
  CA: [
    { name: "PG&E Empower EV", jurisdiction: "Pacific Gas & Electric Incentive", amount: "Up to $4,000", income: true,
      desc: "Income-eligible PG&E customers can receive up to $2,500 for a Level 2 charger and up to $2,000 toward a panel upgrade to support home charging.",
      link: "https://www.pge.com/en/clean-energy/electric-vehicles.html" },
    { name: "SCE Pre-Owned EV Rebate", jurisdiction: "Southern California Edison Incentive", amount: "$1,000 – $4,000", used: true, income: true,
      desc: "Rebate for buying or leasing a used EV — $1,000 for most customers, up to $4,000 for income-qualified households in SCE territory.",
      link: "https://www.sce.com/rebates-and-savings/electric-vehicles" },
    { name: "SDG&E EV-TOU Charging Rates", jurisdiction: "San Diego Gas & Electric Incentive",
      desc: "Special time-of-use rate plans that lower the cost of charging your EV overnight, plus 'Power Your Drive' make-ready support for home and multifamily charging.",
      link: "https://www.sdge.com/residential/electric-vehicles" },
  ],
  NY: [
    { name: "Con Edison SmartCharge New York", jurisdiction: "Con Edison Incentive", amount: "Up to ~$150/yr",
      desc: "Earn rewards for charging your EV during off-peak hours and on summer event days in Con Edison territory — enrolled automatically via a connected charger or telematics.",
      link: "https://www.coned.com/en/save-money/rebates-incentives-tax-credits" },
    { name: "PSEG Long Island EV Make-Ready & Rewards", jurisdiction: "PSEG Long Island Incentive",
      desc: "Off-peak charging rewards and make-ready support to reduce the cost of installing home and workplace Level 2 charging on Long Island.",
      link: "https://www.psegliny.com/saveenergyandmoney/electricvehicles" },
  ],
  TX: [
    { name: "Austin Energy Home Charging Rebate", jurisdiction: "Austin Energy Incentive", amount: "$300",
      desc: "$300 rebate toward a qualifying Level 2 home charger, plus the EV360 flat-rate plan that bundles unlimited off-peak home and public charging.",
      link: "https://austinenergy.com/green-power/plug-in-austin/charging-tools-and-rebates" },
    { name: "CPS Energy EV Charging Rebate", jurisdiction: "CPS Energy (San Antonio) Incentive", amount: "Up to $250",
      desc: "Rebate for San Antonio customers who install a qualifying smart Level 2 charger and enroll in managed off-peak charging.",
      link: "https://www.cpsenergy.com/en/residential/savenow/electric-vehicles.html" },
  ],
  CO: [
    { name: "Xcel Energy Income-Qualified EV Rebate", jurisdiction: "Xcel Energy Incentive", amount: "Up to $5,500", income: true, used: true,
      desc: "Up to $5,500 for income-qualified Colorado customers buying a new or used EV (up to $3,000 standard), stackable with state and federal benefits.",
      link: "https://co.my.xcelenergy.com/s/residential/ev" },
    { name: "Xcel Energy EV Accelerate At Home", jurisdiction: "Xcel Energy Incentive",
      desc: "Managed Level 2 home charging for a low monthly fee — Xcel installs and maintains the charger and optimizes charging to off-peak hours.",
      link: "https://co.my.xcelenergy.com/s/residential/ev" },
  ],
  FL: [
    { name: "Duke Energy Off-Peak EV Charging Credit", jurisdiction: "Duke Energy Florida Incentive",
      desc: "Bill credits for charging your EV during off-peak hours through Duke Energy Florida's residential EV charging program.",
      link: "https://www.duke-energy.com/home/products/electric-vehicles" },
    { name: "OUC Home Charging Rebate", jurisdiction: "Orlando Utilities Commission Incentive", amount: "Up to $200",
      desc: "Rebate for OUC customers who purchase and install a qualifying Level 2 home charger.",
      link: "https://www.ouc.com/residential/electric-vehicles" },
  ],
  NJ: [
    { name: "PSE&G Residential EV Charging Program", jurisdiction: "PSE&G Incentive", amount: "Up to $1,500",
      desc: "Up to $1,500 toward a smart Level 2 charger and wiring, plus off-peak charging credits for New Jersey PSE&G customers.",
      link: "https://nj.pseg.com/saveenergyandmoney/electricvehicles" },
  ],
  MA: [
    { name: "Eversource & National Grid ConnectedSolutions EV", jurisdiction: "Massachusetts Utility Incentive",
      desc: "Make-ready support and off-peak charging rewards for residential and multifamily Level 2 charging across Eversource and National Grid territory.",
      link: "https://www.eversource.com/content/residential/save-money-energy/explore-alternatives/electric-vehicles" },
  ],
  WA: [
    { name: "Puget Sound Energy / Seattle City Light Charger Rebate", jurisdiction: "Washington Utility Incentive", amount: "Up to $1,000", income: true,
      desc: "Rebates of up to $1,000 (higher for income-qualified customers) toward a qualifying Level 2 home charger from participating Washington utilities.",
      link: "https://www.pse.com/en/pages/electric-cars" },
  ],
  MI: [
    { name: "DTE Charging Forward", jurisdiction: "DTE Energy Incentive", amount: "$500",
      desc: "$500 rebate for a qualifying Level 2 home charger plus a discounted off-peak EV charging rate for DTE customers.",
      link: "https://www.dteenergy.com/us/en/residential/service-request/electric-vehicles.html" },
    { name: "Consumers Energy PowerMIDrive", jurisdiction: "Consumers Energy Incentive", amount: "$500",
      desc: "Up to $500 rebate for a Level 2 home charger and access to off-peak EV charging rates for Consumers Energy customers.",
      link: "https://www.consumersenergy.com/residential/programs-and-services/electric-vehicles" },
  ],
  IL: [
    { name: "ComEd Residential EV Charging Rebate", jurisdiction: "ComEd Incentive",
      desc: "Charging credits and make-ready support for northern Illinois ComEd customers who charge during off-peak hours.",
      link: "https://www.comed.com/ways-to-save/for-your-home/electric-vehicles" },
  ],
  GA: [
    { name: "Georgia Power Plug-In EV Rate", jurisdiction: "Georgia Power Incentive",
      desc: "A nights-and-weekends time-of-use rate that sharply lowers the cost of charging your EV at home during off-peak hours.",
      link: "https://www.georgiapower.com/residential/save-money-and-energy/products-programs/electric-vehicles.html" },
    { name: "Multifamily Property Charging", jurisdiction: "Georgia Power Incentive", amount: "Up to $50,000",
      desc: "Multifamily property owners and developers can earn up to $50,000 per project — and up to $150,000 per year — toward EV charging installations for their communities.",
      link: "https://www.georgiapower.com/business/products-programs.html" },
    { name: "Make Ready Infrastructure Program", jurisdiction: "Georgia Power Incentive",
      desc: "Georgia Power helps businesses and fleet operators fund the electrical infrastructure — wiring, conduit, panels, and service upgrades — required to support new EV charging stations.",
      link: "https://www.georgiapower.com/business/products-programs.html" },
  ],
  MD: [
    { name: "BGE / Pepco / Delmarva EVsmart", jurisdiction: "Maryland Utility Incentive", amount: "Up to $300",
      desc: "Up to $300 rebate toward a smart Level 2 home charger plus off-peak charging rewards across Maryland's major utilities.",
      link: "https://www.bge.com/SmartEnergy/InnovationTechnology/Pages/ElectricVehicles.aspx" },
  ],
  OR: [
    { name: "Portland General Electric Smart Charging", jurisdiction: "PGE Incentive", amount: "Up to $500",
      desc: "Rebate toward a smart Level 2 charger and enrollment rewards for managed off-peak charging for PGE customers.",
      link: "https://portlandgeneral.com/about/info/electric-vehicles" },
  ],
  CT: [
    { name: "Eversource & UI EV Charging Rewards", jurisdiction: "Connecticut Utility Incentive", amount: "Up to $500",
      desc: "Upfront and ongoing rewards (up to $500) for installing a smart Level 2 charger and charging off-peak through Connecticut's utilities.",
      link: "https://www.eversource.com/content/residential/save-money-energy/explore-alternatives/electric-vehicles" },
  ],
  MN: [
    { name: "Xcel Energy Optimize Your Charge", jurisdiction: "Xcel Energy Incentive",
      desc: "Bill credits for charging your EV during off-peak hours, plus EV charger rebates for participating Minnesota Xcel Energy customers.",
      link: "https://mn.my.xcelenergy.com/s/residential/ev" },
  ],
};

/** Curated flagship utility EV programs for a state (empty when none are curated). */
export const utilityIncentivesFor = (state: string): Incentive[] =>
  UTILITY_INCENTIVES[state] ?? [];

/** Deep-link to the live, sector-categorized incentives page for a state. */
export const utilityProgramsUrl = (state: string): string =>
  `https://afdc.energy.gov/laws/state?state=${encodeURIComponent(state)}`;

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
