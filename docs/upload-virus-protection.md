# Virus / malware protection for user-uploaded content (JPEG, PNG, PDF)

Scope: files users upload today (event images on **List Your Event** → n8n webhook) and
likely-soon (resumes/PDFs on jobs). Stack: Vite SPA on **Vercel**, **Supabase** (DB +
Storage), **n8n** on a Hostinger VPS. No AWS — so AWS-native answers (GuardDuty,
serverless-clamscan) don't apply; the pattern below is adapted to what you run.

## Core principle: defense in depth, fail-closed
Never trust the client. Treat every upload as hostile until it has passed **validation +
scanning**, and never publish/serve a file that hasn't been scanned clean.

## Layer 1 — Validation (cheap, do first, reject fast)
1. **Allowlist** MIME types + extensions: `image/jpeg`, `image/png`, `application/pdf` only.
2. **Verify magic bytes**, not the extension or the browser-sent `Content-Type` (both are
   forgeable). Use a signature check (`file-type` npm lib) — reject a `.jpg` that is really
   HTML/SVG/PE/ZIP (polyglots).
3. **Size caps** (e.g. images ≤ 8 MB, PDF ≤ 15 MB) + a **per-IP rate limit**.
4. **Block SVG** entirely (script-based XSS) unless you sanitize it with DOMPurify. You only
   need JPEG/PNG/PDF, so disallow it.

## Layer 2 — Neutralize content (CDR — Content Disarm & Reconstruction)
This kills most image/PDF payloads even if a scanner misses a zero-day.
- **Images:** re-encode with **`sharp`** (decode → re-encode JPEG/PNG) and **strip all
  metadata/EXIF**. This destroys appended payloads and image+code polyglots and normalizes
  dimensions. Do this for every image, always.
- **PDFs:** strip active content — JavaScript, `/OpenAction`, `/Launch`, embedded files. Use a
  sanitizer/CDR step (e.g. re-render/flatten, `mutool clean -ggg`, or a CDR API). At minimum,
  reject PDFs containing `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`.

## Layer 3 — Antivirus scan
- **ClamAV (recommended, free, private):** you already run a Hostinger VPS for n8n — host
  **`clamd` + a REST wrapper** (e.g. `clamav-rest` / `clamav/clamav` Docker image) on the same
  box. n8n posts the file to it and reads `OK` / `FOUND`. Keep signatures fresh with
  **`freshclam`** on a daily cron. No per-file cost, files never leave your infra.
- **Multi-engine API (low volume / simplest):** VirusTotal or Cloudmersive Virus Scan API.
  ⚠️ **Privacy:** on VirusTotal's free tier, submitted files can become accessible to other
  researchers — do **not** send resumes/PII there. Cloudmersive (paid) keeps files private and
  also offers CDR.
- ClamAV alone is signature-based — it's the floor, not a guarantee. Layer 2 (CDR) is what
  covers zero-days.

## Layer 4 — Architecture: quarantine, then publish
Stop posting raw files straight into the live flow. Instead:
1. Client uploads to a **private Supabase Storage bucket** (`uploads-quarantine`) via a signed
   upload URL — **not** a public bucket, and not as multipart into n8n.
2. A **Supabase Storage webhook** (or n8n poll) triggers the scan pipeline: validate →
   re-encode/CDR → ClamAV.
3. **Clean →** move/copy to the public bucket + create the `site_events` / job row.
   **Infected/invalid →** delete + log + alert (Slack/GHL). Never expose quarantine files.

## Layer 5 — Serve safely
- Serve uploads from **Supabase Storage / a separate domain**, never same-origin as the app.
- Response headers: `X-Content-Type-Options: nosniff`; for PDFs use
  `Content-Disposition: attachment` (or a sandboxed viewer), never inline-render untrusted HTML.
- Keep a strict **Content-Security-Policy** so any slipped-through HTML/SVG can't execute.

## Recommended concrete setup for THIS project
- Move List-Your-Event images (and future resumes) to a **private Supabase bucket**.
- **n8n scan flow:** signed-upload → `file-type` check → `sharp` re-encode (images) /
  `mutool clean` (PDF) → HTTP node → **self-hosted ClamAV REST on the VPS** → on clean, publish
  + insert the row (reuse the Site-Content workflow); on hit, delete + alert.
- **freshclam** daily cron on the VPS. Size + rate limits at the edge (Vercel).
- This is free, private (PII never leaves your infra), and event-driven.

## Quick wins you can ship immediately (before the full pipeline)
- Enforce the MIME/extension allowlist + magic-byte check + size cap on upload.
- Re-encode every image with `sharp` and strip metadata.
- Reject PDFs containing `/JavaScript`, `/JS`, `/Launch`, `/EmbeddedFile`.
- Keep uploads in a **private** bucket; only publish after a scan step.

## Sources
- [Secure File Upload to S3 with Lambda Virus Scanning — Serverless Guru](https://www.sls.guru/blog/secure-file-upload-to-amazon-s3-with-aws-lambda-virus-scanning-serverless-architecture-guide)
- [Serverless ClamAV malware scan on AWS — Globant/Medium](https://medium.com/globant/creating-a-serverless-malware-scan-solution-with-clamav-on-aws-52891da6fbfe)
- [Virus scan S3 buckets with serverless ClamAV CDK — AWS Developer Tools Blog](https://aws.amazon.com/blogs/developer/virus-scan-s3-buckets-with-a-serverless-clamav-based-cdk-construct/)
- [ClamAV → GuardDuty Malware Scanning — Steamhaus](https://www.steamhaus.co.uk/insights/enhancing-s3-security-my-journey-from-clamav-to-guardduty-malware-scanning)
- [How to virus scan files users upload using ClamAV — DEV](https://dev.to/jfbloom22/how-to-virus-scan-file-users-upload-using-clamav-2i5d)
- [ClamAV Scanning docs](https://docs.clamav.net/manual/Usage/Scanning.html)
