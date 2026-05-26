/**
 * Reality Drift Observer Layer (RDOL) v0 — models modes of operational misapprehension (yanılma şekilleri).
 * On ETCL: real-world vs model drift, propagation vs live divergence, robotics feedback mismatch.
 * @see docs/ops/REALITY_DRIFT_OBSERVER_V1.0.md
 */

import { EXECUTION_ELIGIBILITY_V0 } from "./actionContextResolutionLayerV0.js";
import { STATE_SOURCE_V0, EPISTEMIC_DRIFT_CLASS_V0 } from "./roboticsGroundingSafetyLayerV0.js";

export const REALITY_DRIFT_OBSERVER_SCHEMA_V0 = "rhizoh.reality_drift_observer.v0";

/** Operational misapprehension shape taxonomy (not psychology). */
export const MISAPPREHENSION_SHAPE_V0 = Object.freeze({
  REALITY_MODEL_DRIFT: "reality_model_drift",
  PROPAGATION_LIVE_DIVERGENCE: "propagation_live_system_divergence",
  ROBOTICS_FEEDBACK_MISMATCH: "robotics_feedback_mismatch",
  SIM_READ_AS_LIVE: "simulation_read_as_live_signal",
  NARRATIVE_RAW_DIVERGENCE: "narrative_raw_measurement_divergence"
});

/**
 * Real world vs model / coordination-sim drift.
 * @param {object} narrativeExport
 */
export function observeRealityModelDriftV0(narrativeExport) {
  const coordinationSim = narrativeExport?.signalsSummary?.coordinationSim === true;
  const validation = narrativeExport?.validation || {};
  const divergence = validation.divergence || {};
  const flags = divergence.flags || [];
  const gclDrift =
    narrativeExport?.interpretation?.suggestedActions?.some((a) =>
      String(a.rationale || "").toLowerCase().includes("drift")
    ) || flags.some((f) => String(f.id || "").includes("gcl"));

  const simReadAsLive = coordinationSim && narrativeExport?.systemState?.health === "stable";
  const driftScore = Math.max(0, Number(divergence.divergenceScore) || 0);

  const active = coordinationSim || driftScore > 0.25 || flags.length > 0 || gclDrift;

  return Object.freeze({
    schema: "rhizoh.reality_model_drift.v0",
    active,
    coordinationSim,
    divergenceScore: driftScore,
    divergenceFlags: Object.freeze(flags.map((f) => f.id || f.label).filter(Boolean)),
    gclRolloutDriftSignal: gclDrift,
    simReadAsLiveRisk: simReadAsLive,
    shapes: Object.freeze(
      [
        active ? MISAPPREHENSION_SHAPE_V0.REALITY_MODEL_DRIFT : null,
        simReadAsLive ? MISAPPREHENSION_SHAPE_V0.SIM_READ_AS_LIVE : null,
        driftScore > 0.35 ? MISAPPREHENSION_SHAPE_V0.NARRATIVE_RAW_DIVERGENCE : null
      ].filter(Boolean)
    ),
    note: "model_or_sim_state_may_diverge_from_live_redis_physics"
  });
}

/**
 * Social propagation compression vs live operational state.
 * @param {object} narrativeExport
 */
export function observePropagationLiveDivergenceV0(narrativeExport) {
  const propagation = narrativeExport?.humanOps?.socialPropagationSimulation;
  const health = narrativeExport?.systemState?.health;
  const highResidual = (propagation?.highResidualCount ?? 0) > 0;
  const distortion = propagation?.aggregate?.dominantDistortionSource;
  const trustFork = narrativeExport?.culturalRisk?.trustDynamics?.fork;

  const liveStable = health === "stable" || health === "stressed";
  const propagationLiveGap = highResidual && liveStable;
  const mythologyElevated = trustFork === "mythology";

  const active = propagationLiveGap || mythologyElevated || highResidual;

  return Object.freeze({
    schema: "rhizoh.propagation_live_divergence.v0",
    active,
    highResidualPathCount: propagation?.highResidualCount ?? 0,
    dominantDistortionSource: distortion,
    liveSystemHealth: health,
    propagationLiveGap,
    trustFork,
    shapes: Object.freeze(
      [
        propagationLiveGap ? MISAPPREHENSION_SHAPE_V0.PROPAGATION_LIVE_DIVERGENCE : null,
        mythologyElevated ? MISAPPREHENSION_SHAPE_V0.NARRATIVE_RAW_DIVERGENCE : null
      ].filter(Boolean)
    ),
    note: "compressed_social_path_may_misread_live_cluster_state"
  });
}

/**
 * Robotics commanded state vs sensor-verified feedback.
 * @param {object} narrativeExport
 */
