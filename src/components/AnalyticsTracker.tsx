// Drives first-party analytics: a pageview on every route change (with a
// once-per-session flag for the Slack alert) and a single delegated click
// listener that auto-captures CTAs, buttons, and outbound links. Renders nothing.
//
// To label a click explicitly, add data-track="My Label" to any element; the
// listener prefers that over derived text.

import { useEffect, useRef } from "react";
import { useLocation } from "react-router-dom";
import { trackPageview, trackClick, isFirstOfSession } from "@/lib/analytics";

function deriveLabel(el: Element): string | null {
  const tracked = el.closest<HTMLElement>("[data-track]");
  if (tracked) return tracked.getAttribute("data-track");

  const target = el.closest<HTMLElement>("a, button, [role='button']");
  if (!target) return null;

  const aria = target.getAttribute("aria-label");
  const text = (target.textContent || "").replace(/\s+/g, " ").trim();

  if (target instanceof HTMLAnchorElement && target.href) {
    try {
      const url = new URL(target.href);
      const external = url.hostname && !url.hostname.includes("electrifyingtheus") && url.protocol.startsWith("http");
      if (external) return `outbound: ${url.hostname.replace(/^www\./, "")}${text ? ` (${text.slice(0, 40)})` : ""}`;
    } catch { /* ignore malformed href */ }
  }
  return (aria || text || null)?.slice(0, 100) ?? null;
}

const AnalyticsTracker = () => {
  const { pathname, search } = useLocation();
  const firstRef = useRef<boolean | null>(null);

  // The internal dashboard shouldn't track itself.
  const isAdmin = pathname.startsWith("/admin");

  // Pageview on each route change. The very first one in a session carries the
  // notify flag so the server fires exactly one Slack alert per visit.
  useEffect(() => {
    if (isAdmin) return;
    if (firstRef.current === null) firstRef.current = isFirstOfSession();
    const notify = firstRef.current;
    firstRef.current = false;
    trackPageview(notify);
  }, [pathname, search, isAdmin]);

  // One delegated listener for all clicks. Capture phase so it still records when
  // the handler navigates away.
  useEffect(() => {
    if (isAdmin) return;
    const onClick = (e: MouseEvent) => {
      const t = e.target as Element | null;
      if (!t) return;
      const label = deriveLabel(t);
      if (label) trackClick(label);
    };
    document.addEventListener("click", onClick, { capture: true });
    return () => document.removeEventListener("click", onClick, { capture: true });
  }, [isAdmin]);

  return null;
};

export default AnalyticsTracker;
