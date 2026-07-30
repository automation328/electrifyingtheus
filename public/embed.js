/**
 * Electrifying the US — embeddable tools loader.
 *
 * One-line embed for any site:
 *
 *   <script src="https://electrifyingtheus.com/embed.js"
 *           data-etu-tool="ev-vs-gas"></script>
 *
 * The script replaces itself with a full-width iframe of the chosen tool and
 * auto-resizes that iframe to the tool's full height (via the postMessage the
 * tool sends) so the whole tool is visible with NO inner scrollbar — the host
 * page scrolls normally instead.
 *
 * Attributes:
 *   data-etu-tool    required — one of the keys in TOOLS below
 *   data-etu-height  optional — initial px height before the tool reports its
 *                    real height (default 700); avoids a layout jump
 *   data-etu-query   optional — extra query string to preset the tool, e.g.
 *                    "state=CA&home=1" (do not include a leading "?")
 */
(function () {
  var ORIGIN = "https://electrifyingtheus.com";
  var TOOLS = {
    "ev-vs-gas": "/electricity-vs-gasoline",
    "gm-ev-vs-gas": "/gm-ev-vs-gas",
    "calculator": "/calculator",
    "find-a-charger": "/find-a-charger",
    "rebates": "/rebates-incentives",
    "assistant": "/assistant",
  };

  // The currently-executing <script> is the last one in the DOM at run time.
  var self = document.currentScript;
  if (!self || self.getAttribute("data-etu-init")) return;
  self.setAttribute("data-etu-init", "1");

  var tool = self.getAttribute("data-etu-tool");
  var path = TOOLS[tool];
  if (!path) {
    // eslint-disable-next-line no-console
    console.error(
      "[etu-embed] Unknown data-etu-tool:", tool,
      "— expected one of", Object.keys(TOOLS).join(", "),
    );
    return;
  }

  var initialHeight = parseInt(self.getAttribute("data-etu-height"), 10) || 700;
  var extra = self.getAttribute("data-etu-query") || "";

  // Auto-match the host page's font: this loader runs in the host document, so
  // it can read the host's computed font-family (which a cross-origin iframe
  // never could) and hand it to the tool. An explicit data-etu-font wins.
  // System / Google fonts match exactly; a host-only custom webfont passes its
  // name but the iframe falls back to the next family in the stack.
  var font = self.getAttribute("data-etu-font") || "";
  if (!font) {
    try { font = getComputedStyle(document.body).fontFamily || ""; } catch (e) { font = ""; }
  }

  var src = ORIGIN + path + "?embed=1" +
    (extra ? "&" + extra.replace(/^\?/, "") : "") +
    (font ? "&font=" + encodeURIComponent(font) : "");

  var frame = document.createElement("iframe");
  frame.src = src;
  frame.title = "Electrifying the US";
  frame.loading = "lazy";
  frame.setAttribute("scrolling", "no");
  frame.style.cssText =
    "border:0;width:100%;max-width:100%;display:block;height:" + initialHeight + "px;" +
    "transition:height .2s ease";

  // Insert the iframe where the script tag sits, then remove the script node.
  self.parentNode.insertBefore(frame, self);
  self.parentNode.removeChild(self);

  window.addEventListener("message", function (e) {
    if (e.origin !== ORIGIN) return;
    var d = e.data;
    if (!d || d.type !== "etu-embed-size" || !d.height) return;
    // Only resize the iframe this message came from.
    if (frame.contentWindow && frame.contentWindow === e.source) {
      frame.style.height = d.height + "px";
    }
  });
})();
