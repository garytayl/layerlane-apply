import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { deleteApiToken, updatePrefs } from "./actions";
import { NewTokenForm } from "./new-token-form";

export default async function SettingsPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("prefs")
    .eq("id", user.id)
    .single();

  const prefs = (profile?.prefs ?? {}) as {
    tone?: string;
    target_roles?: string[];
  };

  const admin = createAdminClient();
  const { data: tokens } = await admin
    .from("api_tokens")
    .select("id, label, created_at, last_used_at")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  return (
    <div className="flex max-w-2xl flex-col gap-10">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Preferences and extension access
        </p>
      </div>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">Preferences</h2>
        <form action={updatePrefs} className="flex flex-col gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Default tone (for future prompts)
            <input
              name="tone"
              defaultValue={prefs.tone ?? ""}
              placeholder="e.g. concise, friendly"
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Target roles (comma-separated)
            <input
              name="target_roles"
              defaultValue={(prefs.target_roles ?? []).join(", ")}
              className="rounded border border-neutral-300 px-3 py-2 dark:border-neutral-600 dark:bg-neutral-900"
            />
          </label>
          <button
            type="submit"
            className="w-fit rounded border border-neutral-300 px-4 py-2 text-sm dark:border-neutral-600"
          >
            Save preferences
          </button>
        </form>
      </section>

      <section className="flex flex-col gap-3">
        <h2 className="text-lg font-medium">API tokens (extension)</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Paste the token into the extension. Requests use{" "}
          <code className="rounded bg-neutral-100 px-1 dark:bg-neutral-800">Authorization: Bearer …</code>
        </p>
        <NewTokenForm />
        <ul className="mt-4 flex flex-col gap-2">
          {(tokens ?? []).map((t) => (
            <li
              key={t.id}
              className="flex flex-wrap items-center justify-between gap-2 rounded border border-neutral-200 px-3 py-2 text-sm dark:border-neutral-800"
            >
              <div>
                <span className="font-medium">{t.label ?? "Token"}</span>
                <span className="ml-2 text-neutral-500">
                  created {new Date(t.created_at).toLocaleString()}
                  {t.last_used_at
                    ? ` · last used ${new Date(t.last_used_at).toLocaleString()}`
                    : ""}
                </span>
              </div>
              <form action={deleteApiToken}>
                <input type="hidden" name="id" value={t.id} />
                <button type="submit" className="text-red-600 hover:underline">
                  Revoke
                </button>
              </form>
            </li>
          ))}
        </ul>
        {(!tokens || tokens.length === 0) && (
          <p className="text-sm text-neutral-500">No tokens yet.</p>
        )}
      </section>
    </div>
  );
}
