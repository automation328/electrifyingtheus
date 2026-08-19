// The rebate eligibility rules.
//
// Every test that touches time supplies its own date, so nothing here decays.
// 2026-08-19 is deliberate: six days before Oregon's purchase window opens, and
// the exact point where a naive calculator hands someone $7,500 for a car they
// are not allowed to buy yet.
//
// Suite names cite the rule being protected, so a failure points at the reason
// rather than at a number in a file.

import { describe, it, expect } from "vitest";
import {
  evaluate, oregonAmount, delawareAmount, assessIncome, documentsFor,
  visibleQuestions, optionsFor, capExceeded, daysBetween, addIsoDays, pruneHiddenAnswers,
  PROGRAMS, QUESTIONS, FPG_400, RULES_VERIFIED_AT, EMPTY_ANSWERS,
  type Answers, type Evaluation,
} from "@/lib/eligibility/rules";

const BEFORE_WINDOW = "2026-08-19";
const INSIDE_WINDOW = "2026-09-15";
const AFTER_WINDOW = "2026-11-20";

const ans = (extra: Partial<Answers> = {}): Answers => ({
  ...EMPTY_ANSWERS, timing: "looking", applicant: "individual", priorClaims: "none", ...extra,
});

const find = (out: Evaluation, id: string) => out.results.find((r) => r.id === id);

/* ── Oregon amounts ─────────────────────────────────────────────────────── */

describe("Oregon amount matrix", () => {
  it.each([
    ["ZEM", "standard_10kwh_plus", 375],
    ["BEV", "charge_ahead_new", 7500],
    ["PHEV", "charge_ahead_new", 5000],
    ["BEV", "standard_10kwh_plus", 2000],
    ["PHEV", "standard_10kwh_plus", 1500],
    ["PHEV", "standard_under_10kwh", 750],
  ] as const)("%s × %s → $%i", (cat, type, want) => {
    expect(oregonAmount(cat, type)).toBe(want);
  });

  it("pays a PHEV $5,000 on Charge Ahead new, not the $7,500 a BEV gets", () => {
    expect(oregonAmount("PHEV", "charge_ahead_new")).toBe(5000);
    expect(oregonAmount("PHEV", "charge_ahead_new")).not.toBe(7500);
  });

  it("keeps motorcycles out of Charge Ahead entirely", () => {
    expect(oregonAmount("ZEM", "charge_ahead_new")).toBeNull();
    expect(oregonAmount("ZEM", "charge_ahead_used", 20000)).toBeNull();
  });
});

describe("Oregon used-BEV price bands", () => {
  it("pays 100% of the price below $2,500", () => {
    expect(oregonAmount("BEV", "charge_ahead_used", 900)).toBe(900);
    expect(oregonAmount("BEV", "charge_ahead_used", 2499)).toBe(2499);
  });

  it("is flat $2,500 from $2,500 to $8,332", () => {
    expect(oregonAmount("BEV", "charge_ahead_used", 2500)).toBe(2500);
    expect(oregonAmount("BEV", "charge_ahead_used", 8332)).toBe(2500);
  });

  it("ramps at 30% of price from $8,333 to $11,999", () => {
    expect(oregonAmount("BEV", "charge_ahead_used", 8333)).toBe(2500);
    expect(oregonAmount("BEV", "charge_ahead_used", 10000)).toBe(3000);
    expect(oregonAmount("BEV", "charge_ahead_used", 11999)).toBe(3600);
  });

  it("jumps $400 on a $1 price increase at $12,000 — a real cliff, not rounding", () => {
    expect(oregonAmount("BEV", "charge_ahead_used", 11999)).toBe(3600);
    expect(oregonAmount("BEV", "charge_ahead_used", 12000)).toBe(4000);
  });

  it("treats $4,000 as a ceiling, never a flat used rate", () => {
    expect(oregonAmount("BEV", "charge_ahead_used", 45000)).toBe(4000);
    expect(oregonAmount("BEV", "charge_ahead_used", 6000)).not.toBe(4000);
  });

  it("caps a used PHEV at the price paid", () => {
    expect(oregonAmount("PHEV", "charge_ahead_used", 1800)).toBe(1800);
    expect(oregonAmount("PHEV", "charge_ahead_used", 30000)).toBe(2500);
  });

  it("returns nothing rather than guessing when the price is unknown", () => {
    expect(oregonAmount("BEV", "charge_ahead_used", null)).toBeNull();
    expect(oregonAmount("PHEV", "charge_ahead_used", 0)).toBeNull();
  });
});

