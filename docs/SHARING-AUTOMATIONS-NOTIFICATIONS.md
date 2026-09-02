# Sharing, Automations & Notifications

> How the Electrifying the US site captures a visitor, shares content, runs its
> automations, and fires notifications — end to end. Code references are
> `path:line`-style so each claim is traceable.
>
> **Design rule that runs through all of it:** every one of these paths is
> **best-effort and non-blocking**. A Slack outage, a GHL hiccup, a blocked
> popup, or a missing env var never breaks the visitor's experience — the UI
> always confirms success and the failure is swallowed server-side. Secrets live
> **only** in Vercel env vars / n8n credentials, never in the browser bundle.

---

## 1. The through-line: one visitor identity, captured once

Almost every automation hangs off a single idea: the first time a visitor gives
their **first name + email** at *any* gate, we remember it and never ask again.

- Store: `localStorage` key `etu_lead_identity` — `src/lib/leadIdentity.ts`
  (`saveLeadIdentity` / `getLeadIdentity` / `hasLeadIdentity`).
- Written by: the calculator unlock, every **Share** dialog, the **event**
  action gates, the **webinar** form, and the **EVan** chat.
- Read by: all of the above (to skip the form) **and** the analytics beacon
  (`src/lib/analytics.ts:5`) so pageviews get attributed to a known person.

```
First gate anywhere ──► saveLeadIdentity({firstName,email}) ──► localStorage
        │                                                          │
        └──────────── every later gate reads it back ◄────────────┘
                      (share / event / webinar / chat / calculator)
```

A second, session-scoped copy of just the email lives in `sessionStorage`
(`lead_email`, `src/lib/emailCompose.ts:12`) — used only to route `mailto:`
fallbacks to the right webmail provider.

---

## 2. Sharing

Entry point: **`ShareGate`** (`src/components/forms/ShareGate.tsx`) — the small
"Share" button on photos, articles, incentives, events, jobs, charger map, and
the calculator.

### 2.1 The gate

1. Click → if `getLeadIdentity()` already has the visitor, skip straight to the
   share options. Otherwise show a **name + email** form first.
2. On submit → `submitLead(formType, …)` (CRM capture, §3.1) + `saveLeadIdentity`
   + `rememberLeadEmail`. Non-blocking: the share options reveal even if the POST
   hiccups.

`formType` is surface-specific: `photo-share`, `article-share`,
`incentive-share`, `event-share`, `job-share`, `charger-share`,
`calculator-share`.

### 2.2 Channels

| Channel | What happens | Server call? |
|---|---|---|
| **Email** | Opens `ShareResultDialog` (email mode). Captures sender + recipient, upserts **both** to GHL, and sends a **branded HTML email** with the thumbnail inline. | `/api/lead` **+** `/api/share-email` (Resend) |
| **LinkedIn** | `linkedin.com/sharing/share-offsite?url=` — LinkedIn reads the page's OG tags. | none |
| **Facebook** | `facebook.com/sharer/sharer.php?u=` — reads OG tags. | none |
| **WhatsApp** | `wa.me/?text=` with the rich text body (title · meta · description · image · link). | none |
| **Text (SMS)** | Opens `ShareResultDialog` (sms mode) → captures the lead, then a native `sms:?&body=` handoff opens the visitor's **own Messages app**. No server SMS. | `/api/lead` only |
| **More options…** | Native OS share sheet (`navigator.share`) when supported — AirDrop, installed apps. | none |
| **Copy link** | `navigator.clipboard.writeText`. | none |

### 2.3 The "Send this" dialog

