// Rebate eligibility rules — the engine behind /rebate-eligibility.
//
// WHAT THIS IS, AND WHAT IT IS NOT
// This is a PRE-SCREENING. It reads published program rules and tells someone
// what stands between them and a rebate. It is not an application, it never
// collects a document, and its figures are estimates the administrator can
// override on review.
//
// WHY THE RULES LIVE IN CODE, NOT IN site_incentives
// The incentives table is a directory: `amount` is free text ("Up to $12,000"),
// `income` and `used` are booleans. That is the right shape for a browsable
// list and the wrong shape for arithmetic. These rules are versioned, diffable
// and covered by rules.test.ts, which is what you want for anything that prints
// a dollar figure at someone about to spend $40,000.
//
// PROVENANCE
// The Oregon block is transcribed from that program's own production bundle
// (the object mounted at #rebate-calculator on evrebate.oregon.gov). Delaware
// and PG&E come from published program prose, which is a weaker source — the
// comments say which is which, because they are not the same confidence.
//
// THREE INVARIANTS, ENFORCED BY TESTS
//   1. Never sums. `bestAmount` is always one program's figure.
//   2. Time-aware. A hard stop suppresses the amount rather than caveating it.
//   3. Refuses impossible questions. See oregonAmount().
//
// DATES ARE ISO STRINGS, NEVER Date OBJECTS — same discipline as
// incentive-window.ts, and for the same reason: `new Date("2026-11-04")` is UTC
// midnight, which ends a program a day early for every reader in the Americas.

import { formatIsoDate, isoDaysAgo, todayIso } from "@/lib/incentive-window";
import { zipToState } from "@/lib/zip-to-state";

/** The day these rules were last checked against their source. Mirrors the
 *  `verified_at` column migration 0014 added to site_incentives — same idea,
 *  applied to logic instead of to a row. */
export const RULES_VERIFIED_AT = "2026-08-19";

/** States we model in detail. Everywhere else gets the coverage-gap path, which
 *  says "we don't track your area" rather than "you don't qualify". */
export const COVERED_STATES = ["OR", "DE", "CA"] as const;
export type CoveredState = (typeof COVERED_STATES)[number];

const ISO = /^\d{4}-\d{2}-\d{2}$/;

/** Whole days from `a` to `b`. Negative when `b` is in the past. Built on the
 *  same UTC framing as isoDaysAgo — both inputs are plain calendar dates, so
 *  UTC is just a fixed frame to count in. */
export function daysBetween(a: string, b: string): number {
  if (!ISO.test(a) || !ISO.test(b)) return 0;
  const [ay, am, ad] = a.split("-").map(Number);
  const [by, bm, bd] = b.split("-").map(Number);
  return Math.round((Date.UTC(by, bm - 1, bd) - Date.UTC(ay, am - 1, ad)) / 86_400_000);
}

/** Forward counterpart of isoDaysAgo, which already handles the arithmetic. */
export const addIsoDays = (iso: string, days: number): string => isoDaysAgo(iso, -days);

export const formatMoney = (n: number): string => `$${Math.round(n).toLocaleString("en-US")}`;

/* ── answers ─────────────────────────────────────────────────────────────── */

export type Timing = "bought" | "soon" | "looking";
export type Condition = "new" | "used";
export type Fuel = "bev" | "phev" | "zem";
export type BatteryBand = "over10" | "under10" | "unknown";
export type ModelYearBand = "within8" | "older" | "unknown";
export type Applicant = "individual" | "entity";
export type Utility = "pge" | "other";
export type IncomeBand = "assistance" | "under" | "over" | "skip";
export type YesNo = "yes" | "no";
export type PriorClaims = "none" | "one" | "more";

export interface Answers {
  zip: string;
  timing: Timing | null;
  purchaseDate: string;
  condition: Condition | null;
  fuel: Fuel | null;
  batteryBand: BatteryBand | null;
  price: number | null;
  modelYear: ModelYearBand | null;
  applicant: Applicant | null;
  utility: Utility | null;
  income: IncomeBand | null;
  dependent: YesNo | null;
  priorCalifornia: YesNo | null;
  priorClaims: PriorClaims | null;
  /** Derived from `zip` inside evaluate(); never set by the UI. */
  state?: string | null;
}

export const EMPTY_ANSWERS: Answers = {
  zip: "", timing: null, purchaseDate: "", condition: null, fuel: null,
  batteryBand: null, price: null, modelYear: null, applicant: null,
  utility: null, income: null, dependent: null, priorCalifornia: null,
  priorClaims: null, state: null,
};

/* ── documents ───────────────────────────────────────────────────────────────
   Identical across all three administrators, because all three programs are
   run by the same operator on one Salesforce org. The merge rule is the one
   that actually trips people up, so it always renders last.                  */

export interface DocumentItem { what: string; note: string }

const DOC_CORE: DocumentItem[] = [
  { what: "Your driver licence, issued by this state and unexpired",
    note: "State ID cards and out-of-state licences are rejected outright." },
  { what: "The full purchase or lease agreement",
    note: "Every page. Not just the page you signed." },
  { what: "The vehicle registration card",
    note: "Temporary registrations are accepted." },
];

