/**
 * Phase 3 operability balance — over-gating vs under-sensitivity (non-semantic usefulness proxy).
 * @see docs/ops/PHASE3_OPERABILITY_BALANCE_V1.0.md
 * @see docs/ops/PHASE3_1_CONTROL_FEEDBACK_LOOP_V1.0.md
 */
import { PHASE3_MODE_V0 } from "./phase3ControlledDivergenceRuntimeV0.js";

export const OPERABILITY_BALANCE_SCHEMA_V0 = "rhizoh.phase3.operability_balance.v0";

/** Scenarios expected to gate (failure drills). */
export const DRILL_EXPECTS_GATING_V0 = Object.freeze([
  "F1_observation_drift",
  "F3_divergence_explosion",
  "F4_feedback_loop",
  "F5_execution_leakage"
]);

export const OPERATIONAL_BASELINE_IDS_V0 = Object.freeze([
  "NORMAL_baseline",
  "F2_model_overconfidence"
]);

/**
 * @typedef {object} CycleOutcomeRecord
 * @property {string} [id]
 * @property {boolean} [cycleOk]
 * @property {string} [mode]
 * @property {boolean} [executionAllowed]
 * @property {boolean} [sideEffects]
 * @property {boolean} [projectionSchemaPass]
 * @property {boolean} [expectedToGate]
 */

/**
 * Non-semantic usefulness proxy (not product success — runtime operability).
 * @param {CycleOutcomeRecord[]} records
 */
export function computeUsefulnessProxyV0(records) {
  const n = records.length || 1;
  const completed = records.filter(
    (r) => r.cycleOk === true && (r.sideEffects === true || r.executionAllowed === true)
  ).length;
  const successfulCycleCompletionRate = Number((completed / n).toFixed(4));

  let continuityRun = 0;
  let maxContinuity = 0;
  for (const r of records) {
    if (r.projectionSchemaPass === true) {
      continuityRun += 1;
      maxContinuity = Math.max(maxContinuity, continuityRun);
    } else {
      continuityRun = 0;
    }
  }
  const stableProjectionContinuityWindow = maxContinuity;

  const usefulnessScore = Number(
    (0.55 * successfulCycleCompletionRate + 0.45 * Math.min(1, stableProjectionContinuityWindow / n)).toFixed(
      4
    )
  );

  return Object.freeze({
    schema: "rhizoh.phase3.usefulness_proxy.v0",
    successfulCycleCompletionRate,
    stableProjectionContinuityWindow,
    usefulnessScore,
    note: "non_semantic_proxy_not_user_value"
  });
}

/**
 * containment / execution ratio — lock intensity vs throughput.
 * @param {{ containment: number, executionAllowed: number }} rates
 */
export function computeContainmentExecutionRatioV0(rates) {
  const exec = Math.max(rates.executionAllowed, 0.05);
  const ratio = Number((rates.containment / exec).toFixed(4));
  return Object.freeze({
    ratio,
    interpretation:
      ratio > 1.2 ? "lock_heavier_than_execution" : ratio < 0.25 ? "execution_heavy_low_lock" : "balanced_band"
  });
}

/**
 * Under-sensitivity: drills that should gate but allowed execution anyway.
 * @param {CycleOutcomeRecord[]} records
 */
export function computeUnderSensitivityRiskV0(records) {
  const drills = records.filter((r) => r.expectedToGate === true || DRILL_EXPECTS_GATING_V0.includes(r.id || ""));
  const missed = drills.filter((r) => r.executionAllowed === true);
  const rate = drills.length ? Number((missed.length / drills.length).toFixed(4)) : 0;
  const underSensitive = rate > 0.25;
  return Object.freeze({
    schema: "rhizoh.phase3.under_sensitivity.v0",
    drillCount: drills.length,
    missedGatingCount: missed.length,
    missedGatingRate: rate,
    underSensitive,
    missedIds: missed.map((r) => r.id).filter(Boolean)
  });
}

/**
 * Balance operational health (gating metrics) with usefulness proxy.
 * @param {{
 *   overGating: ReturnType<import("./phase3ControlledDivergenceRuntimeV0.js").computeOverGatingMetricsV0>,
 *   usefulness: ReturnType<typeof computeUsefulnessProxyV0>,
 *   underSensitivity: ReturnType<typeof computeUnderSensitivityRiskV0>,
 *   containmentExecutionRatio: ReturnType<typeof computeContainmentExecutionRatioV0>
 * }} input
 */
