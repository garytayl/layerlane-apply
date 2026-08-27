import "server-only";

import {
  careerLedgerRecordKindSchema,
  chqOperationRequestSchema,
  verificationMethodSchema,
  verificationStatusSchema,
  type ChqOperationRequest,
  type ChqSourceKind,
} from "@layerlane/core";
import {
  getLocalLedgerDb,
  listLocalLedgerRecords,
  listLocalLedgerSources,
  listLocalInboxItems,
} from "@/lib/local-ledger";

export async function getCandidateProfile() {
  const records = await listLocalLedgerRecords();
  return {
    identity: records.filter((record) => record.kind === "identity"),
    experience: records.filter((record) => record.kind === "experience"),
    education: records.filter((record) => record.kind === "education"),
    skills: records.filter((record) => record.kind === "skill"),
    projects: records.filter((record) => record.kind === "project"),
    claims: records.filter((record) => record.kind === "claim"),
    preferences: records.filter((record) => record.kind === "preference"),
    counts: {
      experience: records.filter((record) => record.kind === "experience").length,
      education: records.filter((record) => record.kind === "education").length,
      projects: records.filter((record) => record.kind === "project").length,
      skills: records.filter((record) => record.kind === "skill").length,
      claims: records.filter((record) => record.kind === "claim").length,
      needs_review: records.filter((record) => record.needs_review).length,
    },
  };
}

export async function listExperience() {
  return (await listLocalLedgerRecords()).filter((record) => record.kind === "experience");
}

export async function searchEvidence(query: string) {
  const db = await getLocalLedgerDb();
  const result = await db.query<{
    id: string;
    ledger_record_id: string;
    record_label: string;
    record_kind: string;
    source_title: string | null;
    quote: string | null;
    note: string | null;
    supports: boolean;
    created_at: string;
  }>(
    `select e.id::text, e.ledger_record_id::text, r.label as record_label,
       r.kind as record_kind, s.title as source_title, e.quote, e.note,
       e.supports, e.created_at::text
     from ledger_evidence e
     join career_ledger_records r on r.id = e.ledger_record_id
     left join local_sources s on s.id = e.source_id
     where coalesce(e.quote, '') ilike $1
        or coalesce(e.note, '') ilike $1
        or r.label ilike $1
        or coalesce(s.title, '') ilike $1
     order by e.created_at desc`,
    [`%${query}%`],
  );
  return result.rows;
}

export async function searchVerifiedEvidence(query: string) {
  const db = await getLocalLedgerDb();
  const result = await db.query(
    `select e.id::text, e.ledger_record_id::text, r.label as record_label,
       r.kind as record_kind, s.title as source_title, e.quote, e.note,
       e.supports, e.created_at::text
     from ledger_evidence e
     join career_ledger_records r on r.id = e.ledger_record_id
     left join local_sources s on s.id = e.source_id
     where r.verification_status = 'verified' and e.supports = true
       and (coalesce(e.quote, '') ilike $1 or coalesce(e.note, '') ilike $1
         or r.label ilike $1 or coalesce(s.title, '') ilike $1)
     order by e.created_at desc`,
    [`%${query}%`],
  );
  return result.rows;
}

export async function getProjectEvidence(projectId: string) {
  const records = await listLocalLedgerRecords();
  const project = records.find((record) => record.id === projectId && record.kind === "project");
  return project ? { project, evidence: project.evidence } : null;
}

export async function listUnverifiedClaims() {
  return (await listLocalLedgerRecords()).filter(
    (record) =>
      record.kind === "claim" &&
      (record.verification_status === "unverified" || record.needs_review),
  );
}

export async function listConflicts() {
  return (await listLocalLedgerRecords()).filter(
    (record) =>
      record.verification_status === "disputed" ||
      record.evidence.some((evidence) => !evidence.supports),
  );
}

export async function listNeedsReview() {
  return (await listLocalLedgerRecords()).filter((record) => record.needs_review);
}