describe("Refusing combinations that describe no real vehicle", () => {
  it("returns null for a sub-10 kWh battery electric vehicle", () => {
    // Oregon's own calculator answers $750 here. No BEV sold in the US has a
    // pack that small, so a confident number is worse than no number.
    expect(oregonAmount("BEV", "standard_under_10kwh")).toBeNull();
  });

  it("still pays a sub-10 kWh plug-in hybrid, which is a real car", () => {
    expect(oregonAmount("PHEV", "standard_under_10kwh")).toBe(750);
  });
});

/* ── XOR ────────────────────────────────────────────────────────────────── */

describe("Standard XOR Charge Ahead", () => {
  it("keeps the higher one and leaves the loser visible with its reason", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "under", dependent: "no", timing: "soon",
    }), INSIDE_WINDOW);

    expect(find(out, "or-charge-ahead")?.status).toBe("eligible");
    expect(find(out, "or-charge-ahead")?.amount).toBe(7500);
    expect(find(out, "or-standard")?.status).toBe("superseded");
    expect(find(out, "or-standard")?.reason).toMatch(/one or the other, not both/);
  });

  it("never sums the two", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "under", dependent: "no", timing: "soon",
    }), INSIDE_WINDOW);
    expect(out.bestAmount).toBe(7500);
    expect(out.bestAmount).not.toBe(9500);
  });

  it("leaves Standard alone when income rules out Charge Ahead", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "over", timing: "soon",
    }), INSIDE_WINDOW);
    expect(find(out, "or-standard")?.status).toBe("eligible");
    expect(find(out, "or-standard")?.amount).toBe(2000);
    expect(find(out, "or-charge-ahead")?.status).toBe("excluded");
  });
});

/* ── time ───────────────────────────────────────────────────────────────── */

describe("The time axis", () => {
  it("leads with 'do not buy yet' before the window opens", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "skip", timing: "soon",
    }), BEFORE_WINDOW);
    expect(out.lead?.kind).toBe("time");
    expect(out.lead?.urgent?.count).toBe(6);
    expect(out.lead?.urgent?.headline).toMatch(/Do not buy yet/);
  });

  it("still computes the figure, but refuses to lead with it", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "under", dependent: "no", timing: "soon",
    }), BEFORE_WINDOW);
    expect(out.bestAmount).toBe(7500);
    expect(out.lead?.kind).toBe("time");
  });

  it("suppresses the amount entirely for a purchase made before the window", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "under", dependent: "no",
      timing: "bought", purchaseDate: "2026-07-01",
    }), INSIDE_WINDOW);
    expect(find(out, "or-charge-ahead")?.status).toBe("stopped");
    expect(find(out, "or-charge-ahead")?.amount).toBeNull();
    expect(out.bestAmount).toBe(0);
    expect(out.lead?.kind).toBe("stop");
  });

  it("closes the program once the window has passed", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "skip", timing: "soon",
    }), AFTER_WINDOW);
    expect(find(out, "or-standard")?.status).toBe("stopped");
    expect(out.bestAmount).toBe(0);
  });

  it("kills a claim whose application deadline has run out", () => {
    const out = evaluate(ans({
      zip: "19801", condition: "new", fuel: "bev", price: 35000,
      timing: "bought", purchaseDate: "2026-01-05", income: "skip",
    }), BEFORE_WINDOW);
    expect(find(out, "de-new")?.status).toBe("stopped");
    expect(find(out, "de-new")?.amount).toBeNull();
    expect(find(out, "de-new")?.reason).toMatch(/ran out/);
  });

  it("counts down a live deadline instead", () => {
    const out = evaluate(ans({
      zip: "19801", condition: "new", fuel: "bev", price: 35000,
      timing: "bought", purchaseDate: "2026-07-01", income: "skip",
    }), BEFORE_WINDOW);
    const de = find(out, "de-new");
    expect(de?.status).toBe("eligible");
    expect(de?.amount).toBe(2500);
    expect(de?.clock.urgent?.count).toBe(41);   // 1 Jul + 90 days = 29 Sep
  });

  it("surfaces PG&E's 1 Oct income-only change before it lands", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "used", fuel: "bev", utility: "pge", income: "over", timing: "soon",
    }), BEFORE_WINDOW);
    const lines = find(out, "pge-preowned")!.clock.lines;
    expect(lines.filter((l) => /income-qualified applicants only/.test(l.what))).toHaveLength(1);
  });

  it("does the ISO date arithmetic without a Date round-trip", () => {
    expect(daysBetween("2026-08-19", "2026-08-25")).toBe(6);
    expect(daysBetween("2026-11-20", "2026-11-04")).toBe(-16);
    expect(addIsoDays("2026-07-01", 90)).toBe("2026-09-29");
    expect(addIsoDays("2026-12-31", 1)).toBe("2027-01-01");
  });
});