export function computeOperabilityBalanceMetricsV0(input) {
  const { overGating, usefulness, underSensitivity, containmentExecutionRatio } = input;

  const operabilityScore = Number(
    (
      usefulness.usefulnessScore * (1 - overGating.inertnessScore) * (underSensitivity.underSensitive ? 0.6 : 1)
    ).toFixed(4)
  );

  let balance = "balanced";
  if (overGating.overGating && !underSensitivity.underSensitive) balance = "over_gating_dominant";
  else if (underSensitivity.underSensitive && !overGating.overGating) balance = "under_sensitive_dominant";
  else if (overGating.overGating && underSensitivity.underSensitive) balance = "unstable_gate_calibration";

  return Object.freeze({
    schema: OPERABILITY_BALANCE_SCHEMA_V0,
    operabilityScore,
    balance,
    overGating: overGating.overGating,
    underSensitive: underSensitivity.underSensitive,
    containmentExecutionRatio: containmentExecutionRatio.ratio,
    usefulnessScore: usefulness.usefulnessScore,
    recommendation:
      balance === "balanced"
        ? "maintain_thresholds_monitor_shadow_sampling"
        : balance === "over_gating_dominant"
          ? "phase3_1_relax_entropy_or_divergence_band"
          : balance === "under_sensitive_dominant"
          ? "phase3_1_tighten_drill_calibration_or_g2_g4"
          : "phase3_1_full_feedback_loop_recalibration"
  });
}

/**
 * Phase 3.1 roadmap hints (not active runtime — design only).
 * @param {ReturnType<typeof computeOperabilityBalanceMetricsV0>} balance
 */
export function suggestPhase31FeedbackLoopPlanV0(balance) {
  const triggers = [];
  if (balance.overGating) {
    triggers.push("over_gating_self_correction: lower entropy_limit step -0.05");
    triggers.push("adaptive_gating_curve: widen MID band when operational usefulness < 0.5");
  }
  if (balance.underSensitive) {
    triggers.push("hard_stabilize: tighten divergenceMid -0.05 on drill miss");
    triggers.push("schema_evolution_trigger: only via MODELED_PROJECTION_SCHEMA bump");
  }
  if (balance.balance === "balanced") {
    triggers.push("hold_static_thresholds_collect_live_shadow_histogram");
  }

  return Object.freeze({
    schema: "rhizoh.phase3.1.feedback_loop_plan.v0",
    status: "design_only_not_runtime",
    triggers: Object.freeze(triggers),
    modules: Object.freeze([
      "over_gating_self_correction",
      "schema_evolution_triggers",
      "entropy_adaptive_gating",
      "control_feedback_loop_optimization"
    ])
  });
}

/**
 * Build harness cycle record from loop result.
 * @param {string} scenarioId
 * @param {ReturnType<import("./phase3ControlledDivergenceRuntimeV0.js").runPhase3ControlLoopCycleV0>} cycle
 */
export function cycleOutcomeFromLoopV0(scenarioId, cycle) {
  const expectedToGate = DRILL_EXPECTS_GATING_V0.includes(scenarioId);
  return {
    id: scenarioId,
    cycleOk: cycle.ok === true,
    mode: cycle.state?.mode,
    executionAllowed: cycle.execution?.executionAllowed === true,
    sideEffects: cycle.execution?.sideEffects === true,
    projectionSchemaPass: cycle.state?.modeled?.dimensionValidation?.pass === true,
    expectedToGate
  };
}

/** Operability phase regions (no new measurement primitives). */
export const OPERABILITY_PHASE_REGION_V0 = Object.freeze({
  OPTIMAL: "optimal",
  ALIVE: "canli",
  LOCKED: "kilitli",
  BLIND: "kor",
  UNSTABLE: "kararsiz",
  TRANSITION: "gecis"
});

/** Target centroid in (u,s,g) for optimal band. */
export const OPERABILITY_OPTIMAL_CENTROID_V0 = Object.freeze({ u: 0.75, s: 0.75, g: 0.9 });

const PHASE_SPACE_GRID_BINS_V0 = 4;

/**
 * Map existing metrics → ℝ³ phase coordinates (usefulness, stability, guard sensitivity).
 * @param {{
 *   usefulnessScore?: number,
 *   inertnessScore?: number,
 *   missedGatingRate?: number,
 *   underSensitive?: boolean,
 *   overGating?: boolean
 * }} input
 */
