/**
 * Epistemic stability controller v0.1 — long-horizon interpretation (non-executive).
 *
 * RCMM v1.1: canonical operators = M_STRESS | M_DRIFT | M_ANOMALY | M_COHERENCE only.
 * driftRiskScore, smoothEpistemicTickGraphV0, evaluateEpistemicStabilityV0 = DERIVED_RUNTIME_ONLY.
 * Runtime semantic role lock: compute/project only — must not drive δ, admission, or phase gate.
 *
 * @see docs/RHIZOH_EPISTEMIC_STABILITY_CONTROLLER_V0.1.md
 * @see docs/architecture/rhizoh_canonical_measurement_map_v1.md
 * @see docs/architecture/rhizoh_runtime_semantic_role_lock_v1.md
 * @see docs/architecture/rhizoh_final_epistemic_firewall_v1.md
 */

/** UI label map — @runtimeSemanticRole project (not authority) */
const DRIFT_SCORE_BUCKET_LABELS_V0 = Object.freeze(["nominal", "watch", "elevated", "critical"]);

import { BOUNDARY_STATE_V0 } from "./externalBoundaryValidationV0.js";
import { SYSTEM_STATE_V0 } from "./postGoLiveIntegrityLoopV0.js";
import {
  analyzeA9CrossTickCorrelationV0,
  analyzeCrossTickDivergenceV0,
  buildEpistemicTickGraphV0,
  getEpistemicTickLedgerV0
} from "./epistemicTickLedgerV0.js";

export const EPISTEMIC_STABILITY_SCHEMA_V0 = "castle.rhizoh.epistemic_stability.v0";

const DEFAULT_WINDOW_TICKS_V0 = 32;
const DEFAULT_SMOOTH_ALPHA_V0 = 0.28;

const LONG_TERM_THRESHOLDS_V0 = Object.freeze({
  boundaryDivergedRatio: 0.25,
  compoundStreakTicks: 3,
  degradedRatio: 0.35,
  quarantineRatio: 0.12,
  clientGatewayGapTicks: 8,
  a9IncidentMinTicks: 2
});

const STATE_RANK_V0 = Object.freeze({
  [SYSTEM_STATE_V0.LIVE_OK]: 0,
  [SYSTEM_STATE_V0.DEGRADED]: 1,
  [SYSTEM_STATE_V0.QUARANTINE]: 2
});

const RANK_TO_STATE_V0 = Object.freeze([
  SYSTEM_STATE_V0.LIVE_OK,
  SYSTEM_STATE_V0.DEGRADED,
  SYSTEM_STATE_V0.QUARANTINE
]);

/** @type {object | null} */
let lastStabilityReportV0 = null;

/**
 * EMA smoothing over epistemic state ranks — does not mutate ledger or tick engine output.
 *
 * @param {{ windowTicks?: number, alpha?: number }} [opts]
 */
