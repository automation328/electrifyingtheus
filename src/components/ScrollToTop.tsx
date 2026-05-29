import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top of the page on every route (pathname) change. Without
 * this, react-router keeps the previous scroll offset, so navigating to a long
 * page (e.g. the EV-vs-gas calculator) from a scrolled-down section lands you
 * mid-page. Keyed on pathname only — search-param updates (the calculator
 * mirrors its state into the URL) must NOT trigger a scroll. In-page hash
 * anchors are left to the browser's native behavior.
 */
const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) return;
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