export function computeOperabilityPhaseCoordinatesV0(input) {
  const u = clamp01(input.usefulnessScore ?? 0);
  const s = clamp01(1 - (input.inertnessScore ?? 0));
  const g = clamp01(1 - (input.missedGatingRate ?? 0));
  return Object.freeze({
    schema: "rhizoh.phase3.operability_phase_coords.v0",
    axes: Object.freeze({
      usefulness: { symbol: "u", value: Number(u.toFixed(4)), source: "usefulnessScore" },
      stability: { symbol: "s", value: Number(s.toFixed(4)), source: "1 - inertnessScore" },
      guardSensitivity: { symbol: "g", value: Number(g.toFixed(4)), source: "1 - missedGatingRate" }
    }),
    vector: Object.freeze([Number(u.toFixed(4)), Number(s.toFixed(4)), Number(g.toFixed(4))]),
    flags: Object.freeze({
      overGating: input.overGating === true,
      underSensitive: input.underSensitive === true
    })
  });
}

/**
 * Classify point into stable / useful / sensitive regions (piecewise half-spaces).
 * @param {ReturnType<typeof computeOperabilityPhaseCoordinatesV0>} coords
 */
export function classifyOperabilityPhaseRegionV0(coords) {
  const u = coords.axes.usefulness.value;
  const s = coords.axes.stability.value;
  const g = coords.axes.guardSensitivity.value;
  const { overGating, underSensitive } = coords.flags;

  let region = OPERABILITY_PHASE_REGION_V0.TRANSITION;
  let labelTr = "geçiş";

  if (overGating && underSensitive) {
    region = OPERABILITY_PHASE_REGION_V0.UNSTABLE;
    labelTr = "kararsız";
  } else if (underSensitive || g < 0.5) {
    region = OPERABILITY_PHASE_REGION_V0.BLIND;
    labelTr = "kör";
  } else if (coords.flags.overGating || s < 0.45 || (u < 0.45 && s < 0.55)) {
    region = OPERABILITY_PHASE_REGION_V0.LOCKED;
    labelTr = "kilitli";
  } else if (u >= 0.55 && s >= 0.55 && g >= 0.75 && !overGating) {
    region = OPERABILITY_PHASE_REGION_V0.OPTIMAL;
    labelTr = "optimal";
  } else if (u >= 0.35 && s >= 0.35 && g >= 0.5) {
    region = OPERABILITY_PHASE_REGION_V0.ALIVE;
    labelTr = "canlı";
  }

  const dist = euclidean3(
    [u, s, g],
    [OPERABILITY_OPTIMAL_CENTROID_V0.u, OPERABILITY_OPTIMAL_CENTROID_V0.s, OPERABILITY_OPTIMAL_CENTROID_V0.g]
  );

  return Object.freeze({
    region,
    labelTr,
    distanceToOptimal: Number(dist.toFixed(4)),
    inOptimalBall: dist <= 0.35
  });
}

/**
 * Per-cycle coordinates from cycle outcome (same axes, local estimate).
 * @param {CycleOutcomeRecord} record
 */
export function computeCyclePhaseCoordinatesV0(record) {
  const exec = record.executionAllowed === true ? 1 : 0;
  const useful = (record.cycleOk ? 0.5 : 0) + (record.sideEffects ? 0.3 : 0) + exec * 0.2;
  const proj = record.projectionSchemaPass === true ? 0.2 : 0;
  const u = clamp01(useful + proj);

  const modeStability = {
    NORMAL: 1,
    THROTTLED: 0.82,
    CONTAINED: 0.42,
    ROLLBACK: 0.28,
    FREEZE: 0.18
  };
  const s = clamp01(modeStability[record.mode] ?? 0.5);

  let g = 0.75;
  if (record.expectedToGate) g = record.executionAllowed ? 0.12 : 0.95;

  return computeOperabilityPhaseCoordinatesV0({
    usefulnessScore: u,
    inertnessScore: 1 - s,
    missedGatingRate: 1 - g,
    underSensitive: record.expectedToGate === true && record.executionAllowed === true,
    overGating: s < 0.45 && record.expectedToGate !== true
  });
}

/**
 * Build operability phase space map — lattice occupancy + region catalog.
 * @param {{
 *   aggregate: {
 *     overGating: { inertnessScore: number, overGating: boolean },
 *     usefulness: { usefulnessScore: number },
 *     underSensitivity: { missedGatingRate: number, underSensitive: boolean },
 *     operabilityBalance?: { balance: string }
 *   },
 *   scenarioRecords: CycleOutcomeRecord[]
 * }} input
 */
