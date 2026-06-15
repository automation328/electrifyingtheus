// Representative residential electricity rates (¢/kWh) and regular gasoline
// prices ($/gal) by U.S. state. These are approximate statewide averages used
// to illustrate electricity-vs-gasoline operating costs — not live prices.
// Sources: EIA-style residential averages and AAA-style fuel averages.

export interface StateEnergyRate {
  name: string;
  /** Residential electricity price in cents per kWh */
  electricityCentsPerKwh: number;
  /** Regular gasoline price in dollars per gallon */
  gasPricePerGallon: number;
}

export const STATE_ENERGY_RATES: Record<string, StateEnergyRate> = {
  AL: { name: "Alabama", electricityCentsPerKwh: 14.8, gasPricePerGallon: 3.05 },
  AK: { name: "Alaska", electricityCentsPerKwh: 24.5, gasPricePerGallon: 3.95 },
  AZ: { name: "Arizona", electricityCentsPerKwh: 14.0, gasPricePerGallon: 3.45 },
  AR: { name: "Arkansas", electricityCentsPerKwh: 12.5, gasPricePerGallon: 2.95 },
  CA: { name: "California", electricityCentsPerKwh: 31.0, gasPricePerGallon: 4.80 },
  CO: { name: "Colorado", electricityCentsPerKwh: 14.5, gasPricePerGallon: 3.30 },
  CT: { name: "Connecticut", electricityCentsPerKwh: 27.5, gasPricePerGallon: 3.45 },
  DE: { name: "Delaware", electricityCentsPerKwh: 14.8, gasPricePerGallon: 3.20 },
  DC: { name: "District of Columbia", electricityCentsPerKwh: 16.0, gasPricePerGallon: 3.50 },
  FL: { name: "Florida", electricityCentsPerKwh: 14.5, gasPricePerGallon: 3.30 },
  GA: { name: "Georgia", electricityCentsPerKwh: 14.0, gasPricePerGallon: 3.10 },
  HI: { name: "Hawaii", electricityCentsPerKwh: 41.0, gasPricePerGallon: 4.70 },
  ID: { name: "Idaho", electricityCentsPerKwh: 11.0, gasPricePerGallon: 3.65 },
  IL: { name: "Illinois", electricityCentsPerKwh: 15.5, gasPricePerGallon: 3.55 },
  IN: { name: "Indiana", electricityCentsPerKwh: 15.0, gasPricePerGallon: 3.30 },
  IA: { name: "Iowa", electricityCentsPerKwh: 13.5, gasPricePerGallon: 3.05 },
  KS: { name: "Kansas", electricityCentsPerKwh: 13.8, gasPricePerGallon: 3.00 },
  KY: { name: "Kentucky", electricityCentsPerKwh: 12.8, gasPricePerGallon: 3.05 },
  LA: { name: "Louisiana", electricityCentsPerKwh: 12.0, gasPricePerGallon: 2.95 },
  ME: { name: "Maine", electricityCentsPerKwh: 23.0, gasPricePerGallon: 3.35 },
  MD: { name: "Maryland", electricityCentsPerKwh: 17.5, gasPricePerGallon: 3.35 },
  MA: { name: "Massachusetts", electricityCentsPerKwh: 29.0, gasPricePerGallon: 3.40 },
  MI: { name: "Michigan", electricityCentsPerKwh: 18.5, gasPricePerGallon: 3.35 },
  MN: { name: "Minnesota", electricityCentsPerKwh: 15.0, gasPricePerGallon: 3.15 },
  MS: { name: "Mississippi", electricityCentsPerKwh: 13.5, gasPricePerGallon: 2.90 },
  MO: { name: "Missouri", electricityCentsPerKwh: 12.8, gasPricePerGallon: 3.00 },
  MT: { name: "Montana", electricityCentsPerKwh: 12.5, gasPricePerGallon: 3.35 },
  NE: { name: "Nebraska", electricityCentsPerKwh: 11.8, gasPricePerGallon: 3.05 },
  NV: { name: "Nevada", electricityCentsPerKwh: 15.0, gasPricePerGallon: 4.10 },
  NH: { name: "New Hampshire", electricityCentsPerKwh: 23.5, gasPricePerGallon: 3.30 },
  NJ: { name: "New Jersey", electricityCentsPerKwh: 18.0, gasPricePerGallon: 3.35 },
  NM: { name: "New Mexico", electricityCentsPerKwh: 14.0, gasPricePerGallon: 3.25 },
  NY: { name: "New York", electricityCentsPerKwh: 23.0, gasPricePerGallon: 3.50 },
  NC: { name: "North Carolina", electricityCentsPerKwh: 13.5, gasPricePerGallon: 3.15 },
  ND: { name: "North Dakota", electricityCentsPerKwh: 11.0, gasPricePerGallon: 3.20 },
  OH: { name: "Ohio", electricityCentsPerKwh: 15.5, gasPricePerGallon: 3.20 },
  OK: { name: "Oklahoma", electricityCentsPerKwh: 12.0, gasPricePerGallon: 2.95 },
  OR: { name: "Oregon", electricityCentsPerKwh: 13.5, gasPricePerGallon: 4.10 },
  PA: { name: "Pennsylvania", electricityCentsPerKwh: 17.0, gasPricePerGallon: 3.45 },
  RI: { name: "Rhode Island", electricityCentsPerKwh: 28.0, gasPricePerGallon: 3.35 },
  SC: { name: "South Carolina", electricityCentsPerKwh: 14.5, gasPricePerGallon: 3.05 },
  SD: { name: "South Dakota", electricityCentsPerKwh: 12.8, gasPricePerGallon: 3.15 },
  TN: { name: "Tennessee", electricityCentsPerKwh: 12.5, gasPricePerGallon: 3.00 },
  TX: { name: "Texas", electricityCentsPerKwh: 15.0, gasPricePerGallon: 3.00 },
  UT: { name: "Utah", electricityCentsPerKwh: 11.0, gasPricePerGallon: 3.50 },
  VT: { name: "Vermont", electricityCentsPerKwh: 21.0, gasPricePerGallon: 3.35 },
  VA: { name: "Virginia", electricityCentsPerKwh: 14.5, gasPricePerGallon: 3.25 },
  WA: { name: "Washington", electricityCentsPerKwh: 11.5, gasPricePerGallon: 4.30 },
  WV: { name: "West Virginia", electricityCentsPerKwh: 14.5, gasPricePerGallon: 3.30 },
  WI: { name: "Wisconsin", electricityCentsPerKwh: 16.5, gasPricePerGallon: 3.15 },
  WY: { name: "Wyoming", electricityCentsPerKwh: 12.0, gasPricePerGallon: 3.30 },
};

/** National-average fallbacks used for class comparisons. */
// Kept in line with the per-state tables above (means: ~16.6¢/kWh, ~$3.38/gal)
// so the "U.S. average" figures match the state map and calculator fallbacks.
export const NATIONAL_AVG = {
  electricityCentsPerKwh: 16.5,
  gasPricePerGallon: 3.38,
};

export const STATE_CODES = Object.keys(STATE_ENERGY_RATES).sort((a, b) =>
  STATE_ENERGY_RATES[a].name.localeCompare(STATE_ENERGY_RATES[b].name)
);
