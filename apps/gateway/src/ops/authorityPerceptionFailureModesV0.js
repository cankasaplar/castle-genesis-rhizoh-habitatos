/**
 * Authority Perception Failure Modes M0–M7 — UX / Legal mitigation matrix (engineering SSOT).
 * @see docs/ops/AUTHORITY_PERCEPTION_FAILURE_MODES_V1.0.md
 */

export const AUTHORITY_PERCEPTION_SCHEMA_V0 = "rhizoh.authority_perception_failure_modes.v0";

export const NO_ACTION_CLAIM_MODE_V0 = "NO_ACTION_CLAIM_MODE";

/** Cross-layer rules (frozen). */
export const AUTHORITY_PERCEPTION_RULES_V0 = Object.freeze({
  engineering: "no_output_may_contain_actionable_authority_semantics",
  ux: "no_output_may_be_interpreted_as_instruction",
  legal: "no_output_may_imply_advisory_responsibility_or_intent"
});

export const RHIZOH_PRIMARY_RISK_DOMAIN_V0 =
  "authority_misattribution_under_high_coherence_observational_outputs";

/**
 * M0–M7 failure modes with UX + system mitigations.
 */
export const AUTHORITY_PERCEPTION_FAILURE_MODES_V0 = Object.freeze([
  modeV0("M0", "system_as_decision_maker", {
    failure: "user_perceives_system_tells_what_to_do",
    triggers: ["imperative_dashboard", "coherent_interpretive_output"],
    uxRisk: "implicit_recommendation_nudging",
    legalRisk: "advisory_system_quasi_decision_engine_misclassification",
    uxMitigation: ["passive_framing_observed_divergence_indicates", "label_observational_not_instruction"],
    systemMitigation: [NO_ACTION_CLAIM_MODE_V0, "forbid_imperative_phrases_in_export"]
  }),
  modeV0("M1", "attractor_equals_intent", {
    failure: "attractor_state_read_as_system_goal",
    triggers: ["optimal_basin_naming", "directional_verbs_in_copy"],
    uxRisk: "anthropomorphic_projection",
    legalRisk: "implied_intent_attribution",
    uxMitigation: ["display_attractor_as_cluster_centroid_state", "remove_pulls_prefers_verbs"],
    systemMitigation: ["forbid_intentionality_vocabulary_in_user_facing_export"]
  }),
  modeV0("M2", "proposal_equals_recommendation", {
    failure: "proposal_queue_read_as_recommended_action",
    triggers: ["threshold_proposal_queue_visibility"],
    uxRisk: "suggestion_authority_bias",
    legalRisk: "indirect_advisory_liability",
    uxMitigation: ["tag_non_executable_configuration_hypothesis"],
    systemMitigation: ["feedsExecution_false", "cannot_be_interpreted_as_guidance_true"]
  }),
  modeV0("M3", "telemetry_surveillance", {
    failure: "user_feels_watched_and_judged",
    triggers: ["realtime_trajectory_phase_maps", "second_person_framing"],
    uxRisk: "surveillance_perception",
    legalRisk: "data_misuse_consent_ambiguity",
    uxMitigation: ["aggregated_system_observation_not_user_state", "no_second_person"],
    systemMitigation: ["no_identity_inference_in_exports", "no_personalization_in_phase3d"]
  }),
  modeV0("M4", "coherence_equals_truth", {
    failure: "high_stability_perceived_as_correctness",
    triggers: ["high_stabilityScore_low_divergence"],
    uxRisk: "over_trust_epistemic_overconfidence",
    legalRisk: "implied_correctness_guarantee",
    uxMitigation: ["stability_not_correctness_guarantee_disclaimer"],
    systemMitigation: ["stability_metric_separate_from_truth_semantics_absent"]
  }),
  modeV0("M5", "system_agency_projection", {
    failure: "autonomous_thinking_entity_perception",
    triggers: ["attractor_intelligence_layer", "narrative_exports"],
    uxRisk: "anthropomorphism",
    legalRisk: "autonomous_agent_misrepresentation",
    uxMitigation: ["system_does_not_form_intent_or_goals"],
    systemMitigation: ["no_first_person_runtime_language_in_export"]
  }),
  modeV0("M6", "proposal_hidden_steering", {
    failure: "proposals_assumed_to_control_behavior",
    triggers: ["mode_b_lifecycle_visibility_adjacent_to_execution"],
    uxRisk: "hidden_control_perception",
    legalRisk: "transparency_violation_perception",
    uxMitigation: ["ui_separation_observation_proposal_execution"],
    systemMitigation: ["proposal_no_execution_adjacency_same_ui_context"]
  }),
  modeV0("M7", "completeness_illusion", {
    failure: "user_believes_full_reality_captured",
    triggers: ["dense_phase3d_maps_low_entropy_viz"],
    uxRisk: "epistemic_closure_illusion",
    legalRisk: "over_reliance_risk",
    uxMitigation: ["persistent_partial_observability_disclaimer"],
    systemMitigation: ["unobserved_residual_always_exists_true"]
  })
]);

