/**
 * Phase 3D Mode B — Threshold proposal queue v0 (FROZEN schema, feedsExecution = false).
 * Human approval governance state machine — no runtime control backflow.
 * @see docs/ops/PHASE3D_PROPOSAL_QUEUE_V0.md
 * @see docs/ops/PHASE3D_HUMAN_APPROVAL_GOVERNANCE_V1.0.md
 */
import crypto from "node:crypto";
import { SHADOW_EVOLUTION_MODE_V0 } from "./phase3DShadowLearningBoundaryV0.js";

export const PROPOSAL_QUEUE_SCHEMA_V0 = "rhizoh.phase3d.proposal_queue.v0";
export const PROPOSAL_RECORD_SCHEMA_V0 = "rhizoh.phase3d.threshold_proposal.v0";
export const GOVERNANCE_MACHINE_SCHEMA_V0 = "rhizoh.phase3d.human_approval_governance.v0";

/** @readonly Terminal states — no outbound transitions except none. */
export const GOVERNANCE_STATE_V0 = Object.freeze({
  DRAFT: "draft",
  PENDING_HUMAN: "pending_human",
  UNDER_REVIEW: "under_review",
  APPROVED: "approved",
  REJECTED: "rejected",
  EXPIRED: "expired",
  SUPERSEDED: "superseded",
  APPLIED_CONFIG: "applied_config",
  WITHDRAWN: "withdrawn"
});

export const GOVERNANCE_EVENT_V0 = Object.freeze({
  SUBMIT: "submit",
  CLAIM_REVIEW: "claim_review",
  RELEASE_REVIEW: "release_review",
  APPROVE: "approve",
  REJECT: "reject",
  WITHDRAW: "withdraw",
  EXPIRE: "expire",
  SUPERSEDE: "supersede",
  APPLY_CONFIG: "apply_config"
});

export const GOVERNANCE_ACTOR_ROLE_V0 = Object.freeze({
  SYSTEM_SHADOW: "system_shadow",
  OPS_REVIEWER: "ops_reviewer",
  OPS_APPROVER: "ops_approver",
  DEPLOY_OPERATOR: "deploy_operator"
});

export const PROPOSAL_KIND_V0 = Object.freeze({
  ENTROPY_LIMIT_DELTA: "entropy_limit_delta",
  DIVERGENCE_MID_DELTA: "divergence_mid_delta",
  DIVERGENCE_LOW_DELTA: "divergence_low_delta",
  DIVERGENCE_HIGH_DELTA: "divergence_high_delta",
  MODELED_PROJECTION_SCHEMA_BUMP: "modeled_projection_schema_bump",
  MONITORING_HOLD: "monitoring_hold"
});

/** Frozen transition table (from, event, to, actorRole). */
export const GOVERNANCE_TRANSITION_TABLE_V0 = Object.freeze([
  { from: GOVERNANCE_STATE_V0.DRAFT, event: GOVERNANCE_EVENT_V0.SUBMIT, to: GOVERNANCE_STATE_V0.PENDING_HUMAN, actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW },
  { from: GOVERNANCE_STATE_V0.DRAFT, event: GOVERNANCE_EVENT_V0.WITHDRAW, to: GOVERNANCE_STATE_V0.WITHDRAWN, actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW },
  { from: GOVERNANCE_STATE_V0.PENDING_HUMAN, event: GOVERNANCE_EVENT_V0.CLAIM_REVIEW, to: GOVERNANCE_STATE_V0.UNDER_REVIEW, actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_REVIEWER },
  { from: GOVERNANCE_STATE_V0.PENDING_HUMAN, event: GOVERNANCE_EVENT_V0.WITHDRAW, to: GOVERNANCE_STATE_V0.WITHDRAWN, actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_REVIEWER },
  { from: GOVERNANCE_STATE_V0.PENDING_HUMAN, event: GOVERNANCE_EVENT_V0.EXPIRE, to: GOVERNANCE_STATE_V0.EXPIRED, actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW },
  { from: GOVERNANCE_STATE_V0.UNDER_REVIEW, event: GOVERNANCE_EVENT_V0.APPROVE, to: GOVERNANCE_STATE_V0.APPROVED, actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_APPROVER },
  { from: GOVERNANCE_STATE_V0.UNDER_REVIEW, event: GOVERNANCE_EVENT_V0.REJECT, to: GOVERNANCE_STATE_V0.REJECTED, actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_APPROVER },
  { from: GOVERNANCE_STATE_V0.UNDER_REVIEW, event: GOVERNANCE_EVENT_V0.RELEASE_REVIEW, to: GOVERNANCE_STATE_V0.PENDING_HUMAN, actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_REVIEWER },
  { from: GOVERNANCE_STATE_V0.UNDER_REVIEW, event: GOVERNANCE_EVENT_V0.EXPIRE, to: GOVERNANCE_STATE_V0.EXPIRED, actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW },
  { from: GOVERNANCE_STATE_V0.APPROVED, event: GOVERNANCE_EVENT_V0.APPLY_CONFIG, to: GOVERNANCE_STATE_V0.APPLIED_CONFIG, actorRole: GOVERNANCE_ACTOR_ROLE_V0.DEPLOY_OPERATOR },
  { from: GOVERNANCE_STATE_V0.APPROVED, event: GOVERNANCE_EVENT_V0.SUPERSEDE, to: GOVERNANCE_STATE_V0.SUPERSEDED, actorRole: GOVERNANCE_ACTOR_ROLE_V0.OPS_APPROVER },
  { from: GOVERNANCE_STATE_V0.APPROVED, event: GOVERNANCE_EVENT_V0.EXPIRE, to: GOVERNANCE_STATE_V0.EXPIRED, actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW }
]);

