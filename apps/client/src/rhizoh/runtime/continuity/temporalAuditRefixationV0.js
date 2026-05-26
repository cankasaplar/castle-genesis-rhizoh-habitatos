/**
 * Temporal Audit + Re-Fixation Trigger V0 (Faz 2.6)
 *
 * "Is this fixation still epistemically valid, or only a historical decision?"
 * Prevents false stability: sync → audit → fixation (never reversed).
 */

import { computeWitnessDecayV0 } from "./temporalConflictResolutionV0.js";
import {
  FIXATION_PHASE_V0,
  applyTemporalAuthorityFixationV0,
  getTemporalAuthorityFixationStateV0,
  invalidateTemporalAuthorityFixationV0,
  normalizeCheckpointDriftV0
} from "./temporalAuthorityFixationV0.js";
import { runTemporalExecutionSyncPassV0 } from "./temporalExecutionSyncV0.js";
import { assertNodeExecutionJurisdictionV0 } from "./temporalIdentityBindingV0.js";
import {
  AUDIT_INTEGRITY_TRIGGER_V0,
  sealAuditRecordV0,
  validateAuditIntegrityV0
} from "./temporalAuditIntegrityV0.js";
import {
  buildLivingWorldBootstrapV0,
  runTemporalWorldSelectionV0
} from "./temporalWorldSelectionV0.js";

export const TEMPORAL_AUDIT_REFIXATION_SCHEMA_V0 =
  "castle.rhizoh.temporal_audit_refixation.v0";

/** Enforced pipeline — fixation without fresh sync is false stability. */
export const TEMPORAL_PIPELINE_ORDER_V0 = Object.freeze([
  "sync",
  "audit",
  "audit_integrity",
  "world_selection",
  "fixation"
]);

/** Full stack including post-pipeline persistence & re-legitimization (Faz 2.8–2.9). */
export const TEMPORAL_AUTHORITY_STACK_V0 = Object.freeze([
  "2.5.1_conflict",
  "2.5.2_binding",
  "2.5.3_sync",
  "2.5.6_audit",
  "2.5.7_integrity",
  "2.8_selection",
  "2.5.4_fixation",
  "2.8_seal",
  "2.9_relegitimize"
]);

export const FIXATION_AUDIT_VERDICT_V0 = Object.freeze({
  EPISTEMICALLY_VALID: "epistemically_valid",
  HISTORICAL_ONLY: "historical_only",
  STALE_WITNESS: "stale_witness",
  CONTRACT_REVOKED: "contract_revoked",
  DRIFT_EXCEEDED: "drift_exceeded",
  NOT_FIXED: "not_fixed"
});

export const REFIXATION_TRIGGER_V0 = Object.freeze({
  NONE: "none",
  INVALIDATE_FIXATION: "invalidate_fixation"
});

export const DEFAULT_AUDIT_POLICY_V0 = Object.freeze({
  /** Witness decay factor below this invalidates fixed passport. */
  minWitnessDecayForFixation: 0.35,
  maxCheckpointDriftTicks: 8
});

/**
 * @param {{
 *   fixationState?: import('./temporalAuthorityFixationV0.js').FixationStateV0 | null,
 *   stabilization: Awaited<ReturnType<typeof import('./temporalExecutionSyncV0.js').stabilizeNetworkExecutionAuthorityV0>>,
 *   selfNodeId: string,
 *   localContract?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0,
 *   peerContracts?: import('./temporalIdentityBindingV0.js').TimeOwnershipContractV0[],
 *   nowMs?: number,
 *   policy?: Partial<typeof DEFAULT_AUDIT_POLICY_V0>
 * }} input
 */