export function buildOperabilityPhaseSpaceMapV0(input) {
  const { aggregate, scenarioRecords } = input;
  const aggCoords = computeOperabilityPhaseCoordinatesV0({
    usefulnessScore: aggregate.usefulness.usefulnessScore,
    inertnessScore: aggregate.overGating.inertnessScore,
    missedGatingRate: aggregate.underSensitivity.missedGatingRate,
    overGating: aggregate.overGating.overGating,
    underSensitive: aggregate.underSensitivity.underSensitive
  });
  const aggRegion = classifyOperabilityPhaseRegionV0(aggCoords);

  const scenarioPoints = scenarioRecords.map((r) => {
    const coords = computeCyclePhaseCoordinatesV0(r);
    const region = classifyOperabilityPhaseRegionV0(coords);
    return Object.freeze({
      id: r.id,
      coords: coords.vector,
      region: region.region,
      labelTr: region.labelTr,
      distanceToOptimal: region.distanceToOptimal
    });
  });

  const grid = buildPhaseSpaceLatticeV0(scenarioPoints, aggCoords);

  const regionCatalog = Object.freeze({
    [OPERABILITY_PHASE_REGION_V0.OPTIMAL]: Object.freeze({
      labelTr: "optimal",
      semantics: "useful_and_stable_and_sensitive_enough",
      halfSpace: "u>=0.55 ∧ s>=0.55 ∧ g>=0.75 ∧ ¬overGating"
    }),
    [OPERABILITY_PHASE_REGION_V0.ALIVE]: Object.freeze({
      labelTr: "canlı",
      semantics: "executing_with_moderate_stability_not_blind",
      halfSpace: "u>=0.35 ∧ s>=0.35 ∧ g>=0.5 ∧ ¬kor ∧ ¬kilitli"
    }),
    [OPERABILITY_PHASE_REGION_V0.LOCKED]: Object.freeze({
      labelTr: "kilitli",
      semantics: "safe_but_inert_over_gated_or_low_stability",
      halfSpace: "overGating ∨ s<0.45 ∨ (u<0.45 ∧ s<0.55)"
    }),
    [OPERABILITY_PHASE_REGION_V0.BLIND]: Object.freeze({
      labelTr: "kör",
      semantics: "under_sensitive_misses_expected_gates",
      halfSpace: "underSensitive ∨ g<0.5"
    }),
    [OPERABILITY_PHASE_REGION_V0.UNSTABLE]: Object.freeze({
      labelTr: "kararsız",
      semantics: "simultaneous_over_gating_and_under_sensitivity",
      halfSpace: "overGating ∧ underSensitive"
    }),
    [OPERABILITY_PHASE_REGION_V0.TRANSITION]: Object.freeze({
      labelTr: "geçiş",
      semantics: "between_regions_recalibrate_or_collect_more_samples",
      halfSpace: "default_fallback"
    })
  });

  const executionOrderTrajectory = buildOperabilityPhaseTrajectoryV0({
    seriesId: "phase3_harness_execution_order",
    clock: "execution_order",
    timeline: scenarioRecords.map((r, t) => ({
      t,
      scenarioId: r.id,
      record: r
    }))
  });

  return Object.freeze({
    schema: "rhizoh.phase3.operability_phase_space_map.v0",
    space: Object.freeze({
      kind: "R3_unit_cube",
      axes: ["usefulness_u", "stability_s", "guardSensitivity_g"],
      derivedFrom: Object.freeze([
        "usefulnessScore",
        "inertnessScore",
        "missedGatingRate"
      ]),
      noNewPrimitives: true
    }),
    aggregate: Object.freeze({
      coordinates: aggCoords,
      region: aggRegion,
      operabilityBalance: aggregate.operabilityBalance?.balance
    }),
    scenarioPoints,
    lattice: grid,
    regionCatalog,
    dominantRegion: dominantRegionFromPointsV0([...scenarioPoints, { region: aggRegion.region }]),
    trajectory: executionOrderTrajectory
  });
}