const TERMINAL_STATES_V0 = new Set([
  GOVERNANCE_STATE_V0.REJECTED,
  GOVERNANCE_STATE_V0.EXPIRED,
  GOVERNANCE_STATE_V0.SUPERSEDED,
  GOVERNANCE_STATE_V0.APPLIED_CONFIG,
  GOVERNANCE_STATE_V0.WITHDRAWN
]);

const APPROVABLE_KINDS_V0 = new Set([
  PROPOSAL_KIND_V0.ENTROPY_LIMIT_DELTA,
  PROPOSAL_KIND_V0.DIVERGENCE_MID_DELTA,
  PROPOSAL_KIND_V0.DIVERGENCE_LOW_DELTA,
  PROPOSAL_KIND_V0.DIVERGENCE_HIGH_DELTA,
  PROPOSAL_KIND_V0.MODELED_PROJECTION_SCHEMA_BUMP
]);

export const HUMAN_APPROVAL_GOVERNANCE_MACHINE_V0 = Object.freeze({
  schema: GOVERNANCE_MACHINE_SCHEMA_V0,
  version: "v0",
  feedsExecution: false,
  initialState: GOVERNANCE_STATE_V0.DRAFT,
  terminalStates: Object.freeze([...TERMINAL_STATES_V0]),
  transitions: GOVERNANCE_TRANSITION_TABLE_V0,
  closureRule: "only_applied_config_may_bump_phase3_config_after_control_harness_pass",
  illegal: Object.freeze([
    "auto_approve",
    "approve_from_attractor_score",
    "apply_config_without_approved_state",
    "pending_human_to_applied_config_skip"
  ])
});

/**
 * @param {string} from
 * @param {string} event
 */
export function resolveGovernanceTransitionV0(from, event) {
  return (
    GOVERNANCE_TRANSITION_TABLE_V0.find((t) => t.from === from && t.event === event) ?? null
  );
}

/**
 * Apply governance event to a proposal (pure — no side effects on control runtime).
 * @param {object} proposal
 * @param {string} event
 * @param {{ actorRole: string, actorId?: string, atMs?: string, note?: string, harnessPass?: boolean }} ctx
 */
export function transitionProposalGovernanceV0(proposal, event, ctx) {
  const row = resolveGovernanceTransitionV0(proposal.state, event);
  if (!row) {
    return Object.freeze({ ok: false, error: "illegal_transition", proposal });
  }
  if (row.actorRole !== ctx.actorRole) {
    return Object.freeze({ ok: false, error: "actor_role_mismatch", expected: row.actorRole });
  }
  if (event === GOVERNANCE_EVENT_V0.APPROVE && !APPROVABLE_KINDS_V0.has(proposal.kind)) {
    return Object.freeze({ ok: false, error: "kind_not_approvable", kind: proposal.kind });
  }
  if (event === GOVERNANCE_EVENT_V0.APPLY_CONFIG) {
    if (ctx.harnessPass !== true) {
      return Object.freeze({ ok: false, error: "apply_config_requires_control_harness_pass" });
    }
  }

  const auditEntry = Object.freeze({
    atMs: ctx.atMs ?? new Date().toISOString(),
    actorId: ctx.actorId ?? ctx.actorRole,
    actorRole: ctx.actorRole,
    event,
    from: proposal.state,
    to: row.to,
    note: ctx.note ?? null
  });

  const next = Object.freeze({
    ...proposal,
    state: row.to,
    updatedAtMs: auditEntry.atMs,
    auditTrail: Object.freeze([...(proposal.auditTrail ?? []), auditEntry])
  });

  return Object.freeze({ ok: true, proposal: next });
}

/**
 * @param {{
 *   kind: string,
 *   delta: object,
 *   evidence: object,
 *   rationale: string,
 *   atMs?: string
 * }} spec
 */
