// VIN decoding.
//
// The fixtures below are real NHTSA vPIC responses, trimmed to the fields we read.
// They were captured on 20 Aug 2026 from the live service, so the shapes and the
// quirks are genuine — including the ones that matter:
//
//   • a Zero motorcycle decodes with a Body Class but NO electrification level
//   • a Prius Prime is the only one of the four that returns a battery capacity
//   • a check-digit warning (Error Code 1) still carries perfectly good make/model
//
// Every network failure must degrade to null, never throw, because a decode is an
// accelerator and the checker has to keep working when NHTSA does not.

import { describe, it, expect, vi, afterEach } from "vitest";
import {
  decodeVin, isPlausibleVin, vinToAnswers, referenceYearFor, describeFacts,
  type VinFacts,
} from "@/lib/eligibility/vin";

const row = (Variable: string, Value: string | null) => ({ Variable, Value });

const TESLA = [
  row("Error Code", "0"), row("Make", "TESLA"), row("Model", "Model 3"),
  row("Model Year", "2018"), row("Fuel Type - Primary", "Electric"),
  row("Electrification Level", "BEV (Battery Electric Vehicle)"),
  row("Body Class", "Sedan/Saloon"),
];

const PRIUS_PRIME = [
  row("Error Code", "1"), row("Make", "TOYOTA"), row("Model", "Prius Prime (PHEV)"),
  row("Model Year", "2017"), row("Fuel Type - Primary", "Electric"),
  row("Electrification Level", "PHEV (Plug-in Hybrid Electric Vehicle)"),
  row("Battery Energy (kWh) From", "8.80"), row("Battery Energy (kWh) To", "8.80"),
  row("Body Class", "Sedan/Saloon"),
];

const ZERO_MOTORCYCLE = [
  row("Error Code", "1,5,14"), row("Make", "ZERO MOTORCYCLES"), row("Model", "S"),
  row("Model Year", "2017"), row("Body Class", "Motorcycle - Street"),
  row("Fuel Type - Primary", null), row("Electrification Level", null),
];

const NONSENSE = [row("Error Code", "1,7,11,400"), row("Make", null), row("Model Year", null)];

const mockFetch = (Results: unknown[], ok = true) => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
    ok, json: () => Promise.resolve({ Results }),
  }));
};

afterEach(() => vi.unstubAllGlobals());

/* ── VIN shape ──────────────────────────────────────────────────────────── */

describe("isPlausibleVin", () => {
  it("accepts a real 17-character VIN", () => {
    expect(isPlausibleVin("5YJ3E1EA8JF000000")).toBe(true);
    expect(isPlausibleVin("  5yj3e1ea8jf000000  ")).toBe(true);
  });

  it("rejects anything that is not 17 characters", () => {
    expect(isPlausibleVin("5YJ3E1EA8JF00000")).toBe(false);
    expect(isPlausibleVin("5YJ3E1EA8JF0000000")).toBe(false);
    expect(isPlausibleVin("")).toBe(false);
  });

  it("rejects I, O and Q — excluded from VINs to avoid confusion with 1 and 0", () => {
    expect(isPlausibleVin("IYJ3E1EA8JF000000")).toBe(false);
    expect(isPlausibleVin("OYJ3E1EA8JF000000")).toBe(false);
    expect(isPlausibleVin("QYJ3E1EA8JF000000")).toBe(false);
  });

  it("does not call the network for a malformed VIN", async () => {
    const spy = vi.fn();
    vi.stubGlobal("fetch", spy);
    expect(await decodeVin("nope")).toBeNull();
    expect(spy).not.toHaveBeenCalled();
  });
});

/* ── decoding ───────────────────────────────────────────────────────────── */

