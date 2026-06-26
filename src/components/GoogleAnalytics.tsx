// Google Analytics 4 for the SPA. gtag.js auto-fires a page_view only on a hard
// load, so for client-side route changes we send page_view manually on every
// location change (including the first). The GA loader is injected once, the
// first time a render happens with a Measurement ID present.
//
// Gated on VITE_GA_MEASUREMENT_ID — with the env var unset (local dev, or before
// the ID is provisioned) this component does nothing and loads no scripts.

import { useEffect } from "react";
import { useLocation } from "react-router-dom";

const GA_ID = import.meta.env.VITE_GA_MEASUREMENT_ID;

declare global {
  interface Window {
    dataLayer: unknown[];
    gtag: (...args: unknown[]) => void;
  }
}

let injected = false;

function injectGa(id: string) {
  if (injected) return;
  injected = true;

  const s = document.createElement("script");
  s.async = true;
  s.src = `https://www.googletagmanager.com/gtag/js?id=${encodeURIComponent(id)}`;
  document.head.appendChild(s);

  window.dataLayer = window.dataLayer || [];
  window.gtag = function gtag() {
    // GA's canonical shim pushes the raw arguments object onto dataLayer.
    window.dataLayer.push(arguments);
  };
  window.gtag("js", new Date());
  // We emit page_view ourselves on each route change (below), so disable the
  // automatic initial page_view to avoid double-counting the landing page.
  window.gtag("config", id, { send_page_view: false });
}

const GoogleAnalytics = () => {
  const { pathname, search } = useLocation();

  useEffect(() => {
    if (!GA_ID) return;
    injectGa(GA_ID);
    window.gtag("event", "page_view", {
      page_path: pathname + search,
      page_location: window.location.href,
      page_title: document.title,
    });
  }, [pathname, search]);

  return null;
};

export default GoogleAnalytics;
