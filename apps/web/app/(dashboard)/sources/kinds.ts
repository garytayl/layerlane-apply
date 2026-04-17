/** Shared labels for `source_documents.kind`. */
export const SOURCE_KIND_LABEL: Record<string, string> = {
  resume: "Resume",
  paste: "Paste",
  cover_letter: "Cover letter",
  linkedin: "LinkedIn / about",
  referral: "Referral",
  portfolio: "Portfolio",
  other: "Other",
};

/** Options for the new-source form `select name="kind"`. */
export const SOURCE_KIND_OPTIONS = [
  { value: "resume", label: "Resume" },
  { value: "linkedin", label: "LinkedIn / about" },
  { value: "cover_letter", label: "Cover letter" },
  { value: "referral", label: "Referral / testimonial" },
  { value: "portfolio", label: "Portfolio / project writeup" },
  { value: "paste", label: "General paste" },
  { value: "other", label: "Other" },
] as const;

export function labelSourceKind(kind: string): string {
  return SOURCE_KIND_LABEL[kind] ?? kind;
}
