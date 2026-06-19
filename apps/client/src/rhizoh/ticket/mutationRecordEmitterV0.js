/**
 * Mutation Record Emitter V0 — audit trail for accepted and rejected transitions.
 *
 * interpretationOnly · nonExecutive · append-only ledger in memory (v0)
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md Invariant 3
 * @see docs/schemas/rhizoh-mutation-record-v1.schema.json
 */

import { TICKET_SECURITY_VALIDATOR_VERSION_V0, TICKET_VALIDATION_DECISION_V0 } from "./ticketSecurityConstantsV0.js";

export const MUTATION_RECORD_SCHEMA_V0 = "castle.rhizoh.mutation_record.v0";

/** @type {object[]} */
const ledgerV0 = [];

let seqV0 = 0;

/**
 * @param {{
 *   decision: string,
 *   validation: { valid: boolean, reasons: string[], validatorVersion?: string, executionClass?: string },
 *   intent: { transitionType: string, ticketId: string, traceGraphLink?: string },
 *   ticket?: { ticketId?: string, capabilityScope?: string, contextNodeCube?: string, traceGraphLink?: string },
 *   actor?: { actorId?: string },
 *   epochId?: string,
 *   cubeId?: string,
 *   issuedAtMs?: number
 * }} input
 */
export function emitMutationRecordV0(input) {
  const decision = String(input.decision || TICKET_VALIDATION_DECISION_V0.REJECTED);
  const ticketId = String(input.ticket?.ticketId || input.intent?.ticketId || "");
  const traceEdgeId = String(
    input.intent?.traceGraphLink || input.ticket?.traceGraphLink || ""
  );
  const record = Object.freeze({
    schema: MUTATION_RECORD_SCHEMA_V0,
    mutationId: `mut_${++seqV0}_${Date.now()}`,
    decision,
    validatorVersion: input.validation?.validatorVersion || TICKET_SECURITY_VALIDATOR_VERSION_V0,
    ticketId,
    actorId: String(input.actor?.actorId || "unknown"),
    traceGraphLink: traceEdgeId,
    traceEdgeId,
    epochId: String(input.epochId || "rec_soft"),
    executionClass: String(input.validation?.executionClass || "read_only"),
    capabilityScope: String(input.ticket?.capabilityScope || ""),
    intentId: String(input.intent?.intentId || ""),
    transitionId: String(input.intent?.transitionType || ""),
    cubeId: String(input.cubeId || input.ticket?.contextNodeCube || ""),
    valid: input.validation?.valid === true,
    reasons: Object.freeze([...(input.validation?.reasons || [])]),
    issuedAt: new Date(input.issuedAtMs ?? Date.now()).toISOString(),
    interpretationOnly: true,
    nonExecutive: true
  });
  ledgerV0.push(record);
  return record;
}

/** Test / debug: recent records. */
export function listMutationRecordsV0(limit = 50) {
  return ledgerV0.slice(-limit);
}

/** Test only. */
export function clearMutationRecordsForTestV0() {
  ledgerV0.length = 0;
  seqV0 = 0;
}
