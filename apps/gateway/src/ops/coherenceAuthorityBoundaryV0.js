/**
 * Coherence Authority Boundary (CAB) v0 — limits what ECL "coherent" may authorize.
 * ECL: which output is coherent across layers. CAB: coherent ≠ truth / execution / policy.
 * @see docs/ops/COHERENCE_AUTHORITY_BOUNDARY_V1.0.md
 */

import { COHERENCE_VERDICT_V0 } from "./epistemicCoherenceLayerV0.js";
import { INTERPRETATION_SAFETY_CONTRACT_V0 } from "./interpretationSafetyContractV0.js";

export const COHERENCE_AUTHORITY_BOUNDARY_SCHEMA_V0 = "rhizoh.coherence_authority_boundary.v0";

/** What ECL coherence may never become. */
export const COHERENCE_NEGATION_V0 = Object.freeze({
  COHERENT_IS_NOT_EXECUTABLE_TRUTH: "coherent_is_not_executable_truth",
  COHERENT_IS_NOT_POLICY_OVERRIDE: "coherent_is_not_policy_override",
  COHERENT_IS_NOT_REALITY_CLAIM: "coherent_is_not_reality_claim"
});

export const COHERENCE_AUTHORITY_CONTRACT_V0 = Object.freeze({
  schema: COHERENCE_AUTHORITY_BOUNDARY_SCHEMA_V0,
  can_inform: true,
  can_compress_ux: true,
  can_execute: false,
  can_override_policy: false,
  can_claim_reality: false,
  authority_level: "epistemic_binding_non_executable",
  decision_owner: INTERPRETATION_SAFETY_CONTRACT_V0.decision_owner,
  subordinate_to: Object.freeze(["interpretation_safety_contract", "raw_first_policy", "human_or_external_ops"])
});

export const PROHIBITED_COHERENCE_DERIVED_ACTIONS_V0 = Object.freeze([
  "execute_because_ecl_coherent",
  "override_gcl_from_coherence_score",
  "override_rollout_tier_from_coherent_verdict",
  "robotics_actuate_from_coherent_without_sensor_acrl",
  "treat_coherent_as_customer_sla_commitment",
  "treat_coherent_as_ground_truth_over_raw"
]);

export const AUTHORITY_DRIFT_CLASS_V0 = Object.freeze({
  UX_TRUTH_MISREAD: "ux_coherent_implies_truth",
  OPS_SAFETY_MISREAD: "ops_coherent_implies_safe",
  ROBOTICS_ACTUATION_MISREAD: "robotics_coherent_implies_move"
});

/**
 * @param {object} narrativeExport
 */
export function detectCoherenceAuthorityDriftV0(narrativeExport) {
  const ecl = narrativeExport?.epistemicCoherence;
  const verdict = ecl?.systemCoherence?.verdict;
  const score = ecl?.systemCoherence?.score ?? 0;
  const roboticsBlock = narrativeExport?.appliedSystemsLayer?.roboticsGrounding?.blockActuation === true;
  const canExecute = narrativeExport?.interpretationSafetyContract?.can_execute === true;

  /** @type {object[]} */
  const driftRisks = [];

  if (verdict === COHERENCE_VERDICT_V0.COHERENT || score >= 0.85) {
    driftRisks.push(
      Object.freeze({
        class: AUTHORITY_DRIFT_CLASS_V0.UX_TRUTH_MISREAD,
        severity: "medium",
        trigger: `ecl_verdict_${verdict}_score_${score}`,
        mitigation: COHERENCE_NEGATION_V0.COHERENT_IS_NOT_REALITY_CLAIM
      })
    );
    driftRisks.push(
      Object.freeze({
        class: AUTHORITY_DRIFT_CLASS_V0.OPS_SAFETY_MISREAD,
        severity: "medium",
        trigger: "high_coherence_authority_signal",
        mitigation: COHERENCE_NEGATION_V0.COHERENT_IS_NOT_EXECUTABLE_TRUTH
      })
    );
  }

  if (
    (verdict === COHERENCE_VERDICT_V0.COHERENT || verdict === COHERENCE_VERDICT_V0.FRAGMENTED) &&
    !roboticsBlock
  ) {
    driftRisks.push(
      Object.freeze({
        class: AUTHORITY_DRIFT_CLASS_V0.ROBOTICS_ACTUATION_MISREAD,
        severity: "high",
        trigger: "coherent_or_fragmented_with_robotics_path_open",
        mitigation: "acrl_sensor_verified_still_required"
      })
    );
  }

  if (canExecute) {
    driftRisks.push(
      Object.freeze({
        class: AUTHORITY_DRIFT_CLASS_V0.OPS_SAFETY_MISREAD,
        severity: "critical",
        trigger: "interpretation_can_execute_true_violates_cab",
        mitigation: COHERENCE_NEGATION_V0.COHERENT_IS_NOT_EXECUTABLE_TRUTH
      })
    );
  }

  return Object.freeze({
    monitored: driftRisks.length > 0,
    driftRisks: Object.freeze(driftRisks),
    note: "coherence_is_high_level_signal_not_authority_upgrade"
  });
}

/**
 * Hard negations + ECL binding validation.
 * @param {object} narrativeExport
 */
