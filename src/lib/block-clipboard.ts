// A simple block clipboard (localStorage) so editors can copy a block on one
// page and paste it on another. Not synced to the DB — it's per-browser, like a
// real clipboard.

import type { PageBlock } from "@/lib/page-content";

const KEY = "cms-block-clipboard";

export function copyBlock(block: PageBlock): void {
  try {
    localStorage.setItem(KEY, JSON.stringify(block));
    window.dispatchEvent(new Event("cms-clipboard"));
  } catch { /* storage unavailable — ignore */ }
}

export function readClipboardBlock(): PageBlock | null {
  try {
    const s = localStorage.getItem(KEY);
    return s ? (JSON.parse(s) as PageBlock) : null;
  } catch { return null; }
}
