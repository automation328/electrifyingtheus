# CMS content editor (`/admin/content`)

An in-app, invite-only content editor for logged-in editors. It extends the
existing `site_*` Supabase overlay pattern with the first in-repo **write** path:
the browser holds a Supabase Auth session and posts to editor-gated
`/api/admin/*` functions, which verify the editor and write with the service-role
key (never shipped to the browser).

## What's editable

| Section | Table | How it reaches the site |
|---|---|---|
| Blog posts | `site_blog_posts` | overlays static seed (published rows) |
| Events | `site_events` | overlays static seed |
| Gallery | `site_gallery` | overlays static seed |
| Jobs | `site_jobs` | overlays static seed |
| Vehicles | `site_vehicles` | merged into the calculator catalog at boot |
| Incentives | `site_incentives` | merged into the rebates data at boot |
| Pages (copy) | `site_pages` | override merged over `ContentPageLayout` prose |
| EVan knowledge | `kb_source_documents` → `etus_kb_documents` | re-embedded into the RAG vector store |

With Supabase unset, every surface falls back to the curated static content.

## One-time setup

1. **Run the migrations** in the Supabase SQL editor (or `supabase db push`):
   - `0005_editors.sql`, `0006_vehicles_incentives.sql`, `0007_site_pages.sql`,
     `0008_kb_source_documents.sql`.
2. **Enable Supabase Auth** → Email/password, and **disable public signups**
   (invite-only).
3. **Create each editor's Auth user** (Supabase → Authentication → Add user),
   then allow-list them:
   ```sql
   insert into public.editors (email, role) values ('you@example.com', 'admin');
   ```
4. **Set server env vars** (Vercel + local `.env.local`):
   - `SUPABASE_SERVICE_ROLE_KEY` (all write endpoints; already used by analytics)
   - `GEMINI_API_KEY` (only for re-embedding KB documents)
5. Local dev: run `vercel dev` (:3000) alongside `npm run dev` (:8080); Vite
   proxies `/api` to it.

## Architecture notes

- **Auth/authorization:** `api/_admin-auth.ts` verifies the Supabase access token
  (GoTrue `auth/v1/user`) and confirms the email is in `public.editors`.
- **Writes:** one endpoint `api/admin.ts` dispatched by `op` — `collection`
  (list/insert/update/delete over a table allow-list), `upload` (images → public
  `site-media` bucket), `kb` (chunk + embed → `etus_kb_documents`), and `me`
  (authorization check). Consolidated into a single Serverless Function to stay
  under the Hobby-plan 12-function limit.
- **Reactive overlays** (blog/events/gallery/jobs/pages) load via React Query, so
  edits appear on next load. **Boot-time overlays** (vehicles/incentives) merge
  into the static datasets in `src/main.tsx` before render, because those are read
  synchronously (some at module scope) across the calculator.
- **Removing a static entry:** vehicles/incentives support a `hidden` flag — a
  published row with `hidden=true` removes the matching static entry (RLS never
  exposes non-published rows, so removal must ride on a published row).

## Extending page-copy editing to more pages

`ReducedEmissions` is the wired pilot. To make another `ContentPageLayout` page
editable:

1. Extract its prose into `src/data/pages/<slug>.ts` as a `satisfies PageOverride`
   object (see `reduced-emissions.ts`).
2. In the page, swap `<ContentPageLayout .../>` → `<EditableContentPage path="/…"
   {...content} icon={…} heroImage={…} … />`.
3. Register it in `EDITABLE_PAGES` + `PAGE_DEFAULTS` in `src/lib/page-content.ts`.