/* ── Delaware ───────────────────────────────────────────────────────────── */

describe("Delaware", () => {
  it("bands a new BEV by price", () => {
    expect(delawareAmount("bev", "new", 35000)).toBe(2500);
    expect(delawareAmount("bev", "new", 45000)).toBe(1500);
    expect(delawareAmount("bev", "new", 55000)).toBeNull();
  });

  it("pays a flat $1,000 for a plug-in hybrid", () => {
    expect(delawareAmount("phev", "new", 35000)).toBe(1000);
    expect(delawareAmount("phev", "used", 20000)).toBe(1000);
  });

  it("caps used at $40,000", () => {
    expect(delawareAmount("bev", "used", 39999)).toBe(2500);
    expect(delawareAmount("bev", "used", 40001)).toBeNull();
  });

  it("keeps the eight-model-year rule alive even when the price is known", () => {
    // The rule that vanishes in comparable tools the moment a price is picked.
    const out = evaluate(ans({
      zip: "19801", condition: "used", fuel: "bev", price: 25000,
      modelYear: "older", income: "skip", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "de-used")?.status).toBe("excluded");
    expect(find(out, "de-used")?.reason).toMatch(/eight model years/);
  });

  it("asks rather than assuming when the model year is unknown", () => {
    const out = evaluate(ans({
      zip: "19801", condition: "used", fuel: "bev", price: 25000,
      modelYear: "unknown", income: "skip", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "de-used")?.status).toBe("need");
  });

  it("keeps entities out of the used rebate", () => {
    const out = evaluate(ans({
      zip: "19801", condition: "used", fuel: "bev", price: 25000, modelYear: "within8",
      applicant: "entity", income: "skip", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "de-used")?.status).toBe("excluded");
    expect(find(out, "de-used")?.reason).toMatch(/individuals only/);
  });

  it("puts the supplier-ID gate on the program, so new and used both inherit it", () => {
    for (const id of ["de-new", "de-used"]) {
      expect(PROGRAMS[id].prerequisites).toHaveLength(1);
      expect(PROGRAMS[id].prerequisites[0].url).toMatch(/esupplier\.erp\.delaware\.gov/);
    }
  });
});

/* ── PG&E ───────────────────────────────────────────────────────────────── */

describe("PG&E Pre-Owned", () => {
  it("excludes new vehicles", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "new", fuel: "bev", utility: "pge", income: "skip", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "pge-preowned")?.status).toBe("excluded");
  });

  it("excludes a non-PG&E supplier and says why", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "used", fuel: "bev", utility: "other", income: "skip", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "pge-preowned")?.status).toBe("excluded");
    expect(find(out, "pge-preowned")?.reason).toMatch(/Gas-only/);
  });

  it("shows the $1,000 floor instead of an em-dash while income is unknown", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "used", fuel: "bev", utility: "pge", income: "skip", timing: "soon",
    }), BEFORE_WINDOW);
    const p = find(out, "pge-preowned");
    expect(p?.status).toBe("need");
    expect(p?.floor).toBe(1000);
    expect(p?.missing).toMatch(/\$4,000/);
  });

  it("reaches Rebate Plus on the categorical income path", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "used", fuel: "bev", utility: "pge",
      income: "assistance", dependent: "no", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "pge-preowned")?.amount).toBe(4000);
  });

  it("gives a dependent $1,000, never $4,000, whatever the income band", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "used", fuel: "bev", utility: "pge",
      income: "under", dependent: "yes", timing: "soon",
    }), BEFORE_WINDOW);
    const p = find(out, "pge-preowned");
    expect(p?.status).toBe("eligible");
    expect(p?.amount).toBe(1000);
    expect(p?.reason).toMatch(/dependent/);
  });

  it("enforces the cross-utility exclusion", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "used", fuel: "bev", utility: "pge",
      income: "under", dependent: "no", priorCalifornia: "yes", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "pge-preowned")?.status).toBe("excluded");
    expect(find(out, "pge-preowned")?.reason).toMatch(/SCE, SDG&E or the California Clean Fuel Reward/);
  });

  it("names both bill numbers as a prerequisite", () => {
    const why = PROGRAMS["pge-preowned"].prerequisites[0].why;
    expect(why).toMatch(/11-digit/);
    expect(why).toMatch(/10-digit/);
  });
});

