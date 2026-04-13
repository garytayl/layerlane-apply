# layerlane-apply

Personal job search assistant: a small **dashboard** (source of truth for experience, bullets, project stories, and analyzed roles) plus a **browser extension** that reads job postings and returns copy-ready outputs against that data.

## Repository layout

| Path | Purpose |
|------|---------|
| [apps/web](apps/web) | Next.js App Router app: auth, CRUD bank, jobs, analysis API, settings (API tokens) |
| [extension](extension) | Chrome extension (MV3): capture page text, call the web API with Bearer token |
| [supabase/migrations](supabase/migrations) | Postgres schema + RLS (apply in Supabase SQL or via Supabase CLI) |
| [supabase/templates](supabase/templates) | Branded **Confirm signup** HTML for Supabase Auth (paste in Dashboard) |

## Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key (for JD analysis)

## 1. Database

1. Create a Supabase project.
2. Run the SQL in [`supabase/migrations/20250412130000_init.sql`](supabase/migrations/20250412130000_init.sql) in the Supabase SQL editor (or use `supabase db push` if you use the Supabase CLI linked to this project).
3. In **Authentication → Providers**, enable **Email** (password or magic link as you prefer).
4. Under **Authentication → URL Configuration**, set **Site URL** to your app origin (e.g. `http://localhost:3000` locally, or production below) and add these to **Redirect URLs** so confirmation and OAuth work:
   - `http://localhost:3000/auth/callback`
   - `http://127.0.0.1:3000/auth/callback` (optional)
   - Production: `https://layerlane-apply.vercel.app/auth/callback`  
   If `http://localhost:3000/auth/callback` is missing, Supabase may send users to `/` with `?code=` instead; the app forwards that to `/auth/callback`, but allowlisting is still recommended.
5. Optional: replace the default **Confirm signup** email HTML in **Authentication → Email Templates** with the branded template in [`supabase/templates/confirm_signup.html`](supabase/templates/confirm_signup.html) (see [`supabase/templates/README.md`](supabase/templates/README.md)). If **no messages arrive**, read [Not receiving emails?](supabase/templates/README.md#not-receiving-emails) in that file (confirm-email setting, SMTP, spam, logs).

## 2. Web app (`apps/web`)

Copy environment variables. Templates: [`.env.example`](.env.example) (repo root) and [`apps/web/.env.example`](apps/web/.env.example) (same keys).

```bash
cp .env.example apps/web/.env.local
# or: cd apps/web && cp .env.example .env.local
```

Set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — used for API-token auth paths |
| `OPENAI_API_KEY` | For `/api/jobs/[id]/analyze` and server-side “Re-analyze” |
| `NEXT_PUBLIC_APP_URL` | Public base URL (signup email / redirects). Local: `http://localhost:3000`. Production: `https://layerlane-apply.vercel.app` |

Install dependencies from the **repository root** (npm workspaces include `apps/web`):

```bash
npm install
npm run dev
```

This runs the Next app via `npm run dev --workspace=web`. You can still use `cd apps/web && npm run dev` after a root `npm install` if you prefer.

Open [http://localhost:3000](http://localhost:3000). Sign up, open **Settings**, generate an **API token** for the extension, and seed the **Bank** before running analysis.

### Deploying on Vercel

The repo has a root [`package.json`](package.json) with `"workspaces": ["apps/*"]` and **direct** `next` / `react` / `react-dom` entries (same versions as `apps/web`) so Vercel’s detector finds Next.js at the repo root. Build runs via `npm run build` → `web` workspace. **Framework Preset:** Next.js. **Root Directory:** repository root (default).

Add the same environment variables from the table above in the Vercel project settings. For **Production**, set `NEXT_PUBLIC_APP_URL` to `https://layerlane-apply.vercel.app` (no trailing slash).

**Required on Vercel:** `NEXT_PUBLIC_SUPABASE_URL` and `NEXT_PUBLIC_SUPABASE_ANON_KEY` must be set for every deployment. If either is missing, middleware used to throw (`MIDDLEWARE_INVOCATION_FAILED`); the app now degrades gracefully, but auth and data features still need those variables.

The app uses **Tailwind CSS v3** with PostCSS (not v4 / `lightningcss` natives), which avoids optional native binary issues on Vercel Linux. `npm run dev` still uses `next dev --turbopack` for fast local iteration.

## 3. Browser extension (`extension`)

Build the unpacked extension:

```bash
cd extension
npm install
npm run build
```

In Chrome: **Extensions → Load unpacked →** choose `extension/dist`.

In the extension popup, set **App base URL** to your API origin (`http://localhost:3000` locally, or `https://layerlane-apply.vercel.app` in production) and paste the **API token** from the web app, click **Save settings**, then open a job posting and use **Capture page & analyze**.

## API (extension / scripts)

All routes accept session cookies (browser) or `Authorization: Bearer <api_token>`.

- `GET /api/jobs` — list jobs
- `POST /api/jobs` — body: `{ raw_jd_text, url?, title?, company? }` → `{ id }`
- `GET /api/jobs/[id]` — `{ job, analyses }`
- `POST /api/jobs/[id]/analyze` — run LLM analysis and store result
- `PATCH /api/jobs/[id]` — `{ status?, notes? }`

## License

Private / personal use unless noted otherwise.
