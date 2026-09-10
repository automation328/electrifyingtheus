// TCO Calculator Core Logic

import { NATIONAL_AVG } from "@/data/state-energy-rates";

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
  /** Carried through so compareVehicles() does not have to re-derive or assume them. */
  annualMileage: number;
  ownershipYears: number;
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
    annualMileage: inputs.annualMileage,
    ownershipYears: inputs.ownershipYears,
  };
}

export function compareVehicles(evResult: TCOResult, gasResult: TCOResult): ComparisonResult {
  const savings = gasResult.totalCostOfOwnership - evResult.totalCostOfOwnership;
  const co2Savings = gasResult.co2EmissionsTons - evResult.co2EmissionsTons;

  // Break-even calculation.
  // Annual running cost = fuel + maintenance + insurance. Maintenance is a $/mile
  // rate and insurance is a $/year figure, so they cannot be multiplied together;
  // both are taken from the totals calculateTCO already worked out correctly.
  const annualRunning = (r: TCOResult) =>
    r.annualFuelCost +
    r.totalMaintenanceCost / r.ownershipYears +
    r.totalInsuranceCost / r.ownershipYears;

  const annualSavings = annualRunning(gasResult) - annualRunning(evResult);

  // purchaseCost is already financed off the incentive-reduced price, so the
  // incentive must not be taken off a second time.
  const upfrontDifference = evResult.purchaseCost - gasResult.purchaseCost;

  // An EV that costs no more up front has already paid back; one that never
  // out-earns its premium never does.
  const paybackYears =
    upfrontDifference <= 0 ? 0 : annualSavings > 0 ? upfrontDifference / annualSavings : Infinity;

  // Break-even distance is the payback period driven at the mileage the user
  // actually entered.
  const breakEvenMiles = Number.isFinite(paybackYears)
    ? paybackYears * evResult.annualMileage
    : Infinity;

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
  // Pre-fill only. Calculator.tsx replaces this with the live per-state price on
  // mount and on every state change; it survives only if the feed is unreachable,
  // so it tracks the fallback table rather than drifting as its own literal.
  gasPricePerGallon: NATIONAL_AVG.gasPricePerGallon,
  electricityRatePerKwh: 0.14,
  financingRate: 6.5,
  downPaymentPercent: 10,
  loanTermMonths: 60,
  federalIncentive: 7500,
  stateIncentive: 2000,
  chargingLocation: 'home',
  state: 'CA',
};
