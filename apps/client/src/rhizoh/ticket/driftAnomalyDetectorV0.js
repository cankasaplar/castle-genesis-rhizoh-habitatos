/**
 * Drift Anomaly Detector V0 — 3-layer threshold + AlertPacket (suggest only).
 *
 * Layers (all required for AlertPacket):
 *   1. Absolute spike — category count > N in window
 *   2. Relative drift — share increase > baseline + σ
 *   3. Persistence — spike across 2 consecutive REC cycles
 *
 * DR-01: AlertPacket never triggers mutation or auto-reconcile.
 * @see docs/RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md
 */

import { MUTATION_REASON_CATEGORY_V1 } from "./mutationReasonCodeOntologyV1.js";

export const ALERT_PACKET_SCHEMA_V0 = "castle.rhizoh.alert_packet.v0";
export const DRIFT_ANOMALY_TYPE_V0 = "DRIFT_ANOMALY";

export const ANOMALY_SEVERITY_V0 = Object.freeze({
  LOW: "low",
  MEDIUM: "medium",
  HIGH: "high"
});

const DEFAULT_ANOMALY_THRESHOLDS_V0 = Object.freeze({
  absoluteSpikeMinCount: 5,
  relativeSigma: 0.15,
  persistenceRecCycles: 2,
  windowSize: 50
});

/** @type {Map<string, { epochId: string, share: number }[]>} */
const categoryEpochHistoryV0 = new Map();

let alertSeqV0 = 0;

/**
 * @param {Record<string, number>} categoryCounts
 * @param {number} total
 */
function categorySharesV0(categoryCounts, total) {
  /** @type {Record<string, number>} */
  const shares = {};
  for (const [cat, count] of Object.entries(categoryCounts)) {
    shares[cat] = total > 0 ? count / total : 0;
  }
  return shares;
}

/**
 * @param {string} category
 * @param {string} epochId
 * @param {number} share
 */
function recordCategoryEpochV0(category, epochId, share) {
  if (!categoryEpochHistoryV0.has(category)) {
    categoryEpochHistoryV0.set(category, []);
  }
  const hist = categoryEpochHistoryV0.get(category);
  if (hist.length > 0 && hist[hist.length - 1].epochId === epochId) {
    hist[hist.length - 1] = { epochId, share };
  } else {
    hist.push({ epochId, share });
  }
}

/**
 * @param {string} category
 * @param {number} requiredCycles
 */
function hasPersistenceAcrossRecCyclesV0(category, requiredCycles) {
  const hist = categoryEpochHistoryV0.get(category) || [];
  if (hist.length < requiredCycles) return false;
  const tail = hist.slice(-requiredCycles);
  const baseline = tail[0].share;
  return tail.every((e) => e.share > baseline * 0.9);
}

/**
 * @param {{
 *   categoryCounts: Record<string, number>,
 *   total: number,
 *   epochId?: string,
 *   baselineShares?: Record<string, number>,
 *   thresholds?: Partial<typeof DEFAULT_ANOMALY_THRESHOLDS_V0>
 * }} input
 */
export function evaluateAnomalyLayersV0(input) {
  const thresholds = { ...DEFAULT_ANOMALY_THRESHOLDS_V0, ...(input.thresholds || {}) };
  const epochId = String(input.epochId || "rec_soft");
  const shares = categorySharesV0(input.categoryCounts, input.total);
  const baseline = input.baselineShares || {};

  /** @type {object[]} */
  const evaluations = [];

  for (const [category, count] of Object.entries(input.categoryCounts)) {
    const share = shares[category] || 0;
    recordCategoryEpochV0(category, epochId, share);

    const absoluteSpike = count >= thresholds.absoluteSpikeMinCount;
    const baseShare = baseline[category] ?? 0;
    const relativeDrift = share > baseShare + thresholds.relativeSigma;
    const persistence = hasPersistenceAcrossRecCyclesV0(category, thresholds.persistenceRecCycles);

    evaluations.push(
      Object.freeze({
        category,
        count,
        share01: share,
        layers: Object.freeze({
          absoluteSpike,
          relativeDrift,
          persistence
        }),
        alertEligible: absoluteSpike && relativeDrift && persistence
      })
    );
  }

  return Object.freeze({
    schema: ALERT_PACKET_SCHEMA_V0,
    epochId,
    evaluations: Object.freeze(evaluations),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * @param {{
 *   category: string,
 *   severity: string,
 *   suggestion: string,
 *   confidence: number,
 *   layers?: object
 * }} input
 */
export function buildAlertPacketV0(input) {
  return Object.freeze({
    schema: ALERT_PACKET_SCHEMA_V0,
    alertId: `alert_${++alertSeqV0}`,
    type: DRIFT_ANOMALY_TYPE_V0,
    severity: input.severity || ANOMALY_SEVERITY_V0.MEDIUM,
    category: input.category,
    suggestion: input.suggestion,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    executionClass: "suggest",
    layers: input.layers ? Object.freeze({ ...input.layers }) : undefined,
    interpretationOnly: true,
    nonExecutive: true
  });
}

const SUGGESTION_BY_CATEGORY_V0 = Object.freeze({
  [MUTATION_REASON_CATEGORY_V1.SC]: "review_admission_policy_and_permission_boundaries",
  [MUTATION_REASON_CATEGORY_V1.QUOTA]: "review_quota_window_and_burst_layer_capacity",
  [MUTATION_REASON_CATEGORY_V1.REC]: "align_epoch_windows_and_continuity_anchor_policy",
  [MUTATION_REASON_CATEGORY_V1.SIG]: "review_temporal_binding_and_signature_requirements",
  [MUTATION_REASON_CATEGORY_V1.INTENT]: "audit_intent_layer_for_binding_violations",
  [MUTATION_REASON_CATEGORY_V1.ADMIT]: "review_closed_admission_gate_thresholds"
});

/**
 * @param {{
 *   categoryCounts: Record<string, number>,
 *   total: number,
 *   epochId?: string,
 *   baselineShares?: Record<string, number>,
 *   thresholds?: Partial<typeof DEFAULT_ANOMALY_THRESHOLDS_V0>
 * }} input
 */
export function detectDriftAnomaliesV0(input) {
  const evaluation = evaluateAnomalyLayersV0(input);
  /** @type {object[]} */
  const alerts = [];

  for (const ev of evaluation.evaluations) {
    if (!ev.alertEligible) continue;

    const severity =
      ev.share01 >= 0.5
        ? ANOMALY_SEVERITY_V0.HIGH
        : ev.share01 >= 0.35
          ? ANOMALY_SEVERITY_V0.MEDIUM
          : ANOMALY_SEVERITY_V0.LOW;

    alerts.push(
      buildAlertPacketV0({
        category: ev.category,
        severity,
        suggestion: SUGGESTION_BY_CATEGORY_V0[ev.category] || "review_drift_anomaly_and_invariant_health",
        confidence: Math.max(0, Math.min(1, ev.share01 + (ev.layers.persistence ? 0.1 : 0))),
        layers: ev.layers
      })
    );
  }

  return Object.freeze({
    schema: ALERT_PACKET_SCHEMA_V0,
    evaluation,
    alerts: Object.freeze(alerts),
    dr01Enforced: true,
    interpretationOnly: true,
    nonExecutive: true
  });
}

/** Test only. */
export function clearAnomalyDetectorStateForTestV0() {
  categoryEpochHistoryV0.clear();
  alertSeqV0 = 0;
}