`src/components/forms/ShareResultDialog.tsx` — the shared Email/Text-a-friend flow
(originally the calculator's, now used by every share menu).

- Prefills the sender from the gate / saved identity so nobody retypes their own
  details.
- **Email path:** `submitLead(formType, …)` records the recipient as the GHL
  contact (carrying the share link) and the sender as context, then
  `sendShareEmail(…)` (`src/lib/sendShareEmail.ts`) delivers the designed email.
  "Sent ✓" only shows if Resend actually accepted it (CRM success ≠ delivery).
- **SMS path:** records the lead, then hands off to the phone's Messages app.
- Won't close on an accidental outside-click / Escape while composing or sending.

### 2.4 The branded share email

`api/share-email.ts` — a Vercel function that renders a responsive,
site-styled HTML email (gradient header, real logo, inline hero image, "Read
more" button, disclaimer footer) and sends it via **Resend**.

- reCAPTCHA-verified; **sender email required** (every send is attributable —
  that + reCAPTCHA is the anti-abuse stance). Self-sends allowed.
- Length caps + `https?` scheme checks on every field.
- Env: `RESEND_API_KEY`, `RESEND_FROM` (verified sender), `RECAPTCHA_SECRET_KEY`.

### 2.5 `mailto:` fallback routing

`src/lib/emailCompose.ts` — plain `mailto:` does nothing on machines with no
default mail app (common on Windows/Chrome). So we route to the sender's
**webmail compose** window (Gmail / Outlook / Yahoo / AOL / Proton) based on
their email domain, falling back to Gmail's universal composer, then `mailto:`.

---

## 3. Automations

### 3.1 CRM proxy — `/api/lead` (GoHighLevel)

`api/lead.ts` is the hub. **Every** site form POSTs here with a `formType`; the
browser never sees the GHL key.

Flow per submission:

1. **reCAPTCHA v3** verify — `RECAPTCHA_SECRET_KEY`, min score `0.5`. Fails
   **open** if no secret is set or Google is unreachable (so a Google outage
   never blocks all leads).
2. **Upsert contact** → `POST /contacts/upsert` with `FORM_TAGS[formType]`
   (`website-lead` + a specific tag + `source:<form>`). Empty values are dropped
   so we never overwrite existing GHL data with blanks. The share link is stashed
   on `contact.website` for GHL templates.
3. **Custom fields** — job title, department and industry have no standard GHL
   contact field, so they are sent as custom fields on the same upsert. The ids
   are resolved once per location (`api/_ghl-fields.ts`) by field key, then by
   field name, with `GHL_CF_TITLE` / `GHL_CF_DEPARTMENT` / `GHL_CF_INDUSTRY` as
   an override. A location with no such custom fields sends none of them and
   upserts exactly as before.
4. **Attach a note** (best-effort, needs `GHL_USER_ID`) with everything the
   standard fields don't hold: title, department, industry, message, share
   channel/summary, "shared by", session id, and the **full EVan transcript**.
   The three custom fields are repeated here on purpose — the note is the only
   record on a location that has not created them.
5. **Calculator share only:** also upsert the *sender* as their own contact
   (tagged `calculator-share-sender`) so they aren't messaged as a lead.
6. **Slack alert** (§4.1).

**Form types & tags** (`api/lead.ts:19`):

| formType | Tags (besides `website-lead`) | Origin |
|---|---|---|
| `homepage-contact`, `contact-us` | `contact-form` | Contact forms |
| `newsletter` | `newsletter` | Newsletter signup |
| `list-event`, `post-job` | `event-submission` / `job-submission` | List/Post forms |
| `event-alerts`, `career-alerts` | `event-alerts` / `career-alerts` | Alert signups |
| `job-apply` | `job-application` | Careers "Apply" |
| `evan-chat` | `evan-chat`, `chatbot-lead` | EVan chat (§3.2) |
| `calculator-unlock` | `calculator-lead` | Calculator unlock |
| `calculator-share`, `*-share` | `content-share` + surface tag | Share dialogs (§2) |
| `event-register`, `event-calendar` | `event-register` / `event-calendar` | Event CTAs, webinar |
| `video-access` | `video-lead` | Video gate — gallery + homepage rail |

> **The important handoff:** internal team alerts and any lead-nurture email/SMS
> are driven **inside GHL** by workflows triggered on these tags ("tag added →
> Slack / send email / send SMS"). The site's job is to land the tagged contact;
> GHL owns what happens next.

Env: `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_USER_ID` (optional, enables notes),
`GHL_CF_TITLE` / `GHL_CF_DEPARTMENT` / `GHL_CF_INDUSTRY` (optional, only to
override the custom-field lookup).

### 3.2 EVan chatbot → n8n AI agent

`src/components/AgentChatSection.tsx` (+ the `/assistant` page).

- Lead-gated (first name + email) before the first answer, then remembered
  site-wide.
- Each message POSTs to the **n8n Chat Trigger / AI Agent** webhook
  (`VITE_N8N_WEBHOOK_URL`); the reply is rendered as Markdown. Without the
  webhook it runs in a friendly **demo mode**. One stable `sessionId` per tab
  gives the agent conversation memory. (The LLM itself runs inside the n8n
  workflow — outside the site's scope.)
- A few questions have **editorially-approved canned answers** that
  short-circuit the agent so the copy never drifts.
- CRM: `pushChatLeadToGHL` fires **once** when chatting starts (`formType:
  evan-chat`, tag `chatbot-lead`). On page-hide/unload, the **full transcript**
  is flushed via `sendBeacon` to `/api/lead` and saved as a GHL note.
- Slack for chat fires **only** at session end, when the transcript is present
  (`api/lead.ts:77`) — so we get one clean "New EVan chatbot lead", not a ping
  per message.

### 3.3 Webinar registration → Zoom

`src/components/forms/WebinarRegisterForm.tsx` + `api/register-webinar.ts`.

- On submit, two calls run together (neither blocks): `submitLead('event-register')`
  → GHL, and `registerOnZoom` → `/api/register-webinar`.
- The API registers the person on Zoom via **Server-to-Server OAuth**
  (`ZOOM_ACCOUNT_ID` / `ZOOM_CLIENT_ID` / `ZOOM_CLIENT_SECRET` /
  `ZOOM_WEBINAR_ID`), sending the extra profile fields as Zoom **custom
  questions**, and returns the registrant's **unique `join_url`**.
- If Zoom isn't wired (`configured:false`), the form degrades gracefully to
  "we'll email your join link." Zoom itself emails the join link.

### 3.4 Read-only content feeds (cached proxies)

These pull live external data server-side, keep the key off the client, and
CDN-cache hard so thousands of visitors collapse into a few upstream calls.

| Endpoint | Source | Env | Cache |
|---|---|---|---|
| `/api/events` | ICS/RSS event feeds + OG enrichment | `EVENT_FEEDS` | ~1h |
| `/api/jobs` | ATS boards — Greenhouse / Lever / Ashby (public JSON) | `JOB_BOARDS` | 1h fresh, 6h stale |
| `/api/incentives` | NREL AFDC Laws & Incentives | `NREL_API_KEY` | 1d fresh, 1wk stale |
| `/api/stations` | NREL AFDC charging stations (Find a Charger map) | `NREL_API_KEY` | 1d fresh, 1wk stale |

### 3.5 n8n content-management forms

Content is added/removed through n8n form workflows (see `docs/INFRA.md` and
`n8n/`), each writing to Supabase and uploading images to the `site-media`
bucket:

- **Blog**, **Events**, **Gallery**, **Jobs** — Add/Remove forms; soft-archive on
  remove. The site merges these dynamic rows with the static seed content.

---

## 4. Notifications

### 4.1 Slack — leads

`notifySlack` in `api/lead.ts:69`. One message per real submission to
`SLACK_WEBHOOK_URL`, with name/email/phone/company/subject/message, the source
label, and a **deep link to the GHL contact**. Chatbot leads only alert at
session end (transcript present); the transcript stays on the GHL note, not in
Slack.

### 4.2 Slack — visitors

`api/track.ts`. The SPA's beacon (`src/lib/analytics.ts` via
`AnalyticsTracker`) pings `/api/track` on every pageview and tracked click. The
server reads IP + Vercel geo headers, stores the event in Supabase
`site_analytics`, and — **only on the first pageview of a session** — posts a
Slack alert to `SLACK_VISITORS_WEBHOOK_URL` (falls back to `SLACK_WEBHOOK_URL`).
Known visitors are labelled by name/email; bots/monitors are filtered by
user-agent.

> **Privacy:** `/api/track` logs IP addresses (personal data under GDPR/CCPA).
> The privacy policy must disclose visitor IP/analytics logging.

### 4.3 Slack — pre-launch gate sign-ins

`api/gate-login.ts`. Per-reviewer password gate for the pre-launch site. On a
successful sign-in it records `(email, ip)` via a Supabase `record_gate_login`
RPC, sets the `etu_gate` cookie, and Slacks a sign-in alert flagging a **new IP**
for that account or a **possible shared login** (distinct-IP count ≥
`GATE_SHARE_THRESHOLD`, default 4).

### 4.4 Email — Resend & Zoom

- **Resend** delivers the branded share emails (§2.4) straight to recipients.
- **Zoom** emails each webinar registrant their unique join link (§3.3).

### 4.5 Native handoffs

Not server notifications, but visitor-side deliveries: **SMS** via the phone's
Messages app, and **webmail compose** windows for `mailto:` fallbacks.

### 4.6 Analytics dashboard read

`api/analytics.ts` — password-gated (`ANALYTICS_PASSWORD`, timing-safe compare)
read API behind `/admin`. Aggregates `site_analytics` (pageviews, sessions,
visitors, top pages/referrers/countries/cities/clicks, per-visitor journeys)
using the Supabase **service-role** key. Never exposes raw rows wholesale.

---

## 5. Anti-abuse & security

- **reCAPTCHA v3** on every lead + share-email submission
  (`src/lib/recaptcha.ts` → `getRecaptchaToken`), server-verified in `/api/lead`
  and `/api/share-email`. Fail-open on outage / no secret so real users aren't
  blocked.
- **Server-only secrets** — GHL, Resend, Zoom, NREL, Supabase service-role, and
  Slack webhooks live in Vercel env vars only; the browser sees none of them.
- **Attributable shares** — a sender email is required for every branded email
  send.
- **Allowlists** — `/api/incentives`, `/api/jobs` and `/api/stations` validate
  or clamp their params so they can't be abused as open proxies.
- **Pre-launch gate** — HttpOnly `etu_gate` cookie checked at the edge; per-user
  passwords with shared-login detection.

---

## 6. Environment variable reference

| Var | Used by | Purpose |
|---|---|---|
| `GHL_API_KEY`, `GHL_LOCATION_ID`, `GHL_USER_ID` | `/api/lead` | GoHighLevel upsert + notes |
| `RECAPTCHA_SECRET_KEY` | `/api/lead`, `/api/share-email` | reCAPTCHA v3 verify |
| `RESEND_API_KEY`, `RESEND_FROM` | `/api/share-email` | Branded share emails |
| `VITE_N8N_WEBHOOK_URL` | EVan chat | n8n AI agent webhook (client) |
| `ZOOM_ACCOUNT_ID`, `ZOOM_CLIENT_ID`, `ZOOM_CLIENT_SECRET`, `ZOOM_WEBINAR_ID` | `/api/register-webinar` | Zoom S2S registrant API |
| `SLACK_WEBHOOK_URL` | `/api/lead`, `/api/gate-login`, `/api/track` (fallback) | Team lead/sign-in alerts |
| `SLACK_VISITORS_WEBHOOK_URL` | `/api/track` | Visitor alerts (dedicated channel) |
| `SUPABASE_URL` / `VITE_SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY` | `/api/track`, `/api/analytics`, `/api/gate-login` | Analytics store + gate log (bypasses RLS) |
| `VITE_SUPABASE_ANON_KEY` | site reads, gate RPC | Public-safe Supabase reads |
| `ANALYTICS_PASSWORD` | `/api/analytics` | `/admin` dashboard password |
| `GATE_USERS`, `GATE_USERS_EXTRA`, `SITE_EMAIL`, `SITE_PASSWORD`, `GATE_TOKEN`, `GATE_SHARE_THRESHOLD` | `/api/gate-login` | Pre-launch reviewer gate |
| `EVENT_FEEDS`, `JOB_BOARDS`, `NREL_API_KEY` | feed proxies | External content sources |

---

## 7. Data stores

- **GoHighLevel** — the CRM system of record for every lead (contacts, tags,
  notes). Owns nurture workflows (email/SMS/internal Slack) via tag triggers.
- **Supabase** — `site_analytics` (visitor events), gate sign-in log, and the
  dynamic content tables (`site_blog_posts`, `site_events`, `site_gallery`) fed
  by the n8n forms. See `docs/INFRA.md` for identifiers.
- **Resend / Zoom / n8n** — transactional email, webinar registration, and the
  AI agent + content forms respectively.

---

## 8. At a glance

```
                         ┌───────────────── VISITOR ─────────────────┐
                         │ share · event CTA · webinar · chat · calc  │
                         └───────────────────┬────────────────────────┘
                        first name + email captured once (leadIdentity)
                                             │
        ┌────────────────────────────────────┼───────────────────────────────┐
        ▼                                     ▼                               ▼
  /api/lead (GHL)                     /api/share-email (Resend)      /api/register-webinar (Zoom)
  reCAPTCHA→upsert+tags+note          branded HTML email → friend    S2S OAuth → unique join_url
        │                                     │                               │
        ├─ Slack alert (#leads)               └─ recipient inbox              └─ Zoom emails join link
        └─ GHL tag → workflow (email/SMS/internal Slack)

  EVan chat ─► n8n AI agent (VITE_N8N_WEBHOOK_URL) ─► reply
        └─ transcript on unload ─► /api/lead note ─► Slack "New EVan chatbot lead"

  Every page ─► /api/track ─► Supabase site_analytics + Slack (#visitors, 1st view/session)
                                     ▲
                            /api/analytics (password) ─► /admin dashboard

  Feeds: /api/events (ICS) · /api/jobs (ATS) · /api/incentives (NREL) — cached, key-safe
```

---

_Last updated 2026-07-09. Source of truth is the code; update this doc when the
flows change._
