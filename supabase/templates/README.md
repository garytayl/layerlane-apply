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

## Not receiving emails?

1. **Confirm email is required**  
   In Supabase: **Authentication** → **Providers** → **Email**. If **Confirm email** is off, Supabase **does not send** a confirmation message — users are signed in immediately. The app now redirects straight to `/bank` when that happens.

2. **Check Auth logs**  
   **Authentication** → **Logs** (or **Project** → **Logs** → filter Auth). Look for mailer errors, rate limits, or SMTP failures.

3. **Spam / Promotions**  
   Default Supabase sender addresses are easy for Gmail/Outlook to file under Spam until you use **custom SMTP** with your domain.

4. **Built-in email limits**  
   The shared Supabase mailer has [strict rate limits](https://supabase.com/docs/guides/platform/going-into-prod#auth-rate-limits). For production, configure **custom SMTP** ([docs](https://supabase.com/docs/guides/auth/auth-smtp)).

5. **Redirect URL**  
   `emailRedirectTo` must use a URL listed under **Authentication** → **URL Configuration** → **Redirect URLs**. A mismatch does not always block sending, but fix it so the link in the email works.

6. **Same email again**  
   Signing up twice with an existing address may not send another confirmation; use **password reset** or delete the user in **Authentication** → **Users** for testing.
