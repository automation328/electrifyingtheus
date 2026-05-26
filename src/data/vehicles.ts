import { VehicleData } from "@/lib/tco-calculator";

// Curated US catalog. Figures are representative 2026 values (MSRP, EPA
// MPG/MPGe, range) used to illustrate matching + cost — not a live feed.
// Every gas car has at least one class-matched EV substitute so the §6
// matching algorithm always has somewhere sensible to land.
export const vehicles: VehicleData[] = [
  // ───────────────────────── EVs ─────────────────────────
  // Compact sedans
  {
    id: "tesla-model-3", name: "Tesla Model 3", type: "ev", msrp: 38990,
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
    id: "hyundai-ioniq-6", name: "Hyundai IONIQ 6", type: "ev", msrp: 38650,
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
    id: "chevy-equinox-ev", name: "Chevrolet Equinox EV", type: "ev", msrp: 33900,
    mpge: 126, kwhPer100mi: 27, maintenanceCostPerMile: 0.061, insuranceAnnual: 1800,
    depreciationRate: 0.18, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "FWD", rangeMi: 319,
  },
  {
    id: "hyundai-ioniq-5", name: "Hyundai IONIQ 5", type: "ev", msrp: 41800,
    mpge: 114, kwhPer100mi: 29, maintenanceCostPerMile: 0.058, insuranceAnnual: 1850,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 303,
  },
  {
    id: "kia-ev6", name: "Kia EV6", type: "ev", msrp: 43000,
    mpge: 117, kwhPer100mi: 29, maintenanceCostPerMile: 0.059, insuranceAnnual: 1880,
    depreciationRate: 0.17, category: "SUV",
    bodyStyle: "suv-compact", sizeClass: 2, seats: 5, drivetrain: "AWD", rangeMi: 310,
  },
  {
    id: "ford-mustang-mach-e", name: "Ford Mustang Mach-E", type: "ev", msrp: 42995,
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
    id: "chevy-bolt-ev", name: "Chevrolet Bolt EV", type: "ev", msrp: 27000,
    mpge: 120, kwhPer100mi: 28, maintenanceCostPerMile: 0.057, insuranceAnnual: 1700,
    depreciationRate: 0.18, category: "Sedan",
    bodyStyle: "hatchback", sizeClass: 1, seats: 5, drivetrain: "FWD", rangeMi: 259,
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
    id: "kia-niro-ev", name: "Kia Niro EV", type: "ev", msrp: 40000,
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
    id: "toyota-bz4x", name: "Toyota bZ4X", type: "ev", msrp: 37000,
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
];

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
