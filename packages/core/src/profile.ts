import { z } from "zod";

/** Stored in `profiles.prefs` — extend as product grows. */
export const profilePrefsSchema = z
  .object({
    tone: z.string().optional(),
    target_roles: z.array(z.string()).optional(),
  })
  .passthrough();

export type ProfilePrefs = z.infer<typeof profilePrefsSchema>;

export function parseProfilePrefs(value: unknown): ProfilePrefs {
  const parsed = profilePrefsSchema.safeParse(value);
  return parsed.success ? parsed.data : {};
}