describe("decodeVin", () => {
  it("reads a battery electric vehicle", async () => {
    mockFetch(TESLA);
    const f = await decodeVin("5YJ3E1EA8JF000000");
    expect(f?.fuel).toBe("bev");
    expect(f?.modelYear).toBe(2018);
    expect(f?.label).toBe("2018 TESLA Model 3");
    expect(f?.errorCode).toBe("0");
  });

  it("reads a plug-in hybrid, with its battery capacity", async () => {
    mockFetch(PRIUS_PRIME);
    const f = await decodeVin("JTDKARFP0H3000000");
    expect(f?.fuel).toBe("phev");
    expect(f?.batteryKwh).toBe(8.8);
  });

  it("keeps a decode whose only complaint is the check digit", async () => {
    // Error Code 1 is a check-digit warning. The make, model and year are still right,
    // and refusing them would reject correctly-typed VINs from certain manufacturers.
    mockFetch(PRIUS_PRIME);
    expect(await decodeVin("JTDKARFP0H3000000")).not.toBeNull();
  });

  it("refuses a VIN vPIC reports as invalid characters (error 400)", async () => {
    mockFetch(NONSENSE);
    expect(await decodeVin("ZZZZZZZZZZZZZZZZZ")).toBeNull();
  });

  it("will not claim a motorcycle is zero-emission without evidence", async () => {
    // vPIC gives Body Class but no electrification for this record. Oregon's $375
    // category is for ZERO-emission motorcycles, so guessing would be inventing an
    // eligibility fact. Leave it null and let the reader answer.
    mockFetch(ZERO_MOTORCYCLE);
    const f = await decodeVin("538SMBZ76HCK00000");
    expect(f).not.toBeNull();
    expect(f?.fuel).toBeNull();
    expect(f?.modelYear).toBe(2017);
  });

  it("reads an electric motorcycle as zem when the record says electric", async () => {
    mockFetch([...ZERO_MOTORCYCLE.filter((r) => r.Variable !== "Fuel Type - Primary"),
               row("Fuel Type - Primary", "Electric")]);
    const f = await decodeVin("538SMBZ76HCK00000");
    expect(f?.fuel).toBe("zem");
  });

  it("returns null rather than throwing when the network fails", async () => {
    vi.stubGlobal("fetch", vi.fn().mockRejectedValue(new Error("offline")));
    await expect(decodeVin("5YJ3E1EA8JF000000")).resolves.toBeNull();
  });

  it("returns null on a non-200 response", async () => {
    mockFetch(TESLA, false);
    expect(await decodeVin("5YJ3E1EA8JF000000")).toBeNull();
  });

  it("returns null on malformed JSON", async () => {
    vi.stubGlobal("fetch", vi.fn().mockResolvedValue({
      ok: true, json: () => Promise.reject(new Error("bad json")),
    }));
    expect(await decodeVin("5YJ3E1EA8JF000000")).toBeNull();
  });

  it("returns null when the response carries nothing identifying", async () => {
    mockFetch([row("Error Code", "0")]);
    expect(await decodeVin("5YJ3E1EA8JF000000")).toBeNull();
  });
});

/* ── mapping to answers ─────────────────────────────────────────────────── */

const facts = (over: Partial<VinFacts> = {}): VinFacts => ({
  vin: "5YJ3E1EA8JF000000", label: "2018 TESLA Model 3",
  fuel: "bev", modelYear: 2018, batteryKwh: null, errorCode: "0", ...over,
});

describe("vinToAnswers", () => {
  it("fills only what the decode actually established", () => {
    expect(vinToAnswers(facts({ fuel: null, modelYear: null, batteryKwh: null }), 2026)).toEqual({});
  });

  it("settles Delaware's eight-model-year rule", () => {
    expect(vinToAnswers(facts({ modelYear: 2018 }), 2026).modelYear).toBe("within8");
    expect(vinToAnswers(facts({ modelYear: 2017 }), 2026).modelYear).toBe("older");
  });

  it("measures the age limit from the purchase year, not from today", () => {
    // A 2017 car bought in 2024 was inside the limit then, even though it is outside
    // it now. Delaware's rule runs from the purchase.
    expect(vinToAnswers(facts({ modelYear: 2017 }), 2024).modelYear).toBe("within8");
    expect(vinToAnswers(facts({ modelYear: 2017 }), 2026).modelYear).toBe("older");
  });

  it("settles Oregon's 10 kWh band", () => {
    expect(vinToAnswers(facts({ batteryKwh: 8.8 }), 2026).batteryBand).toBe("under10");
    expect(vinToAnswers(facts({ batteryKwh: 10 }), 2026).batteryBand).toBe("over10");
    expect(vinToAnswers(facts({ batteryKwh: 75 }), 2026).batteryBand).toBe("over10");
  });

  it("says nothing about the battery band when no capacity came back", () => {
    // The common case — Tesla, Leaf and Volt all decode without a capacity figure.
    expect(vinToAnswers(facts({ batteryKwh: null }), 2026).batteryBand).toBeUndefined();
  });
});

describe("referenceYearFor", () => {
  it("uses the purchase year when there is one", () => {
    expect(referenceYearFor("2024-06-01")).toBe(2024);
  });
  it("falls back to the current year", () => {
    expect(referenceYearFor(null)).toBe(new Date().getFullYear());
    expect(referenceYearFor("not a date")).toBe(new Date().getFullYear());
  });
});

describe("describeFacts", () => {
  it("says what was established, in plain words", () => {
    expect(describeFacts(facts())).toBe("2018 TESLA Model 3 · battery electric");
    expect(describeFacts(facts({ fuel: "phev", batteryKwh: 8.8 })))
      .toBe("2018 TESLA Model 3 · plug-in hybrid · 8.8 kWh battery");
  });
  it("falls back to the label alone when nothing else is known", () => {
    expect(describeFacts(facts({ fuel: null }))).toBe("2018 TESLA Model 3");
  });
});
