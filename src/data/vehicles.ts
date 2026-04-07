import { VehicleData } from "@/lib/tco-calculator";

export const vehicles: VehicleData[] = [
  // EVs
  {
    id: "tesla-model-3",
    name: "Tesla Model 3",
    type: "ev",
    msrp: 38990,
    mpge: 132,
    kwhPer100mi: 25,
    maintenanceCostPerMile: 0.06,
    insuranceAnnual: 1920,
    depreciationRate: 0.15,
    category: "Sedan",
  },
  {
    id: "tesla-model-y",
    name: "Tesla Model Y",
    type: "ev",
    msrp: 44990,
    mpge: 123,
    kwhPer100mi: 27,
    maintenanceCostPerMile: 0.066,
    insuranceAnnual: 2040,
    depreciationRate: 0.15,
    category: "SUV",
  },
  {
    id: "chevy-equinox-ev",
    name: "Chevrolet Equinox EV",
    type: "ev",
    msrp: 33900,
    mpge: 126,
    kwhPer100mi: 27,
    maintenanceCostPerMile: 0.061,
    insuranceAnnual: 1800,
    depreciationRate: 0.18,
    category: "SUV",
  },
  {
    id: "hyundai-ioniq-5",
    name: "Hyundai IONIQ 5",
    type: "ev",
    msrp: 41800,
    mpge: 114,
    kwhPer100mi: 29,
    maintenanceCostPerMile: 0.058,
    insuranceAnnual: 1850,
    depreciationRate: 0.17,
    category: "SUV",
  },
  {
    id: "ford-mustang-mach-e",
    name: "Ford Mustang Mach-E",
    type: "ev",
    msrp: 42995,
    mpge: 100,
    kwhPer100mi: 33,
    maintenanceCostPerMile: 0.065,
    insuranceAnnual: 2100,
    depreciationRate: 0.17,
    category: "SUV",
  },
  {
    id: "kia-ev9",
    name: "Kia EV9",
    type: "ev",
    msrp: 54900,
    mpge: 95,
    kwhPer100mi: 35,
    maintenanceCostPerMile: 0.06,
    insuranceAnnual: 2150,
    depreciationRate: 0.18,
    category: "SUV",
  },
  // Gas vehicles
  {
    id: "toyota-camry",
    name: "Toyota Camry",
    type: "gas",
    msrp: 28855,
    mpg: 32,
    maintenanceCostPerMile: 0.09,
    insuranceAnnual: 1650,
    depreciationRate: 0.12,
    category: "Sedan",
  },
  {
    id: "honda-crv",
    name: "Honda CR-V",
    type: "gas",
    msrp: 30850,
    mpg: 30,
    maintenanceCostPerMile: 0.095,
    insuranceAnnual: 1750,
    depreciationRate: 0.13,
    category: "SUV",
  },
  {
    id: "toyota-rav4",
    name: "Toyota RAV4",
    type: "gas",
    msrp: 31380,
    mpg: 30,
    maintenanceCostPerMile: 0.092,
    insuranceAnnual: 1700,
    depreciationRate: 0.12,
    category: "SUV",
  },
  {
    id: "ford-f150",
    name: "Ford F-150",
    type: "gas",
    msrp: 36965,
    mpg: 23,
    maintenanceCostPerMile: 0.10,
    insuranceAnnual: 1900,
    depreciationRate: 0.14,
    category: "Truck",
  },
  {
    id: "chevy-equinox",
    name: "Chevrolet Equinox",
    type: "gas",
    msrp: 30500,
    mpg: 31,
    maintenanceCostPerMile: 0.088,
    insuranceAnnual: 1680,
    depreciationRate: 0.16,
    category: "SUV",
  },
  {
    id: "hyundai-tucson",
    name: "Hyundai Tucson",
    type: "gas",
    msrp: 30550,
    mpg: 29,
    maintenanceCostPerMile: 0.085,
    insuranceAnnual: 1720,
    depreciationRate: 0.15,
    category: "SUV",
  },
];

export const vehicleCategories = ["Sedan", "SUV", "Truck"];

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