export async function getNeedsReview() {
  const [inbox, ledger] = await Promise.all([listLocalInboxItems(), listNeedsReview()]);
  return { inbox, ledger };
}

export async function createLedgerRecord(input: {
  kind: string;
  canonicalKey: string;
  label: string;
  summary: string;
}) {
  const db = await getLocalLedgerDb();
  const kind = careerLedgerRecordKindSchema.parse(input.kind);
  const id = crypto.randomUUID();
  await db.query(
    `insert into career_ledger_records
       (id, kind, canonical_key, label, value, needs_review)
     values ($1, $2, $3, $4, $5::jsonb, true)`,
    [id, kind, input.canonicalKey, input.label, JSON.stringify({ summary: input.summary })],
  );
  return { id };
}

export async function updateLedgerRecord(input: {
  id: string;
  kind: string;
  label: string;
  summary: string;
  needsReview: boolean;
}) {
  const db = await getLocalLedgerDb();
  const kind = careerLedgerRecordKindSchema.parse(input.kind);
  await db.query(
    `update career_ledger_records
     set kind = $2, label = $3, value = $4::jsonb, needs_review = $5, updated_at = now()
     where id = $1`,
    [input.id, kind, input.label, JSON.stringify({ summary: input.summary }), input.needsReview],
  );
}

export async function addLedgerEvidence(input: {
  ledgerRecordId: string;
  sourceId?: string;
  quote?: string;
  note?: string;
  supports: boolean;
}) {
  const quote = input.quote?.trim() || null;
  const note = input.note?.trim() || null;
  if (!quote && !note) throw new Error("Evidence needs a quote or note");
  const db = await getLocalLedgerDb();
  await db.query(
    `insert into ledger_evidence
       (id, ledger_record_id, source_id, quote, note, supports)
     values ($1, $2, $3, $4, $5, $6)`,
    [crypto.randomUUID(), input.ledgerRecordId, input.sourceId || null, quote, note, input.supports],
  );
  await db.query(
    `update career_ledger_records set needs_review = true, updated_at = now() where id = $1`,
    [input.ledgerRecordId],
  );
}

export async function recordVerificationDecision(input: {
  id: string;
  status: string;
  method: string;
  confidence: number;
  rationale: string;
  needsReview?: boolean;
}) {
  const db = await getLocalLedgerDb();
  const status = verificationStatusSchema.parse(input.status);
  const method = verificationMethodSchema.parse(input.method);
  if (!Number.isFinite(input.confidence) || input.confidence < 0 || input.confidence > 1) {
    throw new Error("confidence must be between 0 and 1");
  }

  await db.transaction(async (tx) => {
    const current = await tx.query<{ verification_status: string }>(
      "select verification_status from career_ledger_records where id = $1",
      [input.id],
    );
    if (!current.rows[0]) throw new Error("Ledger record not found");
    await tx.query(
      `insert into ledger_verification_events
        (id, ledger_record_id, previous_status, status, method, confidence, rationale)
       values ($1, $2, $3, $4, $5, $6, $7)`,
      [
        crypto.randomUUID(), input.id, current.rows[0].verification_status,
        status, method, input.confidence, input.rationale,
      ],
    );
    await tx.query(
      `update career_ledger_records
       set verification_status = $2, confidence = $3, needs_review = $4, updated_at = now()
       where id = $1`,
      [input.id, status, input.confidence, input.needsReview ?? false],
    );
  });
}

export async function confirmClaim(claimId: string, rationale: string, confidence = 1) {
  await assertClaim(claimId);
  await recordVerificationDecision({
    id: claimId,
    status: "verified",
    method: "user_attestation",
    confidence,
    rationale,
    needsReview: false,
  });
  return { claim_id: claimId, status: "verified" as const };
}

export async function rejectClaim(claimId: string, rationale: string) {
  await assertClaim(claimId);
  await recordVerificationDecision({
    id: claimId,
    status: "disputed",
    method: "user_attestation",
    confidence: 1,
    rationale,
    needsReview: false,
  });
  return { claim_id: claimId, status: "disputed" as const };
}

