/**
 * Mutation Record Emitter V0/V1 — justified transition audit trail.
 *
 * interpretationOnly · nonExecutive · append-only ledger in memory (v0)
 * @see docs/RHIZOH_MUTATION_REASON_CODE_ONTOLOGY_V1.md
 * @see docs/schemas/rhizoh-mutation-record-v2.schema.json
 */

import { TICKET_SECURITY_VALIDATOR_VERSION_V0, TICKET_VALIDATION_DECISION_V0 } from "./ticketSecurityConstantsV0.js";
import {
  inferActorTypeV1,
  inferStatusFromReasonV1,
  mapLegacyReasonsToOntologyV1,
  pickPrimaryReasonV1
} from "./mutationReasonCodeOntologyV1.js";

export const MUTATION_RECORD_SCHEMA_V0 = "castle.rhizoh.mutation_record.v0";
export const MUTATION_RECORD_SCHEMA_V1 = "castle.rhizoh.mutation_record.v1";

/** @type {object[]} */
const ledgerV0 = [];

let seqV0 = 0;

/**
 * @param {{
 *   decision: string,
 *   validation: { valid: boolean, reasons: string[], validatorVersion?: string, executionClass?: string },
 *   intent: { transitionType: string, ticketId: string, intentId?: string, traceGraphLink?: string },
 *   ticket?: { ticketId?: string, capabilityScope?: string, contextNodeCube?: string, traceGraphLink?: string, prismProjection?: string[] },
 *   actor?: { actorId?: string },
 *   epochId?: string,
 *   cubeId?: string,
 *   prism?: string,
 *   issuedAtMs?: number,
 *   latencyMs?: number,
 *   reconcileVersion?: string
 * }} input
 */
export function emitMutationRecordV0(input) {
  const started = Date.now();
  const decision = String(input.decision || TICKET_VALIDATION_DECISION_V0.REJECTED);
  const ticketId = String(input.ticket?.ticketId || input.intent?.ticketId || "");
  const intentId = String(input.intent?.intentId || "");
  const traceEdgeId = String(input.intent?.traceGraphLink || input.ticket?.traceGraphLink || "");
  const legacyReasons = [...(input.validation?.reasons || [])];
  const reasonsOntology = mapLegacyReasonsToOntologyV1(legacyReasons);
  const primaryReason = pickPrimaryReasonV1(legacyReasons, decision);
  const status = inferStatusFromReasonV1(primaryReason?.primary || "", decision);
  const actorId = String(input.actor?.actorId || "unknown");
  const prism =
    input.prism ||
    (Array.isArray(input.ticket?.prismProjection) ? input.ticket.prismProjection[0] : undefined);

  const recordV2 = Object.freeze({
    schema: MUTATION_RECORD_SCHEMA_V1,
    schemaVersion: 2,
    mutationId: `mut_${++seqV0}_${Date.now()}`,
    ticketId,
    intentId,
    status,
    reason: primaryReason,
    reasons: Object.freeze(reasonsOntology),
    actor: Object.freeze({
      actorId,
      type: inferActorTypeV1(actorId)
    }),
    epoch: String(input.epochId || "rec_soft"),
    trace: Object.freeze({
      traceGraphLink: traceEdgeId,
      cubeId: String(input.cubeId || input.ticket?.contextNodeCube || ""),
      prism: prism ? String(prism) : undefined,
      transitionId: String(input.intent?.transitionType || "")
    }),
    metrics: Object.freeze({
      latencyMs: Number.isFinite(input.latencyMs) ? input.latencyMs : Date.now() - started,
      validatorVersion: input.validation?.validatorVersion || TICKET_SECURITY_VALIDATOR_VERSION_V0,
      reconcileVersion: String(input.reconcileVersion || "v1")
    }),
    issuedAt: new Date(input.issuedAtMs ?? Date.now()).toISOString(),
    interpretationOnly: true,
    nonExecutive: true,
    legacy: Object.freeze({
      decision,
      executionClass: String(input.validation?.executionClass || "read_only"),
      capabilityScope: String(input.ticket?.capabilityScope || ""),
      valid: input.validation?.valid === true,
      reasons: Object.freeze(legacyReasons)
    })
  });

  ledgerV0.push(recordV2);
  return recordV2;
}

/** Test / debug: recent records. */
export function listMutationRecordsV0(limit = 50) {
  return ledgerV0.slice(-limit);
}

/** Group records by reason category for analytics. */
export function groupMutationRecordsByCategoryV0(limit = 200) {
  const slice = ledgerV0.slice(-limit);
  /** @type {Record<string, number>} */
  const counts = {};
  for (const r of slice) {
    const cat = r.reason?.category || "NONE";
    counts[cat] = (counts[cat] || 0) + 1;
  }
  return Object.freeze({ ...counts });
}

/** Test only. */
export function clearMutationRecordsForTestV0() {
  ledgerV0.length = 0;
  seqV0 = 0;
}
