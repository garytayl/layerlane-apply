import Link from "next/link";
import { candidateSynthesisSchema, parseProfilePrefs } from "@layerlane/core";
import { createClient } from "@/lib/supabase/server";
import { SynthesizeForm } from "./synthesize-form";

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, prefs, candidate_summary, synthesis, synthesis_updated_at")
    .eq("id", user.id)
    .single();

  const prefs = parseProfilePrefs(profile?.prefs);
  const syn = candidateSynthesisSchema.safeParse(profile?.synthesis);

  return (
    <div className="flex flex-col gap-10">
      <div>
        <h1 className="font-display text-2xl font-semibold tracking-tight">Profile</h1>
        <p className="text-sm text-muted-foreground">
          Your candidate intelligence layer: synthesized from evidence + preferences, grounded in what you
          import.
        </p>
      </div>

      <section className="flex flex-col gap-3 rounded-lg border border-border bg-card/40 p-4">
        <h2 className="text-sm font-medium uppercase tracking-wide text-muted-foreground">Quick links</h2>
        <div className="flex flex-wrap gap-3 text-sm">
          <Link href="/sources/new" className="text-primary underline underline-offset-4">
            Add a source (resume, paste, …)
          </Link>
          <Link href="/sources" className="text-primary underline underline-offset-4">
            All sources
          </Link>
          <Link href="/bank" className="text-primary underline underline-offset-4">
            Evidence bank
          </Link>
          <Link href="/settings" className="text-primary underline underline-offset-4">
            Tone &amp; target roles
          </Link>
        </div>
        <p className="text-xs text-muted-foreground">
          Preferences: {prefs.tone ? `tone “${prefs.tone}”` : "no default tone"}
          {prefs.target_roles?.length
            ? ` · targets: ${prefs.target_roles.join(", ")}`
            : ""}
        </p>
      </section>

      <section className="flex flex-col gap-4">
        <h2 className="text-lg font-medium">Living summary</h2>
        <SynthesizeForm />
        {profile?.synthesis_updated_at ? (
          <p className="text-xs text-muted-foreground">
            Last synthesized {new Date(profile.synthesis_updated_at).toLocaleString()}
          </p>
        ) : null}
        {profile?.candidate_summary ? (
          <div className="space-y-3 text-sm leading-relaxed text-foreground">
            {profile.candidate_summary.split("\n\n").map((para: string, i: number) => (
              <p key={i}>{para}</p>
            ))}
          </div>
        ) : (
          <p className="text-sm text-muted-foreground">
            No summary yet. Add evidence to your bank (or import a source), then regenerate.
          </p>
        )}
      </section>

      {syn.success && Object.keys(syn.data).length > 0 ? (
        <section className="flex flex-col gap-4">
          <h2 className="text-lg font-medium">Structured synthesis</h2>
          <div className="grid gap-4 text-sm">
            {syn.data.role_clusters && syn.data.role_clusters.length > 0 ? (
              <div>
                <h3 className="font-medium text-muted-foreground">Role clusters</h3>
                <p>{syn.data.role_clusters.join(" · ")}</p>
              </div>
            ) : null}
            {syn.data.strengths && syn.data.strengths.length > 0 ? (
              <div>
                <h3 className="font-medium text-muted-foreground">Strengths</h3>
                <ul className="list-inside list-disc">
                  {syn.data.strengths.map((s) => (
                    <li key={s}>{s}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {syn.data.positioning ? (
              <div>
                <h3 className="font-medium text-muted-foreground">Positioning</h3>
                <p className="whitespace-pre-wrap">{syn.data.positioning}</p>
              </div>
            ) : null}
            {syn.data.evidence_themes && syn.data.evidence_themes.length > 0 ? (
              <div>
                <h3 className="font-medium text-muted-foreground">Evidence-backed themes</h3>
                <ul className="flex flex-col gap-2">
                  {syn.data.evidence_themes.map((t) => (
                    <li key={t.theme}>
                      <span className="font-medium">{t.theme}</span>
                      {t.supports?.length ? (
                        <span className="text-muted-foreground"> — {t.supports.join("; ")}</span>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {syn.data.portfolio_highlights && syn.data.portfolio_highlights.length > 0 ? (
              <div>
                <h3 className="font-medium text-muted-foreground">Portfolio highlights</h3>
                <ul className="list-inside list-disc">
                  {syn.data.portfolio_highlights.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {syn.data.voice_notes ? (
              <div>
                <h3 className="font-medium text-muted-foreground">Voice</h3>
                <p className="whitespace-pre-wrap">{syn.data.voice_notes}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
