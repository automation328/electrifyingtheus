# Security headers

Set in `vercel.json` → `headers`. That file is JSON with no comment support and is
schema-validated at deploy time, so the reasoning lives here instead.

Baseline before this change: the live site sent **only**
`Strict-Transport-Security: max-age=63072000`, which Vercel adds by default. No CSP,
no `X-Content-Type-Options`, no `Referrer-Policy`, no `Permissions-Policy`, no
framing control. For contrast, `evrebates.pge.com` — a regulated utility running the
same class of service — ships a full nonce-based CSP.

---

## Site-wide

| Header | Value | Why |
|---|---|---|
| `X-Content-Type-Options` | `nosniff` | Stops a browser second-guessing a declared MIME type. No downside; there is no content that relies on sniffing. |
| `Referrer-Policy` | `strict-origin-when-cross-origin` | Full path stays same-origin, only the origin leaks outward, and nothing leaks HTTPS→HTTP. Matters because tool URLs carry answers as query params (`?zip=…`). |
| `Permissions-Policy` | everything off | Only APIs the app **verifiably does not call**. `grep -rn "geolocation\|getCurrentPosition" src/` returns nothing, so geolocation is off too. If a feature later needs one of these, remove it from the list — it will fail silently otherwise. |
| `Content-Security-Policy-Report-Only` | see below | Deliberately not enforced yet. |

### HSTS is deliberately left alone

Vercel already sends `max-age=63072000` (two years). `includeSubDomains` is **not**
added, because it binds every current *and future* subdomain to HTTPS-only. That is a
DNS and infrastructure decision, not a code one — adding it here could silently break
a subdomain nobody remembered. Decide it deliberately, then add it.

---

## Why the CSP is Report-Only

The policy is a *hypothesis* about what the site loads, assembled from the codebase
rather than from observed traffic. Shipping it enforced risks blanking a page over a
resource nobody remembered — and a blank page is worse than the risk it prevents.

Report-Only makes violations appear in the browser console while blocking nothing.

**To enforce it:**

1. Walk the site with the console open — home, calculator, EV-vs-gas, find-a-charger,
   rebates, rebate-eligibility, assistant, news, events, gallery, and the CMS.
   Submit at least one form so reCAPTCHA and the lead path are exercised.
2. Collect every `[Report Only]` violation and add the origin it names — or fix the
   code that loads it.
3. When a full pass is quiet, rename the key from
   `Content-Security-Policy-Report-Only` to `Content-Security-Policy`.

Known soft spots in the current policy, all of which are why it starts Report-Only:

- `'unsafe-inline'` and `'unsafe-eval'` in `script-src`. GTM and reCAPTCHA both need
  them today. Removing them needs a nonce, which needs the HTML to be
  server-rendered per request — a middleware change, not a config change.
- `connect-src` lists `n8n-9odn.srv1570441.hstgr.cloud` because that is the current
  value of `VITE_N8N_WEBHOOK_URL`. **Change that env var and the CSP must change
  with it.** Same for `VITE_GAS_PRICES_URL`.
- `img-src` allows `https:` broadly. Vehicle imagery comes from `upload.wikimedia.org`,
  thumbnails from `i.ytimg.com`, uploads from Supabase storage, and CMS content can
  reference anything an editor pastes. Narrowing this would break editor-entered
  images.
- `api.openai.com` is listed because the OpenAI SDK is still shipped in the bundle
  (see below). Remove it when the assistant moves behind a server proxy.
- `frame-src` has to name every video host the site can embed, and the site can
  embed more than YouTube: `VideoEmbed.tsx` and the CMS video block both offer
  Vimeo, and `VideoEmbed` also offers Google Drive. Both were missing until the
  policy was still Report-Only, so nothing broke — enforcing it as it stood would
  have blanked every Vimeo and Drive embed on the site. **Adding a provider to
  those components means adding its host here.**

---

## Framing: why there is no site-wide `X-Frame-Options`

**Seven pages are meant to be iframed on third-party sites.** `public/embed.js` is a
published loader that any partner can drop onto their page; it iframes the tool with
`?embed=1` and auto-resizes it via `postMessage`. The embeddable routes are:

`/calculator` · `/electricity-vs-gasoline` · `/gm-ev-vs-gas` · `/find-a-charger` ·
`/rebates-incentives` · `/rebate-eligibility` · `/assistant`

That list lives in two places that must agree: `TOOLS` in `public/embed.js` (a
partner cannot load what has no key there) and `EMBED_TOOL_PATHS` in
`middleware.ts` (a path missing there serves the password gate inside the
partner's iframe once `GATE_TOKEN` is set). `/rebate-eligibility` was in neither
for a while despite rendering embed mode, and `/assistant` was missing from this
document — check all three when the set changes.

`X-Frame-Options` has no "allow any origin" value — only `DENY` and `SAMEORIGIN` —
so setting it site-wide would break every embed. `frame-ancestors *` says the same
thing in CSP, honestly and on purpose.

Anti-framing is applied where it actually matters and costs nothing: **`/admin` and
`/admin/*`**, which are never embedded, get `X-Frame-Options: DENY` plus
`frame-ancestors 'none'` (both, because some older clients ignore CSP), along with
`Referrer-Policy: no-referrer` and `X-Robots-Tag: noindex, nofollow`.

---

## Related: the OpenAI key footgun

Not a header, but found during the same pass and fixed alongside it.

`src/pages/Assistant.tsx` instantiates the OpenAI SDK in the browser with
`dangerouslyAllowBrowser: true`, reading `VITE_OPENAI_API_KEY`. Anything `VITE_`-prefixed
is compiled into the public bundle.

Scanning the deployed bundle on 19 Aug 2026:

- `assets/App-*.js` contains `dangerouslyAllowBrowser` (×4), `api.openai.com` (×2)
  and the model name — the call site is live, shipped code.
- **No key material is present.** No `sk-`, `sk-proj-`, or `AIza` match anywhere in
  either chunk. The only JWT is the Supabase anon key, which is public by design and
  fenced by RLS.

So it was safe only because the variable happened to be unset in Vercel. Anyone
setting `VITE_OPENAI_API_KEY` in production — including someone reasonably trying to
"turn the assistant on" — would have published the key to every visitor instantly.

The key read is now gated on `import.meta.env.DEV`, which Vite replaces with `false`
at build time, so a production build folds it to `undefined` and tree-shakes the
reference out. The footgun is closed by construction rather than by a comment.

**Still open:** the real fix is routing the assistant through a server proxy and
deleting the in-browser branch, as the original comment in that file already says.