async function assertClaim(claimId: string) {
  const db = await getLocalLedgerDb();
  const result = await db.query("select id from career_ledger_records where id = $1 and kind = 'claim'", [claimId]);
  if (!result.rows[0]) throw new Error("Claim not found");
}

export async function ingestSource(input: {
  kind: ChqSourceKind;
  title: string;
  content: string;
  externalRef?: string;
}) {
  const db = await getLocalLedgerDb();
  const id = crypto.randomUUID();
  await db.query(
    `insert into local_sources (id, kind, title, content, external_ref)
     values ($1, $2, $3, $4, $5)`,
    [id, input.kind, input.title, input.content, input.externalRef || null],
  );
  return { source_id: id, status: "stored" as const };
}

export async function getLedgerOverview() {
  const [records, sources] = await Promise.all([
    listLocalLedgerRecords(),
    listLocalLedgerSources(),
  ]);
  return { records, sources };
}

export async function executeChqOperation(rawRequest: unknown) {
  const request = chqOperationRequestSchema.parse(rawRequest);
  return executeParsedOperation(request);
}

async function executeParsedOperation(request: ChqOperationRequest): Promise<unknown> {
  switch (request.operation) {
    case "get_candidate_profile": return getCandidateProfile();
    case "get_needs_review": return getNeedsReview();
    case "export_snapshot": return (await import("@/lib/chq-sync")).exportChqSnapshot();
    case "generate_resume_context": {
      const records = await listLocalLedgerRecords();
      return records.filter((record) => record.verification_status === "verified");
    }
    case "list_experience": return listExperience();
    case "search_evidence": return searchEvidence(request.query);
    case "search_verified_evidence": return searchVerifiedEvidence(request.query);
    case "propose_career_claim":
      return (await import("@/lib/chq-sync")).queueSyncItem({
        type: "career_claim", external_id: request.external_id, canonical_key: request.canonical_key, label: request.label,
        summary: request.summary, assertion_state: request.assertion_state, source: request.source,
        supports: true,
      });
    case "record_application":
      return (await import("@/lib/chq-sync")).queueSyncItem({
        type: "application_event", external_id: request.external_id, company: request.company, role: request.role,
        status: request.status, occurred_at: request.occurred_at,
        assertion_state: "proposed", source: request.source, supports: true,
      });
    case "update_application_status":
      return (await import("@/lib/chq-sync")).queueSyncItem({
        type: "application_event", external_id: request.external_id, application_id: request.application_id,
        status: request.status, occurred_at: request.occurred_at,
        assertion_state: "proposed", source: request.source, supports: true,
      });
    case "add_project_evidence": {
      if (!request.quote && !request.note) throw new Error("Project evidence needs a quote or note");
      const db = await getLocalLedgerDb();
      const project = await db.query<{ canonical_key: string }>(
        "select canonical_key from career_ledger_records where id = $1 and kind = 'project'",
        [request.project_id],
      );
      if (!project.rows[0]) throw new Error("Project not found");
      return (await import("@/lib/chq-sync")).queueSyncItem({
        type: "project_evidence", external_id: request.external_id, project_key: project.rows[0].canonical_key,
        quote: request.quote, note: request.note, supports: request.supports,
        assertion_state: "proposed", source: request.source,
      });
    }
    case "get_project_evidence": return getProjectEvidence(request.project_id);
    case "list_unverified_claims": return listUnverifiedClaims();
    case "list_conflicts": return listConflicts();
    case "confirm_claim": return confirmClaim(request.claim_id, request.rationale, request.confidence);
    case "reject_claim": return rejectClaim(request.claim_id, request.rationale);
    case "ingest_source":
      return ingestSource({
        kind: request.kind,
        title: request.title,
        content: request.content,
        externalRef: request.external_ref,
      });
  }
}
