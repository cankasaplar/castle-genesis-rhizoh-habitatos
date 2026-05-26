/**
 * Decision Latency Governance Layer (DLGL) v0 — compress operator decision path without bypassing CAB.
 * Problem: ASGL → ACRL → ECL → CAB → human inflates time-to-decision (decision latency inflation).
 * DLGL does not execute; it pre-bundles the human packet and surfaces fast-path vs full-stack review.
 * @see docs/ops/DECISION_LATENCY_GOVERNANCE_V1.0.md
 */

import { COHERENCE_VERDICT_V0 } from "./epistemicCoherenceLayerV0.js";
import { EXECUTION_ELIGIBILITY_V0 } from "./actionContextResolutionLayerV0.js";

export const DECISION_LATENCY_GOVERNANCE_SCHEMA_V0 = "rhizoh.decision_latency_governance.v0";

export const DECISION_CHAIN_STEP_V0 = Object.freeze({
  ASGL: "asgl_semantic_map",
  ACRL: "acrl_context_filter",
  ECL: "ecl_coherence_bind",
  CAB: "cab_authority_cap",
  HUMAN: "human_final_owner"
});

export const LATENCY_TIER_V0 = Object.freeze({
  IMMEDIATE_HUMAN_PACKET: "immediate_human_packet",
  STANDARD_REVIEW: "standard_review",
  DEFERRED_ESCALATION: "deferred_escalation"
});

export const LATENCY_RISK_CLASS_V0 = Object.freeze({
  ROBOTICS_OVER_SAFE_FREEZE: "robotics_over_safe_freeze",
  OPS_BLOCKED_BUT_HEALTHY: "ops_blocked_but_healthy",
  UX_COHERENT_ACTIONLESS: "ux_coherent_actionless"
});

/**
 * @param {object} narrativeExport
 */
export function measureDecisionChainDepthV0(narrativeExport) {
  const present = [
    narrativeExport?.actionSemanticGovernance?.schema ? DECISION_CHAIN_STEP_V0.ASGL : null,
    narrativeExport?.actionContextResolution?.schema ? DECISION_CHAIN_STEP_V0.ACRL : null,
    narrativeExport?.epistemicCoherence?.schema ? DECISION_CHAIN_STEP_V0.ECL : null,
    narrativeExport?.coherenceAuthorityBoundary?.schema ? DECISION_CHAIN_STEP_V0.CAB : null,
    DECISION_CHAIN_STEP_V0.HUMAN
  ].filter(Boolean);

  return Object.freeze({
    steps: Object.freeze(present),
    depth: present.length,
    operatorCognitiveHops: Math.max(0, present.length - 1),
    inflationNote: "each_layer_correct_but_serializes_human_attention"
  });
}

/**
 * 0 = low latency pressure, 1 = high (many gates before human can act).
 * @param {object} narrativeExport
 */
export function scoreDecisionLatencyInflationV0(narrativeExport) {
  const chain = measureDecisionChainDepthV0(narrativeExport);
  const ecl = narrativeExport?.epistemicCoherence;
  const acrl = narrativeExport?.actionContextResolution;
  const contradictions = ecl?.crossLayerContradictions?.count ?? 0;
  const verdict = ecl?.systemCoherence?.verdict;

  let score = 0.25 + chain.depth * 0.12;
  if (verdict === COHERENCE_VERDICT_V0.FRAGMENTED) score += 0.15;
  if (verdict === COHERENCE_VERDICT_V0.CONTRADICTORY) score += 0.25;
  score += Math.min(0.2, contradictions * 0.05);
  if (acrl?.domainCollision?.detected) score += 0.1;

  const evaluated = acrl?.executionEligibilityMatrix?.length ?? 0;
  const blockedCount =
    acrl?.executionEligibilityMatrix?.filter((m) =>
      Object.values(m.matrix || {}).every(
        (d) =>
          d.eligibility === EXECUTION_ELIGIBILITY_V0.BLOCKED ||
          d.eligibility === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED
      )
    ).length ?? 0;
  if (evaluated > 0 && blockedCount / evaluated > 0.7) score += 0.1;

  score = Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));

  return Object.freeze({
    score,
    pressure: score >= 0.7 ? "high" : score >= 0.45 ? "medium" : "low",
    chainDepth: chain.depth
  });
}

/**
 * Fast path = one pre-digested human packet; does NOT set can_execute or bypass CAB.
 * @param {object} narrativeExport
 */
