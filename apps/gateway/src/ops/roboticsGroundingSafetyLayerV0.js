/**
 * Robotics Grounding Safety Layer v0 — sensor-verified state before actuation.
 * Hallucination = epistemic drift (wrong state / world model), not wrong chat answer.
 * @see docs/ROBOTICS_EPISTEMIC_FREEZE.md
 */

export const ROBOTICS_GROUNDING_SCHEMA_V0 = "rhizoh.robotics_grounding_safety.v0";

export const STATE_SOURCE_V0 = Object.freeze({
  SENSOR_VERIFIED: "sensor_verified",
  MODEL_INFERRED: "model_inferred",
  NARRATIVE_DERIVED: "narrative_derived",
  SIMULATION: "simulation",
  UNKNOWN: "unknown"
});

export const EPISTEMIC_DRIFT_CLASS_V0 = Object.freeze({
  NONE: "none",
  CONFIDENCE_DETACHMENT: "confidence_detachment",
  NARRATIVE_RAW_MISMATCH: "narrative_raw_mismatch",
  UNVERIFIED_ACTUATION: "unverified_actuation",
  TENANT_CROSS_LEAK: "tenant_cross_leak"
});

/**
 * @param {{ source?: string, sensorFusionOk?: boolean, divergenceScore?: number, tenantScoped?: boolean }} stateCtx
 * @param {{ command?: object, fromModel?: boolean }} [actuation]
 */
export function evaluateRoboticsGroundingV0(stateCtx, actuation = {}) {
  const source = stateCtx.source || STATE_SOURCE_V0.UNKNOWN;
  const sensorOk = stateCtx.sensorFusionOk === true || source === STATE_SOURCE_V0.SENSOR_VERIFIED;
  const divergence = Math.max(0, Number(stateCtx.divergenceScore) || 0);
  const fromModel = actuation.fromModel === true;

  /** @type {string[]} */
  const driftFlags = [];
  if (!sensorOk) driftFlags.push(EPISTEMIC_DRIFT_CLASS_V0.UNVERIFIED_ACTUATION);
  if (divergence > 0.35) driftFlags.push(EPISTEMIC_DRIFT_CLASS_V0.NARRATIVE_RAW_MISMATCH);
  if (stateCtx.confidenceDetached === true) {
    driftFlags.push(EPISTEMIC_DRIFT_CLASS_V0.CONFIDENCE_DETACHMENT);
  }
  if (stateCtx.tenantScoped === false) driftFlags.push(EPISTEMIC_DRIFT_CLASS_V0.TENANT_CROSS_LEAK);

  const blockActuation = !sensorOk || (fromModel && !sensorOk) || driftFlags.length >= 2;

  return Object.freeze({
    schema: ROBOTICS_GROUNDING_SCHEMA_V0,
    stateSource: source,
    sensorVerified: sensorOk,
    modelOutputIsNotAction: true,
    actionRequiresVerifiedState: true,
    blockActuation,
    epistemicDrift: Object.freeze({
      detected: driftFlags.length > 0,
      flags: Object.freeze(driftFlags),
      hallucinationAsEpistemicError: driftFlags.length > 0
    }),
    policy: Object.freeze({
      rawFirst: true,
      narrativeNeverAuthorizesActuation: true,
      recoveryPhase: "recover_to_observe"
    }),
    primitivesReusedFromRhizoh: Object.freeze([
      "confidence_detachment_detection",
      "raw_first_policy",
      "divergence_scoring",
      "tenant_isolation"
    ])
  });
}

/**
 * Map operational + cultural risk signals into robotics grounding context.
 * @param {object} narrativeExport
 */
export function buildRoboticsGroundingFromNarrativeV0(narrativeExport) {
  const validation = narrativeExport?.validation || {};
  const propagation = narrativeExport?.humanOps?.socialPropagationSimulation;
  const confidenceDetached =
    propagation?.aggregate?.dominantDistortionSource ===
      "confidence_detached_from_epistemic_context" ||
    (propagation?.paths || []).some((p) => p.confidencePublicDistortionRisk);

  const stateCtx = {
    source: narrativeExport?.stateLayers?.raw?.rollout
      ? STATE_SOURCE_V0.SENSOR_VERIFIED
      : STATE_SOURCE_V0.NARRATIVE_DERIVED,
    sensorFusionOk: Boolean(narrativeExport?.stateLayers?.raw?.gcl || narrativeExport?.signalsSummary),
    divergenceScore: validation.divergence?.divergenceScore,
    confidenceDetached,
    tenantScoped: narrativeExport?.stateLayers?.derived?.tenantScoped === true
  };

  const grounding = evaluateRoboticsGroundingV0(stateCtx, { fromModel: true });

  return Object.freeze({
    ...grounding,
    linkedOperationalHealth: narrativeExport?.systemState?.health,
    chatVsRobotics: Object.freeze({
      chatWrongAnswer: "low_severity",
      roboticsWrongState: "catastrophic",
      hallucinationMeaning: "physical_risk_via_epistemic_drift"
    })
  });
}