const DOC_INCOME_CATEGORICAL: DocumentItem[] = [
  { what: "The award letter for your assistance program",
    note: "Dated within the last 12 months. Membership or benefit cards are not accepted." },
];

const DOC_INCOME_VERIFIED: DocumentItem[] = [
  { what: "IRS Form 4506-C for every household member aged 18 or over",
    note: "Not just you. Every adult in the household, each on their own form." },
  { what: "The program's Household Income Summary Form",
    note: "They send this to you during the application." },
];

const DOC_UPLOAD_RULE: DocumentItem = {
  what: "Each document merged into a single file before upload",
  note: "PDF, JPG, JPEG, PNG, DOC or DOCX. A multi-page agreement uploaded as separate photos is rejected — you have to merge it yourself.",
};

/* ── programs ────────────────────────────────────────────────────────────── */

export interface Prerequisite { what: string; why: string; url?: string }

export interface Program {
  id: string;
  name: string;
  short: string;
  administrator: string;
  url: string;
  state: CoveredState;
  /** Programs sharing a group are mutually exclusive — claim one, not both. */
  exclusiveGroup?: string;
  purchaseWindow?: { open: string; close: string };
  applyDays?: number;
  /** Inner timer: once the application is started, this long to finish it. */
  completeDays?: number;
  /** A dated change in the rules themselves, not a deadline for the applicant. */
  ruleChange?: { on: string; what: string };
  incomeQualified?: boolean;
  individualsOnly?: boolean;
  minLeaseMonths?: number;
  prerequisites: Prerequisite[];
  documents: DocumentItem[];
  afterAward?: string;
  lifetimeCap?: { perPerson: number; text: string };
  fundingNote?: string;
}

export const PROGRAMS: Record<string, Program> = {
  "or-standard": {
    id: "or-standard",
    name: "Oregon Clean Vehicle Rebate — Standard",
    short: "Oregon Standard",
    administrator: "Oregon DEQ, administered by the Center for Sustainable Energy",
    url: "https://evrebate.oregon.gov/eligibility-guidelines",
    state: "OR",
    exclusiveGroup: "oregon",
    purchaseWindow: { open: "2026-08-25", close: "2026-11-04" },
    applyDays: 183,
    prerequisites: [],
    documents: DOC_CORE,
    afterAward: "Keep the vehicle registered in Oregon for 24 months. Organizations also file annual eVMT reports for two years.",
    lifetimeCap: { perPerson: 2, text: "Two rebates per person for life. Organizations: ten vehicles per calendar year." },
    fundingNote: "Oregon waitlists applicants once the year's funding is exhausted. Eligible is not the same as funded.",
  },

  "or-charge-ahead": {
    id: "or-charge-ahead",
    name: "Oregon Charge Ahead",
    short: "Charge Ahead",
    administrator: "Oregon DEQ, administered by the Center for Sustainable Energy",
    url: "https://evrebate.oregon.gov/eligibility-guidelines",
    state: "OR",
    exclusiveGroup: "oregon",
    purchaseWindow: { open: "2026-08-25", close: "2026-11-04" },
    applyDays: 183,
    incomeQualified: true,
    prerequisites: [
      { what: "Get a Charge Ahead prequalification voucher from DEQ",
        why: "Only needed if you want the money taken off at the dealership rather than claimed back afterwards. Allow time — it is issued before you buy.",
        url: "https://evrebate.oregon.gov/eligibility-guidelines" },
    ],
    documents: DOC_CORE,
    afterAward: "Keep the vehicle registered in Oregon for 24 months.",
    lifetimeCap: { perPerson: 2, text: "Two rebates per person for life." },
    fundingNote: "Oregon waitlists applicants once the year's funding is exhausted. Eligible is not the same as funded.",
  },

  "de-new": {
    id: "de-new",
    name: "Delaware Clean Vehicle Rebate — New",
    short: "Delaware New",
    administrator: "Delaware DNREC, administered by the Center for Sustainable Energy",
    url: "https://driveelectricdelaware.org/eligibility-requirements",
    state: "DE",
    applyDays: 90,
    minLeaseMonths: 36,
    prerequisites: [
      { what: "Register as a State of Delaware supplier and get your Supplier ID",
        why: "Delaware disburses this as a vendor payment, so the Supplier ID goes on the application. Do it BEFORE you apply — applications without one are not processed, and approval is not instant.",
        url: "https://esupplier.erp.delaware.gov" },
    ],
    documents: DOC_CORE,
    lifetimeCap: { perPerson: 2, text: "Two rebates per individual for life; six for entities." },
  },

  "de-used": {
    id: "de-used",
    name: "Delaware Clean Vehicle Rebate — Used",
    short: "Delaware Used",
    administrator: "Delaware DNREC, administered by the Center for Sustainable Energy",
    url: "https://driveelectricdelaware.org/eligibility-requirements",
    state: "DE",
    applyDays: 90,
    minLeaseMonths: 36,
    individualsOnly: true,
    prerequisites: [
      { what: "Register as a State of Delaware supplier and get your Supplier ID",
        why: "Delaware disburses this as a vendor payment, so the Supplier ID goes on the application. Do it BEFORE you apply — applications without one are not processed.",
        url: "https://esupplier.erp.delaware.gov" },
    ],
    documents: DOC_CORE,
    lifetimeCap: { perPerson: 2, text: "Two rebates per individual for life. Individuals only — entities cannot claim the used rebate." },
  },

  "pge-preowned": {
    id: "pge-preowned",
    name: "PG&E Pre-Owned EV Rebate",
    short: "PG&E Pre-Owned",
    administrator: "PG&E, administered by the Center for Sustainable Energy",
    url: "https://evrebates.pge.com/program-requirements",
    state: "CA",
    applyDays: 90,
    completeDays: 60,
    individualsOnly: true,
    ruleChange: {
      on: "2026-10-01",
      what: "From this date PG&E accepts income-qualified applicants only. The $1,000 standard tier closes.",
    },
    prerequisites: [
      { what: "Find two numbers on your PG&E bill",
        why: "The 11-digit account number (top right of every page) and the 10-digit electric service agreement ID (under Details of Electric Charges, usually page 3). The application cannot be completed without both — eligibility is tied to the meter, not to you.",
        url: "https://evrebates.pge.com/program-requirements" },
    ],
    documents: DOC_CORE,
    afterAward: "Keep the vehicle registered in California, at your PG&E service address, for 20 months.",
    lifetimeCap: { perPerson: 1, text: "One per individual for life; three per household address." },
  },
};