export function smoothEpistemicTickGraphV0(opts = {}) {
  const windowTicks = Math.max(2, Number(opts.windowTicks) || DEFAULT_WINDOW_TICKS_V0);
  const alpha = clamp01(Number(opts.alpha) || DEFAULT_SMOOTH_ALPHA_V0);
  const nodes = sliceWindow(getEpistemicTickLedgerV0().nodes, windowTicks);

  /** @type {object[]} */
  const series = [];
  let emaRank = null;

  for (const n of nodes) {
    const rawRank = stateRankV0(n.epistemic_state);
    emaRank = emaRank == null ? rawRank : emaRank * (1 - alpha) + rawRank * alpha;
    const smoothedRank = Math.round(emaRank * 100) / 100;
    series.push(
      Object.freeze({
        tickSeq: n.tickSeq,
        atMs: n.atMs,
        raw_epistemic_state: n.epistemic_state,
        raw_rank: rawRank,
        smoothed_rank: smoothedRank,
        smoothed_epistemic_state: rankToStateV0(Math.round(smoothedRank)),
        suppressionDelta: rawRank - Math.round(smoothedRank)
      })
    );
  }

  return Object.freeze({
    schema: "castle.rhizoh.epistemic_tick_graph_smoothed.v0",
    windowTicks,
    alpha,
    series: Object.freeze(series),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * Long-term divergence vs fixed thresholds.
 *
 * @param {{ windowTicks?: number, thresholds?: Partial<typeof LONG_TERM_THRESHOLDS_V0> }} [opts]
 */
export function evaluateLongTermDivergenceV0(opts = {}) {
  const windowTicks = Math.max(2, Number(opts.windowTicks) || DEFAULT_WINDOW_TICKS_V0);
  const thresholds = { ...LONG_TERM_THRESHOLDS_V0, ...(opts.thresholds || {}) };
  const nodes = sliceWindow(getEpistemicTickLedgerV0().nodes, windowTicks);
  const count = nodes.length || 1;

  let boundaryDiverged = 0;
  let degraded = 0;
  let quarantine = 0;
  let compoundTicks = 0;
  let maxGap = 0;
  let gapGrowingStreak = 0;
  let maxGapGrowingStreak = 0;

  for (const n of nodes) {
    if (n.boundary_state === BOUNDARY_STATE_V0.DIVERGED) boundaryDiverged += 1;
    if (n.epistemic_state === SYSTEM_STATE_V0.DEGRADED) degraded += 1;
    if (n.epistemic_state === SYSTEM_STATE_V0.QUARANTINE) quarantine += 1;
    if (n.compoundFault) compoundTicks += 1;

    const gap = seqGapV0(n);
    if (gap != null && gap > maxGap) maxGap = gap;
    if (gap != null && gap > thresholds.clientGatewayGapTicks) {
      gapGrowingStreak += 1;
      maxGapGrowingStreak = Math.max(maxGapGrowingStreak, gapGrowingStreak);
    } else {
      gapGrowingStreak = 0;
    }
  }

  const crossTick = analyzeCrossTickDivergenceV0();
  const boundaryRatio = boundaryDiverged / count;
  const degradedRatio = degraded / count;
  const quarantineRatio = quarantine / count;

  const breaches = [];
  if (boundaryRatio >= thresholds.boundaryDivergedRatio) {
    breaches.push("boundary_diverged_ratio");
  }
  if (degradedRatio >= thresholds.degradedRatio) {
    breaches.push("degraded_ratio");
  }
  if (quarantineRatio >= thresholds.quarantineRatio) {
    breaches.push("quarantine_ratio");
  }
  if (crossTick.compoundStreakMax >= thresholds.compoundStreakTicks) {
    breaches.push("compound_streak");
  }
  if (maxGap >= thresholds.clientGatewayGapTicks) {
    breaches.push("client_gateway_gap");
  }

  return Object.freeze({
    schema: "castle.rhizoh.long_term_divergence.v0",
    windowTicks,
    tickSampleCount: nodes.length,
    thresholds: Object.freeze({ ...thresholds }),
    metrics: Object.freeze({
      boundaryDivergedRatio: round4(boundaryRatio),
      degradedRatio: round4(degradedRatio),
      quarantineRatio: round4(quarantineRatio),
      compoundStreakMax: crossTick.compoundStreakMax,
      maxClientGatewayGap: maxGap,
      maxGapGrowingStreak
    }),
    thresholdBreached: breaches.length > 0,
    breaches: Object.freeze(breaches),
    interpretationOnly: true
  });
}

/**
 * A9 / A11 cross-tick signal ids (predicate list only).
 * RCMM: compute. Phase 2.2 lexical normalize — no "trend"/"suppression" surface.
 */
export function detectA9A11SignalSuppressionV0(opts = {}) {
  const windowTicks = Math.max(4, Number(opts.windowTicks) || DEFAULT_WINDOW_TICKS_V0);
  const smoothed = smoothEpistemicTickGraphV0({ windowTicks, alpha: opts.alpha });
  const nodes = sliceWindow(getEpistemicTickLedgerV0().nodes, windowTicks);
  const a9 = analyzeA9CrossTickCorrelationV0();

  /** @type {string[]} */
  const signals = [];

  let rawHotStreak = 0;
  let smoothedOkWhileRawHot = 0;
  for (const pt of smoothed.series) {
    const rawHot = stateRankV0(pt.raw_epistemic_state) >= 1 || pt.suppressionDelta > 0;
    const smoothOk = stateRankV0(pt.smoothed_epistemic_state) === 0;
    if (rawHot && smoothOk) {
      rawHotStreak += 1;
      if (rawHotStreak >= 2) smoothedOkWhileRawHot += 1;
    } else {
      rawHotStreak = 0;
    }
  }

  if (smoothedOkWhileRawHot > 0) {
    signals.push("a9_epistemic_smoothing_mask");
  }

  if (a9.a9Closed && smoothed.series.length >= 2) {
    const tail = smoothed.series.slice(-3);
    const allSmoothOk = tail.every((t) => stateRankV0(t.smoothed_epistemic_state) === 0);
    const anyRawHot = tail.some((t) => stateRankV0(t.raw_epistemic_state) >= 1);
    if (allSmoothOk && anyRawHot) {
      signals.push("a9_post_incident_calm_mask");
    }
  }

  let gapSeqIncreaseCount = 0;
  let boundaryAlignedGapCount = 0;
  let prevGap = null;
  for (const n of nodes) {
    const gap = seqGapV0(n);
    if (gap != null && prevGap != null && gap > prevGap) {
      gapSeqIncreaseCount += 1;
    }
    prevGap = gap ?? prevGap;
    if (
      gap != null &&
      gap >= LONG_TERM_THRESHOLDS_V0.clientGatewayGapTicks &&
      n.boundary_state !== BOUNDARY_STATE_V0.DIVERGED
    ) {
      boundaryAlignedGapCount += 1;
    }
  }

  if (gapSeqIncreaseCount >= 3 && boundaryAlignedGapCount >= 2) {
    signals.push("a11_boundary_gap_suppressed");
  }

  const compoundWhileAligned = nodes.filter(
    (n) =>
      n.compoundFault &&
      n.boundary_state === BOUNDARY_STATE_V0.ALIGNED &&
      stateRankV0(n.epistemic_state) === 0
  ).length;
  if (compoundWhileAligned >= 2) {
    signals.push("a11_compound_without_boundary_escalation");
  }

  return Object.freeze({
    schema: "castle.rhizoh.a9_a11_signal_suppression.v0",
    windowTicks,
    signalIdsNonEmpty: signals.length > 0,
    signalIds: Object.freeze(signals),
    metrics: Object.freeze({
      rankSmoothBelowRawCount: smoothedOkWhileRawHot,
      gapSeqIncreaseCount,
      boundaryAlignedGapCount,
      compoundWhileAligned
    }),
    interpretationOnly: true
  });
}

/**
 * System drift risk score 0–100 (interpretation only).
 * RCMM: DERIVED_RUNTIME_ONLY — composes M_DRIFT + M_ANOMALY signals; not a CMM operator.
 */
export function computeSystemDriftRiskScoreV0(opts = {}) {
  const longTerm = evaluateLongTermDivergenceV0(opts);
  const suppression = detectA9A11SignalSuppressionV0(opts);
  const crossTick = analyzeCrossTickDivergenceV0();
  const smoothed = smoothEpistemicTickGraphV0(opts);
  const tail = smoothed.series[smoothed.series.length - 1];

  let score = 0;
  score += Math.min(30, (stateRankV0(crossTick.worstEpistemicState) || 0) * 15);
  score += Math.min(25, longTerm.metrics.boundaryDivergedRatio * 100);
  score += Math.min(15, (longTerm.metrics.compoundStreakMax / 5) * 15);
  score += Math.min(15, longTerm.breaches.length * 5);
  score += suppression.signalIdsNonEmpty ? 15 : 0;
  if (tail && stateRankV0(tail.raw_epistemic_state) > stateRankV0(tail.smoothed_epistemic_state)) {
    score += 5;
  }

  const driftRiskScore = Math.min(100, Math.round(score));
  const scoreBucket =
    driftRiskScore >= 70 ? 3 : driftRiskScore >= 45 ? 2 : driftRiskScore >= 20 ? 1 : 0;
  const band = DRIFT_SCORE_BUCKET_LABELS_V0[scoreBucket];

  return Object.freeze({
    schema: "castle.rhizoh.system_drift_risk.v0",
    driftRiskScore,
    scoreBucket,
    band,
    factors: Object.freeze({
      worstEpistemicState: crossTick.worstEpistemicState,
      thresholdBreaches: longTerm.breaches,
      a9A11SignalIds: suppression.signalIds,
      lastSmoothedState: tail?.smoothed_epistemic_state ?? SYSTEM_STATE_V0.LIVE_OK,
      lastRawState: tail?.raw_epistemic_state ?? SYSTEM_STATE_V0.LIVE_OK
    }),
    interpretationOnly: true,
    nonExecutive: true
  });
}

/**
 * Unified stability report (called after each ledger append).
 *
 * @param {{ windowTicks?: number, alpha?: number }} [opts]
 */
export function evaluateEpistemicStabilityV0(opts = {}) {
  const ledger = getEpistemicTickLedgerV0();
  const report = Object.freeze({
    schema: EPISTEMIC_STABILITY_SCHEMA_V0,
    version: "0.1",
    atMs: Date.now(),
    ledgerSessionId: ledger.sessionId,
    ledgerTickCount: ledger.total,
    graph: buildEpistemicTickGraphV0(),
    smoothedGraph: smoothEpistemicTickGraphV0(opts),
    longTermDivergence: evaluateLongTermDivergenceV0(opts),
    a9A11SignalCheck: detectA9A11SignalSuppressionV0(opts),
    driftRisk: computeSystemDriftRiskScoreV0(opts),
    centralizedArbitrationBus: false,
    interpretationOnly: true,
    nonExecutive: true
  });

  lastStabilityReportV0 = report;
  syncEpistemicStabilityWindowV0(report);
  return report;
}

export function getLastEpistemicStabilityReportV0() {
  return lastStabilityReportV0;
}

export function exportEpistemicStabilityReportJsonV0(opts = {}) {
  const report = lastStabilityReportV0 ?? evaluateEpistemicStabilityV0(opts);
  return JSON.stringify({ ...report, exportedAtMs: Date.now(), readOnly: true }, null, 2);
}

/** Test-only */
export function clearEpistemicStabilityForTestV0() {
  lastStabilityReportV0 = null;
  syncEpistemicStabilityWindowV0(null);
}

function sliceWindow(nodes, windowTicks) {
  if (!nodes?.length) return [];
  return nodes.slice(-windowTicks);
}

function stateRankV0(state) {
  return STATE_RANK_V0[state] ?? 0;
}

function rankToStateV0(rank) {
  return RANK_TO_STATE_V0[Math.min(2, Math.max(0, rank))] ?? SYSTEM_STATE_V0.LIVE_OK;
}

function seqGapV0(node) {
  const c = node.clientSeqHead;
  const g = node.gatewayLastAcceptedSeq;
  if (c == null || g == null) return null;
  return c - g;
}

function clamp01(n) {
  return Math.min(1, Math.max(0, n));
}

function round4(n) {
  return Math.round(n * 10_000) / 10_000;
}

function syncEpistemicStabilityWindowV0(report) {
  if (typeof window === "undefined") return;
  if (!window.__rhizoh) window.__rhizoh = {};
  window.__rhizoh_epistemic_stability = report;
  window.__rhizoh.epistemicStability = Object.freeze({
    evaluate: evaluateEpistemicStabilityV0,
    last: () => lastStabilityReportV0,
    smoothedGraph: smoothEpistemicTickGraphV0,
    longTermDivergence: evaluateLongTermDivergenceV0,
    a9A11SignalCheck: detectA9A11SignalSuppressionV0,
    driftRisk: computeSystemDriftRiskScoreV0,
    exportReport: exportEpistemicStabilityReportJsonV0
  });
}