/** Dynamics classification (behavior analysis, not debug). */
export const TRAJECTORY_DYNAMICS_CLASS_V0 = Object.freeze({
  STABLE_ATTRACTOR: "stable_attractor",
  LOCK_RECOVERY: "lock_recovery",
  STRESS_DEFLECTION: "stress_induced_deflection",
  BLIND_EXPOSURE: "blind_exposure",
  OSCILLATORY: "oscillatory",
  DRIFT_FROM_OPTIMAL: "drift_away_from_optimal",
  MIXED: "mixed_dynamics"
});

/**
 * @typedef {object} TrajectoryTimelineItem
 * @property {number} [t]
 * @property {string} [scenarioId]
 * @property {string} [atMs]
 * @property {CycleOutcomeRecord} record
 */

/**
 * Operability phase space trajectory — time series in (u,s,g).
 * @param {{
 *   seriesId: string,
 *   timeline: TrajectoryTimelineItem[],
 *   clock?: string
 * }} input
 */
export function buildOperabilityPhaseTrajectoryV0(input) {
  const { seriesId, timeline, clock = "execution_order" } = input;
  const samples = [];

  for (let i = 0; i < timeline.length; i++) {
    const item = timeline[i];
    const coords = computeCyclePhaseCoordinatesV0(item.record);
    const region = classifyOperabilityPhaseRegionV0(coords);
    const prev = samples[i - 1];
    const displacement = prev
      ? Number(euclidean3(coords.vector, prev.coords).toFixed(4))
      : 0;
    const regionChanged = prev ? prev.region !== region.region : false;

    samples.push(
      Object.freeze({
        t: item.t ?? i,
        atMs: item.atMs ?? null,
        scenarioId: item.scenarioId ?? item.record.id ?? `step_${i}`,
        coords: coords.vector,
        region: region.region,
        labelTr: region.labelTr,
        distanceToOptimal: region.distanceToOptimal,
        displacement,
        regionChanged
      })
    );
  }

  const dynamics = analyzeTrajectoryDynamicsV0(samples);

  return Object.freeze({
    schema: "rhizoh.phase3.operability_phase_trajectory.v0",
    analysisKind: "system_behavior_dynamics",
    notDebuggingSnapshot: true,
    seriesId,
    clock,
    sampleCount: samples.length,
    samples: Object.freeze(samples),
    dynamics
  });
}

/**
 * @param {ReturnType<typeof buildOperabilityPhaseTrajectoryV0>["samples"]} samples
 */
function analyzeTrajectoryDynamicsV0(samples) {
  if (!samples.length) {
    return Object.freeze({ classification: TRAJECTORY_DYNAMICS_CLASS_V0.MIXED, pathLength: 0 });
  }

  const displacements = samples.slice(1).map((s) => s.displacement);
  const pathLength = Number(displacements.reduce((a, b) => a + b, 0).toFixed(4));
  const meanStepVelocity = Number(
    (pathLength / Math.max(1, displacements.length)).toFixed(4)
  );

  const transitions = [];
  for (let i = 1; i < samples.length; i++) {
    if (samples[i].regionChanged) {
      transitions.push(
        Object.freeze({
          at: i,
          from: samples[i - 1].region,
          to: samples[i].region,
          scenarioId: samples[i].scenarioId
        })
      );
    }
  }

  const dwellByRegion = {};
  for (const s of samples) {
    dwellByRegion[s.region] = (dwellByRegion[s.region] || 0) + 1;
  }

  const optimalDrift = Number(
    (samples.at(-1).distanceToOptimal - samples[0].distanceToOptimal).toFixed(4)
  );
  const netDisplacement = Number(
    euclidean3(samples[0].coords, samples.at(-1).coords).toFixed(4)
  );
  const oscillationIndex = Number(
    (transitions.length / Math.max(1, samples.length - 1)).toFixed(4)
  );

  const visitedBlind = samples.some((s) => s.region === OPERABILITY_PHASE_REGION_V0.BLIND);
  const visitedLocked = samples.some((s) => s.region === OPERABILITY_PHASE_REGION_V0.LOCKED);
  const endsOptimal = samples.at(-1).region === OPERABILITY_PHASE_REGION_V0.OPTIMAL;
  const startsOptimal = samples[0].region === OPERABILITY_PHASE_REGION_V0.OPTIMAL;

  let classification = TRAJECTORY_DYNAMICS_CLASS_V0.MIXED;
  if (visitedBlind) classification = TRAJECTORY_DYNAMICS_CLASS_V0.BLIND_EXPOSURE;
  else if (oscillationIndex >= 0.5) classification = TRAJECTORY_DYNAMICS_CLASS_V0.OSCILLATORY;
  else if (optimalDrift < -0.05 && endsOptimal) classification = TRAJECTORY_DYNAMICS_CLASS_V0.STABLE_ATTRACTOR;
  else if (visitedLocked && endsOptimal && !startsOptimal)
    classification = TRAJECTORY_DYNAMICS_CLASS_V0.LOCK_RECOVERY;
  else if (visitedLocked && optimalDrift > 0.05)
    classification = TRAJECTORY_DYNAMICS_CLASS_V0.DRIFT_FROM_OPTIMAL;
  else if (visitedLocked) classification = TRAJECTORY_DYNAMICS_CLASS_V0.STRESS_DEFLECTION;

  return Object.freeze({
    schema: "rhizoh.phase3.trajectory_dynamics.v0",
    pathLength,
    meanStepVelocity,
    netDisplacement,
    optimalDrift,
    oscillationIndex,
    regionTransitionCount: transitions.length,
    transitions: Object.freeze(transitions),
    dwellByRegion: Object.freeze(dwellByRegion),
    classification,
    summary:
      classification === TRAJECTORY_DYNAMICS_CLASS_V0.STABLE_ATTRACTOR
        ? "converges_toward_optimal_band"
        : classification === TRAJECTORY_DYNAMICS_CLASS_V0.LOCK_RECOVERY
          ? "stress_lock_then_returns_to_optimal"
          : classification === TRAJECTORY_DYNAMICS_CLASS_V0.STRESS_DEFLECTION
            ? "deflected_by_containment_without_blindness"
            : classification === TRAJECTORY_DYNAMICS_CLASS_V0.BLIND_EXPOSURE
              ? "trajectory_entered_blind_region"
              : classification === TRAJECTORY_DYNAMICS_CLASS_V0.OSCILLATORY
                ? "high_region_churn"
                : classification === TRAJECTORY_DYNAMICS_CLASS_V0.DRIFT_FROM_OPTIMAL
                  ? "moving_away_from_optimal_centroid"
                  : "mixed_or_insufficient_samples"
  });
}