/* ── Oregon amounts ──────────────────────────────────────────────────────────
   Transcribed from that program's own production bundle.

   ONE DELIBERATE DIVERGENCE, and it is the reason this function exists rather
   than a lookup table: upstream also offers BEV × standard_under_10kwh and
   returns $750. No battery electric vehicle sold in the US has a sub-10 kWh
   pack, so that combination describes nothing. We return null rather than a
   confident number for a vehicle that cannot be bought.                      */

export type OregonCategory = "BEV" | "PHEV" | "ZEM";
export type OregonRebateType =
  | "standard_10kwh_plus" | "standard_under_10kwh"
  | "charge_ahead_new" | "charge_ahead_used";

const OR_FLAT: Record<string, number> = {
  "BEV|charge_ahead_new": 7500,
  "PHEV|charge_ahead_new": 5000,
  "BEV|standard_10kwh_plus": 2000,
  "PHEV|standard_10kwh_plus": 1500,
  "PHEV|standard_under_10kwh": 750,
  // "BEV|standard_under_10kwh": 750 — present upstream, refused here.
};

export function oregonAmount(
  category: OregonCategory,
  rebateType: OregonRebateType,
  price?: number | null,
): number | null {
  // Zero-emission motorcycles take the Standard rebate only.
  if (category === "ZEM") return rebateType.startsWith("standard") ? 375 : null;

  const key = `${category}|${rebateType}`;
  if (key === "BEV|standard_under_10kwh") return null;
  if (key in OR_FLAT) return OR_FLAT[key];

  const p = typeof price === "number" && Number.isFinite(price) && price > 0 ? price : null;

  if (key === "BEV|charge_ahead_used") {
    if (p === null) return null;
    let a: number;
    if (p < 2500) a = p;                            // 100% of price
    else if (p < 8333) a = 2500;
    else if (p < 12000) a = Math.max(2500, p * 0.3);
    else a = 4000;                                  // $400 jump at exactly 12000
    return Math.round(a);
  }

  if (key === "PHEV|charge_ahead_used") {
    if (p === null) return null;
    return Math.min(2500, p);
  }

  return null;
}

/** Which Oregon rebate type applies, given the shape of the purchase. */
export function oregonRebateType(
  track: "standard" | "charge_ahead",
  condition: Condition,
  batteryBand: BatteryBand | null,
): OregonRebateType {
  if (track === "charge_ahead") return condition === "used" ? "charge_ahead_used" : "charge_ahead_new";
  return batteryBand === "under10" ? "standard_under_10kwh" : "standard_10kwh_plus";
}

/** Delaware amounts. From published program prose, NOT from a decompiled
 *  engine — lower confidence than the Oregon block above. */
export function delawareAmount(
  fuel: Fuel,
  condition: Condition,
  price: number | null,
): number | null {
  if (fuel === "phev") return 1000;
  if (typeof price !== "number" || !Number.isFinite(price)) return null;
  if (condition === "used") return price < 40000 ? 2500 : null;
  if (price < 40000) return 2500;
  if (price <= 50000) return 1500;
  return null;                                      // over the $50k ceiling
}

/* ── income ──────────────────────────────────────────────────────────────────
   Both administrators run the same two-path model: categorical proof of
   enrolment, or full verification via IRS 4506-C.

   Dependency status disqualifies OUTRIGHT in both, regardless of what the
   household earns. That single rule is the most reliable source of false
   positives in every comparable tool — a 22-year-old on a parent's return picks
   "lower income" and gets told $7,500.                                        */

export type IncomePath = "categorical" | "verified";
export interface IncomeAssessment { ok: boolean | null; path?: IncomePath; why: string }

