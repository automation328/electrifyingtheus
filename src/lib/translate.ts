// Spanish via Google's in-page translation (the "Website Translator" widget).
// The widget reads the `googtrans` cookie on load: "/en/es" means translate
// English to Spanish. Switching sets or clears that cookie and reloads.

const COOKIE = "googtrans";

export const isSpanish = (cookie: string = document.cookie) =>
  cookie.split(";").some((c) => c.trim() === `${COOKIE}=/en/es`);

export function setLanguage(lang: "en" | "es") {
  const host = window.location.hostname;
  // Google writes the cookie on the bare host and on ".host"; clear both.
  for (const domain of ["", `; domain=${host}`, `; domain=.${host.replace(/^www\./, "")}`]) {
    document.cookie = `${COOKIE}=; path=/; max-age=0${domain}`;
  }
  if (lang === "es") document.cookie = `${COOKIE}=/en/es; path=/; max-age=31536000`;
  window.location.reload();
}

// Google Translate swaps each text node for its own <font> copy
// (parent.insertBefore(font, text), then parent.removeChild(text)). React keeps
// pointing at the removed text node, so without this guard the page crashes
// (facebook/react#11538) or live numbers, like calculator results, freeze in
// their first value. The guard remembers each swap and redirects React's
// calls to the <font>. When React changes a swapped text, it puts the fresh
// English text back, and Google translates it again.
export function guardReactAgainstTranslation() {
  const swapped = new WeakMap<Node, Node>(); // React's text node -> Google's <font>
  const fontFor = (text: Node, parent?: Node) => {
    const font = swapped.get(text);
    return font?.parentNode && (!parent || font.parentNode === parent) ? font : null;
  };

  const insert = Node.prototype.insertBefore;
  const remove = Node.prototype.removeChild;
  const replace = Node.prototype.replaceChild;

  Node.prototype.insertBefore = function <T extends Node>(this: Node, node: T, ref: Node | null): T {
    if (node.nodeName === "FONT" && ref?.nodeType === Node.TEXT_NODE) swapped.set(ref, node);
    if (ref && ref.parentNode !== this) {
      const font = fontFor(ref, this);
      if (!font) return node;
      ref = font;
    }
    return insert.call(this, node, ref) as T;
  };

  Node.prototype.removeChild = function <T extends Node>(this: Node, child: T): T {
    if (child.parentNode === this) return remove.call(this, child) as T;
    const font = fontFor(child, this);
    if (font) remove.call(this, font);
    return child;
  };

  // React writes text updates through nodeValue (and sometimes data).
  const putBack = (text: Node) => {
    if (text.nodeType !== Node.TEXT_NODE || text.isConnected) return;
    const font = fontFor(text);
    if (font) replace.call(font.parentNode!, text, font);
  };
  for (const [proto, key] of [[Node.prototype, "nodeValue"], [CharacterData.prototype, "data"]] as const) {
    const desc = Object.getOwnPropertyDescriptor(proto, key)!;
    Object.defineProperty(proto, key, {
      ...desc,
      set(this: Node, v: string) {
        desc.set!.call(this, v);
        putBack(this);
      },
    });
  }
}

let started = false;

/** Loads Google's widget once, only for visitors who chose Spanish. */
export function startTranslation() {
  if (started || !isSpanish()) return;
  started = true;
  guardReactAgainstTranslation();
  const w = window as unknown as { googleTranslateInit?: () => void; google?: any }; // eslint-disable-line @typescript-eslint/no-explicit-any
  w.googleTranslateInit = () => {
    new w.google.translate.TranslateElement({ pageLanguage: "en", includedLanguages: "es", autoDisplay: false }, "google_translate_element");
  };
  const holder = document.createElement("div");
  holder.id = "google_translate_element";
  holder.style.display = "none";
  document.body.appendChild(holder);
  const s = document.createElement("script");
  s.src = "https://translate.google.com/translate_a/element.js?cb=googleTranslateInit";
  s.async = true;
  document.body.appendChild(s);
}
