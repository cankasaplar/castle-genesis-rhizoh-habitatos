/**
 * Economic strategy proposal queue v0 — human approval only; feedsExecution = false.
 * Mirrors Phase 3D governance shape; separate from execution / UX economy.
 */

import crypto from "node:crypto";

export const ECONOMIC_PROPOSAL_QUEUE_SCHEMA_V0 = "rhizoh.economic_strategy.proposal_queue.v0";
export const ECONOMIC_PROPOSAL_RECORD_SCHEMA_V0 = "rhizoh.economic_strategy.proposal.v0";

export const ECONOMIC_GOVERNANCE_STATE_V0 = Object.freeze({
  DRAFT: "draft",
  PENDING_HUMAN: "pending_human",
  APPROVED: "approved",
  REJECTED: "rejected",
  APPLIED_CONFIG: "applied_config",
  WITHDRAWN: "withdrawn"
});

export const ECONOMIC_STRATEGY_PROPOSAL_KIND_V0 = Object.freeze({
  GLOBAL_USD_CAP_TIGHTEN: "global_usd_cap_tighten",
  PRINCIPAL_TOKEN_CAP_REVIEW: "principal_token_cap_review",
  GLOBAL_DEGRADE_MODE: "global_degrade_mode",
  PROVIDER_RECONCILE_HOLD: "provider_reconcile_hold",
  MONITORING_HOLD: "monitoring_hold"
});

export const ECONOMIC_PROPOSAL_CONTRACT_V0 = Object.freeze({
  feedsExecution: false,
  cannotBeInterpretedAsGuidance: true,
  requiresHumanApproval: true,
  allowedApplySurface: "deploy_env_config_only"
});

/**
 * @param {{ kind: string, rationale: string, payload?: object }} input
 */
export function buildEconomicStrategyProposalV0(input) {
  const kind = String(input.kind || ECONOMIC_STRATEGY_PROPOSAL_KIND_V0.MONITORING_HOLD);
  return Object.freeze({
    schema: ECONOMIC_PROPOSAL_RECORD_SCHEMA_V0,
    proposalId: `esp_${crypto.randomBytes(8).toString("hex")}`,
    kind,
    state: ECONOMIC_GOVERNANCE_STATE_V0.DRAFT,
    rationale: String(input.rationale || "").slice(0, 512),
    payload: input.payload && typeof input.payload === "object" ? input.payload : {},
    contract: ECONOMIC_PROPOSAL_CONTRACT_V0,
    createdAtMs: Date.now()
  });
}

/**
 * @param {ReturnType<buildEconomicStrategyProposalV0>[]} proposals
 */
export function createEconomicStrategyProposalQueueV0(proposals = []) {
  const list = Array.isArray(proposals) ? proposals : [];
  const pending = list.map((p) => ({
    ...p,
    state: ECONOMIC_GOVERNANCE_STATE_V0.PENDING_HUMAN
  }));
  return Object.freeze({
    schema: ECONOMIC_PROPOSAL_QUEUE_SCHEMA_V0,
    contract: ECONOMIC_PROPOSAL_CONTRACT_V0,
    proposals: pending,
    counts: pending.reduce((acc, p) => {
      acc[p.kind] = (acc[p.kind] || 0) + 1;
      return acc;
    }, /** @type {Record<string, number>} */ ({}))
  });
}

/**
 * Human approval transition (no side effects).
 * @param {string} proposalId
 * @param {"approve"|"reject"|"withdraw"} event
 * @param {ReturnType<createEconomicStrategyProposalQueueV0>} queue
 */
export function transitionEconomicProposalV0(proposalId, event, queue) {
  const proposals = queue.proposals.map((p) => {
    if (p.proposalId !== proposalId) return p;
    if (event === "approve") return { ...p, state: ECONOMIC_GOVERNANCE_STATE_V0.APPROVED };
    if (event === "reject") return { ...p, state: ECONOMIC_GOVERNANCE_STATE_V0.REJECTED };
    if (event === "withdraw") return { ...p, state: ECONOMIC_GOVERNANCE_STATE_V0.WITHDRAWN };
    return p;
  });
  return createEconomicStrategyProposalQueueV0(
    proposals.map((p) => ({ ...p, state: ECONOMIC_GOVERNANCE_STATE_V0.DRAFT }))
  );
}
