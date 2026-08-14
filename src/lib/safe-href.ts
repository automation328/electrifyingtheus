// Link-scheme allowlist for anything an EDITOR typed.
//
// This lived inside BlockView, where the builder's Button block needed it. The
// event page now takes a registration URL from an editor too — and hands it to
// window.open — so the check has to be reachable from both. Two copies of a
// security check are one copy that quietly stops matching the other.

/**
 * Only allow safe link schemes; block javascript:/data:/vbscript: hrefs (would
 * execute on click) and protocol-relative //host (silent off-site redirect).
 * Relative paths, #anchors, mailto:, tel:, and http(s): pass through.
 *
 * Returns "#" for anything rejected — a caller that needs to tell "rejected"
 * from "allowed" compares against that.
 */
export const safeHref = (href?: string): string => {
  const h = (href ?? "").trim();
  if (!h) return "#";
  if (/^\/\//.test(h.replace(/\\/g, "/"))) return "#"; // protocol-relative (incl. backslash forms)
  if (/^(\/|#|mailto:|tel:)/i.test(h)) return h;
  if (/^https?:\/\//i.test(h)) return h;
  return "#"; // reject javascript:, data:, vbscript:, and other unexpected schemes
};