/** 400% of the Federal Poverty Guidelines, by household size.
 *
 *  DELIBERATELY EMPTY. Turning an income band into a dollar threshold needs the
 *  current HHS table, and we do not have verified figures. An unpopulated table
 *  must never produce a number — populate this, then turn on the household-size
 *  question in QUESTIONS. */
export const FPG_400: Record<number, number> | null = null;

export function assessIncome(a: Pick<Answers, "income" | "dependent">): IncomeAssessment {
  if (a.dependent === "yes") {
    return { ok: false,
      why: "Someone claims you as a dependent on their tax return, which rules out the income-qualified tier no matter what the household earns." };
  }
  if (a.income === "assistance") {
    return { ok: true, path: "categorical",
      why: "You are enrolled in a listed assistance program — the categorical route, with no income arithmetic." };
  }
  if (a.income === "under") {
    return { ok: true, path: "verified",
      why: "Your household income band is inside the limit for the income-qualified tier." };
  }
  if (a.income === "over") {
    return { ok: false, why: "Household income is above the limit for the income-qualified tier." };
  }
  return { ok: null, why: "We need your household income band to test the income-qualified tier." };
}

/* ── clocks ──────────────────────────────────────────────────────────────── */

export interface ClockLine { when: string; heat: "" | "hot" | "dead"; what: string }
export interface Urgent { count: number; unit: string; headline: string }
export interface Clock { lines: ClockLine[]; stop: string | null; urgent: Urgent | null }

export function buildClock(program: Program, a: Answers, today: string): Clock {
  const lines: ClockLine[] = [];
  let stop: string | null = null;
  let urgent: Urgent | null = null;

  if (program.purchaseWindow) {
    const w = program.purchaseWindow;
    const toOpen = daysBetween(today, w.open);
    const toClose = daysBetween(today, w.close);

    if (toOpen > 0) {
      lines.push({ when: formatIsoDate(w.open), heat: "hot",
        what: "The purchase window opens. A vehicle bought before this date does not qualify, whatever else is true." });
      urgent = { count: toOpen, unit: toOpen === 1 ? "day until you can buy" : "days until you can buy",
        headline: `Do not buy yet — Oregon does not count purchases made before ${formatIsoDate(w.open)}.` };
    } else if (toClose < 0) {
      stop = `Oregon stopped counting purchases after ${formatIsoDate(w.close)}.`;
    } else {
      lines.push({ when: formatIsoDate(w.close), heat: toClose <= 30 ? "hot" : "",
        what: `Last day the purchase can be made. ${toClose} days left.` });
      urgent = { count: toClose, unit: toClose === 1 ? "day left to buy" : "days left to buy",
        headline: `You have ${toClose} days to buy. Oregon stops counting purchases after ${formatIsoDate(w.close)}.` };
    }

    // A purchase date already outside the window is a hard stop of its own.
    if (ISO.test(a.purchaseDate)) {
      if (daysBetween(a.purchaseDate, w.open) > 0) {
        stop = `You bought on ${formatIsoDate(a.purchaseDate)}, before Oregon's window opened on ${formatIsoDate(w.open)}. Purchases made while the program was suspended do not qualify.`;
      } else if (daysBetween(w.close, a.purchaseDate) > 0) {
        stop = `You bought on ${formatIsoDate(a.purchaseDate)}, after Oregon's window closed on ${formatIsoDate(w.close)}.`;
      }
    }
  }

  if (program.ruleChange) {
    const toChange = daysBetween(today, program.ruleChange.on);
    if (toChange > 0) {
      lines.push({ when: formatIsoDate(program.ruleChange.on), heat: toChange <= 60 ? "hot" : "",
        what: `${program.ruleChange.what} ${toChange} days away.` });
    }
  }

  if (program.applyDays) {
    if (a.timing === "bought" && ISO.test(a.purchaseDate)) {
      const due = addIsoDays(a.purchaseDate, program.applyDays);
      const left = daysBetween(today, due);
      lines.push({
        when: formatIsoDate(due),
        heat: left < 0 ? "dead" : left <= 30 ? "hot" : "",
        what: left < 0
          ? `Your application deadline passed ${Math.abs(left)} days ago.`
          : `Apply by this date. ${left} days left, counted from your ${formatIsoDate(a.purchaseDate)} purchase.`,
      });
      if (left < 0) {
        stop = stop ?? `The ${program.applyDays > 100 ? "six-month" : `${program.applyDays}-day`} application deadline ran out ${Math.abs(left)} days ago.`;
      } else if (!urgent) {
        urgent = { count: left, unit: left === 1 ? "day left to apply" : "days left to apply",
          headline: `You have ${left} days left to apply.` };
      }
      if (program.completeDays) {
        lines.push({ when: `${program.completeDays} days`, heat: "",
          what: `Once you start the application you get ${program.completeDays} days to finish it — or whatever is left of the ${program.applyDays}, whichever is shorter.` });
      }
    } else {
      lines.push({ when: `${program.applyDays} days`, heat: "",
        what: "That is how long you get to apply after you buy. The clock starts on the purchase date, not today." });
      if (program.completeDays) {
        lines.push({ when: `${program.completeDays} days`, heat: "",
          what: "And once started, this long to finish and upload everything." });
      }
    }
  }

  if (program.afterAward) lines.push({ when: "After", heat: "", what: program.afterAward });

  return { lines, stop, urgent };
}

