import type { ProfilePrefs } from "./profile";

/** Short block prepended to the analysis user message when prefs exist. */
export function formatPreferenceContextForAnalysis(prefs: ProfilePrefs): string {
  const tone = typeof prefs.tone === "string" ? prefs.tone.trim() : "";
  const roles = Array.isArray(prefs.target_roles)
    ? prefs.target_roles.map((r) => String(r).trim()).filter(Boolean)
    : [];
  if (!tone && roles.length === 0) return "";

  const lines: string[] = ["## Candidate preferences"];
  if (tone) lines.push(`- Tone for written output: ${tone}`);
  if (roles.length) lines.push(`- Target roles: ${roles.join(", ")}`);
  return lines.join("\n");
}
