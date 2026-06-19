/**
 * Drift Anomaly Detector V0 — 3-layer threshold + AlertPacket (suggest only).
 *
 * DR-01: AlertPacket never triggers mutation or auto-reconcile.
 * DR-02: AlertPacket references categories and deltas only — no user/cube mutations.
 * @see docs/RHIZOH_DRIFT_ANOMALY_DETECTOR_V1.md
 */

import { MUTATION_REASON_CATEGORY_V1 } from "./mutationReasonCodeOntologyV1.js";
import {
  assertDriftOutputGuardsV0,
  assertDriftSuggestionDr02V0,
  INVARIANT_DR_02_ISOLATION_V0
} from "./driftSuggestionGuardsV0.js";

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

/** DR-02 compliant: category + delta language only. */
const SUGGESTION_BY_CATEGORY_V0 = Object.freeze({
  [MUTATION_REASON_CATEGORY_V1.SC]: "sc_frequency_increased",
  [MUTATION_REASON_CATEGORY_V1.QUOTA]: "quota_stress_detected",
  [MUTATION_REASON_CATEGORY_V1.REC]: "rec_continuity_drift_detected",
  [MUTATION_REASON_CATEGORY_V1.SIG]: "sig_trust_drift_detected",
  [MUTATION_REASON_CATEGORY_V1.INTENT]: "intent_binding_drift_detected",
  [MUTATION_REASON_CATEGORY_V1.ADMIT]: "admission_gate_stress_detected"
});

/** @type {Map<string, { epochId: string, share: number }[]>} */
const categoryEpochHistoryV0 = new Map();

let alertSeqV0 = 0;

function categorySharesV0(categoryCounts, total) {
  /** @type {Record<string, number>} */
  const shares = {};
  for (const [cat, count] of Object.entries(categoryCounts)) {
    shares[cat] = total > 0 ? count / total : 0;
  }
  return shares;
}

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
        deltaHint: Object.freeze({
          category,
          shareDelta01: Math.max(0, share - baseShare),
          countDelta: count
        }),
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
 *   deltaHint?: object,
 *   layers?: object
 * }} input
 */
export function buildAlertPacketV0(input) {
  const packet = Object.freeze({
    schema: ALERT_PACKET_SCHEMA_V0,
    alertId: `alert_${++alertSeqV0}`,
    type: DRIFT_ANOMALY_TYPE_V0,
    severity: input.severity || ANOMALY_SEVERITY_V0.MEDIUM,
    category: input.category,
    suggestion: input.suggestion,
    deltaHint: input.deltaHint ? Object.freeze({ ...input.deltaHint }) : undefined,
    confidence: Math.max(0, Math.min(1, input.confidence)),
    executionClass: "suggest",
    layers: input.layers ? Object.freeze({ ...input.layers }) : undefined,
    interpretationOnly: true,
    nonExecutive: true
  });

  assertDriftOutputGuardsV0(packet);
  return packet;
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
        suggestion: SUGGESTION_BY_CATEGORY_V0[ev.category] || "category_drift_detected",
        confidence: Math.max(0, Math.min(1, ev.share01 + (ev.layers.persistence ? 0.1 : 0))),
        deltaHint: ev.deltaHint,
        layers: ev.layers
      })
    );
  }

  return Object.freeze({
    schema: ALERT_PACKET_SCHEMA_V0,
    evaluation,
    alerts: Object.freeze(alerts),
    dr01Enforced: true,
    dr02Enforced: true,
    interpretationOnly: true,
    nonExecutive: true
  });
}

export { assertDriftSuggestionDr02V0, INVARIANT_DR_02_ISOLATION_V0 };

/** Test only. */
export function clearAnomalyDetectorStateForTestV0() {
  categoryEpochHistoryV0.clear();
  alertSeqV0 = 0;
}
