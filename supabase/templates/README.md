# Auth email templates (Supabase)

Supabase sends **Confirm signup**, **Magic link**, **Reset password**, etc. Those bodies are edited in the **Supabase Dashboard** (or via [Management API](https://supabase.com/docs/guides/auth/auth-email-templates)), not in the Next.js app.

## Confirm signup (this repo)

1. Open [Supabase Dashboard](https://supabase.com/dashboard) → your project → **Authentication** → **Email Templates**.
2. Select **Confirm signup**.
3. Set **Subject** to something like:  
   `Confirm your email — layerlane-apply`
4. Paste the full HTML from [`confirm_signup.html`](confirm_signup.html) into the **Body** field.

The template uses [Go template variables](https://supabase.com/docs/guides/auth/auth-email-templates):

- `{{ .ConfirmationURL }}` — link users must click (or copy)
- `{{ .Email }}` — their address
- `{{ .Token }}` — one-time code (helps when email scanners “click” links too early)
- `{{ .SiteURL }}` — your configured Site URL

## Redirect URLs

Ensure **Authentication → URL Configuration** lists your app origins and `/auth/callback` (see the main [README](../../README.md)).

## Local development (Supabase CLI)

If you use `supabase start`, you can wire templates in `supabase/config.toml` with `content_path` pointing at these files — see [Customizing email templates](https://supabase.com/docs/guides/local-development/customizing-email-templates).