export function observeRoboticsFeedbackMismatchV0(narrativeExport) {
  const robotics = narrativeExport?.appliedSystemsLayer?.roboticsGrounding;
  const acrl = narrativeExport?.actionContextResolution;
  const fp = acrl?.contextFingerprint;

  const blockActuation = robotics?.blockActuation === true;
  const sensorVerified = robotics?.sensorVerified === true;
  const driftFlags = robotics?.epistemicDrift?.flags ?? [];
  const mismatchDetected = driftFlags.includes(EPISTEMIC_DRIFT_CLASS_V0.NARRATIVE_RAW_MISMATCH);
  const unverified = driftFlags.includes(EPISTEMIC_DRIFT_CLASS_V0.UNVERIFIED_ACTUATION);

  const roboticsOkInMatrix =
    acrl?.actionOverloadingRisk?.deployAgentExample?.robotics === EXECUTION_ELIGIBILITY_V0.OK;
  const feedbackMismatch = (blockActuation && roboticsOkInMatrix) || mismatchDetected || unverified;

  return Object.freeze({
    schema: "rhizoh.robotics_feedback_mismatch.v0",
    active: feedbackMismatch,
    blockActuation,
    sensorVerified,
    stateSource: robotics?.stateSource || STATE_SOURCE_V0.UNKNOWN,
    driftFlags: Object.freeze(driftFlags),
    matrixRoboticsOk: roboticsOkInMatrix,
    coordinationSim: fp?.coordinationSimActive === true,
    shapes: Object.freeze(
      feedbackMismatch ? [MISAPPREHENSION_SHAPE_V0.ROBOTICS_FEEDBACK_MISMATCH] : []
    ),
    note: "model_inferred_state_vs_sensor_feedback_path_mismatch"
  });
}

/**
 * @param {object} narrativeExport
 */
export function catalogMisapprehensionShapesV0(narrativeExport) {
  const reality = observeRealityModelDriftV0(narrativeExport);
  const propagation = observePropagationLiveDivergenceV0(narrativeExport);
  const robotics = observeRoboticsFeedbackMismatchV0(narrativeExport);

  const shapeSet = new Set([
    ...reality.shapes,
    ...propagation.shapes,
    ...robotics.shapes
  ]);

  const catalog = [...shapeSet].map((shapeId) => {
    const sources = [];
    if (reality.shapes.includes(shapeId)) sources.push("reality_model_drift");
    if (propagation.shapes.includes(shapeId)) sources.push("propagation_live_divergence");
    if (robotics.shapes.includes(shapeId)) sources.push("robotics_feedback_mismatch");

    const severity =
      shapeId === MISAPPREHENSION_SHAPE_V0.ROBOTICS_FEEDBACK_MISMATCH
        ? "critical"
        : shapeId === MISAPPREHENSION_SHAPE_V0.SIM_READ_AS_LIVE
          ? "high"
          : shapeId === MISAPPREHENSION_SHAPE_V0.PROPAGATION_LIVE_DIVERGENCE
            ? "medium"
            : "medium";

    return Object.freeze({
      shapeId,
      severity,
      sources: Object.freeze(sources),
      operationalMeaning: resolveShapeMeaningV0(shapeId)
    });
  });

  return Object.freeze({
    schema: "rhizoh.misapprehension_shape_catalog.v0",
    shapeCount: catalog.length,
    shapes: Object.freeze(catalog),
    observers: Object.freeze({ reality, propagation, robotics })
  });
}

/**
 * @param {string} shapeId
 */
function resolveShapeMeaningV0(shapeId) {
  const map = {
    [MISAPPREHENSION_SHAPE_V0.REALITY_MODEL_DRIFT]:
      "live_physics_differs_from_model_or_sim_assumptions",
    [MISAPPREHENSION_SHAPE_V0.PROPAGATION_LIVE_DIVERGENCE]:
      "compressed_external_narrative_differs_from_live_ops_signals",
    [MISAPPREHENSION_SHAPE_V0.ROBOTICS_FEEDBACK_MISMATCH]:
      "actuation_path_not_aligned_with_sensor_verified_feedback",
    [MISAPPREHENSION_SHAPE_V0.SIM_READ_AS_LIVE]:
      "coordination_sim_output_treated_as_production_truth",
    [MISAPPREHENSION_SHAPE_V0.NARRATIVE_RAW_DIVERGENCE]:
      "derived_story_diverges_from_raw_measurements"
  };
  return map[shapeId] || "unknown_misapprehension_shape";
}

/**
 * @param {object} narrativeExport
 */
export function buildRealityDriftObserverLayerV0(narrativeExport) {
  const catalog = catalogMisapprehensionShapesV0(narrativeExport);
  const anyActive =
    catalog.observers.reality.active ||
    catalog.observers.propagation.active ||
    catalog.observers.robotics.active;

  const criticalCount = catalog.shapes.filter((s) => s.severity === "critical").length;

  return Object.freeze({
    schema: REALITY_DRIFT_OBSERVER_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "misapprehension_shape_observer_on_etcl",
    stackPosition: "above_epistemicTemporalCoherence",
    realityModelDrift: catalog.observers.reality,
    propagationLiveDivergence: catalog.observers.propagation,
    roboticsFeedbackMismatch: catalog.observers.robotics,
    misapprehensionShapeCatalog: catalog,
    driftObserverSummary: Object.freeze({
      active: anyActive,
      shapeCount: catalog.shapeCount,
      criticalShapeCount: criticalCount,
      firstTimeModeling: "operational_misapprehension_modes_not_only_errors"
    }),
    operatorGuidance: Object.freeze({
      tr: anyActive
        ? `RDOL: ${catalog.shapeCount} yanılma şekli izleniyor (model/propagation/robotics) — RAW ile doğrula.`
        : "RDOL: belirgin drift şekli yok — yine RAW-first.",
      en: anyActive
        ? `RDOL: ${catalog.shapeCount} misapprehension shape(s) observed — verify with RAW.`
        : "RDOL: no dominant drift shape — RAW-first still applies."
    }),
    invariants: Object.freeze([
      "rdol_observes_drift_does_not_execute_remediation",
      "robotics_mismatch_treated_as_critical_misapprehension",
      "simulation_never_auto_promoted_to_live_truth",
      "propagation_residual_does_not_override_live_gcl_rollout"
    ]),
    nonExecutable: true,
    nonBinding: true
  });
}
