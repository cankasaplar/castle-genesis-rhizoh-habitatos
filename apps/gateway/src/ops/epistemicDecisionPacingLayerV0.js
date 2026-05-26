/**
 * Epistemic Decision Pacing Layer (EDPL) v0 — post-DPUB operator tempo and window governance.
 * A) Operator pacing control — queue_saturation_index, pacing_frequency_limit (no psychology terms).
 * B) temporary_static_posture_windows — local ops hold windows; NOT truth/certainty zones.
 * @see docs/ops/EPISTEMIC_DECISION_PACING_V1.0.md
 */

import { COHERENCE_VERDICT_V0 } from "./epistemicCoherenceLayerV0.js";
import { EXECUTION_ELIGIBILITY_V0 } from "./actionContextResolutionLayerV0.js";

export const EPISTEMIC_DECISION_PACING_SCHEMA_V0 = "rhizoh.epistemic_decision_pacing.v0";

export const QUEUE_SATURATION_TIER_V0 = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high",
  CRITICAL: "critical"
});

export const POSTURE_WINDOW_CLASS_V0 = Object.freeze({
  OBSERVE_HOLD: "observe_hold",
  AUDIT_READ: "audit_read",
  POSTURE_STEADY: "posture_steady"
});

/** EDPL never grants execution_approval — high-risk actions stay ACRL-blocked. */
export const EDPL_FORBIDDEN_EXECUTION_ACTIONS_V0 = Object.freeze([
  "deploy_agent",
  "apply_narrative_suggested_action"
]);

const POSTURE_WINDOW_TTL_MINUTES_V0 = 15;

const WINDOW_DOES_NOT_MEAN_V0 = Object.freeze([
  "global_truth",
  "execution_approval",
  "policy_override",
  "reality_claim",
  "cab_negation_lift",
  "certainty_or_truth_zone"
]);

/**
 * Hierarchical authority — EDPL is timing/window only.
 */
export const AUTHORITY_HIERARCHY_V0 = Object.freeze({
  gcl_core: Object.freeze({
        role: "immutable_structural_physics",
        authority: "full_constraint"
      }),
  dpub: Object.freeze({
    role: "unfiltered_reality_flow",
    authority: "full_raw_data_publish"
  }),
  edpl: Object.freeze({
    role: "time_and_tempo_bender",
    authority: "timing_and_bounded_window_control_only"
  }),
  human: Object.freeze({
    role: "selective_receiver",
    authority: "operational_maintenance_in_edpl_micro_windows_only"
  })
});

/**
 * @param {object} narrativeExport
 */
export function scoreQueueSaturationIndexV0(narrativeExport) {
  const packet = narrativeExport?.decisionLatencyGovernance?.humanDecisionPacket;
  const uncertaintyItems = packet?.uncertaintyEnvelope?.itemCount ?? 0;
  const contradictionCount = packet?.contradictionDigest?.crossLayerCount ?? 0;
  const verdict = narrativeExport?.epistemicCoherence?.systemCoherence?.verdict;
  const inflation = narrativeExport?.decisionLatencyGovernance?.latencyInflation?.pressure;
  const overconfidence = (packet?.overconfidenceRisk?.risks?.length ?? 0) > 0;

  let index = 0.1;
  index += Math.min(0.35, uncertaintyItems * 0.04);
  index += Math.min(0.25, contradictionCount * 0.08);
  if (verdict === COHERENCE_VERDICT_V0.FRAGMENTED) index += 0.15;
  if (verdict === COHERENCE_VERDICT_V0.CONTRADICTORY) index += 0.25;
  if (inflation === "high") index += 0.1;
  if (overconfidence) index += 0.08;

  index = Math.max(0, Math.min(1, Math.round(index * 1000) / 1000));

  const tier =
    index >= 0.75
      ? QUEUE_SATURATION_TIER_V0.CRITICAL
      : index >= 0.55
        ? QUEUE_SATURATION_TIER_V0.HIGH
        : index >= 0.35
          ? QUEUE_SATURATION_TIER_V0.MEDIUM
          : QUEUE_SATURATION_TIER_V0.LOW;

  const operatorProcessingLatency =
    tier === QUEUE_SATURATION_TIER_V0.CRITICAL
      ? "elevated"
      : tier === QUEUE_SATURATION_TIER_V0.HIGH
        ? "high"
        : tier === QUEUE_SATURATION_TIER_V0.MEDIUM
          ? "moderate"
          : "nominal";

  return Object.freeze({
    queueSaturationIndex: index,
    tier,
    operatorProcessingLatency,
    drivers: Object.freeze({
      uncertaintyEnvelopeItems: uncertaintyItems,
      crossLayerContradictionCount: contradictionCount,
      coherenceVerdict: verdict,
      decisionLatencyPressure: inflation,
      packetOverconfidenceMonitored: overconfidence
    })
  });
}

