// Pings /api/track once per browser session on first load so a Slack alert fires
// for each visit (the server reads the IP + geo from request headers). Renders
// nothing; fire-and-forget so it never affects the page.

import { useEffect } from "react";

const VisitorTracker = () => {
  useEffect(() => {
    try {
      // One alert per browser session — avoids a Slack message on every click.
      if (sessionStorage.getItem("etu_visit_tracked")) return;
      sessionStorage.setItem("etu_visit_tracked", "1");
    } catch {
      /* private mode / storage blocked — proceed (may alert again next load) */
    }

    try {
      const payload = JSON.stringify({
        path: window.location.pathname + window.location.search,
        referrer: document.referrer || "",
      });
      void fetch("/api/track", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: payload,
        keepalive: true,
      }).catch(() => { /* ignore network errors */ });
    } catch {
      /* never throw from a tracker */
    }
  }, []);

  return null;
};

export default VisitorTracker;
