/**
 * Cognitive Action Layer V0 — Epistemic Traversal Layer (CNR axis 4).
 *
 * perception → traversal: click · expand · lineage walk · causal zoom
 * User walks causality graph — not data, state, or decisions.
 * CAL-01: causally inert · DR-01 · DR-02
 * @see docs/RHIZOH_COGNITIVE_ACTION_LAYER_V1.md
 * @see docs/RHIZOH_CAUSAL_NAVIGATION_RUNTIME_V1.md
 */

import { listAdmissionCommitsV0 } from "./admissionCubeCommitV0.js";
import { listMutationRecordsV0 } from "./mutationRecordEmitterV0.js";
import { listPendingCompressionQueueV0, listRecCycleHistoryV0 } from "./recTombstoneQueueV0.js";
import { assertDriftOutputGuardsV0, assertDriftSuggestionDr02V0 } from "./driftSuggestionGuardsV0.js";

export const COGNITIVE_ACTION_SCHEMA_V0 = "castle.rhizoh.cognitive_action.v0";
export const EPISTEMIC_EXPLORATION_SCHEMA_V0 = "castle.rhizoh.epistemic_exploration.v0";

export const CAL_INTERACTION_TYPE_V0 = Object.freeze({
  CATEGORY_SPIKE_CLICK: "category_spike_click",
  ALERT_PACKET_CLICK: "alert_packet_click",
  REC_EPOCH_CLICK: "rec_epoch_click",
  AUDIT_CHAIN_CLICK: "audit_chain_click"
});

/**
 * CAL-01 guard — exploration outputs must be read_only and causally inert.
 * @param {object} packet
 */
export function assertCognitiveActionCaInertV0(packet) {
  if (packet?.executionClass && packet.executionClass !== "read_only") {
    return Object.freeze({
      ok: false,
      code: "CAL_01_EXECUTION_LEAK",
      message: "CAL-01: cognitive action must not request mutation"
    });
  }
  if (packet?.causallyInert !== true) {
    return Object.freeze({
      ok: false,
      code: "CAL_01_NOT_INERT",
      message: "CAL-01: exploration packet must be causally inert"
    });
  }
  if (packet?.stateProposal?.proposedMutation || packet?.stateProposal?.targetUserId) {
    return Object.freeze({
      ok: false,
      code: "CAL_01_DR02_LEAK",
      message: "CAL-01/DR-02: state proposal must not contain mutation targets"
    });
  }
  return Object.freeze({ ok: true });
}

/**
 * @param {object[]} records
 * @param {string} category
 */
function filterRecordsByCategoryV0(records, category) {
  return records.filter((r) => r?.reason?.category === category);
}

/**
 * @param {object[]} records
 * @param {string} ticketId
 */
function filterRecordsByTicketV0(records, ticketId) {
  return records.filter((r) => r?.ticketId === ticketId);
}

/**
 * @param {object[]} records
 * @param {string} mutationId
 */
function buildAuditChainExpansionV0(records, mutationId) {
  const record = records.find((r) => r.mutationId === mutationId);
  if (!record) return null;
  return Object.freeze({
    ticketId: record.ticketId,
    intentId: record.intentId,
    mutationId: record.mutationId,
    epoch: record.epoch,
    status: record.status,
    reason: record.reason
  });
}

/**
 * @param {string} category
 * @param {object[]} lineage
 */
function buildDriftCauseChainV0(category, lineage) {
  const codes = new Map();
  for (const r of lineage) {
    const code = r?.reason?.primary || "NONE";
    codes.set(code, (codes.get(code) || 0) + 1);
  }
  return Object.freeze(
    [...codes.entries()].map(([code, count]) =>
      Object.freeze({ reasonCode: code, count, category })
    )
  );
}

/**
 * @param {string} [epochId]
 */
function buildRecInfluenceWindowV0(epochId) {
  const pending = listPendingCompressionQueueV0();
  const history = listRecCycleHistoryV0();
  const filtered = epochId ? pending.filter((p) => p.epoch === epochId) : pending;
  return Object.freeze({
    epochId: epochId || history[history.length - 1]?.epochId || "rec_soft",
    pendingCount: filtered.length,
    totalPending: pending.length,
    completedCycles: history.length,
    lastCycle: history[history.length - 1] ?? null
  });
}

/**
 * @param {string} category
 * @param {number} sampleCount
 */
