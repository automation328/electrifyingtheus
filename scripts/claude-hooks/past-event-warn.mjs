#!/usr/bin/env node
// Claude Code PostToolUse hook: warns when an edit to the event data adds an
// event whose last day is already over. Such an event never shows on the site
// (useEvents keeps only isActive events) and the daily archive sweep files its
// row away, so adding one is almost always a mistake. See
// .claude/skills/event-archive/SKILL.md.
//
// Never blocks: it only hands Claude a note. Run `node past-event-warn.mjs
// --self-test` to check the date parsing.

const MONTHS = { JAN: 1, FEB: 2, MAR: 3, APR: 4, MAY: 5, JUN: 6, JUL: 7, AUG: 8, SEP: 9, OCT: 10, NOV: 11, DEC: 12 };
const pad = (n) => String(n).padStart(2, "0");

/** Today in Honolulu, the westernmost US zone — the same "today" the sweep uses. */
export const todayHonolulu = () =>
  new Intl.DateTimeFormat("en-CA", { timeZone: "Pacific/Honolulu" }).format(new Date());

/** Last days (ISO) of events found in `text` that are before `today`. */
export function pastDates(text, file, today) {
  const out = [];
  if (/src[\\/]data[\\/]events\.ts$/.test(file)) {
    // Curated entries: month: "JUL", day: "29", year: 2026 … endDate: "2026-07-30"
    const re = /month:\s*"([A-Z]{3})",\s*day:\s*"(\d{1,2})",\s*year:\s*(\d{4})/g;
    const hits = [...text.matchAll(re)];
    hits.forEach((m, i) => {
      const mo = MONTHS[m[1]];
      if (!mo) return;
      const start = `${m[3]}-${pad(mo)}-${pad(m[2])}`;
      const until = hits[i + 1]?.index ?? text.length;
      const end = text.slice(m.index, until).match(/endDate:\s*"(\d{4}-\d{2}-\d{2})"/)?.[1];
      const last = end && end >= start ? end : start;
      if (last < today) out.push(last);
    });
  } else if (/supabase[\\/]migrations[\\/].*\.sql$/.test(file) && /site_events/i.test(text)) {
    // Event seeds: any quoted ISO date. Coarse on purpose — a past date in an
    // events migration is worth a second look either way.
    for (const m of text.matchAll(/'(\d{4}-\d{2}-\d{2})'/g)) if (m[1] < today) out.push(m[1]);
  }
  return [...new Set(out)];
}

if (process.argv.includes("--self-test")) {
  const f = "src/data/events.ts";
  const t = "2026-11-13";
  const eq = (a, b) => { if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${JSON.stringify(a)} != ${JSON.stringify(b)}`); };
  eq(pastDates('month: "JUL", day: "29", year: 2026,', f, t), ["2026-07-29"]);
  eq(pastDates('month: "DEC", day: "1", year: 2026,', f, t), []);
  eq(pastDates('month: "NOV", day: "12", year: 2026, endDate: "2026-11-14",', f, t), []);
  eq(pastDates('month: "NOV", day: "12", year: 2026,', "src/other.ts", t), []);
  eq(pastDates('month: "JUL", day: "29", year: 2026,', String.raw`H:\Projects\Electrifying the US\src\data\events.ts`, t), ["2026-07-29"]);
  eq(pastDates("insert into site_events values ('2026-01-05')", "supabase/migrations/0040_x.sql", t), ["2026-01-05"]);
  console.log("ok");
  process.exit(0);
}

let raw = "";
process.stdin.on("data", (d) => (raw += d)).on("end", () => {
  try {
    const { tool_input: input = {} } = JSON.parse(raw || "{}");
    const file = String(input.file_path ?? "");
    const text = [input.new_string, input.content, ...(input.edits ?? []).map((e) => e.new_string)]
      .filter(Boolean).join("\n");
    const past = pastDates(text, file, todayHonolulu());
    if (!past.length) return;
    process.stdout.write(JSON.stringify({
      hookSpecificOutput: {
        hookEventName: "PostToolUse",
        additionalContext:
          `Event archive check: this edit to ${file} has event date(s) already over: ${past.join(", ")}. ` +
          "Past events never show on the site and the daily sweep archives their rows. " +
          "Confirm the date is right, or tell the user the event will not appear. See the event-archive skill.",
      },
    }));
  } catch {
    // A hook must never break an edit.
  }
});