/**
 * @param {ReturnType<typeof scoreQueueSaturationIndexV0>} saturation
 */
export function buildOperatorPacingControlV0(saturation) {
  const pacingFrequencyLimit =
    saturation.tier === QUEUE_SATURATION_TIER_V0.CRITICAL
      ? Object.freeze({
          maxDecisionBundlesPerHour: 2,
          requireRawIngressEvery: 1,
          deferNonCriticalReviews: true
        })
      : saturation.tier === QUEUE_SATURATION_TIER_V0.HIGH
        ? Object.freeze({
            maxDecisionBundlesPerHour: 4,
            requireRawIngressEvery: 2,
            deferNonCriticalReviews: true
          })
        : saturation.tier === QUEUE_SATURATION_TIER_V0.MEDIUM
          ? Object.freeze({
              maxDecisionBundlesPerHour: 6,
              requireRawIngressEvery: 3,
              deferNonCriticalReviews: false
            })
          : Object.freeze({
              maxDecisionBundlesPerHour: 10,
              requireRawIngressEvery: 5,
              deferNonCriticalReviews: false
            });

  return Object.freeze({
    schema: "rhizoh.operator_pacing_control.v0",
    queueSaturation: saturation,
    pacingFrequencyLimit,
    operatorGuidance: Object.freeze({
      tr:
        saturation.tier === QUEUE_SATURATION_TIER_V0.CRITICAL
          ? "queue_saturation kritik — pacing_frequency_limit aktif; RAW ingress zorunlu; paket özetine güvenme."
          : saturation.tier === QUEUE_SATURATION_TIER_V0.HIGH
            ? "operator_processing_latency yüksek — her 2 paketten sonra RAW; deploy review ertele."
            : saturation.tier === QUEUE_SATURATION_TIER_V0.MEDIUM
              ? "orta saturation — uncertainty akışı açık; tempo düşür."
              : "düşük saturation — nominal operator_processing_latency; CAB/DPUB geçerli.",
      en:
        saturation.tier === QUEUE_SATURATION_TIER_V0.CRITICAL
          ? "Critical queue_saturation — pacing_frequency_limit active; mandatory RAW ingress; packet is not truth."
          : saturation.tier === QUEUE_SATURATION_TIER_V0.HIGH
            ? "High operator_processing_latency — RAW every 2 packets; defer deploy reviews."
            : saturation.tier === QUEUE_SATURATION_TIER_V0.MEDIUM
              ? "Medium saturation — keep uncertainty flow open; reduce pace."
              : "Low saturation — nominal operator_processing_latency; CAB/DPUB still apply."
    }),
    invariants: Object.freeze([
      "pacing_never_hides_uncertainty",
      "pacing_never_reduces_contradiction_digest",
      "pacing_is_operational_tempo_not_automation"
    ])
  });
}

/**
 * @param {string} actionId
 * @param {string} domain
 * @param {object} narrativeExport
 */
