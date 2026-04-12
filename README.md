# layerlane-apply

Personal job search assistant: a small **dashboard** (source of truth for experience, bullets, project stories, and analyzed roles) plus a **browser extension** that reads job postings and returns copy-ready outputs against that data.

## Repository layout

| Path | Purpose |
|------|---------|
| [apps/web](apps/web) | Next.js App Router app: auth, CRUD bank, jobs, analysis API, settings (API tokens) |
| [extension](extension) | Chrome extension (MV3): capture page text, call the web API with Bearer token |
| [supabase/migrations](supabase/migrations) | Postgres schema + RLS (apply in Supabase SQL or via Supabase CLI) |

## Prerequisites

- Node 20+
- A [Supabase](https://supabase.com) project
- An [OpenAI](https://platform.openai.com) API key (for JD analysis)

## 1. Database

1. Create a Supabase project.
2. Run the SQL in [`supabase/migrations/20250412130000_init.sql`](supabase/migrations/20250412130000_init.sql) in the Supabase SQL editor (or use `supabase db push` if you use the Supabase CLI linked to this project).
3. In **Authentication → Providers**, enable **Email** (password or magic link as you prefer).

## 2. Web app (`apps/web`)

Copy environment variables:

```bash
cd apps/web
cp .env.example .env.local
```

Set:

| Variable | Description |
|----------|-------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Project URL (Settings → API) |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | `anon` public key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Server only** — used for API-token auth paths |
| `OPENAI_API_KEY` | For `/api/jobs/[id]/analyze` and server-side “Re-analyze” |
| `NEXT_PUBLIC_APP_URL` | Public base URL of this app (used in signup email redirect), e.g. `http://localhost:3000` |

Install and run:

```bash
cd apps/web
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign up, open **Settings**, generate an **API token** for the extension, and seed the **Bank** before running analysis.

## 3. Browser extension (`extension`)

Build the unpacked extension:

```bash
cd extension
npm install
npm run build
```

In Chrome: **Extensions → Load unpacked →** choose `extension/dist`.

In the extension popup, set **App base URL** (e.g. `http://localhost:3000`) and paste the **API token** from the web app, click **Save settings**, then open a job posting and use **Capture page & analyze**.

## API (extension / scripts)

All routes accept session cookies (browser) or `Authorization: Bearer <api_token>`.

- `GET /api/jobs` — list jobs
- `POST /api/jobs` — body: `{ raw_jd_text, url?, title?, company? }` → `{ id }`
- `GET /api/jobs/[id]` — `{ job, analyses }`
- `POST /api/jobs/[id]/analyze` — run LLM analysis and store result
- `PATCH /api/jobs/[id]` — `{ status?, notes? }`

## License

Private / personal use unless noted otherwise.