/* ── dependency ─────────────────────────────────────────────────────────── */

describe("Dependency disqualifies the income tier", () => {
  it("keeps a dependent out of Charge Ahead but leaves Standard standing", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "under", dependent: "yes", timing: "soon",
    }), INSIDE_WINDOW);
    expect(find(out, "or-charge-ahead")?.status).toBe("excluded");
    expect(out.bestAmount).toBe(2000);
  });

  it("decides this in exactly one place", () => {
    expect(assessIncome({ income: "assistance", dependent: "yes" }).ok).toBe(false);
    expect(assessIncome({ income: "under", dependent: "yes" }).ok).toBe(false);
    expect(assessIncome({ income: "under", dependent: "no" }).ok).toBe(true);
    expect(assessIncome({ income: "skip", dependent: null }).ok).toBeNull();
  });
});

/* ── caps ───────────────────────────────────────────────────────────────── */

describe("Lifetime caps filter, not just inform", () => {
  it("closes PG&E after one prior claim", () => {
    const out = evaluate(ans({
      zip: "94108", condition: "used", fuel: "bev", utility: "pge",
      income: "under", dependent: "no", priorClaims: "one", timing: "soon",
    }), BEFORE_WINDOW);
    expect(find(out, "pge-preowned")?.status).toBe("excluded");
  });

  it("allows a second Oregon claim, because the cap is two", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "skip", priorClaims: "one", timing: "soon",
    }), INSIDE_WINDOW);
    expect(find(out, "or-standard")?.status).toBe("eligible");
  });

  it("closes Oregon at two or more", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "skip", priorClaims: "more", timing: "soon",
    }), INSIDE_WINDOW);
    expect(find(out, "or-standard")?.status).toBe("excluded");
  });

  it("says nothing when the question is unanswered", () => {
    expect(capExceeded(PROGRAMS["pge-preowned"], ans({ priorClaims: null }))).toBeNull();
  });
});

/* ── coverage ───────────────────────────────────────────────────────────── */

describe("Coverage", () => {
  it("routes the three states we model", () => {
    expect(evaluate(ans({ zip: "97204" }), INSIDE_WINDOW).state).toBe("OR");
    expect(evaluate(ans({ zip: "19801" }), INSIDE_WINDOW).state).toBe("DE");
    expect(evaluate(ans({ zip: "94108" }), INSIDE_WINDOW).state).toBe("CA");
  });

  it("names the state it cannot help with, rather than returning nothing at all", () => {
    // zipToState covers all 50 states, so the coverage gap can say "New York"
    // instead of "unknown" — a gap in OUR list, not a verdict about the reader.
    const out = evaluate(ans({ zip: "10001", timing: "soon" }), INSIDE_WINDOW);
    expect(out.state).toBe("NY");
    expect(out.covered).toBe(false);
    expect(out.results).toHaveLength(0);
    expect(out.bestAmount).toBe(0);
  });

  it("treats an incomplete ZIP as no answer, not as a miss", () => {
    // The shared zipToState() resolves "972" to Oregon on purpose — its other
    // callers preset an energy rate mid-typing. Eligibility must not: three
    // digits of a Washington ZIP fall inside Oregon's 970-979 range.
    expect(evaluate(ans({ zip: "972" }), INSIDE_WINDOW).state).toBeNull();
    expect(evaluate(ans({ zip: "9720" }), INSIDE_WINDOW).state).toBeNull();
    expect(evaluate(ans({ zip: "97204" }), INSIDE_WINDOW).state).toBe("OR");
    expect(evaluate(ans({ zip: "" }), INSIDE_WINDOW).state).toBeNull();
  });

  it("shows nothing at all until the ZIP is complete", () => {
    const partial = evaluate(ans({ zip: "9720", condition: "new", fuel: "bev", timing: "soon" }), INSIDE_WINDOW);
    expect(partial.results).toHaveLength(0);
    expect(partial.bestAmount).toBe(0);
  });
});