/** Forbidden in machine exports (intentionality + imperative + agency). */
export const FORBIDDEN_INTENTIONALITY_VOCABULARY_V0 = Object.freeze([
  /\byou should\b/i,
  /\byou must\b/i,
  /\brisk is\b/i,
  /\bsystem wants\b/i,
  /\bsystem prefers\b/i,
  /\bpulls toward\b/i,
  /\bwe recommend\b/i,
  /\bi (?:advise|recommend)\b/i,
  /\bsystem advises\b/i,
  /\brhizoh decided\b/i,
  /\bintent(?:ion)?\b/i,
  /\bgoal state\b/i,
  /\bautonomous(?:ly)?\b/i,
  /\bgo live now\b/i,
  /\bauto[- ]?apply\b/i
]);

export const FORBIDDEN_FIRST_PERSON_V0 = Object.freeze([/\bI\b/, /\bwe\b/i, /\bour\b/i, /\byou\b/i]);

/** UX display hints (engineering export — client may map labels). */
export const AUTHORITY_PERCEPTION_DISPLAY_HINTS_V0 = Object.freeze({
  attractorRegion: "cluster_centroid_state",
  proposalRecord: "non_executable_configuration_hypothesis",
  trajectory: "aggregated_system_observation",
  stabilityNote: "stability_not_correctness_guarantee",
  observabilityNote: "partial_observability_system",
  uiZones: Object.freeze(["OBSERVATION_READ_ONLY", "PROPOSAL_NON_BINDING", "EXECUTION_CONFIG_ONLY"])
});

/**
 * Contract block attached to observation exports.
 */
export const AUTHORITY_PERCEPTION_CONTRACT_V0 = Object.freeze({
  schema: "rhizoh.authority_perception_contract.v0",
  noActionClaimMode: NO_ACTION_CLAIM_MODE_V0,
  cannotBeInterpretedAsInstruction: true,
  cannotBeInterpretedAsGuidance: true,
  unobservedResidualAlwaysExists: true,
  stabilityNotTruthGuarantee: true,
  noIdentityInference: true,
  noPersonalizationInPhase3d: true,
  noFirstPersonLanguage: true,
  noIntentAttribution: true,
  primaryRiskDomain: RHIZOH_PRIMARY_RISK_DOMAIN_V0,
  rules: AUTHORITY_PERCEPTION_RULES_V0,
  displayHints: AUTHORITY_PERCEPTION_DISPLAY_HINTS_V0,
  failureModes: AUTHORITY_PERCEPTION_FAILURE_MODES_V0
});

/**
 * @param {string} jsonText
 */
export function scanAuthorityPerceptionViolationsV0(jsonText) {
  const hits = [];
  for (const re of FORBIDDEN_INTENTIONALITY_VOCABULARY_V0) {
    if (re.test(jsonText)) hits.push({ kind: "intentionality_or_imperative", pattern: re.source });
  }
  for (const re of FORBIDDEN_FIRST_PERSON_V0) {
    if (re.test(jsonText)) hits.push({ kind: "first_or_second_person", pattern: re.source });
  }
  return Object.freeze({ ok: hits.length === 0, hits: Object.freeze(hits) });
}

/**
 * @param {object} observationExport
 */
export function validateAuthorityPerceptionContractV0(observationExport) {
  const violations = [];
  const c = observationExport.authorityPerception ?? observationExport;

  if (observationExport.feedsExecution !== false) violations.push("feedsExecution_must_be_false");
  if (c.noActionClaimMode !== NO_ACTION_CLAIM_MODE_V0) violations.push("missing_NO_ACTION_CLAIM_MODE");
  if (c.unobservedResidualAlwaysExists !== true) violations.push("unobserved_residual_always_exists");
  if (c.stabilityNotTruthGuarantee !== true) violations.push("stability_not_truth_guarantee");
  if (c.cannotBeInterpretedAsGuidance !== true) violations.push("cannot_be_interpreted_as_guidance");

  const pq = observationExport.proposalQueue;
  if (pq) {
    if (pq.cannotBeInterpretedAsGuidance !== true) violations.push("proposal_queue_guidance_flag");
    if (pq.feedsExecution !== false) violations.push("proposal_queue_feedsExecution");
    for (const p of pq.proposals ?? []) {
      if (p.cannotBeInterpretedAsGuidance !== true) {
        violations.push(`proposal_${p.proposalId}_guidance_flag`);
      }
    }
  }

  const phraseScan = scanAuthorityPerceptionViolationsV0(JSON.stringify(observationExport));
  if (!phraseScan.ok) violations.push("forbidden_phrase_in_export");

  return Object.freeze({
    ok: violations.length === 0,
    violations: Object.freeze(violations),
    phraseScan
  });
}

/**
 * @param {object} observationExport
 */
export function attachAuthorityPerceptionContractV0(observationExport) {
  const validation = validateAuthorityPerceptionContractV0({
    ...observationExport,
    authorityPerception: AUTHORITY_PERCEPTION_CONTRACT_V0
  });
  return Object.freeze({
    ...observationExport,
    authorityPerception: AUTHORITY_PERCEPTION_CONTRACT_V0,
    authorityPerceptionValidation: validation
  });
}

function modeV0(id, slug, fields) {
  return Object.freeze({
    id,
    slug,
    ...fields,
    uxMitigation: Object.freeze(fields.uxMitigation),
    systemMitigation: Object.freeze(fields.systemMitigation),
    triggers: Object.freeze(fields.triggers)
  });
}
