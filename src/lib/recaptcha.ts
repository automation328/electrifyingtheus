// Google reCAPTCHA v3 — invisible, score-based. Loads the script lazily on the
// first token request so it never blocks initial page load. Returns "" when no
// site key is configured (dev / preview), letting forms work without it; the
// server treats a missing token as "skip verification" only when its secret is
// also unset.
//
// Set VITE_RECAPTCHA_SITE_KEY in the environment to enable.

const SITE_KEY = (import.meta as { env?: Record<string, string> }).env?.VITE_RECAPTCHA_SITE_KEY;

export const isRecaptchaEnabled = Boolean(SITE_KEY);

declare global {
  interface Window {
    grecaptcha?: {
      ready: (cb: () => void) => void;
      execute: (siteKey: string, opts: { action: string }) => Promise<string>;
    };
  }
}

let loaderPromise: Promise<void> | null = null;

function loadScript(): Promise<void> {
  if (!SITE_KEY) return Promise.resolve();
  if (loaderPromise) return loaderPromise;
  loaderPromise = new Promise<void>((resolve, reject) => {
    if (window.grecaptcha) { resolve(); return; }
    const s = document.createElement("script");
    s.src = `https://www.google.com/recaptcha/api.js?render=${SITE_KEY}`;
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => reject(new Error("Failed to load reCAPTCHA"));
    document.head.appendChild(s);
  });
  return loaderPromise;
}

/**
 * Returns a fresh reCAPTCHA v3 token for the given action, or "" if reCAPTCHA
 * isn't configured / fails to load (never throws — form UX must not break).
 * `action` should be a short label like "contact" or "lead" for analytics.
 */
export async function getRecaptchaToken(action: string): Promise<string> {
  if (!SITE_KEY) return "";
  try {
    await loadScript();
    if (!window.grecaptcha) return "";
    await new Promise<void>((r) => window.grecaptcha!.ready(() => r()));
    return await window.grecaptcha!.execute(SITE_KEY, { action });
  } catch {
    return "";
  }
}
