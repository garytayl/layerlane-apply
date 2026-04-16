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
          <div className="max-w-prose rounded-lg border border-border/80 bg-muted/30 px-4 py-5 text-[15px] leading-[1.75] text-foreground">
            <div className="whitespace-pre-line">{profile.candidate_summary}</div>
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
          <div className="grid gap-5 text-sm leading-relaxed">
            {syn.data.role_clusters && syn.data.role_clusters.length > 0 ? (
              <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Role clusters
                </h3>
                <p className="text-foreground">{syn.data.role_clusters.join(" · ")}</p>
              </div>
            ) : null}
            {syn.data.strengths && syn.data.strengths.length > 0 ? (
              <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Strengths
                </h3>
                <ul className="list-none space-y-2 pl-0">
                  {syn.data.strengths.map((s) => (
                    <li key={s} className="flex gap-2 text-foreground">
                      <span className="select-none text-muted-foreground" aria-hidden>
                        ·
                      </span>
                      <span>{s}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {syn.data.positioning ? (
              <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Positioning
                </h3>
                <p className="whitespace-pre-line text-foreground">{syn.data.positioning}</p>
              </div>
            ) : null}
            {syn.data.evidence_themes && syn.data.evidence_themes.length > 0 ? (
              <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3">
                <h3 className="mb-3 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Evidence-backed themes
                </h3>
                <ul className="flex flex-col gap-4">
                  {syn.data.evidence_themes.map((t) => (
                    <li
                      key={t.theme}
                      className="border-l-2 border-primary/35 pl-4 text-foreground"
                    >
                      <p className="font-medium text-foreground">{t.theme}</p>
                      {t.supports?.length ? (
                        <ul className="mt-2 list-none space-y-1.5 text-sm text-muted-foreground">
                          {t.supports.map((x) => (
                            <li key={x} className="flex gap-2">
                              <span className="text-primary/60" aria-hidden>
                                —
                              </span>
                              <span>{x}</span>
                            </li>
                          ))}
                        </ul>
                      ) : null}
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {syn.data.portfolio_highlights && syn.data.portfolio_highlights.length > 0 ? (
              <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Portfolio highlights
                </h3>
                <ul className="list-none space-y-2">
                  {syn.data.portfolio_highlights.map((p) => (
                    <li key={p} className="flex gap-2 text-foreground">
                      <span className="text-muted-foreground" aria-hidden>
                        ◆
                      </span>
                      <span>{p}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
            {syn.data.voice_notes ? (
              <div className="rounded-lg border border-border/80 bg-card/50 px-4 py-3">
                <h3 className="mb-2 text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                  Voice
                </h3>
                <p className="whitespace-pre-line italic text-foreground/90">{syn.data.voice_notes}</p>
              </div>
            ) : null}
          </div>
        </section>
      ) : null}
    </div>
  );
}
