// Turns a swallowed Supabase read failure into a real, visible error.
//
// Every CMS fetcher used to end with `if (error || !data) return []`, which made
// four very different situations look identical to the site:
//   • the network is down           • the anon key was rotated/revoked
//   • an RLS policy now denies us    • the table is genuinely empty
//
// Worse, returning instead of throwing meant the promise RESOLVED, so React
// Query never retried and `isError` was never true — the site quietly served
// stale static content and nobody found out.
//
// Throwing restores both retries and diagnosability. Callers still degrade
// gracefully: the hooks fall back to the curated static arrays when a query has
// no data, so a failed read shows the built-in content rather than an empty page.

interface SupabaseLikeError {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
}

/**
 * Log and build the Error to throw for a failed CMS read. Pass the table or
 * setting being read so the console line says which one broke.
 */
export function cmsError(where: string, error: SupabaseLikeError | null | undefined): Error {
  const parts = [error?.message, error?.details, error?.hint].filter(Boolean);
  const detail = parts.length ? parts.join(" — ") : "unknown error";
  const code = error?.code ? ` [${error.code}]` : "";
  const msg = `CMS read failed for ${where}${code}: ${detail}`;
  // Deliberately console.error, not warn: this is a real outage signal, and it
  // was previously invisible.
  console.error(`[cms] ${msg}`, error);
  return new Error(msg);
}
