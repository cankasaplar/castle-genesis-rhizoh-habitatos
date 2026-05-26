/**
 * Epistemic Temporal Coherence Layer (ETCL) v0 — temporal consistency across decision windows.
 * Invariants: (1) temporal alignment (2) cross-window contradiction guard (3) delayed truth rule.
 * @see docs/ops/EPISTEMIC_TEMPORAL_COHERENCE_V1.0.md
 */

import { COHERENCE_VERDICT_V0 } from "./epistemicCoherenceLayerV0.js";
import { CERTAINTY_CAP_V0 } from "./decisionPacketUncertaintyBoundaryV0.js";

export const EPISTEMIC_TEMPORAL_COHERENCE_SCHEMA_V0 = "rhizoh.epistemic_temporal_coherence.v0";

export const ETCL_INVARIANT_V0 = Object.freeze({
  TEMPORAL_ALIGNMENT: "temporal_alignment_invariant",
  CROSS_WINDOW_CONTRADICTION: "cross_window_contradiction_guard",
  DELAYED_TRUTH: "delayed_truth_rule"
});

/**
 * State anchor at decision time t (single export snapshot).
 * @param {object} narrativeExport
 */
export function buildTemporalStateAnchorV0(narrativeExport) {
  const signals = narrativeExport?.signalsSummary;
  const fp = narrativeExport?.narrativeFingerprint;

  return Object.freeze({
    schema: "rhizoh.temporal_state_anchor.v0",
    t: signals?.gatheredAt || new Date().toISOString(),
    exportGeneratedAt: signals?.gatheredAt || null,
    narrativeFingerprintDigest: fp?.digest || null,
    narrativeFingerprintShort: fp?.shortCode || null,
    systemHealth: narrativeExport?.systemState?.health,
    gclHealthy: narrativeExport?.actionContextResolution?.contextFingerprint?.gclHealthy,
    coherenceVerdict: narrativeExport?.epistemicCoherence?.systemCoherence?.verdict
  });
}

/**
 * (1) decision(t) must reference state(t) only — same fingerprint / same export slice.
 * @param {object} narrativeExport
 */
export function validateTemporalAlignmentInvariantV0(narrativeExport) {
  const anchor = buildTemporalStateAnchorV0(narrativeExport);
  const packet = narrativeExport?.decisionLatencyGovernance?.humanDecisionPacket;
  const violations = [];

  if (!anchor.narrativeFingerprintDigest) {
    violations.push("missing_narrative_fingerprint_at_t");
  }

  const packetHealth = packet?.bundle?.health;
  if (packetHealth && anchor.systemHealth && packetHealth !== anchor.systemHealth) {
    violations.push("decision_packet_health_drifts_from_state_t");
  }

  const packetGcl = packet?.bundle?.gcl;
  const anchorGcl = anchor.gclHealthy ? "healthy" : "stressed";
  if (packetGcl && packetGcl !== anchorGcl) {
    violations.push("decision_packet_gcl_label_drifts_from_state_t");
  }

  const packetReferencesCurrentT = packet?.schema === "rhizoh.human_decision_packet.v0";
  if (!packetReferencesCurrentT) {
    violations.push("decision_packet_missing_at_t");
  }

  return Object.freeze({
    id: ETCL_INVARIANT_V0.TEMPORAL_ALIGNMENT,
    rule: "decision_t_must_reference_state_t_only",
    valid: violations.length === 0,
    violations: Object.freeze(violations),
    anchor,
    decisionAtT: Object.freeze({
      primaryActionId: packet?.primaryActionId,
      operatorDecision: packet?.bundle?.operatorDecision,
      fingerprintAtDecision: anchor.narrativeFingerprintShort
    })
  });
}

/**
 * (2) state(t1) cannot override state(t2) unless reconciled.
 * @param {object} narrativeExport
 */
export function validateCrossWindowContradictionGuardV0(narrativeExport) {
  const windows =
    narrativeExport?.epistemicDecisionPacing?.temporaryStaticPostureWindows
      ?.temporaryStaticPostureWindows?.windows ?? [];
  const contradictions = narrativeExport?.epistemicCoherence?.crossLayerContradictions?.count ?? 0;
  const fragmented =
    narrativeExport?.epistemicCoherence?.systemCoherence?.verdict ===
    COHERENCE_VERDICT_V0.FRAGMENTED;
  const postureWindowCount = windows.length;

  /** @type {object[]} */
  const conflicts = [];

  if (postureWindowCount >= 2 && contradictions > 0) {
    conflicts.push(
      Object.freeze({
        type: "multi_window_with_active_contradictions",
        windowIds: windows.map((w) => w.windowId),
        note: "later_window_cannot_override_earlier_without_reconcile"
      })
    );
  }

  if (fragmented && postureWindowCount >= 1 && contradictions > 0) {
    conflicts.push(
      Object.freeze({
        type: "fragmented_coherence_with_open_contradictions",
        note: "cross_window_override_blocked_until_reconciliation"
      })
    );
  }

  const reconciliation = Object.freeze({
    required: conflicts.length > 0,
    status: conflicts.length > 0 ? "reconciliation_required" : "not_required_on_snapshot",
    method: conflicts.length > 0 ? "human_raw_replay_and_contradiction_digest" : "n/a"
  });

  const overrideWithoutReconcile = windows.some(
    (w) => w.grantsExecutionApproval === true || w.rawUncertaintyStreamRemainsOpen === false
  );

  return Object.freeze({
    id: ETCL_INVARIANT_V0.CROSS_WINDOW_CONTRADICTION,
    rule: "state_t1_cannot_override_state_t2_unless_reconciled",
    valid: !overrideWithoutReconcile,
    guardActive: conflicts.length > 0,
    conflicts: Object.freeze(conflicts),
    reconciliation,
    postureWindowCount,
    overrideBlocked: !overrideWithoutReconcile
  });
}

