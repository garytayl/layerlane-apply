import { createClient } from "@/lib/supabase/server";
import {
  deleteBullet,
  deleteExperienceFact,
  deleteProjectReceipt,
  deleteSavedAnswer,
  insertBullet,
  insertExperienceFact,
  insertProjectReceipt,
  insertSavedAnswer,
  updateBullet,
  updateExperienceFact,
  updateProjectReceipt,
  updateSavedAnswer,
} from "./actions";

export default async function BankPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const [facts, bullets, receipts, answers] = await Promise.all([
    supabase
      .from("experience_facts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase.from("bullets").select("*").eq("user_id", user.id).order("created_at", { ascending: false }),
    supabase
      .from("project_receipts")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
    supabase
      .from("saved_answers")
      .select("*")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false }),
  ]);

  return (
    <div className="flex flex-col gap-12">
      <div>
        <h1 className="text-2xl font-semibold">Evidence bank</h1>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Facts, bullets, and project stories power JD analysis and the extension.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Experience facts</h2>
        <form action={insertExperienceFact} className="grid gap-2 rounded border border-neutral-200 p-4 dark:border-neutral-800">
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="company" placeholder="Company" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input name="title" placeholder="Title" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
          <textarea name="body" placeholder="What you did (facts)" rows={3} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="start_date" placeholder="Start" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
            <input name="end_date" placeholder="End" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          </div>
          <input name="tags" placeholder="tags, comma-separated" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <button type="submit" className="w-fit rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">
            Add fact
          </button>
        </form>
        <ul className="flex flex-col gap-4">
          {(facts.data ?? []).map((row) => (
            <li key={row.id} className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
              <form action={updateExperienceFact} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="company" defaultValue={row.company ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                  <input name="title" defaultValue={row.title ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                </div>
                <textarea name="body" defaultValue={row.body ?? ""} rows={3} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="start_date" defaultValue={row.start_date ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                  <input name="end_date" defaultValue={row.end_date ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                </div>
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <div className="flex gap-2">
                  <button type="submit" className="text-sm underline">
                    Save
                  </button>
                </div>
              </form>
              <form action={deleteExperienceFact} className="mt-2">
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-red-600">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Reusable bullets</h2>
        <form action={insertBullet} className="grid gap-2 rounded border border-neutral-200 p-4 dark:border-neutral-800">
          <textarea name="body" required placeholder="Bullet text" rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <input name="category" placeholder="category (e.g. leadership)" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <input name="tags" placeholder="tags" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <button type="submit" className="w-fit rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">
            Add bullet
          </button>
        </form>
        <ul className="flex flex-col gap-3">
          {(bullets.data ?? []).map((row) => (
            <li key={row.id} className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
              <form action={updateBullet} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <textarea name="body" required defaultValue={row.body} rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <input name="category" defaultValue={row.category ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <button type="submit" className="w-fit text-sm underline">
                  Save
                </button>
              </form>
              <form action={deleteBullet}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-red-600">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Project receipts</h2>
        <form action={insertProjectReceipt} className="grid gap-2 rounded border border-neutral-200 p-4 dark:border-neutral-800">
          <input name="name" required placeholder="Project name" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <textarea name="problem" placeholder="Problem" rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <textarea name="action" placeholder="What you did" rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <textarea name="outcome" placeholder="Outcome / metrics" rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <input name="tech" placeholder="Tech" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <input name="tags" placeholder="tags" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <button type="submit" className="w-fit rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">
            Add project
          </button>
        </form>
        <ul className="flex flex-col gap-4">
          {(receipts.data ?? []).map((row) => (
            <li key={row.id} className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
              <form action={updateProjectReceipt} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <input name="name" required defaultValue={row.name} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <textarea name="problem" defaultValue={row.problem ?? ""} rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <textarea name="action" defaultValue={row.action ?? ""} rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <textarea name="outcome" defaultValue={row.outcome ?? ""} rows={2} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <input name="tech" defaultValue={row.tech ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <button type="submit" className="w-fit text-sm underline">
                  Save
                </button>
              </form>
              <form action={deleteProjectReceipt}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-red-600">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Saved answers</h2>
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          Reusable blurbs for common prompts (cover letter snippets, &quot;why us&quot;, etc.).
        </p>
        <form action={insertSavedAnswer} className="grid gap-2 rounded border border-neutral-200 p-4 dark:border-neutral-800">
          <input name="prompt_type" placeholder="prompt type" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <input name="title" placeholder="title" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <textarea name="body" required placeholder="Answer text" rows={3} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <input name="tags" placeholder="tags" className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
          <button type="submit" className="w-fit rounded bg-neutral-900 px-3 py-1.5 text-sm text-white dark:bg-neutral-100 dark:text-neutral-900">
            Add answer
          </button>
        </form>
        <ul className="flex flex-col gap-3">
          {(answers.data ?? []).map((row) => (
            <li key={row.id} className="rounded border border-neutral-200 p-3 dark:border-neutral-800">
              <form action={updateSavedAnswer} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <input name="prompt_type" defaultValue={row.prompt_type ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <input name="title" defaultValue={row.title ?? ""} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <textarea name="body" required defaultValue={row.body} rows={3} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className="rounded border px-2 py-1 text-sm dark:border-neutral-700 dark:bg-neutral-900" />
                <button type="submit" className="w-fit text-sm underline">
                  Save
                </button>
              </form>
              <form action={deleteSavedAnswer}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-red-600">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>
    </div>
  );
}
