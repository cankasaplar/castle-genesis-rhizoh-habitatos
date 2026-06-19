/**
 * Ticket Reconcile Proposal V0 — Graph Accountant output (SC-01).
 *
 * Derives proposedCubeDelta from TraceGraph summaries — never writes CubeState.
 * interpretationOnly · nonExecutive
 * @see docs/RHIZOH_SECURITY_BOUNDARY_V1.md (SC-01)
 */

import { MUTATION_REASON_CATEGORY_V1 } from "./mutationReasonCodeOntologyV1.js";

export const RECONCILE_PROPOSAL_SCHEMA_V0 = "castle.rhizoh.reconcile_proposal.v0";

/**
 * @param {{
 *   records: object[],
 *   indexSnapshot?: { statusLanes?: Record<string, number>, epochPartitions?: Record<string, number> },
 *   epochId?: string,
 *   ticketId?: string
 * }} input
 */
export function deriveReconcileProposalV0(input) {
  const records = input.records || [];
  const epochId = String(input.epochId || "rec_soft");
  const accepted = records.filter((r) => r?.status === "accepted");
  const quotaDenied = records.filter((r) => r?.status === "quota_denied");

  const rewardSignals = accepted.filter(
    (r) => r?.reason?.category === MUTATION_REASON_CATEGORY_V1.SIG
  );
  const rewardDelta =
    rewardSignals.length > 0 ? Math.min(1, 0.08 * rewardSignals.length) : 0;

  const quotaSummary = Object.freeze({
    deniedCount: quotaDenied.length,
    acceptedCount: accepted.length,
    remainingHint01: Math.max(0, 1 - quotaDenied.length / Math.max(1, records.length)),
    nextEpochReset: epochId
  });

  /** @type {string[]} */
  const reason = [];
  if (rewardDelta > 0) reason.push("prediction_match", "accepted_transition_batch");
  if (quotaDenied.length > 0) reason.push("quota_reconciliation_summary");
  if (reason.length === 0) reason.push("epoch_closeout_summary");

  const confidence = Math.max(
    0,
    Math.min(1, accepted.length / Math.max(1, records.length))
  );

  const proposedCubeDelta = Object.freeze({
    schema: RECONCILE_PROPOSAL_SCHEMA_V0,
    epochId,
    ticketId: input.ticketId ? String(input.ticketId) : undefined,
    rewardDelta: rewardDelta > 0 ? rewardDelta : undefined,
    quotaSummary,
    proposedMutation: Object.freeze({
      rankDelta: rewardDelta > 0 ? 1 : 0,
      rewardDelta: rewardDelta > 0 ? rewardDelta : undefined
    }),
    confidence,
    reason: Object.freeze(reason),
    executionClass: "system_reconcile",
    interpretationOnly: true,
    nonExecutive: true
  });

  return Object.freeze({
    schema: RECONCILE_PROPOSAL_SCHEMA_V0,
    proposedCubeDelta,
    summary: Object.freeze({
      acceptedCount: accepted.length,
      totalCount: records.length,
      indexSnapshot: input.indexSnapshot ? Object.freeze({ ...input.indexSnapshot }) : undefined
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}
