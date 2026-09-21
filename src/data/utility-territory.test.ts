import { describe, it, expect } from "vitest";
import { utilityForZip, utilityServesZip } from "./utility-territory";
import { incentivesFor, utilityIncentivesFor, forTerritory, type Incentive } from "./incentives";

// The complaint this answers: entering 90012 — downtown Los Angeles — listed
// five PG&E rebates and no LADWP ones. PG&E's own territory statement runs
// "from Eureka in the north to Bakersfield in the south"; Los Angeles is about
// a hundred miles past the end of it.

describe("utilityForZip", () => {
  it("places the City of Los Angeles with LADWP", () => {
    expect(utilityForZip("90012")).toBe("ladwp"); // Civic Center
    expect(utilityForZip("90026")).toBe("ladwp"); // Echo Park
    expect(utilityForZip("91601")).toBe("ladwp"); // North Hollywood
    expect(utilityForZip("90731")).toBe("ladwp"); // San Pedro
  });

  it("places San Diego with SDG&E and Sacramento with SMUD", () => {
    expect(utilityForZip("92101")).toBe("sdge");
    expect(utilityForZip("95814")).toBe("smud");
  });

  it("admits when it does not know", () => {
    expect(utilityForZip("94110")).toBeUndefined(); // San Francisco — PG&E, but not claimed here
    expect(utilityForZip("30080")).toBeUndefined(); // Georgia
    expect(utilityForZip("")).toBeUndefined();
    expect(utilityForZip("9001")).toBeUndefined();
  });
});

describe("utilityServesZip", () => {
  it("rules PG&E out of southern California", () => {
    expect(utilityServesZip("pge", "90012")).toBe(false); // Los Angeles
    expect(utilityServesZip("pge", "92101")).toBe(false); // San Diego
    expect(utilityServesZip("pge", "92501")).toBe(false); // Riverside
  });

  it("leaves PG&E alone where it does run", () => {
    expect(utilityServesZip("pge", "94110")).toBe(true); // San Francisco
    expect(utilityServesZip("pge", "93301")).toBe(true); // Bakersfield, its southern edge
    expect(utilityServesZip("pge", "95401")).toBe(true); // Santa Rosa
    expect(utilityServesZip("pge", "93901")).toBe(true); // Salinas
  });

  it("excludes the municipal utilities inside PG&E country", () => {
    // These are the cases a ZIP-prefix rule gets wrong: California addresses,
    // surrounded by PG&E, billed by someone else.
    expect(utilityServesZip("pge", "95814")).toBe(false); // Sacramento — SMUD
    expect(utilityServesZip("pge", "95050")).toBe(false); // Santa Clara — Silicon Valley Power
    expect(utilityServesZip("pge", "94301")).toBe(false); // Palo Alto — city utility
    expect(utilityServesZip("pge", "94501")).toBe(false); // Alameda — Alameda Municipal Power
    expect(utilityServesZip("pge", "95350")).toBe(false); // Modesto — MID
  });

  it("stays quiet outside California, where the list says nothing", () => {
    expect(utilityServesZip("pge", "30080")).toBeUndefined();
    expect(utilityServesZip("pge", "10001")).toBeUndefined();
  });

  it("keeps the single-city utilities inside their city", () => {
    expect(utilityServesZip("ladwp", "90012")).toBe(true);
    expect(utilityServesZip("ladwp", "94110")).toBe(false);
    expect(utilityServesZip("smud", "95814")).toBe(true);
    expect(utilityServesZip("smud", "90012")).toBe(false);
  });

  it("says nothing about a ZIP it cannot place", () => {
    expect(utilityServesZip("pge", "")).toBeUndefined();
    expect(utilityServesZip("sce", "94110")).toBeUndefined();
  });
});

describe("what a Los Angeles ZIP is offered", () => {
  const namesFor = (zip: string) =>
    (["vehicle", "charging", "perks"] as const)
      .flatMap((cat) => incentivesFor("CA", cat, zip))
      .concat(utilityIncentivesFor("CA", zip))
      .map((i) => i.name);

  it("shows LADWP programmes and no PG&E ones for 90012", () => {
    const names = namesFor("90012");
    expect(names).toContain("Used EV Rebate");
    expect(names).toContain("Home EV Charger Rebate");
    expect(names).toContain("EV Rate Discount");
    expect(names.filter((n) => /PG&E|Pre-Owned Electric Vehicle Rebate|V2X/.test(n))).toEqual([]);
  });

  it("still shows the statewide programmes", () => {
    // Filtering by utility must not cost a Californian their state rebates.
    expect(namesFor("90012")).toContain("Clean Cars for All");
    expect(namesFor("90012").length).toBeGreaterThan(8);
  });

  it("gives a San Francisco ZIP the PG&E programmes and not LADWP's", () => {
    const names = namesFor("94110");
    expect(names).toContain("Pre-Owned Electric Vehicle Rebate Program");
    expect(names).toContain("PG&E Empower EV");
    expect(names).not.toContain("Used EV Rebate");
  });

  it("changes nothing when the ZIP is unknown", () => {
    const withZip = incentivesFor("CA", "vehicle", undefined).map((i) => i.name);
    const bare = incentivesFor("CA", "vehicle").map((i) => i.name);
    expect(withZip).toEqual(bare);
    // Every utility programme is still on offer, because nothing ruled one out.
    expect(bare).toContain("Pre-Owned Electric Vehicle Rebate Program");
    expect(bare).toContain("Used EV Rebate");
  });
});

describe("forTerritory", () => {
  const item = (name: string, utility?: Incentive["utility"]): Incentive =>
    ({ name, jurisdiction: "x", desc: "d", link: "l", utility });

  it("keeps everything without a utility", () => {
    const items = [item("federal"), item("state")];
    expect(forTerritory(items, "90012")).toEqual(items);
  });

  it("drops only the utilities ruled out", () => {
    const items = [item("state"), item("pge one", "pge"), item("ladwp one", "ladwp")];
    expect(forTerritory(items, "90012").map((i) => i.name)).toEqual(["state", "ladwp one"]);
  });
});
