import { VehicleData } from "@/lib/tco-calculator";

// ─────────────────────────────────────────────────────────────────────────────
// GM electric-vehicle lineup — used ONLY by the /gm-ev-vs-gas calculator page.
//
// MSRP (starting, before destination/incentives) and EPA range come straight
// from the "General Motors: Electric Vehicles & EV Charging" knowledge base,
// current as of July 28, 2026 (Section 2, "Current GM EV Lineup, by Brand").
// Efficiency, insurance, body-class and matching fields are carried over from
// the site's curated catalog (src/data/vehicles.ts) for the models that already
// existed there; the three variants new to this list (Lyriq-V, Optiq-V,
// Escalade IQL) derive their technical figures from their base model.
//
// This list is intentionally separate from the shared catalog so updating GM
// pricing/range here does NOT affect the general /electricity-vs-gasoline page.
//
// Notes on the source figures:
//  • Bolt — the KB lists ~$28,995 as the starting MSRP (site pricing is
//    inconsistent; $27,600 also appears). We use the KB's headline number.
//  • "Up to" ranges (Silverado EV, Sierra EV, Hummer, Escalade IQ/IQL) use the
//    KB's top figure.
//  • Lyriq-V / Optiq-V ranges are not EPA-published; estimated below the base
//    model to reflect their higher-performance tuning. Celestiq range is not
//    EPA-published; a representative figure is used.
// ─────────────────────────────────────────────────────────────────────────────
export const GM_EVS: VehicleData[] = [
  // ───────────────────────── Chevrolet ─────────────────────────
  {
    id: "chevy-bolt-ev", name: "Chevrolet Bolt EV", type: "ev", msrp: 28995,
    mpge: 120, kwhPer100mi: 28, maintenanceCostPerMile: 0.057, insuranceAnnual: 1700,
    depreciationRate: 0.18, category: "Sedan",
    bodyStyle: "hatchback", sizeClass: 1, seats: 5, drivetrain: "FWD", rangeMi: 262,
  },
  {
    id: "chevy-equinox-ev", name: "Chevrolet Equinox EV", type: "ev", msrp: 34995,
    mpge: 126, kwhPer100mi: 27, maintenanceCostPerMile: 0.061, insuranceAnnual: 1800,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "FWD", rangeMi: 319,
  },
  {
    id: "chevy-blazer-ev", name: "Chevrolet Blazer EV", type: "ev", msrp: 44700,
    mpge: 104, kwhPer100mi: 32, maintenanceCostPerMile: 0.062, insuranceAnnual: 1950,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "FWD", rangeMi: 312,
  },
  {
    id: "chevy-silverado-ev", name: "Chevrolet Silverado EV", type: "ev", msrp: 55895,
    mpge: 66, kwhPer100mi: 51, maintenanceCostPerMile: 0.072, insuranceAnnual: 2400,
    depreciationRate: 0.21, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD", rangeMi: 478,
  },

  // ───────────────────────── GMC ─────────────────────────
  {
    id: "gmc-hummer-ev", name: "GMC Hummer EV Pickup", type: "ev", msrp: 97200,
    mpge: 47, kwhPer100mi: 47, maintenanceCostPerMile: 0.07, insuranceAnnual: 3200,
    depreciationRate: 0.24, category: "Truck",
    bodyStyle: "truck", sizeClass: 3, seats: 5, drivetrain: "4WD", rangeMi: 363,
  },
  {
    id: "gmc-hummer-ev-suv", name: "GMC Hummer EV SUV", type: "ev", msrp: 97200,
    mpge: 47, kwhPer100mi: 47, maintenanceCostPerMile: 0.07, insuranceAnnual: 3200,
    depreciationRate: 0.24, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "4WD", rangeMi: 319, luxury: true,
  },
  {
    id: "gmc-sierra-ev", name: "GMC Sierra EV", type: "ev", msrp: 62400,
    mpge: 64, kwhPer100mi: 53, maintenanceCostPerMile: 0.073, insuranceAnnual: 2450,
    depreciationRate: 0.21, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD", rangeMi: 478,
  },

  // ───────────────────────── Cadillac ─────────────────────────
  {
    id: "cadillac-lyriq", name: "Cadillac LYRIQ", type: "ev", msrp: 59200,
    mpge: 89, kwhPer100mi: 38, maintenanceCostPerMile: 0.068, insuranceAnnual: 2200,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "RWD", rangeMi: 326, luxury: true,
  },
  {
    id: "cadillac-lyriq-v", name: "Cadillac LYRIQ-V", type: "ev", msrp: 78595,
    mpge: 80, kwhPer100mi: 42, maintenanceCostPerMile: 0.072, insuranceAnnual: 2500,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 285,
    luxury: true, performance: true,
  },
  {
    id: "cadillac-optiq", name: "Cadillac OPTIQ", type: "ev", msrp: 50900,
    mpge: 92, kwhPer100mi: 37, maintenanceCostPerMile: 0.066, insuranceAnnual: 2100,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "RWD", rangeMi: 317, luxury: true,
  },
  {
    id: "cadillac-optiq-v", name: "Cadillac OPTIQ-V", type: "ev", msrp: 67500,
    mpge: 82, kwhPer100mi: 41, maintenanceCostPerMile: 0.07, insuranceAnnual: 2300,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 275,
    luxury: true, performance: true,
  },
  {
    id: "cadillac-vistiq", name: "Cadillac VISTIQ", type: "ev", msrp: 77500,
    mpge: 79, kwhPer100mi: 43, maintenanceCostPerMile: 0.072, insuranceAnnual: 2500,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 305, luxury: true,
  },
  {
    id: "cadillac-escalade-iq", name: "Cadillac ESCALADE IQ", type: "ev", msrp: 127405,
    mpge: 78, kwhPer100mi: 43, maintenanceCostPerMile: 0.075, insuranceAnnual: 3200,
    depreciationRate: 0.24, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 465, luxury: true,
  },
  {
    id: "cadillac-escalade-iql", name: "Cadillac ESCALADE IQL", type: "ev", msrp: 130405,
    mpge: 78, kwhPer100mi: 43, maintenanceCostPerMile: 0.075, insuranceAnnual: 3250,
    depreciationRate: 0.24, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 465, luxury: true,
  },
  {
    id: "cadillac-celestiq", name: "Cadillac CELESTIQ", type: "ev", msrp: 400000,
    mpge: 75, kwhPer100mi: 45, maintenanceCostPerMile: 0.09, insuranceAnnual: 5000,
    depreciationRate: 0.25, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 4, seats: 4, drivetrain: "AWD", rangeMi: 303, luxury: true,
  },
];