/* ── questions ───────────────────────────────────────────────────────────────
   Declarative, so the page never hard-codes the flow. `when` decides
   visibility — an empty form asks two questions, not fourteen.               */

export type QuestionKind = "zip" | "date" | "money" | "choice";

export interface Question {
  key: keyof Answers;
  kind: QuestionKind;
  legend: string;
  hint?: string;
  when?: (a: Answers) => boolean;
  options?: [string, string][] | ((a: Answers) => [string, string][]);
}

export const isCovered = (state: string | null | undefined): state is CoveredState =>
  !!state && (COVERED_STATES as readonly string[]).includes(state);

/** State for eligibility purposes — a COMPLETE ZIP only.
 *
 *  The shared zipToState() deliberately resolves from three digits, because its
 *  other callers preset an energy rate while the reader is still typing and a
 *  wrong guess there costs nothing. Eligibility is a much stronger claim: three
 *  digits of a Washington ZIP land inside Oregon's 970–979 range, and answering
 *  "you may be eligible for $7,500" to a half-typed ZIP is exactly the
 *  false-positive this tool exists to prevent. So we wait for all five. */
export function stateForEligibility(zip: unknown): string | null {
  const digits = String(zip ?? "").replace(/\D/g, "");
  return digits.length === 5 ? zipToState(digits) : null;
}

export const QUESTIONS: Question[] = [
  { key: "zip", kind: "zip", legend: "Where do you live?",
    hint: "Try 97204 (Oregon), 19801 (Delaware) or 94108 (California)" },

  { key: "timing", kind: "choice", legend: "Have you bought it yet?",
    hint: "This starts every deadline clock",
    options: [["bought", "Already bought"], ["soon", "Buying soon"], ["looking", "Just looking"]] },

  { key: "purchaseDate", kind: "date", legend: "When did you buy it?",
    when: (a) => a.timing === "bought" },

  { key: "condition", kind: "choice", legend: "New or used?",
    when: (a) => isCovered(a.state),
    options: [["new", "New"], ["used", "Used"]] },

  { key: "fuel", kind: "choice", legend: "Powertrain",
    hint: "PG&E needs a battery of at least 8 kWh",
    when: (a) => isCovered(a.state),
    options: (a) => {
      const o: [string, string][] = [["bev", "Fully electric"], ["phev", "Plug-in hybrid"]];
      if (a.state === "OR") o.push(["zem", "Electric motorcycle"]);
      return o;
    } },

  // Only asked where it changes the answer. Never for a BEV — see oregonAmount().
  { key: "batteryBand", kind: "choice", legend: "Battery size",
    hint: "Oregon's Standard rebate pays less below 10 kWh",
    when: (a) => a.state === "OR" && a.condition === "new" && a.fuel === "phev",
    options: [["over10", "10 kWh or more"], ["under10", "Under 10 kWh"], ["unknown", "Not sure"]] },

  { key: "price", kind: "money", legend: "Price",
    hint: "The vehicle price on the agreement, before taxes and fees",
    when: (a) => a.state === "DE" || (a.state === "OR" && a.condition === "used") },

  { key: "modelYear", kind: "choice", legend: "How old is it?",
    hint: "Delaware caps used vehicles at eight model years",
    when: (a) => a.state === "DE" && a.condition === "used",
    options: [["within8", "Eight model years or newer"], ["older", "Older than that"], ["unknown", "Not sure"]] },

  { key: "applicant", kind: "choice", legend: "Who is buying?",
    when: (a) => isCovered(a.state),
    options: [["individual", "Me, personally"], ["entity", "A business, nonprofit or agency"]] },

  { key: "utility", kind: "choice", legend: "Your electricity supplier",
    hint: "PG&E ties this rebate to the meter, not to you",
    when: (a) => a.state === "CA",
    options: [["pge", "PG&E residential electric"], ["other", "Someone else, or gas only"]] },

  { key: "income", kind: "choice", legend: "Household income",
    hint: "We keep the band, never a figure",
    when: (a) => isCovered(a.state),
    options: [["assistance", "On an assistance program"], ["under", "Lower band"],
              ["over", "Neither"], ["skip", "Rather not say"]] },

  { key: "dependent", kind: "choice", legend: "Does anyone claim you as a dependent?",
    hint: "This disqualifies the income tier outright, whatever the household earns",
    when: (a) => a.income === "under" || a.income === "assistance",
    options: [["no", "No"], ["yes", "Yes"]] },

  { key: "priorCalifornia", kind: "choice",
    legend: "Taken SCE, SDG&E or the Clean Fuel Reward on this same car?",
    when: (a) => a.state === "CA" && a.condition === "used",
    options: [["no", "No"], ["yes", "Yes"]] },

  { key: "priorClaims", kind: "choice", legend: "Claimed this program before?",
    hint: "Every one of these has a lifetime cap",
    when: (a) => isCovered(a.state),
    options: [["none", "Never"], ["one", "Once"], ["more", "Twice or more"]] },
];

