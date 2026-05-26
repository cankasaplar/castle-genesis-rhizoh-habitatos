/**
 * Interpretation safety contract v0 — anti-action boundary / governance layer.
 * Narrative informs; it never executes, never self-modifies, never binds decisions.
 * @see docs/ops/INTERPRETATION_SAFETY_CONTRACT_V1.0.md
 */

import { INTERPRETATION_UX_CONTRACT_V1 } from "./interpretationUxContractV1.js";

export const INTERPRETATION_SAFETY_CONTRACT_SCHEMA_V0 = "rhizoh.interpretation_safety_contract.v0";

/** Mühür — non-binding interpretation authority only. */
export const INTERPRETATION_SAFETY_CONTRACT_V0 = Object.freeze({
  schema: INTERPRETATION_SAFETY_CONTRACT_SCHEMA_V0,
  can_inform: true,
  can_suggest: true,
  can_execute: false,
  can_self_modify: false,
  authority_level: "non_binding",
  decision_owner: "human_or_external_ops",
  narrative_role: "derived_interpretation_only",
  not_a_decision_layer: true
});

export const PROHIBITED_SYSTEM_ACTIONS_V0 = Object.freeze([
  "execute_suggested_action_automatically",
  "apply_narrative_to_rollout_tier",
  "apply_narrative_to_gcl_limits",
  "self_modify_gateway_config_from_narrative",
  "self_modify_env_from_confidence",
  "trigger_chaos_or_load_test_from_ops_status",
  "override_human_moderation_from_trust_posture",
  "bind_sla_or_customer_commitment_from_headline_confidence"
]);

/**
 * Explicit anti-action boundaries — "what this system cannot do".
 */
export function buildAntiActionBoundariesV0(validation) {
  const trust = validation?.trustPosture || "narrative_hypothesis_only";
  const overtrust = validation?.confidenceDecomposition?.composite?.overtrustRisk || "unknown";

  return Object.freeze({
    schema: INTERPRETATION_SAFETY_CONTRACT_SCHEMA_V0,
    contract: INTERPRETATION_SAFETY_CONTRACT_V0,
    prohibitions: PROHIBITED_SYSTEM_ACTIONS_V0,
    invariants: Object.freeze([
      "narrative_never_becomes_execution_path",
      "suggested_action_requires_human_or_external_ops",
      "low_confidence_does_not_trigger_self_healing_automation",
      "validation_flags_do_not_auto_remediate"
    ]),
    operatorGuidance: Object.freeze({
      tr: "Bu çıktı bilgilendirme amaçlıdır; otomatik aksiyon veya yapılandırma değişikliği yapmaz.",
      en: "This output is informational only; no automatic action or configuration change."
    }),
    contextualWarnings: Object.freeze([
      overtrust !== "low"
        ? "Headline confidence may exceed trustworthy composite — do not treat as operational go-ahead."
        : null,
      trust === "narrative_hypothesis_only"
        ? "Trust posture is hypothesis-only — verify RAW state before acting."
        : null
    ].filter(Boolean)),
    escalation: Object.freeze({
      decisionOwner: INTERPRETATION_SAFETY_CONTRACT_V0.decision_owner,
      whenToEscalate: "Any production change, tier change, or spend limit change"
    })
  });
}

/**
 * Three-layer state partition — RAW / DERIVED / POLICY (not decision).
 * @param {object} signals
 * @param {object} systemState
 * @param {object} interpretation
 * @param {object} validation
 */