export function resolveFastPathEligibilityV0(narrativeExport) {
  const inflation = scoreDecisionLatencyInflationV0(narrativeExport);
  const ecl = narrativeExport?.epistemicCoherence;
  const cab = narrativeExport?.coherenceAuthorityBoundary;
  const critical = (ecl?.crossLayerContradictions?.criticalCount ?? 0) > 0;
  const bindingOk = cab?.eclAuthorityBinding?.valid !== false;
  const canExecute = narrativeExport?.interpretationSafetyContract?.can_execute === true;

  const eligible =
    !canExecute &&
    bindingOk &&
    !critical &&
    ecl?.systemCoherence?.verdict !== COHERENCE_VERDICT_V0.CONTRADICTORY &&
    inflation.pressure !== "high";

  return Object.freeze({
    eligible,
    reason: eligible
      ? "skip_re_reading_five_layers_use_human_packet"
      : critical
        ? "critical_cross_layer_conflict_requires_full_stack"
        : inflation.pressure === "high"
          ? "latency_inflation_high_use_standard_review"
          : "binding_or_verdict_blocks_compression",
    preserves: Object.freeze(["cab_negations", "acrl_hard_constraints", "raw_first"])
  });
}

/**
 * @param {object} narrativeExport
 */
export function detectLatencyRiskPatternsV0(narrativeExport) {
  const health = narrativeExport?.systemState?.health || "unknown";
  const robotics = narrativeExport?.appliedSystemsLayer?.roboticsGrounding;
  const acrl = narrativeExport?.actionContextResolution;
  const ecl = narrativeExport?.epistemicCoherence;
  const fp = acrl?.contextFingerprint;

  /** @type {object[]} */
  const patterns = [];

  if (
    robotics?.blockActuation === true &&
    !fp?.roboticsActuationEligible &&
    fp?.coordinationSimActive !== true
  ) {
    patterns.push(
      Object.freeze({
        class: LATENCY_RISK_CLASS_V0.ROBOTICS_OVER_SAFE_FREEZE,
        severity: "medium",
        note: "delayed_actuation_over_safe_hold_until_sensor_acrl_path",
        releaseWhen: Object.freeze([
          "sensor_verified_state",
          "acrl_robotics_eligibility_ok",
          "human_signoff_if_high_risk"
        ])
      })
    );
  }

  const gclOk = fp?.gclHealthy !== false;
  if (
    gclOk &&
    (health === "stable" || health === "stressed") &&
    health !== "degraded"
  ) {
    const deploy = acrl?.actionOverloadingRisk?.deployAgentExample;
    const mostlyBlocked =
      deploy?.spiral_mmo === EXECUTION_ELIGIBILITY_V0.BLOCKED &&
      deploy?.robotics === EXECUTION_ELIGIBILITY_V0.BLOCKED;
    if (mostlyBlocked) {
      patterns.push(
        Object.freeze({
          class: LATENCY_RISK_CLASS_V0.OPS_BLOCKED_BUT_HEALTHY,
          severity: "low",
          note: "permission_blocked_not_system_unhealthy",
          operatorRead: "check_raw_gcl_not_ecl_verdict_alone"
        })
      );
    }
  }

  if (
    ecl?.systemCoherence?.verdict === COHERENCE_VERDICT_V0.COHERENT ||
    ecl?.systemCoherence?.verdict === COHERENCE_VERDICT_V0.FRAGMENTED
  ) {
    patterns.push(
      Object.freeze({
        class: LATENCY_RISK_CLASS_V0.UX_COHERENT_ACTIONLESS,
        severity: "medium",
        note: "coherent_signal_without_automated_action_by_design",
        mitigation: "human_packet_next_action_with_sla"
      })
    );
  }

  return Object.freeze({
    detected: patterns.length > 0,
    patterns: Object.freeze(patterns)
  });
}

/**
 * Single operator packet — reduces decision latency without authority upgrade.
 * @param {object} narrativeExport
 */
