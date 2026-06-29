// First-party analytics beacon. Sends pageviews + tracked clicks to /api/track,
// which stores them in Supabase (and fires the once-per-session Slack alert).
// Fire-and-forget; never throws.

import { getLeadIdentity } from "@/lib/leadIdentity";

const VISITOR_KEY = "etu_visitor_id";  // persistent device id (localStorage)
const SESSION_KEY = "etu_session_id";  // per-tab session id (sessionStorage)

function uuid(): string {
  try {
    if (crypto?.randomUUID) return crypto.randomUUID();
  } catch { /* fall through */ }
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}

function getVisitorId(): string {
  try {
    let id = localStorage.getItem(VISITOR_KEY);
    if (!id) { id = uuid(); localStorage.setItem(VISITOR_KEY, id); }
    return id;
  } catch { return ""; }
}

function getSessionId(): string {
  try {
    let id = sessionStorage.getItem(SESSION_KEY);
    if (!id) { id = uuid(); sessionStorage.setItem(SESSION_KEY, id); }
    return id;
  } catch { return ""; }
}

function send(payload: Record<string, unknown>) {
  try {
    const id = getLeadIdentity();
    const body = JSON.stringify({
      ...payload,
      sessionId: getSessionId(),
      visitorId: getVisitorId(),
      firstName: id?.firstName || "",
      email: id?.email || "",
    });
    // sendBeacon survives navigation (key for outbound click tracking); fall back
    // to keepalive fetch where it's unavailable.
    if (navigator.sendBeacon) {
      navigator.sendBeacon("/api/track", new Blob([body], { type: "application/json" }));
    } else {
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body,
        keepalive: true,
      }).catch(() => { /* ignore */ });
    }
  } catch { /* never throw from a tracker */ }
}

/** Record a pageview. `notify` true once per session triggers the Slack alert. */
export function trackPageview(notify: boolean) {
  send({
    type: "pageview",
    path: window.location.pathname + window.location.search,
    referrer: document.referrer || "",
    notify,
  });
}

/** Record a click on a CTA / button / outbound link. */
export function trackClick(label: string) {
  const clean = (label || "").trim().slice(0, 200);
  if (!clean) return;
  send({
    type: "click",
    label: clean,
    path: window.location.pathname + window.location.search,
  });
}

/** True the first time it's called in a browser session (for the Slack alert). */
export function isFirstOfSession(): boolean {
  try {
    if (sessionStorage.getItem("etu_visit_tracked")) return false;
    sessionStorage.setItem("etu_visit_tracked", "1");
    return true;
  } catch {
    return true; // storage blocked — treat as first (may re-alert next load)
  }
}