export function createThresholdProposalV0(spec) {
  const atMs = spec.atMs ?? new Date().toISOString();
  return Object.freeze({
    schema: PROPOSAL_RECORD_SCHEMA_V0,
    proposalId: `prop_${crypto.randomBytes(8).toString("hex")}`,
    feedsExecution: false,
    cannotBeInterpretedAsGuidance: true,
    displayHint: "non_executable_configuration_hypothesis",
    kind: spec.kind,
    state: GOVERNANCE_STATE_V0.DRAFT,
    createdAtMs: atMs,
    updatedAtMs: atMs,
    delta: Object.freeze(spec.delta),
    evidence: Object.freeze(spec.evidence),
    rationale: spec.rationale,
    targetConfigSchema: "rhizoh.phase3.config.v0",
    auditTrail: Object.freeze([])
  });
}

/**
 * Build proposal queue from observation export inputs (shadow → draft proposals).
 * @param {{
 *   atMs: string,
 *   exportRef: string,
 *   operabilityBalance?: { balance: string, overGating?: boolean, underSensitive?: boolean },
 *   phase31Plan?: { triggers: string[] },
 *   phase3D?: { stressorExitAnalysis?: { primaryEjector?: string }, perturbationSensitivityMap?: { summary?: object } }
 * }} input
 */
export function buildProposalQueueV0(input) {
  const { atMs, exportRef, operabilityBalance, phase31Plan, phase3D } = input;
  const proposals = [];

  const evidence = Object.freeze({
    exportRef,
    primaryEjector: phase3D?.stressorExitAnalysis?.primaryEjector ?? null,
    perturbationSummary: phase3D?.perturbationSensitivityMap?.summary ?? null,
    operabilityBalance: operabilityBalance?.balance ?? null
  });

  if (operabilityBalance?.overGating) {
    proposals.push(
      createThresholdProposalV0({
        kind: PROPOSAL_KIND_V0.ENTROPY_LIMIT_DELTA,
        delta: Object.freeze({ key: "entropyLimit", step: -0.05, unit: "absolute" }),
        evidence,
        rationale: "over_gating_operational_relax_entropy_bound",
        atMs
      })
    );
  }
  if (operabilityBalance?.underSensitive) {
    proposals.push(
      createThresholdProposalV0({
        kind: PROPOSAL_KIND_V0.DIVERGENCE_MID_DELTA,
        delta: Object.freeze({ key: "divergenceMid", step: -0.05, unit: "absolute" }),
        evidence,
        rationale: "under_sensitive_tighten_divergence_mid",
        atMs
      })
    );
  }
  if (operabilityBalance?.balance === "balanced") {
    proposals.push(
      createThresholdProposalV0({
        kind: PROPOSAL_KIND_V0.MONITORING_HOLD,
        delta: Object.freeze({ action: "hold_static_thresholds" }),
        evidence,
        rationale: "balanced_window_monitoring_only",
        atMs
      })
    );
  }

  const submitted = proposals.map((p) => {
    if (p.kind === PROPOSAL_KIND_V0.MONITORING_HOLD) return p;
    const r = transitionProposalGovernanceV0(p, GOVERNANCE_EVENT_V0.SUBMIT, {
      actorRole: GOVERNANCE_ACTOR_ROLE_V0.SYSTEM_SHADOW,
      atMs,
      note: "shadow_export_auto_submit"
    });
    return r.ok ? r.proposal : p;
  });

  const stats = countByStateV0(submitted);

  return Object.freeze({
    schema: PROPOSAL_QUEUE_SCHEMA_V0,
    feedsExecution: false,
    cannotBeInterpretedAsGuidance: true,
    evolutionMode: SHADOW_EVOLUTION_MODE_V0.PROPOSAL_SEMI_ACTUATOR,
    atMs,
    governance: HUMAN_APPROVAL_GOVERNANCE_MACHINE_V0,
    proposals: Object.freeze(submitted),
    stats,
    note: "queue_is_observation_sidecar_not_control_input"
  });
}

/**
 * @param {ReturnType<typeof buildProposalQueueV0>} queue
 */
export function validateProposalQueueV0(queue) {
  const violations = [];
  if (queue.feedsExecution !== false) violations.push("queue_feedsExecution_must_be_false");
  if (queue.cannotBeInterpretedAsGuidance !== true) {
    violations.push("queue_cannot_be_interpreted_as_guidance");
  }
  if (queue.schema !== PROPOSAL_QUEUE_SCHEMA_V0) violations.push("invalid_queue_schema");
  for (const p of queue.proposals ?? []) {
    if (p.feedsExecution !== false) violations.push(`proposal_${p.proposalId}_feedsExecution`);
    if (p.cannotBeInterpretedAsGuidance !== true) {
      violations.push(`proposal_${p.proposalId}_cannot_be_interpreted_as_guidance`);
    }
    if (p.schema !== PROPOSAL_RECORD_SCHEMA_V0) violations.push(`proposal_${p.proposalId}_schema`);
    if (p.targetConfigSchema?.includes("live")) violations.push("no_live_config_target");
  }
  return Object.freeze({ ok: violations.length === 0, violations: Object.freeze(violations) });
}

function countByStateV0(proposals) {
  const counts = {};
  for (const p of proposals) {
    counts[p.state] = (counts[p.state] || 0) + 1;
  }
  return Object.freeze(counts);
}
