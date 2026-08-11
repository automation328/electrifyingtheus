// Protects unsaved editor work.
//
// Scope, and why: react-router's useBlocker needs a DATA router
// (createBrowserRouter). This app mounts <BrowserRouter> (src/App.tsx), so
// blocking in-app navigation would mean converting the whole route tree — a far
// larger change than this problem warrants. So the split is:
//
//   • useUnsavedGuard(dirty)  — browser-level: refresh, tab close, back button.
//   • confirmDiscard(dirty)   — call it in the handlers that intentionally throw
//                               work away (Cancel, close, backdrop click).
//
// Together these cover every path an editor actually loses work through today,
// except in-app <Link> navigation, which stays unguarded until the router moves.

import { useEffect } from "react";

/** Warn before the browser unloads while there are unsaved changes. */
export function useUnsavedGuard(dirty: boolean): void {
  useEffect(() => {
    if (!dirty) return;
    const onBeforeUnload = (e: BeforeUnloadEvent) => {
      // Browsers ignore custom text and show their own wording; both lines are
      // required for the prompt to appear across engines.
      e.preventDefault();
      e.returnValue = "";
    };
    window.addEventListener("beforeunload", onBeforeUnload);
    return () => window.removeEventListener("beforeunload", onBeforeUnload);
  }, [dirty]);
}

/**
 * Ask before discarding unsaved edits. Returns true when it is safe to proceed
 * (nothing unsaved, or the editor confirmed). Use it to gate Cancel/close:
 *
 *   if (!confirmDiscard(dirty)) return;
 */
export function confirmDiscard(dirty: boolean, what = "your unsaved changes"): boolean {
  if (!dirty) return true;
  return window.confirm(`Discard ${what}? This can't be undone.`);
}