export const visibleQuestions = (a: Answers): Question[] =>
  QUESTIONS.filter((q) => !q.when || q.when(a));

/** Clear answers whose question is no longer on screen.
 *
 *  Without this, an answer the reader can no longer see keeps deciding their
 *  result. The case that motivated it: answer "yes" to the dependency question,
 *  then change household income to "rather not say". The dependency question
 *  disappears — it only shows for the two income bands that reach the
 *  income-qualified tier — but the stored "yes" still disqualifies them, and the
 *  card says they are excluded for being a dependent with no visible control to
 *  change. Pruning is applied repeatedly because hiding one question can hide
 *  another that depended on it. */
export function pruneHiddenAnswers(a: Answers): Answers {
  let next = { ...a };
  for (let pass = 0; pass < QUESTIONS.length; pass++) {
    const visible = new Set(visibleQuestions(next).map((q) => q.key));
    const stale = QUESTIONS.filter((q) => !visible.has(q.key) && next[q.key] !== null && next[q.key] !== "");
    if (stale.length === 0) break;
    const cleared = { ...next };
    for (const q of stale) {
      (cleared[q.key] as unknown) = q.kind === "zip" || q.kind === "date" ? "" : null;
    }
    next = cleared;
  }
  return next;
}

export const optionsFor = (q: Question, a: Answers): [string, string][] =>
  typeof q.options === "function" ? q.options(a) : (q.options ?? []);

/* ── caps ────────────────────────────────────────────────────────────────────
   `priorClaims` is coarse on purpose — asking for an exact count invites a
   guess, and a guess here removes a real program from someone's list.        */

export function capExceeded(program: Program, a: Answers): string | null {
  if (!program.lifetimeCap || !a.priorClaims) return null;
  const cap = program.lifetimeCap.perPerson;
  if (a.priorClaims === "more" && cap <= 2) {
    return `You have already claimed this program ${cap === 1 ? "" : "twice or more"}, and the lifetime cap is ${cap}.`;
  }
  if (a.priorClaims === "one" && cap === 1) {
    return "You have already claimed this one, and it is limited to one per person for life.";
  }
  return null;
}

/* ── evaluation ──────────────────────────────────────────────────────────── */

export type ResultStatus = "eligible" | "need" | "superseded" | "stopped" | "excluded";

export interface Result {
  id: string;
  program: Program;
  status: ResultStatus;
  /** The figure, when there is one. Null whenever we will not stand behind it. */
  amount: number | null;
  /** What is already confirmed while another answer decides the rest. */
  floor: number | null;
  /** How the amount was arrived at, in the reader's language. */
  basis: string | null;
  reason: string | null;
  missing: string | null;
  incomePath?: IncomePath;
  clock: Clock;
}

export interface Lead {
  kind: "stop" | "time";
  text?: string;
  urgent?: Urgent;
  result: Result;
}

export interface Evaluation {
  state: string | null;
  covered: boolean;
  results: Result[];
  /** The binding constraint, which the page leads with instead of the money. */
  lead: Lead | null;
  /** ALWAYS one program's figure. Never a sum. */
  bestAmount: number;
  today: string;
  verifiedAt: string;
  staleDays: number;
}

