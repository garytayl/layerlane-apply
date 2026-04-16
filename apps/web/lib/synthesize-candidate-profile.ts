import "server-only";

import OpenAI from "openai";
import {
  PROFILE_SYNTHESIS_SYSTEM_PROMPT,
  parseProfilePrefs,
  parseProfileSynthesisFromLlmJson,
} from "@layerlane/core";
import { createClient } from "@/lib/supabase/server";

function truncate(s: string, max: number): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export async function runCandidateProfileSynthesis(): Promise<void> {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) throw new Error("Unauthorized");

  const { data: profile } = await supabase
    .from("profiles")
    .select("prefs")
    .eq("id", user.id)
    .single();

  const prefs = parseProfilePrefs(profile?.prefs);

  const [facts, bullets, receipts, answers] = await Promise.all([
    supabase
      .from("experience_facts")
      .select("company, title, body, start_date, end_date")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(40),
    supabase
      .from("bullets")
      .select("body, category")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(60),
    supabase
      .from("project_receipts")
      .select("name, problem, action, outcome, tech")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
    supabase
      .from("saved_answers")
      .select("prompt_type, title, body")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(25),
  ]);

  const lines: string[] = [];
  if (prefs.tone || (prefs.target_roles && prefs.target_roles.length)) {
    lines.push(
      `Preferences: tone=${prefs.tone ?? ""}; target_roles=${(prefs.target_roles ?? []).join(", ")}`,
    );
  }

  for (const f of facts.data ?? []) {
    lines.push(
      `Experience: ${f.title ?? ""} @ ${f.company ?? ""} (${f.start_date ?? "?"}–${f.end_date ?? "?"}): ${truncate(f.body ?? "", 800)}`,
    );
  }
  for (const b of bullets.data ?? []) {
    lines.push(`Bullet [${b.category ?? "general"}]: ${truncate(b.body, 500)}`);
  }
  for (const r of receipts.data ?? []) {
    lines.push(
      `Project ${r.name}: problem=${truncate(r.problem ?? "", 400)} action=${truncate(r.action ?? "", 400)} outcome=${truncate(r.outcome ?? "", 400)} tech=${r.tech ?? ""}`,
    );
  }
  for (const a of answers.data ?? []) {
    lines.push(
      `Saved answer [${a.prompt_type ?? "note"}] ${a.title ?? ""}: ${truncate(a.body, 600)}`,
    );
  }

  const bundle = lines.join("\n\n").slice(0, 48_000);
  if (!bundle.trim()) {
    throw new Error("Add evidence in the bank or import a source before synthesizing a profile.");
  }

  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY is not set");
  }

  const openai = new OpenAI({ apiKey });
  const model = "gpt-4o-mini";

  const completion = await openai.chat.completions.create({
    model,
    response_format: { type: "json_object" },
    messages: [
      { role: "system", content: PROFILE_SYNTHESIS_SYSTEM_PROMPT },
      {
        role: "user",
        content: `Evidence bundle (may be incomplete):\n\n${bundle}`,
      },
    ],
  });

  const raw = completion.choices[0]?.message?.content;
  if (!raw) {
    throw new Error("Empty model response");
  }
  let parsedJson: unknown;
  try {
    parsedJson = JSON.parse(raw);
  } catch {
    throw new Error("Model did not return valid JSON");
  }

  const result = parseProfileSynthesisFromLlmJson(parsedJson);

  const { error } = await supabase
    .from("profiles")
    .update({
      candidate_summary: result.candidate_summary,
      synthesis: result.synthesis as unknown as Record<string, unknown>,
      synthesis_updated_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
    })
    .eq("id", user.id);

  if (error) {
    throw new Error(error.message);
  }
}