/* ── invariants ─────────────────────────────────────────────────────────── */

describe("Invariants across the whole answer space", () => {
  const combinations = (): Answers[] => {
    const out: Answers[] = [];
    for (const zip of ["97204", "19801", "94108", "10001"])
    for (const condition of [null, "new", "used"] as const)
    for (const fuel of [null, "bev", "phev", "zem"] as const)
    for (const income of [null, "assistance", "under", "over", "skip"] as const)
    for (const dependent of [null, "no", "yes"] as const)
    for (const applicant of ["individual", "entity"] as const)
    for (const utility of [null, "pge", "other"] as const)
    for (const price of [null, 9000, 25000, 45000, 55000])
      out.push(ans({ zip, condition, fuel, income, dependent, applicant, utility, price,
                     modelYear: "within8", batteryBand: "over10", timing: "soon" }));
    return out;
  };

  it("never shows an amount beside a hard stop", () => {
    const offenders = combinations().flatMap((a) =>
      evaluate(a, AFTER_WINDOW).results.filter(
        (r) => r.status === "stopped" && (r.amount !== null || r.floor !== null)));
    expect(offenders).toHaveLength(0);
  });

  it("always reports bestAmount as some single program's figure", () => {
    const offenders = combinations().filter((a) => {
      const out = evaluate(a, INSIDE_WINDOW);
      if (!out.bestAmount) return false;
      return !out.results.some((r) => r.status === "eligible" && r.amount === out.bestAmount);
    });
    expect(offenders).toHaveLength(0);
  });

  it("gives every eligible result a reason and a basis", () => {
    const offenders = combinations().flatMap((a) =>
      evaluate(a, INSIDE_WINDOW).results.filter(
        (r) => r.status === "eligible" && (!r.reason || !r.basis)).map((r) => r.id));
    expect(offenders).toHaveLength(0);
  });

  it("never excludes a program silently", () => {
    const offenders = combinations().flatMap((a) =>
      evaluate(a, INSIDE_WINDOW).results.filter(
        (r) => r.status === "excluded" && !r.reason).map((r) => r.id));
    expect(offenders).toHaveLength(0);
  });

  it("never leaves two mutually exclusive Oregon programs both eligible", () => {
    const offenders = combinations().filter((a) =>
      evaluate(a, INSIDE_WINDOW).results.filter(
        (r) => r.status === "eligible" && r.program.exclusiveGroup === "oregon").length > 1);
    expect(offenders).toHaveLength(0);
  });

  it("never throws, whatever it is handed", () => {
    const junk = [undefined, null, {}, { zip: 97204 }, { zip: "!!" },
      { zip: "97204", price: "lots" }, { zip: "94108", condition: 7 }];
    for (const j of junk) {
      expect(() => evaluate(j as never, INSIDE_WINDOW)).not.toThrow();
    }
  });
});

/* ── documents ──────────────────────────────────────────────────────────── */

describe("The document pack", () => {
  const orResult = (extra: Partial<Answers>, id: string) =>
    find(evaluate(ans({ zip: "97204", condition: "new", fuel: "bev", timing: "soon", ...extra }),
      INSIDE_WINDOW), id)!;

  it("always lists the core three", () => {
    const text = documentsFor(orResult({ income: "skip" }, "or-standard")).map((d) => d.what).join(" | ");
    expect(text).toMatch(/driver licence/);
    expect(text).toMatch(/purchase or lease agreement/);
    expect(text).toMatch(/registration card/);
  });

  it("ends with the merge rule, because that is what gets applications rejected", () => {
    const docs = documentsFor(orResult({ income: "skip" }, "or-standard"));
    expect(docs[docs.length - 1].what).toMatch(/merged into a single file/);
  });

  it("asks for an award letter on the categorical path, not a 4506-C", () => {
    const r = orResult({ income: "assistance", dependent: "no" }, "or-charge-ahead");
    const text = documentsFor(r, { income: "assistance" }).map((d) => d.what).join(" | ");
    expect(text).toMatch(/award letter/);
    expect(text).not.toMatch(/4506-C/);
  });

  it("asks for a 4506-C per adult on the verified path", () => {
    const r = orResult({ income: "under", dependent: "no" }, "or-charge-ahead");
    const text = documentsFor(r, { income: "under" }).map((d) => d.what).join(" | ");
    expect(text).toMatch(/4506-C/);
    expect(text).toMatch(/18 or over/);
  });
});

