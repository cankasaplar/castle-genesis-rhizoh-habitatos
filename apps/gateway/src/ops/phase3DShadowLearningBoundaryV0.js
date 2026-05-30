/**
 * Phase 3D shadow learning boundary — internal representation without control backflow.
 * Design contract + export validator (no runtime learner).
 * @see docs/ops/PHASE3D_SHADOW_LEARNING_BOUNDARY_V1.0.md
 */
import { FORBIDDEN_CONTROL_GATE_INPUTS_V0 } from "./phase3ControlObservationFirewallV0.js";

export const SHADOW_LEARNING_SCHEMA_V0 = "rhizoh.phase3d.shadow_learning_boundary.v0";

/** Where observation may accumulate state (never wired to executeOrContain). */
export const SHADOW_LEARNING_SURFACE_V0 = Object.freeze({
  TRAJECTORY_RING_BUFFER: "trajectory_ring_buffer",
  ATTRACTOR_HISTOGRAM: "attractor_basin_histogram",
  TRANSITION_COUNTS: "transition_probability_counts",
  PERTURBATION_RANKINGS: "perturbation_sensitivity_rankings",
  THRESHOLD_PROPOSAL_QUEUE: "threshold_proposal_queue_pending_human",
  SHADOW_DIVERGENCE_P95: "shadow_divergence_p95_histogram"
});

/** Channels that must never connect shadow → live control. */
export const FORBIDDEN_BACKFLOW_CHANNEL_V0 = Object.freeze([
  "live_gate_threshold_mutation",
  "executeOrContain_input_from_attractor",
  "phase3dObservationGate_to_phase3ExecutionGate",
  "auto_soften_from_fragility_score",
  "auto_tighten_from_influence_score",
  "runtime_import_phase3d_in_gateway_turn"
]);

/** Only legal control influence path (human-gated, versioned). */
export const LEGAL_CONTROL_UPDATE_CHANNEL_V0 = Object.freeze({
  id: "human_approved_config_schema_bump",
  steps: Object.freeze([
    "shadow_export_review",
    "audit_log_entry",
    "phase3_config_version_tag",
    "control_harness_rerun",
    "deploy"
  ])
});

/** Shadow evolution modes — atlas is default; semi-actuator is gated human proposal path. */
export const SHADOW_EVOLUTION_MODE_V0 = Object.freeze({
  ATLAS_ONLY: "observing_atlas",
  PROPOSAL_SEMI_ACTUATOR: "human_approved_proposal_semi_actuator"
});

export const SHADOW_LEARNING_MANIFEST_V0 = Object.freeze({
  schema: SHADOW_LEARNING_SCHEMA_V0,
  possible: true,
  condition: "writes_shadow_only_never_live_reflex",
  feedsExecution: false,
  defaultEvolutionMode: SHADOW_EVOLUTION_MODE_V0.ATLAS_ONLY,
  allowedEvolutionMode: SHADOW_EVOLUTION_MODE_V0.PROPOSAL_SEMI_ACTUATOR,
  evolutionNote:
    "semi_actuator_is_proposal_queue_plus_human_approve_not_runtime_steering",
  twinRisks: Object.freeze({
    controlBlindness: "over_stabilization_if_shadow_never_reviewed",
    observationBloat: "ineffective_atlas_if_proposals_never_closed"
  }),
  allowedSurfaces: SHADOW_LEARNING_SURFACE_V0,
  forbiddenBackflow: FORBIDDEN_BACKFLOW_CHANNEL_V0,
  legalBridgeToControl: LEGAL_CONTROL_UPDATE_CHANNEL_V0
});

/**
 * Validate observation export respects shadow learning (no control authority).
 * @param {object} observationExport
 */
export function validateShadowLearningExportV0(observationExport) {
  const violations = [];
  if (observationExport?.feedsExecution === true) {
    violations.push("feedsExecution_must_be_false");
  }
  if (observationExport?.role !== "observation_only") {
    violations.push("role_must_be_observation_only");
  }
  const serialized = JSON.stringify(observationExport ?? {});
  for (const key of FORBIDDEN_CONTROL_GATE_INPUTS_V0) {
    if (serialized.includes(`"${key}"`) && observationExport?.phase3ExecutionGate != null) {
      violations.push(`observation_must_not_set_control_gate:${key}`);
    }
  }
  if (observationExport?.phase3ExecutionGate != null) {
    violations.push("observation_export_must_not_contain_phase3ExecutionGate");
  }

  return Object.freeze({
    ok: violations.length === 0,
    violations: Object.freeze(violations),
    manifest: SHADOW_LEARNING_MANIFEST_V0
  });
}

/**
 * Attach shadow learning contract to observation export (harness / offline).
 * @param {object} observationExport
 */
export function attachShadowLearningContractV0(observationExport) {
  const validation = validateShadowLearningExportV0(observationExport);
  return Object.freeze({
    ...observationExport,
    shadowLearning: Object.freeze({
      ...SHADOW_LEARNING_MANIFEST_V0,
      exportValid: validation.ok,
      internalRepresentationAllowed: true,
      controlBackflowAllowed: false
    })
  });
}
