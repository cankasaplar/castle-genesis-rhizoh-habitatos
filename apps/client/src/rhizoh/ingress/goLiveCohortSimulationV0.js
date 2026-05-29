/**
 * Go-live cohort simulation v0.1 — simulate, threshold decision, export bundle.
 * interpretationOnly · nonExecutive
 * @see docs/RHIZOH_GO_LIVE_COHORT_SIMULATION_V1.0.md
 */

import {
  ADMISSION_VERDICT_V0,
  clearClosedAdmissionForTestV0,
  evaluateClosedAdmissionV0,
  EPISTEMIC_STRESS_CLASS_V0,
  listStressClassesV0,
  simulateGoLiveCohortV0
} from "./closedUserAdmissionEngineV0.js";

export const GO_LIVE_COHORT_SIMULATION_SCHEMA_V0 = "castle.rhizoh.go_live_cohort_simulation.v0";

export const GO_LIVE_DECISION_V0 = Object.freeze({
  PROCEED: "proceed",
  HOLD: "hold",
  ABORT: "abort"
});

/** Default thresholds — override via opts.thresholds */
export const DEFAULT_GO_LIVE_THRESHOLDS_V0 = Object.freeze({
  minAdmitRate: 0.55,
  minAdmitRateHold: 0.4,
  maxRejectRate: 0.08,
  maxRejectRateAbort: 0.12,
  minStressClassSpread: 2,
  maxSingleClassShare: 0.65
});

/**
 * @param {ReturnType<typeof simulateGoLiveCohortV0>} sim
 * @param {Partial<typeof DEFAULT_GO_LIVE_THRESHOLDS_V0>} [thresholdOverrides]
 */
export function evaluateGoLiveCohortDecisionV0(sim, thresholdOverrides = {}) {
  const t = { ...DEFAULT_GO_LIVE_THRESHOLDS_V0, ...thresholdOverrides };
  const n = sim.nodeCount || 1;
  const admitRate = sim.admitRate ?? 0;
  const rejectRate = (sim.verdictCounts?.reject ?? 0) / n;
  const holdRate = (sim.verdictCounts?.hold ?? 0) / n;

  const hist = sim.histogram || {};
  const classes = listStressClassesV0();
  const spread = classes.filter((c) => (hist[c] || 0) > 0).length;
  const maxShare = Math.max(...classes.map((c) => (hist[c] || 0) / n), 0);

  const reasons = [];
  if (admitRate < t.minAdmitRateHold) reasons.push("admit_rate_below_hold_floor");
  if (rejectRate > t.maxRejectRateAbort) reasons.push("reject_rate_abort");
  if (spread < t.minStressClassSpread) reasons.push("insufficient_stress_class_spread");
  if (maxShare > t.maxSingleClassShare) reasons.push("single_class_dominance");

  let decision = GO_LIVE_DECISION_V0.PROCEED;
  if (rejectRate > t.maxRejectRateAbort || admitRate < t.minAdmitRateHold) {
    decision = GO_LIVE_DECISION_V0.ABORT;
  } else if (
    admitRate < t.minAdmitRate ||
    rejectRate > t.maxRejectRate ||
    spread < t.minStressClassSpread ||
    maxShare > t.maxSingleClassShare
  ) {
    decision = GO_LIVE_DECISION_V0.HOLD;
  }

  return Object.freeze({
    schema: GO_LIVE_COHORT_SIMULATION_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    decision,
    admitRate,
    holdRate,
    rejectRate,
    stressClassSpread: spread,
    maxSingleClassShare: maxShare,
    thresholds: Object.freeze({ ...t }),
    reasons: Object.freeze(reasons)
  });
}

/**
 * Full simulation with per-node rows (for export).
 * @param {{ nodeCount?: number, seed?: number, thresholds?: object }} [opts]
 */
export function runGoLiveCohortSimulationV0(opts = {}) {
  clearClosedAdmissionForTestV0();

  const nodeCount = Math.max(1, Math.min(5000, Math.round(Number(opts.nodeCount) || 50)));
  const seed = Number(opts.seed) || 42;

  /** @param {number} i */
  function pseudo(i) {
    const x = Math.sin(seed * 999 + i * 7919) * 10000;
    return x - Math.floor(x);
  }

  const nodes = [];
  for (let i = 0; i < nodeCount; i++) {
    const signals = {
      formalCorrectnessStress: pseudo(i),
      infraReplayStress: pseudo(i + 1),
      physicalCouplingStress: pseudo(i + 2),
      interpretationStress: pseudo(i + 3)
    };
    const report = evaluateClosedAdmissionV0({
      subjectRef: `sim_node_${i}`,
      signals,
      riskFlags: { reputationalEndorsementClaim: pseudo(i + 4) > 0.97 }
    });
    nodes.push(
      Object.freeze({
        subjectRef: report.subjectRef,
        verdict: report.verdict,
        primaryStressClass: report.primaryStressClass,
        profile: { ...report.profile }
      })
    );
  }

  const summary = simulateGoLiveCohortV0({ nodeCount, seed });
  const decisionPack = evaluateGoLiveCohortDecisionV0(summary, opts.thresholds);

  return Object.freeze({
    schema: GO_LIVE_COHORT_SIMULATION_SCHEMA_V0,
    interpretationOnly: true,
    nonExecutive: true,
    generatedAtMs: Date.now(),
    nodeCount,
    seed,
    summary,
    decision: decisionPack,
    nodes: Object.freeze(nodes),
    stressClasses: listStressClassesV0()
  });
}

/**
 * JSON-serializable export bundle for ops / counsel-adjacent planning.
 * @param {ReturnType<typeof runGoLiveCohortSimulationV0>} run
 */
export function buildGoLiveCohortExportBundleV0(run) {
  return Object.freeze({
    schema: GO_LIVE_COHORT_SIMULATION_SCHEMA_V0,
    version: "1.0",
    generatedAt: new Date(run.generatedAtMs).toISOString(),
    legalFreezeRef: "LEGAL_FREEZE_SPEC_V1.0",
    nodeCount: run.nodeCount,
    seed: run.seed,
    decision: run.decision.decision,
    metrics: Object.freeze({
      admitRate: run.decision.admitRate,
      holdRate: run.decision.holdRate,
      rejectRate: run.decision.rejectRate,
      stressClassSpread: run.decision.stressClassSpread,
      maxSingleClassShare: run.decision.maxSingleClassShare,
      histogram: { ...run.summary.histogram },
      verdictCounts: { ...run.summary.verdictCounts }
    }),
    thresholds: { ...run.decision.thresholds },
    reasons: [...run.decision.reasons],
    nodes: run.nodes.map((n) => ({
      subjectRef: n.subjectRef,
      verdict: n.verdict,
      primaryStressClass: n.primaryStressClass
    }))
  });
}

export { EPISTEMIC_STRESS_CLASS_V0 };