function buildPhaseSpaceLatticeV0(points, aggCoords) {
  const bins = PHASE_SPACE_GRID_BINS_V0;
  const cells = new Map();

  const add = (vec, tag) => {
    const [u, s, g] = vec;
    const iu = Math.min(bins - 1, Math.floor(u * bins));
    const is = Math.min(bins - 1, Math.floor(s * bins));
    const ig = Math.min(bins - 1, Math.floor(g * bins));
    const key = `${iu},${is},${ig}`;
    const cell = cells.get(key) || { key, iu, is, ig, count: 0, tags: [] };
    cell.count += 1;
    cell.tags.push(tag);
    cells.set(key, cell);
  };

  for (const p of points) add(p.coords, p.id || "point");
  add(aggCoords.vector, "aggregate");

  const occupancy = [...cells.values()].map((c) =>
    Object.freeze({
      ...c,
      center: Object.freeze([
        Number(((c.iu + 0.5) / bins).toFixed(3)),
        Number(((c.is + 0.5) / bins).toFixed(3)),
        Number(((c.ig + 0.5) / bins).toFixed(3))
      ]),
      dominantTag: modeTag(c.tags)
    })
  );

  return Object.freeze({
    binsPerAxis: bins,
    cellCount: occupancy.length,
    occupancy: Object.freeze(occupancy)
  });
}

function dominantRegionFromPointsV0(points) {
  const counts = new Map();
  for (const p of points) {
    const r = p.region;
    if (!r) continue;
    counts.set(r, (counts.get(r) || 0) + 1);
  }
  let best = OPERABILITY_PHASE_REGION_V0.TRANSITION;
  let max = 0;
  for (const [r, n] of counts) {
    if (n > max) {
      max = n;
      best = r;
    }
  }
  return best;
}

function clamp01(x) {
  return Math.max(0, Math.min(1, Number(x) || 0));
}

function euclidean3(a, b) {
  return Math.sqrt(a.reduce((s, v, i) => s + (v - b[i]) ** 2, 0));
}

function modeTag(tags) {
  const m = new Map();
  for (const t of tags) m.set(t, (m.get(t) || 0) + 1);
  let best = tags[0];
  let max = 0;
  for (const [k, n] of m) {
    if (n > max) {
      max = n;
      best = k;
    }
  }
  return best;
}