/**
 * (3) uncertainty cannot be resolved by time passage alone.
 * @param {object} narrativeExport
 */
export function validateDelayedTruthRuleV0(narrativeExport) {
  const packet = narrativeExport?.decisionLatencyGovernance?.humanDecisionPacket;
  const windows =
    narrativeExport?.epistemicDecisionPacing?.temporaryStaticPostureWindows
      ?.temporaryStaticPostureWindows?.windows ?? [];
  const violations = [];

  const uncertaintyOpen = (packet?.uncertaintyEnvelope?.itemCount ?? 0) >= 2;
  if (!uncertaintyOpen) {
    violations.push("uncertainty_envelope_closed_or_too_sparse");
  }

  if (packet?.certaintyCap === CERTAINTY_CAP_V0.RESOLVED) {
    violations.push("certainty_resolved_by_time_or_packet");
  }

  const timeOnlyClosureAttempt = windows.some(
    (w) => w.validForMinutes > 0 && w.rawUncertaintyStreamRemainsOpen === false
  );
  if (timeOnlyClosureAttempt) {
    violations.push("posture_window_ttl_must_not_close_uncertainty_stream");
  }

  const delayedTruthBlocked = violations.length === 0;

  return Object.freeze({
    id: ETCL_INVARIANT_V0.DELAYED_TRUTH,
    rule: "uncertainty_cannot_be_resolved_by_time_passage_alone",
    valid: delayedTruthBlocked,
    violations: Object.freeze(violations),
    uncertaintyRemainsOpen: uncertaintyOpen,
    postureWindowTtlDoesNotCloseTruth: windows.every(
      (w) => w.rawUncertaintyStreamRemainsOpen !== false
    )
  });
}

/**
 * @param {object} narrativeExport
 */
export function computeTemporalConsistencyRiskV0(narrativeExport) {
  const align = validateTemporalAlignmentInvariantV0(narrativeExport);
  const cross = validateCrossWindowContradictionGuardV0(narrativeExport);
  const delayed = validateDelayedTruthRuleV0(narrativeExport);

  let score = 0.2;
  if (!align.valid) score += 0.35;
  if (cross.guardActive) score += 0.25;
  if (!delayed.valid) score += 0.3;

  score = Math.max(0, Math.min(1, Math.round(score * 1000) / 1000));

  return Object.freeze({
    score,
    active: score >= 0.45 || cross.reconciliation?.required === true,
    drivers: Object.freeze({
      alignmentInvalid: !align.valid,
      crossWindowGuard: cross.guardActive,
      delayedTruthInvalid: !delayed.valid
    })
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildEpistemicTemporalCoherenceLayerV0(narrativeExport) {
  const temporalAlignment = validateTemporalAlignmentInvariantV0(narrativeExport);
  const crossWindowContradictionGuard = validateCrossWindowContradictionGuardV0(narrativeExport);
  const delayedTruthRule = validateDelayedTruthRuleV0(narrativeExport);
  const temporalConsistencyRisk = computeTemporalConsistencyRiskV0(narrativeExport);

  const allValid =
    temporalAlignment.valid && crossWindowContradictionGuard.valid && delayedTruthRule.valid;

  return Object.freeze({
    schema: EPISTEMIC_TEMPORAL_COHERENCE_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "temporal_consistency_across_edpl_posture_windows",
    problem: "temporal_consistency_risk",
    stateAnchor: temporalAlignment.anchor,
    invariants: Object.freeze({
      temporalAlignment,
      crossWindowContradictionGuard,
      delayedTruthRule
    }),
    allInvariantsValid: allValid,
    temporalConsistencyRisk,
    operatorGuidance: Object.freeze({
      tr: crossWindowContradictionGuard.reconciliation?.required
        ? "Zaman pencereleri çelişiyor — reconcile (RAW replay + contradiction digest) olmadan override yok."
        : "Temporal alignment OK — karar yalnız state(t) referanslı; süre tek başına belirsizliği kapatmaz.",
      en: crossWindowContradictionGuard.reconciliation?.required
        ? "Time windows conflict — no override without reconcile (RAW replay + contradiction digest)."
        : "Temporal alignment OK — decision references state(t) only; time alone does not close uncertainty."
    }),
    invariantsList: Object.freeze([
      "decision_t_must_reference_state_t_only",
      "state_t1_cannot_override_state_t2_unless_reconciled",
      "uncertainty_cannot_be_resolved_by_time_passage_alone"
    ]),
    nonExecutable: true,
    nonBinding: true
  });
}
