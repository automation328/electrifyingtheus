// A code chunk can fail to download: Vercel sometimes answers a large asset
// with a 503, and a tab opened before a deploy asks for chunk names that no
// longer exist. Without this the page stays blank. Retry the import, then
// reload the page once (a reload fetches the current index.html and its
// chunks), and only then give up to the caller.

const RELOAD_KEY = "chunk-reload-at";
const RELOAD_WINDOW_MS = 60_000;

/** Reloads the page unless it already did so in the last minute. Returns true if it reloads. */
export function reloadOnce(): boolean {
  try {
    const last = Number(sessionStorage.getItem(RELOAD_KEY) || 0);
    if (Date.now() - last < RELOAD_WINDOW_MS) return false;
    sessionStorage.setItem(RELOAD_KEY, String(Date.now()));
  } catch {
    // No sessionStorage (private mode, blocked): we can't tell if we already reloaded, so don't loop.
    return false;
  }
  window.location.reload();
  return true;
}

export async function importWithRetry<T>(load: () => Promise<T>, tries = 3, delayMs = 600): Promise<T> {
  for (let attempt = 1; ; attempt++) {
    try {
      return await load();
    } catch (err) {
      if (attempt < tries) {
        await new Promise((r) => setTimeout(r, delayMs * attempt));
        continue;
      }
      // Wait for the reload instead of rendering an error that would flash first.
      if (reloadOnce()) return new Promise<T>(() => {});
      throw err;
    }
  }
}
