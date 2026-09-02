// Job title, department and industry, as REAL GoHighLevel contact fields.
//
// Every profile form on the site asks for these three, and until now they only
// ever reached GHL inside the best-effort note — which is skipped entirely
// unless GHL_USER_ID is set. So on a location without that env var, three of the
// fields a visitor is required to fill in existed nowhere in the CRM: not
// filterable, not searchable, not usable in a workflow.
//
// GHL has no standard contact field for any of them, so they have to go through
// custom fields, which are identified by an id that differs per location. Rather
// than making the deploy carry three more secrets, we look the ids up once from
// the location itself and match on the field key (or, failing that, the field's
// name). An explicit env var still wins when a location names its fields
// something we would not guess.
//
// Everything here fails soft: no custom fields configured, a listing call that
// errors, a location we cannot read — all end with the contact upserting exactly
// as it did before, and the note still carries the values as text.

/** The three fields this module resolves. */
export type CustomFieldName = "title" | "department" | "industry";

/** What GHL's custom-field listing returns, narrowed to what we read. */
export interface GhlCustomField {
  id: string;
  name?: string;
  fieldKey?: string;
}

export type CustomFieldIds = Partial<Record<CustomFieldName, string>>;

// Field keys GHL is likely to use, most specific first. A location may prefix
// with "contact." or not, and "title" is commonly created as "Job Title".
const KEY_CANDIDATES: Record<CustomFieldName, string[]> = {
  title: ["contact.title", "contact.job_title", "contact.jobtitle", "title", "job_title"],
  department: ["contact.department", "department"],
  industry: ["contact.industry", "industry"],
};

// Fallback when no key matches: the human name an editor typed in GHL.
const NAME_CANDIDATES: Record<CustomFieldName, string[]> = {
  title: ["title", "job title"],
  department: ["department"],
  industry: ["industry"],
};

const norm = (v: string | undefined) => (v ?? "").trim().toLowerCase();

/**
 * Match a location's custom fields to our three, id first.
 *
 * `overrides` are ids read straight from the environment (GHL_CF_TITLE etc.) —
 * they skip matching entirely, which is the escape hatch for a location whose
 * fields are named in a way no heuristic would find.
 */
export function pickCustomFieldIds(
  fields: GhlCustomField[],
  overrides: CustomFieldIds = {},
): CustomFieldIds {
  const out: CustomFieldIds = {};
  const named = (Object.keys(KEY_CANDIDATES) as CustomFieldName[]);

  for (const name of named) {
    const override = (overrides[name] ?? "").trim();
    if (override) { out[name] = override; continue; }

    const byKey = KEY_CANDIDATES[name]
      .map((k) => fields.find((f) => f.id && norm(f.fieldKey) === k))
      .find(Boolean);
    if (byKey) { out[name] = byKey.id; continue; }

    const byName = fields.find(
      (f) => f.id && NAME_CANDIDATES[name].includes(norm(f.name)),
    );
    if (byName) out[name] = byName.id;
  }
  return out;
}

/**
 * The `customFields` array for a contact upsert: one entry per field we both
 * resolved an id for AND have a value for. Empty values are dropped rather than
 * sent, for the same reason the standard fields are — a blank must never
 * overwrite what the CRM already knows about someone.
 */
export function buildCustomFields(
  ids: CustomFieldIds,
  values: Partial<Record<CustomFieldName, string>>,
): Array<{ id: string; value: string }> {
  const out: Array<{ id: string; value: string }> = [];
  for (const name of Object.keys(KEY_CANDIDATES) as CustomFieldName[]) {
    const id = ids[name];
    const value = (values[name] ?? "").trim();
    if (id && value) out.push({ id, value });
  }
  return out;
}

/** Ids read from the environment. Unset vars simply don't override anything. */
export function envOverrides(env: NodeJS.ProcessEnv = process.env): CustomFieldIds {
  return {
    title: env.GHL_CF_TITLE,
    department: env.GHL_CF_DEPARTMENT,
    industry: env.GHL_CF_INDUSTRY,
  };
}

// The listing is per-location and changes about as often as someone edits their
// CRM schema, so one lookup serves every request a warm function instance
// handles. A short TTL means a field created in GHL shows up without a redeploy.
const TTL_MS = 10 * 60 * 1000;
let cache: { ids: CustomFieldIds; at: number } | null = null;

/** Test seam — drops the memoised listing. */
export function resetCustomFieldCache(): void {
  cache = null;
}

/**
 * Resolve the three ids for a location, memoised.
 *
 * `ghl` is the caller's authenticated fetch wrapper, so this module carries no
 * key handling of its own. Any failure resolves to {} — the caller then sends no
 * customFields at all, which is exactly the previous behaviour.
 */
export async function customFieldIds(
  ghl: (path: string, init: Record<string, unknown>) => Promise<Response>,
  locationId: string,
  now: number = Date.now(),
): Promise<CustomFieldIds> {
  const overrides = envOverrides();
  // All three pinned by env: nothing to look up.
  if (overrides.title && overrides.department && overrides.industry) {
    return pickCustomFieldIds([], overrides);
  }
  if (cache && now - cache.at < TTL_MS) return cache.ids;

  try {
    const res = await ghl(`/locations/${locationId}/customFields`, { method: "GET" });
    if (!res.ok) throw new Error(`custom fields ${res.status}`);
    const data = await res.json();
    const fields: GhlCustomField[] = data?.customFields ?? data?.customField ?? [];
    const ids = pickCustomFieldIds(Array.isArray(fields) ? fields : [], overrides);
    cache = { ids, at: now };
    return ids;
  } catch {
    // Cache the miss too, so one unreachable listing doesn't add a failing
    // round-trip to every lead for the next ten minutes.
    cache = { ids: pickCustomFieldIds([], overrides), at: now };
    return cache.ids;
  }
}
