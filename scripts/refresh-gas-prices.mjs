#!/usr/bin/env node
// Re-baseline the static gasoline fallback in src/data/state-energy-rates.ts
// from the same AAA feed the site serves live.
//
// Why this exists: pages prefer the live feed, but every calculator falls back
// to that table when the feed is unreachable. The table had drifted ~22% low,
// so the fallback silently understated every savings figure the site quotes.
// Hand-maintained numbers rot; this makes re-baselining one command.
//
//   node scripts/refresh-gas-prices.mjs            rewrite the table
//   node scripts/refresh-gas-prices.mjs --check    report drift, write nothing
//   node scripts/refresh-gas-prices.mjs --check --max-drift 5
//
// --check exits 1 when drift exceeds the threshold, so a cron or CI job can use
// it as an alarm. Electricity rates are never touched: they come from EIA, not
// this feed.

import { readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve } from "node:path";

const ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const TABLE = resolve(ROOT, "src/data/state-energy-rates.ts");

const args = process.argv.slice(2);
const checkOnly = args.includes("--check");
// `Number(x) || 5` would quietly turn an explicit `--max-drift 0` into 5.
const driftArg = args.indexOf("--max-drift");
const driftRaw = driftArg === -1 ? undefined : args[driftArg + 1];
const maxDrift = driftRaw !== undefined && Number.isFinite(Number(driftRaw)) ? Number(driftRaw) : 5; // percent
const EXPECTED_STATES = 51; // 50 + DC
const SANE_RANGE = [1.5, 12]; // $/gal; anything outside means a broken feed

function feedUrl() {
  if (process.env.VITE_GAS_PRICES_URL) return process.env.VITE_GAS_PRICES_URL;
  for (const f of [".env.production", ".env.local"]) {
    try {
      const m = readFileSync(resolve(ROOT, f), "utf8").match(/^VITE_GAS_PRICES_URL=(.+)$/m);
      if (m) return m[1].trim();
    } catch {
      /* file absent — try the next one */
    }
  }
  throw new Error("No VITE_GAS_PRICES_URL in env, .env.production or .env.local");
}

/** Reject a feed that parsed but is not usable, rather than writing garbage. */
function validate(feed) {
  const prices = feed?.prices;
  if (!prices || typeof prices !== "object") throw new Error("feed has no `prices` object");
  const codes = Object.keys(prices);
  if (codes.length !== EXPECTED_STATES) {
    throw new Error(`feed carries ${codes.length} states, expected ${EXPECTED_STATES}`);
  }
  for (const [code, v] of Object.entries(prices)) {
    if (typeof v !== "number" || !Number.isFinite(v) || v < SANE_RANGE[0] || v > SANE_RANGE[1]) {
      throw new Error(`implausible price for ${code}: ${v}`);
    }
  }
  return prices;
}

const median = (nums) => {
  const s = [...nums].sort((a, b) => a - b);
  const mid = s.length >> 1;
  return s.length % 2 ? s[mid] : (s[mid - 1] + s[mid]) / 2;
};
const mean = (nums) => nums.reduce((a, b) => a + b, 0) / nums.length;
const pct = (from, to) => (from === 0 ? Infinity : ((to - from) / from) * 100);

/**
 * The feed sits behind an n8n proxy that intermittently refuses a connection.
 * A transient network blip must not read as "prices are fine" or as a drift
 * alarm, so failures here exit 2 and are reported separately from drift.
 */
async function fetchFeed(url, attempts = 3) {
  let last;
  for (let i = 1; i <= attempts; i++) {
    try {
      const res = await fetch(url, { signal: AbortSignal.timeout(20_000) });
      if (!res.ok) throw new Error(`feed responded ${res.status}`);
      return await res.json();
    } catch (err) {
      last = err;
      const why = err?.cause?.code ?? err?.message ?? String(err);
      console.error(`  attempt ${i}/${attempts} failed: ${why}`);
      if (i < attempts) await new Promise((r) => setTimeout(r, 2000 * i));
    }
  }
  throw last;
}

