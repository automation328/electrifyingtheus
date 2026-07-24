import { useEffect } from "react";

/**
 * Wires up a tool rendered in embed mode (`?embed=1`):
 *
 *   1. Tags <html> with `.embed` so CSS can strip the site's themed backdrop
 *      (glass gradient mesh, atmospheric glows, film grain) and leave only the
 *      tool on a clean white surface — so it drops cleanly onto any host page.
 *   2. Continuously posts the document height to the host window so the parent
 *      iframe can auto-resize with the content (no inner scrollbar). Pairs with
 *      the tiny listener in the published embed snippet, which reads
 *      `{ type: "etu-embed-size", height }` messages.
 */
export function useEmbedFrame(enabled: boolean) {
  useEffect(() => {
    if (!enabled || typeof window === "undefined") return;

    const html = document.documentElement;
    html.classList.add("embed");

    const post = () => {
      const height = Math.ceil(
        Math.max(
          html.scrollHeight,
          document.body?.scrollHeight ?? 0,
          html.offsetHeight,
        ),
      );
      window.parent?.postMessage({ type: "etu-embed-size", height }, "*");
    };

    post();
    const ro = new ResizeObserver(post);
    ro.observe(html);
    if (document.body) ro.observe(document.body);
    window.addEventListener("load", post);
    // Re-post while fonts / images / live data settle over the first seconds.
    const iv = window.setInterval(post, 500);
    const stop = window.setTimeout(() => window.clearInterval(iv), 5000);

    return () => {
      ro.disconnect();
      window.removeEventListener("load", post);
      window.clearInterval(iv);
      window.clearTimeout(stop);
      html.classList.remove("embed");
    };
  }, [enabled]);
}
