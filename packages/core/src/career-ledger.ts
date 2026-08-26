import { z } from "zod";

export const careerLedgerRecordKindSchema = z.enum([
  "identity",
  "experience",
  "education",
  "project",
  "skill",
  "achievement",
  "credential",
  "preference",
]);

export const verificationStatusSchema = z.enum([
  "unverified",
  "supported",
  "verified",
  "disputed",
  "stale",
]);

export const verificationMethodSchema = z.enum([
  "source_match",
  "cross_source_match",
  "user_attestation",
  "manual_review",
]);

export const provenanceLocatorSchema = z
  .object({
    quote: z.string().min(1).optional(),
    page: z.number().int().positive().optional(),
    section: z.string().min(1).optional(),
    start_char: z.number().int().nonnegative().optional(),
    end_char: z.number().int().positive().optional(),
  })
  .refine(
    (value) =>
      value.start_char === undefined ||
      value.end_char === undefined ||
      value.end_char > value.start_char,
    { message: "end_char must be greater than start_char" },
  );

/** A canonical, reusable fact in the Master Career Ledger. */
export const careerLedgerRecordSchema = z.object({
  id: z.string().uuid(),
  kind: careerLedgerRecordKindSchema,
  canonical_key: z.string().min(1),
  label: z.string().min(1),
  value: z.record(z.unknown()),
  verification_status: verificationStatusSchema,
  confidence: z.number().min(0).max(1),
  valid_from: z.string().nullable(),
  valid_to: z.string().nullable(),
  last_verified_at: z.string().datetime().nullable(),
  created_at: z.string().datetime(),
  updated_at: z.string().datetime(),
});

export const ledgerEvidenceSchema = z.object({
  id: z.string().uuid(),
  ledger_record_id: z.string().uuid(),
  source_document_id: z.string().uuid().nullable(),
  source_chunk_id: z.string().uuid().nullable(),
  locator: provenanceLocatorSchema,
  supports: z.boolean(),
  note: z.string().nullable(),
  created_at: z.string().datetime(),
});

export type CareerLedgerRecordKind = z.infer<typeof careerLedgerRecordKindSchema>;
export type VerificationStatus = z.infer<typeof verificationStatusSchema>;
export type VerificationMethod = z.infer<typeof verificationMethodSchema>;
export type ProvenanceLocator = z.infer<typeof provenanceLocatorSchema>;
export type CareerLedgerRecord = z.infer<typeof careerLedgerRecordSchema>;
export type LedgerEvidence = z.infer<typeof ledgerEvidenceSchema>;