export function buildHumanDecisionPacketV0(narrativeExport) {
  const runbook = narrativeExport?.humanOps?.humanDecisionOpsRunbook;
  const ackMinutes = runbook?.sla?.ackMinutes ?? 30;
  const routeId = runbook?.routing?.routeId ?? "default";
  const eclUx = narrativeExport?.epistemicCoherence?.uxCompression;
  const deploy = narrativeExport?.actionContextResolution?.actionOverloadingRisk?.deployAgentExample;
  const fast = resolveFastPathEligibilityV0(narrativeExport);

  let primaryActionId = "observe_and_verify_raw";
  let actionHint = "RAW + GCL doğrula; ECL başlığı tek yüzey";

  if (deploy?.governance === EXECUTION_ELIGIBILITY_V0.REVIEW_REQUIRED) {
    primaryActionId = "human_review_deploy_agent_governance";
    actionHint = "deploy_agent governance scaling — insan onayı (ACRL review_required)";
  } else if (deploy?.robotics === EXECUTION_ELIGIBILITY_V0.OK) {
    primaryActionId = "confirm_robotics_sensor_path_then_actuate";
    actionHint = "ACRL robotics OK — sensor path confirm, sonra hareket";
  }

  return Object.freeze({
    schema: "rhizoh.human_decision_packet.v0",
    fastPathEligible: fast.eligible,
    routeId,
    ackSlaMinutes: ackMinutes,
    primaryActionId,
    actionHint,
    decisionOwner: narrativeExport?.interpretationSafetyContract?.decision_owner,
    layersSkippedWhenFastPath: fast.eligible
      ? Object.freeze(["re_read_asgl_matrix", "re_read_acrl_matrix", "re_parse_cab_negations"])
      : Object.freeze([]),
    bundle: Object.freeze({
      headline: eclUx?.headline?.tr,
      operatorDecision: eclUx?.operatorDecision,
      cabBanner: narrativeExport?.coherenceAuthorityBoundary?.disclaimers?.mandatoryBanner?.tr,
      health: narrativeExport?.systemState?.health,
      gcl: narrativeExport?.actionContextResolution?.contextFingerprint?.gclHealthy
        ? "healthy"
        : "stressed"
    })
  });
}

/**
 * @param {object} narrativeExport
 */
export function classifyDecisionLatencyTierV0(narrativeExport) {
  const inflation = scoreDecisionLatencyInflationV0(narrativeExport);
  const fast = resolveFastPathEligibilityV0(narrativeExport);
  const verdict = narrativeExport?.epistemicCoherence?.systemCoherence?.verdict;

  if (verdict === COHERENCE_VERDICT_V0.CONTRADICTORY || inflation.pressure === "high") {
    return LATENCY_TIER_V0.DEFERRED_ESCALATION;
  }
  if (fast.eligible) return LATENCY_TIER_V0.IMMEDIATE_HUMAN_PACKET;
  return LATENCY_TIER_V0.STANDARD_REVIEW;
}

/**
 * @param {object} narrativeExport
 */
export function buildDecisionLatencyGovernanceLayerV0(narrativeExport) {
  const chain = measureDecisionChainDepthV0(narrativeExport);
  const inflation = scoreDecisionLatencyInflationV0(narrativeExport);
  const fastPath = resolveFastPathEligibilityV0(narrativeExport);
  const latencyRisks = detectLatencyRiskPatternsV0(narrativeExport);
  const humanPacket = buildHumanDecisionPacketV0(narrativeExport);
  const tier = classifyDecisionLatencyTierV0(narrativeExport);

  return Object.freeze({
    schema: DECISION_LATENCY_GOVERNANCE_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "compress_human_decision_latency_without_bypassing_cab",
    problem: "decision_latency_inflation",
    decisionChain: chain,
    latencyInflation: inflation,
    latencyTier: tier,
    fastPath,
    humanDecisionPacket: humanPacket,
    latencyRisks,
    domainGuidance: Object.freeze({
      robotics: Object.freeze({
        risk: LATENCY_RISK_CLASS_V0.ROBOTICS_OVER_SAFE_FREEZE,
        guidance: "freeze_is_permission_delay_not_semantic_error",
        target: "minimize_time_to_sensor_verified_human_packet"
      }),
      ops: Object.freeze({
        risk: LATENCY_RISK_CLASS_V0.OPS_BLOCKED_BUT_HEALTHY,
        guidance: "blocked_eligibility_not_equal_cluster_failure",
        target: "raw_gcl_first_then_human_packet"
      }),
      ux: Object.freeze({
        risk: LATENCY_RISK_CLASS_V0.UX_COHERENT_ACTIONLESS,
        guidance: "coherent_system_has_next_human_action_with_sla",
        target: "actionless_automation_false_not_actionless_system"
      })
    }),
    invariants: Object.freeze([
      "dlgl_never_sets_can_execute_true",
      "dlgl_never_short_circuits_cab_or_acrl",
      "fast_path_is_cognitive_compression_only",
      "human_final_owner_unchanged",
      "dlgl_packet_never_collapses_uncertainty_into_certainty"
    ]),
    nonExecutable: true
  });
}