function evaluatePostureWindowEligibilityV0(actionId, domain, narrativeExport) {
  const health = narrativeExport?.systemState?.health;
  const gclOk = narrativeExport?.actionContextResolution?.contextFingerprint?.gclHealthy !== false;
  const critical = (narrativeExport?.epistemicCoherence?.crossLayerContradictions?.criticalCount ?? 0) > 0;
  const verdict = narrativeExport?.epistemicCoherence?.systemCoherence?.verdict;
  const matrix = narrativeExport?.actionContextResolution?.executionEligibilityMatrix?.find(
    (m) => m.actionId === actionId
  );
  const cell = matrix?.matrix?.[domain];

  if (critical || verdict === COHERENCE_VERDICT_V0.CONTRADICTORY) {
    return { eligible: false, reason: "critical_or_contradictory_coherence" };
  }

  if (EDPL_FORBIDDEN_EXECUTION_ACTIONS_V0.includes(actionId)) {
    return { eligible: false, reason: "forbidden_action_no_posture_window" };
  }

  if (actionId === "maintain_current_posture" && domain === "governance") {
    const ok =
      gclOk && (health === "stable" || health === "stressed") && cell?.eligibility !== EXECUTION_ELIGIBILITY_V0.BLOCKED;
    return {
      eligible: ok,
      reason: ok ? "temporary_static_posture_window" : "posture_window_conditions_not_met",
      windowClass: POSTURE_WINDOW_CLASS_V0.POSTURE_STEADY
    };
  }

  if (actionId === "audit_gcl_rollout_pairing" && domain === "governance") {
    const ok = gclOk && cell?.eligibility !== EXECUTION_ELIGIBILITY_V0.BLOCKED;
    return {
      eligible: ok,
      reason: ok ? "audit_read_posture_window" : "posture_window_gcl_stress",
      windowClass: POSTURE_WINDOW_CLASS_V0.AUDIT_READ
    };
  }

  if (actionId === "observe_and_verify_raw" || primaryActionIsObserve(narrativeExport)) {
    return {
      eligible: health !== "degraded",
      reason: "raw_first_observe_hold_window",
      windowClass: POSTURE_WINDOW_CLASS_V0.OBSERVE_HOLD
    };
  }

  return { eligible: false, reason: "no_posture_window_for_action" };
}

/**
 * @param {object} narrativeExport
 */
function primaryActionIsObserve(narrativeExport) {
  const id = narrativeExport?.decisionLatencyGovernance?.humanDecisionPacket?.primaryActionId;
  return id === "observe_and_verify_raw";
}

/**
 * temporary_static_posture_windows — NOT certainty/truth zones (semantic seal).
 * @param {object} narrativeExport
 */
