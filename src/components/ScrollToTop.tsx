import { useEffect } from "react";
import { useLocation } from "react-router-dom";

/**
 * Scrolls to the top of the page on every route (pathname) change. Without
 * this, react-router keeps the previous scroll offset, so navigating to a long
 * page (e.g. the EV-vs-gas calculator) from a scrolled-down section lands you
 * mid-page. Keyed on pathname only — search-param updates (the calculator
 * mirrors its state into the URL) must NOT trigger a scroll.
 *
 * When the URL carries a hash (e.g. /#agent-chat from another page), scroll to
 * that element instead — retrying briefly because the SPA content mounts after
 * navigation, so the target may not exist on the first tick. A fixed-navbar
 * offset keeps the section from hiding under the header.
 */
const NAV_OFFSET = 90;

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();

  useEffect(() => {
    if (hash) {
      const id = hash.slice(1);
      let tries = 0;
      let timer: number;
      const tryScroll = () => {
        const el = document.getElementById(id);
        if (el) {
          const top = el.getBoundingClientRect().top + window.scrollY - NAV_OFFSET;
          window.scrollTo({ top, left: 0, behavior: "smooth" });
          return;
        }
        if (tries++ < 25) timer = window.setTimeout(tryScroll, 100);
      };
      timer = window.setTimeout(tryScroll, 50);
      return () => window.clearTimeout(timer);
    }
    window.scrollTo({ top: 0, left: 0, behavior: "auto" });
  }, [pathname, hash]);

  return null;
};

export default ScrollToTop;