const EXIT_DRIFT = 1;
const EXIT_UNAVAILABLE = 2;

const url = feedUrl();
let feed;
let live;
try {
  feed = await fetchFeed(url);
  live = validate(feed);
} catch (err) {
  console.error(`\nCould not read the gas-price feed: ${err?.message ?? err}`);
  console.error("Nothing was written. This is a feed/network problem, not price drift.");
  process.exit(EXIT_UNAVAILABLE);
}

let src = readFileSync(TABLE, "utf8");
const current = {};
const ROW = /^(\s*)([A-Z]{2}): \{ name: "([^"]+)", electricityCentsPerKwh: ([0-9.]+), gasPricePerGallon: ([0-9.]+) \},$/gm;

const rewritten = src.replace(ROW, (line, indent, code, name, kwh, oldGas) => {
  current[code] = Number(oldGas);
  const next = Math.round(live[code] * 100) / 100;
  if (live[code] === undefined) return line; // validated above, but never guess
  return `${indent}${code}: { name: "${name}", electricityCentsPerKwh: ${kwh}, gasPricePerGallon: ${next.toFixed(2)} },`;
});

const codes = Object.keys(current);
if (codes.length !== EXPECTED_STATES) {
  throw new Error(`parsed ${codes.length} rows from the table, expected ${EXPECTED_STATES}`);
}

const oldVals = codes.map((c) => current[c]);
const newVals = codes.map((c) => Math.round(live[c] * 100) / 100);
const medianDrift = pct(median(oldVals), median(newVals));
const worst = codes
  .map((c) => ({ code: c, from: current[c], to: Math.round(live[c] * 100) / 100 }))
  .map((d) => ({ ...d, drift: pct(d.from, d.to) }))
  .sort((a, b) => Math.abs(b.drift) - Math.abs(a.drift));

const asOf = (feed.updatedAt ?? new Date().toISOString()).slice(0, 10);
console.log(`feed:    ${url}`);
console.log(`updated: ${feed.updatedAt ?? "(no timestamp)"}  source: ${feed.source ?? "?"}`);
console.log(`static median ${median(oldVals).toFixed(2)} -> live ${median(newVals).toFixed(2)}  (${medianDrift >= 0 ? "+" : ""}${medianDrift.toFixed(1)}%)`);
console.log(`static mean   ${mean(oldVals).toFixed(2)} -> live ${mean(newVals).toFixed(2)}`);
console.log("largest per-state drift:");
for (const d of worst.slice(0, 5)) {
  console.log(`  ${d.code} ${d.from.toFixed(2)} -> ${d.to.toFixed(2)}  (${d.drift >= 0 ? "+" : ""}${d.drift.toFixed(1)}%)`);
}

if (checkOnly) {
  const over = Math.abs(medianDrift) > maxDrift;
  console.log(over
    ? `\nDRIFT ${Math.abs(medianDrift).toFixed(1)}% exceeds ${maxDrift}% — run npm run gas:refresh to re-baseline.`
    : `\nWithin ${maxDrift}%. No action needed.`);
  process.exit(over ? EXIT_DRIFT : 0);
}

const stamped = rewritten.replace(
  /export const GAS_PRICES_AS_OF = "[^"]*";/,
  `export const GAS_PRICES_AS_OF = "${asOf}";`
);
if (stamped === rewritten && !/GAS_PRICES_AS_OF/.test(rewritten)) {
  throw new Error("GAS_PRICES_AS_OF constant missing from the table — refusing to write an unstamped file");
}

writeFileSync(TABLE, stamped);
console.log(`\nRewrote ${EXPECTED_STATES} states in src/data/state-energy-rates.ts, stamped ${asOf}.`);
console.log("Electricity rates untouched. Review the diff, run the tests, then commit.");