/* ── question flow ──────────────────────────────────────────────────────── */

describe("Question flow", () => {
  it("asks two questions of an empty form, not fourteen", () => {
    const qs = visibleQuestions(ans({ zip: "", state: null, timing: null }));
    expect(qs).toHaveLength(2);
    expect(qs[0].key).toBe("zip");
  });

  it("asks battery size only where it changes the answer", () => {
    const shown = (a: Partial<Answers>) =>
      visibleQuestions(ans(a)).some((q) => q.key === "batteryBand");
    expect(shown({ state: "OR", condition: "new", fuel: "phev" })).toBe(true);
    expect(shown({ state: "OR", condition: "new", fuel: "bev" })).toBe(false);
    expect(shown({ state: "DE", condition: "new", fuel: "phev" })).toBe(false);
  });

  it("offers the motorcycle option only in Oregon", () => {
    const fuel = QUESTIONS.find((q) => q.key === "fuel")!;
    expect(optionsFor(fuel, ans({ state: "OR" })).map((o) => o[0])).toContain("zem");
    expect(optionsFor(fuel, ans({ state: "DE" })).map((o) => o[0])).not.toContain("zem");
  });

  it("treats 'rather not say' as a real answer, not a dead end", () => {
    const out = evaluate(ans({
      zip: "97204", condition: "new", fuel: "bev", income: "skip", timing: "soon",
    }), INSIDE_WINDOW);
    expect(find(out, "or-standard")?.status).toBe("eligible");
    expect(find(out, "or-charge-ahead")?.status).toBe("need");
  });
});

describe("Answers never outlive their question", () => {
  it("drops a dependency answer once the income band stops showing that question", () => {
    // Answer "yes" to dependency, then move income to "rather not say". Without
    // pruning the invisible "yes" still disqualifies, and the card blames the
    // reader for a dependency they can no longer see or change.
    const before = ans({ zip: "97204", state: "OR", income: "under", dependent: "yes" });
    expect(visibleQuestions(before).some((q) => q.key === "dependent")).toBe(true);

    const after = pruneHiddenAnswers({ ...before, income: "skip" });
    expect(visibleQuestions(after).some((q) => q.key === "dependent")).toBe(false);
    expect(after.dependent).toBeNull();
  });

  it("drops Oregon-only answers when the ZIP moves to another state", () => {
    const or = ans({ zip: "97204", state: "OR", condition: "new", fuel: "phev", batteryBand: "under10" });
    const moved = pruneHiddenAnswers({ ...or, zip: "19801", state: "DE" });
    expect(moved.batteryBand).toBeNull();
  });

  it("drops a purchase date when the reader says they have not bought yet", () => {
    const bought = ans({ zip: "97204", state: "OR", timing: "bought", purchaseDate: "2026-09-01" });
    expect(pruneHiddenAnswers({ ...bought, timing: "soon" }).purchaseDate).toBe("");
  });

  it("leaves a still-visible answer alone", () => {
    const a = ans({ zip: "97204", state: "OR", condition: "new", fuel: "bev", income: "under", dependent: "no" });
    const pruned = pruneHiddenAnswers(a);
    expect(pruned.dependent).toBe("no");
    expect(pruned.fuel).toBe("bev");
    expect(pruned.zip).toBe("97204");
  });
});

/* ── freshness ──────────────────────────────────────────────────────────── */

describe("Freshness", () => {
  it("reports staleness rather than hiding it", () => {
    expect(evaluate(ans({ zip: "97204" }), "2026-08-19").staleDays).toBe(0);
    expect(evaluate(ans({ zip: "97204" }), "2026-12-01").staleDays).toBe(104);
    expect(evaluate(ans({ zip: "97204" }), "2026-08-19").verifiedAt).toBe(RULES_VERIFIED_AT);
  });

  it("keeps the poverty-guideline table empty until it can be verified", () => {
    // An unpopulated table must never produce a dollar threshold.
    expect(FPG_400).toBeNull();
  });
});
