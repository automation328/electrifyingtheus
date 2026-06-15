import { VehicleData } from "@/lib/tco-calculator";

// Curated US catalog. Figures are representative 2026 values (MSRP, EPA
// MPG/MPGe, range) used to illustrate matching + cost — not a live feed.
// Every gas car has at least one class-matched EV substitute so the §6
// matching algorithm always has somewhere sensible to land.
export const vehicles: VehicleData[] = [
  // ───────────────────────── EVs ─────────────────────────
  // Compact sedans
  {
    id: "tesla-model-3", name: "Tesla Model 3", type: "ev", msrp: 38630,
    mpge: 132, kwhPer100mi: 25, maintenanceCostPerMile: 0.06, insuranceAnnual: 1920,
    depreciationRate: 0.15, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "RWD", rangeMi: 272,
  },
  {
    id: "tesla-model-3-performance", name: "Tesla Model 3 Performance", type: "ev", msrp: 52990,
    mpge: 113, kwhPer100mi: 30, maintenanceCostPerMile: 0.066, insuranceAnnual: 2200,
    depreciationRate: 0.16, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 296, performance: true,
  },
  {
    id: "hyundai-ioniq-6", name: "Hyundai IONIQ 6", type: "ev", msrp: 37850,
    mpge: 140, kwhPer100mi: 24, maintenanceCostPerMile: 0.057, insuranceAnnual: 1820,
    depreciationRate: 0.17, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "RWD", rangeMi: 305,
  },
  {
    id: "polestar-2", name: "Polestar 2", type: "ev", msrp: 49900,
    mpge: 107, kwhPer100mi: 31, maintenanceCostPerMile: 0.062, insuranceAnnual: 1980,
    depreciationRate: 0.19, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "RWD", rangeMi: 270,
  },
  {
    id: "bmw-i4", name: "BMW i4", type: "ev", msrp: 52200,
    mpge: 109, kwhPer100mi: 31, maintenanceCostPerMile: 0.07, insuranceAnnual: 2150,
    depreciationRate: 0.18, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "RWD", rangeMi: 301, luxury: true,
  },
  // Luxury midsize sedans
  {
    id: "bmw-i5", name: "BMW i5", type: "ev", msrp: 67000,
    mpge: 98, kwhPer100mi: 34, maintenanceCostPerMile: 0.075, insuranceAnnual: 2400,
    depreciationRate: 0.2, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 295, luxury: true,
  },
  {
    id: "mercedes-eqe", name: "Mercedes-Benz EQE", type: "ev", msrp: 74900,
    mpge: 96, kwhPer100mi: 35, maintenanceCostPerMile: 0.078, insuranceAnnual: 2500,
    depreciationRate: 0.22, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "RWD", rangeMi: 308, luxury: true,
  },
  {
    id: "lucid-air", name: "Lucid Air", type: "ev", msrp: 71400,
    mpge: 137, kwhPer100mi: 25, maintenanceCostPerMile: 0.072, insuranceAnnual: 2600,
    depreciationRate: 0.23, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "RWD", rangeMi: 420, luxury: true,
  },
  // Compact SUVs
  {
    id: "tesla-model-y", name: "Tesla Model Y", type: "ev", msrp: 44990,
    mpge: 123, kwhPer100mi: 27, maintenanceCostPerMile: 0.066, insuranceAnnual: 2040,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 310,
  },
  {
    id: "chevy-equinox-ev", name: "Chevrolet Equinox EV", type: "ev", msrp: 34995,
    mpge: 126, kwhPer100mi: 27, maintenanceCostPerMile: 0.061, insuranceAnnual: 1800,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "FWD", rangeMi: 319,
  },
  {
    id: "hyundai-ioniq-5", name: "Hyundai IONIQ 5", type: "ev", msrp: 35000,
    mpge: 114, kwhPer100mi: 29, maintenanceCostPerMile: 0.058, insuranceAnnual: 1850,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 303,
  },
  {
    id: "kia-ev6", name: "Kia EV6", type: "ev", msrp: 37900,
    mpge: 117, kwhPer100mi: 29, maintenanceCostPerMile: 0.059, insuranceAnnual: 1880,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 310,
  },
  {
    id: "ford-mustang-mach-e", name: "Ford Mustang Mach-E", type: "ev", msrp: 37995,
    mpge: 100, kwhPer100mi: 33, maintenanceCostPerMile: 0.065, insuranceAnnual: 2100,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "RWD", rangeMi: 290,
  },
  {
    id: "vw-id4", name: "Volkswagen ID.4", type: "ev", msrp: 39735,
    mpge: 106, kwhPer100mi: 32, maintenanceCostPerMile: 0.062, insuranceAnnual: 1820,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "RWD", rangeMi: 291,
  },
  {
    id: "nissan-ariya", name: "Nissan Ariya", type: "ev", msrp: 40000,
    mpge: 101, kwhPer100mi: 33, maintenanceCostPerMile: 0.06, insuranceAnnual: 1830,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "FWD", rangeMi: 289,
  },
  // Performance SUVs
  {
    id: "ford-mustang-mach-e-gt", name: "Ford Mustang Mach-E GT", type: "ev", msrp: 53995,
    mpge: 84, kwhPer100mi: 40, maintenanceCostPerMile: 0.07, insuranceAnnual: 2300,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 280, performance: true,
  },
  {
    id: "hyundai-ioniq-5-n", name: "Hyundai IONIQ 5 N", type: "ev", msrp: 66100,
    mpge: 78, kwhPer100mi: 43, maintenanceCostPerMile: 0.072, insuranceAnnual: 2450,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 221, performance: true,
  },
  // 3-row / large SUVs
  {
    id: "kia-ev9", name: "Kia EV9", type: "ev", msrp: 54900,
    mpge: 95, kwhPer100mi: 35, maintenanceCostPerMile: 0.06, insuranceAnnual: 2150,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 304,
  },
  {
    id: "rivian-r1s", name: "Rivian R1S", type: "ev", msrp: 75900,
    mpge: 73, kwhPer100mi: 46, maintenanceCostPerMile: 0.07, insuranceAnnual: 2600,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 320,
  },
  {
    id: "tesla-model-x", name: "Tesla Model X", type: "ev", msrp: 79990,
    mpge: 102, kwhPer100mi: 33, maintenanceCostPerMile: 0.072, insuranceAnnual: 2700,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 335, luxury: true,
  },
  // Electric trucks
  {
    id: "ford-f150-lightning", name: "Ford F-150 Lightning", type: "ev", msrp: 54780,
    mpge: 70, kwhPer100mi: 48, maintenanceCostPerMile: 0.07, insuranceAnnual: 2300,
    depreciationRate: 0.2, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD", rangeMi: 320,
  },
  {
    id: "chevy-silverado-ev", name: "Chevrolet Silverado EV", type: "ev", msrp: 73000,
    mpge: 66, kwhPer100mi: 51, maintenanceCostPerMile: 0.072, insuranceAnnual: 2400,
    depreciationRate: 0.21, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD", rangeMi: 440,
  },
  {
    id: "rivian-r1t", name: "Rivian R1T", type: "ev", msrp: 69900,
    mpge: 70, kwhPer100mi: 48, maintenanceCostPerMile: 0.07, insuranceAnnual: 2500,
    depreciationRate: 0.2, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "AWD", rangeMi: 328,
  },

  // ───────── Added from ZETA catalog (EVs) ─────────
  {
    id: "acura-zdx", name: "Acura ZDX", type: "ev", msrp: 64500,
    mpge: 89, kwhPer100mi: 38, maintenanceCostPerMile: 0.068, insuranceAnnual: 2250,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "RWD", rangeMi: 313, luxury: true,
  },
  {
    id: "audi-q4-etron", name: "Audi Q4 e-tron", type: "ev", msrp: 50500,
    mpge: 104, kwhPer100mi: 32, maintenanceCostPerMile: 0.066, insuranceAnnual: 2050,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 258, luxury: true,
  },
  {
    id: "audi-q6-etron", name: "Audi Q6 e-tron", type: "ev", msrp: 63800,
    mpge: 84, kwhPer100mi: 40, maintenanceCostPerMile: 0.072, insuranceAnnual: 2300,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 307, luxury: true,
  },
  {
    id: "audi-q8-etron", name: "Audi Q8 e-tron", type: "ev", msrp: 74400,
    mpge: 81, kwhPer100mi: 42, maintenanceCostPerMile: 0.075, insuranceAnnual: 2450,
    depreciationRate: 0.22, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "AWD", rangeMi: 285, luxury: true,
  },
  {
    id: "bmw-ix-xdrive40", name: "BMW iX xDrive40", type: "ev", msrp: 67100,
    mpge: 86, kwhPer100mi: 39, maintenanceCostPerMile: 0.075, insuranceAnnual: 2450,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "AWD", rangeMi: 309, luxury: true,
  },
  {
    id: "cadillac-lyriq", name: "Cadillac LYRIQ", type: "ev", msrp: 58000,
    mpge: 89, kwhPer100mi: 38, maintenanceCostPerMile: 0.068, insuranceAnnual: 2200,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "RWD", rangeMi: 314, luxury: true,
  },
  {
    id: "cadillac-optiq", name: "Cadillac OPTIQ", type: "ev", msrp: 54000,
    mpge: 92, kwhPer100mi: 37, maintenanceCostPerMile: 0.066, insuranceAnnual: 2100,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 302, luxury: true,
  },
  {
    id: "chevy-bolt-ev", name: "Chevrolet Bolt EV", type: "ev", msrp: 27600,
    mpge: 120, kwhPer100mi: 28, maintenanceCostPerMile: 0.057, insuranceAnnual: 1700,
    depreciationRate: 0.18, category: "Sedan",
    bodyStyle: "hatchback", sizeClass: 1, seats: 5, drivetrain: "FWD", rangeMi: 262,
  },
  {
    id: "nissan-leaf", name: "Nissan LEAF", type: "ev", msrp: 29990,
    mpge: 121, kwhPer100mi: 28, maintenanceCostPerMile: 0.057, insuranceAnnual: 1650,
    depreciationRate: 0.19, category: "Sedan",
    bodyStyle: "hatchback", sizeClass: 1, seats: 5, drivetrain: "FWD", rangeMi: 303,
  },
  {
    id: "genesis-g80-electrified", name: "Genesis G80 Electrified", type: "ev", msrp: 74000,
    mpge: 97, kwhPer100mi: 35, maintenanceCostPerMile: 0.072, insuranceAnnual: 2400,
    depreciationRate: 0.21, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 282, luxury: true,
  },
  {
    id: "genesis-gv60", name: "Genesis GV60", type: "ev", msrp: 52000,
    mpge: 99, kwhPer100mi: 34, maintenanceCostPerMile: 0.066, insuranceAnnual: 2100,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 264, luxury: true,
  },
  {
    id: "genesis-gv70-electrified", name: "Genesis GV70 Electrified", type: "ev", msrp: 66000,
    mpge: 90, kwhPer100mi: 37, maintenanceCostPerMile: 0.07, insuranceAnnual: 2300,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 236, luxury: true,
  },
  {
    id: "gmc-sierra-ev", name: "GMC Sierra EV", type: "ev", msrp: 75000,
    mpge: 64, kwhPer100mi: 53, maintenanceCostPerMile: 0.073, insuranceAnnual: 2450,
    depreciationRate: 0.21, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD", rangeMi: 390,
  },
  {
    id: "honda-prologue", name: "Honda Prologue", type: "ev", msrp: 48000,
    mpge: 92, kwhPer100mi: 37, maintenanceCostPerMile: 0.062, insuranceAnnual: 1950,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 296,
  },
  {
    id: "hyundai-kona-electric", name: "Hyundai Kona Electric", type: "ev", msrp: 33000,
    mpge: 120, kwhPer100mi: 28, maintenanceCostPerMile: 0.057, insuranceAnnual: 1720,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 1, seats: 5, drivetrain: "FWD", rangeMi: 261,
  },
  {
    id: "kia-niro-ev", name: "Kia Niro EV", type: "ev", msrp: 39700,
    mpge: 113, kwhPer100mi: 30, maintenanceCostPerMile: 0.058, insuranceAnnual: 1780,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "FWD", rangeMi: 253,
  },
  {
    id: "mercedes-eqe-suv", name: "Mercedes-Benz EQE SUV", type: "ev", msrp: 77000,
    mpge: 82, kwhPer100mi: 41, maintenanceCostPerMile: 0.078, insuranceAnnual: 2500,
    depreciationRate: 0.22, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 253, luxury: true,
  },
  {
    id: "mercedes-eqs-580", name: "Mercedes-Benz EQS 580 4MATIC", type: "ev", msrp: 105000,
    mpge: 94, kwhPer100mi: 36, maintenanceCostPerMile: 0.082, insuranceAnnual: 2800,
    depreciationRate: 0.24, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 340, luxury: true,
  },
  {
    id: "polestar-3", name: "Polestar 3", type: "ev", msrp: 73400,
    mpge: 80, kwhPer100mi: 42, maintenanceCostPerMile: 0.074, insuranceAnnual: 2450,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "AWD", rangeMi: 315, luxury: true,
  },
  {
    id: "tesla-model-s", name: "Tesla Model S", type: "ev", msrp: 74990,
    mpge: 120, kwhPer100mi: 28, maintenanceCostPerMile: 0.072, insuranceAnnual: 2650,
    depreciationRate: 0.21, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 402, luxury: true,
  },
  {
    id: "toyota-bz4x", name: "Toyota bZ4X", type: "ev", msrp: 34900,
    mpge: 114, kwhPer100mi: 30, maintenanceCostPerMile: 0.058, insuranceAnnual: 1820,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "FWD", rangeMi: 252,
  },
  {
    id: "vw-id-buzz", name: "Volkswagen ID. Buzz", type: "ev", msrp: 61545,
    mpge: 76, kwhPer100mi: 44, maintenanceCostPerMile: 0.066, insuranceAnnual: 2150,
    depreciationRate: 0.2, category: "Minivan",
    bodyStyle: "minivan", sizeClass: 4, seats: 7, drivetrain: "RWD", rangeMi: 234,
  },

  // ───────────────────────── Gas ─────────────────────────
  // Compact sedans
  {
    id: "toyota-corolla", name: "Toyota Corolla", type: "gas", msrp: 23145,
    mpg: 35, maintenanceCostPerMile: 0.08, insuranceAnnual: 1500,
    depreciationRate: 0.11, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 1, seats: 5, drivetrain: "FWD",
  },
  {
    id: "honda-civic", name: "Honda Civic", type: "gas", msrp: 24250,
    mpg: 36, maintenanceCostPerMile: 0.082, insuranceAnnual: 1550,
    depreciationRate: 0.11, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  // Midsize sedans
  {
    id: "toyota-camry", name: "Toyota Camry", type: "gas", msrp: 28855,
    mpg: 32, maintenanceCostPerMile: 0.09, insuranceAnnual: 1650,
    depreciationRate: 0.12, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "FWD",
  },
  {
    id: "honda-accord", name: "Honda Accord", type: "gas", msrp: 28990,
    mpg: 33, maintenanceCostPerMile: 0.088, insuranceAnnual: 1640,
    depreciationRate: 0.12, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "FWD",
  },
  // Luxury midsize sedan
  {
    id: "bmw-5-series", name: "BMW 5 Series", type: "gas", msrp: 58900,
    mpg: 28, maintenanceCostPerMile: 0.12, insuranceAnnual: 2200,
    depreciationRate: 0.17, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Performance coupe
  {
    id: "ford-mustang", name: "Ford Mustang GT", type: "gas", msrp: 44090,
    mpg: 19, maintenanceCostPerMile: 0.11, insuranceAnnual: 2300,
    depreciationRate: 0.16, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 3, seats: 4, drivetrain: "RWD", performance: true,
  },
  // Compact SUVs
  {
    id: "honda-crv", name: "Honda CR-V", type: "gas", msrp: 30850,
    mpg: 30, maintenanceCostPerMile: 0.095, insuranceAnnual: 1750,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "toyota-rav4", name: "Toyota RAV4", type: "gas", msrp: 31380,
    mpg: 30, maintenanceCostPerMile: 0.092, insuranceAnnual: 1700,
    depreciationRate: 0.12, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "chevy-equinox", name: "Chevrolet Equinox", type: "gas", msrp: 30500,
    mpg: 31, maintenanceCostPerMile: 0.088, insuranceAnnual: 1680,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  {
    id: "hyundai-tucson", name: "Hyundai Tucson", type: "gas", msrp: 30550,
    mpg: 29, maintenanceCostPerMile: 0.085, insuranceAnnual: 1720,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "subaru-outback", name: "Subaru Outback", type: "gas", msrp: 31415,
    mpg: 29, maintenanceCostPerMile: 0.09, insuranceAnnual: 1680,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD",
  },
  // 3-row SUV + minivan
  {
    id: "toyota-highlander", name: "Toyota Highlander", type: "gas", msrp: 39820,
    mpg: 24, maintenanceCostPerMile: 0.1, insuranceAnnual: 1850,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 8, drivetrain: "AWD",
  },
  {
    id: "honda-odyssey", name: "Honda Odyssey", type: "gas", msrp: 38630,
    mpg: 22, maintenanceCostPerMile: 0.098, insuranceAnnual: 1800,
    depreciationRate: 0.14, category: "Minivan",
    bodyStyle: "minivan", sizeClass: 4, seats: 8, drivetrain: "FWD",
  },
  // Trucks
  {
    id: "ford-f150", name: "Ford F-150", type: "gas", msrp: 36965,
    mpg: 23, maintenanceCostPerMile: 0.1, insuranceAnnual: 1900,
    depreciationRate: 0.14, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD",
  },
  {
    id: "chevy-silverado", name: "Chevrolet Silverado", type: "gas", msrp: 37500,
    mpg: 21, maintenanceCostPerMile: 0.102, insuranceAnnual: 1920,
    depreciationRate: 0.15, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD",
  },
  {
    id: "toyota-tacoma", name: "Toyota Tacoma", type: "gas", msrp: 33000,
    mpg: 21, maintenanceCostPerMile: 0.095, insuranceAnnual: 1820,
    depreciationRate: 0.12, category: "Truck",
    bodyStyle: "truck", sizeClass: 3, seats: 5, drivetrain: "4WD",
  },

  // ───────── Added from ZETA catalog (gas) ─────────
  {
    id: "nissan-sentra", name: "Nissan Sentra", type: "gas", msrp: 22000,
    mpg: 33, maintenanceCostPerMile: 0.08, insuranceAnnual: 1480,
    depreciationRate: 0.12, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  {
    id: "nissan-altima", name: "Nissan Altima", type: "gas", msrp: 26500,
    mpg: 32, maintenanceCostPerMile: 0.086, insuranceAnnual: 1600,
    depreciationRate: 0.13, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "FWD",
  },
  {
    id: "toyota-camry-hybrid", name: "Toyota Camry Hybrid", type: "gas", msrp: 29500,
    mpg: 51, maintenanceCostPerMile: 0.085, insuranceAnnual: 1650,
    depreciationRate: 0.12, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "FWD",
  },
  {
    id: "honda-accord-hybrid", name: "Honda Accord Hybrid", type: "gas", msrp: 33990,
    mpg: 48, maintenanceCostPerMile: 0.086, insuranceAnnual: 1660,
    depreciationRate: 0.12, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "FWD",
  },
  {
    id: "chevy-corvette", name: "Chevrolet Corvette", type: "gas", msrp: 68300,
    mpg: 19, maintenanceCostPerMile: 0.12, insuranceAnnual: 2400,
    depreciationRate: 0.15, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 3, seats: 2, drivetrain: "RWD", performance: true,
  },
  {
    id: "mazda-cx5", name: "Mazda CX-5", type: "gas", msrp: 30000,
    mpg: 28, maintenanceCostPerMile: 0.088, insuranceAnnual: 1700,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "toyota-rav4-hybrid", name: "Toyota RAV4 Hybrid", type: "gas", msrp: 33000,
    mpg: 40, maintenanceCostPerMile: 0.09, insuranceAnnual: 1720,
    depreciationRate: 0.12, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "ford-explorer", name: "Ford Explorer", type: "gas", msrp: 39000,
    mpg: 23, maintenanceCostPerMile: 0.098, insuranceAnnual: 1850,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "RWD",
  },
  {
    id: "bmw-x5", name: "BMW X5 xDrive40i", type: "gas", msrp: 66200,
    mpg: 25, maintenanceCostPerMile: 0.12, insuranceAnnual: 2250,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "bmw-x7", name: "BMW X7 xDrive40i", type: "gas", msrp: 83000,
    mpg: 22, maintenanceCostPerMile: 0.13, insuranceAnnual: 2500,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", luxury: true,
  },
  {
    id: "ford-f150-hybrid", name: "Ford F-150 Hybrid", type: "gas", msrp: 45000,
    mpg: 23, maintenanceCostPerMile: 0.098, insuranceAnnual: 1900,
    depreciationRate: 0.14, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD",
  },

  // ───────── Expanded brand coverage (EVs) ─────────
  // Volvo
  {
    id: "volvo-ex30", name: "Volvo EX30", type: "ev", msrp: 44900,
    mpge: 104, kwhPer100mi: 32, maintenanceCostPerMile: 0.064, insuranceAnnual: 1950,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 1, seats: 5, drivetrain: "RWD", rangeMi: 253, luxury: true,
  },
  {
    id: "volvo-ex40", name: "Volvo EX40", type: "ev", msrp: 53600,
    mpge: 92, kwhPer100mi: 37, maintenanceCostPerMile: 0.068, insuranceAnnual: 2050,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 254, luxury: true,
  },
  {
    id: "volvo-ex90", name: "Volvo EX90", type: "ev", msrp: 79995,
    mpge: 81, kwhPer100mi: 42, maintenanceCostPerMile: 0.075, insuranceAnnual: 2500,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 310, luxury: true,
  },
  {
    id: "volvo-c40", name: "Volvo C40 Recharge", type: "ev", msrp: 53900,
    mpge: 87, kwhPer100mi: 39, maintenanceCostPerMile: 0.068, insuranceAnnual: 2050,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 257, luxury: true,
  },
  // Subaru
  {
    id: "subaru-solterra", name: "Subaru Solterra", type: "ev", msrp: 38495,
    mpge: 104, kwhPer100mi: 32, maintenanceCostPerMile: 0.06, insuranceAnnual: 1850,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 227,
  },
  // Mini
  {
    id: "mini-cooper-se", name: "Mini Cooper SE", type: "ev", msrp: 31895,
    mpge: 100, kwhPer100mi: 34, maintenanceCostPerMile: 0.062, insuranceAnnual: 1780,
    depreciationRate: 0.2, category: "Sedan",
    bodyStyle: "hatchback", sizeClass: 1, seats: 4, drivetrain: "FWD", rangeMi: 200,
  },
  {
    id: "mini-countryman-electric", name: "Mini Countryman Electric", type: "ev", msrp: 45200,
    mpge: 92, kwhPer100mi: 37, maintenanceCostPerMile: 0.065, insuranceAnnual: 1950,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 212,
  },
  // Jaguar
  {
    id: "jaguar-i-pace", name: "Jaguar I-PACE", type: "ev", msrp: 72475,
    mpge: 76, kwhPer100mi: 44, maintenanceCostPerMile: 0.075, insuranceAnnual: 2450,
    depreciationRate: 0.23, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 246, luxury: true,
  },
  // Porsche
  {
    id: "porsche-taycan", name: "Porsche Taycan", type: "ev", msrp: 99400,
    mpge: 84, kwhPer100mi: 40, maintenanceCostPerMile: 0.078, insuranceAnnual: 2800,
    depreciationRate: 0.22, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 4, drivetrain: "RWD", rangeMi: 246, luxury: true, performance: true,
  },
  {
    id: "porsche-macan-electric", name: "Porsche Macan Electric", type: "ev", msrp: 75300,
    mpge: 87, kwhPer100mi: 39, maintenanceCostPerMile: 0.076, insuranceAnnual: 2650,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 308, luxury: true, performance: true,
  },
  // Lexus
  {
    id: "lexus-rz-450e", name: "Lexus RZ 450e", type: "ev", msrp: 55000,
    mpge: 95, kwhPer100mi: 36, maintenanceCostPerMile: 0.066, insuranceAnnual: 2150,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 220, luxury: true,
  },
  // VinFast
  {
    id: "vinfast-vf8", name: "VinFast VF 8", type: "ev", msrp: 41000,
    mpge: 86, kwhPer100mi: 39, maintenanceCostPerMile: 0.064, insuranceAnnual: 1950,
    depreciationRate: 0.23, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 264,
  },
  {
    id: "vinfast-vf9", name: "VinFast VF 9", type: "ev", msrp: 57000,
    mpge: 74, kwhPer100mi: 46, maintenanceCostPerMile: 0.07, insuranceAnnual: 2200,
    depreciationRate: 0.24, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 330,
  },
  // Jeep
  {
    id: "jeep-wagoneer-s", name: "Jeep Wagoneer S", type: "ev", msrp: 71995,
    mpge: 78, kwhPer100mi: 43, maintenanceCostPerMile: 0.07, insuranceAnnual: 2350,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 303,
  },
  // Dodge
  {
    id: "dodge-charger-daytona-ev", name: "Dodge Charger Daytona EV", type: "ev", msrp: 59595,
    mpge: 74, kwhPer100mi: 46, maintenanceCostPerMile: 0.072, insuranceAnnual: 2450,
    depreciationRate: 0.21, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 308, performance: true,
  },
  // Fiat
  {
    id: "fiat-500e", name: "Fiat 500e", type: "ev", msrp: 32500,
    mpge: 102, kwhPer100mi: 33, maintenanceCostPerMile: 0.061, insuranceAnnual: 1700,
    depreciationRate: 0.21, category: "Sedan",
    bodyStyle: "hatchback", sizeClass: 1, seats: 4, drivetrain: "FWD", rangeMi: 149,
  },
  // New EV models for existing makes
  {
    id: "chevy-blazer-ev", name: "Chevrolet Blazer EV", type: "ev", msrp: 44600,
    mpge: 104, kwhPer100mi: 32, maintenanceCostPerMile: 0.062, insuranceAnnual: 1950,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "RWD", rangeMi: 320,
  },
  {
    id: "bmw-i7", name: "BMW i7 xDrive60", type: "ev", msrp: 105700,
    mpge: 87, kwhPer100mi: 39, maintenanceCostPerMile: 0.082, insuranceAnnual: 2850,
    depreciationRate: 0.23, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 4, seats: 5, drivetrain: "AWD", rangeMi: 308, luxury: true,
  },
  {
    id: "mercedes-eqb", name: "Mercedes-Benz EQB", type: "ev", msrp: 54100,
    mpge: 98, kwhPer100mi: 35, maintenanceCostPerMile: 0.072, insuranceAnnual: 2200,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 7, drivetrain: "AWD", rangeMi: 227, luxury: true,
  },
  {
    id: "hyundai-ioniq-9", name: "Hyundai IONIQ 9", type: "ev", msrp: 58955,
    mpge: 86, kwhPer100mi: 39, maintenanceCostPerMile: 0.06, insuranceAnnual: 2150,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 335,
  },
  {
    id: "lucid-gravity", name: "Lucid Gravity", type: "ev", msrp: 94900,
    mpge: 90, kwhPer100mi: 37, maintenanceCostPerMile: 0.076, insuranceAnnual: 2750,
    depreciationRate: 0.23, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 450, luxury: true,
  },
  {
    id: "cadillac-vistiq", name: "Cadillac VISTIQ", type: "ev", msrp: 78790,
    mpge: 79, kwhPer100mi: 43, maintenanceCostPerMile: 0.072, insuranceAnnual: 2500,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", rangeMi: 305, luxury: true,
  },

  // ───────── Expanded brand coverage (gas) ─────────
  // Volkswagen
  {
    id: "vw-jetta", name: "Volkswagen Jetta", type: "gas", msrp: 22495,
    mpg: 35, maintenanceCostPerMile: 0.084, insuranceAnnual: 1520,
    depreciationRate: 0.13, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  {
    id: "vw-tiguan", name: "Volkswagen Tiguan", type: "gas", msrp: 29495,
    mpg: 26, maintenanceCostPerMile: 0.09, insuranceAnnual: 1680,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "vw-atlas", name: "Volkswagen Atlas", type: "gas", msrp: 38200,
    mpg: 23, maintenanceCostPerMile: 0.098, insuranceAnnual: 1820,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD",
  },
  // Kia
  {
    id: "kia-k4", name: "Kia K4", type: "gas", msrp: 21900,
    mpg: 36, maintenanceCostPerMile: 0.082, insuranceAnnual: 1500,
    depreciationRate: 0.13, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  {
    id: "kia-sportage", name: "Kia Sportage", type: "gas", msrp: 28115,
    mpg: 28, maintenanceCostPerMile: 0.086, insuranceAnnual: 1680,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "kia-telluride", name: "Kia Telluride", type: "gas", msrp: 38390,
    mpg: 23, maintenanceCostPerMile: 0.096, insuranceAnnual: 1850,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 8, drivetrain: "AWD",
  },
  // Jeep
  {
    id: "jeep-grand-cherokee", name: "Jeep Grand Cherokee", type: "gas", msrp: 38095,
    mpg: 22, maintenanceCostPerMile: 0.1, insuranceAnnual: 1850,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "4WD",
  },
  {
    id: "jeep-wrangler", name: "Jeep Wrangler", type: "gas", msrp: 33695,
    mpg: 22, maintenanceCostPerMile: 0.105, insuranceAnnual: 1820,
    depreciationRate: 0.12, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "4WD",
  },
  {
    id: "jeep-compass", name: "Jeep Compass", type: "gas", msrp: 27495,
    mpg: 27, maintenanceCostPerMile: 0.092, insuranceAnnual: 1650,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  // Ram
  {
    id: "ram-1500", name: "Ram 1500", type: "gas", msrp: 40275,
    mpg: 22, maintenanceCostPerMile: 0.102, insuranceAnnual: 1920,
    depreciationRate: 0.15, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD",
  },
  // GMC
  {
    id: "gmc-sierra-1500", name: "GMC Sierra 1500", type: "gas", msrp: 39500,
    mpg: 21, maintenanceCostPerMile: 0.102, insuranceAnnual: 1940,
    depreciationRate: 0.15, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD",
  },
  {
    id: "gmc-yukon", name: "GMC Yukon", type: "gas", msrp: 60200,
    mpg: 18, maintenanceCostPerMile: 0.11, insuranceAnnual: 2100,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 8, drivetrain: "4WD",
  },
  {
    id: "gmc-acadia", name: "GMC Acadia", type: "gas", msrp: 43395,
    mpg: 23, maintenanceCostPerMile: 0.096, insuranceAnnual: 1850,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD",
  },
  // Dodge
  {
    id: "dodge-durango", name: "Dodge Durango", type: "gas", msrp: 41995,
    mpg: 21, maintenanceCostPerMile: 0.102, insuranceAnnual: 1900,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD",
  },
  {
    id: "dodge-hornet", name: "Dodge Hornet", type: "gas", msrp: 31400,
    mpg: 27, maintenanceCostPerMile: 0.09, insuranceAnnual: 1720,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  // Chrysler
  {
    id: "chrysler-pacifica", name: "Chrysler Pacifica", type: "gas", msrp: 40425,
    mpg: 22, maintenanceCostPerMile: 0.098, insuranceAnnual: 1820,
    depreciationRate: 0.15, category: "Minivan",
    bodyStyle: "minivan", sizeClass: 4, seats: 8, drivetrain: "FWD",
  },
  // Lexus
  {
    id: "lexus-es-350", name: "Lexus ES 350", type: "gas", msrp: 43190,
    mpg: 26, maintenanceCostPerMile: 0.095, insuranceAnnual: 1900,
    depreciationRate: 0.14, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "FWD", luxury: true,
  },
  {
    id: "lexus-rx-350", name: "Lexus RX 350", type: "gas", msrp: 49050,
    mpg: 24, maintenanceCostPerMile: 0.098, insuranceAnnual: 1980,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "lexus-nx-350", name: "Lexus NX 350", type: "gas", msrp: 43385,
    mpg: 25, maintenanceCostPerMile: 0.094, insuranceAnnual: 1900,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Mercedes-Benz
  {
    id: "mercedes-c-300", name: "Mercedes-Benz C 300", type: "gas", msrp: 47150,
    mpg: 28, maintenanceCostPerMile: 0.12, insuranceAnnual: 2150,
    depreciationRate: 0.17, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "RWD", luxury: true,
  },
  {
    id: "mercedes-glc-300", name: "Mercedes-Benz GLC 300", type: "gas", msrp: 49250,
    mpg: 25, maintenanceCostPerMile: 0.12, insuranceAnnual: 2200,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Audi
  {
    id: "audi-a4", name: "Audi A4", type: "gas", msrp: 43500,
    mpg: 28, maintenanceCostPerMile: 0.115, insuranceAnnual: 2050,
    depreciationRate: 0.17, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "audi-q5", name: "Audi Q5", type: "gas", msrp: 46300,
    mpg: 25, maintenanceCostPerMile: 0.115, insuranceAnnual: 2100,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Acura
  {
    id: "acura-integra", name: "Acura Integra", type: "gas", msrp: 33000,
    mpg: 33, maintenanceCostPerMile: 0.09, insuranceAnnual: 1720,
    depreciationRate: 0.14, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "FWD", luxury: true,
  },
  {
    id: "acura-mdx", name: "Acura MDX", type: "gas", msrp: 51200,
    mpg: 22, maintenanceCostPerMile: 0.1, insuranceAnnual: 1980,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", luxury: true,
  },
  {
    id: "acura-rdx", name: "Acura RDX", type: "gas", msrp: 45650,
    mpg: 24, maintenanceCostPerMile: 0.098, insuranceAnnual: 1900,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Infiniti
  {
    id: "infiniti-qx60", name: "Infiniti QX60", type: "gas", msrp: 50000,
    mpg: 22, maintenanceCostPerMile: 0.1, insuranceAnnual: 1950,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", luxury: true,
  },
  {
    id: "infiniti-q50", name: "Infiniti Q50", type: "gas", msrp: 43150,
    mpg: 23, maintenanceCostPerMile: 0.1, insuranceAnnual: 1920,
    depreciationRate: 0.17, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "RWD", luxury: true,
  },
  // Cadillac
  {
    id: "cadillac-escalade", name: "Cadillac Escalade", type: "gas", msrp: 87595,
    mpg: 16, maintenanceCostPerMile: 0.12, insuranceAnnual: 2400,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "4WD", luxury: true,
  },
  {
    id: "cadillac-xt5", name: "Cadillac XT5", type: "gas", msrp: 46390,
    mpg: 23, maintenanceCostPerMile: 0.105, insuranceAnnual: 1980,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Buick
  {
    id: "buick-encore-gx", name: "Buick Encore GX", type: "gas", msrp: 26895,
    mpg: 29, maintenanceCostPerMile: 0.09, insuranceAnnual: 1620,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 1, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "buick-enclave", name: "Buick Enclave", type: "gas", msrp: 46000,
    mpg: 22, maintenanceCostPerMile: 0.098, insuranceAnnual: 1850,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", luxury: true,
  },
  // Volvo
  {
    id: "volvo-xc60", name: "Volvo XC60", type: "gas", msrp: 46850,
    mpg: 25, maintenanceCostPerMile: 0.105, insuranceAnnual: 1980,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "volvo-xc90", name: "Volvo XC90", type: "gas", msrp: 58450,
    mpg: 23, maintenanceCostPerMile: 0.11, insuranceAnnual: 2100,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD", luxury: true,
  },
  // Genesis
  {
    id: "genesis-g70", name: "Genesis G70", type: "gas", msrp: 42100,
    mpg: 25, maintenanceCostPerMile: 0.1, insuranceAnnual: 1920,
    depreciationRate: 0.17, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "genesis-gv80", name: "Genesis GV80", type: "gas", msrp: 58050,
    mpg: 22, maintenanceCostPerMile: 0.105, insuranceAnnual: 2050,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Lincoln
  {
    id: "lincoln-nautilus", name: "Lincoln Nautilus", type: "gas", msrp: 51810,
    mpg: 23, maintenanceCostPerMile: 0.105, insuranceAnnual: 1980,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "lincoln-navigator", name: "Lincoln Navigator", type: "gas", msrp: 84000,
    mpg: 17, maintenanceCostPerMile: 0.12, insuranceAnnual: 2350,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "4WD", luxury: true,
  },
  // Mitsubishi
  {
    id: "mitsubishi-outlander", name: "Mitsubishi Outlander", type: "gas", msrp: 30245,
    mpg: 28, maintenanceCostPerMile: 0.088, insuranceAnnual: 1650,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 7, drivetrain: "AWD",
  },
  // Porsche
  {
    id: "porsche-cayenne", name: "Porsche Cayenne", type: "gas", msrp: 79200,
    mpg: 19, maintenanceCostPerMile: 0.13, insuranceAnnual: 2600,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "porsche-911-carrera", name: "Porsche 911 Carrera", type: "gas", msrp: 122095,
    mpg: 20, maintenanceCostPerMile: 0.14, insuranceAnnual: 2900,
    depreciationRate: 0.16, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 2, seats: 4, drivetrain: "RWD", luxury: true, performance: true,
  },
  // Land Rover
  {
    id: "land-rover-defender", name: "Land Rover Defender", type: "gas", msrp: 56900,
    mpg: 19, maintenanceCostPerMile: 0.13, insuranceAnnual: 2200,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "4WD", luxury: true,
  },
  {
    id: "land-rover-range-rover-sport", name: "Land Rover Range Rover Sport", type: "gas", msrp: 84350,
    mpg: 19, maintenanceCostPerMile: 0.135, insuranceAnnual: 2500,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "4WD", luxury: true,
  },
  // Jaguar
  {
    id: "jaguar-f-pace", name: "Jaguar F-PACE", type: "gas", msrp: 55200,
    mpg: 23, maintenanceCostPerMile: 0.125, insuranceAnnual: 2150,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  // Mazda
  {
    id: "mazda-mazda3", name: "Mazda Mazda3", type: "gas", msrp: 24170,
    mpg: 33, maintenanceCostPerMile: 0.084, insuranceAnnual: 1560,
    depreciationRate: 0.13, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  {
    id: "mazda-cx-50", name: "Mazda CX-50", type: "gas", msrp: 31000,
    mpg: 28, maintenanceCostPerMile: 0.088, insuranceAnnual: 1700,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "mazda-cx-90", name: "Mazda CX-90", type: "gas", msrp: 39700,
    mpg: 25, maintenanceCostPerMile: 0.092, insuranceAnnual: 1820,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "AWD",
  },
  // Subaru
  {
    id: "subaru-forester", name: "Subaru Forester", type: "gas", msrp: 29695,
    mpg: 29, maintenanceCostPerMile: 0.088, insuranceAnnual: 1660,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "subaru-crosstrek", name: "Subaru Crosstrek", type: "gas", msrp: 26840,
    mpg: 29, maintenanceCostPerMile: 0.086, insuranceAnnual: 1600,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 1, seats: 5, drivetrain: "AWD",
  },
  {
    id: "subaru-impreza", name: "Subaru Impreza", type: "gas", msrp: 24220,
    mpg: 31, maintenanceCostPerMile: 0.084, insuranceAnnual: 1560,
    depreciationRate: 0.13, category: "Sedan",
    bodyStyle: "hatchback", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  // Hyundai
  {
    id: "hyundai-elantra", name: "Hyundai Elantra", type: "gas", msrp: 22125,
    mpg: 36, maintenanceCostPerMile: 0.082, insuranceAnnual: 1520,
    depreciationRate: 0.14, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  {
    id: "hyundai-santa-fe", name: "Hyundai Santa Fe", type: "gas", msrp: 34300,
    mpg: 25, maintenanceCostPerMile: 0.09, insuranceAnnual: 1750,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 7, drivetrain: "AWD",
  },
  {
    id: "hyundai-palisade", name: "Hyundai Palisade", type: "gas", msrp: 37800,
    mpg: 22, maintenanceCostPerMile: 0.094, insuranceAnnual: 1820,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 8, drivetrain: "AWD",
  },
  // Toyota
  {
    id: "toyota-tundra", name: "Toyota Tundra", type: "gas", msrp: 40090,
    mpg: 20, maintenanceCostPerMile: 0.098, insuranceAnnual: 1900,
    depreciationRate: 0.13, category: "Truck",
    bodyStyle: "truck", sizeClass: 4, seats: 5, drivetrain: "4WD",
  },
  {
    id: "toyota-4runner", name: "Toyota 4Runner", type: "gas", msrp: 42220,
    mpg: 20, maintenanceCostPerMile: 0.095, insuranceAnnual: 1820,
    depreciationRate: 0.12, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "4WD",
  },
  {
    id: "toyota-sienna", name: "Toyota Sienna", type: "gas", msrp: 39185,
    mpg: 36, maintenanceCostPerMile: 0.09, insuranceAnnual: 1780,
    depreciationRate: 0.13, category: "Minivan",
    bodyStyle: "minivan", sizeClass: 4, seats: 8, drivetrain: "FWD",
  },
  {
    id: "toyota-corolla-cross", name: "Toyota Corolla Cross", type: "gas", msrp: 24935,
    mpg: 32, maintenanceCostPerMile: 0.084, insuranceAnnual: 1580,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 1, seats: 5, drivetrain: "AWD",
  },
  // Honda
  {
    id: "honda-pilot", name: "Honda Pilot", type: "gas", msrp: 40200,
    mpg: 22, maintenanceCostPerMile: 0.096, insuranceAnnual: 1820,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 8, drivetrain: "AWD",
  },
  {
    id: "honda-hr-v", name: "Honda HR-V", type: "gas", msrp: 25400,
    mpg: 28, maintenanceCostPerMile: 0.086, insuranceAnnual: 1620,
    depreciationRate: 0.14, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 1, seats: 5, drivetrain: "AWD",
  },
  {
    id: "honda-ridgeline", name: "Honda Ridgeline", type: "gas", msrp: 40850,
    mpg: 21, maintenanceCostPerMile: 0.095, insuranceAnnual: 1820,
    depreciationRate: 0.13, category: "Truck",
    bodyStyle: "truck", sizeClass: 3, seats: 5, drivetrain: "AWD",
  },
  // Ford
  {
    id: "ford-escape", name: "Ford Escape", type: "gas", msrp: 29495,
    mpg: 28, maintenanceCostPerMile: 0.09, insuranceAnnual: 1680,
    depreciationRate: 0.15, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "ford-bronco", name: "Ford Bronco", type: "gas", msrp: 39130,
    mpg: 20, maintenanceCostPerMile: 0.1, insuranceAnnual: 1850,
    depreciationRate: 0.13, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "4WD",
  },
  {
    id: "ford-maverick", name: "Ford Maverick", type: "gas", msrp: 28145,
    mpg: 26, maintenanceCostPerMile: 0.09, insuranceAnnual: 1700,
    depreciationRate: 0.13, category: "Truck",
    bodyStyle: "truck", sizeClass: 2, seats: 5, drivetrain: "FWD",
  },
  // Nissan
  {
    id: "nissan-rogue", name: "Nissan Rogue", type: "gas", msrp: 28850,
    mpg: 30, maintenanceCostPerMile: 0.088, insuranceAnnual: 1680,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD",
  },
  {
    id: "nissan-pathfinder", name: "Nissan Pathfinder", type: "gas", msrp: 36600,
    mpg: 23, maintenanceCostPerMile: 0.096, insuranceAnnual: 1820,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 7, drivetrain: "4WD",
  },
  {
    id: "nissan-frontier", name: "Nissan Frontier", type: "gas", msrp: 31290,
    mpg: 21, maintenanceCostPerMile: 0.095, insuranceAnnual: 1800,
    depreciationRate: 0.14, category: "Truck",
    bodyStyle: "truck", sizeClass: 3, seats: 5, drivetrain: "4WD",
  },
  // Chevrolet
  {
    id: "chevy-malibu", name: "Chevrolet Malibu", type: "gas", msrp: 26095,
    mpg: 32, maintenanceCostPerMile: 0.086, insuranceAnnual: 1580,
    depreciationRate: 0.16, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "FWD",
  },
  {
    id: "chevy-traverse", name: "Chevrolet Traverse", type: "gas", msrp: 39995,
    mpg: 22, maintenanceCostPerMile: 0.096, insuranceAnnual: 1820,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 8, drivetrain: "AWD",
  },
  {
    id: "chevy-tahoe", name: "Chevrolet Tahoe", type: "gas", msrp: 58200,
    mpg: 18, maintenanceCostPerMile: 0.108, insuranceAnnual: 2050,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 8, drivetrain: "4WD",
  },
  {
    id: "chevy-trailblazer", name: "Chevrolet Trailblazer", type: "gas", msrp: 24395,
    mpg: 30, maintenanceCostPerMile: 0.086, insuranceAnnual: 1600,
    depreciationRate: 0.16, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 1, seats: 5, drivetrain: "AWD",
  },
  // BMW
  {
    id: "bmw-330i", name: "BMW 330i", type: "gas", msrp: 45950,
    mpg: 30, maintenanceCostPerMile: 0.118, insuranceAnnual: 2100,
    depreciationRate: 0.17, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 2, seats: 5, drivetrain: "RWD", luxury: true,
  },
  {
    id: "bmw-x3", name: "BMW X3 xDrive30i", type: "gas", msrp: 50000,
    mpg: 26, maintenanceCostPerMile: 0.12, insuranceAnnual: 2150,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },

  // ───────── Premium / exotic makes (PlugStar parity) ─────────
  // Gas
  {
    id: "alfa-romeo-giulia", name: "Alfa Romeo Giulia", type: "gas", msrp: 45000,
    mpg: 27, maintenanceCostPerMile: 0.11, insuranceAnnual: 2050,
    depreciationRate: 0.18, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "alfa-romeo-stelvio", name: "Alfa Romeo Stelvio", type: "gas", msrp: 48000,
    mpg: 25, maintenanceCostPerMile: 0.115, insuranceAnnual: 2150,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "bentley-bentayga", name: "Bentley Bentayga", type: "gas", msrp: 205000,
    mpg: 18, maintenanceCostPerMile: 0.16, insuranceAnnual: 4200,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "bentley-continental-gt", name: "Bentley Continental GT", type: "gas", msrp: 250000,
    mpg: 17, maintenanceCostPerMile: 0.16, insuranceAnnual: 4500,
    depreciationRate: 0.2, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 3, seats: 4, drivetrain: "AWD", luxury: true, performance: true,
  },
  {
    id: "ferrari-roma", name: "Ferrari Roma", type: "gas", msrp: 247000,
    mpg: 19, maintenanceCostPerMile: 0.18, insuranceAnnual: 5000,
    depreciationRate: 0.18, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 3, seats: 4, drivetrain: "RWD", luxury: true, performance: true,
  },
  {
    id: "ferrari-purosangue", name: "Ferrari Purosangue", type: "gas", msrp: 400000,
    mpg: 14, maintenanceCostPerMile: 0.2, insuranceAnnual: 6000,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 4, drivetrain: "AWD", luxury: true, performance: true,
  },
  {
    id: "maserati-grecale", name: "Maserati Grecale", type: "gas", msrp: 78000,
    mpg: 23, maintenanceCostPerMile: 0.13, insuranceAnnual: 2500,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "maserati-ghibli", name: "Maserati Ghibli", type: "gas", msrp: 80000,
    mpg: 20, maintenanceCostPerMile: 0.14, insuranceAnnual: 2600,
    depreciationRate: 0.19, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true, performance: true,
  },
  {
    id: "lamborghini-urus", name: "Lamborghini Urus", type: "gas", msrp: 240000,
    mpg: 14, maintenanceCostPerMile: 0.18, insuranceAnnual: 5000,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true, performance: true,
  },
  {
    id: "lamborghini-revuelto", name: "Lamborghini Revuelto", type: "gas", msrp: 600000,
    mpg: 13, maintenanceCostPerMile: 0.2, insuranceAnnual: 7000,
    depreciationRate: 0.18, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 2, seats: 2, drivetrain: "AWD", luxury: true, performance: true,
  },
  {
    id: "mclaren-artura", name: "McLaren Artura", type: "gas", msrp: 252000,
    mpg: 21, maintenanceCostPerMile: 0.17, insuranceAnnual: 5000,
    depreciationRate: 0.18, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 2, seats: 2, drivetrain: "RWD", luxury: true, performance: true,
  },
  {
    id: "mclaren-gt", name: "McLaren GT", type: "gas", msrp: 210000,
    mpg: 18, maintenanceCostPerMile: 0.17, insuranceAnnual: 4800,
    depreciationRate: 0.18, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 2, seats: 2, drivetrain: "RWD", luxury: true, performance: true,
  },
  {
    id: "aston-martin-vantage", name: "Aston Martin Vantage", type: "gas", msrp: 191000,
    mpg: 18, maintenanceCostPerMile: 0.16, insuranceAnnual: 4000,
    depreciationRate: 0.18, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 3, seats: 2, drivetrain: "RWD", luxury: true, performance: true,
  },
  {
    id: "aston-martin-dbx", name: "Aston Martin DBX", type: "gas", msrp: 245000,
    mpg: 16, maintenanceCostPerMile: 0.17, insuranceAnnual: 4200,
    depreciationRate: 0.19, category: "SUV",
    bodyStyle: "suv-mid", sizeClass: 3, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "rolls-royce-ghost", name: "Rolls-Royce Ghost", type: "gas", msrp: 350000,
    mpg: 14, maintenanceCostPerMile: 0.2, insuranceAnnual: 6000,
    depreciationRate: 0.2, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 4, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "rolls-royce-cullinan", name: "Rolls-Royce Cullinan", type: "gas", msrp: 400000,
    mpg: 14, maintenanceCostPerMile: 0.2, insuranceAnnual: 6500,
    depreciationRate: 0.2, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "AWD", luxury: true,
  },
  {
    id: "lotus-emira", name: "Lotus Emira", type: "gas", msrp: 100000,
    mpg: 22, maintenanceCostPerMile: 0.14, insuranceAnnual: 2800,
    depreciationRate: 0.18, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 2, seats: 2, drivetrain: "RWD", luxury: true, performance: true,
  },
  // EV variants of the exotic makes (so they appear on the EV side too)
  {
    id: "lotus-eletre", name: "Lotus Eletre", type: "ev", msrp: 107000,
    mpge: 78, kwhPer100mi: 43, maintenanceCostPerMile: 0.075, insuranceAnnual: 2800,
    depreciationRate: 0.21, category: "SUV",
    bodyStyle: "suv-large", sizeClass: 4, seats: 5, drivetrain: "AWD", rangeMi: 265, luxury: true, performance: true,
  },
  {
    id: "lotus-emeya", name: "Lotus Emeya", type: "ev", msrp: 100000,
    mpge: 80, kwhPer100mi: 42, maintenanceCostPerMile: 0.075, insuranceAnnual: 2800,
    depreciationRate: 0.21, category: "Sedan",
    bodyStyle: "sedan", sizeClass: 3, seats: 5, drivetrain: "AWD", rangeMi: 270, luxury: true, performance: true,
  },
  {
    id: "rolls-royce-spectre", name: "Rolls-Royce Spectre", type: "ev", msrp: 420000,
    mpge: 72, kwhPer100mi: 47, maintenanceCostPerMile: 0.09, insuranceAnnual: 6500,
    depreciationRate: 0.21, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 4, seats: 4, drivetrain: "AWD", rangeMi: 291, luxury: true,
  },
  {
    id: "maserati-granturismo-folgore", name: "Maserati GranTurismo Folgore", type: "ev", msrp: 200000,
    mpge: 75, kwhPer100mi: 45, maintenanceCostPerMile: 0.085, insuranceAnnual: 3000,
    depreciationRate: 0.2, category: "Coupe",
    bodyStyle: "coupe", sizeClass: 3, seats: 4, drivetrain: "AWD", rangeMi: 280, luxury: true, performance: true,
  },
];

// Vehicle photos (Wikimedia Commons, hot-link safe). Keyed by id and attached
// to each EV below so any consumer can read `vehicle.image`.
const VEHICLE_IMAGES: Record<string, string> = {
  "tesla-model-3": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg/330px-Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg",
  "tesla-model-3-performance": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ab/Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg/330px-Tesla_Model_3_%282023%29_Autofr%C3%BChling_Ulm_IMG_9282.jpg",
  "hyundai-ioniq-6": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/2023_Hyundai_Ioniq_6_Limited%2C_front_4.27.23.jpg/330px-2023_Hyundai_Ioniq_6_Limited%2C_front_4.27.23.jpg",
  "polestar-2": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/ca/Polestar_2_%E2%80%93_f_02042021.jpg/330px-Polestar_2_%E2%80%93_f_02042021.jpg",
  "bmw-i4": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/ad/BMW_i4_IMG_6695.jpg/330px-BMW_i4_IMG_6695.jpg",
  "bmw-i5": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/96/BMW_i5_M60_xDrive_%28G60%2C_2024%29_%2853767149083%29.jpg/330px-BMW_i5_M60_xDrive_%28G60%2C_2024%29_%2853767149083%29.jpg",
  "mercedes-eqe": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Mercedes-Benz_V295_350%2B_Classic-Days_2022_DSC_0018.jpg/330px-Mercedes-Benz_V295_350%2B_Classic-Days_2022_DSC_0018.jpg",
  "lucid-air": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/26/2022_Lucid_Air_Grand_Touring_in_Zenith_Red%2C_front_left.jpg/330px-2022_Lucid_Air_Grand_Touring_in_Zenith_Red%2C_front_left.jpg",
  "tesla-model-y": "https://upload.wikimedia.org/wikipedia/commons/thumb/b/bd/2022_Tesla_Model_Y_Long_Range_AWD_Front.jpg/330px-2022_Tesla_Model_Y_Long_Range_AWD_Front.jpg",
  "chevy-equinox-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/46/2025_Chevrolet_Equinox_EV%2C_front_left_4.26.25.jpg/330px-2025_Chevrolet_Equinox_EV%2C_front_left_4.26.25.jpg",
  "hyundai-ioniq-5": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Hyundai_Ioniq_5_AWD_Techniq-Paket_%E2%80%93_f_31122024.jpg/330px-Hyundai_Ioniq_5_AWD_Techniq-Paket_%E2%80%93_f_31122024.jpg",
  "hyundai-ioniq-5-n": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/85/Hyundai_Ioniq_5_AWD_Techniq-Paket_%E2%80%93_f_31122024.jpg/330px-Hyundai_Ioniq_5_AWD_Techniq-Paket_%E2%80%93_f_31122024.jpg",
  "kia-ev6": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d9/2021_Kia_EV6_GT-Line_S.jpg/330px-2021_Kia_EV6_GT-Line_S.jpg",
  "ford-mustang-mach-e": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/2021_Ford_Mustang_Mach-E_Standard_Range_Front.jpg/330px-2021_Ford_Mustang_Mach-E_Standard_Range_Front.jpg",
  "ford-mustang-mach-e-gt": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/49/2021_Ford_Mustang_Mach-E_Standard_Range_Front.jpg/330px-2021_Ford_Mustang_Mach-E_Standard_Range_Front.jpg",
  "vw-id4": "https://upload.wikimedia.org/wikipedia/commons/thumb/5/55/2025_Volkswagen_ID4_Pro_Redspot_front.jpg/330px-2025_Volkswagen_ID4_Pro_Redspot_front.jpg",
  "nissan-ariya": "https://upload.wikimedia.org/wikipedia/commons/thumb/6/64/2023_Nissan_Ariya_Advance_Front.jpg/330px-2023_Nissan_Ariya_Advance_Front.jpg",
  "kia-ev9": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e0/Kia_EV9_1X7A2472.jpg/330px-Kia_EV9_1X7A2472.jpg",
  "rivian-r1s": "https://upload.wikimedia.org/wikipedia/commons/thumb/8/89/2023_Rivian_R1S_Adventure%2C_front_1.29.23.jpg/330px-2023_Rivian_R1S_Adventure%2C_front_1.29.23.jpg",
  "tesla-model-x": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/92/2017_Tesla_Model_X_100D_Front.jpg/330px-2017_Tesla_Model_X_100D_Front.jpg",
  "ford-f150-lightning": "https://upload.wikimedia.org/wikipedia/commons/thumb/7/76/2022_Ford_F-150_Lightning_Lariat_in_Atlas_Blue_Metallic%2C_Front_Right%2C_08-06-2022.jpg/330px-2022_Ford_F-150_Lightning_Lariat_in_Atlas_Blue_Metallic%2C_Front_Right%2C_08-06-2022.jpg",
  "chevy-silverado-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/09/2024_Chevrolet_Silverado_EV_4WT_AWD_in_Summit_White%2C_front_left%2C_2024-06-30.jpg/330px-2024_Chevrolet_Silverado_EV_4WT_AWD_in_Summit_White%2C_front_left%2C_2024-06-30.jpg",
  "rivian-r1t": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/e1/2022_Rivian_R1T_%28in_Glacier_White%29%2C_front_6.21.22.jpg/330px-2022_Rivian_R1T_%28in_Glacier_White%29%2C_front_6.21.22.jpg",
  "acura-zdx": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c9/2024_Acura_ZDX_Type_S%2C_front_2.6.25.jpg/330px-2024_Acura_ZDX_Type_S%2C_front_2.6.25.jpg",
  "audi-q4-etron": "https://upload.wikimedia.org/wikipedia/commons/thumb/0/05/2021_Audi_Q4_e-tron_Sport_35.jpg/330px-2021_Audi_Q4_e-tron_Sport_35.jpg",
  "audi-q6-etron": "https://upload.wikimedia.org/wikipedia/commons/thumb/a/a7/Audi_Q6_e-tron_DSC_7829.jpg/330px-Audi_Q6_e-tron_DSC_7829.jpg",
  "audi-q8-etron": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d5/2020_Audi_e-Tron_Sport_50_Quattro.jpg/330px-2020_Audi_e-Tron_Sport_50_Quattro.jpg",
  "bmw-ix-xdrive40": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/3b/2022_BMW_iX_xDrive_40_CRI_12_2021_2727.jpg/330px-2022_BMW_iX_xDrive_40_CRI_12_2021_2727.jpg",
  "cadillac-lyriq": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/37/2023_Cadillac_Lyriq_in_Satin_Steel_Metallic%2C_front_left.jpg/330px-2023_Cadillac_Lyriq_in_Satin_Steel_Metallic%2C_front_left.jpg",
  "cadillac-optiq": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f0/Cadillac_Optiq_%28IQ_Aoge%29_01_China_2024-04-23.jpg/330px-Cadillac_Optiq_%28IQ_Aoge%29_01_China_2024-04-23.jpg",
  "chevy-bolt-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/dd/2022_Chevrolet_Bolt_EV_2LT%2C_NYC_official_fleet_1.2.23.jpg/330px-2022_Chevrolet_Bolt_EV_2LT%2C_NYC_official_fleet_1.2.23.jpg",
  "nissan-leaf": "https://upload.wikimedia.org/wikipedia/commons/thumb/3/38/0_Nissan_Leaf_%28ZE1%29_2.jpg/330px-0_Nissan_Leaf_%28ZE1%29_2.jpg",
  "genesis-g80-electrified": "https://upload.wikimedia.org/wikipedia/commons/thumb/f/f7/Genesis_G80_IAA_2021_1X7A0229.jpg/330px-Genesis_G80_IAA_2021_1X7A0229.jpg",
  "genesis-gv60": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/98/Genesis_GV60_1X7A5760.jpg/330px-Genesis_GV60_1X7A5760.jpg",
  "genesis-gv70-electrified": "https://upload.wikimedia.org/wikipedia/commons/thumb/2/2e/Genesis_GV70_IAA_2021_1X7A0228.jpg/330px-Genesis_GV70_IAA_2021_1X7A0228.jpg",
  "gmc-sierra-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/db/2024_GMC_Sierra_EV_Denali_front_view.jpg/330px-2024_GMC_Sierra_EV_Denali_front_view.jpg",
  "honda-prologue": "https://upload.wikimedia.org/wikipedia/commons/thumb/d/d8/2024_Honda_Prologue_Touring%2C_front_7.11.25.jpg/330px-2024_Honda_Prologue_Touring%2C_front_7.11.25.jpg",
  "hyundai-kona-electric": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ed/Hyundai_Kona_Electric_%28SX2%29_1X7A1554.jpg/330px-Hyundai_Kona_Electric_%28SX2%29_1X7A1554.jpg",
  "kia-niro-ev": "https://upload.wikimedia.org/wikipedia/commons/thumb/c/cb/Kia_Niro_EV_%28SG2%29_1X7A7188.jpg/330px-Kia_Niro_EV_%28SG2%29_1X7A7188.jpg",
  "mercedes-eqe-suv": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/41/Mercedes-Benz_X294_IMG_8682.jpg/330px-Mercedes-Benz_X294_IMG_8682.jpg",
  "mercedes-eqs-580": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ef/Mercedes-Benz_V297_Classic-Days_2022_DSC_0016.jpg/330px-Mercedes-Benz_V297_Classic-Days_2022_DSC_0016.jpg",
  "polestar-3": "https://upload.wikimedia.org/wikipedia/commons/thumb/1/14/Polestar_3_Auto_Zuerich_2023_1X7A1307.jpg/330px-Polestar_3_Auto_Zuerich_2023_1X7A1307.jpg",
  "tesla-model-s": "https://upload.wikimedia.org/wikipedia/commons/thumb/9/9e/Tesla_Model_S_%28Facelift_ab_04-2016%29_%28cropped%29.jpg/330px-Tesla_Model_S_%28Facelift_ab_04-2016%29_%28cropped%29.jpg",
  "toyota-bz4x": "https://upload.wikimedia.org/wikipedia/commons/thumb/e/ea/Toyota_bZ4X_Automesse_Ludwigsburg_2022_1X7A5895.jpg/330px-Toyota_bZ4X_Automesse_Ludwigsburg_2022_1X7A5895.jpg",
  "vw-id-buzz": "https://upload.wikimedia.org/wikipedia/commons/thumb/4/4f/Volkswagen_ID._Buzz_1X7A6263.jpg/330px-Volkswagen_ID._Buzz_1X7A6263.jpg",
};

for (const v of vehicles) {
  if (VEHICLE_IMAGES[v.id]) v.image = VEHICLE_IMAGES[v.id];
}

export const vehicleCategories = ["Sedan", "Coupe", "SUV", "Minivan", "Truck"];

export function getVehiclesByType(type: 'ev' | 'gas') {
  return vehicles.filter(v => v.type === type);
}

export function getVehicleById(id: string) {
  return vehicles.find(v => v.id === id);
}

export function getMatchingGasVehicle(evId: string): VehicleData | undefined {
  const ev = getVehicleById(evId);
  if (!ev) return undefined;
  return vehicles.find(v => v.type === 'gas' && v.category === ev.category);
}
