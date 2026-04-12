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

Supabase sends mail from **their** infrastructure unless you add [custom SMTP](https://supabase.com/docs/guides/auth/auth-smtp). Check these in order:

1. **Confirm email is required**  
   **Authentication → Providers → Email** → enable **Confirm email** (if this is off, Supabase does not send a confirmation message; the app will log you straight in after signup).

2. **Custom template broke sending**  
   Temporarily reset **Confirm signup** in the dashboard to Supabase’s **default** HTML. If mail works again, fix your pasted template (invalid `{{ ... }}` or bad HTML can cause failures — see **Logs** below).

3. **Redirect URL not allowed**  
   **Authentication → URL Configuration → Redirect URLs** must include exactly  
   `{NEXT_PUBLIC_APP_URL}/auth/callback`  
   (e.g. `https://layerlane-apply.vercel.app/auth/callback`). A mismatch can make `signUp` fail; the app now shows the Supabase error on the signup form.

4. **Rate limits & spam**  
   Free projects have low auth-email limits. Wait and retry, check **spam/junk**, and try another inbox provider to rule out blocking.

5. **Supabase logs**  
   **Logs → Auth** (or **Project → Logs**) for mailer errors when you sign up.

6. **Production deliverability**  
   For real users, configure **custom SMTP** (e.g. Resend, Postmark, SES) so messages come from your domain and land in the inbox.

7. **Local CLI**  
   With `supabase start`, auth mail is usually captured in [Inbucket](http://127.0.0.1:54324) (see local Supabase output for the URL).
