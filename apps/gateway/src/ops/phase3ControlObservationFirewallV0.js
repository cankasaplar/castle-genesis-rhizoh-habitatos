/**
 * Phase 3 ↔ Phase 3D firewall — observation must never drive execution.
 * @see docs/ops/PHASE3_CONTROL_OBSERVATION_FIREWALL_V1.0.md
 */

export const FIREWALL_SCHEMA_V0 = "rhizoh.phase3.control_observation_firewall.v0";

/** Modules allowed to import Phase 3D / observation export (audit & harness only). */
export const OBSERVATION_COMPOSER_ALLOWLIST_V0 = Object.freeze([
  "phase3ObservationExportV0.js",
  "phase3HarnessExportV0.js",
  "phase3DAttractorIntelligenceV0.js",
  "phase3DPerturbationSensitivityV0.js",
  "phase3OperabilityBalanceV0.js"
]);

/** Control runtime — must NOT import observation / 3D intelligence. */
export const CONTROL_RUNTIME_MODULE_V0 = "phase3ControlledDivergenceRuntimeV0.js";

/** Forbidden import substrings in control path sources. */
export const FORBIDDEN_IN_CONTROL_PATH_V0 = Object.freeze([
  "phase3DAttractorIntelligenceV0",
  "phase3DPerturbationSensitivityV0",
  "buildPhase3DAttractorIntelligenceV0",
  "buildAttractorPerturbationSensitivityMapV0",
  "buildOperabilityPhaseSpaceMapV0",
  "buildOperabilityPhaseTrajectoryV0",
  "operabilityPhaseSpaceMap",
  "phase3DAttractorIntelligence",
  "perturbationSensitivityMap",
  "behaviorDynamics",
  "phase3dObservationGate"
]);

/** Keys that must not appear in control gate derivation. */
export const FORBIDDEN_CONTROL_GATE_INPUTS_V0 = Object.freeze([
  "phase3DAttractorIntelligence",
  "perturbationSensitivityMap",
  "operabilityPhaseSpaceMap",
  "operabilityPhaseTrajectories",
  "behaviorDynamics",
  "phase3dObservationGate",
  "phase3dGate",
  "operabilityBalance",
  "usefulnessProxy",
  "primaryAttractor",
  "stressorExitAnalysis"
]);

export const FIREWALL_MANIFEST_V0 = Object.freeze({
  schema: FIREWALL_SCHEMA_V0,
  enforced: true,
  phase3Role: "control_only",
  phase3dRole: "observation_only",
  rule: "observation_never_feeds_execution_gate",
  antiPattern: "measure_interpret_govern_chain",
  controlGateSource: "phase3Control.phase3ExecutionGate",
  observationGateSource: "phase3Observation.phase3dObservationGate",
  separation: Object.freeze({
    control: Object.freeze([
      "G1_G5_gates",
      "divergence_WAL",
      "executeOrContain",
      "over_gating_operational",
      "under_sensitivity_drill_safety"
    ]),
    observation: Object.freeze([
      "operability_balance",
      "phase_space_map",
      "trajectory_dynamics",
      "phase3d_attractor_intelligence",
      "perturbation_sensitivity_map"
    ])
  })
});

/**
 * Compose harness export with explicit firewall envelope.
 * @param {{ control: object, observation: object }} parts
 */
export function composePhase3HarnessExportV0(parts) {
  const { control, observation } = parts;
  return Object.freeze({
    schema: "rhizoh.phase3.harness_export.v0",
    atMs: control.atMs ?? observation.atMs ?? new Date().toISOString(),
    firewall: FIREWALL_MANIFEST_V0,
    phase3Control: Object.freeze(control),
    phase3Observation: Object.freeze(observation),
    phase3ExecutionGate: control.phase3ExecutionGate,
    phase3dObservationGate: observation.phase3dObservationGate,
    distinction: "control_and_observation_composed_at_export_boundary_only"
  });
}

/**
 * CI: scan control module source for forbidden observation coupling.
 * @param {string} controlSource
 */
export function verifyControlPathFirewallV0(controlSource) {
  const violations = [];
  for (const token of FORBIDDEN_IN_CONTROL_PATH_V0) {
    if (controlSource.includes(token)) {
      violations.push(token);
    }
  }
  const gateBlock = controlSource.match(
    /phase3ExecutionGate[\s\S]{0,400}/
  )?.[0];
  if (gateBlock) {
    for (const key of FORBIDDEN_CONTROL_GATE_INPUTS_V0) {
      if (gateBlock.includes(key)) violations.push(`gate_input:${key}`);
    }
  }
  return Object.freeze({
    ok: violations.length === 0,
    violations: Object.freeze(violations)
  });
}
