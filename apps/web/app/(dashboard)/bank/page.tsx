import { createClient } from "@/lib/supabase/server";
import {
  fieldCardClass,
  fieldInputClass,
  listItemCardClass,
  primaryButtonClass,
} from "@/lib/form-classes";
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
        <h1 className="font-display text-2xl font-semibold tracking-tight text-foreground">
          Evidence bank
        </h1>
        <p className="text-sm text-muted-foreground">
          Facts, bullets, and project stories power JD analysis and the extension.
        </p>
      </div>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Experience facts</h2>
        <form action={insertExperienceFact} className={`grid gap-2 ${fieldCardClass}`}>
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="company" placeholder="Company" className={fieldInputClass} />
            <input name="title" placeholder="Title" className={fieldInputClass} />
          </div>
          <textarea name="body" placeholder="What you did (facts)" rows={3} className={fieldInputClass} />
          <div className="grid gap-2 sm:grid-cols-2">
            <input name="start_date" placeholder="Start" className={fieldInputClass} />
            <input name="end_date" placeholder="End" className={fieldInputClass} />
          </div>
          <input name="tags" placeholder="tags, comma-separated" className={fieldInputClass} />
          <button type="submit" className={primaryButtonClass}>
            Add fact
          </button>
        </form>
        <ul className="flex flex-col gap-4">
          {(facts.data ?? []).map((row) => (
            <li key={row.id} className={listItemCardClass}>
              <form action={updateExperienceFact} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="company" defaultValue={row.company ?? ""} className={fieldInputClass} />
                  <input name="title" defaultValue={row.title ?? ""} className={fieldInputClass} />
                </div>
                <textarea name="body" defaultValue={row.body ?? ""} rows={3} className={fieldInputClass} />
                <div className="grid gap-2 sm:grid-cols-2">
                  <input name="start_date" defaultValue={row.start_date ?? ""} className={fieldInputClass} />
                  <input name="end_date" defaultValue={row.end_date ?? ""} className={fieldInputClass} />
                </div>
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className={fieldInputClass} />
                <div className="flex gap-2">
                  <button type="submit" className="text-sm text-primary underline">
                    Save
                  </button>
                </div>
              </form>
              <form action={deleteExperienceFact} className="mt-2">
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-destructive hover:underline">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Reusable bullets</h2>
        <form action={insertBullet} className={`grid gap-2 ${fieldCardClass}`}>
          <textarea name="body" required placeholder="Bullet text" rows={2} className={fieldInputClass} />
          <input name="category" placeholder="category (e.g. leadership)" className={fieldInputClass} />
          <input name="tags" placeholder="tags" className={fieldInputClass} />
          <button type="submit" className={primaryButtonClass}>
            Add bullet
          </button>
        </form>
        <ul className="flex flex-col gap-3">
          {(bullets.data ?? []).map((row) => (
            <li key={row.id} className={listItemCardClass}>
              <form action={updateBullet} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <textarea name="body" required defaultValue={row.body} rows={2} className={fieldInputClass} />
                <input name="category" defaultValue={row.category ?? ""} className={fieldInputClass} />
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className={fieldInputClass} />
                <button type="submit" className="w-fit text-sm text-primary underline">
                  Save
                </button>
              </form>
              <form action={deleteBullet}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-destructive hover:underline">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Project receipts</h2>
        <form action={insertProjectReceipt} className={`grid gap-2 ${fieldCardClass}`}>
          <input name="name" required placeholder="Project name" className={fieldInputClass} />
          <textarea name="problem" placeholder="Problem" rows={2} className={fieldInputClass} />
          <textarea name="action" placeholder="What you did" rows={2} className={fieldInputClass} />
          <textarea name="outcome" placeholder="Outcome / metrics" rows={2} className={fieldInputClass} />
          <input name="tech" placeholder="Tech" className={fieldInputClass} />
          <input name="tags" placeholder="tags" className={fieldInputClass} />
          <button type="submit" className={primaryButtonClass}>
            Add project
          </button>
        </form>
        <ul className="flex flex-col gap-4">
          {(receipts.data ?? []).map((row) => (
            <li key={row.id} className={listItemCardClass}>
              <form action={updateProjectReceipt} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <input name="name" required defaultValue={row.name} className={fieldInputClass} />
                <textarea name="problem" defaultValue={row.problem ?? ""} rows={2} className={fieldInputClass} />
                <textarea name="action" defaultValue={row.action ?? ""} rows={2} className={fieldInputClass} />
                <textarea name="outcome" defaultValue={row.outcome ?? ""} rows={2} className={fieldInputClass} />
                <input name="tech" defaultValue={row.tech ?? ""} className={fieldInputClass} />
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className={fieldInputClass} />
                <button type="submit" className="w-fit text-sm text-primary underline">
                  Save
                </button>
              </form>
              <form action={deleteProjectReceipt}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-destructive hover:underline">
                  Delete
                </button>
              </form>
            </li>
          ))}
        </ul>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Saved answers</h2>
        <p className="text-sm text-muted-foreground">
          Reusable blurbs for common prompts (cover letter snippets, &quot;why us&quot;, etc.).
        </p>
        <form action={insertSavedAnswer} className={`grid gap-2 ${fieldCardClass}`}>
          <input name="prompt_type" placeholder="prompt type" className={fieldInputClass} />
          <input name="title" placeholder="title" className={fieldInputClass} />
          <textarea name="body" required placeholder="Answer text" rows={3} className={fieldInputClass} />
          <input name="tags" placeholder="tags" className={fieldInputClass} />
          <button type="submit" className={primaryButtonClass}>
            Add answer
          </button>
        </form>
        <ul className="flex flex-col gap-3">
          {(answers.data ?? []).map((row) => (
            <li key={row.id} className={listItemCardClass}>
              <form action={updateSavedAnswer} className="grid gap-2">
                <input type="hidden" name="id" value={row.id} />
                <input name="prompt_type" defaultValue={row.prompt_type ?? ""} className={fieldInputClass} />
                <input name="title" defaultValue={row.title ?? ""} className={fieldInputClass} />
                <textarea name="body" required defaultValue={row.body} rows={3} className={fieldInputClass} />
                <input name="tags" defaultValue={(row.tags ?? []).join(", ")} className={fieldInputClass} />
                <button type="submit" className="w-fit text-sm text-primary underline">
                  Save
                </button>
              </form>
              <form action={deleteSavedAnswer}>
                <input type="hidden" name="id" value={row.id} />
                <button type="submit" className="text-sm text-destructive hover:underline">
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