export function auditFixationEpistemicValidityV0(input) {
  const policy = { ...DEFAULT_AUDIT_POLICY_V0, ...input.policy };
  const nowMs = Number(input.nowMs) || Date.now();
  const stabilization = input.stabilization;
  const state = input.fixationState;
  const epistemicExecutor = stabilization?.networkExecutorNodeId ?? null;
  const fixedExecutor = state?.fixedExecutorNodeId ?? null;
  const participants = stabilization?.authorityParticipants || [];

  const base = {
    schema: TEMPORAL_AUDIT_REFIXATION_SCHEMA_V0,
    question: "Bu fixation hâlâ epistemik olarak geçerli mi, yoksa sadece tarihsel bir karar mı?",
    epistemicExecutorNodeId: epistemicExecutor,
    fixedExecutorNodeId: fixedExecutor,
    fixationPhase: state?.phase ?? null,
    falseStabilityRisk: false
  };

  if (!state || state.phase !== FIXATION_PHASE_V0.FIXED || !fixedExecutor) {
    return {
      ...base,
      verdict: FIXATION_AUDIT_VERDICT_V0.NOT_FIXED,
      trigger: REFIXATION_TRIGGER_V0.NONE,
      statement: "No fixed authority — audit defers to fresh sync."
    };
  }

  if (epistemicExecutor && String(fixedExecutor) !== String(epistemicExecutor)) {
    return {
      ...base,
      verdict: FIXATION_AUDIT_VERDICT_V0.HISTORICAL_ONLY,
      trigger: REFIXATION_TRIGGER_V0.INVALIDATE_FIXATION,
      falseStabilityRisk: true,
      statement:
        "False stability — fixation executor disagrees with fresh epistemic sync."
    };
  }

  const incumbent = participants.find((p) => String(p.nodeId) === String(fixedExecutor));
  const contract = incumbent?.contract || input.localContract;

  const jurisdiction = assertNodeExecutionJurisdictionV0(
    contract?.executionPermitted === false ? null : contract
  );
  if (jurisdiction.ok === false) {
    return {
      ...base,
      verdict: FIXATION_AUDIT_VERDICT_V0.CONTRACT_REVOKED,
      trigger: REFIXATION_TRIGGER_V0.INVALIDATE_FIXATION,
      falseStabilityRisk: true,
      statement: `Fixed executor contract revoked (${jurisdiction.code}).`
    };
  }

  if (contract?.issuedAtMs) {
    const decay = computeWitnessDecayV0(contract.issuedAtMs, nowMs);
    if (decay.factor < policy.minWitnessDecayForFixation) {
      return {
        ...base,
        verdict: FIXATION_AUDIT_VERDICT_V0.STALE_WITNESS,
        trigger: REFIXATION_TRIGGER_V0.INVALIDATE_FIXATION,
        falseStabilityRisk: true,
        witnessDecay: decay.factor,
        statement: "Stale witness — fixation is historical, not epistemically current."
      };
    }
  }

  const localContract = input.localContract || contract || { trustedCheckpointTick: 0 };
  const drift = normalizeCheckpointDriftV0(
    localContract,
    (input.peerContracts || []).filter((c) => c && c !== localContract),
    policy.maxCheckpointDriftTicks
  );

  if (!drift.withinBand) {
    return {
      ...base,
      verdict: FIXATION_AUDIT_VERDICT_V0.DRIFT_EXCEEDED,
      trigger: REFIXATION_TRIGGER_V0.INVALIDATE_FIXATION,
      falseStabilityRisk: true,
      drift,
      statement: "Checkpoint drift exceeded — re-fixation required."
    };
  }

  return {
    ...base,
    verdict: FIXATION_AUDIT_VERDICT_V0.EPISTEMICALLY_VALID,
    trigger: REFIXATION_TRIGGER_V0.NONE,
    falseStabilityRisk: false,
    drift,
    statement: "Fixation matches fresh epistemic ground."
  };
}

/**
 * Canonical pipeline: sync → audit → fixation (order enforced).
 *
 * @param {Parameters<typeof runTemporalExecutionSyncPassV0>[0] & {
 *   policy?: import('./temporalAuthorityFixationV0.js').typeof DEFAULT_AUTHORITY_FIXATION_POLICY_V0,
 *   auditPolicy?: Partial<typeof DEFAULT_AUDIT_POLICY_V0>
 * }} input
 */