export function partitionStateLayersV0(signals, systemState, interpretation, validation) {
  const loadTest = signals.loadTest;

  const rawState = Object.freeze({
    layer: "raw",
    question: "what_happened",
    authority: "measurement",
    gcl: Object.freeze({
      health: signals.gcl?.health,
      global: signals.gcl?.snapshot?.global ?? signals.gcl?.snapshot
    }),
    rollout: Object.freeze({
      tier: signals.rollout?.tier,
      limit: signals.rollout?.limit,
      activeTurns: signals.rollout?.activeTurns,
      trackedLeases: signals.rollout?.trackedLeases,
      leaseSkew: signals.rollout?.leaseSkew,
      zsetPressure: signals.rollout?.zsetPressure,
      ledgerMode: signals.rollout?.ledgerMode,
      coordinationSim: signals.rollout?.coordinationSim
    }),
    lifecycle: Object.freeze({
      purged: signals.lifecycle?.purged,
      activeTurns: signals.lifecycle?.activeTurns,
      trackedLeases: signals.lifecycle?.trackedLeases
    }),
    loadTest: loadTest?.available
      ? Object.freeze({
          available: true,
          executionMode: loadTest.executionMode,
          dominantFailureMode: loadTest.dominantFailureMode,
          analyzedAt: loadTest.analysis?.analyzedAt
        })
      : Object.freeze({ available: false }),
    coordination: signals.coordination
  });

  const derivedState = Object.freeze({
    layer: "derived",
    question: "what_we_understand",
    authority: "interpretation_non_binding",
    systemState: Object.freeze({
      health: systemState.health,
      pressure: systemState.pressure,
      risk: systemState.risk,
      confidenceHeadline: systemState.confidenceHeadline ?? systemState.confidence,
      confidenceTrustworthy: systemState.confidenceTrustworthy,
      confidenceAdjusted: systemState.confidenceAdjusted,
      drivers: systemState.drivers
    }),
    narrative: Object.freeze({
      headline: interpretation.headline,
      narrativeTr: interpretation.narrativeTr,
      trustPosture: interpretation.trustPosture
    }),
    validation: Object.freeze({
      agreementRatio: validation.confidenceDecomposition?.agreement?.agreementRatio,
      dissenting: validation.confidenceDecomposition?.agreement?.dissenting,
      divergenceScore: validation.divergence?.divergenceScore,
      validated: validation.divergence?.validated,
      uncertaintyTagIds: (validation.uncertainty?.tags || []).map((t) => t.id),
      flagIds: (validation.divergence?.flags || []).map((f) => f.id)
    }),
    notDecision: true
  });

  const policyState = Object.freeze({
    layer: "policy",
    question: "what_system_may_not_do",
    authority: "governance_boundary",
    binding: false,
    safetyContract: INTERPRETATION_SAFETY_CONTRACT_V0,
    suggestedActions: interpretation.suggestedActions,
    prohibitedActions: PROHIBITED_SYSTEM_ACTIONS_V0,
    antiActionBoundaries: buildAntiActionBoundariesV0(validation),
    decisionOwner: INTERPRETATION_SAFETY_CONTRACT_V0.decision_owner,
    isNotExecutablePolicy: true
  });

  return Object.freeze({ raw: rawState, derived: derivedState, policy: policyState });
}

/**
 * Governance metadata — prevents narrative becoming de facto decision layer in ops UX.
 */
export function buildGovernanceMetadataV0(validation) {
  return Object.freeze({
    schema: INTERPRETATION_SAFETY_CONTRACT_SCHEMA_V0,
    narrativeIsNotDecisionLayer: true,
    metaTruthAuthority: false,
    displayOrder: INTERPRETATION_UX_CONTRACT_V1.layerOrder,
    interpretationUxContract: INTERPRETATION_UX_CONTRACT_V1,
    uxContract: Object.freeze({
      tr: "Önce RAW (ne oldu), sonra DERIVED (ne anladık), POLICY yalnızca sınırlar — karar değil.",
      en: "Read RAW first (what happened), then DERIVED (interpretation); POLICY is boundaries only — not a decision."
    }),
    trustPosture: validation.trustPosture,
    doNotUseAs: Object.freeze([
      "automatic_runbook_trigger",
      "single_source_of_truth_for_incidents",
      "approval_substitute"
    ]),
    safeUseAs: Object.freeze([
      "operator_briefing",
      "incident_hypothesis_seed",
      "load_test_sign_off_input"
    ])
  });
}

/**
 * Assert contract invariants (dev/ops sanity).
 */
export function assertInterpretationSafetyContractV0(contract = INTERPRETATION_SAFETY_CONTRACT_V0) {
  if (contract.can_execute !== false) {
    throw new Error("interpretation_safety_contract_violation:can_execute_must_be_false");
  }
  if (contract.can_self_modify !== false) {
    throw new Error("interpretation_safety_contract_violation:can_self_modify_must_be_false");
  }
  if (contract.authority_level !== "non_binding") {
    throw new Error("interpretation_safety_contract_violation:authority_must_be_non_binding");
  }
  return true;
}