export function evaluate(input: Partial<Answers> | null | undefined, today?: string): Evaluation {
  const day = today && ISO.test(today) ? today : todayIso();
  const raw = { ...EMPTY_ANSWERS, ...(input ?? {}) } as Answers;
  const state = stateForEligibility(raw.zip);
  const a: Answers = { ...raw, state };

  const results: Result[] = [];

  const push = (program: Program, status: ResultStatus, fields: Partial<Result> = {}): Result => {
    const r: Result = {
      id: program.id, program, status,
      amount: null, floor: null, basis: null, reason: null, missing: null,
      ...fields,
      clock: buildClock(program, a, day),
    };
    // A hard stop suppresses the figure rather than annotating it. Showing
    // "$7,500" beside "you missed the deadline" is the failure this tool exists
    // to prevent.
    if (r.clock.stop && (status === "eligible" || status === "need")) {
      r.status = "stopped";
      r.amount = null;
      r.floor = null;
      r.reason = r.clock.stop;
    }
    results.push(r);
    return r;
  };

  const price = typeof a.price === "number" && Number.isFinite(a.price) && a.price > 0 ? a.price : null;

  /* ── Oregon ── */
  if (state === "OR") {
    const category: OregonCategory | null =
      a.fuel === "bev" ? "BEV" : a.fuel === "phev" ? "PHEV" : a.fuel === "zem" ? "ZEM" : null;

    // Standard — new vehicles only.
    const std = PROGRAMS["or-standard"];
    const stdCap = capExceeded(std, a);
    if (stdCap) {
      push(std, "excluded", { reason: stdCap });
    } else if (a.condition === "used") {
      push(std, "excluded", { reason: "The Standard rebate covers new vehicles only." });
    } else if (!category || !a.condition) {
      push(std, "need", { missing: "Tell us the powertrain and whether it is new." });
    } else if (category === "PHEV" && (!a.batteryBand || a.batteryBand === "unknown")) {
      push(std, "need", {
        floor: 750,
        missing: "$750 is confirmed. Whether the pack is 10 kWh or more decides the other $750.",
        basis: "Oregon pays $1,500 for a plug-in hybrid at 10 kWh or more, $750 below that.",
      });
    } else {
      const type = oregonRebateType("standard", "new", a.batteryBand);
      const amount = oregonAmount(category, type, price);
      if (amount === null) {
        push(std, "excluded", {
          reason: category === "ZEM"
            ? "Electric motorcycles take the Standard rebate, but we could not resolve an amount from these answers."
            : "That combination of powertrain and battery size does not describe a vehicle Oregon pays for.",
        });
      } else {
        push(std, "eligible", {
          amount,
          basis: category === "ZEM"
            ? "Flat rate for zero-emission motorcycles."
            : `Standard rate for a ${category === "BEV" ? "battery electric" : "plug-in hybrid"} vehicle${type === "standard_under_10kwh" ? " under 10 kWh." : " at 10 kWh or more."}`,
          reason: "A new vehicle registered in Oregon.",
        });
      }
    }

    // Charge Ahead — income qualified, individuals only, new or used.
    const ca = PROGRAMS["or-charge-ahead"];
    const caCap = capExceeded(ca, a);
    const inc = assessIncome(a);
    if (caCap) {
      push(ca, "excluded", { reason: caCap });
    } else if (category === "ZEM") {
      push(ca, "excluded", { reason: "Electric motorcycles are eligible for the Standard rebate only." });
    } else if (a.applicant === "entity") {
      push(ca, "excluded", { reason: "Charge Ahead is for households, not businesses or agencies." });
    } else if (!category || !a.condition) {
      push(ca, "need", { missing: "Tell us the powertrain and whether it is new or used." });
    } else if (inc.ok === false) {
      push(ca, "excluded", { reason: inc.why });
    } else {
      const type = oregonRebateType("charge_ahead", a.condition, null);
      const amount = oregonAmount(category, type, price);

      if (a.condition === "used" && amount === null) {
        push(ca, "need", {
          missing: "Charge Ahead pays a share of the price on a used vehicle. Give us the price and we can work it out.",
          basis: category === "BEV"
            ? "Up to $4,000, reached at a price of $12,000 or more."
            : "Up to $2,500, capped at the price you pay.",
        });
      } else if (amount === null) {
        push(ca, "excluded", { reason: "We could not resolve a Charge Ahead amount from these answers." });
      } else if (inc.ok === null) {
        push(ca, "need", {
          missing: inc.why,
          basis: `Worth ${formatMoney(amount)} if the household qualifies.`,
        });
      } else {
        push(ca, "eligible", {
          amount,
          basis: a.condition === "used" && category === "BEV" && price !== null
            ? `Price-banded: ${formatMoney(price)} lands on ${formatMoney(amount)}.`
            : `Charge Ahead rate for a ${category === "BEV" ? "battery electric" : "plug-in hybrid"} ${a.condition} vehicle.`,
          reason: inc.why,
          incomePath: inc.path,
        });
      }
    }

    // Standard XOR Charge Ahead. The loser stays visible with its reason —
    // silently dropping it reads as "the tool didn't check".
    const live = results.filter((r) => r.status === "eligible" && r.program.exclusiveGroup === "oregon");
    if (live.length > 1) {
      live.sort((x, y) => (y.amount ?? 0) - (x.amount ?? 0));
      live.slice(1).forEach((r) => {
        r.status = "superseded";
        r.reason = `Oregon lets you claim one or the other, not both — and ${live[0].program.short} pays more.`;
      });
    }
  }

  /* ── Delaware ── */
  if (state === "DE") {
    const prog = a.condition === "used" ? PROGRAMS["de-used"] : PROGRAMS["de-new"];
    const cap = capExceeded(prog, a);

    if (cap) {
      push(prog, "excluded", { reason: cap });
    } else if (prog.individualsOnly && a.applicant === "entity") {
      push(prog, "excluded", { reason: "Delaware's used rebate is open to individuals only." });
    } else if (!a.condition || !a.fuel) {
      push(prog, "need", { missing: "Tell us the powertrain and whether it is new or used." });
    } else if (a.fuel === "zem") {
      push(prog, "excluded", { reason: "Delaware's rebate covers cars, not motorcycles." });
    } else if (a.condition === "used" && a.modelYear === "older") {
      push(prog, "excluded", { reason: "Delaware caps used vehicles at eight model years or newer." });
    } else if (a.condition === "used" && (!a.modelYear || a.modelYear === "unknown")) {
      // The age rule must survive a known price — it is exactly the rule that
      // disappears in comparable tools the moment someone picks a price band.
      push(prog, "need", {
        missing: "Delaware only pays on used vehicles eight model years old or newer. We need to know which side of that line yours is on.",
        basis: "Up to $2,500 if it is inside the age limit and under $40,000.",
      });
    } else if (price === null && a.fuel === "bev") {
      push(prog, "need", {
        missing: a.condition === "new"
          ? "Delaware pays by price band. Under $40,000 gets $2,500, $40–50,000 gets $1,500, above that nothing."
          : "Delaware needs the purchase price under $40,000.",
      });
    } else {
      const amount = delawareAmount(a.fuel, a.condition, price);
      if (amount === null) {
        push(prog, "excluded", {
          reason: a.condition === "new"
            ? "The price is over Delaware's $50,000 ceiling."
            : "The price is over the $40,000 ceiling Delaware sets for used vehicles.",
        });
      } else {
        push(prog, "eligible", {
          amount,
          basis: a.fuel === "phev"
            ? "Flat rate for plug-in hybrids in Delaware."
            : `Battery electric, ${formatMoney(price as number)}, inside Delaware's price band.`,
          reason: `A ${a.condition} vehicle registered in Delaware.`,
        });
      }
    }
  }

  /* ── PG&E ── */
  if (state === "CA") {
    const pge = PROGRAMS["pge-preowned"];
    const cap = capExceeded(pge, a);
    const inc = assessIncome(a);

    if (cap) {
      push(pge, "excluded", { reason: cap });
    } else if (a.condition === "new") {
      push(pge, "excluded", { reason: "PG&E's rebate covers pre-owned vehicles only." });
    } else if (a.fuel === "zem") {
      push(pge, "excluded", { reason: "PG&E's rebate covers cars, not motorcycles." });
    } else if (a.applicant === "entity") {
      push(pge, "excluded", { reason: "This is for residential customers, not businesses." });
    } else if (a.priorCalifornia === "yes") {
      push(pge, "excluded", {
        reason: "You already took SCE, SDG&E or the California Clean Fuel Reward on this vehicle. PG&E excludes that.",
      });
    } else if (!a.condition) {
      push(pge, "need", { missing: "Tell us whether the vehicle is new or used." });
    } else if (!a.utility) {
      push(pge, "need", {
        floor: 1000,
        missing: "We need to know whether you hold an active PG&E residential electric account.",
      });
    } else if (a.utility === "other") {
      push(pge, "excluded", {
        reason: "This needs an active PG&E residential electric account at the address the vehicle is registered to. Gas-only customers are excluded.",
      });
    } else if (inc.ok === null) {
      // Show the floor, not an em-dash. "$1,000 confirmed" is a better answer
      // than "—" when we already know the standard tier applies.
      push(pge, "need", {
        floor: 1000,
        missing: "$1,000 is confirmed. One more answer decides whether the $4,000 Rebate Plus applies instead.",
        basis: "Standard $1,000, or $4,000 on Rebate Plus if the household is income-qualified.",
      });
    } else if (inc.ok === false) {
      push(pge, "eligible", {
        amount: 1000,
        basis: "The standard tier.",
        reason: `${inc.why} The standard $1,000 still applies.`,
      });
    } else {
      push(pge, "eligible", {
        amount: 4000,
        basis: "Rebate Plus, the income-qualified tier.",
        reason: inc.why,
        incomePath: inc.path,
      });
    }
  }

  /* ── ordering, lead, best ── */
  const rank: Record<ResultStatus, number> = {
    eligible: 0, need: 1, superseded: 2, stopped: 3, excluded: 4,
  };
  results.sort((x, y) =>
    rank[x.status] - rank[y.status] ||
    ((y.amount ?? y.floor ?? 0) - (x.amount ?? x.floor ?? 0)));

  const eligible = results.filter((r) => r.status === "eligible");
  const bestAmount = eligible.length ? Math.max(...eligible.map((r) => r.amount ?? 0)) : 0;

  // The lead is the binding constraint, not the money.
  let lead: Lead | null = null;
  const stopped = results.filter((r) => r.status === "stopped");
  if (stopped.length) {
    lead = { kind: "stop", text: stopped[0].reason ?? undefined, result: stopped[0] };
  } else {
    const ticking = results.filter(
      (r) => (r.status === "eligible" || r.status === "need") && r.clock.urgent);
    if (ticking.length) {
      ticking.sort((x, y) => (x.clock.urgent!.count) - (y.clock.urgent!.count));
      lead = { kind: "time", urgent: ticking[0].clock.urgent!, result: ticking[0] };
    }
  }

  return {
    state,
    covered: isCovered(state),
    results,
    lead,
    bestAmount,
    today: day,
    verifiedAt: RULES_VERIFIED_AT,
    staleDays: daysBetween(RULES_VERIFIED_AT, day),
  };
}

/** The document pack for one result, including whichever income path applies. */
export function documentsFor(r: Result, a?: Partial<Answers>): DocumentItem[] {
  const docs = [...r.program.documents];
  if (r.program.incomeQualified || r.incomePath) {
    const path: IncomePath = r.incomePath ?? (a?.income === "assistance" ? "categorical" : "verified");
    docs.push(...(path === "categorical" ? DOC_INCOME_CATEGORICAL : DOC_INCOME_VERIFIED));
  }
  docs.push(DOC_UPLOAD_RULE);
  return docs;
}

export { formatIsoDate, todayIso };
