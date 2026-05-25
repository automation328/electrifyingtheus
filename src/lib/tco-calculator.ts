// TCO Calculator Core Logic

/** Coarse body styles used for class matching (spec §6). */
export type BodyStyle =
  | "sedan" | "hatchback" | "coupe"
  | "suv-compact" | "suv-mid" | "suv-large"
  | "minivan" | "truck";

export type Drivetrain = "FWD" | "RWD" | "AWD" | "4WD";

export interface VehicleData {
  id: string;
  name: string;
  type: 'ev' | 'gas';
  msrp: number;
  mpg?: number; // gas vehicles
  mpge?: number; // EVs - miles per gallon equivalent
  kwhPer100mi?: number; // EVs
  maintenanceCostPerMile: number;
  insuranceAnnual: number;
  depreciationRate: number; // annual depreciation %
  category: string;
  image?: string;

  // ── Class-matching attributes (spec §6 "Vehicle Matching Logic") ──
  bodyStyle?: BodyStyle;
  /** EPA-style size rank, 1 (subcompact) … 4 (full-size / 3-row / full truck). */
  sizeClass?: number;
  seats?: number;
  drivetrain?: Drivetrain;
  /** EPA range in miles (EVs). Used for the value score. */
  rangeMi?: number;
  /** Positioning flags that steer matching for enthusiast / premium shoppers. */
  performance?: boolean;
  luxury?: boolean;
}

export interface UserInputs {
  annualMileage: number;
  ownershipYears: number;
  gasPricePerGallon: number;
  electricityRatePerKwh: number;
  financingRate: number; // APR %
  downPaymentPercent: number;
  loanTermMonths: number;
  federalIncentive: number;
  stateIncentive: number;
  chargingLocation: 'home' | 'public' | 'mixed';
  state: string;
}

export interface TCOResult {
  vehicle: VehicleData;
  purchaseCost: number;
  totalFuelCost: number;
  totalMaintenanceCost: number;
  totalInsuranceCost: number;
  totalIncentives: number;
  residualValue: number;
  totalCostOfOwnership: number;
  costPerMile: number;
  monthlyPayment: number;
  annualFuelCost: number;
  co2EmissionsTons: number;
}

export interface ComparisonResult {
  ev: TCOResult;
  gas: TCOResult;
  savingsOverOwnership: number;
  breakEvenMiles: number;
  paybackYears: number;
  co2SavingsTons: number;
  winner: 'ev' | 'gas' | 'tie';
  confidenceLevel: 'high' | 'medium' | 'low';
}

const CO2_PER_GALLON = 0.00887; // metric tons per gallon
const CO2_PER_KWH = 0.000386; // metric tons per kWh (US average grid)
const PUBLIC_CHARGING_PREMIUM = 1.6; // public charging costs ~60% more

export function calculateMonthlyPayment(
  principal: number,
  annualRate: number,
  termMonths: number
): number {
  if (annualRate === 0) return principal / termMonths;
  const monthlyRate = annualRate / 100 / 12;
  return (principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths)) /
    (Math.pow(1 + monthlyRate, termMonths) - 1);
}