export function runTemporalExecutionPipelineV0(input) {
  const diskKey = String(input.localContract?.diskKey || "default");
  const peerContracts = [
    input.localContract,
    input.remoteContract,
    ...(input.peerAdvertisements || []).map((ad) => ad?.contract).filter(Boolean)
  ];

  const syncPass = runTemporalExecutionSyncPassV0(input);

  const fixationState = getTemporalAuthorityFixationStateV0(diskKey);
  const audit = auditFixationEpistemicValidityV0({
    fixationState,
    stabilization: syncPass.stabilization,
    selfNodeId: input.selfNodeId,
    localContract: input.localContract,
    peerContracts,
    nowMs: input.nowMs,
    policy: input.auditPolicy
  });

  const auditIntegrity = validateAuditIntegrityV0({
    diskKey,
    currentAudit: audit,
    stabilization: syncPass.stabilization,
    fixationState,
    localContract: input.localContract,
    peerContracts,
    nowMs: input.nowMs
  });

  let refixation = null;
  if (audit.trigger === REFIXATION_TRIGGER_V0.INVALIDATE_FIXATION) {
    refixation = invalidateTemporalAuthorityFixationV0(diskKey, audit.verdict);
  }
  if (
    auditIntegrity.trigger === AUDIT_INTEGRITY_TRIGGER_V0.INVALIDATE_PRIOR_INTERPRETATION &&
    !refixation?.ok
  ) {
    refixation = invalidateTemporalAuthorityFixationV0(diskKey, auditIntegrity.verdict);
  }

  const auditSeal = sealAuditRecordV0(diskKey, {
    audit,
    groundingDigest: auditIntegrity.groundingDigest,
    nowMs: input.nowMs,
    fixationState: getTemporalAuthorityFixationStateV0(diskKey)
  });

  const worldSelection = runTemporalWorldSelectionV0({
    selfNodeId: input.selfNodeId,
    localContract: input.localContract,
    peerContracts,
    stabilization: syncPass.stabilization,
    audit,
    nowMs: input.nowMs
  });

  const activeContract = worldSelection.activeContract || input.localContract;
  const livingWorldBootstrap = buildLivingWorldBootstrapV0(worldSelection);

  const fixation = applyTemporalAuthorityFixationV0(syncPass.stabilization, {
    selfNodeId: input.selfNodeId,
    diskKey,
    localContract: activeContract,
    nowMs: input.nowMs,
    policy: input.policy,
    peerContracts
  });

  const postAudit =
    fixation.fixationPhase === FIXATION_PHASE_V0.FIXED
      ? auditFixationEpistemicValidityV0({
          fixationState: getTemporalAuthorityFixationStateV0(diskKey),
          stabilization: syncPass.stabilization,
          selfNodeId: input.selfNodeId,
          localContract: input.localContract,
          peerContracts,
          nowMs: input.nowMs,
          policy: input.auditPolicy
        })
      : audit;

  return {
    schema: TEMPORAL_AUDIT_REFIXATION_SCHEMA_V0,
    pipelineOrder: [...TEMPORAL_PIPELINE_ORDER_V0],
    syncPass,
    audit,
    auditIntegrity,
    auditSeal,
    worldSelection,
    livingWorldBootstrap,
    activeContract,
    postAudit,
    refixation,
    fixation,
    auditInterpretationStale:
      auditIntegrity.verdict === "stale_audit_interpretation" ||
      auditIntegrity.verdict === "grounding_shift",
    networkExecutorNodeId: fixation.effectiveExecutorNodeId,
    stabilizedSelfBinding: fixation.selfBinding,
    fixationPhase: fixation.fixationPhase,
    oscillationDamped: fixation.oscillationDamped,
    falseStabilityPrevented: audit.falseStabilityRisk && refixation?.ok === true
  };
}

/**
 * Guard — fixation before sync produces false stability.
 *
 * @param {string[]} steps
 */
export function assertTemporalPipelineOrderV0(steps) {
  const order = TEMPORAL_PIPELINE_ORDER_V0;
  let lastIdx = -1;
  for (const step of steps) {
    const idx = order.indexOf(step);
    if (idx < 0) {
      return { ok: false, code: "unknown_step", step };
    }
    if (idx <= lastIdx) {
      return {
        ok: false,
        code: "pipeline_order_violation",
        step,
        expectedOrder: order,
        message: "Pipeline order violation — fixation before sync causes false stability."
      };
    }
    lastIdx = idx;
  }
  return { ok: true, order };
}

/** @deprecated Alias — use {@link runTemporalExecutionPipelineV0}. */
export const runTemporalExecutionSyncWithFixationV0 = runTemporalExecutionPipelineV0;
