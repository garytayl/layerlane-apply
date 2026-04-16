const MAX_CONTEXT_CHARS = 24_000;

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
  let text = parts.join("\n");
  if (text.length > MAX_CONTEXT_CHARS) {
    text = text.slice(0, MAX_CONTEXT_CHARS) + "\n…(truncated)";
  }
  return text;
}
