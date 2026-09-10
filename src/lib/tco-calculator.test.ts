import { describe, it, expect } from 'vitest';
import { calculateTCO, compareVehicles, defaultInputs, type UserInputs, type VehicleData } from './tco-calculator';

/* Hand-built vehicles with round numbers, so every expected figure below can be
   worked out on paper rather than copied back out of the implementation. */
const ev: VehicleData = {
  id: 'test-ev',
  name: 'Test EV',
  type: 'ev',
  msrp: 50_000,
  kwhPer100mi: 30,
  maintenanceCostPerMile: 0.06,
  insuranceAnnual: 2_000,
  depreciationRate: 0.15,
  category: 'sedan',
};

const gas: VehicleData = {
  id: 'test-gas',
  name: 'Test Gas',
  type: 'gas',
  msrp: 35_000,
  mpg: 30,
  maintenanceCostPerMile: 0.10,
  insuranceAnnual: 1_600,
  depreciationRate: 0.12,
  category: 'sedan',
};

const inputs: UserInputs = {
  ...defaultInputs,
  annualMileage: 12_000,
  ownershipYears: 5,
  gasPricePerGallon: 4.00,
  electricityRatePerKwh: 0.15,
  chargingLocation: 'home',
  federalIncentive: 0,
  stateIncentive: 0,
};

const run = (i: Partial<UserInputs> = {}) =>
  compareVehicles(calculateTCO(ev, { ...inputs, ...i }), calculateTCO(gas, { ...inputs, ...i }));

describe('calculateTCO', () => {
  it('carries the inputs the comparison needs', () => {
    const r = calculateTCO(ev, inputs);
    expect(r.annualMileage).toBe(12_000);
    expect(r.ownershipYears).toBe(5);
  });

  it('computes purchase cost off the incentive-reduced price', () => {
    const withCredit = calculateTCO(ev, { ...inputs, federalIncentive: 7_500 });
    const without = calculateTCO(ev, inputs);
    expect(withCredit.totalIncentives).toBe(7_500);
    expect(withCredit.purchaseCost).toBeLessThan(without.purchaseCost);
  });
});

describe('compareVehicles — annual running cost', () => {
  it('adds maintenance and insurance rather than multiplying them', () => {
    // gas: 12,000 mi / 30 mpg x $4.00      = $1,600 fuel
    //      12,000 mi x $0.10               = $1,200 maintenance
    //                                        $1,600 insurance
    //                                      = $4,400 a year
    // ev:  12,000 mi / 100 x 30 kWh x $0.15 =   $540 fuel
    //      12,000 mi x $0.06               =   $720 maintenance
    //                                        $2,000 insurance
    //                                      = $3,260 a year
    // annual saving = $1,140. Premium is $15,000 of MSRP, financed.
    const c = run();
    const evTco = calculateTCO(ev, inputs);
    const gasTco = calculateTCO(gas, inputs);
    const annualSaving =
      (gasTco.annualFuelCost + gasTco.totalMaintenanceCost / 5 + gasTco.totalInsuranceCost / 5) -
      (evTco.annualFuelCost + evTco.totalMaintenanceCost / 5 + evTco.totalInsuranceCost / 5);
    expect(annualSaving).toBeCloseTo(1_140, 6);

    // the old defect multiplied a $/mile rate by a $/year figure, which put the
    // gas running cost near $1,760 and made payback roughly seven times too fast
    const bogus =
      (gasTco.annualFuelCost + gas.maintenanceCostPerMile * gas.insuranceAnnual) -
      (evTco.annualFuelCost + ev.maintenanceCostPerMile * ev.insuranceAnnual);
    expect(bogus).not.toBeCloseTo(annualSaving, 0);

    const expected = (evTco.purchaseCost - gasTco.purchaseCost) / annualSaving;
    expect(c.paybackYears).toBeCloseTo(expected, 6);
  });
});

describe('compareVehicles — incentives', () => {
  it('does not subtract the incentive twice', () => {
    const withCredit = run({ federalIncentive: 7_500, stateIncentive: 2_000 });
    const evTco = calculateTCO(ev, { ...inputs, federalIncentive: 7_500, stateIncentive: 2_000 });
    const gasTco = calculateTCO(gas, { ...inputs, federalIncentive: 7_500, stateIncentive: 2_000 });

    // purchaseCost is already financed off msrp - incentives
    const upfront = evTco.purchaseCost - gasTco.purchaseCost;
    expect(upfront).toBeGreaterThan(0);

    const annual =
      (gasTco.annualFuelCost + gasTco.totalMaintenanceCost / 5 + gasTco.totalInsuranceCost / 5) -
      (evTco.annualFuelCost + evTco.totalMaintenanceCost / 5 + evTco.totalInsuranceCost / 5);
    expect(withCredit.paybackYears).toBeCloseTo(upfront / annual, 6);

    // taking the credit off again would have shortened payback, not lengthened it
    const doubleCounted = (upfront - 9_500) / annual;
    expect(withCredit.paybackYears).toBeGreaterThan(doubleCounted);
  });

  it('reports immediate payback when the EV is not dearer up front', () => {
    const c = run({ federalIncentive: 20_000, stateIncentive: 5_000 });
    expect(c.paybackYears).toBe(0);
    expect(c.breakEvenMiles).toBe(0);
  });
});

describe('compareVehicles — break-even distance', () => {
  it('uses the mileage the user entered, not a hardcoded 12,000', () => {
    const at20k = run({ annualMileage: 20_000 });
    expect(at20k.breakEvenMiles).toBeCloseTo(at20k.paybackYears * 20_000, 6);

    const at8k = run({ annualMileage: 8_000 });
    expect(at8k.breakEvenMiles).toBeCloseTo(at8k.paybackYears * 8_000, 6);
  });

  it('stays finite, or reports no break-even at all', () => {
    // an EV that costs more to run never pays back
    const thirsty: VehicleData = { ...ev, kwhPer100mi: 200, maintenanceCostPerMile: 0.5 };
    const c = compareVehicles(calculateTCO(thirsty, inputs), calculateTCO(gas, inputs));
    expect(c.paybackYears).toBe(Infinity);
    expect(Number.isFinite(c.breakEvenMiles)).toBe(false);
  });
});

describe('compareVehicles — totals still agree', () => {
  it('savings equals the difference of the two ownership totals', () => {
    const c = run();
    expect(c.savingsOverOwnership).toBeCloseTo(
      c.gas.totalCostOfOwnership - c.ev.totalCostOfOwnership, 6);
  });

  it('picks a winner consistent with the savings sign', () => {
    const c = run();
    if (Math.abs(c.savingsOverOwnership) < 500) expect(c.winner).toBe('tie');
    else expect(c.winner).toBe(c.savingsOverOwnership > 0 ? 'ev' : 'gas');
  });
});
