// Aggregates real openings from EV companies' public ATS job boards (Greenhouse,
// Lever, Ashby) and returns them normalized for the Careers page. These ATS APIs
// are public JSON (no auth), so this is reliable structured data — no scraping.
//
// Configure boards via env JOB_BOARDS (comma- or newline-separated), each entry:
//   provider:token            e.g. greenhouse:rivian
//   provider:token:Company    e.g. lever:chargepoint:ChargePoint   (display name override)
// Supported providers: greenhouse | lever | ashby
//
// Example:
//   JOB_BOARDS=greenhouse:rivian,greenhouse:lucidmotors,lever:chargepoint,ashby:wallbox

interface Job {
  title: string;
  company: string;
  department: string;
  location: string;
  type: string;
  description: string;
  url: string;
}

const titleCase = (s: string) =>
  s.replace(/[-_]+/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

const US_STATES = new Set([
  "AL", "AK", "AZ", "AR", "CA", "CO", "CT", "DE", "DC", "FL", "GA", "HI", "ID",
  "IL", "IN", "IA", "KS", "KY", "LA", "ME", "MD", "MA", "MI", "MN", "MS", "MO",
  "MT", "NE", "NV", "NH", "NJ", "NM", "NY", "NC", "ND", "OH", "OK", "OR", "PA",
  "RI", "SC", "SD", "TN", "TX", "UT", "VT", "VA", "WA", "WV", "WI", "WY",
]);

// Keep US-based (or remote) roles — this is "Electrifying the US". Matches a
// trailing ", XX" US state code, "Remote", or an explicit US/USA mention.
const isUS = (loc: string): boolean => {
  const s = String(loc || "");
  if (/\bremote\b/i.test(s) || /united states|\bU\.?S\.?A?\b/i.test(s)) return true;
  const m = s.match(/,\s*([A-Za-z]{2})\b/);
  return !!m && US_STATES.has(m[1].toUpperCase());
};

const strip = (html: string, n = 280) => {
  const text = String(html || "")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/&#39;|&rsquo;/g, "'")
    .replace(/&quot;/g, '"').replace(/\s+/g, " ").trim();
  return text.length > n ? `${text.slice(0, n).trimEnd()}…` : text;
};

async function fetchJson(url: string): Promise<any | null> {
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), 8000);
  try {
    const res = await fetch(url, { signal: ctrl.signal, headers: { Accept: "application/json", "User-Agent": "ElectrifyingTheUS/1.0" } });
    if (!res.ok) return null;
    return await res.json();
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

async function greenhouse(token: string, company: string): Promise<Job[]> {
  const data = await fetchJson(`https://boards-api.greenhouse.io/v1/boards/${token}/jobs?content=true`);
  const jobs = data?.jobs;
  if (!Array.isArray(jobs)) return [];
  return jobs.map((j: any) => ({
    title: j.title || "",
    company,
    department: j.departments?.[0]?.name || "EV Industry",
    location: j.location?.name || "See listing",
    type: "Full-time",
    description: strip(j.content),
    url: j.absolute_url || "",
  }));
}

async function lever(token: string, company: string): Promise<Job[]> {
  const data = await fetchJson(`https://api.lever.co/v0/postings/${token}?mode=json`);
  if (!Array.isArray(data)) return [];
  return data.map((j: any) => ({
    title: j.text || "",
    company,
    department: j.categories?.team || j.categories?.department || "EV Industry",
    location: j.categories?.location || j.workplaceType || "See listing",
    type: j.categories?.commitment || "Full-time",
    description: strip(j.descriptionPlain || j.description),
    url: j.hostedUrl || j.applyUrl || "",
  }));
}

async function ashby(token: string, company: string): Promise<Job[]> {
  const data = await fetchJson(`https://api.ashbyhq.com/posting-api/job-board/${token}?includeCompensation=false`);
  const jobs = data?.jobs;
  if (!Array.isArray(jobs)) return [];
  return jobs
    .filter((j: any) => j.isListed !== false)
    .map((j: any) => ({
      title: j.title || "",
      company,
      department: j.department || j.team || "EV Industry",
      location: j.location || j.locationName || "See listing",
      type: j.employmentType ? titleCase(j.employmentType) : "Full-time",
      description: strip(j.descriptionPlain || j.descriptionHtml),
      url: j.jobUrl || j.applyUrl || "",
    }));
}

function parseEntry(entry: string): { provider: string; token: string; company: string } | null {
  const parts = entry.split(":").map((s) => s.trim());
  const provider = (parts[0] || "").toLowerCase();
  const token = parts[1] || "";
  if (!provider || !token) return null;
  const company = parts.slice(2).join(":") || titleCase(token);
  return { provider, token, company };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default async function handler(req: any, res: any) {
  if (req.method !== "GET") { res.status(405).json({ error: "Method not allowed" }); return; }

  const entries = (process.env.JOB_BOARDS ?? "")
    .split(/[\n,]/).map((s) => s.trim()).filter(Boolean)
    .map(parseEntry).filter(Boolean) as Array<{ provider: string; token: string; company: string }>;

  if (entries.length === 0) {
    res.setHeader("Cache-Control", "public, s-maxage=3600");
    res.status(200).json({ jobs: [] });
    return;
  }

  try {
    const results = await Promise.all(entries.map((e) => {
      if (e.provider === "greenhouse") return greenhouse(e.token, e.company);
      if (e.provider === "lever") return lever(e.token, e.company);
      if (e.provider === "ashby") return ashby(e.token, e.company);
      return Promise.resolve([] as Job[]);
    }));

    // Cap each company so one large board doesn't crowd out the others, and keep
    // US/remote roles only. Then dedupe and apply an overall cap.
    const CAP_PER_BOARD = 40;
    const seen = new Set<string>();
    const jobs = results
      .map((arr) => arr.filter((j) => j.title && j.url && isUS(j.location)).slice(0, CAP_PER_BOARD))
      .flat()
      .filter((j) => { const k = `${j.company}|${j.title}|${j.location}`; if (seen.has(k)) return false; seen.add(k); return true; })
      .slice(0, 120);

    // Cache at the CDN — job boards change slowly. 1h fresh, serve-stale 6h.
    res.setHeader("Cache-Control", "public, s-maxage=3600, stale-while-revalidate=21600");
    res.status(200).json({ jobs });
  } catch (err) {
    console.error("jobs feed error", err);
    res.status(502).json({ error: "Couldn't load the jobs feed.", jobs: [] });
  }
}
