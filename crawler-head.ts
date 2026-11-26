// Puts a page's own <head> tags into the SPA shell (index.html) for crawlers.
//
// Root-level and dependency-free so middleware.ts (Edge runtime) can import it.
// Crawlers used to get a stand-in page holding only the title and one
// paragraph, so Bing (and DuckDuckGo, Yahoo and ChatGPT search, which use it)
// had nothing to rank. With the real shell they run the app like a browser and
// see the whole page, while the head already carries the right title,
// description, canonical and share card.

/** Swaps the shell's generic title, description, canonical, Open Graph and
 *  Twitter tags for `headTags`. Returns null when `shell` isn't the app shell. */
export function injectHead(shell: string, headTags: string): string | null {
  if (!shell.includes('<div id="root">') || !shell.includes("</head>")) return null;
  const stripped = shell
    .replace(/<title>[\s\S]*?<\/title>\s*/gi, "")
    .replace(/<meta\s+(?:name|property)="(?:description|og:[^"]*|twitter:[^"]*)"[^>]*>\s*/gi, "")
    .replace(/<link\s+rel="canonical"[^>]*>\s*/gi, "");
  return stripped.replace("</head>", `${headTags}\n  </head>`);
}
