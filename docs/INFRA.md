# Infrastructure Reference

> Non-secret identifiers for the live backend. **No secret keys here** — those live
> in `.env.local` (gitignored), in Vercel env vars, and in n8n credentials only.

## Supabase (cloud)
- **Project**: "Electrifying the US" · ref `wmwjjejrgequyersrjnh` · region East US (N. Virginia)
- **URL**: `https://wmwjjejrgequyersrjnh.supabase.co`
- **Org**: `yqcsewfxnjconyleatym`
- **Tables** (RLS: public reads `status='published'` only; writes via service_role):
  - `site_blog_posts` — drives `/news` + `/blog` (merged with static `BLOG_POSTS`)
  - `site_events` — drives `/events` (merged with static `EVENTS`)
  - `site_gallery` — optional dynamic gallery rows
- **Storage**: bucket `site-media` (public) — blog/event images uploaded by the forms
- **Migrations**: `supabase/migrations/0001_events_blogs.sql`, `0002_storage_media.sql`
- **Keys**:
  - anon (public-safe) → `VITE_SUPABASE_ANON_KEY` in `.env.local` + Vercel (Production, Development)
  - service_role (secret) → **only** in n8n credentials; never in repo or any `VITE_` var
- Site read path: `src/lib/supabase.ts` + `src/lib/content.ts` + `src/hooks/use-content.ts`.
  With env unset the site falls back to the static seed content.

## n8n (Hostinger)
- **Instance**: `https://n8n-9odn.srv1570441.hstgr.cloud` · UI project `8aYMON85MUcwoo0S` · API base `/api/v1` (header `X-N8N-API-KEY`)
- **Credentials**: `Supabase` (supabaseApi, id `5RsNGzjT7AA1DZH0`) · `Supabase Storage (header)` (httpHeaderAuth = `Authorization: Bearer <service_role>`, id `5f1hPH2tVsd6qBWB`)
- **Content forms** (active):
  - **Site Blog — Add / Remove** · id `RJwHjm1djOo8KtJs` · form `…/form/etu-blog` · source `n8n/blog-form-workflow.json`
  - **Site Events — Add / Remove** · id `iZZUWrPBKJ7EDf6M` · form `…/form/etu-event` · source `n8n/event-form-workflow.json`
  - **Site Gallery — Add / Remove** · id `AqTYBEnrqQxhoMvw` · form `…/form/etu-gallery` · source `n8n/gallery-form-workflow.json` (photos: upload/URL; videos: YouTube/Vimeo/Drive/file)
  - **Site Jobs — Add / Remove** · id `aeJc4fJd7vvqy69I` · form `…/form/etu-job` · source `n8n/job-form-workflow.json` (Careers; posted jobs show above ATS listings)
  - Each: Add/Remove, image **upload → site-media** or URL fallback, soft-archive on remove (Delete + Title).
- **Other existing workflows**: `EV Events Feed (ICS)` (`wkgAx2x0Z8dBRKxb`) → `/webhook/ev-events`; `/webhook/evan-chat`; `/webhook/gas-prices`.

## Vercel
- **Project**: `electrifyingtheus` (`prj_4o0vGu1erUjivW9k3CRbqk1FTKTl`) · org `team_6UAIWndG0JnbTlU03HypHa2O`
- **Live**: https://electrifyingtheus.vercel.app
- **Deploy**: `npx vercel --prod` (CLI authed), or merge to `main` on the `mine` remote (auto-deploy)
- **Git remotes**: `mine` = github.com/automation328/electrifyingtheus (deploy repo) · `origin` = github.com/EVNoire/electric-future-hub

## Local dev
- `.env.local` holds `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (+ OpenAI, n8n webhooks). Restart `npm run dev` after edits.
- `npm run dev` → Vite on :8080 (Supabase read is client-side, no `vercel dev` needed for content).
