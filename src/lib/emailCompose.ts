// Opens a prefilled email composer that works WITHOUT a desktop mail client.
//
// Plain `mailto:` links do nothing on machines that have no default mail app
// registered (common on Windows/Chrome), which is why the share email buttons
// looked broken. Instead we route to the visitor's likely WEBMAIL compose window
// (Gmail / Outlook / Yahoo / AOL / Proton) based on the address they gave at the
// share gate, and fall back to `mailto:` only when the provider is unknown.
//
// This is why every email-share button is gated: the captured address tells us
// where to open the compose window.

const STORE_KEY = "lead_email";

/** Remember the visitor's address so later email shares route to their webmail. */
export function rememberLeadEmail(email: string) {
  try {
    if (email && email.trim()) sessionStorage.setItem(STORE_KEY, email.trim());
  } catch {
    /* private mode — non-fatal */
  }
}

function storedLeadEmail(): string {
  try {
    return sessionStorage.getItem(STORE_KEY) ?? "";
  } catch {
    return "";
  }
}

interface ComposeOpts {
  subject: string;
  body: string;
  /** Optional recipient. For "share with a friend" this is left blank. */
  to?: string;
  /** Sender's address — picks the webmail provider. Falls back to the stored gate email. */
  fromEmail?: string;
}

// Maps the sender's email domain to its webmail compose URL. Returns null when
// the provider has no reliable web-compose deep link (→ mailto: fallback).
function webmailComposeUrl(domain: string, su: string, bd: string, to: string): string | null {
  if (domain.includes("gmail") || domain.includes("googlemail")) {
    return `https://mail.google.com/mail/?view=cm&fs=1&to=${to}&su=${su}&body=${bd}`;
  }
  if (
    domain.includes("outlook") || domain.includes("hotmail") ||
    domain.includes("live") || domain.includes("msn")
  ) {
    return `https://outlook.live.com/mail/0/deeplink/compose?to=${to}&subject=${su}&body=${bd}`;
  }
  if (domain.includes("yahoo") || domain.includes("ymail")) {
    return `https://compose.mail.yahoo.com/?to=${to}&subject=${su}&body=${bd}`;
  }
  if (domain.includes("aol")) {
    return `https://mail.aol.com/webmail-std/en-us/compose-message?to=${to}&subject=${su}&body=${bd}`;
  }
  if (domain.includes("proton")) {
    return `https://mail.proton.me/u/0/composer?to=${to}&subject=${su}&body=${bd}`;
  }
  return null; // iCloud and others → mailto:
}

/**
 * Opens a prefilled email composer. Tries the sender's webmail first (so it
 * works with no desktop client), then falls back to `mailto:`.
 */
export function openEmailCompose({ subject, body, to = "", fromEmail }: ComposeOpts) {
  if (typeof window === "undefined") return;
  const sender = (fromEmail || storedLeadEmail()).toLowerCase();
  const domain = sender.split("@")[1] ?? "";
  const su = encodeURIComponent(subject);
  const bd = encodeURIComponent(body);
  const t = encodeURIComponent(to);

  const url = webmailComposeUrl(domain, su, bd, t);
  if (url) {
    const w = window.open(url, "_blank", "noopener,noreferrer");
    if (w) return; // opened a webmail tab — done
    // popup blocked → fall through to the mail-client handoff below
  }
  window.location.href = `mailto:${to}?subject=${su}&body=${bd}`;
}
