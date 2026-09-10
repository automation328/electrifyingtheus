// Residential electricity rates (¢/kWh) and regular gasoline prices ($/gal) by
// U.S. state. This is the FALLBACK table: pages prefer the live AAA feed via
// useGasPrices() and only land here when that feed is unreachable, so these
// figures must stay close to live or every calculator quietly understates.
//
// Gasoline re-baselined 2026-09-10 from the same AAA feed the site serves live
// (n8n /gas-prices, regular, all 51). It had drifted ~22% low, which pushed the
// national figure to $3.38 while real prices sat at $4.30.
// Electricity rates are EIA-style residential averages and were NOT re-baselined.
//
// Do not hand-edit the gasoline numbers. Re-baseline them with:
//   npm run gas:refresh     (rewrites this table + the stamp below)
//   npm run gas:check       (reports drift, exits 1 past the threshold)

/** Date the gasoline figures below were pulled. Maintained by gas:refresh. */
export const GAS_PRICES_AS_OF = "2026-09-10";

export interface StateEnergyRate {
  name: string;
  /** Residential electricity price in cents per kWh */
  electricityCentsPerKwh: number;
  /** Regular gasoline price in dollars per gallon */
  gasPricePerGallon: number;
}

export const STATE_ENERGY_RATES: Record<string, StateEnergyRate> = {
  AL: { name: "Alabama", electricityCentsPerKwh: 14.8, gasPricePerGallon: 3.87 },
  AK: { name: "Alaska", electricityCentsPerKwh: 24.5, gasPricePerGallon: 5.05 },
  AZ: { name: "Arizona", electricityCentsPerKwh: 14.0, gasPricePerGallon: 4.57 },
  AR: { name: "Arkansas", electricityCentsPerKwh: 12.5, gasPricePerGallon: 3.92 },
  CA: { name: "California", electricityCentsPerKwh: 31.0, gasPricePerGallon: 5.90 },
  CO: { name: "Colorado", electricityCentsPerKwh: 14.5, gasPricePerGallon: 4.36 },
  CT: { name: "Connecticut", electricityCentsPerKwh: 27.5, gasPricePerGallon: 4.37 },
  DE: { name: "Delaware", electricityCentsPerKwh: 14.8, gasPricePerGallon: 4.33 },
  DC: { name: "District of Columbia", electricityCentsPerKwh: 16.0, gasPricePerGallon: 4.25 },
  FL: { name: "Florida", electricityCentsPerKwh: 14.5, gasPricePerGallon: 4.15 },
  GA: { name: "Georgia", electricityCentsPerKwh: 14.0, gasPricePerGallon: 3.96 },
  HI: { name: "Hawaii", electricityCentsPerKwh: 41.0, gasPricePerGallon: 5.40 },
  ID: { name: "Idaho", electricityCentsPerKwh: 11.0, gasPricePerGallon: 4.76 },
  IL: { name: "Illinois", electricityCentsPerKwh: 15.5, gasPricePerGallon: 4.49 },
  IN: { name: "Indiana", electricityCentsPerKwh: 15.0, gasPricePerGallon: 3.56 },
  IA: { name: "Iowa", electricityCentsPerKwh: 13.5, gasPricePerGallon: 4.14 },
  KS: { name: "Kansas", electricityCentsPerKwh: 13.8, gasPricePerGallon: 3.85 },
  KY: { name: "Kentucky", electricityCentsPerKwh: 12.8, gasPricePerGallon: 3.97 },
  LA: { name: "Louisiana", electricityCentsPerKwh: 12.0, gasPricePerGallon: 3.85 },
  ME: { name: "Maine", electricityCentsPerKwh: 23.0, gasPricePerGallon: 4.25 },
  MD: { name: "Maryland", electricityCentsPerKwh: 17.5, gasPricePerGallon: 4.17 },
  MA: { name: "Massachusetts", electricityCentsPerKwh: 29.0, gasPricePerGallon: 4.26 },
  MI: { name: "Michigan", electricityCentsPerKwh: 18.5, gasPricePerGallon: 4.31 },
  MN: { name: "Minnesota", electricityCentsPerKwh: 15.0, gasPricePerGallon: 4.21 },
  MS: { name: "Mississippi", electricityCentsPerKwh: 13.5, gasPricePerGallon: 3.80 },
  MO: { name: "Missouri", electricityCentsPerKwh: 12.8, gasPricePerGallon: 3.94 },
  MT: { name: "Montana", electricityCentsPerKwh: 12.5, gasPricePerGallon: 4.43 },
  NE: { name: "Nebraska", electricityCentsPerKwh: 11.8, gasPricePerGallon: 4.09 },
  NV: { name: "Nevada", electricityCentsPerKwh: 15.0, gasPricePerGallon: 5.01 },
  NH: { name: "New Hampshire", electricityCentsPerKwh: 23.5, gasPricePerGallon: 4.20 },
  NJ: { name: "New Jersey", electricityCentsPerKwh: 18.0, gasPricePerGallon: 4.37 },
  NM: { name: "New Mexico", electricityCentsPerKwh: 14.0, gasPricePerGallon: 4.31 },
  NY: { name: "New York", electricityCentsPerKwh: 23.0, gasPricePerGallon: 4.35 },
  NC: { name: "North Carolina", electricityCentsPerKwh: 13.5, gasPricePerGallon: 3.95 },
  ND: { name: "North Dakota", electricityCentsPerKwh: 11.0, gasPricePerGallon: 4.10 },
  OH: { name: "Ohio", electricityCentsPerKwh: 15.5, gasPricePerGallon: 4.18 },
  OK: { name: "Oklahoma", electricityCentsPerKwh: 12.0, gasPricePerGallon: 3.87 },
  OR: { name: "Oregon", electricityCentsPerKwh: 13.5, gasPricePerGallon: 5.07 },
  PA: { name: "Pennsylvania", electricityCentsPerKwh: 17.0, gasPricePerGallon: 4.45 },
  RI: { name: "Rhode Island", electricityCentsPerKwh: 28.0, gasPricePerGallon: 4.30 },
  SC: { name: "South Carolina", electricityCentsPerKwh: 14.5, gasPricePerGallon: 3.90 },
  SD: { name: "South Dakota", electricityCentsPerKwh: 12.8, gasPricePerGallon: 4.13 },
  TN: { name: "Tennessee", electricityCentsPerKwh: 12.5, gasPricePerGallon: 3.89 },
  TX: { name: "Texas", electricityCentsPerKwh: 15.0, gasPricePerGallon: 3.83 },
  UT: { name: "Utah", electricityCentsPerKwh: 11.0, gasPricePerGallon: 4.69 },
  VT: { name: "Vermont", electricityCentsPerKwh: 21.0, gasPricePerGallon: 4.32 },
  VA: { name: "Virginia", electricityCentsPerKwh: 14.5, gasPricePerGallon: 4.10 },
  WA: { name: "Washington", electricityCentsPerKwh: 11.5, gasPricePerGallon: 5.54 },
  WV: { name: "West Virginia", electricityCentsPerKwh: 14.5, gasPricePerGallon: 4.09 },
  WI: { name: "Wisconsin", electricityCentsPerKwh: 16.5, gasPricePerGallon: 4.01 },
  WY: { name: "Wyoming", electricityCentsPerKwh: 12.0, gasPricePerGallon: 4.44 },
};

/** National-average fallbacks used for class comparisons. */
export const NATIONAL_AVG = {
  electricityCentsPerKwh: 16.5,
  // Derived from the table above rather than written by hand: re-baselining the
  // states used to leave this literal behind, which is how the site ended up
  // quoting a $3.38 national average against $4.30 real prices.
  gasPricePerGallon:
    Math.round(
      (Object.values(STATE_ENERGY_RATES).reduce((sum, r) => sum + r.gasPricePerGallon, 0) /
        Object.keys(STATE_ENERGY_RATES).length) * 100
    ) / 100,
};

export const STATE_CODES = Object.keys(STATE_ENERGY_RATES).sort((a, b) =>
  STATE_ENERGY_RATES[a].name.localeCompare(STATE_ENERGY_RATES[b].name)
);

/**
 * USPS code → static gasoline price, shaped like the live feed's `prices` map so
 * the same helpers run over either. Used when the gas-price feed is unavailable.
 */
export const STATIC_GAS_PRICES: Record<string, number> = Object.fromEntries(
  Object.entries(STATE_ENERGY_RATES).map(([code, rate]) => [code, rate.gasPricePerGallon])
);