function buildExplorationStateProposalV0(category, sampleCount) {
  const summary = `${String(category).toLowerCase()}_frequency_elevated_in_window`;
  const proposal = Object.freeze({
    kind: "exploration_view",
    summary,
    category,
    sampleCount,
    executionClass: "read_only"
  });
  const dr02 = assertDriftSuggestionDr02V0({ suggestion: summary });
  if (!dr02.ok) throw new Error(dr02.message);
  return proposal;
}

/**
 * @param {{
 *   interactionType: string,
 *   targetCategory?: string,
 *   alertId?: string,
 *   epochId?: string,
 *   auditChain?: { ticketId?: string, intentId?: string, mutationId?: string },
 *   records?: object[],
 *   alerts?: object[]
 * }} input
 */
export function exploreEpistemicInteractionV0(input) {
  const records = input.records ?? listMutationRecordsV0(200);
  const interactionType = String(input.interactionType || "");

  /** @type {object[]} */
  let ticketLineage = [];
  /** @type {object[]} */
  let driftCauseChain = [];
  let targetCategory = input.targetCategory;
  let recWindow = buildRecInfluenceWindowV0(input.epochId);
  const admissionHistory = listAdmissionCommitsV0(50).map((c) =>
    Object.freeze({
      admissionCommitId: c.admissionCommitId,
      cubeId: c.cubeId,
      auditChain: c.auditChain
    })
  );

  if (interactionType === CAL_INTERACTION_TYPE_V0.CATEGORY_SPIKE_CLICK) {
    targetCategory = String(input.targetCategory || "SC");
    ticketLineage = filterRecordsByCategoryV0(records, targetCategory);
    driftCauseChain = buildDriftCauseChainV0(targetCategory, ticketLineage);
  } else if (interactionType === CAL_INTERACTION_TYPE_V0.ALERT_PACKET_CLICK) {
    const alert = (input.alerts || []).find((a) => a.alertId === input.alertId);
    targetCategory = alert?.category || input.targetCategory || "SC";
    ticketLineage = filterRecordsByCategoryV0(records, targetCategory);
    driftCauseChain = buildDriftCauseChainV0(targetCategory, ticketLineage);
    if (alert) assertDriftOutputGuardsV0(alert);
  } else if (interactionType === CAL_INTERACTION_TYPE_V0.REC_EPOCH_CLICK) {
    recWindow = buildRecInfluenceWindowV0(input.epochId);
    ticketLineage = records.filter((r) => r.epoch === recWindow.epochId);
  } else if (interactionType === CAL_INTERACTION_TYPE_V0.AUDIT_CHAIN_CLICK) {
    const chain = input.auditChain || {};
    if (chain.mutationId) {
      const expanded = buildAuditChainExpansionV0(records, chain.mutationId);
      if (expanded) ticketLineage = [expanded];
    } else if (chain.ticketId) {
      ticketLineage = filterRecordsByTicketV0(records, chain.ticketId);
    }
    if (ticketLineage[0]?.reason?.category) {
      targetCategory = ticketLineage[0].reason.category;
      driftCauseChain = buildDriftCauseChainV0(targetCategory, ticketLineage);
    }
  }

  const packet = Object.freeze({
    schema: EPISTEMIC_EXPLORATION_SCHEMA_V0,
    interactionType,
    targetCategory: targetCategory ?? undefined,
    alertId: input.alertId,
    executionClass: "read_only",
    causallyInert: true,
    ticketLineage: Object.freeze(ticketLineage.slice(0, 50)),
    admissionHistory: Object.freeze(admissionHistory),
    driftCauseChain,
    recInfluenceWindow: recWindow,
    stateProposal: buildExplorationStateProposalV0(targetCategory || "NONE", ticketLineage.length),
    interpretationOnly: true,
    nonExecutive: true
  });

  const guard = assertCognitiveActionCaInertV0(packet);
  if (!guard.ok) throw new Error(guard.message);

  return packet;
}

/**
 * @param {{
 *   interaction: object,
 *   pipeline?: object
 * }} input
 */
export function bindCognitiveActionV0(input) {
  const p = input.pipeline || {};
  const exploration = exploreEpistemicInteractionV0({
    ...input.interaction,
    records: p.index ? listMutationRecordsV0(200) : input.interaction.records,
    alerts: p.anomalies?.alerts
  });

  return Object.freeze({
    schema: COGNITIVE_ACTION_SCHEMA_V0,
    exploration,
    interpretationOnly: true,
    nonExecutive: true,
    cubeStateCommit: false
  });
}
