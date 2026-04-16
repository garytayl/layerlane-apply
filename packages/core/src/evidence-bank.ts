const MAX_CONTEXT_CHARS = 24_000;
const MAX_SAVED_ANSWER_ROWS = 24;
const MAX_SAVED_ANSWER_BODY_CHARS = 600;

export type SavedAnswerRow = {
  id: string;
  prompt_type: string | null;
  title: string | null;
  body: string;
};

export type EvidenceBankRows = {
  facts: { id: string; body: string | null; company: string | null; title: string | null }[];
  bullets: { id: string; body: string; category: string | null }[];
  receipts: {
    id: string;
    name: string;
    problem: string | null;
    action: string | null;
    outcome: string | null;
    tech: string | null;
  }[];
  /** Reusable blurbs (cover letters, “why us”) — use when suggesting narrative text. */
  saved_answers?: SavedAnswerRow[];
};

/**
 * Formats the user's evidence bank for LLM context. Pure — safe to reuse from Expo later.
 */
export function formatEvidenceBankContext(rows: EvidenceBankRows): string {
  const parts: string[] = [];
  parts.push("## Experience facts");
  for (const f of rows.facts) {
    parts.push(`- [${f.id}] ${f.company ?? ""} ${f.title ?? ""}: ${f.body ?? ""}`);
  }
  parts.push("\n## Bullets");
  for (const b of rows.bullets) {
    parts.push(`- [${b.id}] (${b.category ?? "general"}) ${b.body}`);
  }
  parts.push("\n## Project receipts");
  for (const r of rows.receipts) {
    parts.push(
      `- [${r.id}] ${r.name}: problem=${r.problem ?? ""} action=${r.action ?? ""} outcome=${r.outcome ?? ""} tech=${r.tech ?? ""}`,
    );
  }

  const answers = rows.saved_answers ?? [];
  if (answers.length > 0) {
    parts.push("\n## Saved answers (reuse or adapt for this role; IDs in brackets)");
    const slice = answers.slice(0, MAX_SAVED_ANSWER_ROWS);
    for (const a of slice) {
      const label = [a.prompt_type, a.title].filter(Boolean).join(" — ") || "snippet";
      let body = a.body;
      if (body.length > MAX_SAVED_ANSWER_BODY_CHARS) {
        body = body.slice(0, MAX_SAVED_ANSWER_BODY_CHARS) + "…";
      }
      parts.push(`- [${a.id}] (${label}) ${body}`);
    }
  }

  let text = parts.join("\n");
  if (text.length > MAX_CONTEXT_CHARS) {
    text = text.slice(0, MAX_CONTEXT_CHARS) + "\n…(truncated)";
  }
  return text;
}