export function calculateTCO(vehicle: VehicleData, inputs: UserInputs): TCOResult {
  const totalMiles = inputs.annualMileage * inputs.ownershipYears;

  // Purchase cost after incentives
  const incentives = vehicle.type === 'ev'
    ? inputs.federalIncentive + inputs.stateIncentive
    : 0;
  const effectivePrice = vehicle.msrp - incentives;
  const downPayment = effectivePrice * (inputs.downPaymentPercent / 100);
  const loanAmount = effectivePrice - downPayment;
  const monthlyPayment = calculateMonthlyPayment(loanAmount, inputs.financingRate, inputs.loanTermMonths);
  const totalFinancingCost = (monthlyPayment * inputs.loanTermMonths) + downPayment;

  // Fuel cost
  let annualFuelCost: number;
  if (vehicle.type === 'ev' && vehicle.kwhPer100mi) {
    let effectiveRate = inputs.electricityRatePerKwh;
    if (inputs.chargingLocation === 'public') effectiveRate *= PUBLIC_CHARGING_PREMIUM;
    else if (inputs.chargingLocation === 'mixed') effectiveRate *= (1 + PUBLIC_CHARGING_PREMIUM) / 2;
    annualFuelCost = (inputs.annualMileage / 100) * vehicle.kwhPer100mi * effectiveRate;
  } else if (vehicle.mpg) {
    annualFuelCost = (inputs.annualMileage / vehicle.mpg) * inputs.gasPricePerGallon;
  } else {
    annualFuelCost = 0;
  }
  const totalFuelCost = annualFuelCost * inputs.ownershipYears;

  // Maintenance
  const totalMaintenanceCost = vehicle.maintenanceCostPerMile * totalMiles;

  // Insurance
  const totalInsuranceCost = vehicle.insuranceAnnual * inputs.ownershipYears;

  // Depreciation / residual value
  let residualValue = vehicle.msrp;
  for (let i = 0; i < inputs.ownershipYears; i++) {
    residualValue *= (1 - vehicle.depreciationRate);
  }

  // CO2 emissions
  let co2EmissionsTons: number;
  if (vehicle.type === 'ev' && vehicle.kwhPer100mi) {
    const totalKwh = (totalMiles / 100) * vehicle.kwhPer100mi;
    co2EmissionsTons = totalKwh * CO2_PER_KWH;
  } else if (vehicle.mpg) {
    const totalGallons = totalMiles / vehicle.mpg;
    co2EmissionsTons = totalGallons * CO2_PER_GALLON;
  } else {
    co2EmissionsTons = 0;
  }

  const totalCostOfOwnership = totalFinancingCost + totalFuelCost + totalMaintenanceCost + totalInsuranceCost - residualValue;

  return {
    vehicle,
    purchaseCost: totalFinancingCost,
    totalFuelCost,
    totalMaintenanceCost,
    totalInsuranceCost,
    totalIncentives: incentives,
    residualValue,
    totalCostOfOwnership,
    costPerMile: totalCostOfOwnership / totalMiles,
    monthlyPayment,
    annualFuelCost,
    co2EmissionsTons,
  };
}

export function compareVehicles(evResult: TCOResult, gasResult: TCOResult): ComparisonResult {
  const savings = gasResult.totalCostOfOwnership - evResult.totalCostOfOwnership;
  const co2Savings = gasResult.co2EmissionsTons - evResult.co2EmissionsTons;

  // Break-even calculation
  const annualEvCost = evResult.annualFuelCost + (evResult.vehicle.maintenanceCostPerMile * evResult.vehicle.insuranceAnnual);
  const annualGasCost = gasResult.annualFuelCost + (gasResult.vehicle.maintenanceCostPerMile * gasResult.vehicle.insuranceAnnual);
  const annualSavings = annualGasCost - annualEvCost;
  const upfrontDifference = evResult.purchaseCost - evResult.totalIncentives - gasResult.purchaseCost;
  const paybackYears = annualSavings > 0 ? upfrontDifference / annualSavings : Infinity;
  const breakEvenMiles = paybackYears * (evResult.vehicle.kwhPer100mi ? 12000 : 12000);

  let winner: 'ev' | 'gas' | 'tie';
  if (Math.abs(savings) < 500) winner = 'tie';
  else winner = savings > 0 ? 'ev' : 'gas';

  return {
    ev: evResult,
    gas: gasResult,
    savingsOverOwnership: savings,
    breakEvenMiles: Math.max(0, breakEvenMiles),
    paybackYears: Math.max(0, paybackYears),
    co2SavingsTons: co2Savings,
    winner,
    confidenceLevel: 'medium',
  };
}

export const defaultInputs: UserInputs = {
  annualMileage: 12000,
  ownershipYears: 5,
  gasPricePerGallon: 3.50,
  electricityRatePerKwh: 0.14,
  financingRate: 6.5,
  downPaymentPercent: 10,
  loanTermMonths: 60,
  federalIncentive: 7500,
  stateIncentive: 2000,
  chargingLocation: 'home',
  state: 'CA',
};