export function validateEclAuthorityBindingV0(narrativeExport) {
  const ecl = narrativeExport?.epistemicCoherence;
  const ux = ecl?.uxCompression;
  const safety = narrativeExport?.interpretationSafetyContract;
  const acrl = narrativeExport?.actionContextResolution;

  const negations = Object.freeze({
    [COHERENCE_NEGATION_V0.COHERENT_IS_NOT_EXECUTABLE_TRUTH]: true,
    [COHERENCE_NEGATION_V0.COHERENT_IS_NOT_POLICY_OVERRIDE]: true,
    [COHERENCE_NEGATION_V0.COHERENT_IS_NOT_REALITY_CLAIM]: true
  });

  const violations = [];

  if (safety?.can_execute === true) {
    violations.push("safety_contract_can_execute_must_remain_false");
  }
  if (ux?.operatorDecision === "auto_execute") {
    violations.push("ecl_ux_must_never_emit_auto_execute");
  }
  if (ecl?.nonExecutable !== true) {
    violations.push("ecl_layer_must_remain_non_executable");
  }

  const coherentImpliesActuation =
    ecl?.systemCoherence?.verdict === COHERENCE_VERDICT_V0.COHERENT &&
    acrl?.roboticsActuationCorrectness?.actuationEligible === true;
  if (coherentImpliesActuation && acrl?.roboticsActuationCorrectness?.contextLayer !== "acrl") {
    violations.push("coherent_must_not_short_circuit_acrl");
  }

  return Object.freeze({
    valid: violations.length === 0,
    negations,
    violations: Object.freeze(violations),
    eclVerdict: ecl?.systemCoherence?.verdict,
    eclDoesNotUpgradeExecution: safety?.can_execute === false,
    eclDoesNotOverridePolicy: true,
    eclDoesNotClaimReality: true
  });
}

/**
 * Mandatory UX / ops disclaimers when ECL surface is shown.
 * @param {object} narrativeExport
 */
export function buildCoherenceAuthorityDisclaimersV0(narrativeExport) {
  const verdict = narrativeExport?.epistemicCoherence?.systemCoherence?.verdict;

  return Object.freeze({
    schema: "rhizoh.coherence_authority_disclaimers.v0",
    mandatoryBanner: Object.freeze({
      tr: "ECL tutarlılık sinyali — gerçeklik iddiası, politika veya otomatik icra değildir.",
      en: "ECL coherence signal — not a reality claim, policy override, or auto-execution."
    }),
    perVerdict: Object.freeze({
      coherent: Object.freeze({
        tr: "Coherent = katmanlar uyumlu; güvenli veya doğru anlamına gelmez.",
        en: "Coherent = layers aligned; does not mean safe or true."
      }),
      fragmented: Object.freeze({
        tr: "Fragmented = parçalı doğruluk; RAW + GCL ayrı doğrulanır.",
        en: "Fragmented = partial alignment; verify RAW + GCL separately."
      }),
      contradictory: Object.freeze({
        tr: "Contradictory = insan incelemesi; icra yok.",
        en: "Contradictory = human review; no execution."
      })
    }),
    verdictSpecific: verdict
      ? narrativeExport?.epistemicCoherence?.uxCompression?.headline
      : null,
    robotics: Object.freeze({
      tr: "Coherent olsa bile robotik hareket yalnız ACRL sensor_verified + RAW ile.",
      en: "Even if coherent, robotics actuation only via ACRL sensor_verified + RAW."
    }),
    ops: Object.freeze({
      tr: "Coherent ≠ rollout/GCL değişikliği onayı.",
      en: "Coherent ≠ approval to change rollout/GCL."
    })
  });
}

/**
 * @param {object} narrativeExport
 */
export function buildCoherenceAuthorityBoundaryV0(narrativeExport) {
  const authorityDrift = detectCoherenceAuthorityDriftV0(narrativeExport);
  const eclBinding = validateEclAuthorityBindingV0(narrativeExport);
  const disclaimers = buildCoherenceAuthorityDisclaimersV0(narrativeExport);

  return Object.freeze({
    schema: COHERENCE_AUTHORITY_BOUNDARY_SCHEMA_V0,
    generatedAt: new Date().toISOString(),
    role: "limits_ecl_coherent_authority",
    question: "Does ECL saying coherent mean this is true / executable / policy?",
    answer: "no — coherence is epistemic binding only",
    contract: COHERENCE_AUTHORITY_CONTRACT_V0,
    negations: eclBinding.negations,
    prohibitions: PROHIBITED_COHERENCE_DERIVED_ACTIONS_V0,
    authorityDrift,
    eclAuthorityBinding: eclBinding,
    disclaimers,
    stackPosition: Object.freeze({
      below: "human_or_external_ops",
      above: "epistemicCoherence",
      peers: Object.freeze(["interpretationSafetyContract", "actionContextResolution"])
    }),
    invariants: Object.freeze([
      "coherent_verdict_never_sets_can_execute_true",
      "coherent_verdict_never_overrides_gcl_or_rollout",
      "coherent_verdict_never_replaces_raw_reality",
      "fragmented_or_contradictory_never_implies_unsafe_inverse"
    ]),
    nonExecutable: true,
    nonBinding: true
  });
}