export function resolveTemporaryStaticPostureWindowsV0(narrativeExport) {
  const candidates = [
    { actionId: "maintain_current_posture", domain: "governance" },
    { actionId: "audit_gcl_rollout_pairing", domain: "governance" },
    { actionId: "observe_and_verify_raw", domain: "governance" }
  ];

  const windows = candidates
    .map((c) => {
      const ev = evaluatePostureWindowEligibilityV0(c.actionId, c.domain, narrativeExport);
      if (!ev.eligible) return null;
      return Object.freeze({
        windowId: `tspw.${c.actionId}.${c.domain}`,
        actionId: c.actionId,
        domain: c.domain,
        windowClass: ev.windowClass,
        postureScope: "bounded_operational_posture_only",
        localWindowOnly: true,
        validForMinutes: POSTURE_WINDOW_TTL_MINUTES_V0,
        expiresConcept: "operator_session_window_not_system_truth_clock",
        windowClaim: Object.freeze({
          tr: "Geçici statik duruş penceresi — global doğruluk/kesinlik alanı değil.",
          en: "Temporary static posture window — not a global truth or certainty zone."
        }),
        doesNotMean: WINDOW_DOES_NOT_MEAN_V0,
        grantsExecutionApproval: false,
        rawUncertaintyStreamRemainsOpen: true
      });
    })
    .filter(Boolean);

  return Object.freeze({
    schema: "rhizoh.temporary_static_posture_windows.v0",
    windowCount: windows.length,
    windows: Object.freeze(windows),
    notCertaintyZone: true,
    notTruthProduction: true,
    note: "temporary_static_posture_windows_are_local_ops_hold_not_certainty"
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildTemporaryStaticPostureWindowsV0(narrativeExport) {
  const windows = resolveTemporaryStaticPostureWindowsV0(narrativeExport);

  return Object.freeze({
    schema: "rhizoh.temporary_static_posture_windows_bundle.v0",
    enabled: windows.windowCount > 0,
    temporaryStaticPostureWindows: windows,
    invariants: Object.freeze([
      "windows_never_apply_to_deploy_agent",
      "windows_never_apply_to_apply_narrative_suggested_action",
      "windows_never_grant_execution_approval",
      "windows_never_lift_can_execute",
      "raw_uncertainty_stream_stays_open"
    ])
  });
}

/**
 * Assert EDPL cannot pass execution_approval; forbidden actions stay ACRL-blocked.
 * @param {object} narrativeExport
 */
export function assertEdplExecutionBoundariesV0(narrativeExport) {
  const violations = [];
  const acrl = narrativeExport?.actionContextResolution;
  const edpl = narrativeExport?.epistemicDecisionPacing;
  const windows = edpl?.temporaryStaticPostureWindows?.temporaryStaticPostureWindows?.windows ?? [];

  for (const actionId of EDPL_FORBIDDEN_EXECUTION_ACTIONS_V0) {
    if (windows.some((w) => w.actionId === actionId)) {
      violations.push(`edpl_window_must_not_include_${actionId}`);
    }
    const matrix = acrl?.executionEligibilityMatrix?.find((m) => m.actionId === actionId);
    if (!matrix) {
      violations.push(`acrl_matrix_missing_${actionId}`);
      continue;
    }
    for (const cell of Object.values(matrix.matrix || {})) {
      if (cell.eligibility === EXECUTION_ELIGIBILITY_V0.OK) {
        violations.push(`acrl_${actionId}_${cell.domain}_must_not_be_ok`);
      }
    }
    if (edpl?.grantsExecutionApproval === true) {
      violations.push("edpl_must_never_set_grantsExecutionApproval");
    }
  }

  const deployExample = acrl?.actionOverloadingRisk?.deployAgentExample;
  if (deployExample?.robotics === EXECUTION_ELIGIBILITY_V0.OK) {
    violations.push("deploy_agent_robotics_ok_only_valid_under_sensor_context_not_edpl");
  }

  return Object.freeze({
    valid: violations.length === 0,
    violations: Object.freeze(violations),
    forbiddenActionsRemainBlocked: violations.length === 0
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildEpistemicDecisionPacingLayerV0(narrativeExport) {
  const saturation = scoreQueueSaturationIndexV0(narrativeExport);
  const operatorPacingControl = buildOperatorPacingControlV0(saturation);
  const temporaryStaticPostureWindows = buildTemporaryStaticPostureWindowsV0(narrativeExport);
  const executionBoundaries = assertEdplExecutionBoundariesV0({
    ...narrativeExport,
    epistemicDecisionPacing: {
      temporaryStaticPostureWindows,
      grantsExecutionApproval: false
    }
  });

  return Object.freeze({
    schema: EPISTEMIC_DECISION_PACING_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "operator_tempo_and_bounded_posture_windows",
    authorityHierarchy: AUTHORITY_HIERARCHY_V0,
    operatorPacingControl,
    temporaryStaticPostureWindows,
    executionBoundaries,
    grantsExecutionApproval: false,
    operatorSummary: Object.freeze({
      tr: `queue_saturation: ${saturation.tier} · posture_windows: ${temporaryStaticPostureWindows.temporaryStaticPostureWindows.windowCount} (RAW akış açık)`,
      en: `queue_saturation: ${saturation.tier} · posture_windows: ${temporaryStaticPostureWindows.temporaryStaticPostureWindows.windowCount} (RAW stream open)`
    }),
    invariants: Object.freeze([
      "pacing_never_hides_uncertainty",
      "posture_windows_are_not_certainty_zones",
      "temporary_static_posture_windows_not_truth_production",
      "edpl_never_passes_execution_approval",
      "human_final_owner_unchanged"
    ]),
    nextLayerNote: Object.freeze({
      id: "ETCL",
      name: "epistemic_temporal_coherence",
      problem: "temporal_consistency_risk_across_decision_windows"
    }),
    nonExecutable: true,
    nonBinding: true
  });
}

/** @deprecated use scoreQueueSaturationIndexV0 */
export const scoreEpistemicFatigueV0 = scoreQueueSaturationIndexV0;
/** @deprecated use resolveTemporaryStaticPostureWindowsV0 */
export const resolveBoundedCertaintyZonesV0 = resolveTemporaryStaticPostureWindowsV0;
